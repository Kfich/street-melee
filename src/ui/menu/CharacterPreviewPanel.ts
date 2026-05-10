import Phaser from 'phaser';
import { MenuTheme } from './MenuTheme';
import { CharacterType, CHARACTER_STATS } from '../../game/types/CharacterType';
import { getCharacterData } from './CharacterData';

const STAT_NAMES = ['PWR', 'TEC', 'SPD', 'JMP', 'STM'] as const;

// Panel geometry constants (all in local coords relative to container center)
const PW = 960;   // panel width
const PH = 104;   // panel height
const SPR_X = -370;   // sprite center x
const STATS_LBL_X = -245; // stat label left
const STATS_BAR_X = -185; // stat bar left
const STATS_BAR_W = 210;  // stat bar width
const STATS_VAL_X = 32;   // stat star value right edge
const STATS_START_Y = -38; // y of first stat row
const STAT_ROW_H = 19;    // row spacing
const BAR_H = 8;
const INFO_X = 65;        // info section left x

export class CharacterPreviewPanel {
  private scene: Phaser.Scene;
  private theme: MenuTheme;
  private container: Phaser.GameObjects.Container;
  private previewSprite?: Phaser.GameObjects.Sprite;
  private statGraphics: Phaser.GameObjects.Graphics;
  private statValueTexts: Phaser.GameObjects.Text[] = [];
  private playstyleText: Phaser.GameObjects.Text;
  private descText: Phaser.GameObjects.Text;
  private specialText: Phaser.GameObjects.Text;
  private signatureText: Phaser.GameObjects.Text;
  private currentChar?: CharacterType;

  constructor(scene: Phaser.Scene, x: number, y: number, theme: MenuTheme) {
    this.scene = scene;
    this.theme = theme;
    this.container = scene.add.container(x, y).setDepth(1900);

    const FONT = theme.typography.labelFont;

    // ── Panel background ────────────────────────────────────────────────────
    const bg = scene.add.graphics();
    bg.fillStyle(0x080812, 0.92);
    bg.fillRect(-PW / 2, -PH / 2, PW, PH);
    bg.lineStyle(1, theme.colors.accent, 0.45);
    bg.strokeRect(-PW / 2, -PH / 2, PW, PH);
    // Top accent stripe
    bg.fillStyle(theme.colors.accent, 0.5);
    bg.fillRect(-PW / 2, -PH / 2, PW, 2);
    this.container.add(bg);

    // Vertical section dividers
    const div = scene.add.graphics();
    div.lineStyle(1, theme.colors.secondary, 0.5);
    div.lineBetween(STATS_LBL_X - 12, -PH / 2 + 6, STATS_LBL_X - 12, PH / 2 - 6);
    div.lineBetween(INFO_X - 12, -PH / 2 + 6, INFO_X - 12, PH / 2 - 6);
    this.container.add(div);

    // ── Stat bars (redrawn on each character change) ────────────────────────
    this.statGraphics = scene.add.graphics();
    this.container.add(this.statGraphics);

    // Stat row labels (static)
    STAT_NAMES.forEach((name, i) => {
      const sy = STATS_START_Y + i * STAT_ROW_H;
      const lbl = scene.add.text(STATS_LBL_X, sy, name, {
        fontSize: '9px', fontFamily: FONT, color: '#777777',
      }).setOrigin(0, 0.5);
      this.container.add(lbl);

      const val = scene.add.text(STATS_VAL_X, sy, '', {
        fontSize: '10px', fontFamily: FONT, color: '#ffd700',
      }).setOrigin(1, 0.5);
      this.container.add(val);
      this.statValueTexts.push(val);
    });

    // "STATS" section heading
    const statsHdr = scene.add.text(STATS_LBL_X, -PH / 2 + 10, 'STATS', {
      fontSize: '8px', fontFamily: FONT, color: '#444466',
    }).setOrigin(0, 0.5);
    this.container.add(statsHdr);

    // ── Info section texts ──────────────────────────────────────────────────
    this.playstyleText = scene.add.text(INFO_X, -PH / 2 + 14, '', {
      fontSize: '8px', fontFamily: FONT, color: '#555577',
      wordWrap: { width: PW / 2 - 80 },
    }).setOrigin(0, 0.5);
    this.container.add(this.playstyleText);

    this.descText = scene.add.text(INFO_X, -20, '', {
      fontSize: '9px', fontFamily: FONT, color: '#aaaacc',
      wordWrap: { width: PW / 2 - 80 },
    }).setOrigin(0, 0);
    this.container.add(this.descText);

    this.specialText = scene.add.text(INFO_X, 22, '', {
      fontSize: '9px', fontFamily: FONT, color: '#88aaff',
    }).setOrigin(0, 0);
    this.container.add(this.specialText);

    this.signatureText = scene.add.text(INFO_X, 40, '', {
      fontSize: '9px', fontFamily: FONT, color: '#ffd700',
    }).setOrigin(0, 0);
    this.container.add(this.signatureText);
  }

