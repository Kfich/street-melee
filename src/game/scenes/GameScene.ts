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
// HealthBar removed - health is now displayed in HUD
import { ComboCounter } from '../../ui/ComboCounter';
import { WeaponIndicator } from '../../ui/WeaponIndicator';
import { BaseEntity } from '../../entities/base/BaseEntity';
import { Hitbox } from '../../systems/combat/Hitbox';
import { Boss } from '../../entities/bosses/Boss';
import { WeaponManager } from '../../systems/weapon/WeaponManager';
import { ItemManager } from '../../systems/item/ItemManager';
import { RandomItemSpawner } from '../../systems/item/RandomItemSpawner';
import { RewardSystem } from '../../systems/reward/RewardSystem';
import { SpawnTracker } from '../../systems/tracking/SpawnTracker';
import { GrabSystem } from '../../systems/combat/GrabSystem';
import { Weapon } from '../../entities/weapons/Weapon';
import { Item } from '../../entities/items/Item';
import { LevelManager, LEVEL_CONFIGS } from '../../systems/level/LevelManager';
import { RoomManager } from '../../systems/background/RoomManager';
import { VisualEffects } from '../../systems/effects/VisualEffects';
import { AudioManager } from '../../systems/audio/AudioManager';
import { MusicContext } from '../../systems/audio/MusicState';
import { MultiplayerClient, GameState, PlayerState } from '../../multiplayer/Client';
import { BossHealthBar } from '../../ui/BossHealthBar';
import { StoryManager, LevelTransitionSystem, DialogueSystem, NarrativeSystem } from '../../systems/story';
import { STORY_REGISTRY } from '../../systems/story/StoryData';
import { CutsceneTriggerSystem } from '../../systems/story/CutsceneTriggerSystem';
import { SCENE_TO_LEVEL_MAP } from '../../config/GameScenes';
import { BossSceneManager } from '../../systems/boss/BossSceneManager';
import { WidgetManager } from '../../ui/widgets';
import { PlayerUpdateManager } from '../../managers/PlayerUpdateManager';
import { EnemyManager } from '../../managers/EnemyManager';
import { BossManager } from '../../managers/BossManager';
import { EnemyPool } from '../../pools/EnemyPool';
import { WeaponPool } from '../../pools/WeaponPool';
import { ItemPool } from '../../pools/ItemPool';

