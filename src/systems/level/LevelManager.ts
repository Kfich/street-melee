import Phaser from 'phaser';
import { Enemy, EnemyType } from '../../entities/enemies/Enemy';
import { Weapon, WeaponType } from '../../entities/weapons/Weapon';
import { Item, ItemType } from '../../entities/items/Item';
import { Boss, BossType } from '../../entities/bosses/Boss';

export interface SpawnPoint {
  x: number;
  y: number;
  type: 'enemy' | 'weapon' | 'item' | 'boss';
  enemyType?: EnemyType;
  weaponType?: WeaponType;
  itemType?: ItemType;
  bossType?: string; // Boss spawning is now handled by BossSceneManager, this is kept for compatibility
  delay?: number; // Spawn delay in ms
  active: boolean;
  wave?: number; // Wave number for wave-based spawning
}

export interface Wave {
  waveNumber: number;
  enemies: Array<{ type: EnemyType; x: number; y: number; delay?: number }>;
  triggerX?: number; // Trigger wave when player reaches this X position
  triggerTime?: number; // Or trigger after this time (ms)
}

export interface Checkpoint {
  x: number;
  y: number;
  id: string;
  activated: boolean;
}

export interface LevelData {
  id: string;
  name: string;
  width: number;
  height: number;
  spawnPoints: SpawnPoint[];
  waves: Wave[];
  checkpoints: Checkpoint[];
  backgroundLayers: number; // Number of parallax layers
  scrollSpeed: number;
  cameraBounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };
  endTriggerX?: number; // Optional: X position that triggers level completion
  requiresAllWaves?: boolean; // If true, all waves must be complete AND all enemies defeated
}

/**
 * Manages level spawning, scrolling, and progression
 */
export class LevelManager {
  private scene: Phaser.Scene;
  private currentLevel: number = 1;
  private levelData: LevelData;
  private backgroundLayers: Phaser.GameObjects.TileSprite[] = [];
  private scrollOffset: number = 0;
  private spawnTimers: Map<SpawnPoint, Phaser.Time.TimerEvent> = new Map();
  private activeWaves: Set<number> = new Set();
  private currentWave: number = 0;
  private checkpoints: Map<string, Checkpoint> = new Map();
  private levelStartTime: number = 0;
  private waveEnemies: Map<number, Set<string>> = new Map(); // Track enemies per wave by their sprite ID
  private completedWaves: Set<number> = new Set();
  private spawnedEnemies: Set<string> = new Set(); // Track all spawned enemy IDs
  private totalEnemiesSpawnedCount: number = 0; // Monotonically increasing spawn counter
  private triggeredBossPoints: Set<SpawnPoint> = new Set(); // Boss spawn points that have fired
  private levelEndEmitted: boolean = false; // Prevent X-trigger from firing every frame

  constructor(scene: Phaser.Scene, levelData: LevelData) {
    this.scene = scene;
    this.levelData = levelData;
    this.levelStartTime = scene.time.now;
    this.createBackground();
    this.setupCamera();
    this.initializeCheckpoints();
    this.initializeSpawns();
  }

  /**
   * Create scrolling background layers with enhanced parallax
   */
  private createBackground() {
    const { height } = this.scene.cameras.main;
    
    // Create multiple parallax layers with improved depth perception
    for (let i = 0; i < this.levelData.backgroundLayers; i++) {
      // Determine parallax speed for each layer (further = slower)
      // Layer 0 (furthest): 0.2x speed
      // Layer 1 (middle): 0.5x speed
      // Layer 2 (closest): 0.8x speed
      const parallaxSpeed = 0.2 + (i * 0.3);
      const depth = -100 - (i * 10); // Deeper layers have more negative depth
      
      const layer = this.scene.add.tileSprite(
        0,
        0,
        this.levelData.width * 2, // Make wider for seamless tiling
        height,
        'background'
      );
      
      // Create placeholder background if it doesn't exist
      if (!this.scene.textures.exists('background')) {
        const graphics = this.scene.add.graphics();
        const color = 0x222222 + (i * 0x111111); // Different shades for each layer
        graphics.fillStyle(color);
        graphics.fillRect(0, 0, this.levelData.width, height);
        graphics.generateTexture('background', this.levelData.width, height);
        graphics.destroy();
      }
      
      layer.setOrigin(0, 0);
      layer.setDepth(depth);
      layer.setScrollFactor(parallaxSpeed, 1); // Enhanced parallax effect
      layer.setTint(0xffffff - (i * 0x111111)); // Slightly darker for depth
      
      this.backgroundLayers.push(layer);
    }
  }

