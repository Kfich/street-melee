import Phaser from 'phaser';
import { PlayerState } from '../../types/GameTypes';

/**
 * Base class for all game entities
 */
export abstract class BaseEntity {
  public sprite: Phaser.Physics.Arcade.Sprite;
  protected scene: Phaser.Scene;
  protected state: PlayerState = 'idle';
  protected facingRight: boolean = true;
  protected health: number = 100;
  protected maxHealth: number = 100;
  protected isGrounded: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
    this.scene = scene;
    this.sprite = scene.physics.add.sprite(x, y, texture);
    this.setupPhysics();
  }

  protected setupPhysics() {
    this.sprite.setCollideWorldBounds(true);
    this.sprite.setBounce(0);
    this.sprite.setDragX(500);
  }

  /**
   * Update entity each frame
   */
  abstract update(): void;

  /**
   * Get current state
   */
  getState(): PlayerState {
    return this.state;
  }

  /**
   * Set state
   */
  setState(newState: PlayerState) {
    this.state = newState;
  }

  /**
   * Check if entity is grounded
   */
  protected checkGrounded() {
    if (!this.sprite || !this.sprite.body) {
      this.isGrounded = false;
      return;
    }
    
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    if (body && body.touching) {
      this.isGrounded = body.touching.down;
    } else {
      this.isGrounded = false;
    }
  }

  /**
   * Take damage (can be overridden by subclasses)
   * Negative amounts heal
   */
  takeDamage(amount: number): void {
    const wasAlive = this.health > 0;
    const previousHealth = this.health;
    this.health = Math.max(0, Math.min(this.maxHealth, this.health - amount));
    
    // Emit hit reaction event if taking damage (not healing)
    if (amount > 0 && this.health < previousHealth) {
      this.onHitReaction(amount);
    }
    
    // Emit defeat event if entity just died
    if (wasAlive && this.health <= 0) {
      this.scene.events.emit('entityDefeated', this);
    }
  }

  /**
   * Handle hit reaction (visual feedback when taking damage)
   * Override in subclasses for character-specific reactions
   */
  protected onHitReaction(damage: number): void {
    if (!this.sprite || !this.sprite.active) return;
    
    // Brief flash effect
    this.sprite.setTint(0xff0000); // Red tint
    this.scene.tweens.add({
      targets: this.sprite,
      clearTint: true,
      duration: 100,
      onComplete: () => {
        if (this.sprite) {
          this.sprite.clearTint();
        }
      }
    });
    
    // Brief scale animation (flinch)
    const originalScaleX = this.sprite.scaleX;
    const originalScaleY = this.sprite.scaleY;
    this.scene.tweens.add({
      targets: this.sprite,
      scaleX: originalScaleX * 0.9,
      scaleY: originalScaleY * 0.9,
      duration: 50,
      yoyo: true,
      ease: 'Power2',
      onComplete: () => {
        if (this.sprite) {
          this.sprite.setScale(originalScaleX, originalScaleY);
        }
      }
    });
    
    // Emit hit reaction event for additional effects
    this.scene.events.emit('entityHitReaction', {
      entity: this,
      damage: damage,
      x: this.sprite.x,
      y: this.sprite.y
    });
  }

  /**
   * Get health
   */
  getHealth(): number {
    return this.health;
  }

  /**
   * Get max health
   */
  getMaxHealth(): number {
    return this.maxHealth;
  }

  /**
   * Check if entity is alive
   */
  isAlive(): boolean {
    return this.health > 0;
  }

  /**
   * Set facing direction
   * Note: When using directional animations (left/right), the animation system
   * handles direction via animation keys, so we don't flip the sprite here.
   * This method is kept for compatibility but flipX is handled by animation system.
   */
  setFacingRight(facingRight: boolean) {
    this.facingRight = facingRight;
    // Don't flip sprite here - directional animations handle direction via keys
    // The animation system will set flipX to false and use correct animation key
  }

  /**
   * Get facing direction
   */
  isFacingRight(): boolean {
    return this.facingRight;
  }

  /**
   * Reset entity state for object pooling
   * Override in subclasses to reset entity-specific state
   * @param x X position (optional, for subclasses that need it)
   * @param y Y position (optional, for subclasses that need it)
   */
  reset(x?: number, y?: number): void {
    this.state = 'idle';
    this.facingRight = true;
    this.health = this.maxHealth;
    this.isGrounded = false;
    
    // Reset sprite if it exists
    if (this.sprite) {
      this.sprite.setActive(true);
      this.sprite.setVisible(true);
      this.sprite.clearTint();
      this.sprite.setAlpha(1);
      
      if (x !== undefined && y !== undefined) {
        this.sprite.setPosition(x, y);
      }
      
      const body = this.sprite.body as Phaser.Physics.Arcade.Body;
      if (body) {
        body.setVelocity(0, 0);
        body.setGravity(0, 0);
      }
    }
  }

  /**
   * Clean up
   */
  destroy() {
    if (this.sprite) {
      this.sprite.destroy();
    }
  }
}

