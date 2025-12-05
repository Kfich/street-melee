import Phaser from 'phaser';

/**
 * Represents a hitbox for attack collision detection
 */
export class Hitbox {
  public x: number;
  public y: number;
  public width: number;
  public height: number;
  public damage: number;
  public knockback: { x: number; y: number };
  public isKnockdown: boolean;
  public owner: Phaser.Physics.Arcade.Sprite;
  public active: boolean = false;

  constructor(
    owner: Phaser.Physics.Arcade.Sprite,
    x: number,
    y: number,
    width: number,
    height: number,
    damage: number,
    knockback: { x: number; y: number } = { x: 200, y: 0 },
    isKnockdown: boolean = false
  ) {
    this.owner = owner;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.damage = damage;
    this.knockback = knockback;
    this.isKnockdown = isKnockdown;
  }

  /**
   * Get the world position of the hitbox
   */
  getWorldBounds(): Phaser.Geom.Rectangle {
    const ownerX = this.owner.x;
    const ownerY = this.owner.y;
    const facingRight = !this.owner.flipX;
    
    // Adjust x position based on facing direction
    const hitboxX = facingRight 
      ? ownerX + this.x 
      : ownerX - this.x - this.width;
    
    return new Phaser.Geom.Rectangle(
      hitboxX,
      ownerY + this.y,
      this.width,
      this.height
    );
  }

  /**
   * Check if this hitbox intersects with another sprite
   */
  intersects(sprite: Phaser.Physics.Arcade.Sprite): boolean {
    const bounds = this.getWorldBounds();
    const spriteBody = sprite.body as Phaser.Physics.Arcade.Body;
    
    return Phaser.Geom.Rectangle.Overlaps(bounds, spriteBody);
  }

  /**
   * Deactivate the hitbox
   */
  deactivate() {
    this.active = false;
  }

  /**
   * Activate the hitbox
   */
  activate() {
    this.active = true;
  }
}

