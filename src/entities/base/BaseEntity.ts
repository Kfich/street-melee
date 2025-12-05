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
    this.health = Math.max(0, Math.min(this.maxHealth, this.health - amount));
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
   * Clean up
   */
  destroy() {
    this.sprite.destroy();
  }
}

