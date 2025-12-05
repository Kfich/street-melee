import Phaser from 'phaser';
import { CharacterType } from '../../game/types/CharacterType';

/**
 * Character sprite mapping
 * Maps our character types to available sprite folders
 */
export const CHARACTER_SPRITE_MAP: Record<CharacterType, string> = {
  axel: 'dario',      // Dario has the most complete animation set
  blaze: 'zara',       // Zara has good animations
  max: 'rex',         // Rex has good animations
  sammy: 'angela'     // Angela has animations
};

/**
 * Sprite loader for loading character and enemy sprites
 */
export class SpriteLoader {
  private scene: Phaser.Scene;
  private loadedSprites: Set<string> = new Set();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Load all character sprites
   */
  async loadCharacterSprites(): Promise<void> {
    const characterTypes: CharacterType[] = ['axel', 'blaze', 'max', 'sammy'];
    
    for (const charType of characterTypes) {
      const spriteFolder = CHARACTER_SPRITE_MAP[charType];
      await this.loadCharacterSprite(charType, spriteFolder);
    }
  }

  /**
   * Load sprites for a specific character
   */
  private async loadCharacterSprite(charType: CharacterType, spriteFolder: string): Promise<void> {
    const basePath = `assets/sprites/imgs/${spriteFolder}`;
    
    try {
      // Load based on sprite folder structure
      if (spriteFolder === 'dario') {
        await this.loadDarioSprites(charType, basePath);
      } else if (spriteFolder === 'zara') {
        await this.loadZaraSprites(charType, basePath);
      } else if (spriteFolder === 'rex') {
        await this.loadRexSprites(charType, basePath);
      } else if (spriteFolder === 'angela') {
        await this.loadAngelaSprites(charType, basePath);
      }
    } catch (error) {
      console.warn(`[SpriteLoader] Failed to load sprites for ${charType} (${spriteFolder}):`, error);
    }
  }

  /**
   * Load Dario sprites (for Axel)
   */
  private async loadDarioSprites(charType: CharacterType, basePath: string): Promise<void> {
    // Idle animations
    this.loadImage(`${charType}_idle_left`, `${basePath}/PL.gif`);
    this.loadImage(`${charType}_idle_right`, `${basePath}/PR.gif`);

    // Walking animations
    const walkLeftFrames = ['Lw1', 'Lw2', 'Lw3', 'Lw4'].map(f => `${basePath}/${f}.gif`);
    const walkRightFrames = ['Rw1', 'Rw2', 'Rw3', 'Rw4'].map(f => `${basePath}/${f}.gif`);
    
    this.loadImage(`${charType}_walk_left_1`, walkLeftFrames[0]);
    this.loadImage(`${charType}_walk_left_2`, walkLeftFrames[1]);
    this.loadImage(`${charType}_walk_left_3`, walkLeftFrames[2]);
    this.loadImage(`${charType}_walk_left_4`, walkLeftFrames[3]);
    
    this.loadImage(`${charType}_walk_right_1`, walkRightFrames[0]);
    this.loadImage(`${charType}_walk_right_2`, walkRightFrames[1]);
    this.loadImage(`${charType}_walk_right_3`, walkRightFrames[2]);
    this.loadImage(`${charType}_walk_right_4`, walkRightFrames[3]);

    // Jump animations
    this.loadImage(`${charType}_jump_left`, `${basePath}/J1.gif`);
    this.loadImage(`${charType}_jump_right`, `${basePath}/J2.gif`);

    // Attack animations
    const punchLeftFrames = ['PDL1', 'PDL2', 'PDL3', 'PDL4'].map(f => `${basePath}/${f}.gif`);
    const punchRightFrames = ['PDR1', 'PDR2', 'PDR3', 'PDR4'].map(f => `${basePath}/${f}.gif`);
    
    punchLeftFrames.forEach((frame, i) => {
      this.loadImage(`${charType}_attack_left_${i + 1}`, frame);
    });
    
    punchRightFrames.forEach((frame, i) => {
      this.loadImage(`${charType}_attack_right_${i + 1}`, frame);
    });

    // Jump attack
    this.loadImage(`${charType}_jump_attack_left`, `${basePath}/PDLJump.gif`);
    this.loadImage(`${charType}_jump_attack_right`, `${basePath}/PDRJump.gif`);
  }

