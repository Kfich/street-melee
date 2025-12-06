import Phaser from 'phaser';
import { CharacterType } from '../types/CharacterType';
import { GameSceneData } from '../../types/GameTypes';
import { Player } from '../../entities/characters/Player';
import { InputManager } from '../../systems/input/InputManager';
import { EntityManager } from '../../managers/EntityManager';
import { GameConfig } from '../../config/GameConfig';
import { AnimationSystem } from '../../systems/animation/AnimationSystem';
import { CombatSystem } from '../../systems/combat/CombatSystem';
import { ComboSystem } from '../../systems/combat/ComboSystem';
import { SpecialMoveSystem } from '../../systems/combat/SpecialMoveSystem';
import { HealthBar } from '../../ui/HealthBar';
import { ComboCounter } from '../../ui/ComboCounter';
import { WeaponIndicator } from '../../ui/WeaponIndicator';
import { BaseEntity } from '../../entities/base/BaseEntity';
import { Hitbox } from '../../systems/combat/Hitbox';
import { Enemy } from '../../entities/enemies/Enemy';
import { Boss } from '../../entities/bosses/Boss';
import { WeaponManager } from '../../systems/weapon/WeaponManager';
import { ItemManager } from '../../systems/item/ItemManager';
import { GrabSystem } from '../../systems/combat/GrabSystem';
import { Weapon } from '../../entities/weapons/Weapon';
import { Item } from '../../entities/items/Item';
import { LevelManager, LEVEL_CONFIGS } from '../../systems/level/LevelManager';
import { RoomManager } from '../../systems/background/RoomManager';
import { VisualEffects } from '../../systems/effects/VisualEffects';
import { AudioManager } from '../../systems/audio/AudioManager';
import { MusicContext } from '../../systems/audio/MusicState';
import { MultiplayerClient } from '../../multiplayer/Client';
import { BossHealthBar } from '../../ui/BossHealthBar';
import { StoryManager, LevelTransitionSystem, DialogueSystem, NarrativeSystem } from '../../systems/story';
import { STORY_REGISTRY } from '../../systems/story/StoryData';

