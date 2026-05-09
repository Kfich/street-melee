import Phaser from 'phaser';
import { AudioManager } from '../../systems/audio/AudioManager';

const CONTINUE_SECONDS = 9;

export class ContinueScene extends Phaser.Scene {
  private countdown: number = CONTINUE_SECONDS;
  private countdownTimer?: Phaser.Time.TimerEvent;
  private countdownText?: Phaser.GameObjects.Text;
  private score: number = 0;
  private gameTime: number = 0;
  private audioManager?: AudioManager;
  private inputHandled: boolean = false;

  constructor() {
    super({ key: 'ContinueScene' });
  }

  init(data: { score?: number; time?: number }) {
    this.score = data.score || 0;
    this.gameTime = data.time || 0;
    this.countdown = CONTINUE_SECONDS;
    this.inputHandled = false;
  }

  create() {
    const { width, height } = this.cameras.main;

    // Borrow audio from the paused game scene
    const gameScene = this.scene.get('GameScene');
    if (gameScene && (gameScene as any).audioManager) {
      this.audioManager = (gameScene as any).audioManager as AudioManager;
      this.audioManager.pauseMusic();
      this.time.delayedCall(100, () => {
        this.audioManager?.playSound('continue', 0.8);
      });
    }

    // Dark overlay
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.88).setDepth(0);

    // "CONTINUE?" title — flashes red/yellow
    const titleText = this.add.text(width / 2, height * 0.28, 'CONTINUE?', {
      fontSize: '78px',
      fontFamily: 'Arial Black, Arial',
      color: '#ff0000',
      stroke: '#000000',
      strokeThickness: 8,
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(1).setAlpha(0).setScale(0.4);

    this.tweens.add({
      targets: titleText,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 350,
      ease: 'Back.easeOut',
    });

    // Flash title red ↔ yellow
    this.time.addEvent({
      delay: 480,
      loop: true,
      callback: () => {
        if (titleText.active) {
          titleText.setColor(titleText.style.color === '#ff0000' ? '#ffff00' : '#ff0000');
        }
      }
    });

    // Big countdown number
    this.countdownText = this.add.text(width / 2, height * 0.50, String(this.countdown), {
      fontSize: '140px',
      fontFamily: 'Arial Black, Arial',
      color: this.numberColor(this.countdown),
      stroke: '#000000',
      strokeThickness: 12,
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(1);

    // "Press any key" prompt
    const promptText = this.add.text(width / 2, height * 0.73, 'PRESS ANY KEY TO CONTINUE', {
      fontSize: '22px',
      fontFamily: 'Arial',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(1).setAlpha(0);

    this.tweens.add({
      targets: promptText,
      alpha: 1,
      duration: 300,
      delay: 400,
      ease: 'Power2',
    });

    // Blink
    this.time.delayedCall(700, () => {
      this.tweens.add({
        targets: promptText,
        alpha: 0.2,
        duration: 450,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    });

    // Start countdown after title animation settles
    this.time.delayedCall(500, () => this.startCountdown());

    // Accept any input
    this.input.keyboard?.once('keydown', () => this.doContinue());
    this.input.once('pointerdown', () => this.doContinue());
  }

  private numberColor(n: number): string {
    if (n >= 7) return '#ffff00';
    if (n >= 4) return '#ff8800';
    return '#ff2200';
  }

  private startCountdown() {
    this.countdownTimer = this.time.addEvent({
      delay: 1000,
      repeat: this.countdown - 1,
      callback: () => {
        if (this.inputHandled) return;
        this.countdown--;

        if (this.countdownText) {
          this.countdownText.setText(String(this.countdown));
          this.countdownText.setColor(this.numberColor(this.countdown));

          // Pulse on tick
          this.tweens.add({
            targets: this.countdownText,
            scaleX: 1.35,
            scaleY: 1.35,
            duration: 90,
            yoyo: true,
            ease: 'Power2',
          });
        }

        if (this.countdown <= 0) {
          this.doGameOver();
        }
      }
    });
  }

  private doContinue() {
    if (this.inputHandled) return;
    this.inputHandled = true;

    this.countdownTimer?.destroy();

    // Green flash
    this.cameras.main.flash(280, 0, 180, 0, true);
    this.audioManager?.playSound('menuSelect', 0.9);

    // Tell GameScene to restore the player
    const gameScene = this.scene.get('GameScene') as any;
    if (gameScene && typeof gameScene.respawnAfterContinue === 'function') {
      gameScene.respawnAfterContinue();
    }

    // Resume gameplay music
    this.time.delayedCall(280, () => {
      this.audioManager?.resumeMusic();
      this.scene.resume('GameScene');
      this.scene.stop();
    });
  }

  private doGameOver() {
    if (this.inputHandled) return;
    this.inputHandled = true;

    this.countdownTimer?.destroy();

    // Red flash
    this.cameras.main.flash(400, 180, 0, 0, true);
    this.audioManager?.playSound('gameOver', 0.8);

    this.time.delayedCall(500, () => {
      this.scene.stop('GameScene');
      this.scene.start('GameOverScene', {
        victory: false,
        score: this.score,
        time: this.gameTime,
      });
    });
  }

  shutdown() {
    this.countdownTimer?.destroy();
  }
}
