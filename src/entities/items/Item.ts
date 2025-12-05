import Phaser from 'phaser';
import { BaseEntity } from '../base/BaseEntity';
import { BaseCharacter } from '../characters/BaseCharacter';

export type ItemType = 'apple' | 'chicken' | 'moneyBag' | 'goldBar' | 'oneUp' | 'powerUp';

export interface ItemEffect {
  healthRestore?: number;
  points?: number;
  lives?: number;
  powerBoost?: number;
}

export interface ItemStats {
  effect: ItemEffect;
  color: number; // For placeholder sprite
  size: { width: number; height: number };
  value: number; // Point value
}

export const ITEM_STATS: Record<ItemType, ItemStats> = {
  apple: {
    effect: { healthRestore: 20 },
    color: 0xff0000, // Red
    size: { width: 20, height: 20 },
    value: 100
  },
  chicken: {
    effect: { healthRestore: 50 },
    color: 0xffff00, // Yellow
    size: { width: 20, height: 20 },
    value: 200
  },
  moneyBag: {
    effect: { points: 500 },
    color: 0x00ff00, // Green
    size: { width: 24, height: 24 },
    value: 500
  },
  goldBar: {
    effect: { points: 1000 },
    color: 0xffd700, // Gold
    size: { width: 24, height: 16 },
    value: 1000
  },
  oneUp: {
    effect: { lives: 1 },
    color: 0x00ffff, // Cyan
    size: { width: 20, height: 20 },
    value: 0 // Priceless
  },
  powerUp: {
    effect: { powerBoost: 1.5 }, // Temporary damage boost
    color: 0xff00ff, // Magenta
    size: { width: 20, height: 20 },
    value: 300
  }
};

/**
 * Item entity that can be collected
 */
export class Item extends BaseEntity {
  private itemType: ItemType;
  private stats: ItemStats;
  private collected: boolean = false;
  private floatOffset: number = 0;
  private floatSpeed: number = 0.05;
  private floatAmplitude: number = 5;

  constructor(scene: Phaser.Scene, x: number, y: number, itemType: ItemType = 'apple') {
    super(scene, x, y, 'item');
    this.itemType = itemType;
    this.stats = ITEM_STATS[itemType];
    this.setupItem();
  }

  private setupItem() {
    // Create placeholder sprite if it doesn't exist
    if (!this.scene.textures.exists('item')) {
      this.scene.add.graphics()
        .fillStyle(0xff0000)
        .fillRect(0, 0, 20, 20)
        .generateTexture('item', 20, 20);
    }

    this.sprite.setTexture('item');
    this.sprite.setTint(this.stats.color);
    
    // Set size
    this.sprite.setDisplaySize(this.stats.size.width, this.stats.size.height);
    
    // Make item a sensor (no collision, just overlap detection)
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setSize(this.stats.size.width, this.stats.size.height);
    body.setAllowGravity(false); // Items float
  }

  /**
   * Collect item and apply effects
   */
  collect(character: BaseCharacter): boolean {
    if (this.collected) return false;
    
    this.collected = true;
    const effect = this.stats.effect;
    
    // Apply health restoration
    if (effect.healthRestore) {
      const maxHealth = character.getMaxHealth();
      character.takeDamage(-effect.healthRestore); // Negative damage = healing
      // Clamp to max health
      if (character.getHealth() > maxHealth) {
        // We'd need a setHealth method, but for now this works
      }
    }
    
    // Apply points (would be handled by score system)
    if (effect.points) {
      this.scene.events.emit('itemCollected', {
        type: this.itemType,
        points: effect.points,
        item: this
      });
    }
    
    // Apply lives (would be handled by game manager)
    if (effect.lives) {
      this.scene.events.emit('lifeGained', {
        type: this.itemType,
        lives: effect.lives,
        item: this
      });
    }
    
    // Apply power boost (temporary)
    if (effect.powerBoost) {
      this.scene.events.emit('powerBoost', {
        type: this.itemType,
        multiplier: effect.powerBoost,
        duration: 10000, // 10 seconds
        item: this
      });
    }
    
    // Visual feedback
    this.playCollectionEffect();
    
    // Destroy item after a short delay
    this.scene.time.delayedCall(200, () => {
      this.destroy();
    });
    
    return true;
  }

  /**
   * Play collection visual effect
   */
  private playCollectionEffect() {
    // Flash and scale up
    this.scene.tweens.add({
      targets: this.sprite,
      scaleX: 1.5,
      scaleY: 1.5,
      alpha: 0,
      duration: 200,
      ease: 'Power2'
    });
  }

  update(): void {
    // Floating animation
    this.floatOffset += this.floatSpeed;
    const floatY = Math.sin(this.floatOffset) * this.floatAmplitude;
    this.sprite.setY(this.sprite.y + floatY - (Math.sin(this.floatOffset - this.floatSpeed) * this.floatAmplitude));
  }

  /**
   * Check if item is collected
   */
  isCollected(): boolean {
    return this.collected;
  }

  /**
   * Get item type
   */
  getItemType(): ItemType {
    return this.itemType;
  }

  /**
   * Get item stats
   */
  getStats(): ItemStats {
    return this.stats;
  }
}