export class GameScene extends Phaser.Scene {
  private players: Player[] = [];
  private enemies: Enemy[] = [];
  private bosses: Boss[] = [];
  private ground!: Phaser.GameObjects.Rectangle;
  private inputManager!: InputManager;
  private entityManager!: EntityManager;
  private animationSystem!: AnimationSystem;
  private combatSystem!: CombatSystem;
  private comboSystem!: ComboSystem;
  private specialMoveSystem!: SpecialMoveSystem;
  private weaponManager!: WeaponManager;
  private itemManager!: ItemManager;
  private grabSystem!: GrabSystem;
  private levelManager!: LevelManager;
  private roomManager!: RoomManager;
  private visualEffects!: VisualEffects;
  private audioManager!: AudioManager;
  private multiplayerClient?: MultiplayerClient;
  private isMultiplayer: boolean = false;
  private healthBars: HealthBar[] = [];
  private comboCounters: ComboCounter[] = [];
  private weaponIndicators: WeaponIndicator[] = [];
  private bossHealthBar?: BossHealthBar;
  private scoreText!: Phaser.GameObjects.Text;
  private livesText!: Phaser.GameObjects.Text;
  private playerShadows: Map<Player, Phaser.GameObjects.Ellipse> = new Map();
  private enemyShadows: Map<Enemy, Phaser.GameObjects.Ellipse> = new Map();
  private currentComboCounts: Map<number, number> = new Map();
  private storyManager!: StoryManager;
  private levelTransitionSystem!: LevelTransitionSystem;
  private dialogueSystem!: DialogueSystem;
  private narrativeSystem!: NarrativeSystem;
  private currentLevelIndex: number = 0;

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data: GameSceneData) {
    // Initialize with character selections
    this.data.set('player1Character', data.player1Character || 'axel');
    // For single player, player2Character can be null/undefined
    this.data.set('player2Character', data.player2Character || null);
    this.data.set('isMultiplayer', data.isMultiplayer || false);
    this.data.set('roomId', data.roomId);
  }

  create() {
    console.log('GameScene: create() called');
    const { width, height } = this.cameras.main;

    try {
      // Initialize systems
      console.log('GameScene: Initializing systems...');
      this.animationSystem = new AnimationSystem(this);
      this.combatSystem = new CombatSystem(this);
      this.comboSystem = new ComboSystem(this);
      this.specialMoveSystem = new SpecialMoveSystem(this);
      this.weaponManager = new WeaponManager(this);
      this.itemManager = new ItemManager(this);
      this.grabSystem = new GrabSystem(this);
    
    // Initialize room manager (handles backgrounds and room transitions)
    this.roomManager = new RoomManager(this);
    
    // Initialize level (use first level config)
    this.levelManager = new LevelManager(this, LEVEL_CONFIGS[0]);
    
    // Initialize visual effects
    this.visualEffects = new VisualEffects(this);
    
    // Stop all music from previous scenes before initializing audio
    // This ensures menu music doesn't overlap with gameplay music
    this.sound.stopAll();
    
    // Initialize audio manager
    this.audioManager = new AudioManager(this);
    
    // Initialize storytelling systems (after audio manager)
    this.storyManager = new StoryManager(this, this.audioManager);
    this.levelTransitionSystem = new LevelTransitionSystem(this.storyManager);
    this.dialogueSystem = new DialogueSystem(this.storyManager);
    this.narrativeSystem = new NarrativeSystem(this.storyManager);
    
    // Initialize multiplayer if enabled
    this.isMultiplayer = this.data.get('isMultiplayer') || false;
    if (this.isMultiplayer) {
      this.initializeMultiplayer();
    }
    
    // Initialize managers
    this.inputManager = new InputManager(this);
    this.entityManager = new EntityManager();
    
    // Set up level event listeners
    this.setupLevelEvents();
    
    // Set up combat effect listeners
    this.setupCombatEffects();
    
    // Set up audio event listeners
    this.setupAudioEvents();
    
    // Set up settings event listeners
    this.setupSettingsEvents();
    
    // Initialize storytelling systems (after audio manager)
    this.storyManager = new StoryManager(this, this.audioManager);
    this.levelTransitionSystem = new LevelTransitionSystem(this.storyManager);
    this.dialogueSystem = new DialogueSystem(this.storyManager);
    this.narrativeSystem = new NarrativeSystem(this.storyManager);
    
    // Register all story cutscenes
    this.registerStoryCutscenes();
    
    // Start gameplay music (with small delay to ensure audio is ready)
    // All previous music has been stopped, so this will be the only music playing
    this.time.delayedCall(200, () => {
      this.audioManager.playMusicWithContext('level1', MusicContext.GAMEPLAY, true);
    });

    // Register all story cutscenes (after all systems are initialized)
    this.registerStoryCutscenes();
    
    // Initialize room system (loads first room and backgrounds)
    this.roomManager.initializeLevel('level1');
    
    // Set physics world bounds to match room width and height (important for movement)
    const roomWidth = this.roomManager.getRoomWidth();
    const roomHeight = this.roomManager.getRoomHeight() || height;
    // Allow vertical movement: Y from 0 (top/background) to roomHeight (bottom/foreground)
    this.physics.world.setBounds(0, 0, roomWidth, roomHeight);

    // Create ground (extend to room width)
    this.createGround(roomWidth, height);

    // Create players (after ground is created)
    this.createPlayers(width, height);

    // Level manager handles all spawning via spawn points and waves
    // No need for manual enemy/weapon/item creation

    // Set up camera with level bounds
    this.setupCamera(this.levelManager.getLevelWidth(), height);

    // Set up collisions
    this.setupCollisions();

    // Set up combat events
    this.setupCombatEvents();

    // Create health bars
    this.createHealthBars();

    // Create UI
    this.createUI();

    // Initialize boss health bar (hidden until boss spawns)
    this.bossHealthBar = new BossHealthBar(this);

    // Debug text
    this.add.text(10, 10, `Level ${this.levelManager.getCurrentLevel()} - Full Combat System`, {
      fontSize: '16px',
      color: '#ffffff'
    });
    
    // Instructions
    this.add.text(10, 30, 'X/B: Attack (mash for combos) | Z/A: Special | Dash + Attack: Signature/Throw', {
      fontSize: '12px',
      color: '#cccccc'
    });
    this.add.text(10, 45, 'Jump + Attack: Jump Attack | Attack + Jump: Back Attack', {
      fontSize: '12px',
      color: '#cccccc'
    });
    this.add.text(10, 60, 'Close to enemy + Attack: Grab | Direction + Attack: Throw | Jump while grabbing: Vault', {
      fontSize: '12px',
      color: '#cccccc'
    });
    
    console.log('GameScene: Initialization complete!');
    } catch (error) {
      console.error('GameScene: Error during initialization:', error);
      // Show error message to user
      this.add.text(width / 2, height / 2, 'Error loading game. Check console.', {
        fontSize: '24px',
        color: '#ff0000'
      }).setOrigin(0.5);
    }
  }

  private createGround(width: number, height: number) {
    // Create ground as a range: bottom of frame up to +200px
    // This allows players to move vertically within the ground range at different depth levels
    const groundHeight = 200; // 200px range from bottom
    const groundY = height - (groundHeight / 2); // Center of ground range
    this.ground = this.add.rectangle(width / 2, groundY, width, groundHeight, 0x444444);
    this.physics.add.existing(this.ground, true);
    (this.ground.body as Phaser.Physics.Arcade.Body).setSize(width, groundHeight);
  }

  private createPlayers(_width: number, height: number) {
    const player1Char = this.data.get('player1Character') as CharacterType;
    const player2Char = this.data.get('player2Character') as CharacterType | null;
    const isMultiplayer = this.data.get('isMultiplayer') as boolean;

    // Calculate ground Y position (ground is at height - 100, so entities should be at ground level)
    const groundY = height - 100;

    // Always create player 1 at start position
    const player1 = new Player(
      this, 200, groundY, player1Char, 0,
      this.animationSystem,
      this.comboSystem,
      this.specialMoveSystem
    );

    this.players.push(player1);
    this.entityManager.add(player1);
    player1.sprite.setData('isPlayer', true);
    player1.sprite.setData('playerEntity', player1);
    player1.sprite.setData('entity', player1);
    // Set depth based on Y position for proper layering
    player1.sprite.setDepth(player1.sprite.y);

    // Only create player 2 if in multiplayer mode or if player2Character is provided
    if (isMultiplayer || player2Char) {
      const player2Character = player2Char || 'blaze'; // Default fallback
      const player2 = new Player(
        this, 400, groundY, player2Character, 1,
        this.animationSystem,
        this.comboSystem,
        this.specialMoveSystem
      );

      this.players.push(player2);
      this.entityManager.add(player2);
      player2.sprite.setData('isPlayer', true);
      player2.sprite.setData('playerEntity', player2);
      player2.sprite.setData('entity', player2);
      // Set depth based on Y position for proper layering
      player2.sprite.setDepth(player2.sprite.y);
    }
  }

  private setupCamera(_levelWidth: number, _height: number) {
    // Camera setup is now handled by RoomManager
    // Just set up the follow
    if (this.players.length > 0) {
      this.cameras.main.startFollow(
        this.players[0].sprite,
        true,
        GameConfig.CAMERA_FOLLOW_LERP,
        GameConfig.CAMERA_FOLLOW_LERP
      );
      
      // Set camera deadzone for smoother following
      this.cameras.main.setDeadzone(100, 50);
    }
  }

  private setupLevelEvents() {
    // Room manager events
    this.events.on('roomLoaded', (data: { roomId: string; roomName: string; width: number; height: number }) => {
      console.log(`[GameScene] Room loaded: ${data.roomName} (${data.roomId})`);
      // Update physics world bounds for new room (including vertical bounds for depth navigation)
      this.physics.world.setBounds(0, 0, data.width, data.height);
    });

    this.events.on('roomTransitionComplete', (data: { fromRoomId?: string; toRoomId: string; playerX: number; playerY: number }) => {
      console.log(`[GameScene] Room transition complete: ${data.fromRoomId} -> ${data.toRoomId}`);
      // Player position is already updated by RoomManager
    });

    this.events.on('levelStarted', (data: { levelId: string; levelName: string; roomId: string }) => {
      console.log(`[GameScene] Level started: ${data.levelName} (${data.levelId})`);
    });

    this.events.on('levelTransitionComplete', (data: { fromLevelId?: string; toLevelId: string; playerX: number; playerY: number }) => {
      console.log(`[GameScene] Level transition complete: ${data.fromLevelId} -> ${data.toLevelId}`);
      // Could reset game state, spawn new enemies, etc.
    });

    // Listen for level spawns
    this.events.on('enemySpawned', (enemy: Enemy) => {
      this.enemies.push(enemy);
      this.entityManager.add(enemy);
      enemy.sprite.setData('entity', enemy);
      enemy.sprite.setData('isEnemy', true);
      // Set depth based on Y position for proper layering
      enemy.sprite.setDepth(enemy.sprite.y);
      this.physics.add.collider(enemy.sprite, this.ground);
    });

    // Listen for boss spawns
    this.events.on('bossSpawned', (boss: Boss) => {
      this.bosses.push(boss);
      this.entityManager.add(boss);
      boss.sprite.setData('entity', boss);
      boss.sprite.setData('isBoss', true);
      
      // Set depth for proper rendering (same layer as players/enemies)
      // Use Y position for depth sorting so lower entities appear in front
      boss.sprite.setDepth(boss.sprite.y);
      
      this.physics.add.collider(boss.sprite, this.ground);
      
      // Show boss health bar
      if (!this.bossHealthBar) {
        this.bossHealthBar = new BossHealthBar(this);
      }
      this.bossHealthBar.setBoss(boss);
      
      // Trigger boss dialogue if available (with small delay to ensure boss is fully spawned)
      if (this.dialogueSystem && this.storyManager) {
        this.time.delayedCall(500, () => {
          const levelIndex = this.levelManager ? this.levelManager.getCurrentLevel() - 1 : 0;
          // Create a flags map for dialogue checking
          const flags = new Map<string, boolean>();
          // Check for boss-specific dialogues (they use scene_index matching level + 1)
          this.dialogueSystem.checkAndTriggerDialogue(levelIndex + 1, flags);
        });
      }
    });

    // Listen for enemy defeats
    this.events.on('entityDefeated', (entity: BaseEntity) => {
      if (entity.sprite.getData('isEnemy')) {
        const enemyId = entity.sprite.getData('enemyId');
        const waveNumber = entity.sprite.getData('waveNumber');
        if (this.levelManager && enemyId) {
          this.levelManager.onEnemyDefeated(enemyId, waveNumber);
        }
      }
    });

    // Listen for boss defeat
    this.events.on('bossDefeated', (data: { boss: Boss; bossType: string }) => {
      console.log(`[GameScene] Boss defeated: ${data.bossType}`);
      
      // Remove boss from array
      const index = this.bosses.indexOf(data.boss);
      if (index > -1) {
        this.bosses.splice(index, 1);
      }
      
      // Hide boss health bar
      if (this.bossHealthBar) {
        this.bossHealthBar.clearBoss();
      }
      
      // Trigger level completion (boss defeat = level complete)
      this.events.emit('levelCompleted', {
        levelId: `level${this.levelManager.getCurrentLevel()}`,
        score: 0 // TODO: Calculate actual score
      });
    });

    this.events.on('weaponSpawned', (weapon: Weapon) => {
      const allWeapons = this.weaponManager.getAll();
      allWeapons.push(weapon);
      this.physics.add.collider(weapon.sprite, this.ground);
    });

    this.events.on('itemSpawned', (item: Item) => {
      // Items are managed by ItemManager automatically
      // Just ensure it's added to the scene
      this.itemManager.getAll().push(item);
    });

    // Wave events
    this.events.on('waveStarted', (wave: any) => {
      const waveNumber = wave.waveNumber || wave;
      console.log(`Wave ${waveNumber} started!`);
    });

    this.events.on('waveCompleted', (waveNumber: number) => {
      console.log(`Wave ${waveNumber} completed!`);
      // Could add visual feedback here
    });

    // Checkpoint events
    this.events.on('checkpointActivated', (checkpoint: any) => {
      console.log(`Checkpoint ${checkpoint.id} activated at (${checkpoint.x}, ${checkpoint.y})`);
      // Could add save state functionality here
    });

    // Level progression
    // Listen for level changes to update scene index
    this.events.on('levelChanged', (data: { levelNumber: number; levelId: string; levelName: string } | number) => {
      // Update scene index for narrative system
      if (typeof data === 'object' && data.levelNumber) {
        this.currentLevelIndex = data.levelNumber - 1;
        if (this.storyManager) {
          this.storyManager.setSceneIndex(this.currentLevelIndex);
        }
      }
      
      // Check for narrative cutscenes at level start
      if (this.narrativeSystem) {
        this.narrativeSystem.checkAndTriggerNarrative(this.currentLevelIndex);
      }
      
      // Legacy handler
      const levelInfo = typeof data === 'number' 
        ? { levelNumber: data, levelId: `level${data}`, levelName: `Level ${data}` }
        : data;
      
      console.log(`Level changed to ${levelInfo.levelName} (${levelInfo.levelId})`);
      
      // Clean up previous level entities
      this.cleanupLevelEntities();
      
      // Reset player positions to start of new level
      if (this.players.length > 0) {
        this.players[0].sprite.setPosition(200, this.cameras.main.height - 100);
        if (this.players.length > 1) {
          this.players[1].sprite.setPosition(400, this.cameras.main.height - 100);
        }
      }
      
      // Update UI, play level music, etc.
      if (this.audioManager) {
        this.audioManager.playMusicWithContext('level1', MusicContext.GAMEPLAY, true);
      }
    });

    // Level end reached
    // Listen for level end to show transition
    this.events.on('levelEndReached', () => {
      if (this.levelManager && this.levelTransitionSystem) {
        const currentLevel = this.levelManager.getCurrentLevel() - 1;
        if (this.levelTransitionSystem.shouldShowTransition(currentLevel, LEVEL_CONFIGS.length)) {
          // Show level transition before progressing
          this.levelTransitionSystem.showTransition(currentLevel);
          
          // Wait for transition to complete before progressing
          this.events.once('cutsceneEnded', () => {
            this.progressToNextLevel();
          });
        } else {
          // No transition, progress immediately
          this.progressToNextLevel();
        }
      }
    });
    
    // Legacy level end handler (kept for compatibility)
    this.events.on('levelEndReached_legacy', () => {
      console.log('[GameScene] Level end reached');
      // This will be checked in checkVictory along with enemy defeat
    });
  }

  // Removed createEnemies - enemies are now spawned by LevelManager via spawn points and waves

  private playerGroundColliders: Map<Player, Phaser.Physics.Arcade.Collider> = new Map();

  private setupCollisions() {
    // Set up collisions between players and ground
    // Store colliders so we can enable/disable them for depth navigation
    this.players.forEach(player => {
      const collider = this.physics.add.collider(player.sprite, this.ground);
      this.playerGroundColliders.set(player, collider);
    });

    // Set up collisions between enemies and ground
    this.enemies.forEach(enemy => {
      this.physics.add.collider(enemy.sprite, this.ground);
    });

    // Set up collisions between weapons and ground
    this.weaponManager.getAll().forEach(weapon => {
      this.physics.add.collider(weapon.sprite, this.ground);
    });

    // Set up player-to-player collision (can pass through each other for now)
    // this.physics.add.collider(this.players[0].sprite, this.players[1].sprite);
  }

  // Removed spawnWeapons and spawnItems - weapons and items are now spawned by LevelManager

  private createUI() {
    const { width } = this.cameras.main;

    // Score display (improved styling)
    this.scoreText = this.add.text(15, 80, 'Score: 0', {
      fontSize: '24px',
      fontFamily: 'Arial',
      color: '#ffff00',
      stroke: '#000000',
      strokeThickness: 3,
      fontStyle: 'bold'
    });

    // Lives display (improved styling)
    this.livesText = this.add.text(15, 110, 'Lives: 3', {
      fontSize: '24px',
      fontFamily: 'Arial',
      color: '#00ff00',
      stroke: '#000000',
      strokeThickness: 3,
      fontStyle: 'bold'
    });

    // Create combo counters for each player
    this.players.forEach((_player, index) => {
      const comboCounter = new ComboCounter(
        this,
        width / 2,
        100 + (index * 50)
      );
      this.comboCounters.push(comboCounter);
      this.currentComboCounts.set(index, 0);
    });

    // Create weapon indicators for each player
    this.players.forEach((_player, index) => {
      const weaponIndicator = new WeaponIndicator(
        this,
        15,
        140 + (index * 30)
      );
      this.weaponIndicators.push(weaponIndicator);
    });

    // Create shadows for players and enemies
    this.createShadows();

    // Listen for score/lives updates
    this.events.on('scoreUpdated', (score: number) => {
      if (this.scoreText) {
        this.scoreText.setText(`Score: ${score.toLocaleString()}`);
      }
    });

    this.events.on('livesUpdated', (lives: number) => {
      if (this.livesText) {
        this.livesText.setText(`Lives: ${lives}`);
      }
    });

    // Track combos
    this.events.on('comboHit', (playerIndex: number) => {
      const currentCount = this.currentComboCounts.get(playerIndex) || 0;
      const newCount = currentCount + 1;
      this.currentComboCounts.set(playerIndex, newCount);
      
      if (this.comboCounters[playerIndex]) {
        this.comboCounters[playerIndex].updateCombo(newCount);
      }

      // Reset combo after delay if no more hits
      this.time.delayedCall(3000, () => {
        const latestCount = this.currentComboCounts.get(playerIndex);
        if (latestCount === newCount) {
          // No new hits, reset combo
          this.currentComboCounts.set(playerIndex, 0);
          if (this.comboCounters[playerIndex]) {
            this.comboCounters[playerIndex].hide();
          }
        }
      });
    });

    this.events.on('comboReset', (playerIndex: number) => {
      this.currentComboCounts.set(playerIndex, 0);
      if (this.comboCounters[playerIndex]) {
        this.comboCounters[playerIndex].hide();
      }
    });
  }

  private createShadows() {
    // Create shadows for players
    this.players.forEach(player => {
      if (player && player.sprite && player.sprite.active) {
        const shadow = this.visualEffects.createShadow(player.sprite);
        this.playerShadows.set(player, shadow);
      }
    });

    // Create shadows for enemies
    this.enemies.forEach(enemy => {
      if (enemy && enemy.sprite && enemy.sprite.active) {
        const shadow = this.visualEffects.createShadow(enemy.sprite);
        this.enemyShadows.set(enemy, shadow);
      }
    });
  }

  private setupCombatEvents() {
    // Listen for hitbox creation
    this.events.on('hitboxCreated', (hitbox: Hitbox) => {
      // Store player index on hitbox owner for combo tracking
      const ownerEntity = hitbox.owner.getData('entity');
      if (ownerEntity) {
        const playerIndex = this.players.findIndex(p => p === ownerEntity);
        if (playerIndex >= 0) {
          hitbox.owner.setData('playerIndex', playerIndex);
        }
      }
      this.combatSystem.registerHitbox(hitbox);
    });
  }

  private setupCombatEffects() {
    // Listen for hit stop events
    this.events.on('hitStop', (type: 'light' | 'medium' | 'heavy' | 'knockdown') => {
      switch (type) {
        case 'light':
          this.visualEffects.hitStopLight();
          break;
        case 'medium':
          this.visualEffects.hitStopMedium();
          break;
        case 'heavy':
          this.visualEffects.hitStopHeavy();
          break;
        case 'knockdown':
          this.visualEffects.hitStopKnockdown();
          break;
      }
    });

    // Listen for damage events to create visual effects
    this.events.on('entityDamaged', (data: { entity: any; damage: number; x: number; y: number; isHeavy?: boolean; isKnockdown?: boolean }) => {
      const isHeavy = data.isHeavy || data.damage >= 25;
      const isEnemy = data.entity?.sprite?.getData('isEnemy');
      
      this.visualEffects.createHitMark(data.x, data.y, data.damage, isHeavy);
      this.visualEffects.createSmoke(data.x, data.y);
      
      // Blood particles for enemy hits
      if (isEnemy) {
        this.visualEffects.createBloodParticles(data.x, data.y, isHeavy ? 8 : 4);
      }
      
      // Impact effect for knockdowns and heavy hits
      if (data.isKnockdown || isHeavy) {
        this.visualEffects.createImpactEffect(data.x, data.y, isHeavy);
      }
      
      // Trigger hit reaction on target entity
      if (data.entity && data.entity.sprite) {
        this.triggerHitReaction(data.entity, isHeavy || false, data.isKnockdown || false);
      }
    });
  }

  /**
   * Trigger hit reaction animation on entity
   */
  private triggerHitReaction(entity: BaseEntity, isHeavy: boolean, isKnockdown: boolean) {
    if (isKnockdown) {
      // Knockdown handled separately
      return;
    }

    // Set hit reaction state
    const currentState = entity.getState();
    if (currentState !== 'attacking' && currentState !== 'knockedDown') {
      entity.setState('hitReaction');
      
      // Flash effect
      const sprite = entity.sprite;
      sprite.setTint(0xff0000);
      
      // Brief stun/flinch animation
      const duration = isHeavy ? GameConfig.HIT_STUN_DURATION : GameConfig.HIT_REACTION_DURATION;
      
      this.tweens.add({
        targets: sprite,
        alpha: 0.6,
        duration: 50,
        yoyo: true,
        onComplete: () => {
          sprite.clearTint();
          sprite.setAlpha(1);
          
          // Return to previous state after reaction
          this.time.delayedCall(duration, () => {
            if (entity.getState() === 'hitReaction') {
              entity.setState('idle');
            }
          });
        }
      });
    }

    // Special move flash effects
    this.events.on('specialMovePerformed', (data?: { x?: number; y?: number; characterType?: string }) => {
      if (data?.x && data?.y) {
        // Character-specific flash colors
        const colors: Record<string, number> = {
          'axel': 0x00ff00,    // Green
          'blaze': 0xff00ff,   // Magenta
          'max': 0x0088ff,     // Blue
          'sammy': 0xffff00,   // Yellow
          'dario': 0xff6600,   // Orange
          'zara': 0xff00ff,    // Pink
          'rex': 0x00ffff,     // Cyan
          'angela': 0xff0088   // Pink
        };
        const color = colors[data.characterType || ''] || 0x00ffff;
        this.visualEffects.flashSpecialMove(data.x, data.y, color);
        // Create explosion effect for special moves
        this.visualEffects.createSpecialMoveExplosion(data.x, data.y, color, 'medium');
        this.visualEffects.screenShakeMedium(250);
      } else {
        // Full screen flash for special moves
        this.visualEffects.flashScreen(0x00ffff, 80, 0.3);
        this.visualEffects.screenShakeMedium(200);
      }
    });

    // Signature move effects
    this.events.on('signatureMovePerformed', () => {
      this.visualEffects.flashScreen(0xffff00, 100, 0.4);
      this.visualEffects.screenShakeHeavy(250);
    });

    // Knockdown effects
    this.events.on('knockdown', (data?: { x?: number; y?: number }) => {
      if (data?.x && data?.y) {
        this.visualEffects.createImpactEffect(data.x, data.y, true);
        this.visualEffects.createDust(data.x, data.y, 10);
      }
      this.visualEffects.screenShakeHeavy(300);
    });

    // Throw effects
    this.events.on('throwPerformed', (data?: { x?: number; y?: number; isSlam?: boolean }) => {
      if (data?.x && data?.y) {
        if (data.isSlam) {
          this.visualEffects.createImpactEffect(data.x, data.y, true);
          this.visualEffects.createDust(data.x, data.y, 12);
          this.visualEffects.screenShakeExtreme(400);
        } else {
          this.visualEffects.createDust(data.x, data.y, 6);
          this.visualEffects.screenShakeMedium(200);
        }
      }
    });

    // Landing effects
    this.events.on('landingPerformed', (data?: { x?: number; y?: number }) => {
      if (data?.x && data?.y) {
        this.visualEffects.createLandingDust(data.x, data.y);
      }
    });

    // Get-up effects
    this.events.on('getUpPerformed', (data?: { x?: number; y?: number }) => {
      if (data?.x && data?.y) {
        this.visualEffects.createDust(data.x, data.y, 4);
      }
    });
  }

  private setupAudioEvents() {
    // Play sounds for various game events
    this.events.on('attackPerformed', () => {
      this.audioManager.playSound('punch');
    });

    this.events.on('specialMovePerformed', () => {
      this.audioManager.playSound('special');
      // Visual effects are handled in setupCombatEffects
    });

    this.events.on('jumpPerformed', () => {
      this.audioManager.playSound('jump');
    });

    this.events.on('grabPerformed', () => {
      this.audioManager.playSound('grab');
    });

    this.events.on('throwPerformed', () => {
      this.audioManager.playSound('throw');
    });

    this.events.on('weaponHit', () => {
      this.audioManager.playSound('weaponHit');
    });

    this.events.on('itemCollected', () => {
      this.audioManager.playSound('itemPickup');
    });

    this.events.on('knockdown', () => {
      this.audioManager.playSound('knockdown');
    });

    this.events.on('entityHit', () => {
      this.audioManager.playSound('enemyHit');
    });

    this.events.on('jumpAttackPerformed', () => {
      this.audioManager.playSound('special', 0.8);
    });

    this.events.on('backAttackPerformed', () => {
      this.audioManager.playSound('special', 0.9);
    });

    this.events.on('levelAdvance', () => {
      this.audioManager.playSound('levelAdvance');
    });

    this.events.on('levelUp', () => {
      this.audioManager.playSound('levelUp');
    });
  }

  private setupSettingsEvents() {
    // Listen for settings changes
    this.events.on('musicVolumeChanged', (volume: number) => {
      this.audioManager.setMusicVolume(volume);
    });

    this.events.on('sfxVolumeChanged', (volume: number) => {
      this.audioManager.setSFXVolume(volume);
    });

    this.events.on('musicEnabledChanged', (enabled: boolean) => {
      this.audioManager.setMusicEnabled(enabled);
    });

    this.events.on('sfxEnabledChanged', (enabled: boolean) => {
      this.audioManager.setSFXEnabled(enabled);
    });
  }

  /**
   * Check for game over conditions
   */
  checkGameOver() {
    // Check if all players are dead
    const allPlayersDead = this.players.every(player => !player.isAlive());
    
    if (allPlayersDead) {
      const score = this.itemManager.getScore();
      this.scene.start('GameOverScene', {
        victory: false,
        score: score
      });
    }

    // Check for victory (all enemies defeated, etc.)
    // This would be implemented based on level completion
  }

  private initializeMultiplayer() {
    this.multiplayerClient = new MultiplayerClient('http://localhost:3001');
    
    // Set up callbacks
    this.multiplayerClient.onRoomCreatedCallback((roomId) => {
      console.log(`Room created: ${roomId}`);
      this.data.set('roomId', roomId);
    });

    this.multiplayerClient.onRoomJoinedCallback((roomId) => {
      console.log(`Joined room: ${roomId}`);
      this.data.set('roomId', roomId);
    });

    this.multiplayerClient.onStateUpdateCallback((gameState) => {
      // Handle remote player state updates
      this.handleRemotePlayerUpdate(gameState);
    });

    this.multiplayerClient.onErrorCallback((error) => {
      console.error(`Multiplayer error: ${error}`);
    });

    // Connect to server
    this.multiplayerClient.connect();
    
    // Create or join room based on scene data
    const roomId = this.data.get('roomId');
    if (roomId) {
      // Wait for connection before joining
      setTimeout(() => {
        if (this.multiplayerClient?.getIsConnected()) {
          this.multiplayerClient.joinRoom(roomId);
        }
      }, 500);
    } else {
      // Wait for connection before creating
      setTimeout(() => {
        if (this.multiplayerClient?.getIsConnected()) {
          this.multiplayerClient.createRoom();
        }
      }, 500);
    }
  }

  private handleRemotePlayerUpdate(_gameState: any) {
    // Update remote players based on server state
    // This would sync remote player positions, states, etc.
    // Implementation depends on how you want to handle remote players
  }

  /**
   * Register all story cutscenes
   */
  private registerStoryCutscenes(): void {
    // Register all cutscenes from StoryData
    for (const [id, factory] of Object.entries(STORY_REGISTRY)) {
      this.storyManager.registerCutscene(id, factory);
      // Also register as dialogue if it's a dialogue type
      this.dialogueSystem.registerDialogue(id, factory);
    }
    
    // Set scene index for narrative checking (level 1 = scene 1, etc.)
    this.currentLevelIndex = 0; // First level is index 0
    this.storyManager.setSceneIndex(this.currentLevelIndex);
    
    // Set character for dialogue
    const player1Char = this.data.get('player1Character') as CharacterType;
    this.storyManager.setCharacter(player1Char);
    
    // Check for initial narrative at level start (with small delay to ensure everything is loaded)
    this.time.delayedCall(500, () => {
      this.narrativeSystem.checkAndTriggerNarrative(this.currentLevelIndex);
    });
  }

  private createHealthBars() {
    this.players.forEach((player) => {
      const healthBar = new HealthBar(
        this,
        player,
        player.sprite.x,
        player.sprite.y - 60
      );
      this.healthBars.push(healthBar);
    });
  }

  update() {
    // Update story manager (handles cutscene input)
    if (this.storyManager) {
      this.storyManager.update();
    }

    // Don't update game if cutscene is playing
    if (this.storyManager && this.storyManager.isCutscenePlaying()) {
      return;
    }

    // Check for pause
    if (this.input.keyboard?.checkDown(this.input.keyboard.addKey('P'))) {
      if (!this.scene.isPaused('PauseScene')) {
        this.scene.pause();
        this.scene.launch('PauseScene', { gameSceneKey: 'GameScene' });
      }
    }

    // Handle input for all players
    this.players.forEach((player, index) => {
      if (!player || !player.sprite || !player.sprite.active) {
        return;
      }
      const input = this.inputManager.getPlayerInput(index);
      
      // Handle ground collision for depth navigation
      // Ground is now a 200px range from bottom, so players can be at different depths
      // Disable ground collision when not at foreground level to prevent drift
      const body = player.sprite.body as Phaser.Physics.Arcade.Body;
      if (body) {
        const roomHeight = this.roomManager?.getRoomHeight() || this.cameras.main.height;
        const groundRangeTop = roomHeight - 200; // Top of ground range
        const groundRangeBottom = roomHeight; // Bottom of frame
        const isMovingVertically = input.up || input.down;
        const isAtForeground = player.sprite.y >= groundRangeBottom - 10; // Within 10px of bottom
        
        // Enable/disable ground collision based on depth
        const collider = this.playerGroundColliders.get(player);
        if (collider) {
          // Only enable ground collision at foreground level (bottom)
          // This prevents collision forces from causing drift at depth levels
          if (isAtForeground && !isMovingVertically) {
            collider.active = true;
          } else {
            collider.active = false;
          }
        }
        
        // Always disable gravity and stop velocity when not moving vertically
        // This ensures character stops at exact coordinate
        if (!isMovingVertically) {
          body.setGravityY(0);
          body.setVelocityY(0);
          
          // Clamp to ground range if outside
          if (player.sprite.y < groundRangeTop) {
            player.sprite.setPosition(player.sprite.x, groundRangeTop);
          } else if (player.sprite.y > groundRangeBottom) {
            player.sprite.setPosition(player.sprite.x, groundRangeBottom);
          }
        }
      }
      
      player.handleInput(input);
      
      // Update weapon indicator
      if (this.weaponIndicators[index]) {
        const weapon = player.getWeapon();
        this.weaponIndicators[index].updateWeapon(weapon ? weapon.getWeaponType() : null);
      }
      
      // Send input to multiplayer server if connected
      if (this.isMultiplayer && this.multiplayerClient && index === 0) {
        this.multiplayerClient.sendInput(input);
      }
      
      // Check for weapon pickup
      const weapon = this.weaponManager.checkPickup(player);
      if (weapon && !player.hasWeapon()) {
        player.pickupWeapon(weapon);
      }

      // Check for item collection
      this.itemManager.checkCollection(player);
    });

    // Send player state updates to server
    if (this.isMultiplayer && this.multiplayerClient && this.players[0]) {
      const player = this.players[0];
      const body = player.sprite.body as Phaser.Physics.Arcade.Body;
      
      this.multiplayerClient.sendPlayerUpdate({
        x: player.sprite.x,
        y: player.sprite.y,
        velocityX: body.velocity.x,
        velocityY: body.velocity.y,
        state: player.getState(),
        character: player.getCharacterType(),
        facingRight: player.isFacingRight(),
        health: player.getHealth()
      });
    }

    // Update all entities
    if (this.entityManager) {
      this.entityManager.update();
    }

    // Update player depths for proper layering
    this.players.forEach(player => {
      if (player && player.sprite && player.sprite.active) {
        player.sprite.setDepth(player.sprite.y);
      }
    });

    // CRITICAL: Enforce zero velocity/gravity for vertical movement AFTER physics step
    // This must run after all physics updates to prevent drift
    this.players.forEach(player => {
      if (!player || !player.sprite || !player.sprite.active) {
        return;
      }
      const body = player.sprite.body as Phaser.Physics.Arcade.Body;
      if (!body) return;

      const roomHeight = this.roomManager?.getRoomHeight() || this.cameras.main.height;
      const groundRangeTop = roomHeight - 200;
      const groundRangeBottom = roomHeight;
      const isInGroundRange = player.sprite.y >= groundRangeTop && player.sprite.y <= groundRangeBottom;
      
      // Get current input to check if moving vertically
      // Use index from players array instead of protected playerIndex
      const playerIndex = this.players.indexOf(player);
      const currentInput = playerIndex >= 0 ? this.inputManager.getPlayerInput(playerIndex) : { up: false, down: false };
      const isMovingVertically = currentInput.up || currentInput.down;
      
      // If in ground range and not moving vertically, enforce zero velocity/gravity
      // This runs AFTER physics step to prevent any drift
      if (isInGroundRange && !isMovingVertically) {
        const oldY = player.sprite.y;
        const oldVelocityY = body.velocity.y;
        const oldGravityY = body.gravity.y;
        
        // Force zero velocity and gravity IMMEDIATELY
        body.setVelocityY(0);
        body.setGravityY(0);
        
        // Also restore position if it has drifted significantly
        // Store previous Y to detect drift
        const storedY = (player as any).lastStableY;
        if (storedY !== undefined && Math.abs(player.sprite.y - storedY) > 0.1) {
          console.log(`[GameScene] Restoring position after physics drift: ${player.sprite.y.toFixed(2)} -> ${storedY.toFixed(2)}`);
          player.sprite.setPosition(player.sprite.x, storedY);
          // Force velocity to 0 again after position restore
          body.setVelocityY(0);
        } else {
          // Store current Y as stable position (only if not drifting)
          if (Math.abs(body.velocity.y) < 0.1 && Math.abs(body.gravity.y) < 0.1) {
            (player as any).lastStableY = player.sprite.y;
          }
        }
        
        // Log if we detect any drift being corrected
        const playerIndex = this.players.indexOf(player);
        if (Math.abs(body.velocity.y - oldVelocityY) > 0.01 || Math.abs(body.gravity.y - oldGravityY) > 0.01 || Math.abs(player.sprite.y - oldY) > 0.1) {
          console.log(`[GameScene] Correcting drift for Player ${playerIndex} - Y: ${oldY.toFixed(2)} -> ${player.sprite.y.toFixed(2)}, VelocityY: ${oldVelocityY.toFixed(2)} -> ${body.velocity.y.toFixed(2)}, GravityY: ${oldGravityY.toFixed(2)} -> ${body.gravity.y.toFixed(2)}`);
        }
      } else if (isMovingVertically) {
        // Clear stored position when moving
        (player as any).lastStableY = undefined;
      }
    });

    // Update weapon manager
    if (this.weaponManager) {
      this.weaponManager.update();
    }

    // Update item manager
    if (this.itemManager) {
      this.itemManager.update();
    }

    // Update grab system
    if (this.grabSystem) {
      this.grabSystem.update();
    }

    // Update room manager (background scrolling, room transitions)
    if (this.roomManager && this.players[0]) {
      const cameraX = this.cameras.main.scrollX;
      const cameraY = this.cameras.main.scrollY;
      const playerX = this.players[0].sprite.x;
      const playerY = this.players[0].sprite.y;
      
      // Update background layers
      this.roomManager.update(cameraX, cameraY);
      
      // Check for room transitions
      const transition = this.roomManager.checkRoomTransition(playerX, playerY);
      if (transition.transition && transition.newX !== undefined && transition.newY !== undefined) {
        // Move player to new room position
        this.players[0].sprite.setPosition(transition.newX, transition.newY);
        
        // Update physics world bounds for new room (including vertical bounds)
        const newRoomWidth = this.roomManager.getRoomWidth();
        const newRoomHeight = this.roomManager.getRoomHeight() || this.cameras.main.height;
        this.physics.world.setBounds(0, 0, newRoomWidth, newRoomHeight);
        
        // Update ground to match new room width (keep 200px height range)
        if (this.ground) {
          const groundHeight = 200;
          const groundY = newRoomHeight - (groundHeight / 2);
          this.ground.setSize(newRoomWidth, groundHeight);
          this.ground.setPosition(newRoomWidth / 2, groundY);
          (this.ground.body as Phaser.Physics.Arcade.Body).setSize(newRoomWidth, groundHeight);
        }
      }
    }

    // Update level manager (scrolling, etc.)
    if (this.levelManager) {
      const cameraX = this.cameras.main.scrollX;
      const playerX = this.players[0]?.sprite.x || 0;
      this.levelManager.update(cameraX, playerX);
    }

    // Update combat system (check player attacks vs enemies, enemy attacks vs players)
    if (this.combatSystem && this.entityManager) {
      const allEntities = this.entityManager.getAll();
      this.combatSystem.update(allEntities);
    }
    
    // Update enemy AI (they need to find players)
    if (this.enemies) {
      // Filter out destroyed enemies and update active ones
      this.enemies = this.enemies.filter(enemy => {
        if (enemy && enemy.sprite && enemy.sprite.active) {
          try {
            enemy.update();
            // Update depth based on Y position for proper layering
            enemy.sprite.setDepth(enemy.sprite.y);
          } catch (error) {
            console.warn('[GameScene] Error updating enemy:', error);
            return false; // Remove enemy if update fails
          }
          return true;
        }
        return false; // Remove destroyed enemies
      });
    }

    // Update health bars
    if (this.healthBars) {
      this.healthBars.forEach((bar, i) => {
        if (bar && this.players && this.players[i]) {
          bar.updatePosition();
          bar.update();
        }
      });
    }

    // Update bosses
    if (this.bosses) {
      this.bosses = this.bosses.filter(boss => {
        if (boss && boss.sprite && boss.sprite.active) {
          try {
            boss.update();
          } catch (error) {
            console.warn('[GameScene] Error updating boss:', error);
            return false;
          }
          return true;
        }
        return false;
      });
    }

    // Update boss health bar
    if (this.bossHealthBar) {
      this.bossHealthBar.update();
    }

    // Update shadows
    this.updateShadows();

    // Check for game over conditions
    this.checkGameOver();

    // Check for victory condition
    this.checkVictory();
  }

  private updateShadows() {
    // Update player shadows
    this.playerShadows.forEach((shadow, player) => {
      if (player && player.sprite && player.sprite.active && shadow && shadow.active) {
        this.visualEffects.updateShadow(shadow, player.sprite);
      } else if (shadow) {
        shadow.destroy();
        this.playerShadows.delete(player);
      }
    });

    // Update enemy shadows
    this.enemyShadows.forEach((shadow, enemy) => {
      if (enemy && enemy.sprite && enemy.sprite.active && shadow && shadow.active) {
        this.visualEffects.updateShadow(shadow, enemy.sprite);
      } else if (shadow) {
        shadow.destroy();
        this.enemyShadows.delete(enemy);
      }
    });
  }

  private checkVictory() {
    if (!this.levelManager) return;

    // Check if all enemies are defeated
    const aliveEnemies = this.enemies.filter(enemy => 
      enemy && enemy.sprite && enemy.sprite.active && enemy.isAlive()
    );

    const allEnemiesDefeated = aliveEnemies.length === 0 && this.enemies.length > 0;
    
    // Check if level is complete
    const isLevelComplete = this.levelManager.isLevelComplete(allEnemiesDefeated);
    
    if (isLevelComplete) {
      // Level completed! Progress to next level or show victory
      this.completeLevel();
    }
  }

  /**
   * Progress to next level (called after level transition)
   */
  private progressToNextLevel() {
    if (!this.levelManager) return;

    const currentLevelIndex = this.levelManager.getCurrentLevel() - 1;
    const nextLevelIndex = currentLevelIndex + 1;
    this.currentLevelIndex = nextLevelIndex;
    
    // Check if there's a next level
    if (nextLevelIndex < LEVEL_CONFIGS.length) {
      // Progress to next level
      console.log(`[GameScene] Level ${currentLevelIndex + 1} complete! Progressing to level ${nextLevelIndex + 1}...`);
      
      // Play level complete sound
      if (this.audioManager) {
        this.audioManager.playSound('levelAdvance');
      }
      
      // Clean up current level entities
      this.cleanupLevelEntities();
      
      // Progress to next level
      this.levelManager.nextLevel(LEVEL_CONFIGS[nextLevelIndex]);
      
      // Update ground size for new level
      const newLevelWidth = this.levelManager.getLevelWidth();
      const newLevelHeight = this.cameras.main.height;
      if (this.ground) {
        const groundHeight = 200;
        const groundY = newLevelHeight - (groundHeight / 2);
        this.ground.setSize(newLevelWidth, groundHeight);
        this.ground.setPosition(newLevelWidth / 2, groundY);
        (this.ground.body as Phaser.Physics.Arcade.Body).setSize(newLevelWidth, groundHeight);
      }
      
      // Update physics world bounds
      this.physics.world.setBounds(0, 0, newLevelWidth, newLevelHeight);
      
      // Update scene index for narrative system
      if (this.storyManager) {
        this.storyManager.setSceneIndex(nextLevelIndex);
      }
      
      // Check for narrative cutscenes at start of new level
      this.narrativeSystem.checkAndTriggerNarrative(nextLevelIndex);
    } else {
      // All levels complete - victory!
      console.log('[GameScene] All levels complete! Victory!');
      const score = this.itemManager.getScore();
      
      // Play victory sound
      if (this.audioManager) {
        this.audioManager.playSound('levelAdvance');
      }
      
      // Show victory screen
      this.time.delayedCall(1500, () => {
        this.scene.start('GameOverScene', {
          victory: true,
          score: score
        });
      });
    }
  }

  /**
   * Legacy completeLevel method - now redirects to new system
   */
  private completeLevel() {
    // Emit level end event which will trigger transition system
    this.events.emit('levelEndReached');
  }

  private cleanupLevelEntities() {
    // Clean up enemies
    this.enemies.forEach(enemy => {
      if (enemy && enemy.sprite) {
        enemy.sprite.destroy();
      }
    });
    this.enemies = [];
    
    // Clean up weapons
    const allWeapons = this.weaponManager.getAll();
    allWeapons.forEach(weapon => {
      if (weapon && weapon.sprite) {
        weapon.sprite.destroy();
      }
    });
    allWeapons.length = 0;
    
    // Clean up items
    const allItems = this.itemManager.getAll();
    allItems.forEach(item => {
      if (item && item.sprite) {
        item.sprite.destroy();
      }
    });
    allItems.length = 0;
    
    // Clean up shadows
    this.enemyShadows.forEach(shadow => {
      if (shadow) {
        shadow.destroy();
      }
    });
    this.enemyShadows.clear();
  }

  /**
   * Clean up when scene is destroyed
   */
  shutdown() {
    if (this.inputManager) {
      this.inputManager.destroy();
    }
    if (this.entityManager) {
      this.entityManager.clear();
    }
    if (this.multiplayerClient) {
      this.multiplayerClient.disconnect();
    }
    if (this.audioManager) {
      this.audioManager.stopMusic();
    }
  }
}

