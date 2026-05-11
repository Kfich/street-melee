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
    this.returnScene    = data.returnScene    || 'MainMenuScene';
    this.highlightScore = data.highlightScore ?? -1;
    this.highlightName  = data.highlightName  || '';
  }

  create() {
    const { width, height } = this.cameras.main;

    this.audioManager = new AudioManager(this);
    this.time.delayedCall(100, () => {
      this.audioManager?.playMusicWithContext('menu', MusicContext.MENU, true);
    });

    // Classic screen-wipe flash
    this.cameras.main.flash(220, 255, 255, 255, false);

    // ── Background ────────────────────────────────────────────────────────
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 1).setDepth(0);

    // Scanlines
    const scanlines = this.add.graphics().setDepth(1500).setAlpha(0.06);
    scanlines.fillStyle(0x000000, 1);
    for (let y = 0; y < height; y += 4) {
      scanlines.fillRect(0, y, width, 1);
    }

    // ── Title ─────────────────────────────────────────────────────────────
    const titleText = this.add.text(width / 2, 36, 'HIGH SCORES', {
      fontSize: '28px',
      fontFamily: this.theme.typography.titleFont,
      color: '#ffff00',
      stroke: '#000000',
      strokeThickness: 6,
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(1).setAlpha(0).setScale(0.5);

    this.tweens.add({
      targets: titleText,
      alpha: 1, scaleX: 1, scaleY: 1,
      duration: 450, ease: 'Back.easeOut',
    });

    // ── Column layout ─────────────────────────────────────────────────────
    const COL = {
      rank:  width * 0.10,
      name:  width * 0.32,
      score: width * 0.62,
      date:  width * 0.86,
    };
    const HEADER_Y  = 80;
    const ROW_START = 110;
    const ROW_H     = 34;
    const FONT      = this.theme.typography.itemFont;

    // Divider lines
    const gfx = this.add.graphics().setDepth(1);
    gfx.lineStyle(1, 0x333355, 1);
    gfx.lineBetween(30, HEADER_Y + 16, width - 30, HEADER_Y + 16);

    // Column headers
    const hdrStyle = { fontSize: '10px', fontFamily: FONT, color: '#888899' };
    this.add.text(COL.rank,  HEADER_Y, 'RANK',  hdrStyle).setOrigin(0.5).setDepth(1);
    this.add.text(COL.name,  HEADER_Y, 'NAME',  hdrStyle).setOrigin(0.5).setDepth(1);
    this.add.text(COL.score, HEADER_Y, 'SCORE', hdrStyle).setOrigin(0.5).setDepth(1);
    this.add.text(COL.date,  HEADER_Y, 'DATE',  hdrStyle).setOrigin(0.5).setDepth(1);

    // ── Score rows ────────────────────────────────────────────────────────
    const scores = HighScoreManager.getScores();

    if (scores.length === 0) {
      this.add.text(width / 2, height / 2 - 30, 'NO SCORES YET', {
        fontSize: '14px', fontFamily: FONT, color: '#333355',
      }).setOrigin(0.5).setDepth(1);
      this.add.text(width / 2, height / 2 + 4, 'PLAY TO SET A RECORD', {
        fontSize: '10px', fontFamily: FONT, color: '#222244',
      }).setOrigin(0.5).setDepth(1);
    }

    scores.forEach((entry, i) => {
      const rowY = ROW_START + i * ROW_H;

      const isNew = this.highlightScore > 0 &&
        entry.score === this.highlightScore &&
        entry.name === this.highlightName.trim().toUpperCase().slice(0, 8);

      // Row highlight strip for new entry
      if (isNew) {
        const strip = this.add.rectangle(width / 2, rowY, width - 60, ROW_H - 6, 0x00ff88, 0.08).setDepth(0);
        this.tweens.add({ targets: strip, alpha: 0, duration: 600, yoyo: true, repeat: -1 });
      }

      // Color scheme
      let color: string;
      if      (isNew)  color = '#00ff88';
      else if (i === 0) color = '#ffff00';   // Gold
      else if (i === 1) color = '#c0c0c0';   // Silver
      else if (i === 2) color = '#cd7f32';   // Bronze
      else              color = '#aaaaaa';

      const fs       = isNew ? '13px' : '12px';
      const rowStyle = { fontSize: fs, fontFamily: FONT, color };

      const rankLabel = i === 0 ? '1ST' : i === 1 ? '2ND' : i === 2 ? '3RD' : `${i + 1}TH`;

      const objs = [
        this.add.text(COL.rank,  rowY, rankLabel,                  rowStyle).setOrigin(0.5).setDepth(1),
        this.add.text(COL.name,  rowY, entry.name,                 rowStyle).setOrigin(0.5).setDepth(1),
        this.add.text(COL.score, rowY, entry.score.toLocaleString(), rowStyle).setOrigin(0.5).setDepth(1),
        this.add.text(COL.date,  rowY, entry.date, { fontSize: '10px', fontFamily: FONT, color: '#555566' })
          .setOrigin(0.5).setDepth(1),
      ];

      // Stagger-in each row
      objs.forEach(o => {
        o.setAlpha(0);
        this.tweens.add({ targets: o, alpha: 1, duration: 250, delay: i * 60 + 300, ease: 'Power2' });
      });

      // "NEW!" badge
      if (isNew) {
        const badge = this.add.text(COL.date + 60, rowY, 'NEW!', {
          fontSize: '10px', fontFamily: FONT, color: '#00ff88',
        }).setOrigin(0.5).setDepth(1);
        this.tweens.add({ targets: badge, alpha: 0, duration: 400, yoyo: true, repeat: -1 });
      }

      // Separator line between rows
      if (i < scores.length - 1) {
        gfx.lineStyle(1, 0x1a1a2e, 1);
        gfx.lineBetween(30, rowY + ROW_H / 2 + 2, width - 30, rowY + ROW_H / 2 + 2);
      }
    });

    // ── Bottom divider + Back button ──────────────────────────────────────
    const backY = height - 30;

    gfx.lineStyle(1, 0x333355, 1);
    gfx.lineBetween(30, backY - 18, width - 30, backY - 18);

    const backText = this.add.text(width / 2, backY, '< BACK >', {
      fontSize: '13px',
      fontFamily: FONT,
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5).setDepth(1).setInteractive({ useHandCursor: true });

    backText.on('pointerover', () => backText.setColor('#ffff00'));
    backText.on('pointerout',  () => backText.setColor('#ffffff'));
    backText.on('pointerdown', () => this.goBack());

    this.input.keyboard?.once('keydown-ESC',       () => this.goBack());
    this.input.keyboard?.once('keydown-ENTER',     () => this.goBack());
    this.input.keyboard?.once('keydown-BACKSPACE', () => this.goBack());
  }

  private goBack() {
    this.audioManager?.playSound('menuSelect');
    this.cameras.main.flash(120, 255, 255, 255, false);
    this.time.delayedCall(100, () => this.scene.start(this.returnScene));
  }

  shutdown() {
    this.audioManager?.stopMusic(true);
  }
}
