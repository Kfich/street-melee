import Phaser from 'phaser';
import { BaseEntity } from '../base/BaseEntity';
import { Hitbox } from '../../systems/combat/Hitbox';
import { GameConfig } from '../../config/GameConfig';

export type WeaponType = 'pipe' | 'knife' | 'bottle' | 'bat';

export interface WeaponStats {
  damage: number;
  throwDamage: number;
  range: number;
  isThrowable: boolean;
  color: number; // For placeholder sprite
}

export const WEAPON_STATS: Record<WeaponType, WeaponStats> = {
  pipe: {
    damage: 20,
    throwDamage: 15,
    range: 40,
    isThrowable: true,
    color: 0x888888 // Gray
  },
  knife: {
    damage: 15,
    throwDamage: 20,
    range: 30,
    isThrowable: true,
    color: 0xcccccc // Light gray
  },
  bottle: {
    damage: 12,
    throwDamage: 10,
    range: 35,
    isThrowable: true,
    color: 0x00ff00 // Green
  },
  bat: {
    damage: 25,
    throwDamage: 18,
    range: 45,
    isThrowable: true,
    color: 0x8b4513 // Brown
  }
};

/**
 * Weapon entity that can be picked up and used
 */
export class Weapon extends BaseEntity {
  private weaponType: WeaponType;
  private stats: WeaponStats;
  private throwCount: number = 0;
  private maxThrows: number = 3;
  private owner: Phaser.Physics.Arcade.Sprite | null = null;
  private isThrown: boolean = false;
  // Removed unused throwVelocity - velocity is set directly on body

  constructor(scene: Phaser.Scene, x: number, y: number, weaponType: WeaponType = 'pipe') {
    super(scene, x, y, 'weapon');
    this.weaponType = weaponType;
    this.stats = WEAPON_STATS[weaponType];
    this.setupWeapon();
  }

  private setupWeapon() {
    // Use weapon-specific sprite texture
    const textureKey = `weapon_${this.weaponType}`;
    
    // Uniform display size for all weapons
    const displayWidth = GameConfig.WEAPON_WIDTH;
    const displayHeight = GameConfig.WEAPON_HEIGHT;
    
    // Set origin point (center for proper rotation and positioning)
    this.sprite.setOrigin(0.5, 0.5);
    
    // Check if the weapon sprite exists, fallback to placeholder if not
    if (this.scene.textures.exists(textureKey)) {
      this.sprite.setTexture(textureKey);
      
      // Set uniform display size for all weapons (regardless of source sprite size)
      this.sprite.setDisplaySize(displayWidth, displayHeight);
      
      // Enable pixel-perfect rendering
      const texture = this.scene.textures.get(textureKey);
      if (texture && typeof texture.setFilter === 'function') {
        texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
      }
      
      // Make weapon a sensor (no collision, just overlap detection)
      const body = this.sprite.body as Phaser.Physics.Arcade.Body;
      if (body) {
        // Physics body slightly smaller than display for better feel
        body.setSize(displayWidth * 0.8, displayHeight * 0.9);
        body.setOffset(
          (displayWidth - body.width) / 2,
          (displayHeight - body.height) / 2
        );
      }
    } else {
      // Fallback to placeholder if sprite not loaded
      console.warn(`[Weapon] Texture ${textureKey} not found, using placeholder`);
      if (!this.scene.textures.exists('weapon')) {
        this.scene.add.graphics()
          .fillStyle(this.stats.color)
          .fillRect(0, 0, displayWidth, displayHeight)
          .generateTexture('weapon', displayWidth, displayHeight);
      }
      this.sprite.setTexture('weapon');
      this.sprite.setTint(this.stats.color);
      this.sprite.setDisplaySize(displayWidth, displayHeight);
      
      const body = this.sprite.body as Phaser.Physics.Arcade.Body;
      if (body) {
        body.setSize(displayWidth * 0.8, displayHeight * 0.9);
        body.setOffset(
          (displayWidth - body.width) / 2,
          (displayHeight - body.height) / 2
        );
      }
    }
  }

