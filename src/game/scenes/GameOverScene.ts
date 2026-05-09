import { BaseMenuScene } from '../../ui/menu/BaseMenuScene';
import { MenuContainer } from '../../ui/menu/MenuContainer';
import { MusicContext } from '../../systems/audio/MusicState';
import { HighScoreManager } from '../../systems/scores/HighScoreManager';

export class GameOverScene extends BaseMenuScene {
  private isVictory: boolean = false;
  private score: number = 0;
  private gameTime: number = 0;
  private titleText?: Phaser.GameObjects.Text;
  private scoreText?: Phaser.GameObjects.Text;
  private timeText?: Phaser.GameObjects.Text;
  private submittedName?: string;

  constructor() {
    super('GameOverScene');
  }

  init(data: { victory?: boolean; score?: number; time?: number }) {
    this.isVictory = data.victory || false;
    this.score = data.score || 0;
    this.gameTime = data.time || 0;
  }

  create() {
    // super.create() initializes this.audioManager, creates the background,
    // and calls this.createMenu() — do not call createMenu() again here.
    super.create();

    const { width, height } = this.cameras.main;

    // Override background to near-black
    if (this.background) {
      this.background.setFillStyle(0x000000, 0.95);
    }

    // Stop gameplay music then play context-appropriate audio
    this.audioManager?.stopMusic(true, 500);
    this.time.delayedCall(100, () => {
      if (this.isVictory) {
        this.audioManager?.playSound('levelAdvance');
        this.time.delayedCall(1000, () => {
          this.audioManager?.playMusicWithContext('menu', MusicContext.MENU, true);
        });
      } else {
        this.audioManager?.playSound('gameOver');
        this.time.delayedCall(500, () => {
          this.audioManager?.playMusicWithContext('dialogue', MusicContext.GAME_OVER, false);
        });
      }
    });

    // Title
    const titleColor = this.isVictory ? '#00ff00' : '#ff0000';
    this.titleText = this.add.text(
      width / 2,
      height / 3,
      this.isVictory ? 'VICTORY!' : 'GAME OVER',
      {
        fontSize: '80px',
        fontFamily: this.theme.typography.titleFont,
        color: titleColor,
        stroke: '#000000',
        strokeThickness: this.theme.typography.titleStroke,
        fontStyle: 'bold',
      }
    );
    this.titleText.setOrigin(0.5).setDepth(1001).setAlpha(0).setScale(0.5);

    this.tweens.add({
      targets: this.titleText,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 600,
      ease: 'Back.easeOut',
    });

    // Score
    this.scoreText = this.add.text(
      width / 2,
      height / 2 - 30,
      `SCORE: ${this.score.toLocaleString()}`,
      {
        fontSize: '24px',
        fontFamily: this.theme.typography.itemFont,
        color: `#${this.theme.colors.text.toString(16).padStart(6, '0')}`,
        stroke: '#000000',
        strokeThickness: 2,
      }
    );
    this.scoreText.setOrigin(0.5).setDepth(1001).setAlpha(0);

    this.tweens.add({
      targets: this.scoreText,
      alpha: 1,
      duration: 500,
      delay: 400,
      ease: 'Power2',
    });

    // Time display (only shown when time data is available)
    if (this.gameTime > 0) {
      const minutes = Math.floor(this.gameTime / 60);
      const seconds = this.gameTime % 60;
      const timeLabel = `TIME: ${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

      this.timeText = this.add.text(
        width / 2,
        height / 2 + 10,
        timeLabel,
        {
          fontSize: '18px',
          fontFamily: this.theme.typography.itemFont,
          color: '#aaaaaa',
          stroke: '#000000',
          strokeThickness: 2,
        }
      );
      this.timeText.setOrigin(0.5).setDepth(1001).setAlpha(0);

      this.tweens.add({
        targets: this.timeText,
        alpha: 1,
        duration: 500,
        delay: 600,
        ease: 'Power2',
      });
    }
  }

  protected createMenu() {
    this.input.keyboard?.on('keydown-ESC', () => {
      this.audioManager?.playSound('menuSelect');
      this.returnToMenu();
    });

    if (HighScoreManager.isHighScore(this.score)) {
      // Delay until title animation finishes, then show name entry
      this.time.delayedCall(900, () => this.setupNameEntry());
    } else {
      this.time.delayedCall(800, () => this.showStandardMenu());
    }
  }

  private setupNameEntry() {
    const { width, height } = this.cameras.main;
    const FONT = this.theme.typography.itemFont;
    const menuY = height / 2 + (this.gameTime > 0 ? 60 : 50);

    // "NEW HIGH SCORE!" banner
    const newHSBanner = this.add.text(width / 2, menuY, '★ NEW HIGH SCORE! ★', {
      fontSize: '20px', fontFamily: FONT, color: '#ffd700',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(1002).setAlpha(0);

    this.tweens.add({ targets: newHSBanner, alpha: 1, duration: 300, ease: 'Power2' });
    this.tweens.add({
      targets: newHSBanner,
      scaleX: 1.05, scaleY: 1.05,
      duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });

    // Prompt label
    const promptLabel = this.add.text(width / 2, menuY + 42, 'ENTER YOUR NAME:', {
      fontSize: '13px', fontFamily: FONT, color: '#aaaaaa',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(1002).setAlpha(0);

    this.tweens.add({ targets: promptLabel, alpha: 1, duration: 300, delay: 150, ease: 'Power2' });

    // Name input display
    let playerName = '';
    const MAX_LEN = 8;
    let showCursor = true;

    const nameDisplay = this.add.text(width / 2, menuY + 72, '_', {
      fontSize: '24px', fontFamily: FONT, color: '#00ff88',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(1002).setAlpha(0);

    this.tweens.add({ targets: nameDisplay, alpha: 1, duration: 300, delay: 250, ease: 'Power2' });

    // Hint
    const hintText = this.add.text(width / 2, menuY + 102, 'PRESS ENTER TO CONFIRM', {
      fontSize: '10px', fontFamily: FONT, color: '#555555',
    }).setOrigin(0.5).setDepth(1002).setAlpha(0);
    this.tweens.add({ targets: hintText, alpha: 1, duration: 300, delay: 400, ease: 'Power2' });

    const updateDisplay = () => {
      nameDisplay.setText((playerName || '') + (showCursor ? '_' : ' '));
    };

    const cursorTimer = this.time.addEvent({
      delay: 530, loop: true,
      callback: () => { showCursor = !showCursor; updateDisplay(); }
    });

    const keyHandler = (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        cursorTimer.destroy();
        this.input.keyboard?.off('keydown', keyHandler);
        [newHSBanner, promptLabel, nameDisplay, hintText].forEach(o => o.destroy());
        this.submittedName = playerName || 'AAA';
        HighScoreManager.addScore(this.submittedName, this.score);
        this.showStandardMenu();
      } else if (event.key === 'Backspace') {
        playerName = playerName.slice(0, -1);
        updateDisplay();
      } else if (event.key.length === 1 && /[a-zA-Z0-9 ]/.test(event.key) && playerName.length < MAX_LEN) {
        playerName += event.key.toUpperCase();
        updateDisplay();
      }
    };

    this.input.keyboard?.on('keydown', keyHandler);
  }

  private showStandardMenu() {
    const { width, height } = this.cameras.main;
    const menuY = height / 2 + (this.gameTime > 0 ? 80 : 100);

    this.menuContainer = new MenuContainer(
      this, width / 2, menuY, '', this.theme, undefined, this.audioManager
    );

    this.menuContainer.addButton('PLAY AGAIN', () => this.playAgain());

    if (this.submittedName !== undefined || HighScoreManager.getScores().length > 0) {
      this.menuContainer.addButton('HIGH SCORES', () => this.openHighScores());
    }

    this.menuContainer.addButton('MAIN MENU', () => this.returnToMenu());

    this.menuContainer.getContainer().setAlpha(0);
    this.tweens.add({
      targets: this.menuContainer.getContainer(),
      alpha: 1, duration: 400, ease: 'Power2',
    });
  }

  private openHighScores() {
    this.scene.start('HighScoreScene', {
      returnScene: 'MainMenuScene',
      highlightScore: this.submittedName !== undefined ? this.score : -1,
      highlightName: this.submittedName || '',
    });
  }

  protected playMenuMusic() {
    // Audio is handled in create() after the base class setup completes
  }

  private playAgain() {
    this.scene.stop('GameOverScene');
    this.scene.start('CharacterSelectScene', {
      isMultiplayer: false,
    });
  }

  private returnToMenu() {
    this.scene.start('MainMenuScene');
  }

  shutdown() {
    this.audioManager?.stopMusic(true);
  }
}
