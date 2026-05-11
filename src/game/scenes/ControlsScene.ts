import { BaseMenuScene } from '../../ui/menu/BaseMenuScene';
import { MenuButton } from '../../ui/menu/MenuButton';
import { getGamepadManager } from '../../systems/input/GamepadManager';

const P1_CONTROLS = [
  ['MOVE',    'ARROW KEYS'],
  ['JUMP',    'SPACE'],
  ['ATTACK',  'X'],
  ['SPECIAL', 'Z'],
  ['PAUSE',   'P'],
  ['DASH ATK','DASH + ATTACK'],
  ['JUMP ATK','JUMP + ATTACK'],
  ['BACK ATK','ATTACK + JUMP'],
  ['GRAB',    'CLOSE + ATTACK'],
  ['THROW',   'DIR + ATK (GRAB)'],
];

const P2_CONTROLS = [
  ['MOVE',    'WASD'],
  ['JUMP',    'W'],
  ['ATTACK',  'B'],
  ['SPECIAL', 'A'],
  ['PAUSE',   'P'],
  ['DASH ATK','DASH + ATTACK'],
  ['JUMP ATK','JUMP + ATTACK'],
  ['BACK ATK','ATTACK + JUMP'],
  ['GRAB',    'CLOSE + ATTACK'],
  ['THROW',   'DIR + ATK (GRAB)'],
];

const TIPS = [
  'MASH ATTACK FOR COMBOS',
  'WALK OVER ITEMS TO COLLECT',
  'DOUBLE-TAP DIR + ATTACK TO THROW',
  'DOWN THROW CAUSES SCREEN SHAKE',
];

export class ControlsScene extends BaseMenuScene {
  private backButton?: MenuButton;

  constructor() {
    super('ControlsScene');
  }

  protected createMenu() {
    const { width, height } = this.cameras.main;
    const FONT      = this.theme.typography.itemFont;
    const LABEL_FONT = this.theme.typography.labelFont;
    const COL_GAP   = 24;   // gap between action label and key
    const LEFT_X    = width * 0.26;   // centre of left column
    const RIGHT_X   = width * 0.74;  // centre of right column
    const ROW_H     = 26;
    const HEADER_Y  = 52;
    const START_Y   = HEADER_Y + 46;

    // ── Title ─────────────────────────────────────────────────────────────
    const title = this.add.text(width / 2, 24, 'CONTROLS', {
      fontSize: '22px',
      fontFamily: FONT,
      color: `#${this.theme.colors.selected.toString(16).padStart(6, '0')}`,
      stroke: '#000000',
      strokeThickness: this.theme.typography.titleStroke,
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(1001).setAlpha(0);

    this.tweens.add({ targets: title, alpha: 1, duration: 300, ease: 'Power2' });

    // Horizontal divider under title
    const gfx = this.add.graphics().setDepth(1001);
    gfx.lineStyle(1, 0x333355, 1);
    gfx.lineBetween(40, 44, width - 40, 44);

    // ── Column headers ────────────────────────────────────────────────────
    const hdrStyle = { fontSize: '11px', fontFamily: FONT, color: '#ffff00',
                       stroke: '#000000', strokeThickness: 2 };
    this.add.text(LEFT_X,  HEADER_Y, 'PLAYER 1', hdrStyle).setOrigin(0.5).setDepth(1001);
    this.add.text(RIGHT_X, HEADER_Y, 'PLAYER 2', hdrStyle).setOrigin(0.5).setDepth(1001);

    // Column divider
    gfx.lineStyle(1, 0x333355, 1);
    gfx.lineBetween(width / 2, HEADER_Y - 12, width / 2, START_Y + ROW_H * P1_CONTROLS.length + 4);

    // ── P1 controls ───────────────────────────────────────────────────────
    P1_CONTROLS.forEach(([action, key], i) => {
      const y = START_Y + i * ROW_H;
      const delay = i * 25;

      const actionTxt = this.add.text(
        LEFT_X - COL_GAP - 2, y, action + ':',
        { fontSize: '9px', fontFamily: LABEL_FONT, color: '#888899' }
      ).setOrigin(1, 0.5).setDepth(1001).setAlpha(0);

      const keyTxt = this.add.text(
        LEFT_X - COL_GAP + 4, y, key,
        { fontSize: '9px', fontFamily: LABEL_FONT, color: '#ffffff' }
      ).setOrigin(0, 0.5).setDepth(1001).setAlpha(0);

      this.tweens.add({ targets: [actionTxt, keyTxt], alpha: 1, duration: 250, delay, ease: 'Power2' });
    });

    // ── P2 controls ───────────────────────────────────────────────────────
    P2_CONTROLS.forEach(([action, key], i) => {
      const y = START_Y + i * ROW_H;
      const delay = i * 25 + 120;

      const actionTxt = this.add.text(
        RIGHT_X - COL_GAP - 2, y, action + ':',
        { fontSize: '9px', fontFamily: LABEL_FONT, color: '#888899' }
      ).setOrigin(1, 0.5).setDepth(1001).setAlpha(0);

      const keyTxt = this.add.text(
        RIGHT_X - COL_GAP + 4, y, key,
        { fontSize: '9px', fontFamily: LABEL_FONT, color: '#ffffff' }
      ).setOrigin(0, 0.5).setDepth(1001).setAlpha(0);

      this.tweens.add({ targets: [actionTxt, keyTxt], alpha: 1, duration: 250, delay, ease: 'Power2' });
    });

    // ── Tips section ──────────────────────────────────────────────────────
    const tipsY = START_Y + P1_CONTROLS.length * ROW_H + 18;

    gfx.lineStyle(1, 0x333355, 1);
    gfx.lineBetween(40, tipsY - 8, width - 40, tipsY - 8);

    this.add.text(width / 2, tipsY, 'TIPS', {
      fontSize: '11px', fontFamily: FONT, color: '#ffff00',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(1001);

    TIPS.forEach((tip, i) => {
      const y = tipsY + 22 + i * 22;
      const txt = this.add.text(width / 2, y, `> ${tip}`, {
        fontSize: '8px', fontFamily: LABEL_FONT, color: '#888899',
      }).setOrigin(0.5).setDepth(1001).setAlpha(0);

      this.tweens.add({
        targets: txt, alpha: 1, duration: 250,
        delay: (P1_CONTROLS.length * 2 + i) * 25 + 250,
        ease: 'Power2',
      });
    });

    // ── Gamepad quick-reference ───────────────────────────────────────────
    const gpY = tipsY + TIPS.length * 22 + 30;
    const gm = getGamepadManager();
    const gpCtrl = gm.getPlayerController(0);
    const gpLine = gpCtrl
      ? `GAMEPAD P1: ${gpCtrl.profile.displayName.toUpperCase()} CONNECTED  |  A=JUMP  X=ATTACK  B=SPECIAL`
      : 'GAMEPAD: CONNECT A CONTROLLER & CONFIGURE IT IN CONTROLLERS MENU';

    this.add.text(width / 2, gpY, gpLine, {
      fontSize: '7px', fontFamily: LABEL_FONT, color: '#444466',
    }).setOrigin(0.5).setDepth(1001);

    // ── Back button ───────────────────────────────────────────────────────
    this.backButton = new MenuButton(
      this, width / 2, height - 36,
      'BACK (ESC)', this.theme,
      () => this.scene.start('MainMenuScene')
    );

    this.input.keyboard?.on('keydown-ESC', () => this.scene.start('MainMenuScene'));
  }

  protected playMenuMusic() {
    // Keep whatever music is already playing
  }

  shutdown() {
    this.backButton?.destroy();
  }
}
