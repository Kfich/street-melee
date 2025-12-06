import Phaser from 'phaser';
import { Boss } from '../entities/bosses/Boss';

/**
 * Boss Health Bar UI Component
 * Displays a prominent health bar for boss enemies at the top of the screen
 */
export class BossHealthBar {
  private scene: Phaser.Scene;
  private boss: Boss | null = null;
  private healthBarBg!: Phaser.GameObjects.Rectangle;
  private healthBarFill!: Phaser.GameObjects.Rectangle;
  private healthBarBorder!: Phaser.GameObjects.Rectangle;
  private bossNameText!: Phaser.GameObjects.Text;
  private phaseText!: Phaser.GameObjects.Text;
  private healthText!: Phaser.GameObjects.Text;
  private isVisible: boolean = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.createHealthBar();
    this.setVisible(false);
  }

  /**
   * Create the boss health bar UI elements
   */
  private createHealthBar(): void {
    const { width } = this.scene.cameras.main;
    const barWidth = width * 0.6; // 60% of screen width
    const barHeight = 30;
    const barX = width / 2;
    const barY = 40; // Top of screen
    const borderWidth = 2;

    // Background (dark red/black)
    this.healthBarBg = this.scene.add.rectangle(
      barX,
      barY,
      barWidth,
      barHeight,
      0x000000,
      0.8
    );
    this.healthBarBg.setDepth(2000);
    this.healthBarBg.setScrollFactor(0, 0); // Fixed to camera

    // Border (red)
    this.healthBarBorder = this.scene.add.rectangle(
      barX,
      barY,
      barWidth + borderWidth * 2,
      barHeight + borderWidth * 2,
      0xff0000,
      1
    );
    this.healthBarBorder.setDepth(2001);
    this.healthBarBorder.setScrollFactor(0, 0);
    this.healthBarBorder.setStrokeStyle(borderWidth, 0xffffff);

    // Health fill (red to yellow gradient effect)
    this.healthBarFill = this.scene.add.rectangle(
      barX - barWidth / 2,
      barY,
      0, // Start at 0 width
      barHeight - borderWidth * 2,
      0xff0000,
      1
    );
    this.healthBarFill.setOrigin(0, 0.5);
    this.healthBarFill.setDepth(2002);
    this.healthBarFill.setScrollFactor(0, 0);

    // Boss name text
    // Initialize with empty string - will be set when boss is assigned
    this.bossNameText = this.scene.add.text(
      barX,
      barY - 25,
      'BOSS',
      {
        fontSize: '20px',
        fontFamily: 'Arial',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 3,
        fontStyle: 'bold'
      }
    );
    this.bossNameText.setOrigin(0.5, 0.5);
    this.bossNameText.setDepth(2003);
    this.bossNameText.setScrollFactor(0, 0);
    // Ensure text is visible and active
    this.bossNameText.setVisible(true);
    this.bossNameText.setActive(true);

    // Phase indicator text
    this.phaseText = this.scene.add.text(
      barX - barWidth / 2 + 10,
      barY,
      '',
      {
        fontSize: '14px',
        fontFamily: 'Arial',
        color: '#ffff00',
        stroke: '#000000',
        strokeThickness: 2,
        fontStyle: 'bold'
      }
    );
    this.phaseText.setOrigin(0, 0.5);
    this.phaseText.setDepth(2003);
    this.phaseText.setScrollFactor(0, 0);

    // Health percentage text
    this.healthText = this.scene.add.text(
      barX + barWidth / 2 - 10,
      barY,
      '',
      {
        fontSize: '16px',
        fontFamily: 'Arial',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2,
        fontStyle: 'bold'
      }
    );
    this.healthText.setOrigin(1, 0.5);
    this.healthText.setDepth(2003);
    this.healthText.setScrollFactor(0, 0);
  }

  /**
   * Set the boss to track
   */
  setBoss(boss: Boss): void {
    this.boss = boss;
    this.updateBossName();
    this.setVisible(true);
  }

  /**
   * Update boss name display
   */
  private updateBossName(): void {
    if (!this.boss || !this.bossNameText) return;

    const bossNames: Record<string, string> = {
      'mr_x': 'MR. X',
      'abobo': 'ABOBO',
      'barbon': 'BARBON',
      'tony': 'TONY',
      'midnight': 'DOCTOR MIDNIGHT',
      'police': 'POLICE',
      'blizz': 'BLIZZY',
      'benny': 'BIG BEN',
      'principle': 'PRINCIPAL',
      'angela': 'ANGELA'
    };

    const name = bossNames[this.boss.getBossType()] || 'BOSS';
    
    // Always defer text setting to next frame to ensure Phaser has fully initialized the texture
    // This prevents "Cannot read properties of null (reading 'drawImage')" errors
    this.scene.time.delayedCall(0, () => {
      if (this.bossNameText && this.bossNameText.active && this.bossNameText.scene) {
        try {
          this.bossNameText.setText(name);
        } catch (error) {
          // If setting text fails, try again after a longer delay
          console.warn('[BossHealthBar] Failed to set boss name, retrying...', error);
          this.scene.time.delayedCall(50, () => {
            if (this.bossNameText && this.bossNameText.active && this.bossNameText.scene) {
              try {
                this.bossNameText.setText(name);
              } catch (e) {
                console.error('[BossHealthBar] Failed to set boss name after retry', e);
              }
            }
          });
        }
      }
    });
  }

  /**
   * Update health bar display
   */
  update(): void {
    if (!this.boss || !this.isVisible) return;

    const healthPercent = this.boss.getHealthPercent();
    const currentHealth = this.boss.getHealth();
    const maxHealth = this.boss.getMaxHealth();
    const phase = this.boss.getCurrentPhase();

    // Update health bar fill width
    const { width } = this.scene.cameras.main;
    const barWidth = width * 0.6;
    const borderWidth = 2;
    const fillWidth = (barWidth - borderWidth * 2) * healthPercent;

    this.healthBarFill.width = Math.max(0, fillWidth);
    this.healthBarFill.x = width / 2 - barWidth / 2 + borderWidth;

    // Update health bar color based on health percentage
    if (healthPercent > 0.66) {
      this.healthBarFill.setFillStyle(0xff0000); // Red
    } else if (healthPercent > 0.33) {
      this.healthBarFill.setFillStyle(0xff6600); // Orange
    } else {
      this.healthBarFill.setFillStyle(0xffff00); // Yellow (enraged)
    }

    // Update phase text
    this.phaseText.setText(`PHASE ${phase}`);

    // Update health text
    this.healthText.setText(`${currentHealth}/${maxHealth}`);

    // Hide if boss is defeated
    if (healthPercent <= 0) {
      this.setVisible(false);
    }
  }

  /**
   * Show/hide the health bar
   */
  setVisible(visible: boolean): void {
    this.isVisible = visible;
    this.healthBarBg.setVisible(visible);
    this.healthBarBorder.setVisible(visible);
    this.healthBarFill.setVisible(visible);
    this.bossNameText.setVisible(visible);
    this.phaseText.setVisible(visible);
    this.healthText.setVisible(visible);
  }

  /**
   * Clear boss reference
   */
  clearBoss(): void {
    this.boss = null;
    this.setVisible(false);
  }

  /**
   * Destroy the health bar
   */
  destroy(): void {
    this.healthBarBg.destroy();
    this.healthBarBorder.destroy();
    this.healthBarFill.destroy();
    this.bossNameText.destroy();
    this.phaseText.destroy();
    this.healthText.destroy();
  }
}