  /** Call whenever the highlighted character changes. */
  updateCharacter(characterType: CharacterType) {
    const changed = this.currentChar !== characterType;
    this.currentChar = characterType;

    const data = getCharacterData(characterType);
    const stats = CHARACTER_STATS[characterType];

    // Text
    this.playstyleText.setText(data.playstyle.toUpperCase());
    this.descText.setText(data.description);
    this.specialText.setText(`SPECIAL: ${data.specialMove}`);
    this.signatureText.setText(`SIGNATURE: ${data.signatureMove}`);

    if (changed) {
      // Fade in info text
      [this.playstyleText, this.descText, this.specialText, this.signatureText].forEach(t => {
        t.setAlpha(0);
        this.scene.tweens.add({ targets: t, alpha: 1, duration: 180, ease: 'Power2' });
      });
    }

    // Stat bars
    this.drawStats(stats);

    // Animated sprite
    this.updateSprite(characterType, changed);
  }

  private drawStats(stats: typeof CHARACTER_STATS['axel']) {
    const VALUES = [stats.power, stats.technique, stats.speed, stats.jump, stats.stamina];
    this.statGraphics.clear();

    VALUES.forEach((v, i) => {
      const sy = STATS_START_Y + i * STAT_ROW_H;
      const fillW = (STATS_BAR_W * v) / 3;
      const color = v >= 3 ? 0xffd700 : v >= 2 ? 0xe94560 : 0x4a90e2;

      // Background track
      this.statGraphics.fillStyle(this.theme.colors.secondary, 0.7);
      this.statGraphics.fillRoundedRect(STATS_BAR_X, sy - BAR_H / 2, STATS_BAR_W, BAR_H, 4);

      // Filled portion
      this.statGraphics.fillStyle(color, 1);
      this.statGraphics.fillRoundedRect(STATS_BAR_X, sy - BAR_H / 2, fillW, BAR_H, 4);

      const stars = v >= 3 ? '★★★' : v >= 2 ? '★★' : '★';
      const colorStr = v >= 3 ? '#ffd700' : v >= 2 ? '#e94560' : '#4a90e2';
      this.statValueTexts[i].setText(stars).setColor(colorStr);
    });
  }

  private updateSprite(characterType: CharacterType, animate: boolean) {
    if (this.previewSprite) {
      this.scene.tweens.killTweensOf(this.previewSprite);
      this.previewSprite.destroy();
      this.previewSprite = undefined;
    }

    const idleKey = `${characterType}_idle_right`;
    const walkKey = `${characterType}_walk_right`;
    const texKey = this.scene.textures.exists(idleKey) ? idleKey
                 : this.scene.textures.exists(walkKey) ? walkKey
                 : null;
    if (!texKey) return;

    const sprY = 0;
    // Create at (0,0) so the sprite is never rendered at an incorrect world
    // position before being parented; position is set in container-local space
    // after container.add() is called.
    this.previewSprite = this.scene.add.sprite(0, 0, texKey);
    this.previewSprite.setOrigin(0.5, 0.5);

    // Scale to ~88px display height
    const targetH = 88;
    const baseScale = Math.min(targetH / Math.max(this.previewSprite.height, 1), 4);
    const boost = (characterType === 'axel' || characterType === 'sammy') ? 1.2 : 1.0;
    const finalScale = Math.min(baseScale * boost, 4);
    this.previewSprite.setScale(finalScale);

    // Pixel-perfect
    this.scene.textures.get(texKey).setFilter(Phaser.Textures.FilterMode.NEAREST);

    // Parent first so all subsequent position/tween values are in local space
    this.container.add(this.previewSprite);
    this.container.bringToTop(this.previewSprite);

    // Set container-local position after parenting
    this.previewSprite.setPosition(SPR_X, sprY);

    // Walk animation
    const walkAnim = `${characterType}_walk_right`;
    if (this.scene.anims.exists(walkAnim)) {
      this.previewSprite.play(walkAnim);
    }

    // Idle bob (y values are container-local)
    this.scene.tweens.add({
      targets: this.previewSprite,
      y: sprY - 5, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });

    if (animate) {
      this.previewSprite.setAlpha(0).setScale(finalScale * 0.5);
      this.scene.tweens.add({
        targets: this.previewSprite,
        alpha: 1, scaleX: finalScale, scaleY: finalScale,
        duration: 220, ease: 'Back.easeOut',
      });
    }
  }

  destroy() {
    if (this.previewSprite) {
      this.scene.tweens.killTweensOf(this.previewSprite);
    }
    this.container.destroy();
  }
}
