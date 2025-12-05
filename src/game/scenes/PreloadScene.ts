import Phaser from 'phaser';
import { CHARACTER_SPRITE_MAP } from '../../systems/animation/SpriteLoader';
import { CharacterType } from '../types/CharacterType';
import { SOUND_EFFECTS, MUSIC_TRACKS } from '../../config/AudioConfig';

/**
 * Preload scene for loading all game assets
 */
export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload() {
    const { width, height } = this.cameras.main;

    // Configure CORS for loading images
    this.load.setCORS('anonymous');

    // Loading text
    const loadingText = this.add.text(width / 2, height / 2 - 50, 'Loading...', {
      fontSize: '32px',
      fontFamily: 'Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(width / 2 - 160, height / 2, 320, 50);

    // Load character sprites
    this.loadCharacterSprites();

    // Load enemy sprites
    this.loadEnemySprites();

    // Load item sprites
    this.loadItemSprites();

    // Load audio files
    this.loadAudioFiles();

    // Progress tracking
    this.load.on('progress', (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(0xffffff, 1);
      progressBar.fillRect(width / 2 - 150, height / 2 + 10, 300 * value, 30);
    });

    this.load.on('complete', () => {
      // Apply pixel-perfect filtering to all loaded textures
      // Iterate over texture manager's texture list (it's an object, not an array)
      const textureManager = this.textures;
      const textureList = textureManager.list as Record<string, Phaser.Textures.Texture>;
      const textureKeys = Object.keys(textureList);
      textureKeys.forEach((key) => {
        const texture = textureList[key];
        if (texture && typeof texture.setFilter === 'function') {
          texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
        }
      });
      
      progressBar.destroy();
      progressBox.destroy();
      loadingText.setText('Complete!');
    });
  }

  create() {
    // Create animations from loaded sprites
    this.createCharacterAnimations();
    
    // Create enemy animations
    this.createEnemyAnimations();

    // Start the main menu
    this.scene.start('MainMenuScene');
  }

  /**
   * Load all character sprites
   */
  private loadCharacterSprites() {
    const characterTypes: CharacterType[] = ['axel', 'blaze', 'max', 'sammy'];

    for (const charType of characterTypes) {
      const spriteFolder = CHARACTER_SPRITE_MAP[charType];
      this.loadCharacterSprite(charType, spriteFolder);
    }
  }

  /**
   * Load sprites for a specific character
   */
  private loadCharacterSprite(charType: CharacterType, spriteFolder: string): void {
    const basePath = `assets/sprites/imgs/${spriteFolder}`;

    try {
      if (spriteFolder === 'dario') {
        this.loadDarioSprites(charType, basePath);
      } else if (spriteFolder === 'zara') {
        this.loadZaraSprites(charType, basePath);
      } else if (spriteFolder === 'rex') {
        this.loadRexSprites(charType, basePath);
      } else if (spriteFolder === 'angela') {
        this.loadAngelaSprites(charType, basePath);
      }
    } catch (error) {
      console.warn(`[PreloadScene] Failed to load sprites for ${charType} (${spriteFolder}):`, error);
    }
  }

  /**
   * Load Dario sprites (for Axel)
   */
  private loadDarioSprites(charType: CharacterType, basePath: string): void {
    // Idle
    this.load.image(`${charType}_idle_left`, `${basePath}/PL.gif`);
    this.load.image(`${charType}_idle_right`, `${basePath}/PR.gif`);

    // Walking
    this.load.image(`${charType}_walk_left_1`, `${basePath}/Lw1.gif`);
    this.load.image(`${charType}_walk_left_2`, `${basePath}/Lw2.gif`);
    this.load.image(`${charType}_walk_left_3`, `${basePath}/Lw3.gif`);
    this.load.image(`${charType}_walk_left_4`, `${basePath}/Lw4.gif`);
    
    this.load.image(`${charType}_walk_right_1`, `${basePath}/Rw1.gif`);
    this.load.image(`${charType}_walk_right_2`, `${basePath}/Rw2.gif`);
    this.load.image(`${charType}_walk_right_3`, `${basePath}/Rw3.gif`);
    this.load.image(`${charType}_walk_right_4`, `${basePath}/Rw4.gif`);

    // Jump
    this.load.image(`${charType}_jump_left`, `${basePath}/J1.gif`);
    this.load.image(`${charType}_jump_right`, `${basePath}/J2.gif`);

    // Attack
    this.load.image(`${charType}_attack_left_1`, `${basePath}/PDL1.gif`);
    this.load.image(`${charType}_attack_left_2`, `${basePath}/PDL2.gif`);
    this.load.image(`${charType}_attack_left_3`, `${basePath}/PDL3.gif`);
    this.load.image(`${charType}_attack_left_4`, `${basePath}/PDL4.gif`);
    
    this.load.image(`${charType}_attack_right_1`, `${basePath}/PDR1.gif`);
    this.load.image(`${charType}_attack_right_2`, `${basePath}/PDR2.gif`);
    this.load.image(`${charType}_attack_right_3`, `${basePath}/PDR3.gif`);
    this.load.image(`${charType}_attack_right_4`, `${basePath}/PDR4.gif`);

    // Jump attack (special move)
    this.load.image(`${charType}_jump_attack_left`, `${basePath}/PDLJump.gif`);
    this.load.image(`${charType}_jump_attack_right`, `${basePath}/PDRJump.gif`);
    
    // Punch jump (back attack)
    this.load.image(`${charType}_punch_jump_left`, `${basePath}/PDLPunch.gif`);
    this.load.image(`${charType}_punch_jump_right`, `${basePath}/PDRPunch.gif`);
  }

  /**
   * Load Zara sprites (for Blaze)
   */
  private loadZaraSprites(charType: CharacterType, basePath: string): void {
    this.load.image(`${charType}_idle_left`, `${basePath}/Zara-idle-left.png`);
    this.load.image(`${charType}_idle_right`, `${basePath}/Zara-idle-right.png`);
    this.load.image(`${charType}_walk_left_1`, `${basePath}/Zara-walk-left-1.png`);
    this.load.image(`${charType}_walk_left_2`, `${basePath}/Zara-walk-left-2.png`);
    this.load.image(`${charType}_walk_right_1`, `${basePath}/Zara-walk-right-1.png`);
    this.load.image(`${charType}_walk_right_2`, `${basePath}/Zara-walk-right-2.png`);
    this.load.image(`${charType}_attack_left`, `${basePath}/Zara-attack-left.png`);
    this.load.image(`${charType}_attack_right`, `${basePath}/Zara-attack-right.png`);
  }

  /**
   * Load Rex sprites (for Max)
   */
  private loadRexSprites(charType: CharacterType, basePath: string): void {
    this.load.image(`${charType}_idle_left`, `${basePath}/rex-idle-left.png`);
    this.load.image(`${charType}_idle_right`, `${basePath}/rex-idle-right.png`);
    this.load.image(`${charType}_walk_left_1`, `${basePath}/rex-walk-left-1.png`);
    this.load.image(`${charType}_walk_left_2`, `${basePath}/rex-walk-left-2.png`);
    this.load.image(`${charType}_walk_right_1`, `${basePath}/rex-walk-right-1.png`);
    this.load.image(`${charType}_walk_right_2`, `${basePath}/rex-walk-right-2.png`);
    this.load.image(`${charType}_attack_left`, `${basePath}/rex-attack-left.png`);
    this.load.image(`${charType}_attack_right`, `${basePath}/rex-attack-right.png`);
  }

  /**
   * Load Angela sprites (for Sammy)
   */
  private loadAngelaSprites(charType: CharacterType, basePath: string): void {
    this.load.image(`${charType}_idle_left`, `${basePath}/AL1.gif`);
    this.load.image(`${charType}_walk_left_1`, `${basePath}/AL2.gif`);
    this.load.image(`${charType}_walk_left_2`, `${basePath}/AL3.gif`);
    
    this.load.image(`${charType}_idle_right`, `${basePath}/AR1.gif`);
    this.load.image(`${charType}_walk_right_1`, `${basePath}/AR2.gif`);
    this.load.image(`${charType}_walk_right_2`, `${basePath}/AR3.gif`);

    // Use walk frames for attack
    this.load.image(`${charType}_attack_left`, `${basePath}/AL3.gif`);
    this.load.image(`${charType}_attack_right`, `${basePath}/AR3.gif`);
  }

  /**
   * Load enemy sprites
   */
  private loadEnemySprites(): void {
    // Load civi sprites (basic enemy) - walking animation frames
    const civiWalkFrames = ['C11', 'C12', 'C13', 'C14'];
    civiWalkFrames.forEach((frame, index) => {
      this.load.image(`enemy_basic_walk_${index + 1}`, `assets/sprites/imgs/civi/${frame}.gif`);
    });
    
    // Load civi attack frames
    const civiAttackFrames = ['C21', 'C22', 'C23', 'C24'];
    civiAttackFrames.forEach((frame, index) => {
      this.load.image(`enemy_basic_attack_${index + 1}`, `assets/sprites/imgs/civi/${frame}.gif`);
    });
    
    // Load police sprites (galsia enemy) - actual file names
    this.load.image('enemy_galsia_idle_left', 'assets/sprites/imgs/police/police-left.gif');
    this.load.image('enemy_galsia_idle_right', 'assets/sprites/imgs/police/police-right.gif');
    this.load.image('enemy_galsia_walk_left', 'assets/sprites/imgs/police/police-walk-left.gif');
    this.load.image('enemy_galsia_walk_right', 'assets/sprites/imgs/police/police-walk-right.gif');
    
    // Load prison-civi sprites (donovan enemy) - actual file names
    const prisonCiviFrames = ['PC11', 'PC12', 'PC13', 'PC14'];
    prisonCiviFrames.forEach((frame, index) => {
      this.load.image(`enemy_donovan_walk_${index + 1}`, `assets/sprites/imgs/prison-civi/${frame}.gif`);
    });
    
    // Use PC21 for attack
    this.load.image('enemy_donovan_attack_1', 'assets/sprites/imgs/prison-civi/PC21.gif');
  }

  /**
   * Load item sprites
   */
  private loadItemSprites(): void {
    // Load pickup sprites
    this.load.image('item_apple', 'assets/sprites/imgs/pickups/apple.png');
    this.load.image('item_chicken', 'assets/sprites/imgs/pickups/juice-can.png'); // Using juice can as chicken placeholder
    this.load.image('item_money', 'assets/sprites/imgs/pickups/football.png'); // Using football as money placeholder
  }

  /**
   * Create animations from loaded sprites
   */
  private createCharacterAnimations(): void {
    const characterTypes: CharacterType[] = ['axel', 'blaze', 'max', 'sammy'];

    for (const charType of characterTypes) {
      this.createCharacterAnimationsForType(charType);
    }
  }

  /**
   * Create animations for a specific character type
   */
  private createCharacterAnimationsForType(charType: CharacterType): void {
    const spriteFolder = CHARACTER_SPRITE_MAP[charType];

    if (spriteFolder === 'dario') {
      this.createDarioAnimations(charType);
    } else if (spriteFolder === 'zara') {
      this.createZaraAnimations(charType);
    } else if (spriteFolder === 'rex') {
      this.createRexAnimations(charType);
    } else if (spriteFolder === 'angela') {
      this.createAngelaAnimations(charType);
    }
  }

  /**
   * Create Dario animations (for Axel)
   */
  private createDarioAnimations(charType: CharacterType): void {
    // Idle animations
    ['left', 'right'].forEach(dir => {
      if (this.textures.exists(`${charType}_idle_${dir}`)) {
        this.anims.create({
          key: `${charType}_idle_${dir}`,
          frames: [{ key: `${charType}_idle_${dir}` }],
          frameRate: 1,
          repeat: -1
        });
      }
    });

    // Walking animations
    ['left', 'right'].forEach(dir => {
      const frames = [1, 2, 3, 4].map(i => {
        const key = `${charType}_walk_${dir}_${i}`;
        return this.textures.exists(key) ? { key } : null;
      }).filter(f => f !== null) as Phaser.Types.Animations.AnimationFrame[];

      if (frames.length > 0) {
        this.anims.create({
          key: `${charType}_walk_${dir}`,
          frames,
          frameRate: 8,
          repeat: -1
        });
      }
    });

    // Jump animations
    ['left', 'right'].forEach(dir => {
      if (this.textures.exists(`${charType}_jump_${dir}`)) {
        this.anims.create({
          key: `${charType}_jump_${dir}`,
          frames: [{ key: `${charType}_jump_${dir}` }],
          frameRate: 1,
          repeat: 0
        });
      }
    });

    // Attack animations
    ['left', 'right'].forEach(dir => {
      const frames = [1, 2, 3, 4].map(i => {
        const key = `${charType}_attack_${dir}_${i}`;
        return this.textures.exists(key) ? { key } : null;
      }).filter(f => f !== null) as Phaser.Types.Animations.AnimationFrame[];

      if (frames.length > 0) {
        this.anims.create({
          key: `${charType}_attack_${dir}`,
          frames,
          frameRate: 12,
          repeat: 0
        });
      }
    });
    
    // Jump attack animations (for Dario/Axel)
    ['left', 'right'].forEach(dir => {
      const jumpAttackKey = `${charType}_jump_attack_${dir}`;
      if (this.textures.exists(jumpAttackKey)) {
        this.anims.create({
          key: jumpAttackKey,
          frames: [{ key: jumpAttackKey }],
          frameRate: 12,
          repeat: 0
        });
      }
    });
  }

  /**
   * Create Zara animations (for Blaze)
   */
  private createZaraAnimations(charType: CharacterType): void {
    // Idle
    ['left', 'right'].forEach(dir => {
      if (this.textures.exists(`${charType}_idle_${dir}`)) {
        this.anims.create({
          key: `${charType}_idle_${dir}`,
          frames: [{ key: `${charType}_idle_${dir}` }],
          frameRate: 1,
          repeat: -1
        });
      }
    });

    // Walking
    ['left', 'right'].forEach(dir => {
      const frames = [1, 2].map(i => {
        const key = `${charType}_walk_${dir}_${i}`;
        return this.textures.exists(key) ? { key } : null;
      }).filter(f => f !== null) as Phaser.Types.Animations.AnimationFrame[];

      if (frames.length > 0) {
        this.anims.create({
          key: `${charType}_walk_${dir}`,
          frames,
          frameRate: 8,
          repeat: -1
        });
      }
    });

    // Attack
    ['left', 'right'].forEach(dir => {
      if (this.textures.exists(`${charType}_attack_${dir}`)) {
        this.anims.create({
          key: `${charType}_attack_${dir}`,
          frames: [{ key: `${charType}_attack_${dir}` }],
          frameRate: 12,
          repeat: 0
        });
      }
    });
  }

  /**
   * Create Rex animations (for Max)
   */
  private createRexAnimations(charType: CharacterType): void {
    // Same structure as Zara
    this.createZaraAnimations(charType);
  }

  /**
   * Create Angela animations (for Sammy)
   */
  private createAngelaAnimations(charType: CharacterType): void {
    // Idle
    ['left', 'right'].forEach(dir => {
      if (this.textures.exists(`${charType}_idle_${dir}`)) {
        this.anims.create({
          key: `${charType}_idle_${dir}`,
          frames: [{ key: `${charType}_idle_${dir}` }],
          frameRate: 1,
          repeat: -1
        });
      }
    });

    // Walking
    ['left', 'right'].forEach(dir => {
      const frames = [1, 2].map(i => {
        const key = `${charType}_walk_${dir}_${i}`;
        return this.textures.exists(key) ? { key } : null;
      }).filter(f => f !== null) as Phaser.Types.Animations.AnimationFrame[];

      if (frames.length > 0) {
        this.anims.create({
          key: `${charType}_walk_${dir}`,
          frames,
          frameRate: 8,
          repeat: -1
        });
      }
    });

    // Attack
    ['left', 'right'].forEach(dir => {
      if (this.textures.exists(`${charType}_attack_${dir}`)) {
        this.anims.create({
          key: `${charType}_attack_${dir}`,
          frames: [{ key: `${charType}_attack_${dir}` }],
          frameRate: 12,
          repeat: 0
        });
      }
    });
  }

  /**
   * Create enemy animations
   */
  private createEnemyAnimations(): void {
    // Basic enemy (civi) animations
    this.createBasicEnemyAnimations();
    
    // Galsia enemy animations
    this.createGalsiaEnemyAnimations();
    
    // Donovan enemy animations
    this.createDonovanEnemyAnimations();
  }

  /**
   * Create basic enemy (civi) animations
   */
  private createBasicEnemyAnimations(): void {
    // Idle (use first walk frame)
    ['left', 'right'].forEach(dir => {
      if (this.textures.exists('enemy_basic_walk_1')) {
        this.anims.create({
          key: `enemy_basic_idle_${dir}`,
          frames: [{ key: 'enemy_basic_walk_1' }],
          frameRate: 1,
          repeat: -1
        });
      }
    });

    // Walking animation
    ['left', 'right'].forEach(dir => {
      const frames = [1, 2, 3, 4].map(i => {
        const key = `enemy_basic_walk_${i}`;
        return this.textures.exists(key) ? { key } : null;
      }).filter(f => f !== null) as Phaser.Types.Animations.AnimationFrame[];

      if (frames.length > 0) {
        this.anims.create({
          key: `enemy_basic_walk_${dir}`,
          frames,
          frameRate: 8,
          repeat: -1
        });
      }
    });

    // Attack animation
    ['left', 'right'].forEach(dir => {
      const frames = [1, 2, 3, 4].map(i => {
        const key = `enemy_basic_attack_${i}`;
        return this.textures.exists(key) ? { key } : null;
      }).filter(f => f !== null) as Phaser.Types.Animations.AnimationFrame[];

      if (frames.length > 0) {
        this.anims.create({
          key: `enemy_basic_attack_${dir}`,
          frames,
          frameRate: 12,
          repeat: 0
        });
      }
    });
  }

  /**
   * Create Galsia enemy animations
   */
  private createGalsiaEnemyAnimations(): void {
    // Use police sprites - actual file names
    ['left', 'right'].forEach(dir => {
      // Idle
      const idleKey = `enemy_galsia_idle_${dir}`;
      if (this.textures.exists(idleKey)) {
        this.anims.create({
          key: idleKey,
          frames: [{ key: idleKey }],
          frameRate: 1,
          repeat: -1
        });
      }

      // Walking
      const walkKey = `enemy_galsia_walk_${dir}`;
      if (this.textures.exists(walkKey)) {
        this.anims.create({
          key: walkKey,
          frames: [{ key: walkKey }],
          frameRate: 8,
          repeat: -1
        });
      }

      // Attack (use walk frame for now)
      if (this.textures.exists(walkKey)) {
        this.anims.create({
          key: `enemy_galsia_attack_${dir}`,
          frames: [{ key: walkKey }],
          frameRate: 12,
          repeat: 0
        });
      }
    });
  }

  /**
   * Create Donovan enemy animations
   */
  private createDonovanEnemyAnimations(): void {
    // Use prison-civi sprites - actual file names
    ['left', 'right'].forEach(dir => {
      // Idle (use first walk frame)
      if (this.textures.exists('enemy_donovan_walk_1')) {
        this.anims.create({
          key: `enemy_donovan_idle_${dir}`,
          frames: [{ key: 'enemy_donovan_walk_1' }],
          frameRate: 1,
          repeat: -1
        });
      }

      // Walking
      const walkFrames = [1, 2, 3, 4].map(i => {
        const key = `enemy_donovan_walk_${i}`;
        return this.textures.exists(key) ? { key } : null;
      }).filter(f => f !== null) as Phaser.Types.Animations.AnimationFrame[];

      if (walkFrames.length > 0) {
        this.anims.create({
          key: `enemy_donovan_walk_${dir}`,
          frames: walkFrames,
          frameRate: 8,
          repeat: -1
        });
      }

      // Attack
      if (this.textures.exists('enemy_donovan_attack_1')) {
        this.anims.create({
          key: `enemy_donovan_attack_${dir}`,
          frames: [{ key: 'enemy_donovan_attack_1' }],
          frameRate: 12,
          repeat: 0
        });
      }
    });
  }

  /**
   * Load all audio files (sound effects and music)
   */
  private loadAudioFiles(): void {
    // Load sound effects
    Object.values(SOUND_EFFECTS).forEach(soundConfig => {
      this.load.audio(soundConfig.key, soundConfig.path);
    });

    // Load music tracks
    Object.values(MUSIC_TRACKS).forEach(musicConfig => {
      this.load.audio(musicConfig.key, musicConfig.path);
    });
  }
}