  /**
   * Initialize spawn points
   */
  private initializeSpawns() {
    this.levelData.spawnPoints.forEach(spawnPoint => {
      // Boss spawn points are triggered by player proximity (in checkBossSpawnTriggers)
      if (spawnPoint.type === 'boss') return;

      if (spawnPoint.delay && spawnPoint.delay > 0) {
        // Delayed spawn
        const timer = this.scene.time.delayedCall(spawnPoint.delay, () => {
          this.spawnEntity(spawnPoint);
          this.spawnTimers.delete(spawnPoint);
        });
        this.spawnTimers.set(spawnPoint, timer);
      } else {
        // Immediate spawn
        this.spawnEntity(spawnPoint);
      }
    });
  }

  /**
   * Trigger boss spawn points when the player moves within range of the boss X position.
   * This prevents the boss health bar from appearing at level start.
   */
  private checkBossSpawnTriggers(playerX: number) {
    this.levelData.spawnPoints.forEach(spawnPoint => {
      if (spawnPoint.type !== 'boss') return;
      if (!spawnPoint.active) return; // Skip sequential bosses not yet activated
      if (this.triggeredBossPoints.has(spawnPoint)) return;

      // Spawn when player is within 400px of the boss X position
      if (playerX >= spawnPoint.x - 400) {
        this.triggeredBossPoints.add(spawnPoint);
        if (spawnPoint.delay && spawnPoint.delay > 0) {
          this.scene.time.delayedCall(spawnPoint.delay, () => this.spawnEntity(spawnPoint));
        } else {
          this.spawnEntity(spawnPoint);
        }
      }
    });
  }

  /**
   * Activate and immediately spawn the next inactive boss in the level.
   * Returns true if a boss was found and spawned, false if no more bosses remain.
   * Used for sequential boss fights (e.g. Level 3: Midnight → Tony).
   */
  activateNextBoss(): boolean {
    const nextBoss = this.levelData.spawnPoints.find(
      sp => sp.type === 'boss' && !sp.active
    );
    if (!nextBoss) return false;

    nextBoss.active = true;
    this.triggeredBossPoints.add(nextBoss);

    if (nextBoss.delay && nextBoss.delay > 0) {
      this.scene.time.delayedCall(nextBoss.delay, () => this.spawnEntity(nextBoss));
    } else {
      this.spawnEntity(nextBoss);
    }
    return true;
  }

