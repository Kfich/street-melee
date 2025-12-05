import Phaser from 'phaser';
import { Enemy, EnemyType } from '../../entities/enemies/Enemy';
import { Weapon, WeaponType } from '../../entities/weapons/Weapon';
import { Item, ItemType } from '../../entities/items/Item';

export interface SpawnPoint {
  x: number;
  y: number;
  type: 'enemy' | 'weapon' | 'item';
  enemyType?: EnemyType;
  weaponType?: WeaponType;
  itemType?: ItemType;
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
   * Create scrolling background layers
   */
  private createBackground() {
    const { height } = this.scene.cameras.main;
    
    // Create multiple parallax layers
    for (let i = 0; i < this.levelData.backgroundLayers; i++) {
      const layer = this.scene.add.tileSprite(
        0,
        0,
        this.levelData.width,
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
      layer.setDepth(-10 + i); // Different depths for parallax
      layer.setScrollFactor(1 - (i * 0.1), 1); // Parallax effect
      
      this.backgroundLayers.push(layer);
    }
  }

  /**
   * Initialize spawn points
   */
  private initializeSpawns() {
    this.levelData.spawnPoints.forEach(spawnPoint => {
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
   * Spawn an entity from a spawn point
   */
  private spawnEntity(spawnPoint: SpawnPoint) {
    if (!spawnPoint.active) return;

    switch (spawnPoint.type) {
      case 'enemy':
        if (spawnPoint.enemyType) {
          const enemy = new Enemy(
            this.scene,
            spawnPoint.x,
            spawnPoint.y,
            spawnPoint.enemyType
          );
          this.scene.events.emit('enemySpawned', enemy);
        }
        break;
      case 'weapon':
        if (spawnPoint.weaponType) {
          const weapon = new Weapon(
            this.scene,
            spawnPoint.x,
            spawnPoint.y,
            spawnPoint.weaponType
          );
          this.scene.events.emit('weaponSpawned', weapon);
        }
        break;
      case 'item':
        if (spawnPoint.itemType) {
          const item = new Item(
            this.scene,
            spawnPoint.x,
            spawnPoint.y,
            spawnPoint.itemType
          );
          this.scene.events.emit('itemSpawned', item);
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
  update(_cameraX: number, playerX?: number) {
    // Update background scrolling
    this.scrollOffset += this.levelData.scrollSpeed;
    
    this.backgroundLayers.forEach((layer, index) => {
      const scrollFactor = 1 - (index * 0.1);
      layer.tilePositionX = this.scrollOffset * scrollFactor;
    });

    // Check for wave triggers
    if (playerX !== undefined) {
      this.checkWaveTriggers(playerX);
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
    this.scene.events.emit('waveStarted', wave);

    wave.enemies.forEach((enemy, index) => {
      const delay = enemy.delay || (index * 200); // Stagger spawns by default
      
      this.scene.time.delayedCall(delay, () => {
        const enemyEntity = new Enemy(
          this.scene,
          enemy.x,
          enemy.y,
          enemy.type
        );
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
   * Check if all waves are complete
   */
  areAllWavesComplete(): boolean {
    return this.levelData.waves.length > 0 && 
           this.activeWaves.size === this.levelData.waves.length;
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
    this.currentWave = 0;
    this.checkpoints.clear();
    
    // Clean up old background
    this.backgroundLayers.forEach(layer => layer.destroy());
    this.backgroundLayers = [];
    
    // Setup new level
    this.createBackground();
    this.setupCamera();
    this.initializeCheckpoints();
    this.initializeSpawns();
    
    this.scene.events.emit('levelChanged', this.currentLevel);
  }

  /**
   * Clean up
   */
  destroy() {
    this.backgroundLayers.forEach(layer => layer.destroy());
    this.spawnTimers.forEach(timer => timer.destroy());
    this.spawnTimers.clear();
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
    ]
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
          { type: 'donovan', x: 3700, y: 476, delay: 200 },
          { type: 'donovan', x: 3800, y: 476, delay: 400 },
          { type: 'galsia', x: 3900, y: 476, delay: 600 }
        ]
      }
    ],
    checkpoints: [
      { x: 1500, y: 476, id: 'checkpoint1', activated: false },
      { x: 3000, y: 476, id: 'checkpoint2', activated: false },
      { x: 3800, y: 476, id: 'checkpoint3', activated: false }
    ]
  }
  // Add more levels here as needed
];

