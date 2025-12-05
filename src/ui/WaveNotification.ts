import Phaser from 'phaser';

/**
 * Wave notification UI component
 */
export class WaveNotification {
  private scene: Phaser.Scene;
  private notificationText?: Phaser.GameObjects.Text;
  private x: number;
  private y: number;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.createNotificationText();
  }

  private createNotificationText() {
    this.notificationText = this.scene.add.text(this.x, this.y, '', {
      fontSize: '48px',
      fontFamily: 'Arial',
      color: '#ffff00',
      stroke: '#000000',
      strokeThickness: 6,
      fontStyle: 'bold'
    });
    this.notificationText.setOrigin(0.5);
    this.notificationText.setVisible(false);
    this.notificationText.setDepth(2000);
    this.notificationText.setScrollFactor(0); // Fixed to camera
  }

  /**
   * Show wave notification
   */
  showWave(waveNumber: number) {
    if (!this.notificationText) return;

    this.notificationText.setText(`WAVE ${waveNumber}`);
    this.notificationText.setVisible(true);
    this.notificationText.setAlpha(1);
    this.notificationText.setScale(1);

    // Scale animation
    this.scene.tweens.add({
      targets: this.notificationText,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 200,
      yoyo: true,
      ease: 'Power2'
    });

    // Fade out after delay
    this.scene.tweens.add({
      targets: this.notificationText,
      alpha: 0,
      scale: 0.8,
      duration: 500,
      delay: 1500,
      ease: 'Power2',
      onComplete: () => {
        if (this.notificationText) {
          this.notificationText.setVisible(false);
        }
      }
    });
  }

  /**
   * Show checkpoint notification
   */
  showCheckpoint(_checkpointId: string) {
    if (!this.notificationText) return;

    this.notificationText.setText('CHECKPOINT');
    this.notificationText.setColor('#00ff00');
    this.notificationText.setVisible(true);
    this.notificationText.setAlpha(1);
    this.notificationText.setScale(1);

    // Scale animation
    this.scene.tweens.add({
      targets: this.notificationText,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 150,
      yoyo: true,
      ease: 'Power2'
    });

    // Fade out after delay
    this.scene.tweens.add({
      targets: this.notificationText,
      alpha: 0,
      scale: 0.9,
      duration: 400,
      delay: 1000,
      ease: 'Power2',
      onComplete: () => {
        if (this.notificationText) {
          this.notificationText.setVisible(false);
          this.notificationText.setColor('#ffff00'); // Reset color
        }
      }
    });
  }

  /**
   * Show level notification
   */
  showLevel(levelNumber: number, levelName?: string) {
    if (!this.notificationText) return;

    const text = levelName ? `${levelName.toUpperCase()}` : `LEVEL ${levelNumber}`;
    this.notificationText.setText(text);
    this.notificationText.setColor('#00ffff');
    this.notificationText.setVisible(true);
    this.notificationText.setAlpha(1);
    this.notificationText.setScale(1);

    // Scale animation
    this.scene.tweens.add({
      targets: this.notificationText,
      scaleX: 1.5,
      scaleY: 1.5,
      duration: 300,
      yoyo: true,
      ease: 'Power2'
    });

    // Fade out after delay
    this.scene.tweens.add({
      targets: this.notificationText,
      alpha: 0,
      scale: 0.8,
      duration: 600,
      delay: 2000,
      ease: 'Power2',
      onComplete: () => {
        if (this.notificationText) {
          this.notificationText.setVisible(false);
          this.notificationText.setColor('#ffff00'); // Reset color
        }
      }
    });
  }

  /**
   * Show level complete notification
   */
  showLevelComplete(levelNumber: number) {
    if (!this.notificationText) return;

    this.notificationText.setText(`LEVEL ${levelNumber} COMPLETE!`);
    this.notificationText.setColor('#00ff00');
    this.notificationText.setVisible(true);
    this.notificationText.setAlpha(1);
    this.notificationText.setScale(1);

    // Scale animation
    this.scene.tweens.add({
      targets: this.notificationText,
      scaleX: 1.4,
      scaleY: 1.4,
      duration: 250,
      yoyo: true,
      ease: 'Power2',
      repeat: 2
    });

    // Fade out after delay
    this.scene.tweens.add({
      targets: this.notificationText,
      alpha: 0,
      scale: 0.9,
      duration: 500,
      delay: 1500,
      ease: 'Power2',
      onComplete: () => {
        if (this.notificationText) {
          this.notificationText.setVisible(false);
          this.notificationText.setColor('#ffff00'); // Reset color
        }
      }
    });
  }

  /**
   * Update position
   */
  setPosition(x: number, y: number) {
    this.x = x;
    this.y = y;
    if (this.notificationText) {
      this.notificationText.setPosition(x, y);
    }
  }

  /**
   * Destroy notification
   */
  destroy() {
    if (this.notificationText) {
      this.notificationText.destroy();
    }
  }
}

