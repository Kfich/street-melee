import Phaser from 'phaser';
import { BaseWidget } from './BaseWidget';
import { Player } from '../../entities/characters/Player';

/**
 * In-Game Player HUD
 * Unified component that displays all player information widgets
 */
export class InGamePlayerHUD extends BaseWidget {
  // Widget elements
  private playerIconImage!: Phaser.GameObjects.Image | null;
  private livesXText!: Phaser.GameObjects.Text;
  private hearts: (Phaser.GameObjects.Image | Phaser.GameObjects.Graphics)[] = [];
  private healthLabel!: Phaser.GameObjects.Text;
  private healthBarBg!: Phaser.GameObjects.Graphics;
  private healthBarFill!: Phaser.GameObjects.Graphics;
  private timeText!: Phaser.GameObjects.Text;
  private pickupsLabel!: Phaser.GameObjects.Text;
  private pickupsValue!: Phaser.GameObjects.Text;
  private scoreLabel!: Phaser.GameObjects.Text;
  private scoreValue!: Phaser.GameObjects.Text;

  // State
  private player: Player | null = null;
  private currentLives: number = 3;
  private maxLives: number = 3;
  private currentScore: number = 0;
  private currentPickups: number = 0;
  private gameTime: number = 0; // in seconds
  private isClockRunning: boolean = false;
  private timeAccumulator: number = 0; // Accumulate time for sub-second updates
  private lastFrameTime: number = 0; // Track last frame time for delta calculation