  /**
   * Spawn an entity from a spawn point
   */
  private spawnEntity(spawnPoint: SpawnPoint) {
    if (!spawnPoint.active) return;

    switch (spawnPoint.type) {
      case 'enemy':
        if (spawnPoint.enemyType) {
          // Use object pool if available, otherwise create new
          const enemyPool = (this.scene as any).enemyPool;
          const enemy = enemyPool 
            ? enemyPool.acquire(spawnPoint.x, spawnPoint.y, spawnPoint.enemyType)
            : new Enemy(this.scene, spawnPoint.x, spawnPoint.y, spawnPoint.enemyType);
          const enemyId = `enemy_${spawnPoint.x}_${spawnPoint.y}_${Date.now()}_${Math.random()}`;
          enemy.sprite.setData('enemyId', enemyId);
          enemy.sprite.setData('waveNumber', spawnPoint.wave || 0);
          
          this.spawnedEnemies.add(enemyId);
          this.totalEnemiesSpawnedCount++;

          // If spawned from a wave spawn point, track it
          if (spawnPoint.wave !== undefined && spawnPoint.wave > 0) {
            const waveEnemySet = this.waveEnemies.get(spawnPoint.wave);
            if (waveEnemySet) {
              waveEnemySet.add(enemyId);
            }
          }
          
          this.scene.events.emit('enemySpawned', enemy);
        }
        break;
      case 'weapon':
        if (spawnPoint.weaponType) {
          // Use WeaponManager if available, otherwise create directly
          const weaponManager = (this.scene as any).weaponManager;
          if (weaponManager) {
            weaponManager.spawnWeapon(spawnPoint.x, spawnPoint.y, spawnPoint.weaponType);
          } else {
            const weapon = new Weapon(
              this.scene,
              spawnPoint.x,
              spawnPoint.y,
              spawnPoint.weaponType
            );
            this.scene.events.emit('weaponSpawned', weapon);
          }
        }
        break;
      case 'item':
        if (spawnPoint.itemType) {
          // Use ItemManager if available, otherwise create directly
          const itemManager = (this.scene as any).itemManager;
          if (itemManager) {
            itemManager.spawnItem(spawnPoint.x, spawnPoint.y, spawnPoint.itemType);
          } else {
            const item = new Item(
              this.scene,
              spawnPoint.x,
              spawnPoint.y,
              spawnPoint.itemType
            );
            this.scene.events.emit('itemSpawned', item);
          }
        }
        break;
      case 'boss':
        if (spawnPoint.bossType) {
          const boss = new Boss(this.scene, spawnPoint.x, spawnPoint.y, spawnPoint.bossType as BossType);
          this.scene.events.emit('bossSpawned', boss);
          console.log(`[LevelManager] Spawned boss '${spawnPoint.bossType}' at (${spawnPoint.x}, ${spawnPoint.y})`);
        }
        break;
    }
  }

  /**
   * Setup camera boundaries
   */
  private setupCamera() {
    const camera = this.scene.cameras.main;
    camera.setBounds(
      this.levelData.cameraBounds.minX,
      this.levelData.cameraBounds.minY,
      this.levelData.cameraBounds.maxX - this.levelData.cameraBounds.minX,
      this.levelData.cameraBounds.maxY - this.levelData.cameraBounds.minY
    );
  }

  /**
   * Initialize checkpoints
   */
  private initializeCheckpoints() {
    this.levelData.checkpoints.forEach(checkpoint => {
      this.checkpoints.set(checkpoint.id, { ...checkpoint });
    });
  }

  /**
   * Activate a checkpoint
   */
  activateCheckpoint(checkpointId: string): boolean {
    const checkpoint = this.checkpoints.get(checkpointId);
    if (checkpoint && !checkpoint.activated) {
      checkpoint.activated = true;
      this.scene.events.emit('checkpointActivated', checkpoint);
      return true;
    }
    return false;
  }

  /**
   * Get checkpoint by position (for auto-activation)
   */
  getCheckpointAt(x: number, _y: number, range: number = 100): Checkpoint | null {
    for (const checkpoint of this.checkpoints.values()) {
      // Only check X distance (horizontal range) since Y might vary slightly
      const xDistance = Math.abs(x - checkpoint.x);
      if (xDistance <= range && !checkpoint.activated) {
        return checkpoint;
      }
    }
    return null;
  }

