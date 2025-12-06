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
      fontFamily: '"Press Start 2P", "Courier New", monospace',
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
   * Update combo count with enhanced animations
   */
  updateCombo(count: number) {
    this.comboCount = count;
    
    if (count > 1) {
      if (this.comboText) {
        // Enhanced text with milestones
        let comboText = `${count}x COMBO!`;
        if (count >= 20) {
          comboText = `${count}x MEGA COMBO!!`;
        } else if (count >= 15) {
          comboText = `${count}x ULTRA COMBO!`;
        } else if (count >= 10) {
          comboText = `${count}x PERFECT COMBO!`;
        }
        
        this.comboText.setText(comboText);
        this.comboText.setVisible(true);
        
        // More dramatic scale animation for higher combos
        const scaleAmount = count >= 10 ? 2.0 : count >= 5 ? 1.8 : 1.5;
        const animDuration = count >= 10 ? 200 : 100;
        
        this.scene.tweens.add({
          targets: this.comboText,
          scaleX: scaleAmount,
          scaleY: scaleAmount,
          duration: animDuration,
          yoyo: true,
          ease: 'Back.easeOut'
        });
        
        // Rotation effect for high combos
        if (count >= 10) {
          this.scene.tweens.add({
            targets: this.comboText,
            angle: 5,
            duration: 100,
            yoyo: true,
            ease: 'Sine.easeInOut'
          });
        }

        // Color and styling based on combo count
        if (count >= 20) {
          this.comboText.setColor('#ff00ff'); // Bright purple for mega combos
          this.comboText.setFontSize('40px');
        } else if (count >= 15) {
          this.comboText.setColor('#ff00ff'); // Purple for ultra combos
          this.comboText.setFontSize('36px');
        } else if (count >= 10) {
          this.comboText.setColor('#ff00ff'); // Purple for perfect combos
          this.comboText.setFontSize('32px');
        } else if (count >= 5) {
          this.comboText.setColor('#ff6600'); // Orange for medium combos
          this.comboText.setFontSize('32px');
        } else {
          this.comboText.setColor('#ffff00'); // Yellow for low combos
          this.comboText.setFontSize('32px');
        }
      }

      // Reset fade timer
      if (this.fadeTimer) {
        this.fadeTimer.destroy();
      }

      // Longer display time for higher combos
      const displayTime = count >= 10 ? 3000 : 2000;
      
      // Fade out after delay
      this.fadeTimer = this.scene.time.delayedCall(displayTime, () => {
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