  /**
   * Load Zara sprites (for Blaze)
   */
  private async loadZaraSprites(charType: CharacterType, basePath: string): Promise<void> {
    // Idle
    this.loadImage(`${charType}_idle_left`, `${basePath}/Zara-idle-left.png`);
    this.loadImage(`${charType}_idle_right`, `${basePath}/Zara-idle-right.png`);

    // Walking
    this.loadImage(`${charType}_walk_left_1`, `${basePath}/Zara-walk-left-1.png`);
    this.loadImage(`${charType}_walk_left_2`, `${basePath}/Zara-walk-left-2.png`);
    this.loadImage(`${charType}_walk_right_1`, `${basePath}/Zara-walk-right-1.png`);
    this.loadImage(`${charType}_walk_right_2`, `${basePath}/Zara-walk-right-2.png`);

    // Attack
    this.loadImage(`${charType}_attack_left`, `${basePath}/Zara-attack-left.png`);
    this.loadImage(`${charType}_attack_right`, `${basePath}/Zara-attack-right.png`);
  }

  /**
   * Load Rex sprites (for Max)
   */
  private async loadRexSprites(charType: CharacterType, basePath: string): Promise<void> {
    // Idle
    this.loadImage(`${charType}_idle_left`, `${basePath}/rex-idle-left.png`);
    this.loadImage(`${charType}_idle_right`, `${basePath}/rex-idle-right.png`);

    // Walking
    this.loadImage(`${charType}_walk_left_1`, `${basePath}/rex-walk-left-1.png`);
    this.loadImage(`${charType}_walk_left_2`, `${basePath}/rex-walk-left-2.png`);
    this.loadImage(`${charType}_walk_right_1`, `${basePath}/rex-walk-right-1.png`);
    this.loadImage(`${charType}_walk_right_2`, `${basePath}/rex-walk-right-2.png`);

    // Attack
    this.loadImage(`${charType}_attack_left`, `${basePath}/rex-attack-left.png`);
    this.loadImage(`${charType}_attack_right`, `${basePath}/rex-attack-right.png`);
  }

  /**
   * Load Angela sprites (for Sammy)
   */
  private async loadAngelaSprites(charType: CharacterType, basePath: string): Promise<void> {
    // Angela has AL1-3 and AR1-3
    this.loadImage(`${charType}_idle_left`, `${basePath}/AL1.gif`);
    this.loadImage(`${charType}_walk_left_1`, `${basePath}/AL2.gif`);
    this.loadImage(`${charType}_walk_left_2`, `${basePath}/AL3.gif`);
    
    this.loadImage(`${charType}_idle_right`, `${basePath}/AR1.gif`);
    this.loadImage(`${charType}_walk_right_1`, `${basePath}/AR2.gif`);
    this.loadImage(`${charType}_walk_right_2`, `${basePath}/AR3.gif`);

    // Use walk frames for attack (Angela doesn't have separate attack frames)
    this.loadImage(`${charType}_attack_left`, `${basePath}/AL3.gif`);
    this.loadImage(`${charType}_attack_right`, `${basePath}/AR3.gif`);
  }

  /**
   * Load a single image
   */
  private loadImage(key: string, path: string): void {
    if (this.loadedSprites.has(key)) {
      return; // Already loaded
    }

    try {
      this.scene.load.image(key, path);
      this.loadedSprites.add(key);
    } catch (error) {
      console.warn(`[SpriteLoader] Failed to load image ${key} from ${path}:`, error);
    }
  }

  /**
   * Check if a sprite is loaded
   */
  isLoaded(key: string): boolean {
    return this.scene.textures.exists(key);
  }
}

