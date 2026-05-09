import Phaser from 'phaser';
import { PlayerState } from '../../types/GameTypes';
import { CharacterType } from '../../game/types/CharacterType';

/**
 * Animation system for managing character animations
 */
export class AnimationSystem {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Play animation for a sprite based on state and character type
   */
  playAnimation(
    sprite: Phaser.Physics.Arcade.Sprite,
    state: PlayerState,
    facingRight: boolean,
    characterType?: CharacterType
  ) {
    if (!characterType) {
      // Fallback to placeholder if no character type
      this.playPlaceholderAnimation(sprite, state, facingRight);
      return;
    }

    const direction = facingRight ? 'right' : 'left';
    let animKey: string | null = null;

    // Determine animation key based on state and character type.
    // For each state we first try a dedicated animation; if it doesn't exist we
    // fall through to the best available substitute so the system never shows a
    // stale/wrong frame.
    switch (state) {
      case 'idle':
        animKey = `${characterType}_idle_${direction}`;
        break;

      case 'walking':
        animKey = `${characterType}_walk_${direction}`;
        break;

      case 'jumping':
        // Try dedicated jump animation, fall back to walk then idle
        animKey = this.scene.anims.exists(`${characterType}_jump_${direction}`)
          ? `${characterType}_jump_${direction}`
          : (this.scene.anims.exists(`${characterType}_walk_${direction}`)
              ? `${characterType}_walk_${direction}`
              : `${characterType}_idle_${direction}`);
        break;

      case 'landing':
        // Try a dedicated landing anim; walk conveys momentum better than idle
        animKey = this.scene.anims.exists(`${characterType}_landing_${direction}`)
          ? `${characterType}_landing_${direction}`
          : (this.scene.anims.exists(`${characterType}_walk_${direction}`)
              ? `${characterType}_walk_${direction}`
              : `${characterType}_idle_${direction}`);
        break;

      case 'attacking':
        animKey = `${characterType}_attack_${direction}`;
        break;

      case 'grabbing':
        // Prefer a dedicated grab animation, fall back to attack then idle
        animKey = this.scene.anims.exists(`${characterType}_grab_${direction}`)
          ? `${characterType}_grab_${direction}`
          : (this.scene.anims.exists(`${characterType}_attack_${direction}`)
              ? `${characterType}_attack_${direction}`
              : `${characterType}_idle_${direction}`);
        break;

      case 'grabbed':
        // Prefer grabbed/grabbed-idle, fall back to idle
        animKey = this.scene.anims.exists(`${characterType}_grabbed_${direction}`)
          ? `${characterType}_grabbed_${direction}`
          : `${characterType}_idle_${direction}`;
        break;

      case 'throwing':
        // Throwing looks like an attack
        animKey = this.scene.anims.exists(`${characterType}_throw_${direction}`)
          ? `${characterType}_throw_${direction}`
          : `${characterType}_attack_${direction}`;
        break;

      case 'knockedDown':
      case 'dying':
        // Prefer a dedicated knockdown anim; the tween sequence handles the
        // physical collapse so we just want to freeze on a neutral frame.
        animKey = this.scene.anims.exists(`${characterType}_knockdown_${direction}`)
          ? `${characterType}_knockdown_${direction}`
          : `${characterType}_idle_${direction}`;
        break;

      case 'hitReaction':
        // Brief flinch — prefer a dedicated hurt anim if available
        animKey = this.scene.anims.exists(`${characterType}_hurt_${direction}`)
          ? `${characterType}_hurt_${direction}`
          : `${characterType}_idle_${direction}`;
        break;

      default:
        animKey = `${characterType}_idle_${direction}`;
    }

    // Try to play the animation
    if (animKey && this.scene.anims.exists(animKey)) {
      try {
        // When using directional animations (left/right), don't flip the sprite
        // The animation key already handles direction
        sprite.setFlipX(false);
        sprite.play(animKey, true);
        // Ensure pixel-perfect rendering
        this.ensurePixelPerfectRendering(sprite);
      } catch (error) {
        console.warn(`[AnimationSystem] Could not play animation ${animKey}:`, error);
        this.playPlaceholderAnimation(sprite, state, facingRight);
      }
    } else {
      // Animation doesn't exist, try to use a texture directly
      const textureKey = `${characterType}_idle_${direction}`;
      if (this.scene.textures.exists(textureKey)) {
        // When using directional textures, don't flip - use the correct texture
        sprite.setFlipX(false);
        sprite.setTexture(textureKey);
        this.ensurePixelPerfectRendering(sprite);
      } else {
        // Fallback to placeholder
        this.playPlaceholderAnimation(sprite, state, facingRight);
      }
    }
  }

  /**
   * Ensure sprite uses pixel-perfect rendering
   */
  private ensurePixelPerfectRendering(sprite: Phaser.Physics.Arcade.Sprite) {
    if (this.scene.textures.exists(sprite.texture.key)) {
      const texture = this.scene.textures.get(sprite.texture.key);
      texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
    }
    
    // Ensure sprite doesn't get smoothed
    sprite.setFlipX(sprite.flipX); // Force update
  }

  /**
   * Fallback placeholder animation
   */
  private playPlaceholderAnimation(
    sprite: Phaser.Physics.Arcade.Sprite,
    _state: PlayerState,
    facingRight: boolean
  ) {
    // Create placeholder texture if it doesn't exist
    if (!this.scene.textures.exists('player_placeholder')) {
      const graphics = this.scene.add.graphics();
      graphics.fillStyle(0x00ff00);
      graphics.fillRect(0, 0, 32, 48);
      graphics.generateTexture('player_placeholder', 32, 48);
      graphics.destroy();
    }

    sprite.setTexture('player_placeholder');
    sprite.setFlipX(!facingRight);
  }

  /**
   * Get animation key for a state
   */
  getAnimationKey(state: PlayerState, characterType?: CharacterType, facingRight: boolean = true): string {
    if (!characterType) {
      return 'player_placeholder';
    }

    const direction = facingRight ? 'right' : 'left';
    
    // Return appropriate animation key based on state
    switch (state) {
      case 'idle':
        return `${characterType}_idle_${direction}`;
      case 'walking':
        return `${characterType}_walk_${direction}`;
      case 'jumping':
        return `${characterType}_jump_${direction}`;
      case 'attacking':
        return `${characterType}_attack_${direction}`;
      default:
        return `${characterType}_idle_${direction}`;
    }
  }
}
