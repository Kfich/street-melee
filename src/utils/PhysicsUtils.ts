import Phaser from 'phaser';

/**
 * Physics utility functions
 */
export class PhysicsUtils {
  /**
   * Check if a sprite is on the ground
   */
  static isGrounded(sprite: Phaser.Physics.Arcade.Sprite): boolean {
    const body = sprite.body as Phaser.Physics.Arcade.Body;
    return body.touching.down;
  }

  /**
   * Apply knockback to a sprite
   */
  static applyKnockback(
    sprite: Phaser.Physics.Arcade.Sprite,
    direction: 'left' | 'right',
    force: number = 200
  ): void {
    const body = sprite.body as Phaser.Physics.Arcade.Body;
    const knockbackX = direction === 'right' ? force : -force;
    body.setVelocityX(knockbackX);
  }

  /**
   * Check collision between two sprites
   */
  static checkCollision(
    sprite1: Phaser.Physics.Arcade.Sprite,
    sprite2: Phaser.Physics.Arcade.Sprite
  ): boolean {
    const body1 = sprite1.body as Phaser.Physics.Arcade.Body;
    const body2 = sprite2.body as Phaser.Physics.Arcade.Body;
    
    // Create rectangles from bodies
    const rect1 = new Phaser.Geom.Rectangle(body1.x, body1.y, body1.width, body1.height);
    const rect2 = new Phaser.Geom.Rectangle(body2.x, body2.y, body2.width, body2.height);
    
    return Phaser.Geom.Rectangle.Overlaps(rect1, rect2);
  }
}