export class GameScene extends Phaser.Scene {
  private players: Player[] = [];
  private ground!: Phaser.GameObjects.Rectangle;
  private inputManager!: InputManager;
  private entityManager!: EntityManager;
  private animationSystem!: AnimationSystem;
  private combatSystem!: CombatSystem;
  private comboSystem!: ComboSystem;
  private specialMoveSystem!: SpecialMoveSystem;
  private weaponManager!: WeaponManager;
  private itemManager!: ItemManager;
  private rewardSystem!: RewardSystem;
  private randomItemSpawner!: RandomItemSpawner;
  private spawnTracker!: SpawnTracker;
  private grabSystem!: GrabSystem;
  private levelManager!: LevelManager;
  private roomManager!: RoomManager;
  private visualEffects!: VisualEffects;
  private audioManager!: AudioManager;
  private multiplayerClient?: MultiplayerClient;
  private isMultiplayer: boolean = false;
  private comboCounters: ComboCounter[] = [];
  private weaponIndicators: WeaponIndicator[] = [];
  private bossHealthBar?: BossHealthBar;
  private playerShadows: Map<Player, Phaser.GameObjects.Ellipse> = new Map();
  private currentComboCounts: Map<number, number> = new Map();
  private storyManager!: StoryManager;
  private levelTransitionSystem!: LevelTransitionSystem;
  private dialogueSystem!: DialogueSystem;
  private narrativeSystem!: NarrativeSystem;
  private currentLevelIndex: number = 0;
  // contextual gameplay/boss/cutscene/victory tracks. Updated by roomLoaded /
  // roomTransitionComplete via SCENE_TO_LEVEL_MAP reverse lookup.
  private cutsceneTriggerSystem!: CutsceneTriggerSystem;
  private bossSceneManager!: BossSceneManager;
  private playerScore: number = 0; // Track player score
  private widgetManager!: WidgetManager;
  private playerUpdateManager!: PlayerUpdateManager;
  private enemyManager!: EnemyManager;
  private bossManager!: BossManager;
  private enemyPool!: EnemyPool;
  private weaponPool!: WeaponPool;
  private itemPool!: ItemPool;
  private playerLives: number = GameConfig.PLAYER_LIVES;
  private isInitialized: boolean = false; // Track if game is fully initialized
  private cleanupCounter: number = 0;
  private levelCompleteTriggered: boolean = false; // Prevent multiple level-end events
  // Sprites driven purely by server state — not in EntityManager, no physics body
  private remotePlayers: Map<string, Phaser.GameObjects.Sprite> = new Map();

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data: GameSceneData) {
    // Reset initialization flag
    this.isInitialized = false;
    this.levelCompleteTriggered = false;

    // Initialize with character selections
    this.data.set('player1Character', data.player1Character || 'axel');
    // For single player, player2Character can be null/undefined
    this.data.set('player2Character', data.player2Character || null);
    this.data.set('isMultiplayer', data.isMultiplayer || false);
    this.data.set('roomId', data.roomId);
  }

  create() {
    const { width, height } = this.cameras.main;

    try {
      // Initialize systems
      this.animationSystem = new AnimationSystem(this);
      this.combatSystem = new CombatSystem(this);
      this.comboSystem = new ComboSystem(this);
      this.specialMoveSystem = new SpecialMoveSystem(this);
      this.weaponManager = new WeaponManager(this);
      // Initialize RewardSystem first
      this.rewardSystem = new RewardSystem(this);
      (this as any).rewardSystem = this.rewardSystem; // Expose for Item access
      
      this.itemManager = new ItemManager(this, this.rewardSystem);
      
      // Initialize random item spawner
      this.randomItemSpawner = new RandomItemSpawner(this, this.itemManager, {
        minDistance: 150,
        maxDistance: 400,
        spawnAheadDistance: 1000,
        spawnBehindDistance: 500,
        groundY: height - 100, // Ground level
        itemHeightOffset: 30,
        spawnChunkSize: 3,
        spawnChunkInterval: 600
      });
      
      // Initialize spawn tracker
      this.spawnTracker = new SpawnTracker(this);
      
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
    this.cutsceneTriggerSystem = new CutsceneTriggerSystem(this.storyManager);
    this.bossSceneManager = new BossSceneManager(this);
    
    // Initialize multiplayer if enabled
    this.isMultiplayer = this.data.get('isMultiplayer') || false;
    if (this.isMultiplayer) {
      this.initializeMultiplayer();
    }
    
    // Initialize managers
    this.inputManager = new InputManager(this);
    this.entityManager = new EntityManager();
    
    // Expose EntityManager on scene for entity access (similar to roomManager pattern)
    (this as any).entityManager = this.entityManager;
    
    // Set up level event listeners
    this.setupLevelEvents();
    
    // Initialize random item spawner when level manager is ready
    this.time.delayedCall(GameConfig.INIT_DELAY_MEDIUM, () => {
      if (this.randomItemSpawner && this.levelManager) {
        const levelWidth = this.levelManager.getLevelWidth();
        const levelHeight = this.levelManager.getLevelHeight();
        const groundY = levelHeight - 100; // Ground level
        this.randomItemSpawner.initialize(levelWidth, levelHeight, groundY);
        this.randomItemSpawner.reset();
      }
      
      // Emit initial spawn stats
      if (this.spawnTracker) {
        this.events.emit('spawnStatsUpdated', this.getSpawnStats());
      }
    });
    
    // Set up combat effect listeners
    this.setupCombatEffects();
    
    // Set up audio event listeners
    this.setupAudioEvents();
    
    // Set up settings event listeners
    this.setupSettingsEvents();
    
    // Register all story cutscenes
    this.registerStoryCutscenes();
    
    // Start gameplay music (with small delay to ensure audio is ready)
    this.time.delayedCall(GameConfig.INIT_DELAY_MEDIUM, () => {
      this.audioManager.playMusicWithContext(
        this.getLevelMusicTrack(0),
        MusicContext.GAMEPLAY,
        true
      );
    });
    
    // Initialize room system (loads first room and backgrounds)
    this.roomManager.initializeLevel('level1');
    
    // Initialize spawn tracker with first room
    if (this.spawnTracker) {
      this.spawnTracker.setSceneId('level1_room1');
    }
    
    // Show intro cutscene when game starts (with small delay to ensure everything is loaded)
    this.time.delayedCall(GameConfig.INIT_DELAY_VERY_LONG, () => {
      this.showIntroCutscene();
    });
    
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

    // Fade in from black at scene start
    this.cameras.main.fadeIn(800, 0, 0, 0);

    // Set up collisions
    this.setupCollisions();
    
    // Initialize enemy manager with spatial grid for enhanced AI
    const spatialGrid = this.combatSystem ? (this.combatSystem as any).spatialGrid : undefined;
    this.enemyManager = new EnemyManager(
      this,
      this.entityManager,
      this.ground,
      this.levelManager,
      this.visualEffects,
      spatialGrid
    );
    
    // Initialize boss manager
    this.bossManager = new BossManager(
      this,
      this.entityManager,
      this.ground,
      this.bossSceneManager,
      this.bossHealthBar,
      this.dialogueSystem,
      this.storyManager,
      this.levelManager
    );
    
    // Initialize object pools
    this.enemyPool = new EnemyPool(this, 10, 50);
    this.weaponPool = new WeaponPool(this, 5, 30);
    this.itemPool = new ItemPool(this, 5, 30);
    
    // Expose pools on scene for manager access
    (this as any).enemyPool = this.enemyPool;
    (this as any).weaponPool = this.weaponPool;
    (this as any).itemPool = this.itemPool;

    // Set up combat events
    this.setupCombatEvents();

    // Create health bars
    this.createHealthBars();

    // Create UI (combo counters, weapon indicators, shadows)
    this.createUI();

    // Initialize widget manager (defer to ensure players are created)
    this.time.delayedCall(GameConfig.INIT_DELAY_MEDIUM, () => {
      if (!this.widgetManager) {
        this.widgetManager = new WidgetManager(this);
        this.widgetManager.setLives(this.playerLives, GameConfig.PLAYER_LIVES);
        this.widgetManager.startClock();
        
        // Set player 1 for health tracking
        if (this.players.length > 0) {
          this.widgetManager.setPlayer(this.players[0]);
        }
        
        // Set player 2 for health tracking (if exists)
        if (this.players.length > 1) {
          this.widgetManager.setPlayer2(this.players[1]);
          this.widgetManager.setLives2(this.playerLives, GameConfig.PLAYER_LIVES);
          this.widgetManager.setScore2(0);
          this.widgetManager.setPickupCount2(0);
        }
        
        // Initialize score and pickups for player 1
        this.widgetManager.setScore(0);
        this.widgetManager.setPickupCount(0);
        
        // Ensure all widgets are visible
        this.widgetManager.ensureWidgetsVisible();
      }
      
      // Initialize player update manager (after players and systems are ready)
      if (!this.playerUpdateManager) {
        this.playerUpdateManager = new PlayerUpdateManager(
          this,
          this.players,
          this.inputManager,
          this.weaponManager,
          this.itemManager,
          this.weaponIndicators,
          this.playerGroundColliders,
          this.roomManager,
          this.multiplayerClient,
          this.isMultiplayer
        );
      }

      // Set up in-game menu button callbacks
      if (this.widgetManager) {
        // Menu button - show main menu
        this.widgetManager.setMenuButtonCallback('menu', () => {
          this.scene.pause();
          this.scene.start('MainMenuScene');
        });

        // Continue button - hide menu and resume
        this.widgetManager.setMenuButtonCallback('continue', () => {
          if (this.widgetManager) {
            this.widgetManager.hideInGameMenu();
            this.widgetManager.startClock(); // Resume clock
          }
          this.scene.resume();
        });

        // Minus button - decrease volume
        this.widgetManager.setMenuButtonCallback('minus', () => {
          if (this.audioManager) {
            // Decrease both music and SFX volume by 10%
            const currentMusicVol = this.audioManager.getMusicVolume();
            const currentSFXVol = this.audioManager.getSFXVolume();
            this.audioManager.setMusicVolume(Math.max(0, currentMusicVol - 0.1));
            this.audioManager.setSFXVolume(Math.max(0, currentSFXVol - 0.1));
            this.events.emit('musicVolumeChanged', this.audioManager.getMusicVolume());
            this.events.emit('sfxVolumeChanged', this.audioManager.getSFXVolume());
          }
        });

        // Pause button - toggle pause
        this.widgetManager.setMenuButtonCallback('pause', () => {
          if (this.scene.isPaused()) {
            this.scene.resume();
            if (this.widgetManager) {
              this.widgetManager.hideInGameMenu();
              this.widgetManager.startClock(); // Resume clock
            }
          } else {
            this.scene.pause();
            if (this.widgetManager) {
              this.widgetManager.showInGameMenu();
              this.widgetManager.stopClock(); // Pause clock
            }
          }
        });

        // Plus button - increase volume
        this.widgetManager.setMenuButtonCallback('plus', () => {
          if (this.audioManager) {
            // Increase both music and SFX volume by 10%
            const currentMusicVol = this.audioManager.getMusicVolume();
            const currentSFXVol = this.audioManager.getSFXVolume();
            this.audioManager.setMusicVolume(Math.min(1, currentMusicVol + 0.1));
            this.audioManager.setSFXVolume(Math.min(1, currentSFXVol + 0.1));
            this.events.emit('musicVolumeChanged', this.audioManager.getMusicVolume());
            this.events.emit('sfxVolumeChanged', this.audioManager.getSFXVolume());
          }
        });

        // Quit button - return to main menu
        this.widgetManager.setMenuButtonCallback('quit', () => {
          this.scene.start('MainMenuScene');
        });
      }

      console.log('[GameScene] Widget manager initialized and widgets visible');
    });

    // Initialize boss health bar (hidden until boss spawns)
    // Defer creation slightly to ensure scene is fully ready
    this.time.delayedCall(GameConfig.INIT_DELAY_SHORT, () => {
      this.bossHealthBar = new BossHealthBar(this);
    });

    // Old debug text and instructions removed - widgets now handle UI display

    // Launch mobile on-screen controls for touch devices
    if (this.sys.game.device.input.touch) {
      this.scene.launch('MobileControlsScene');
    }

    // Mark as initialized after a short delay to ensure all systems are ready
    this.time.delayedCall(GameConfig.INIT_DELAY_LONG, () => {
      this.isInitialized = true;
    });
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
    const groundHeight = GameConfig.GROUND_HEIGHT_RANGE;
    const groundY = height - (groundHeight / 2); // Center of ground range
    this.ground = this.add.rectangle(width / 2, groundY, width, groundHeight, 0x444444);
    this.physics.add.existing(this.ground, true);
    (this.ground.body as Phaser.Physics.Arcade.Body).setSize(width, groundHeight);
  }

  private createPlayers(_width: number, height: number) {
    const player1Char = this.data.get('player1Character') as CharacterType;
    const player2Char = this.data.get('player2Character') as CharacterType | null;
    const isMultiplayer = this.data.get('isMultiplayer') as boolean;

    // Calculate ground Y position (ground is at height - offset, so entities should be at ground level)
    const groundY = height - GameConfig.GROUND_OFFSET;

    // Always create player 1 at start position
    const player1 = new Player(
      this, GameConfig.PLAYER_SPAWN_X_1, groundY, player1Char, 0,
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
        this, GameConfig.PLAYER_SPAWN_X_2, groundY, player2Character, 1,
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
      this.cameras.main.setDeadzone(GameConfig.CAMERA_DEADZONE_X, GameConfig.CAMERA_DEADZONE_Y);
    }
  }

  /**
   * Get current spawn statistics
   */
  getSpawnStats() {
    if (!this.spawnTracker) {
      return {
        weapons: { active: 0, spawned: 0, collected: 0, byType: new Map() },
        items: { active: 0, spawned: 0, collected: 0, byType: new Map() }
      };
    }

    const sceneStats = this.spawnTracker.getCurrentSceneStats();
    if (!sceneStats) {
      return {
        weapons: { active: 0, spawned: 0, collected: 0, byType: new Map() },
        items: { active: 0, spawned: 0, collected: 0, byType: new Map() }
      };
    }

    return {
      weapons: {
        active: sceneStats.weapons.active,
        spawned: sceneStats.weapons.spawned,
        collected: sceneStats.weapons.collected,
        byType: sceneStats.weapons.byType
      },
      items: {
        active: sceneStats.items.active,
        spawned: sceneStats.items.spawned,
        collected: sceneStats.items.collected,
        byType: sceneStats.items.byType
      }
    };
  }

  private setupLevelEvents() {
    // Room manager events
    this.events.on('roomLoaded', (data: { roomId: string; roomName: string; width: number; height: number }) => {
      console.log(`[GameScene] Room loaded: ${data.roomName} (${data.roomId})`);
      
      // Update spawn tracker with new scene ID
      if (this.spawnTracker) {
        this.spawnTracker.setSceneId(data.roomId);
      }
      
      // Update physics world bounds for new room (including vertical bounds for depth navigation)
      this.physics.world.setBounds(0, 0, data.width, data.height);
      
      // Update spatial grid bounds for combat system
      if (this.combatSystem) {
        const bounds = new Phaser.Geom.Rectangle(0, 0, data.width, data.height);
        this.combatSystem.setWorldBounds(bounds);
      }
      
      // Update scene number and check for automatic triggers
      if (this.cutsceneTriggerSystem) {
        this.updateSceneNumber();
        // Check for automatic triggers after a short delay to ensure room is fully loaded
        this.time.delayedCall(GameConfig.INIT_DELAY_LONG, () => {
          if (this.cutsceneTriggerSystem) {
            this.cutsceneTriggerSystem.checkAutomaticTriggers();
          }
        });
      }
      
      // Check and spawn boss for this room if needed (with delay to ensure room is fully loaded)
      if (this.bossSceneManager) {
        this.time.delayedCall(GameConfig.INIT_DELAY_MEDIUM_LONG, () => {
          const roomMatch = data.roomId.match(/level(\d+)_room(\d+)/);
          if (roomMatch) {
            const levelNum = parseInt(roomMatch[1], 10);
            const roomNum = parseInt(roomMatch[2], 10);
            this.bossSceneManager.checkAndSpawnBoss(levelNum, roomNum);
          }
        });
      }
      
      // Re-initialize spawner when room changes
      if (this.randomItemSpawner) {
        const groundY = data.height - 100;
        this.randomItemSpawner.initialize(data.width, data.height, groundY);
        this.randomItemSpawner.reset();
      }
      
      // Emit spawn stats update event
      this.events.emit('spawnStatsUpdated', this.getSpawnStats());
    });

    // Handle room transition start - update player position IMMEDIATELY
    this.events.on('roomTransitionStart', (data: { fromRoomId?: string; toRoomId: string; playerX: number; playerY: number }) => {
      console.log(`[GameScene] Room transition starting: ${data.fromRoomId} -> ${data.toRoomId}`);
      
      // Clean up bosses from previous room
      if (this.bossSceneManager && data.fromRoomId) {
        const fromRoomMatch = data.fromRoomId.match(/level(\d+)_room(\d+)/);
        if (fromRoomMatch) {
          const levelNum = parseInt(fromRoomMatch[1], 10);
          const roomNum = parseInt(fromRoomMatch[2], 10);
          this.bossSceneManager.cleanupBossesForScene(levelNum, roomNum);
        }
      }
      
      // Update player position IMMEDIATELY when transition starts
      // This prevents the player from being at the exit when the new room loads
      if (this.players[0] && data.playerX !== undefined && data.playerY !== undefined) {
        // Set player position immediately to prevent re-triggering
        this.players[0].sprite.setPosition(data.playerX, data.playerY);
        
        // Reset player velocity to prevent drift
        if (this.players[0].sprite.body) {
          const body = this.players[0].sprite.body as Phaser.Physics.Arcade.Body;
          body.setVelocity(0, 0);
        }
        
        console.log(`[GameScene] Player positioned at (${data.playerX}, ${data.playerY}) in room ${data.toRoomId}`);
      }
    });

    this.events.on('roomTransitionComplete', (data: { fromRoomId?: string; toRoomId: string; playerX: number; playerY: number }) => {
      console.log(`[GameScene] Room transition complete: ${data.fromRoomId} -> ${data.toRoomId}`);
      
      // Update camera and physics bounds after room is fully loaded
      if (this.players[0]) {
        // Update camera to follow player in new room
        this.cameras.main.startFollow(this.players[0].sprite);
        
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
    });

    this.events.on('levelStarted', (data: { levelId: string; levelName: string; roomId: string }) => {
      console.log(`[GameScene] Level started: ${data.levelName} (${data.levelId})`);
    });

    this.events.on('levelTransitionComplete', (data: { fromLevelId?: string; toLevelId: string; playerX: number; playerY: number }) => {
      console.log(`[GameScene] Level transition complete: ${data.fromLevelId} -> ${data.toLevelId}`);
      // Could reset game state, spawn new enemies, etc.
    });

    // Listen for level spawns
    // Enemy spawning is now handled by EnemyManager

    // Boss spawning and destruction are now handled by BossManager

    // Enemy defeats are now handled by EnemyManager
    // Keep this listener for non-enemy entities if needed
    // Score system - calculate and award points
    this.events.on('entityDefeated', (entity: BaseEntity) => {
      this.calculateDefeatScore(entity);
      // Enemy defeats handled by EnemyManager
      if (!entity.sprite.getData('isEnemy')) {
        // Handle other entity types if needed
      }
    });

    // Boss entrance cinematic — freeze player input and switch to boss music
    this.events.on('bossEntranceStart', () => {
      if (this.playerUpdateManager) {
        this.playerUpdateManager.setInputFrozen(true);
      }
      if (this.audioManager) {
        this.audioManager.playMusicWithContext('boss', MusicContext.BOSS, true);
      }
    });
    this.events.on('bossEntranceEnd', () => {
      if (this.playerUpdateManager) {
        this.playerUpdateManager.setInputFrozen(false);
      }
    });

    // Boss defeat: duck boss music, play sting_boss_defeat (+ optional
    // character-specific win sting on the final boss of the level), then
    // either spawn the next queued boss or end the level.
    this.events.on('bossDefeated', (data: { boss: Boss; bossType: string }) => {
      console.log(`[GameScene] Boss defeated: ${data.bossType}`);
      // If there is a sequential boss queued for this level, spawn it instead of ending.
      // Keep boss music playing — the next entrance will switch music.
      if (this.levelManager && this.levelManager.activateNextBoss()) {
        return;
      }
      // No more bosses — fade back to level music before the level-end transition.
      if (this.audioManager) {
        this.audioManager.playMusicWithContext(
          this.getLevelMusicTrack(this.currentLevelIndex),
          MusicContext.GAMEPLAY,
          true
        );
      }
      this.events.emit('levelEndReached');
    });

    this.events.on('weaponSpawned', (weapon: Weapon) => {
      // Weapons are managed by WeaponManager automatically
      // Just ensure ground collision is set up
      this.physics.add.collider(weapon.sprite, this.ground);
    });

    this.events.on('itemSpawned', (_item: Item) => {
      // Items are managed by ItemManager automatically
      // No additional setup needed - ItemManager handles everything
      // Spawn tracking is handled by SpawnTracker via event listeners
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
        this.audioManager.playMusicWithContext(this.getLevelMusicTrack(this.currentLevelIndex), MusicContext.GAMEPLAY, true);
      }
    });

    // Level end reached — emitted by both LevelManager (position-based) and
    // checkVictory() (enemy-defeat-based). Guard with levelCompleteTriggered so
    // the transition only fires once regardless of which source emits it first
    // and regardless of how many times LevelManager.update() emits it per frame.
    this.events.on('levelEndReached', () => {
      if (this.levelCompleteTriggered) return; // already handling or handled
      this.levelCompleteTriggered = true;

      // Fade to black before the level transition
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        if (this.levelManager && this.levelTransitionSystem) {
          // currentLevel is 0-based index of the level that just completed.
          // nextLevelKey is 1-based: matches the addTransition(1, ...) convention.
          const currentLevel = this.levelManager.getCurrentLevel() - 1;
          const nextLevelKey = currentLevel + 1;
          if (this.levelTransitionSystem.shouldShowTransition(currentLevel, LEVEL_CONFIGS.length)) {
            // showTransition() returns true when a cutscene was started; wait for it.
            // Returns false when no transition is registered; fall through immediately.
            const started = this.levelTransitionSystem.showTransition(nextLevelKey);
            if (started) {
              this.events.once('cutsceneEnded', () => {
                this.progressToNextLevel();
              });
            } else {
              this.progressToNextLevel();
            }
          } else {
            // No next level (or last level) — progress immediately (triggers victory)
            this.progressToNextLevel();
          }
        }
      });
    });
    
  }


  private playerGroundColliders: Map<Player, Phaser.Physics.Arcade.Collider> = new Map();

  private setupCollisions() {
    // Set up collisions between players and ground
    // Store colliders so we can enable/disable them for depth navigation
    this.players.forEach(player => {
      const collider = this.physics.add.collider(player.sprite, this.ground);
      this.playerGroundColliders.set(player, collider);
    });

    // Enemy ground collisions are now handled by EnemyManager
    if (this.enemyManager) {
      this.enemyManager.setupGroundCollisions();
    }

    // Set up collisions between weapons and ground
    this.weaponManager.getAll().forEach(weapon => {
      this.physics.add.collider(weapon.sprite, this.ground);
    });

    // Set up player-to-player collision (can pass through each other for now)
    // this.physics.add.collider(this.players[0].sprite, this.players[1].sprite);
  }


  private createUI() {
    const { width } = this.cameras.main;

    // Old score/lives text removed - now handled by WidgetManager

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

    // scoreUpdated is emitted by ItemManager and calculateDefeatScore —
    // widget updates are handled directly in each code path via addScore/setScore,
    // so no central listener is needed here.

    this.events.on('livesUpdated', (lives: number) => {
      // Update widget lives
      if (this.widgetManager) {
        this.widgetManager.setLives(lives, 3);
        this.playerLives = lives;
      }
    });
    
    // Listen for item collection events
    this.events.on('itemCollected', (data: { type: string; points?: number; item: any; rewardDisplay?: any }) => {
      this.audioManager.playSound('itemPickup');
      
      // Show reward popup if available
      if (data.rewardDisplay && data.item) {
        this.visualEffects.createItemRewardPopup(
          data.item.sprite.x,
          data.item.sprite.y,
          data.rewardDisplay
        );
      }
      
      // Update widgets (with null check)
      if (this.widgetManager) {
        if (data.points) {
          this.playerScore += data.points;
          this.widgetManager.addScore(data.points);
        }
        this.widgetManager.incrementPickup();
      }
      
      // Update spawn stats
      if (this.spawnTracker) {
        this.events.emit('spawnStatsUpdated', this.getSpawnStats());
      }
    });
    
    // Listen for weapon pickup events
    this.events.on('weaponPickedUp', () => {
      this.audioManager.playSound('weaponHit', 0.5);
      // Update spawn stats
      if (this.spawnTracker) {
        this.events.emit('spawnStatsUpdated', this.getSpawnStats());
      }
    });

    this.events.on('grabPerformed', () => {
      this.audioManager.playSound('grab', 0.7);
    });

    this.events.on('throwAudio', (data: { isSlam: boolean }) => {
      this.audioManager.playSound('throw', data.isSlam ? 0.9 : 0.6);
    });

    this.events.on('dashPerformed', () => {
      this.audioManager.playSound('jump', 0.35);
    });
    
    // Listen for spawn stats updates (for UI display or debugging)
    this.events.on('spawnStatsUpdated', (stats: any) => {
      // Log spawn stats for debugging (can be removed or used for UI)
      if (console && console.log) {
        console.log('[GameScene] Spawn Stats:', {
          weapons: {
            active: stats.weapons?.active || 0,
            spawned: stats.weapons?.spawned || 0,
            collected: stats.weapons?.collected || 0
          },
          items: {
            active: stats.items?.active || 0,
            spawned: stats.items?.spawned || 0,
            collected: stats.items?.collected || 0
          }
        });
      }
    });
    
    // Listen for life gained events
    this.events.on('lifeGained', (data: { lives: number }) => {
      // Update widgets (with null check)
      if (this.widgetManager && data.lives) {
        for (let i = 0; i < data.lives; i++) {
          this.widgetManager.gainLife();
        }
        this.playerLives += data.lives;
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
      this.time.delayedCall(GameConfig.COMBO_RESET_DELAY, () => {
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

    // Enemy shadows are now handled by EnemyManager
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
    // ── Special / signature moves ─────────────────────────────────────────────
    this.events.on('specialMovePerformed', (data: { x: number; y: number; characterType: string }) => {
      this.visualEffects.createSpecialMoveFlash(data.x, data.y, data.characterType);

      // Character-specific flash colours
      const colors: Record<string, number> = {
        axel: 0x00ff00, blaze: 0xff00ff, max: 0x0088ff, sammy: 0xffff00,
        dario: 0xff6600, zara: 0xff00ff, rex: 0x00ffff, angela: 0xff0088
      };
      const color = colors[data.characterType] ?? 0x00ffff;
      if (data.x && data.y) {
        this.visualEffects.flashSpecialMove(data.x, data.y, color);
        this.visualEffects.createSpecialMoveExplosion(data.x, data.y, color, 'medium');
        this.visualEffects.screenShakeMedium(250);
      } else {
        this.visualEffects.flashScreen(0x00ffff, 80, 0.3);
        this.visualEffects.screenShakeMedium(200);
      }
    });

    this.events.on('signatureMovePerformed', () => {
      this.visualEffects.flashScreen(0xffff00, 100, 0.4);
      this.visualEffects.screenShakeHeavy(250);
    });

    // ── Landing ───────────────────────────────────────────────────────────────
    this.events.on('characterLanded', (data: { x: number; y: number; characterType: string; playerIndex: number }) => {
      this.visualEffects.createLandingEffect(data.x, data.y, 'medium');
    });

    this.events.on('landingPerformed', (data: { x: number; y: number }) => {
      if (data?.x && data?.y) {
        this.visualEffects.createLandingDust(data.x, data.y);
      }
    });

    // ── Hit reactions / damage ────────────────────────────────────────────────
    this.events.on('entityHitReaction', (data: { entity: any; damage: number; x: number; y: number }) => {
      if (data.damage >= 20) {
        this.visualEffects.screenShakeLight(100);
      }
    });

    // ── Knockdown ─────────────────────────────────────────────────────────────
    this.events.on('entityKnockedDown', (data: { entity: any; x: number; y: number }) => {
      this.visualEffects.createLandingEffect(data.x, data.y, 'heavy');
      this.visualEffects.screenShakeMedium(200);
    });

    this.events.on('knockdown', (data?: { x?: number; y?: number }) => {
      if (data?.x && data?.y) {
        this.visualEffects.createImpactEffect(data.x, data.y, true);
        this.visualEffects.createDust(data.x, data.y, 10);
      }
      this.visualEffects.screenShakeHeavy(300);
    });

    // ── Get-up ────────────────────────────────────────────────────────────────
    this.events.on('entityGotUp', (data: { entity: any; x: number; y: number }) => {
      this.visualEffects.createSmoke(data.x, data.y);
    });

    this.events.on('getUpPerformed', (data?: { x?: number; y?: number }) => {
      if (data?.x && data?.y) {
        this.visualEffects.createDust(data.x, data.y, 4);
      }
    });

    // ── Throw ─────────────────────────────────────────────────────────────────
    this.events.on('throwPerformed', (data?: { x?: number; y?: number; isSlam?: boolean }) => {
      if (data?.isSlam) {
        this.audioManager.playSound('knockdown', 0.8);
      }
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

    // Listen for weapon swing events
    this.events.on('weaponSwing', (data: { weapon: any; character: any; x: number; y: number; facingRight: boolean; weaponType: string }) => {
      // Create weapon swing visual effects
      this.visualEffects.createWeaponSwingEffect(data.x, data.y, data.facingRight, data.weaponType);
    });

    // Listen for vault events
    this.events.on('vaultPerformed', (data: { x: number; y: number; target: any }) => {
      // Create vault visual effects
      this.visualEffects.createVaultEffect(data.x, data.y);
    });

    this.events.on('vaultAttack', (data: { x: number; y: number; attacker: any }) => {
      // Create vault attack visual effects
      this.visualEffects.createVaultAttackEffect(data.x, data.y);
      this.audioManager.playSound('punch', 0.7);
    });

    // Listen for parry events
    this.events.on('parrySuccessful', (data: { x: number; y: number; characterType: string; attacker?: any }) => {
      // Create parry visual effects
      this.visualEffects.createParryEffect(data.x, data.y);
      this.audioManager.playSound('special', 0.8); // Special sound for parry
      this.visualEffects.screenShakeLight(50);
    });

    this.events.on('counterAttackPerformed', (data: { x: number; y: number; characterType: string }) => {
      // Create counter attack visual effects
      this.visualEffects.createCounterAttackEffect(data.x, data.y);
      this.audioManager.playSound('special', 1.0); // Strong sound for counter
    });

    // Listen for air combat events
    this.events.on('airComboHit', (data: { playerIndex: number; comboCount: number; x: number; y: number }) => {
      // Visual feedback for air combos
      if (data.comboCount >= 2) {
        this.visualEffects.createAirComboEffect(data.x, data.y, data.comboCount);
      }
    });

    this.events.on('airThrowPerformed', (data: { x: number; y: number; direction: string }) => {
      // Visual effects for air throws
      this.visualEffects.createAirThrowEffect(data.x, data.y);
      this.audioManager.playSound('throw', 1.0);
    });

    // Listen for weapon combo events
    this.events.on('weaponComboHit', (data: { playerIndex: number; comboCount: number; weaponType: string; x: number; y: number }) => {
      // Visual feedback for weapon combos
      this.visualEffects.createWeaponComboEffect(data.x, data.y, data.comboCount, data.weaponType);
    });

    // Listen for throw variation events
    this.events.on('wallBounce', (data: { x: number; y: number; target: any }) => {
      // Visual effects for wall bounces
      this.visualEffects.createWallBounceEffect(data.x, data.y);
      this.audioManager.playSound('punch', 0.8);
    });

    this.events.on('multiEnemyThrow', (data: { x: number; y: number; thrownEnemy: any; hitEnemy: any }) => {
      // Visual effects for multi-enemy throws
      this.visualEffects.createMultiEnemyThrowEffect(data.x, data.y);
      this.audioManager.playSound('throw', 1.0);
    });

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
    this.events.on('entityDamaged', (data: { entity: any; damage: number; x: number; y: number; isHeavy?: boolean; isKnockdown?: boolean; playerIndex?: number }) => {
      const isHeavy = data.isHeavy || data.damage >= 25;
      const isEnemy = data.entity?.sprite?.getData('isEnemy');
      
      // Get combo count for damage multiplier display
      let comboMultiplier = 1;
      if (data.playerIndex !== undefined && this.currentComboCounts.has(data.playerIndex)) {
        const comboCount = this.currentComboCounts.get(data.playerIndex) || 0;
        // Show multiplier for combos of 3 or more
        if (comboCount >= 3) {
          comboMultiplier = Math.min(1 + (comboCount - 2) * 0.1, 2.0); // Cap at 2x
        }
      }
      
      this.visualEffects.createHitMark(data.x, data.y, data.damage, isHeavy);
      // Enhanced damage number with combo multiplier
      this.visualEffects.createDamageNumber(data.x, data.y - 25, data.damage, isHeavy, comboMultiplier);
      // Reduced smoke - only for heavy hits
      if (isHeavy) {
        this.visualEffects.createSmoke(data.x, data.y);
      }
      
      // Blood particles for enemy hits (reduced)
      if (isEnemy) {
        this.visualEffects.createBloodParticles(data.x, data.y, isHeavy ? 4 : 2); // Reduced from 8/4
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
   * Trigger a per-entity hit-reaction: brief tint flash + flinch tween.
   * Global effect listeners (special move, knockdown, throw, etc.) are
   * registered ONCE in setupCombatEffects — NOT here — to avoid listener
   * accumulation on every hit.
   */
  private triggerHitReaction(entity: BaseEntity, isHeavy: boolean, isKnockdown: boolean) {
    if (isKnockdown) return; // knockdown handled by entityKnockedDown path

    const currentState = entity.getState();
    if (currentState === 'attacking' || currentState === 'knockedDown' || currentState === 'dying') {
      return; // Don't interrupt important states
    }

    entity.setState('hitReaction');

    const sprite = entity.sprite;
    const tintColor = isHeavy ? 0xff2222 : 0xff8888;
    sprite.setTint(tintColor);

    const duration = isHeavy ? GameConfig.HIT_STUN_DURATION : GameConfig.HIT_REACTION_DURATION;

    // Flinch scale squish
    const sx = sprite.scaleX;
    const sy = sprite.scaleY;
    this.tweens.add({
      targets: sprite,
      scaleX: sx * (isHeavy ? 1.25 : 1.1),
      scaleY: sy * (isHeavy ? 0.75 : 0.9),
      alpha: 0.7,
      duration: 50,
      yoyo: true,
      ease: 'Power2',
      onComplete: () => {
        if (!sprite || !sprite.active) return;
        sprite.clearTint();
        sprite.setAlpha(1);
        sprite.setScale(sx, sy);
        this.time.delayedCall(duration, () => {
          if (entity.getState() === 'hitReaction') {
            entity.setState('idle');
          }
        });
      }
    });
  }

  private setupAudioEvents() {
    // ── Movement ──────────────────────────────────────────────────────────────
    this.events.on('jumpPerformed', () => {
      this.audioManager.playSound('jump');
    });

    // ── Combat actions ────────────────────────────────────────────────────────
    // NOTE: We intentionally do NOT play a sound on 'attackPerformed'; the
    // impact sound is played in 'entityDamaged' so it is frame-accurate to
    // when the hit actually lands (avoids double-playing punch + hit).

    this.events.on('grabPerformed', () => {
      this.audioManager.playSound('grab', 0.8);
    });

    this.events.on('throwPerformed', () => {
      this.audioManager.playSound('throw', 0.9);
    });

    this.events.on('weaponHit', () => {
      this.audioManager.playSound('weaponHit', 0.85);
    });

    // Weapon swing whoosh (lighter than impact)
    this.events.on('weaponSwing', () => {
      this.audioManager.playSound('weaponHit', 0.4);
    });

    // ── Damage / hit feedback ─────────────────────────────────────────────────
    // Primary impact sound — plays once when a hit connects.
    this.events.on('entityDamaged', (data: { damage: number; isHeavy?: boolean }) => {
      const isHeavy = data.isHeavy || data.damage >= 25;
      if (isHeavy) {
        this.audioManager.playSound('punch', 1.0);  // Heavy thud
      } else {
        this.audioManager.playSound('hit', 0.65);   // Light hit
      }
    });

    // Knockdown — distinct thud sound
    this.events.on('entityKnockedDown', () => {
      this.audioManager.playSound('knockdown', 1.0);
    });

    // Enemy defeated — a final knockout thud (slightly louder, pitch not
    // adjustable without asset work so we just use the knockdown clip).
    this.events.on('entityDefeated', () => {
      this.audioManager.playSound('knockdown', 1.1);
    });

    // ── Special moves ─────────────────────────────────────────────────────────
    this.events.on('specialMovePerformed', () => {
      this.audioManager.playSound('special');
    });

    this.events.on('jumpAttackPerformed', () => {
      this.audioManager.playSound('special', 0.75);
    });

    this.events.on('backAttackPerformed', () => {
      this.audioManager.playSound('punch', 0.9);
    });

    // ── Items ─────────────────────────────────────────────────────────────────
    this.events.on('itemCollected', (data: { rewardDisplay?: any; item: any }) => {
      this.audioManager.playSound('itemPickup', 0.7);

      if (data.rewardDisplay && data.item) {
        this.visualEffects.createItemRewardPopup(
          data.item.sprite.x,
          data.item.sprite.y,
          data.rewardDisplay
        );
      }
    });

    this.events.on('itemRewardPopup', (data: { x: number; y: number; rewardDisplay: any }) => {
      this.visualEffects.createItemRewardPopup(data.x, data.y, data.rewardDisplay);
    });

    // ── Level progression ─────────────────────────────────────────────────────
    this.events.on('knockdown', () => {
      this.audioManager.playSound('knockdown');
    });

    this.events.on('entityHit', () => {
      this.audioManager.playSound('enemyHit', 0.8);
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
    // Don't check game over if game is not fully initialized
    if (!this.isInitialized) {
      return;
    }

    // Don't check game over if no players exist yet
    if (!this.players || this.players.length === 0) {
      return;
    }

    // Don't check game over during cutscenes
    if (this.storyManager && this.storyManager.isCutscenePlaying()) {
      return;
    }

    // Check if all players are dead
    const allPlayersDead = this.players.every(player => player && !player.isAlive());
    
    if (allPlayersDead && this.players.length > 0) {
      // Player died - lose a life
      if (this.playerLives > 0) {
        this.playerLives--;
        if (this.widgetManager) {
          this.widgetManager.loseLife();
        }
        
        // If lives remaining, respawn player using the full reset() which clears
        // all combat state (knockedDown, invincibility, cooldowns, tweens, etc.)
        if (this.playerLives > 0 && this.players[0]) {
          const player = this.players[0];
          const safeX = Math.max(100, this.cameras.main.scrollX + 120);
          // Use the ground Y position — the dead sprite's Y may be off-screen
          const groundY = this.cameras.main.height - GameConfig.GROUND_OFFSET;
          player.reset(safeX, groundY);

          // Update widget manager with restored player
          if (this.widgetManager) {
            this.widgetManager.setPlayer(player);
          }

          return; // Don't game over yet
        }
      }
      
      // No lives remaining — show continue screen
      this.showContinueScreen();
    }

    // Check for victory (all enemies defeated, etc.)
    // This would be implemented based on level completion
  }

  private showContinueScreen() {
    if (this.widgetManager) {
      this.widgetManager.stopClock();
    }
    // Prevent checkGameOver from firing again while continue screen is up
    this.isInitialized = false;
    const gameTime = this.widgetManager ? this.widgetManager.getGameTime() : 0;
    this.scene.pause();
    this.scene.launch('ContinueScene', { score: this.playerScore, time: gameTime });
  }

  /**
   * Called by ContinueScene when the player chooses to continue.
   * Restores lives and health so the game can resume normally.
   */
  public respawnAfterContinue() {
    // Restore lives
    this.playerLives = GameConfig.PLAYER_LIVES;
    if (this.widgetManager) {
      this.widgetManager.setLives(this.playerLives, GameConfig.PLAYER_LIVES);
      this.widgetManager.startClock();
    }

    // Restore player using full reset() to clear all combat state
    if (this.players[0]) {
      const player = this.players[0];
      const safeX = Math.max(100, this.cameras.main.scrollX + 120);
      const groundY = this.cameras.main.height - GameConfig.GROUND_OFFSET;
      player.reset(safeX, groundY);

      if (this.widgetManager) {
        this.widgetManager.setPlayer(player);
      }
    }

    // Re-enable game logic
    this.isInitialized = true;
  }

  private initializeMultiplayer() {
    this.multiplayerClient = new MultiplayerClient();
    
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
      this.handleRemotePlayerUpdate(gameState);
    });

    this.multiplayerClient.onPlayerLeftCallback((playerId) => {
      const sprite = this.remotePlayers.get(playerId);
      if (sprite) {
        sprite.destroy();
        this.remotePlayers.delete(playerId);
        console.log(`[GameScene] Remote player disconnected: ${playerId}`);
      }
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

  private handleRemotePlayerUpdate(gameState: GameState) {
    gameState.players.forEach((playerState: PlayerState, socketId: string) => {
      if (!this.remotePlayers.has(socketId)) {
        this.spawnRemotePlayer(socketId, playerState);
      }
      this.syncRemotePlayer(socketId, playerState);
    });
  }

  /** Create a lightweight sprite for a newly seen remote player. */
  private spawnRemotePlayer(socketId: string, state: PlayerState) {
    const dir = state.facingRight ? 'right' : 'left';
    const textureKey = `${state.character}_idle_${dir}`;
    const key = this.textures.exists(textureKey) ? textureKey : '__DEFAULT';

    const sprite = this.add.sprite(state.x, state.y, key);
    sprite.setOrigin(0.5, 1);
    sprite.setDepth(state.y);
    // Slight blue tint so remote player is distinguishable at a glance
    sprite.setTint(0xaaddff);

    this.remotePlayers.set(socketId, sprite);
    console.log(`[GameScene] Remote player joined: ${socketId} (${state.character})`);
  }

  /** Apply server state to an existing remote player sprite every update. */
  private syncRemotePlayer(socketId: string, state: PlayerState) {
    const sprite = this.remotePlayers.get(socketId);
    if (!sprite || !sprite.active) return;

    sprite.x = state.x;
    sprite.y = state.y;
    sprite.setDepth(state.y);
    sprite.setAlpha(state.state === 'dying' ? 0.35 : 1);

    // Preserve the blue ally tint; shift toward red when critically injured
    sprite.setTint(state.health < 30 ? 0xff8888 : 0xaaddff);

    const dir = state.facingRight ? 'right' : 'left';
    const animKey = this.remoteAnimKey(state.character, state.state, dir);
    if (animKey && this.anims.exists(animKey) &&
        sprite.anims.currentAnim?.key !== animKey) {
      sprite.anims.play(animKey, true);
    }
  }

  /** Map a networked state string to a Phaser animation key. */
  private remoteAnimKey(charType: string, state: string, dir: string): string {
    switch (state) {
      case 'walking':
      case 'running':
        return `${charType}_walk_${dir}`;
      case 'attacking':
      case 'special':
      case 'vaulting':
        return `${charType}_attack_${dir}`;
      case 'jumping':
      case 'falling':
        return `${charType}_jump_${dir}`;
      default:
        return `${charType}_idle_${dir}`;
    }
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
    // Set scene index to 1 (1-based) for intro_scene_1 cutscene condition
    this.storyManager.setSceneIndex(0); // This will be converted to 1-based (scene 1) internally

    // Set character for dialogue
    const player1Char = this.data.get('player1Character') as CharacterType;
    this.storyManager.setCharacter(player1Char);

    // narrative_scene_1 is embedded inside the intro cutscene sequence that
    // showIntroCutscene() fires at INIT_DELAY_VERY_LONG (1000 ms).  The
    // CutsceneTriggerSystem also auto-fires it at INIT_DELAY_LONG (500 ms)
    // from the roomLoaded handler — before the intro plays — which blocks
    // intro_game from ever running.  Pre-mark it so the auto-trigger skips it.
    this.cutsceneTriggerSystem.markTriggered('narrative_scene_1');
  }

  /**
   * Show outro cutscene when game is completed
   */
  /**
   * Calculate score for defeating an entity
   */
  private calculateDefeatScore(entity: BaseEntity): void {
    let baseScore = 0;
    const isEnemy = entity.sprite?.getData('isEnemy');
    const isBoss = entity.sprite?.getData('isBoss');
    
    if (isBoss) {
      baseScore = GameConfig.SCORE_BOSS;
    } else if (isEnemy) {
      // Determine enemy type from sprite data or entity type
      const enemyType = entity.sprite?.getData('enemyType') || 'basic';
      switch (enemyType) {
        case 'galsia':
          baseScore = GameConfig.SCORE_ENEMY_GALSIA;
          break;
        case 'donovan':
          baseScore = GameConfig.SCORE_ENEMY_DONOVAN;
          break;
        default:
          baseScore = GameConfig.SCORE_ENEMY_BASIC;
      }
    } else {
      // Not an enemy or boss, no score
      return;
    }
    
    // Apply combo multiplier if player has active combo
    let comboMultiplier = 1.0;
    if (this.currentComboCounts.size > 0) {
      const maxCombo = Math.max(...Array.from(this.currentComboCounts.values()));
      if (maxCombo >= 3) {
        // 10% bonus per combo hit above 2
        comboMultiplier = 1.0 + ((maxCombo - 2) * (GameConfig.SCORE_COMBO_MULTIPLIER - 1.0));
      }
    }
    
    // Calculate final score
    const finalScore = Math.floor(baseScore * comboMultiplier);
    
    // Accumulate into the running total and update the widget display
    this.playerScore += finalScore;
    if (this.widgetManager) {
      this.widgetManager.addScore(finalScore);
    }
    
    // Show score popup
    if (entity.sprite) {
      this.visualEffects.createScorePopup(
        entity.sprite.x,
        entity.sprite.y - 30,
        finalScore,
        comboMultiplier > 1.0
      );
    }
  }

  private showOutroCutscene(score: number): void {
    // Check for completion outro
    const outroCutscene = this.storyManager.getCutscene('outro_completion');
    if (outroCutscene) {
      this.storyManager.playCutscene(outroCutscene);
      
      // After outro completes, show victory screen
      this.events.once('cutsceneEnded', () => {
        // Check for final outro
        const finalOutro = this.storyManager.getCutscene('outro_end');
        if (finalOutro) {
          this.storyManager.playCutscene(finalOutro);
          this.events.once('cutsceneEnded', () => {
            this.scene.start('GameOverScene', {
              victory: true,
              score: score
            });
          });
        } else {
          // No final outro, go straight to victory screen
          this.scene.start('GameOverScene', {
            victory: true,
            score: score
          });
        }
      });
    } else {
      // No outro cutscene, go straight to victory screen
      this.scene.start('GameOverScene', {
        victory: true,
        score: score
      });
    }
  }

  /**
   * Show intro cutscene when game starts
   */
  private showIntroCutscene(): void {
    console.log('[GameScene] showIntroCutscene called');
    
    // For now, always show intro (can add option to skip if already viewed later)
    // Show main game intro
    const introCutscene = this.storyManager.getCutscene('intro_game');
    
    if (introCutscene) {
      this.storyManager.playCutscene(introCutscene);
      
      // After intro completes, check for scene 1 intro or narrative
      this.events.once('cutsceneEnded', () => {
        // Ensure scene index is set to 1 (0-based = 0) for intro_scene_1 condition
        this.storyManager.setSceneIndex(0); // 0-based index = scene 1 (1-based)
        // Check for scene 1 specific intro
        const scene1Intro = this.storyManager.getCutscene('intro_scene_1');
        if (scene1Intro && !this.storyManager.getFlag('intro_viewed')) {
          this.storyManager.playCutscene(scene1Intro);
          this.events.once('cutsceneEnded', () => {
            this.narrativeSystem.checkAndTriggerNarrative(this.currentLevelIndex);
          });
        } else {
          // No scene 1 intro, just show narrative
          this.narrativeSystem.checkAndTriggerNarrative(this.currentLevelIndex);
        }
      });
    } else {
      // No intro cutscene, just show narrative
      this.narrativeSystem.checkAndTriggerNarrative(this.currentLevelIndex);
    }
  }

  private createHealthBars() {
    // Health bars are now displayed in the HUD, so we don't create overhead health bars for players
    // Boss health bars are still created separately when bosses spawn
    // This method is kept for compatibility but no longer creates player health bars
  }

  update() {
    // Update widget manager (HUD, clock, etc.)
    if (this.widgetManager) {
      this.widgetManager.update();
    }

    // Update story manager (handles cutscene input)
    if (this.storyManager) {
      this.storyManager.update();
    }

    // Don't update game if cutscene is playing
    // This prevents players/enemies from moving while allowing dialogue timers to work
    if (this.storyManager && this.storyManager.isCutscenePlaying()) {
      return;
    }

    // Update scene number based on current level/room
    this.updateSceneNumber();

    // Check for position-based cutscene triggers
    if (this.players.length > 0 && this.cutsceneTriggerSystem) {
      const playerX = this.players[0].sprite.x;
      this.cutsceneTriggerSystem.checkPositionTriggers(playerX);
    }
  }

  /**
   * Update scene number based on current level and room
   */
  private updateSceneNumber(): void {
    if (!this.levelManager || !this.roomManager || !this.cutsceneTriggerSystem) {
      return;
    }

    // Get current room ID from room manager
    const currentRoomId = this.roomManager.getCurrentRoomId();
    
    if (!currentRoomId) {
      return;
    }

    // Extract room number from room ID (e.g., "level1_room3" -> level: 1, room: 3)
    const roomMatch = currentRoomId.match(/level(\d+)_room(\d+)/);
    if (!roomMatch) {
      return;
    }

    const levelNum = parseInt(roomMatch[1], 10);
    const roomNum = parseInt(roomMatch[2], 10);

    // Find scene number from SCENE_TO_LEVEL_MAP
    for (const [sceneNumStr, sceneMap] of Object.entries(SCENE_TO_LEVEL_MAP)) {
      const sceneMapTyped = sceneMap as { level: number; room: number; name: string };
      if (sceneMapTyped.level === levelNum && sceneMapTyped.room === roomNum) {
            const sceneNumber = parseInt(sceneNumStr, 10);
            if (this.cutsceneTriggerSystem.getSceneNumber() !== sceneNumber) {
              this.cutsceneTriggerSystem.setSceneNumber(sceneNumber);
              
              // Check for automatic triggers when scene changes
              this.time.delayedCall(100, () => {
                if (this.cutsceneTriggerSystem) {
                  this.cutsceneTriggerSystem.checkAutomaticTriggers();
                }
              });
            }
        break;
      }
    }

    // Check for pause
    if (this.input.keyboard?.checkDown(this.input.keyboard.addKey('P'))) {
      if (!this.scene.isPaused('PauseScene')) {
        this.scene.pause();
        // Pause clock when game is paused
        if (this.widgetManager) {
          this.widgetManager.stopClock();
        }
        this.scene.launch('PauseScene', { gameSceneKey: 'GameScene' });
      }
    }

    // Handle input and update all players (using PlayerUpdateManager)
    if (this.playerUpdateManager) {
      this.playerUpdateManager.update();

      // Send player state updates to server
      if (this.players[0]) {
        this.playerUpdateManager.sendPlayerStateUpdate(this.players[0]);
      }
    }

    // Update all entities
    if (this.entityManager) {
      this.entityManager.update();
    }

    // Update player depths and enforce physics constraints (consolidated loop)
    this.updatePlayersPostPhysics();

    // Update weapon manager
    if (this.weaponManager) {
      this.weaponManager.update();
    }

    // Update item manager (with players for magnetic collection)
    if (this.itemManager) {
      this.itemManager.update(this.players);
    }

    // Update random item spawner
    if (this.randomItemSpawner && this.players.length > 0) {
      const playerX = this.players[0].sprite.x;
      this.randomItemSpawner.update(playerX);
    }

    // Update spawn tracker with active counts (every frame for real-time stats)
    if (this.spawnTracker && this.weaponManager && this.itemManager) {
      const activeWeapons = this.weaponManager.getActiveCount();
      const activeItems = this.itemManager.getActiveCount();
      this.spawnTracker.updateActiveCounts(activeWeapons, activeItems);
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
      
      // Check for room transitions (only if not already transitioning)
      const transition = this.roomManager.checkRoomTransition(playerX, playerY);
      if (transition.transition) {
        // Transition will be handled by RoomManager
        // Player position will be updated in roomTransitionComplete event
        // This prevents immediate re-triggering
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
    
    // Update enemy AI (handled by EnemyManager)
    if (this.enemyManager) {
      this.enemyManager.update();
    }

    // Health bars are now in the HUD - no need to update overhead health bars
    // Boss health bars are updated separately

    // Update bosses (handled by BossManager)
    if (this.bossManager) {
      this.bossManager.update();
      this.bossManager.updateHealthBar();
    }
    
    // Periodic cleanup of arrays (every N frames instead of every frame)
    this.cleanupCounter++;
    if (this.cleanupCounter >= GameConfig.CLEANUP_FREQUENCY) {
      this.cleanupCounter = 0;
      this.cleanupEntityArrays();
    }

    // Boss health bar update is now handled by BossManager

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

    // Update enemy shadows (handled by EnemyManager)
    if (this.enemyManager) {
      this.enemyManager.updateShadows();
    }
  }

  private checkVictory() {
    if (!this.levelManager) return;
    if (this.levelCompleteTriggered) return; // Already handled — don't emit every frame

    // If a boss is alive, don't use wave/enemy tracking to end the level.
    // The bossDefeated handler will emit levelEndReached when the boss dies.
    // This also prevents the endTriggerX position check from completing the level
    // while a boss fight is still in progress.
    if (this.bossManager && this.bossManager.getCount() > 0) return;

    // Use the LevelManager as the authoritative source on remaining enemies.
    // EntityManager is NOT reliable here because dying enemies are detached
    // from it before their visual death-sequence finishes.
    const remainingEnemies = this.levelManager.getRemainingEnemiesCount();
    const hasSpawnedEnemies = this.levelManager.getTotalEnemiesSpawned() > 0;
    const allEnemiesDefeated = hasSpawnedEnemies && remainingEnemies === 0;

    const isLevelComplete = this.levelManager.isLevelComplete(allEnemiesDefeated);

    if (isLevelComplete) {
      this.levelCompleteTriggered = true;
      this.events.emit('levelEndReached');
    }
  }

  /**
   * Progress to next level (called after level transition)
   */
  private progressToNextLevel() {
    if (!this.levelManager) return;

    // Reset so checkVictory can fire again for the next level
    this.levelCompleteTriggered = false;

    const currentLevelIndex = this.levelManager.getCurrentLevel() - 1;
    const nextLevelIndex = currentLevelIndex + 1;
    this.currentLevelIndex = nextLevelIndex;
    
    // Check if there's a next level
    if (nextLevelIndex < LEVEL_CONFIGS.length) {
      // Progress to next level
      console.log(`[GameScene] Level ${currentLevelIndex + 1} complete! Progressing to level ${nextLevelIndex + 1}...`);
      
      // Play level complete sound then switch to next level's music
      if (this.audioManager) {
        this.audioManager.playSound('levelAdvance');
        this.audioManager.playMusicWithContext(this.getLevelMusicTrack(nextLevelIndex), MusicContext.GAMEPLAY, true);
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

      // Fade in and show level title card
      this.cameras.main.fadeIn(600, 0, 0, 0);
      this.showLevelTitleCard(nextLevelIndex);
    } else {
      // All levels complete - victory!
      console.log('[GameScene] All levels complete! Victory!');
      const score = this.playerScore;
      
      // Set completion flags
      if (this.storyManager) {
        this.storyManager.setFlag('game_completed', true);
        this.storyManager.setFlag('story_complete', true);
      }
      
      // Show outro cutscene before victory screen
      this.showOutroCutscene(score);
    }
  }


  /**
   * Map a 0-based level index to the music track key for that level.
   * Level 3 reuses the level2 track since no dedicated asset exists yet.
   */
  private getLevelMusicTrack(levelIndex: number): string {
    const tracks = ['level1', 'level2', 'level2'];
    return tracks[levelIndex] ?? 'level1';
  }

  /**
   * Display an arcade-style level title card ("STAGE X — LEVEL NAME") that
   * fades in, holds, then fades out. Rendered in screen space so it stays
   * centred regardless of camera position.
   */
  private showLevelTitleCard(levelIndex: number) {
    const { width, height } = this.cameras.main;
    const stageNum = levelIndex + 1;
    const levelName = LEVEL_CONFIGS[levelIndex]?.name?.toUpperCase() ?? `STAGE ${stageNum}`;
    const stageLabel = `STAGE ${stageNum}`;

    // Semi-transparent backing bar (full width, ~80px tall)
    const barHeight = 80;
    const bar = this.add.rectangle(width / 2, height / 2, width, barHeight, 0x000000, 0.75)
      .setScrollFactor(0)
      .setDepth(1000)
      .setAlpha(0);

    // Stage number (e.g. "STAGE 2")
    const stageText = this.add.text(width / 2 - 8, height / 2 - 12, stageLabel, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '20px',
      color: '#ffcc00',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(1001).setAlpha(0);

    // Level name (e.g. "INDUSTRIAL DISTRICT")
    const nameText = this.add.text(width / 2 + 8, height / 2 + 16, `— ${levelName} —`, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '11px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(1001).setAlpha(0);

    const FADE_IN  = 300;
    const HOLD     = 1800;
    const FADE_OUT = 500;

    // Fade in all three objects together
    this.tweens.add({
      targets: [bar, stageText, nameText],
      alpha: 1,
      duration: FADE_IN,
      ease: 'Linear',
      onComplete: () => {
        // Hold, then fade out and destroy
        this.time.delayedCall(HOLD, () => {
          this.tweens.add({
            targets: [bar, stageText, nameText],
            alpha: 0,
            duration: FADE_OUT,
            ease: 'Linear',
            onComplete: () => {
              bar.destroy();
              stageText.destroy();
              nameText.destroy();
            }
          });
        });
      }
    });
  }

  /**
   * Update player depths and enforce physics constraints after physics step
   * Consolidated from multiple forEach loops for better performance
   */
  private updatePlayersPostPhysics(): void {
    const roomHeight = this.roomManager?.getRoomHeight() || this.cameras.main.height;
    const groundRangeTop = roomHeight - GameConfig.GROUND_HEIGHT_RANGE;
    const groundRangeBottom = roomHeight;

    this.players.forEach((player, index) => {
      if (!player || !player.sprite || !player.sprite.active) {
        return;
      }

      // Update depth for proper layering
      player.sprite.setDepth(player.sprite.y);

      // Enforce zero velocity/gravity for vertical movement AFTER physics step
      const body = player.sprite.body as Phaser.Physics.Arcade.Body;
      if (!body) return;

      const isInGroundRange = player.sprite.y >= groundRangeTop && player.sprite.y <= groundRangeBottom;
      const currentInput = this.inputManager.getPlayerInput(index);
      const isMovingVertically = currentInput.up || currentInput.down;

      // If in ground range and not moving vertically, enforce zero velocity/gravity
      if (isInGroundRange && !isMovingVertically) {
        // Force zero velocity and gravity IMMEDIATELY
        body.setVelocityY(0);
        body.setGravityY(0);

        // Also restore position if it has drifted significantly
        const storedY = (player as any).lastStableY;
        if (storedY !== undefined && Math.abs(player.sprite.y - storedY) > 0.1) {
          player.sprite.setPosition(player.sprite.x, storedY);
          body.setVelocityY(0);
        } else {
          // Store current Y as stable position (only if not drifting)
          if (Math.abs(body.velocity.y) < 0.1 && Math.abs(body.gravity.y) < 0.1) {
            (player as any).lastStableY = player.sprite.y;
          }
        }
      } else if (isMovingVertically) {
        // Clear stored position when moving
        (player as any).lastStableY = undefined;
      }
    });
  }

  /**
   * Periodic cleanup of entity arrays (removes stale references)
   * Called every N frames instead of every frame for performance
   */
  private cleanupEntityArrays(): void {
    // Clean up enemies array (handled by EnemyManager)
    if (this.enemyManager) {
      this.enemyManager.cleanup();
    }
    
    // Clean up bosses array (handled by BossManager)
    if (this.bossManager) {
      this.bossManager.cleanup();
    }
  }

  private cleanupLevelEntities() {
    // Clean up enemies (handled by EnemyManager)
    if (this.enemyManager) {
      this.enemyManager.clear();
    }
    
    // Clean up weapons via manager (handles pool properly)
    if (this.weaponManager) {
      this.weaponManager.clear();
    }

    // Clean up items via manager (releases back to pool, doesn't destroy sprites)
    if (this.itemManager) {
      this.itemManager.clear();
    }

    // (EnemyManager.clear() already handles shadows — no second call needed)
  }

  /**
   * Clean up when scene is destroyed
   */
  shutdown() {
    // Reset initialization flag
    this.isInitialized = false;

    // Ensure player input is never stuck frozen across scene restarts
    if (this.playerUpdateManager) {
      this.playerUpdateManager.setInputFrozen(false);
    }

    // Stop mobile controls overlay if it was launched
    if (this.scene.isActive('MobileControlsScene')) {
      this.scene.stop('MobileControlsScene');
    }

    // Clean up event listeners to prevent memory leaks
    this.cleanupEventListeners();
    
    // Clear all arrays
    this.players = [];
    this.comboCounters = [];
    this.weaponIndicators = [];
    this.playerShadows.clear();
    this.currentComboCounts.clear();
    
    // Clean up managers
    if (this.enemyManager) {
      this.enemyManager.destroy();
    }
    if (this.bossManager) {
      this.bossManager.destroy();
    }
    if (this.playerUpdateManager) {
      // PlayerUpdateManager doesn't have event listeners, just clear references
    }
    if (this.inputManager) {
      this.inputManager.destroy();
    }
    if (this.entityManager) {
      this.entityManager.clear();
    }
    if (this.weaponManager) {
      this.weaponManager.clear();
    }
    if (this.itemManager) {
      this.itemManager.destroy();
    }
    if (this.enemyPool) {
      this.enemyPool.clear();
    }
    if (this.weaponPool) {
      this.weaponPool.clear();
    }
    if (this.itemPool) {
      this.itemPool.clear();
    }
    if (this.multiplayerClient) {
      this.multiplayerClient.disconnect();
    }
    this.remotePlayers.forEach(sprite => sprite.destroy());
    this.remotePlayers.clear();
    if (this.audioManager) {
      this.audioManager.stopMusic();
      this.audioManager.destroy();
    }
    if (this.widgetManager) {
      this.widgetManager.destroy();
    }
    if (this.levelManager) {
      this.levelManager.destroy();
    }
    if (this.roomManager) {
      // RoomManager cleanup if needed
    }
    if (this.visualEffects) {
      // VisualEffects cleanup if needed
    }
  }

  /**
   * Clean up all event listeners to prevent memory leaks
   */
  private cleanupEventListeners(): void {
    // Level events
    this.events.off('roomLoaded');
    this.events.off('roomTransitionStart');
    this.events.off('roomTransitionComplete');
    this.events.off('levelStarted');
    this.events.off('levelTransitionComplete');
    this.events.off('entityDefeated');
    this.events.off('bossDefeated');
    this.events.off('bossEntranceStart');
    this.events.off('bossEntranceEnd');
    this.events.off('weaponSpawned');
    this.events.off('itemSpawned');
    this.events.off('waveStarted');
    this.events.off('waveCompleted');
    this.events.off('checkpointActivated');
    this.events.off('levelChanged');
    this.events.off('levelEndReached');
    this.events.off('levelEndReached_legacy');
    
    // Combat events
    this.events.off('hitboxCreated');
    this.events.off('hitStop');
    this.events.off('entityDamaged');
    this.events.off('entityDefeated');
    this.events.off('entityHitReaction');
    this.events.off('entityKnockedDown');
    this.events.off('entityGotUp');
    this.events.off('comboHit');
    this.events.off('comboReset');
    this.events.off('signatureMovePerformed');
    this.events.off('landingPerformed');
    this.events.off('getUpPerformed');
    this.events.off('knockdown');

    // Audio events
    this.events.off('specialMovePerformed');
    this.events.off('jumpPerformed');
    this.events.off('grabPerformed');
    this.events.off('throwPerformed');
    this.events.off('weaponHit');
    this.events.off('weaponSwing');
    this.events.off('itemCollected');
    this.events.off('entityHit');
    this.events.off('jumpAttackPerformed');
    this.events.off('backAttackPerformed');
    this.events.off('levelAdvance');
    this.events.off('levelUp');
    this.events.off('scoreUpdated');
    this.events.off('livesUpdated');
    this.events.off('lifeGained');
    this.events.off('itemRewardPopup');
    
    // Settings events
    this.events.off('musicVolumeChanged');
    this.events.off('sfxVolumeChanged');
    this.events.off('musicEnabledChanged');
    this.events.off('sfxEnabledChanged');
    
    // Combat VFX events (were missing from cleanup — caused doubling on scene restart)
    this.events.off('characterLanded');
    this.events.off('vaultPerformed');
    this.events.off('vaultAttack');
    this.events.off('parrySuccessful');
    this.events.off('counterAttackPerformed');
    this.events.off('airComboHit');
    this.events.off('airThrowPerformed');
    this.events.off('weaponComboHit');
    this.events.off('wallBounce');
    this.events.off('multiEnemyThrow');
    this.events.off('weaponPickedUp');
    this.events.off('spawnStatsUpdated');

    // Story events (handled by story systems, but clean up if needed)
    this.events.off('cutsceneEnded');
  }
}