  /**
   * Update level (scrolling, spawns, waves, etc.)
   */
  update(cameraX: number, playerX?: number) {
    // Update background scrolling with improved parallax
    this.scrollOffset += this.levelData.scrollSpeed;
    
    // Enhanced parallax scrolling with different speeds per layer
    this.backgroundLayers.forEach((layer, index) => {
      // Parallax effect: closer layers scroll faster
      // Layer 0 (furthest): 0.3x speed
      // Layer 1 (middle): 0.6x speed  
      // Layer 2 (closest): 1.0x speed
      const parallaxSpeed = 0.3 + (index * 0.35);
      const scrollAmount = cameraX * parallaxSpeed;
      layer.tilePositionX = scrollAmount;
    });

    // Check for wave triggers
    if (playerX !== undefined) {
      this.checkWaveTriggers(playerX);
      this.checkBossSpawnTriggers(playerX);

      // Check for level end trigger — emit only once per level
      if (this.levelData.endTriggerX && playerX >= this.levelData.endTriggerX && !this.levelEndEmitted) {
        this.levelEndEmitted = true;
        this.scene.events.emit('levelEndReached');
      }
    }

    // Check for checkpoint activation
    if (playerX !== undefined) {
      const checkpoint = this.getCheckpointAt(playerX, 400); // Assuming ground level around 400
      if (checkpoint) {
        this.activateCheckpoint(checkpoint.id);
      }
    }
  }

  /**
   * Check and trigger waves based on position or time
   */
  private checkWaveTriggers(playerX: number) {
    const currentTime = this.scene.time.now - this.levelStartTime;

    this.levelData.waves.forEach(wave => {
      if (this.activeWaves.has(wave.waveNumber)) return;

      let shouldTrigger = false;

      // Position-based trigger
      if (wave.triggerX !== undefined && playerX >= wave.triggerX) {
        shouldTrigger = true;
      }

      // Time-based trigger
      if (wave.triggerTime !== undefined && currentTime >= wave.triggerTime) {
        shouldTrigger = true;
      }

      if (shouldTrigger) {
        this.triggerWave(wave);
      }
    });
  }

  /**
   * Trigger a wave of enemies
   */
  private triggerWave(wave: Wave) {
    this.activeWaves.add(wave.waveNumber);
    this.currentWave = wave.waveNumber;
    this.waveEnemies.set(wave.waveNumber, new Set());
    this.scene.events.emit('waveStarted', wave);

    wave.enemies.forEach((enemy, index) => {
      const delay = enemy.delay || (index * 200); // Stagger spawns by default
      
      this.scene.time.delayedCall(delay, () => {
        // Use object pool if available, otherwise create new
        const enemyPool = (this.scene as any).enemyPool;
        const enemyEntity = enemyPool 
          ? enemyPool.acquire(enemy.x, enemy.y, enemy.type)
          : new Enemy(this.scene, enemy.x, enemy.y, enemy.type);
        const enemyId = `${enemyEntity.sprite.name || 'enemy'}_${enemyEntity.sprite.x}_${enemyEntity.sprite.y}_${Date.now()}`;
        enemyEntity.sprite.setData('enemyId', enemyId);
        enemyEntity.sprite.setData('waveNumber', wave.waveNumber);
        
        this.spawnedEnemies.add(enemyId);
        this.totalEnemiesSpawnedCount++;
        const waveEnemySet = this.waveEnemies.get(wave.waveNumber);
        if (waveEnemySet) {
          waveEnemySet.add(enemyId);
        }
        
        this.scene.events.emit('enemySpawned', enemyEntity);
      });
    });
  }

  /**
   * Get level width
   */
  getLevelWidth(): number {
    return this.levelData.width;
  }

  /**
   * Get level height
   */
  getLevelHeight(): number {
    return this.levelData.height;
  }

  /**
   * Get current level number
   */
  getCurrentLevel(): number {
    return this.currentLevel;
  }

  /**
   * Get current level data
   */
  getLevelData(): LevelData {
    return this.levelData;
  }

  /**
   * Get current wave number
   */
  getCurrentWave(): number {
    return this.currentWave;
  }

  /**
   * Notify that an enemy was defeated
   */
  onEnemyDefeated(enemyId: string, waveNumber?: number): void {
    this.spawnedEnemies.delete(enemyId);
    
    if (waveNumber !== undefined) {
      const waveEnemySet = this.waveEnemies.get(waveNumber);
      if (waveEnemySet) {
        waveEnemySet.delete(enemyId);
        
        // Check if wave is complete (all enemies in wave defeated)
        if (waveEnemySet.size === 0 && !this.completedWaves.has(waveNumber)) {
          this.completedWaves.add(waveNumber);
          this.scene.events.emit('waveCompleted', waveNumber);
        }
      }
    }
  }