  /**
   * Pick up weapon
   */
  pickup(owner: Phaser.Physics.Arcade.Sprite) {
    this.owner = owner;
    this.isThrown = false;
    
    // Attach to owner (will be positioned in update)
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);
  }

  /**
   * Drop weapon (not thrown, just dropped)
   */
  drop() {
    if (!this.owner) return;
    
    // Save owner position before clearing reference
    const ownerX = this.owner.x;
    const ownerY = this.owner.y;
    
    this.throwCount++;
    this.owner = null;
    this.isThrown = false;
    
    // Position weapon where owner was (using saved position)
    if (this.sprite && this.sprite.active) {
      this.sprite.setPosition(ownerX, ownerY);
    }
    
    // Check if weapon should be destroyed
    if (this.throwCount >= this.maxThrows) {
      this.destroy();
    }
  }

  /**
   * Throw weapon in a direction
   */
  throw(_direction: 'left' | 'right', throwPower: number = 400) {
    if (!this.owner) return;
    
    // Save owner properties before clearing reference
    const ownerX = this.owner.x;
    const ownerY = this.owner.y;
    const facingRight = !this.owner.flipX;
    
    this.throwCount++;
    
    // Position weapon at owner's position (using saved position)
    if (this.sprite && this.sprite.active) {
      this.sprite.setPosition(ownerX, ownerY);
      
      // Set throw velocity
      const throwX = facingRight ? throwPower : -throwPower;
      // Velocity set directly on body below
      
      const body = this.sprite.body as Phaser.Physics.Arcade.Body;
      if (body) {
        body.setVelocity(throwX, -100);
      }
    }
    
    // Clear owner after using properties
    this.owner = null;
    this.isThrown = true;
    
    // Create throw hitbox
    this.createThrowHitbox();
    
    // Check if weapon should be destroyed
    if (this.throwCount >= this.maxThrows) {
      // Destroy after a short delay to allow hit
      this.scene.time.delayedCall(500, () => {
        if (this.throwCount >= this.maxThrows) {
          this.destroy();
        }
      });
    }
  }

  /**
   * Create hitbox for thrown weapon
   */
  private createThrowHitbox() {
    const hitbox = new Hitbox(
      this.sprite,
      0,
      0,
      20,
      40,
      this.stats.throwDamage,
      { x: 200, y: 0 },
      false
    );
    
    hitbox.activate();
    this.scene.events.emit('hitboxCreated', hitbox);
    
    // Deactivate after weapon stops or hits something
    this.scene.time.delayedCall(1000, () => {
      hitbox.deactivate();
    });
  }

  /**
   * Use weapon for attack
   */
  createAttackHitbox(owner: Phaser.Physics.Arcade.Sprite, facingRight: boolean): Hitbox {
    const offsetX = facingRight ? this.stats.range : -this.stats.range;
    
    return new Hitbox(
      owner,
      offsetX,
      -10,
      this.stats.range,
      40,
      this.stats.damage,
      { x: 180, y: 0 },
      false
    );
  }

  update(): void {
    // If weapon is owned, follow owner
    if (this.owner && !this.isThrown) {
      // Owner body used for positioning
      const facingRight = !this.owner.flipX;
      const offsetX = facingRight ? 15 : -15;
      
      this.sprite.setPosition(this.owner.x + offsetX, this.owner.y);
      this.sprite.setFlipX(!facingRight);
      
      // Ensure weapon sprite is visible and properly scaled
      this.sprite.setVisible(true);
      this.sprite.setActive(true);
    }
    
    // If thrown, check if it should stop
    if (this.isThrown) {
      const body = this.sprite.body as Phaser.Physics.Arcade.Body;
      
      // Stop if hitting ground
      if (body.touching.down) {
        body.setVelocity(0, 0);
        this.isThrown = false;
        
        // If max throws reached, destroy
        if (this.throwCount >= this.maxThrows) {
          this.scene.time.delayedCall(100, () => {
            this.destroy();
          });
        }
      }
    }
  }

  /**
   * Check if weapon is being held
   */
  isHeld(): boolean {
    return this.owner !== null && !this.isThrown;
  }

  /**
   * Get weapon type
   */
  getWeaponType(): WeaponType {
    return this.weaponType;
  }

  /**
   * Get weapon stats
   */
  getStats(): WeaponStats {
    return this.stats;
  }

  /**
   * Get throw count
   */
  getThrowCount(): number {
    return this.throwCount;
  }

  /**
   * Check if weapon should be destroyed
   */
  shouldDestroy(): boolean {
    return this.throwCount >= this.maxThrows;
  }

  /**
   * Reset weapon state for object pooling
   */
  reset(x?: number, y?: number, weaponType?: WeaponType): void {
    // Reset base entity
    super.reset(x, y);
    
    // Update weapon type if different and provided
    if (weaponType && weaponType !== this.weaponType) {
      this.weaponType = weaponType;
      this.stats = WEAPON_STATS[weaponType];
    }
    
    // Reset weapon-specific state
    this.throwCount = 0;
    this.owner = null;
    this.isThrown = false;
    
    // Reset sprite properties
    if (this.sprite) {
      this.sprite.setFlipX(false);
      this.sprite.setRotation(0);
      this.sprite.setScale(1, 1);
    }
    
    // Re-setup weapon sprite with correct texture
    this.setupWeapon();
  }
}

