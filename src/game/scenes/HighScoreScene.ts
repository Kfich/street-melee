import Phaser from 'phaser';
import { DEFAULT_MENU_THEME } from '../../ui/menu/MenuTheme';
import { AudioManager } from '../../systems/audio/AudioManager';
import { MusicContext } from '../../systems/audio/MusicState';
import { HighScoreManager } from '../../systems/scores/HighScoreManager';

export class HighScoreScene extends Phaser.Scene {
  private returnScene: string = 'MainMenuScene';
  private highlightScore: number = -1;
  private highlightName: string = '';
  private audioManager?: AudioManager;
  private theme = DEFAULT_MENU_THEME;

  constructor() {
    super({ key: 'HighScoreScene' });
  }

  init(data: { returnScene?: string; highlightScore?: number; highlightName?: string }) {
    this.returnScene = data.returnScene || 'MainMenuScene';
    this.highlightScore = data.highlightScore ?? -1;
    this.highlightName = data.highlightName || '';
  }

  create() {
    const { width, height } = this.cameras.main;

    this.audioManager = new AudioManager(this);
    this.time.delayedCall(100, () => {
      this.audioManager?.playMusicWithContext('menu', MusicContext.MENU, true);
    });

    // ── Background ────────────────────────────────────────────────────────────
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.97).setDepth(0);

    // ── Title ─────────────────────────────────────────────────────────────────
    const titleText = this.add.text(width / 2, 48, 'HIGH SCORES', {
      fontSize: '38px',
      fontFamily: this.theme.typography.titleFont,
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 6,
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(1).setAlpha(0).setScale(0.5);

    this.tweens.add({
      targets: titleText,
      alpha: 1, scaleX: 1, scaleY: 1,
      duration: 450, ease: 'Back.easeOut',
    });

    // ── Column layout ─────────────────────────────────────────────────────────
    const COL = { rank: 80, name: 300, score: 660, date: 910 };
    const HEADER_Y = 108;
    const ROW_START_Y = 148;
    const ROW_H = 36;
    const FONT = this.theme.typography.itemFont;

    // Divider line
    const gfx = this.add.graphics().setDepth(1);
    gfx.lineStyle(1, 0x444444, 1);
    gfx.lineBetween(40, HEADER_Y + 18, width - 40, HEADER_Y + 18);

    // Column headers
    const headerStyle = { fontSize: '11px', fontFamily: FONT, color: '#888888' };
    this.add.text(COL.rank, HEADER_Y, 'RANK', headerStyle).setOrigin(0.5).setDepth(1);
    this.add.text(COL.name, HEADER_Y, 'NAME', headerStyle).setOrigin(0.5).setDepth(1);
    this.add.text(COL.score, HEADER_Y, 'SCORE', headerStyle).setOrigin(0.5).setDepth(1);
    this.add.text(COL.date, HEADER_Y, 'DATE', headerStyle).setOrigin(0.5).setDepth(1);

    // ── Score rows ────────────────────────────────────────────────────────────
    const scores = HighScoreManager.getScores();

    if (scores.length === 0) {
      this.add.text(width / 2, height / 2 - 40, 'NO SCORES YET', {
        fontSize: '16px', fontFamily: FONT, color: '#555555',
      }).setOrigin(0.5).setDepth(1);
      this.add.text(width / 2, height / 2 - 10, 'Play to set a record!', {
        fontSize: '12px', fontFamily: FONT, color: '#444444',
      }).setOrigin(0.5).setDepth(1);
    }

    scores.forEach((entry, i) => {
      const rowY = ROW_START_Y + i * ROW_H;

      const isNew = this.highlightScore > 0 &&
                    entry.score === this.highlightScore &&
                    entry.name === this.highlightName.trim().toUpperCase().slice(0, 8);

      // Row highlight strip for new entry
      if (isNew) {
        const strip = this.add.rectangle(width / 2, rowY, width - 80, ROW_H - 4, 0x00ff88, 0.10).setDepth(0);
        this.tweens.add({ targets: strip, alpha: 0, duration: 600, yoyo: true, repeat: -1 });
      }

      // Color: gold for 1st, silver for 2nd, bronze for 3rd, green for new, white otherwise
      let color: string;
      if (isNew)       color = '#00ff88';
      else if (i === 0) color = '#ffd700';
      else if (i === 1) color = '#c0c0c0';
      else if (i === 2) color = '#cd7f32';
      else              color = '#cccccc';

      const fs = isNew ? '14px' : '13px';
      const rowStyle = { fontSize: fs, fontFamily: FONT, color };

      const rankLabel = i === 0 ? '1ST' : i === 1 ? '2ND' : i === 2 ? '3RD' : `${i + 1}TH`;
      this.add.text(COL.rank, rowY, rankLabel, rowStyle).setOrigin(0.5).setDepth(1);
      this.add.text(COL.name, rowY, entry.name, rowStyle).setOrigin(0.5).setDepth(1);
      this.add.text(COL.score, rowY, entry.score.toLocaleString(), rowStyle).setOrigin(0.5).setDepth(1);
      this.add.text(COL.date, rowY, entry.date, { fontSize: '11px', fontFamily: FONT, color: '#666666' })
        .setOrigin(0.5).setDepth(1);

      // "NEW" badge for fresh entries
      if (isNew) {
        const badge = this.add.text(COL.date + 60, rowY, 'NEW!', {
          fontSize: '11px', fontFamily: FONT, color: '#00ff88',
        }).setOrigin(0.5).setDepth(1);
        this.tweens.add({ targets: badge, alpha: 0, duration: 400, yoyo: true, repeat: -1 });
      }
    });

    // ── Back button ───────────────────────────────────────────────────────────
    const backY = height - 36;
    const backText = this.add.text(width / 2, backY, '< BACK >', {
      fontSize: '16px',
      fontFamily: FONT,
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(1).setInteractive({ useHandCursor: true });

    backText.on('pointerover', () => backText.setColor('#ffd700'));
    backText.on('pointerout', () => backText.setColor('#ffffff'));
    backText.on('pointerdown', () => this.goBack());

    this.input.keyboard?.once('keydown-ESC', () => this.goBack());
    this.input.keyboard?.once('keydown-ENTER', () => this.goBack());
    this.input.keyboard?.once('keydown-BACKSPACE', () => this.goBack());
  }

  private goBack() {
    this.audioManager?.playSound('menuSelect');
    this.scene.start(this.returnScene);
  }

  shutdown() {
    this.audioManager?.stopMusic(true);
  }
}
