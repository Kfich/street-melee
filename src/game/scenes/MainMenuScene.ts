import { BaseMenuScene } from '../../ui/menu/BaseMenuScene';
import { MenuContainer } from '../../ui/menu/MenuContainer';

export class MainMenuScene extends BaseMenuScene {

  constructor() {
    super('MainMenuScene');
  }

  create() {
    super.create();
  }

  update() {
    super.update();
    if (this.menuContainer) {
      this.menuContainer.update();
    }
  }

  protected createMenu() {
    const { width, height } = this.cameras.main;

    // ── Scanline overlay ──────────────────────────────────────────────────
    this.addScanlines(width, height);

    // ── Animated title ────────────────────────────────────────────────────
    const title = this.add.text(width / 2, 68, 'STREET MELEE', {
      fontSize: '32px',
      fontFamily: this.theme.typography.titleFont,
      color: '#ffff00',
      stroke: '#000000',
      strokeThickness: 6,
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(1002);

    // Bounce in from above
    title.setAlpha(0).setY(20);
    this.tweens.add({
      targets: title,
      y: 68,
      alpha: 1,
      duration: 500,
      ease: 'Back.easeOut',
    });

    // Color-cycle the title: yellow → red → cyan → white → yellow …
    const titleColors = ['#ffff00', '#ff2222', '#00ffff', '#ffffff'];
    let colorIdx = 0;
    this.time.addEvent({
      delay: 700,
      loop: true,
      callback: () => {
        if (title.active) {
          colorIdx = (colorIdx + 1) % titleColors.length;
          title.setColor(titleColors[colorIdx]);
        }
      },
    });

    // ── Subtitle ─────────────────────────────────────────────────────────
    const subtitle = this.add.text(width / 2, 112, 'A STREETS OF RAGE HOMAGE', {
      fontSize: '9px',
      fontFamily: this.theme.typography.labelFont,
      color: '#888899',
    }).setOrigin(0.5).setDepth(1002).setAlpha(0);

    this.tweens.add({
      targets: subtitle,
      alpha: 1,
      duration: 400,
      delay: 300,
      ease: 'Power2',
    });

    // ── Divider line ──────────────────────────────────────────────────────
    const divider = this.add.graphics().setDepth(1001);
    divider.lineStyle(1, 0x333355, 1);
    divider.lineBetween(width * 0.2, 132, width * 0.8, 132);

    // ── Menu container ────────────────────────────────────────────────────
    this.menuContainer = new MenuContainer(
      this,
      width / 2,
      155,
      '',          // No title — title is drawn above
      this.theme,
      undefined,
      this.audioManager
    );

    this.menuContainer.addButton('SINGLE PLAYER', () => this.startSinglePlayer());
    this.menuContainer.addButton('MULTIPLAYER',   () => this.startMultiplayer());
    this.menuContainer.addButton('HIGH SCORES',   () => this.showHighScores());
    this.menuContainer.addButton('SETTINGS',      () => this.openSettings());
    this.menuContainer.addButton('CONTROLS',      () => this.showControls());
    this.menuContainer.addButton('CONTROLLERS',   () => this.showControllers());
    this.menuContainer.addButton('QUIT',          () => this.quit());

    // ── Bottom strip ──────────────────────────────────────────────────────
    // Blinking "PRESS ENTER" prompt
    const pressEnter = this.add.text(width / 2, height - 44, 'PRESS ENTER TO SELECT', {
      fontSize: '9px',
      fontFamily: this.theme.typography.labelFont,
      color: '#ffff00',
    }).setOrigin(0.5).setDepth(1002);

    this.tweens.add({
      targets: pressEnter,
      alpha: 0,
      duration: 550,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Copyright line
    this.add.text(width / 2, height - 20, '\u00a9 2025  STREET MELEE  ALL RIGHTS RESERVED', {
      fontSize: '7px',
      fontFamily: this.theme.typography.labelFont,
      color: '#333344',
    }).setOrigin(0.5).setDepth(1002);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  /** Lightweight scanline effect: alternating semi-transparent horizontal lines. */
  private addScanlines(width: number, height: number) {
    const gfx = this.add.graphics().setDepth(1500).setAlpha(0.07);
    gfx.fillStyle(0x000000, 1);
    for (let y = 0; y < height; y += 4) {
      gfx.fillRect(0, y, width, 1);
    }
  }

  // ── Scene navigation ─────────────────────────────────────────────────────

  private startSinglePlayer() {
    this.cameras.main.flash(120, 255, 255, 0, false);
    this.time.delayedCall(100, () =>
      this.scene.start('CharacterSelectScene', { isMultiplayer: false })
    );
  }

  private startMultiplayer() {
    this.cameras.main.flash(120, 255, 255, 0, false);
    this.time.delayedCall(100, () => this.scene.start('MultiplayerMenuScene'));
  }

  private openSettings() {
    this.scene.start('SettingsScene');
  }

  private showHighScores() {
    this.scene.start('HighScoreScene', { returnScene: 'MainMenuScene' });
  }

  private showControls() {
    this.scene.start('ControlsScene');
  }

  private showControllers() {
    this.scene.start('ControllerScene');
  }

  private quit() {
    const { width, height } = this.cameras.main;
    if (this.audioManager) {
      this.audioManager.stopMusic(true);
    }
    // Fade to black, then show "THANKS FOR PLAYING" message
    this.cameras.main.fade(600, 0, 0, 0);
    this.time.delayedCall(620, () => {
      this.add.text(width / 2, height / 2 - 20, 'THANKS FOR PLAYING!', {
        fontSize: '22px',
        fontFamily: this.theme.typography.titleFont,
        color: '#ffff00',
        stroke: '#000000',
        strokeThickness: 4,
      }).setOrigin(0.5).setDepth(9999);

      this.add.text(width / 2, height / 2 + 30, 'CLOSE THE TAB TO EXIT', {
        fontSize: '11px',
        fontFamily: this.theme.typography.labelFont,
        color: '#888899',
      }).setOrigin(0.5).setDepth(9999);
    });
  }
}