  /**
   * Check if all waves are complete
   */
  areAllWavesComplete(): boolean {
    if (this.levelData.waves.length === 0) {
      return true; // No waves means level is always "complete"
    }
    
    // Check if all waves have been triggered and completed
    const allWavesTriggered = this.activeWaves.size === this.levelData.waves.length;
    const allWavesCompleted = this.completedWaves.size === this.levelData.waves.length;
    
    return allWavesTriggered && allWavesCompleted;
  }

  /**
   * Check if level is complete
   */
  isLevelComplete(allEnemiesDefeated: boolean): boolean {
    // If level requires all waves, check both conditions
    if (this.levelData.requiresAllWaves !== false) {
      return this.areAllWavesComplete() && allEnemiesDefeated;
    }
    
    // Otherwise, just check if all enemies are defeated
    return allEnemiesDefeated;
  }

  /**
   * Get remaining enemies count (alive + in death-sequence)
   */
  getRemainingEnemiesCount(): number {
    return this.spawnedEnemies.size;
  }

  /**
   * Get total enemies spawned since level start (monotonically increasing).
   * Used by GameScene to know whether spawning has begun before testing for
   * level completion.
   */
  getTotalEnemiesSpawned(): number {
    return this.totalEnemiesSpawnedCount;
  }

  /**
   * Get active checkpoint (last activated)
   */
  getActiveCheckpoint(): Checkpoint | null {
    let lastCheckpoint: Checkpoint | null = null;
    let maxX = -1;

    for (const checkpoint of this.checkpoints.values()) {
      if (checkpoint.activated && checkpoint.x > maxX) {
        maxX = checkpoint.x;
        lastCheckpoint = checkpoint;
      }
    }

    return lastCheckpoint;
  }

  /**
   * Progress to next level
   */
  nextLevel(newLevelData: LevelData) {
    this.currentLevel++;
    this.levelData = newLevelData;
    this.levelStartTime = this.scene.time.now;
    this.activeWaves.clear();
    this.completedWaves.clear();
    this.currentWave = 0;
    this.checkpoints.clear();
    this.waveEnemies.clear();
    this.spawnedEnemies.clear();
    this.triggeredBossPoints.clear();
    this.levelEndEmitted = false;
    this.scrollOffset = 0;
    
    // Clean up old background
    this.backgroundLayers.forEach(layer => layer.destroy());
    this.backgroundLayers = [];
    
    // Clean up spawn timers
    this.spawnTimers.forEach(timer => timer.destroy());
    this.spawnTimers.clear();
    
    // Setup new level
    this.createBackground();
    this.setupCamera();
    this.initializeCheckpoints();
    this.initializeSpawns();
    
    this.scene.events.emit('levelChanged', {
      levelNumber: this.currentLevel,
      levelId: newLevelData.id,
      levelName: newLevelData.name
    });
  }

  /**
   * Get level ID
   */
  getLevelId(): string {
    return this.levelData.id;
  }

  /**
   * Get level name
   */
  getLevelName(): string {
    return this.levelData.name;
  }

  /**
   * Clean up
   */
  destroy() {
    this.backgroundLayers.forEach(layer => layer.destroy());
    this.backgroundLayers = [];
    this.spawnTimers.forEach(timer => timer.destroy());
    this.spawnTimers.clear();
    this.activeWaves.clear();
    this.completedWaves.clear();
    this.waveEnemies.clear();
    this.spawnedEnemies.clear();
    this.triggeredBossPoints.clear();
    this.levelEndEmitted = false;
    this.checkpoints.clear();
  }
}

/**
 * Predefined level configurations
 */
