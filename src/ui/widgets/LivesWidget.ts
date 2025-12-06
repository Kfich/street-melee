import Phaser from 'phaser';
import { BaseWidget } from './BaseWidget';

/**
 * Lives Widget
 * Displays player lives as hearts
 */
export class LivesWidget extends BaseWidget {
  private hearts: Phaser.GameObjects.Image[] = [];
  private currentLives: number = 0;
  private maxLives: number = 3;
  private heartSpacing: number = 30;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);
  }

  protected createWidget(): void {
    // Create label (X symbol before hearts)
    const xSymbol = this.createText(-50, 0, 'X', this.theme.typography.fontSize.small);
    this.container.add(xSymbol);

    // Hearts will be created when lives are set
    this.updateHearts();
  }

  /**
   * Set player lives
   */
  setLives(lives: number, maxLives: number = 3): void {
    this.currentLives = Math.max(0, Math.min(lives, maxLives));
    this.maxLives = maxLives;
    this.updateHearts();
  }

  /**
   * Update hearts display
   */
  private updateHearts(): void {
    // Initialize hearts array if not already initialized
    if (!this.hearts) {
      this.hearts = [];
    }
    
    // Remove existing hearts
    if (this.hearts && this.hearts.length > 0) {
      this.hearts.forEach(heart => {
        if (heart && heart.active) {
          heart.destroy();
        }
      });
    }
    this.hearts = [];

    // Create hearts
    const startX = 20;
    for (let i = 0; i < this.maxLives; i++) {
      const heartX = startX + i * this.heartSpacing;
      const isFull = i < this.currentLives;
      
      // Try to use heart sprite if available, otherwise use graphics
      let heart: Phaser.GameObjects.Image | Phaser.GameObjects.Graphics;
      
      if (this.scene.textures.exists('heart')) {
        // Use heart sprite
        heart = this.scene.add.image(heartX, 0, 'heart');
        heart.setTint(isFull ? this.theme.colors.danger : 0x666666);
        heart.setAlpha(isFull ? 1 : 0.3);
        heart.setScale(0.4);
        heart.setOrigin(0.5, 0.5);
      } else {
        // Create heart shape using graphics as fallback
        const heartGraphics = this.scene.add.graphics();
        const heartColor = isFull ? this.theme.colors.danger : 0x666666;
        const heartAlpha = isFull ? 1 : 0.3;
        
        // Draw heart shape (simplified) - centered at origin
        heartGraphics.fillStyle(heartColor, heartAlpha);
        heartGraphics.fillCircle(-4, 0, 4); // Left circle
        heartGraphics.fillCircle(4, 0, 4); // Right circle
        heartGraphics.fillTriangle(0, 0, -8, -6, 8, -6); // Top triangle
        heartGraphics.fillTriangle(0, 8, -6, 0, 6, 0); // Bottom triangle
        
        heartGraphics.setPosition(heartX, 0);
        heart = heartGraphics;
      }
      
      // Add glow effect for full hearts
      if (isFull) {
        this.scene.tweens.add({
          targets: heart,
          alpha: { from: 0.7, to: 1 },
          duration: 1000,
          repeat: -1,
          yoyo: true,
          ease: 'Sine.easeInOut',
        });
      }
      
      this.hearts.push(heart as any);
      this.container.add(heart);
    }

    // Animate hearts when lives change
    if (this.currentLives > 0 && this.hearts && this.hearts.length > 0) {
      this.hearts.slice(0, this.currentLives).forEach((heart, index) => {
        if (heart) {
          this.scene.tweens.add({
            targets: heart,
            scaleX: 1.3,
            scaleY: 1.3,
            duration: 200,
            delay: index * 50,
            yoyo: true,
            ease: 'Back.easeOut',
          });
        }
      });
    }
  }

  /**
   * Lose a life with animation
   */
  loseLife(): void {
    if (this.currentLives > 0 && this.hearts && this.hearts.length > 0) {
      const lostHeart = this.hearts[this.currentLives - 1];
      if (lostHeart) {
        // Animate heart loss
        this.scene.tweens.add({
          targets: lostHeart,
          scaleX: 0,
          scaleY: 0,
          alpha: 0,
          duration: 300,
          ease: 'Back.easeIn',
          onComplete: () => {
            this.setLives(this.currentLives - 1, this.maxLives);
          },
        });
      }
    }
  }

  /**
   * Gain a life with animation
   */
  gainLife(): void {
    if (this.currentLives < this.maxLives) {
      this.setLives(this.currentLives + 1, this.maxLives);
      if (this.hearts && this.hearts.length > 0) {
        const newHeart = this.hearts[this.currentLives - 1];
        if (newHeart) {
          newHeart.setScale(0);
          newHeart.setAlpha(0);
          this.scene.tweens.add({
            targets: newHeart,
            scaleX: 1,
            scaleY: 1,
            alpha: 1,
            duration: 400,
            ease: 'Back.easeOut',
          });
        }
      }
    }
  }
}

