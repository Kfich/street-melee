import Phaser from 'phaser';

/**
 * Combo counter UI component
 */
export class ComboCounter {
  private scene: Phaser.Scene;
  private comboText?: Phaser.GameObjects.Text;
  // @ts-ignore - Set but not read, kept for potential future tracking
  private comboCount: number = 0;
  private fadeTimer?: Phaser.Time.TimerEvent;
  private x: number;
  private y: number;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.createComboText();
  }

  private createComboText() {
    this.comboText = this.scene.add.text(this.x, this.y, '', {
      fontSize: '32px',
      fontFamily: 'Arial',
      color: '#ffff00',
      stroke: '#000000',
      strokeThickness: 4,
      fontStyle: 'bold'
    });
    this.comboText.setOrigin(0.5);
    this.comboText.setVisible(false);
    this.comboText.setDepth(1000);
  }

  /**
   * Update combo count
   */
  updateCombo(count: number) {
    this.comboCount = count;
    
    if (count > 1) {
      if (this.comboText) {
        this.comboText.setText(`${count}x COMBO!`);
        this.comboText.setVisible(true);
        
        // Scale animation
        this.scene.tweens.add({
          targets: this.comboText,
          scaleX: 1.5,
          scaleY: 1.5,
          duration: 100,
          yoyo: true,
          ease: 'Power2'
        });

        // Color based on combo count
        if (count >= 10) {
          this.comboText.setColor('#ff00ff'); // Purple for high combos
        } else if (count >= 5) {
          this.comboText.setColor('#ff6600'); // Orange for medium combos
        } else {
          this.comboText.setColor('#ffff00'); // Yellow for low combos
        }
      }

      // Reset fade timer
      if (this.fadeTimer) {
        this.fadeTimer.destroy();
      }

      // Fade out after delay
      this.fadeTimer = this.scene.time.delayedCall(2000, () => {
        if (this.comboText) {
          this.scene.tweens.add({
            targets: this.comboText,
            alpha: 0,
            duration: 500,
            onComplete: () => {
              if (this.comboText) {
                this.comboText.setVisible(false);
                this.comboText.setAlpha(1);
              }
            }
          });
        }
      });
    } else {
      this.hide();
    }
  }

  /**
   * Hide combo counter
   */
  hide() {
    if (this.comboText) {
      this.comboText.setVisible(false);
    }
    this.comboCount = 0;
  }

  /**
   * Update position
   */
  setPosition(x: number, y: number) {
    this.x = x;
    this.y = y;
    if (this.comboText) {
      this.comboText.setPosition(x, y);
    }
  }

  /**
   * Destroy combo counter
   */
  destroy() {
    if (this.fadeTimer) {
      this.fadeTimer.destroy();
    }
    if (this.comboText) {
      this.comboText.destroy();
    }
  }
}

