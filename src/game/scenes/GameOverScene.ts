import { BaseMenuScene } from '../../ui/menu/BaseMenuScene';
import { MenuContainer } from '../../ui/menu/MenuContainer';
import { MusicContext } from '../../systems/audio/MusicState';
import { HighScoreManager } from '../../systems/scores/HighScoreManager';

export class GameOverScene extends BaseMenuScene {
  private isVictory: boolean = false;
  private score: number = 0;
  private gameTime: number = 0;
  private enemyKills: number = 0;
  private maxCombo: number = 0;
  private titleText?: Phaser.GameObjects.Text;
  private scoreText?: Phaser.GameObjects.Text;
  private timeText?: Phaser.GameObjects.Text;
  private submittedName?: string;

  constructor() {
    super('GameOverScene');
  }

  init(data: { victory?: boolean; score?: number; time?: number; enemyKills?: number; maxCombo?: number }) {
    this.isVictory  = data.victory    || false;
    this.score      = data.score      || 0;
    this.gameTime   = data.time       || 0;
    this.enemyKills = data.enemyKills || 0;
    this.maxCombo   = data.maxCombo   || 0;
  }

  create() {
    // super.create() initializes this.audioManager, creates the background,
    // and calls this.createMenu() — do not call createMenu() again here.
    super.create();

    const { width, height } = this.cameras.main;

    // ── Background ────────────────────────────────────────────────────────
    if (this.background) {
      this.background.setFillStyle(0x000000, 1);
    }

    // Scanlines
    const gfx = this.add.graphics().setDepth(1500).setAlpha(0.06);
    gfx.fillStyle(0x000000, 1);
    for (let y = 0; y < height; y += 4) {
      gfx.fillRect(0, y, width, 1);
    }

    // ── Audio ─────────────────────────────────────────────────────────────
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

    // ── Title ─────────────────────────────────────────────────────────────
    const titleLabel = this.isVictory ? 'VICTORY!' : 'GAME OVER';
    const titleColor = this.isVictory ? '#00ff88' : '#ff2222';

    this.titleText = this.add.text(width / 2, height * 0.28, titleLabel, {
      fontSize: '52px',
      fontFamily: this.theme.typography.titleFont,
      color: titleColor,
      stroke: '#000000',
      strokeThickness: 8,
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(1001).setAlpha(0).setScale(0.4);

    this.tweens.add({
      targets: this.titleText,
      alpha: 1, scaleX: 1, scaleY: 1,
      duration: 550,
      ease: 'Back.easeOut',
    });

    // Victory color pulse
    if (this.isVictory) {
      this.time.delayedCall(600, () => {
        const pulseColors = ['#00ff88', '#ffff00', '#00ffff', '#ffffff'];
        let ci = 0;
        this.time.addEvent({
          delay: 260, loop: true,
          callback: () => {
            if (this.titleText?.active) {
              ci = (ci + 1) % pulseColors.length;
              this.titleText.setColor(pulseColors[ci]);
            }
          },
        });
      });
    }

    // ── Score ─────────────────────────────────────────────────────────────
    this.scoreText = this.add.text(width / 2, height * 0.48, `SCORE: ${this.score.toLocaleString()}`, {
      fontSize: '20px',
      fontFamily: this.theme.typography.itemFont,
      color: '#ffff00',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(1001).setAlpha(0);

    this.tweens.add({
      targets: this.scoreText,
      alpha: 1,
      duration: 400,
      delay: 400,
      ease: 'Power2',
    });

    // ── Time ──────────────────────────────────────────────────────────────
    if (this.gameTime > 0) {
      const minutes = Math.floor(this.gameTime / 60);
      const seconds = this.gameTime % 60;
      const timeLabel = `TIME: ${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

      this.timeText = this.add.text(width / 2, height * 0.54, timeLabel, {
        fontSize: '14px',
        fontFamily: this.theme.typography.itemFont,
        color: '#888899',
        stroke: '#000000',
        strokeThickness: 2,
      }).setOrigin(0.5).setDepth(1001).setAlpha(0);

      this.tweens.add({
        targets: this.timeText,
        alpha: 1,
        duration: 400,
        delay: 600,
        ease: 'Power2',
      });
    }

    // ── Victory stats ──────────────────────────────────────────────────────
    if (this.isVictory && (this.enemyKills > 0 || this.maxCombo > 0)) {
      const FONT = this.theme.typography.itemFont;
      const statLines = [
        this.enemyKills > 0  ? `ENEMIES DEFEATED: ${this.enemyKills}` : null,
        this.maxCombo   >= 2 ? `MAX COMBO: ${this.maxCombo}x`         : null,
      ].filter(Boolean) as string[];

      statLines.forEach((line, i) => {
        const statText = this.add.text(width / 2, height * 0.61 + i * 22, line, {
          fontSize: '12px',
          fontFamily: FONT,
          color: '#aaccff',
          stroke: '#000000',
          strokeThickness: 2,
        }).setOrigin(0.5).setDepth(1001).setAlpha(0);

        this.tweens.add({
          targets: statText,
          alpha: 1,
          duration: 400,
          delay: 750 + i * 120,
          ease: 'Power2',
        });
      });
    }
  }

  protected createMenu() {
    this.input.keyboard?.on('keydown-ESC', () => {
      this.audioManager?.playSound('menuSelect');
      this.returnToMenu();
    });

    if (HighScoreManager.isHighScore(this.score)) {
      this.time.delayedCall(900, () => this.setupNameEntry());
    } else {
      this.time.delayedCall(800, () => this.showStandardMenu());
    }
  }

  private setupNameEntry() {
    const { width, height } = this.cameras.main;
    const FONT   = this.theme.typography.itemFont;
    // Push the menu down to make room for victory stats (up to 2 lines × 22px)
    const statsOffset = this.isVictory ? 50 : 0;
    const menuY = height * 0.62 + (this.gameTime > 0 ? 10 : 0) + statsOffset;

    // "NEW HIGH SCORE!" banner
    const newHSBanner = this.add.text(width / 2, menuY, 'NEW HIGH SCORE!', {
      fontSize: '18px', fontFamily: FONT, color: '#ffff00',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(1002).setAlpha(0);

    this.tweens.add({ targets: newHSBanner, alpha: 1, duration: 300, ease: 'Power2' });
    this.tweens.add({
      targets: newHSBanner,
      scaleX: 1.05, scaleY: 1.05,
      duration: 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });

    // Prompt label
    const promptLabel = this.add.text(width / 2, menuY + 36, 'ENTER YOUR NAME:', {
      fontSize: '11px', fontFamily: FONT, color: '#888899',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(1002).setAlpha(0);

    this.tweens.add({ targets: promptLabel, alpha: 1, duration: 300, delay: 150, ease: 'Power2' });

    // Name input display
    let playerName = '';
    const MAX_LEN = 8;
    let showCursor = true;

    const nameDisplay = this.add.text(width / 2, menuY + 64, '_', {
      fontSize: '22px', fontFamily: FONT, color: '#00ff88',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(1002).setAlpha(0);

    this.tweens.add({ targets: nameDisplay, alpha: 1, duration: 300, delay: 250, ease: 'Power2' });

    // Hint
    const hintText = this.add.text(width / 2, menuY + 92, 'PRESS ENTER TO CONFIRM', {
      fontSize: '9px', fontFamily: FONT, color: '#444466',
    }).setOrigin(0.5).setDepth(1002).setAlpha(0);
    this.tweens.add({ targets: hintText, alpha: 1, duration: 300, delay: 400, ease: 'Power2' });

    const updateDisplay = () => {
      nameDisplay.setText((playerName || '') + (showCursor ? '_' : ' '));
    };

    const cursorTimer = this.time.addEvent({
      delay: 530, loop: true,
      callback: () => { showCursor = !showCursor; updateDisplay(); },
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
    const statsOffset = this.isVictory ? 50 : 0;
    const menuY = height * 0.68 + (this.gameTime > 0 ? 10 : 0) + statsOffset;

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
      highlightName:  this.submittedName || '',
    });
  }

  protected playMenuMusic() {
    // Audio handled in create() after base class setup
  }

  private playAgain() {
    this.scene.stop('GameOverScene');
    this.scene.start('CharacterSelectScene', { isMultiplayer: false });
  }

  private returnToMenu() {
    this.scene.start('MainMenuScene');
  }

  shutdown() {
    this.audioManager?.stopMusic(true);
  }
}