export const LEVEL_CONFIGS: LevelData[] = [
  {
    id: 'level1',
    name: 'City Streets',
    width: 3000,
    height: 576,
    backgroundLayers: 3,
    scrollSpeed: 0.5,
    cameraBounds: {
      minX: 0,
      maxX: 3000,
      minY: 0,
      maxY: 576
    },
    spawnPoints: [
      // Initial enemies (spawn at ground level - y: 476 for height 576)
      { x: 400, y: 476, type: 'enemy', enemyType: 'basic', active: true, wave: 0 },
      { x: 600, y: 476, type: 'enemy', enemyType: 'galsia', active: true, wave: 0 },
      
      // Weapons (slightly above ground for visibility)
      { x: 500, y: 450, type: 'weapon', weaponType: 'pipe', active: true },
      { x: 1000, y: 450, type: 'weapon', weaponType: 'bat', active: true },
      
      // Items (floating above ground)
      { x: 300, y: 420, type: 'item', itemType: 'apple', active: true },
      { x: 700, y: 420, type: 'item', itemType: 'moneyBag', active: true },
      
      // Boss spawn at the end (after all waves)
      { x: 2800, y: 476, type: 'boss', bossType: 'blizz', active: true, delay: 0 }
    ],
    waves: [
      {
        waveNumber: 1,
        triggerX: 800,
        enemies: [
          { type: 'basic', x: 1000, y: 476 },
          { type: 'galsia', x: 1200, y: 476 },
          { type: 'basic', x: 1400, y: 476 }
        ]
      },
      {
        waveNumber: 2,
        triggerX: 1500,
        enemies: [
          { type: 'donovan', x: 1700, y: 476 },
          { type: 'galsia', x: 1900, y: 476 },
          { type: 'basic', x: 2100, y: 476 },
          { type: 'donovan', x: 2300, y: 476 }
        ]
      },
      {
        waveNumber: 3,
        triggerX: 2500,
        enemies: [
          { type: 'donovan', x: 2600, y: 476, delay: 0 },
          { type: 'galsia', x: 2700, y: 476, delay: 300 },
          { type: 'donovan', x: 2800, y: 476, delay: 600 },
          { type: 'basic', x: 2900, y: 476, delay: 900 }
        ]
      }
    ],
    checkpoints: [
      { x: 1000, y: 476, id: 'checkpoint1', activated: false },
      { x: 2000, y: 476, id: 'checkpoint2', activated: false },
      { x: 2800, y: 476, id: 'checkpoint3', activated: false }
    ],
    endTriggerX: 2950, // Level completes when player reaches near the end
    requiresAllWaves: true // All waves must be complete AND all enemies defeated
  },
  {
    id: 'level2',
    name: 'Industrial District',
    width: 4000,
    height: 576,
    backgroundLayers: 3,
    scrollSpeed: 0.6,
    cameraBounds: {
      minX: 0,
      maxX: 4000,
      minY: 0,
      maxY: 576
    },
    spawnPoints: [
      { x: 500, y: 476, type: 'enemy', enemyType: 'donovan', active: true, wave: 0 },
      { x: 700, y: 476, type: 'enemy', enemyType: 'galsia', active: true, wave: 0 },
      { x: 900, y: 450, type: 'weapon', weaponType: 'bat', active: true },
      // Benny — boss fight at end of level 2
      { x: 3800, y: 476, type: 'boss', bossType: 'benny', active: true, delay: 0 }
    ],
    waves: [
      {
        waveNumber: 1,
        triggerX: 1200,
        enemies: [
          { type: 'donovan', x: 1400, y: 476 },
          { type: 'donovan', x: 1600, y: 476 },
          { type: 'galsia', x: 1800, y: 476 }
        ]
      },
      {
        waveNumber: 2,
        triggerX: 2500,
        enemies: [
          { type: 'donovan', x: 2700, y: 476 },
          { type: 'galsia', x: 2900, y: 476 },
          { type: 'donovan', x: 3100, y: 476 },
          { type: 'galsia', x: 3300, y: 476 }
        ]
      },
      {
        waveNumber: 3,
        triggerX: 3500,
        enemies: [
          { type: 'donovan', x: 3600, y: 476, delay: 0 },
          { type: 'galsia',  x: 3700, y: 476, delay: 200 },
          { type: 'donovan', x: 3800, y: 476, delay: 400 },
          { type: 'galsia',  x: 3900, y: 476, delay: 600 }
        ]
      }
    ],
    checkpoints: [
      { x: 1500, y: 476, id: 'checkpoint1', activated: false },
      { x: 3000, y: 476, id: 'checkpoint2', activated: false },
      { x: 3800, y: 476, id: 'checkpoint3', activated: false }
    ],
    endTriggerX: 3950,
    requiresAllWaves: true
  },
  {
    id: 'level3',
    name: 'The Finale',
    width: 5000,
    height: 576,
    backgroundLayers: 3,
    scrollSpeed: 0.7,
    cameraBounds: { minX: 0, maxX: 5000, minY: 0, maxY: 576 },
    spawnPoints: [
      { x: 400, y: 476, type: 'enemy', enemyType: 'donovan', active: true, wave: 0 },
      { x: 650, y: 476, type: 'enemy', enemyType: 'galsia', active: true, wave: 0 },
      { x: 850, y: 476, type: 'enemy', enemyType: 'donovan', active: true, wave: 0 },
      // Weapons scattered for the tough final gauntlet
      { x: 600,  y: 450, type: 'weapon', weaponType: 'pipe', active: true },
      { x: 1500, y: 450, type: 'weapon', weaponType: 'bat',  active: true },
      { x: 3000, y: 450, type: 'weapon', weaponType: 'pipe', active: true },
      // Items to let players survive the double-boss stretch
      { x: 1200, y: 420, type: 'item', itemType: 'chicken', active: true },
      { x: 3500, y: 420, type: 'item', itemType: 'chicken', active: true },
      { x: 4200, y: 420, type: 'item', itemType: 'apple',   active: true },
      // Midnight — first boss
      { x: 4200, y: 476, type: 'boss', bossType: 'midnight', active: true, delay: 0 },
      // Tony — second boss, spawns after Midnight is defeated (handled via bossDefeated event)
      { x: 4700, y: 476, type: 'boss', bossType: 'tony', active: false, delay: 4000 }
    ],
    waves: [
      {
        waveNumber: 1,
        triggerX: 1000,
        enemies: [
          { type: 'donovan', x: 1200, y: 476 },
          { type: 'galsia',  x: 1400, y: 476 },
          { type: 'galsia',  x: 1600, y: 476 },
          { type: 'donovan', x: 1800, y: 476 }
        ]
      },
      {
        waveNumber: 2,
        triggerX: 2200,
        enemies: [
          { type: 'donovan', x: 2400, y: 476, delay: 0   },
          { type: 'donovan', x: 2600, y: 476, delay: 300 },
          { type: 'galsia',  x: 2800, y: 476, delay: 100 },
          { type: 'galsia',  x: 3000, y: 476, delay: 400 },
          { type: 'donovan', x: 3200, y: 476, delay: 600 }
        ]
      },
      {
        waveNumber: 3,
        triggerX: 3500,
        enemies: [
          { type: 'donovan', x: 3700, y: 476, delay: 0   },
          { type: 'galsia',  x: 3750, y: 490, delay: 100 },
          { type: 'donovan', x: 3850, y: 476, delay: 200 },
          { type: 'galsia',  x: 3950, y: 490, delay: 300 },
          { type: 'basic',   x: 4000, y: 476, delay: 500 }
        ]
      }
    ],
    checkpoints: [
      { x: 1500, y: 476, id: 'checkpoint1', activated: false },
      { x: 3000, y: 476, id: 'checkpoint2', activated: false },
      { x: 4100, y: 476, id: 'checkpoint3', activated: false }
    ],
    endTriggerX: 4900,
    requiresAllWaves: true
  }
];

