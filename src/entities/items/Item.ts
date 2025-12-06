import Phaser from 'phaser';
import { BaseEntity } from '../base/BaseEntity';
import { BaseCharacter } from '../characters/BaseCharacter';
import { RewardSystem } from '../../systems/reward/RewardSystem';
import { GameConfig } from '../../config/GameConfig';

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

/**
 * Item rarity levels
 */
export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export const ITEM_STATS: Record<ItemType, ItemStats> = {
  apple: {
    effect: { healthRestore: 20 },
    color: 0xff0000, // Red
    size: { width: 32, height: 32 }, // Uniform size
    value: 100
  },
  chicken: {
    effect: { healthRestore: 50 },
    color: 0xffff00, // Yellow
    size: { width: 32, height: 32 }, // Uniform size
    value: 200
  },
  moneyBag: {
    effect: { points: 500 },
    color: 0x00ff00, // Green
    size: { width: 32, height: 32 }, // Uniform size
    value: 500
  },
  goldBar: {
    effect: { points: 1000 },
    color: 0xffd700, // Gold
    size: { width: 32, height: 32 }, // Uniform size
    value: 1000
  },
  oneUp: {
    effect: { lives: 1 },
    color: 0x00ffff, // Cyan
    size: { width: 32, height: 32 }, // Uniform size
    value: 0 // Priceless
  },
  powerUp: {
    effect: { powerBoost: 1.5 }, // Temporary damage boost
    color: 0xff00ff, // Magenta
    size: { width: 32, height: 32 }, // Uniform size
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
  private valueText?: Phaser.GameObjects.Text;
  private glowEffect?: Phaser.GameObjects.Graphics;
  private rewardSystem?: RewardSystem;
  private collectionRange: number = 30; // Range for magnetic collection

  constructor(scene: Phaser.Scene, x: number, y: number, itemType: ItemType = 'apple') {
    super(scene, x, y, 'item');
    this.itemType = itemType;
    this.stats = ITEM_STATS[itemType];
    
    // Get RewardSystem from scene
    this.rewardSystem = (scene as any).rewardSystem;
    
    this.setupItem();
  }

  private setupItem() {
    // Safety check: ensure scene, sys, and textures are available
    if (!this.scene || !this.scene.sys || !this.scene.textures) {
      console.error('[Item] Scene, sys, or textures not available in setupItem', {
        hasScene: !!this.scene,
        hasSys: !!(this.scene && this.scene.sys),
        hasTextures: !!(this.scene && this.scene.textures)
      });
      return;
    }
    
    // Try to use actual sprite texture, fallback to placeholder
    const textureKey = `item_${this.itemType}`;
    if (this.scene.textures.exists(textureKey)) {
      this.sprite.setTexture(textureKey);
      
      // Get actual texture dimensions
      const texture = this.scene.textures.get(textureKey);
      if (texture) {
        const frame = texture.get(0);
        const actualWidth = frame ? frame.width : GameConfig.ITEM_WIDTH;
        const actualHeight = frame ? frame.height : GameConfig.ITEM_HEIGHT;
        
        // Calculate scale to fit desired uniform size while maintaining aspect ratio
        const scaleX = GameConfig.ITEM_WIDTH / actualWidth;
        const scaleY = GameConfig.ITEM_HEIGHT / actualHeight;
        const scale = Math.min(scaleX, scaleY); // Use the smaller scale to fit within bounds
        
        // Set uniform display size
        this.sprite.setDisplaySize(actualWidth * scale, actualHeight * scale);
        
        // Set pixel-perfect filtering
        texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
      } else {
        // Fallback to config size if texture not available
        this.sprite.setDisplaySize(GameConfig.ITEM_WIDTH, GameConfig.ITEM_HEIGHT);
      }
    } else {
      // Create placeholder sprite if it doesn't exist
      if (!this.scene.textures.exists('item')) {
        if (this.scene.add && this.scene.add.graphics) {
          this.scene.add.graphics()
            .fillStyle(this.stats.color)
            .fillRect(0, 0, GameConfig.ITEM_WIDTH, GameConfig.ITEM_HEIGHT)
            .generateTexture('item', GameConfig.ITEM_WIDTH, GameConfig.ITEM_HEIGHT);
        }
      }
      if (this.sprite) {
        this.sprite.setTexture('item');
        this.sprite.setTint(this.stats.color);
        this.sprite.setDisplaySize(GameConfig.ITEM_WIDTH, GameConfig.ITEM_HEIGHT);
      }
    }
    
    // Safety check for sprite
    if (!this.sprite) {
      console.error('[Item] Sprite not available in setupItem');
      return;
    }
    
    // Set origin to center for consistent rotation and positioning
    this.sprite.setOrigin(0.5, 0.5);
    
    // Make item a sensor (no collision, just overlap detection)
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    if (body) {
      // Use uniform size for physics body (slightly smaller for better feel)
      body.setSize(GameConfig.ITEM_WIDTH * 0.9, GameConfig.ITEM_HEIGHT * 0.9);
      body.setOffset(
        (GameConfig.ITEM_WIDTH - body.width) / 2,
        (GameConfig.ITEM_HEIGHT - body.height) / 2
      );
      body.setAllowGravity(false); // Items float
    }
    
    // Create value display text
    this.createValueDisplay();
    
    // Create rarity glow effect
    this.createRarityGlow();
  }

  /**
   * Create value display text above item
   */
  private createValueDisplay(): void {
    if (!this.rewardSystem) return;
    
    const rewardDisplay = this.rewardSystem.getRewardDisplay(this.itemType);
    if (!rewardDisplay) return;
    
    // Create text showing item value
    this.valueText = this.scene.add.text(
      this.sprite.x,
      this.sprite.y - 25,
      rewardDisplay.text,
      {
        fontFamily: 'Arial',
        fontSize: '10px',
        color: `#${rewardDisplay.color.toString(16).padStart(6, '0')}`,
        stroke: '#000000',
        strokeThickness: 2,
        align: 'center'
      }
    );
    this.valueText.setOrigin(0.5, 0.5);
    this.valueText.setDepth(1000);
    
    // Pulse animation for value text
    this.scene.tweens.add({
      targets: this.valueText,
      alpha: { from: 0.7, to: 1.0 },
      scale: { from: 0.9, to: 1.0 },
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  /**
   * Create rarity glow effect around item
   */
  private createRarityGlow(): void {
    if (!this.rewardSystem) return;
    
    const rarity = this.rewardSystem.getRarityName(this.itemType);
    const color = this.rewardSystem.getRarityColor(this.itemType);
    
    // Only create glow for rare+ items
    if (rarity === 'common' || rarity === 'uncommon') return;
    
    this.glowEffect = this.scene.add.graphics();
    this.glowEffect.setDepth(this.sprite.depth - 1);
    
    // Create pulsing glow
    this.scene.tweens.add({
      targets: { alpha: 0.3 },
      alpha: 0.7,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      onUpdate: (tween: Phaser.Tweens.Tween) => {
        if (!this.glowEffect || !this.sprite.active) return;
        
        const alpha = tween.getValue(0);
        this.glowEffect.clear();
        this.glowEffect.fillStyle(color, alpha ?? 0.5);
        this.glowEffect.fillCircle(
          this.sprite.x,
          this.sprite.y,
          GameConfig.ITEM_WIDTH + 5
        );
      }
    });
  }

  /**
   * Collect item and apply effects
   */
  collect(character: BaseCharacter): boolean {
    if (this.collected) return false;
    
    this.collected = true;
    
    // Process collection through reward system
    let rewardData;
    if (this.rewardSystem) {
      rewardData = this.rewardSystem.processCollection(this.itemType);
    } else {
      // Fallback to old system
      rewardData = {
        points: this.stats.effect.points || 0,
        health: this.stats.effect.healthRestore,
        lives: this.stats.effect.lives,
        powerBoost: this.stats.effect.powerBoost ? {
          multiplier: this.stats.effect.powerBoost,
          duration: 10000
        } : undefined,
        display: null
      };
    }
    
    // Apply health restoration
    if (rewardData.health) {
      const maxHealth = character.getMaxHealth();
      const currentHealth = character.getHealth();
      const newHealth = Math.min(currentHealth + rewardData.health, maxHealth);
      // Use negative damage for healing
      character.takeDamage(-(newHealth - currentHealth));
    }
    
    // Apply points
    if (rewardData.points > 0) {
      this.scene.events.emit('itemCollected', {
        type: this.itemType,
        points: rewardData.points,
        item: this,
        rewardDisplay: rewardData.display
      });
    }
    
    // Apply lives
    if (rewardData.lives) {
      this.scene.events.emit('lifeGained', {
        type: this.itemType,
        lives: rewardData.lives,
        item: this,
        rewardDisplay: rewardData.display
      });
    }
    
    // Apply power boost
    if (rewardData.powerBoost) {
      this.scene.events.emit('powerBoost', {
        type: this.itemType,
        multiplier: rewardData.powerBoost.multiplier,
        duration: rewardData.powerBoost.duration,
        item: this,
        rewardDisplay: rewardData.display
      });
    }
    
    // Enhanced visual feedback
    this.playCollectionEffect(rewardData.display);
    
    // Destroy item after a short delay
    this.scene.time.delayedCall(300, () => {
      this.destroy();
    });
    
    return true;
  }
  
  /**
   * Check if character is in collection range (magnetic effect)
   */
  checkCollectionRange(character: BaseCharacter): boolean {
    if (this.collected) return false;
    
    const distance = Phaser.Math.Distance.Between(
      this.sprite.x,
      this.sprite.y,
      character.sprite.x,
      character.sprite.y
    );
    
    return distance <= this.collectionRange;
  }
  
  /**
   * Apply magnetic pull toward character
   */
  applyMagneticPull(character: BaseCharacter, strength: number = 0.1): void {
    if (this.collected) return;
    
    const dx = character.sprite.x - this.sprite.x;
    const dy = character.sprite.y - this.sprite.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 0 && distance < this.collectionRange * 2) {
      const pullX = (dx / distance) * strength * 100;
      const pullY = (dy / distance) * strength * 100;
      
      this.sprite.setPosition(
        this.sprite.x + pullX,
        this.sprite.y + pullY
      );
      
      // Update value text position
      if (this.valueText) {
        this.valueText.setPosition(this.sprite.x, this.sprite.y - 25);
      }
      
      // Update glow position
      if (this.glowEffect) {
        this.glowEffect.clear();
        const rarity = this.rewardSystem?.getRarityName(this.itemType);
        if (rarity && rarity !== 'common' && rarity !== 'uncommon') {
          const color = this.rewardSystem?.getRarityColor(this.itemType) || 0xffffff;
          this.glowEffect.fillStyle(color, 0.5);
        this.glowEffect.fillCircle(
          this.sprite.x,
          this.sprite.y,
          GameConfig.ITEM_WIDTH + 5
        );
        }
      }
    }
  }

  /**
   * Play collection visual effect with reward display
   */
  private playCollectionEffect(rewardDisplay: any): void {
    // Flash and scale up
    this.scene.tweens.add({
      targets: this.sprite,
      scaleX: 1.5,
      scaleY: 1.5,
      alpha: 0,
      duration: 200,
      ease: 'Power2'
    });
    
    // Hide value text
    if (this.valueText) {
      this.valueText.setVisible(false);
    }
    
    // Hide glow
    if (this.glowEffect) {
      this.glowEffect.setVisible(false);
    }
    
    // Create reward popup if display data available
    if (rewardDisplay) {
      this.scene.events.emit('itemRewardPopup', {
        x: this.sprite.x,
        y: this.sprite.y,
        rewardDisplay: rewardDisplay
      });
    }
  }

  update(): void {
    if (this.collected) return;
    
    // Floating animation
    this.floatOffset += this.floatSpeed;
    const floatY = Math.sin(this.floatOffset) * this.floatAmplitude;
    const previousFloatY = Math.sin(this.floatOffset - this.floatSpeed) * this.floatAmplitude;
    this.sprite.setY(this.sprite.y + floatY - previousFloatY);
    
    // Update value text position
    if (this.valueText && this.valueText.active) {
      this.valueText.setPosition(this.sprite.x, this.sprite.y - 25);
    }
    
    // Update glow position
    if (this.glowEffect && this.glowEffect.active) {
      const rarity = this.rewardSystem?.getRarityName(this.itemType);
      if (rarity && rarity !== 'common' && rarity !== 'uncommon') {
        const color = this.rewardSystem?.getRarityColor(this.itemType) || 0xffffff;
        this.glowEffect.clear();
        this.glowEffect.fillStyle(color, 0.5);
        this.glowEffect.fillCircle(
          this.sprite.x,
          this.sprite.y,
          GameConfig.ITEM_WIDTH + 5
        );
      }
    }
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

  /**
   * Reset item state for object pooling
   */
  reset(x: number, y: number, itemType?: ItemType): void {
    // Safety check: ensure scene is available
    if (!this.scene) {
      console.error('[Item] Cannot reset - scene is not available');
      return;
    }
    
    // Ensure sprite is in the scene and has valid scene reference
    if (this.sprite) {
      // If sprite was removed from scene, re-add it
      if (!this.sprite.scene || this.sprite.scene !== this.scene) {
        // Re-add sprite to scene's display list
        this.scene.add.existing(this.sprite);
        // Re-enable physics if needed
        if (this.scene.physics && this.scene.physics.world) {
          this.scene.physics.world.enable(this.sprite);
        }
      }
    }
    
    // Reset base entity
    super.reset(x, y);
    
    // Update item type if provided
    if (itemType) {
      this.itemType = itemType;
      this.stats = ITEM_STATS[itemType];
    }
    
    // Reset item-specific state
    this.collected = false;
    this.floatOffset = 0;
    
    // Clean up old visual elements
    if (this.valueText) {
      this.valueText.destroy();
      this.valueText = undefined;
    }
    if (this.glowEffect) {
      this.glowEffect.destroy();
      this.glowEffect = undefined;
    }
    
    // Re-setup item sprite only if sprite and scene are valid
    if (this.sprite && this.scene && this.scene.sys && this.scene.textures) {
      this.setupItem();
    } else {
      console.warn('[Item] Cannot setupItem - sprite, scene, scene.sys, or scene.textures not available', {
        hasSprite: !!this.sprite,
        hasScene: !!this.scene,
        hasSys: !!(this.scene && this.scene.sys),
        hasTextures: !!(this.scene && this.scene.textures)
      });
    }
  }
  
  /**
   * Clean up visual elements
   */
  destroy(): void {
    if (this.valueText) {
      this.valueText.destroy();
      this.valueText = undefined;
    }
    if (this.glowEffect) {
      this.glowEffect.destroy();
      this.glowEffect = undefined;
    }
    super.destroy();
  }
}