  // Dimensions
  private healthBarWidth: number = 150;
  private healthBarHeight: number = 16;
  private heartSpacing: number = 30;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);
  }

  protected createWidget(): void {
    // Create unified HUD background panel
    const hudWidth = this.scene.cameras.main.width;
    const hudHeight = 50;
    const bg = this.createRoundedRect(
      0,
      0,
      hudWidth,
      hudHeight,
      this.theme.colors.background,
      0.85,
      this.theme.colors.border,
      2
    );
    this.container.add(bg);

    // Left section: Player icon + Lives
    this.createPlayerIcon();
    this.createLivesSection();

    // Center-left: Health bar
    this.createHealthSection();

    // Center: Clock
    this.createClockSection();

    // Right: Pickups and Score
    this.createPickupsSection();
    this.createScoreSection();
  }

  /**
   * Create player icon (uses selected player sprite)
   */
  private createPlayerIcon(): void {
    const iconX = -this.scene.cameras.main.width / 2 + 30;
    const iconY = 0;

    // If player is set, use their sprite; otherwise use placeholder squares
    if (this.player) {
      this.updatePlayerIcon();
    } else {
      // Red square (top) - placeholder
      const redSquare = this.scene.add.graphics();
      redSquare.fillStyle(0xff0000, 1);
      redSquare.fillRect(-6, -8, 12, 12);
      redSquare.setPosition(iconX, iconY - 4);
      this.container.add(redSquare);

      // Grey square (bottom) - placeholder
      const greySquare = this.scene.add.graphics();
      greySquare.fillStyle(0x666666, 1);
      greySquare.fillRect(-8, 0, 16, 16);
      greySquare.setPosition(iconX, iconY + 4);
      this.container.add(greySquare);
    }
  }

  /**
   * Update player icon with selected player sprite
   */
  private updatePlayerIcon(): void {
    // Remove old icon if it exists
    if (this.playerIconImage) {
      this.playerIconImage.destroy();
      this.playerIconImage = null;
    }

    if (!this.player) return;

    const iconX = -this.scene.cameras.main.width / 2 + 30;
    const iconY = 0;

    // Get character type and create sprite key
    const characterType = (this.player as any).getCharacterType ? (this.player as any).getCharacterType() : null;
    if (characterType) {
      const spriteKey = `${characterType}_idle_right`;
      
      // Check if sprite exists, otherwise use placeholder
      if (this.scene.textures.exists(spriteKey)) {
        this.playerIconImage = this.scene.add.image(iconX, iconY, spriteKey);
        this.playerIconImage.setScale(0.15); // Standardized small icon size
        this.playerIconImage.setOrigin(0.5, 0.5);
        this.playerIconImage.setScrollFactor(0); // Fixed to camera
        this.container.add(this.playerIconImage);
      } else {
        // Fallback to placeholder squares
        const redSquare = this.scene.add.graphics();
        redSquare.fillStyle(0xff0000, 1);
        redSquare.fillRect(-6, -8, 12, 12);
        redSquare.setPosition(iconX, iconY - 4);
        this.container.add(redSquare);

        const greySquare = this.scene.add.graphics();
        greySquare.fillStyle(0x666666, 1);
        greySquare.fillRect(-8, 0, 16, 16);
        greySquare.setPosition(iconX, iconY + 4);
        this.container.add(greySquare);
      }
    }
  }

  /**
   * Create lives section (X + hearts)
   */
  private createLivesSection(): void {
    const livesX = -this.scene.cameras.main.width / 2 + 60;
    
    // X symbol
    this.livesXText = this.createText(
      livesX,
      0,
      'X',
      this.theme.typography.fontSize.small,
      `#${this.theme.colors.text.toString(16).padStart(6, '0')}`
    );
    this.container.add(this.livesXText);

    // Hearts will be created when lives are set
    this.updateHearts();
  }

  /**
   * Create health section
   */
  private createHealthSection(): void {
    const healthX = -this.scene.cameras.main.width / 2 + 200;
    
    // Health label
    this.healthLabel = this.createText(
      healthX - this.healthBarWidth / 2 - 5,
      0,
      'HEALTH:',
      this.theme.typography.fontSize.small,
      `#${this.theme.colors.success.toString(16).padStart(6, '0')}`
    );
    this.healthLabel.setOrigin(1, 0.5);
    this.container.add(this.healthLabel);

    // Health bar background
    this.healthBarBg = this.scene.add.graphics();
    this.healthBarBg.fillStyle(this.theme.colors.background, 0.8);
    this.healthBarBg.fillRoundedRect(
      healthX - this.healthBarWidth / 2,
      -this.healthBarHeight / 2,
      this.healthBarWidth,
      this.healthBarHeight,
      2
    );
    this.healthBarBg.setPosition(healthX, 0);
    this.container.add(this.healthBarBg);

    // Health bar fill
    this.healthBarFill = this.scene.add.graphics();
    this.updateHealthBar(1.0);
    this.healthBarFill.setPosition(healthX, 0);
    this.container.add(this.healthBarFill);
  }

  /**
   * Create clock section
   */
  private createClockSection(): void {
    const clockX = 0; // Center
    const pinkColor = 0xff00ff; // Bright pink/fuchsia
    
    // Increase font size by 10 (medium is 12px, so 22px)
    const clockFontSize = '22px';
    
    this.timeText = this.createText(
      clockX,
      0,
      '00:00',
      clockFontSize,
      `#${pinkColor.toString(16).padStart(6, '0')}`
    );
    this.container.add(this.timeText);
  }

  /**
   * Create pickups section
   */
  private createPickupsSection(): void {
    // Move 40px to the left
    const pickupsX = this.scene.cameras.main.width / 2 - 190;
    
    this.pickupsLabel = this.createText(
      pickupsX - 40,
      0,
      'PICKUPS:',
      this.theme.typography.fontSize.small,
      `#${this.theme.colors.text.toString(16).padStart(6, '0')}`
    );
    this.pickupsLabel.setOrigin(1, 0.5);
    this.container.add(this.pickupsLabel);

    this.pickupsValue = this.createText(
      pickupsX + 10,
      0,
      '0',
      this.theme.typography.fontSize.small,
      `#${this.theme.colors.text.toString(16).padStart(6, '0')}`
    );
    this.container.add(this.pickupsValue);
  }

  /**
   * Create score section
   */
  private createScoreSection(): void {
    // Move 25px to the left
    const scoreX = this.scene.cameras.main.width / 2 - 45;
    
    this.scoreLabel = this.createText(
      scoreX - 30,
      0,
      'SCORE:',
      this.theme.typography.fontSize.small,
      `#${this.theme.colors.secondary.toString(16).padStart(6, '0')}`
    );
    this.scoreLabel.setOrigin(1, 0.5);
    this.container.add(this.scoreLabel);

    this.scoreValue = this.createText(
      scoreX + 10,
      0,
      '0',
      this.theme.typography.fontSize.small,
      `#${this.theme.colors.secondary.toString(16).padStart(6, '0')}`
    );
    this.container.add(this.scoreValue);
  }

  /**
   * Update widget state
   */
  update(): void {
    // Update clock - use scene time for frame-rate independent updates
    if (this.isClockRunning && !this.scene.scene.isPaused()) {
      const currentTime = this.scene.time.now;
      const delta = this.lastFrameTime > 0 ? currentTime - this.lastFrameTime : 16; // Default to ~60fps if first frame
      this.lastFrameTime = currentTime;
      
      this.timeAccumulator += delta;
      
      // Update every second (1000ms)
      if (this.timeAccumulator >= 1000) {
        this.gameTime += Math.floor(this.timeAccumulator / 1000);
        this.timeAccumulator = this.timeAccumulator % 1000;
        this.updateClock();
      }
    } else if (!this.isClockRunning) {
      // Reset frame time when clock stops
      this.lastFrameTime = 0;
    }

    // Update health bar
    if (this.player && this.player.sprite && this.player.sprite.active) {
      const health = this.player.getHealth();
      const maxHealth = this.player.getMaxHealth();
      const healthPercent = health / maxHealth;
      this.updateHealthBar(healthPercent);
    } else if (this.player === null || (this.player && (!this.player.sprite || !this.player.sprite.active))) {
      this.updateHealthBar(0);
    }
  }

  /**
   * Set player for health tracking
   */
  setPlayer(player: Player | null): void {
    this.player = player;
    if (player) {
      this.updateHealthBar(player.getHealth() / player.getMaxHealth());
      // Update player icon when player is set
      this.updatePlayerIcon();
    } else {
      this.updateHealthBar(0);
    }
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
   * Lose a life
   */
  loseLife(): void {
    if (this.currentLives > 0) {
      this.setLives(this.currentLives - 1, this.maxLives);
    }
  }

  /**
   * Gain a life
   */
  gainLife(): void {
    if (this.currentLives < this.maxLives) {
      this.setLives(this.currentLives + 1, this.maxLives);
    }
  }

  /**
   * Set score
   */
  setScore(score: number): void {
    if (this.currentScore !== score) {
      this.currentScore = score;
      if (this.scoreValue) {
        this.scoreValue.setText(score.toString());
        // Animate score change
        this.scene.tweens.add({
          targets: this.scoreValue,
          scaleX: 1.2,
          scaleY: 1.2,
          duration: 150,
          yoyo: true,
          ease: 'Back.easeOut',
        });
      }
    }
  }

  /**
   * Add to score
   */
  addScore(points: number): void {
    this.setScore(this.currentScore + points);
  }

  /**
   * Set pickup count
   */
  setPickupCount(count: number): void {
    if (this.currentPickups !== count) {
      this.currentPickups = count;
      if (this.pickupsValue) {
        this.pickupsValue.setText(count.toString());
        // Animate pickup change
        this.scene.tweens.add({
          targets: this.pickupsValue,
          scaleX: 1.2,
          scaleY: 1.2,
          duration: 150,
          yoyo: true,
          ease: 'Back.easeOut',
        });
      }
    }
  }

  /**
   * Increment pickup count
   */
  incrementPickup(): void {
    this.setPickupCount(this.currentPickups + 1);
  }

  /**
   * Start game clock
   */
  startClock(): void {
    this.isClockRunning = true;
    this.lastFrameTime = this.scene.time.now; // Use scene time for consistency
    this.timeAccumulator = 0; // Reset accumulator
  }

  /**
   * Stop game clock
   */
  stopClock(): void {
    this.isClockRunning = false;
  }

  /**
   * Reset game clock
   */
  resetClock(): void {
    this.gameTime = 0;
    this.lastFrameTime = this.scene.time.now; // Use scene time for consistency
    this.timeAccumulator = 0; // Reset accumulator
    this.updateClock();
  }

  /**
   * Get current game time in seconds
   */
  getGameTime(): number {
    return this.gameTime;
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
    const startX = -this.scene.cameras.main.width / 2 + 80;
    for (let i = 0; i < this.maxLives; i++) {
      const heartX = startX + i * this.heartSpacing;
      const isFull = i < this.currentLives;
      
      // Try to use heart sprite if available, otherwise use graphics
      let heart: Phaser.GameObjects.Image | Phaser.GameObjects.Graphics;
      
      if (this.scene.textures.exists('heart')) {
        // Use heart sprite - increase size by 50% (0.4 -> 0.6)
        heart = this.scene.add.image(heartX, 0, 'heart');
        heart.setTint(isFull ? this.theme.colors.danger : 0x666666);
        heart.setAlpha(isFull ? 1 : 0.3);
        heart.setScale(0.6); // Increased from 0.4 to 0.6 (50% increase)
        heart.setOrigin(0.5, 0.5);
      } else {
        // Create heart shape using graphics as fallback - increase size by 50%
        const heartGraphics = this.scene.add.graphics();
        const heartColor = isFull ? this.theme.colors.danger : 0x666666;
        const heartAlpha = isFull ? 1 : 0.3;
        
        // Draw heart shape (simplified) - increased size by 50% (radius 4 -> 6)
        heartGraphics.fillStyle(heartColor, heartAlpha);
        heartGraphics.fillCircle(-6, 0, 6); // Left circle (was -4, 4)
        heartGraphics.fillCircle(6, 0, 6); // Right circle (was 4, 4)
        heartGraphics.fillTriangle(0, 0, -12, -9, 12, -9); // Top triangle (was -8, -6, 8, -6)
        heartGraphics.fillTriangle(0, 12, -9, 0, 9, 0); // Bottom triangle (was 0, 8, -6, 0, 6, 0)
        
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
      
      this.hearts.push(heart);
      this.container.add(heart);
    }
  }

  /**
   * Update health bar display
   */
  private updateHealthBar(healthPercent: number): void {
    if (!this.healthBarFill) return;

    this.healthBarFill.clear();
    
    const fillWidth = this.healthBarWidth * Math.max(0, Math.min(1, healthPercent));
    const healthColor = healthPercent > 0.5 
      ? this.theme.colors.success 
      : healthPercent > 0.25 
      ? this.theme.colors.warning 
      : this.theme.colors.danger;

    // Draw health bar fill
    const healthX = -this.scene.cameras.main.width / 2 + 200;
    this.healthBarFill.fillStyle(healthColor, 1);
    this.healthBarFill.fillRoundedRect(
      healthX - this.healthBarWidth / 2,
      -this.healthBarHeight / 2,
      fillWidth,
      this.healthBarHeight,
      2
    );

    // Pulse effect when health is low
    if (healthPercent > 0 && healthPercent <= 0.25) {
      this.scene.tweens.add({
        targets: this.healthBarFill,
        alpha: { from: 0.7, to: 1 },
        duration: 500,
        repeat: -1,
        yoyo: true,
        ease: 'Sine.easeInOut',
      });
    }
  }

  /**
   * Update clock display
   */
  private updateClock(): void {
    if (!this.timeText) return;

    const minutes = Math.floor(this.gameTime / 60);
    const seconds = this.gameTime % 60;
    const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    this.timeText.setText(timeString);

    // Pulse animation every second
    this.scene.tweens.add({
      targets: this.timeText,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 100,
      yoyo: true,
      ease: 'Power2',
    });
  }
}

