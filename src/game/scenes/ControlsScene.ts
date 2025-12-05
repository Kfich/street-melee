import { BaseMenuScene } from '../../ui/menu/BaseMenuScene';
import { MenuButton } from '../../ui/menu/MenuButton';

export class ControlsScene extends BaseMenuScene {
  private backButton?: MenuButton;

  constructor() {
    super('ControlsScene');
  }

  protected createMenu() {
    const { width, height } = this.cameras.main;

    // Title
    const title = this.add.text(width / 2, 50, 'CONTROLS', {
      fontSize: this.theme.typography.titleSize,
      fontFamily: this.theme.typography.titleFont,
      color: `#${this.theme.colors.text.toString(16).padStart(6, '0')}`,
      stroke: '#000000',
      strokeThickness: this.theme.typography.titleStroke,
      fontStyle: 'bold',
    });
    title.setOrigin(0.5).setDepth(1001);

    // Create scrollable container for controls
    const containerY = 120;
    let currentY = containerY;

    // Player 1 Controls
    const player1Title = this.add.text(width / 2, currentY, 'PLAYER 1', {
      fontSize: '32px',
      fontFamily: this.theme.typography.itemFont,
      color: `#${this.theme.colors.selected.toString(16).padStart(6, '0')}`,
      fontStyle: 'bold',
    });
    player1Title.setOrigin(0.5).setDepth(1001);
    currentY += 40;

    const player1Controls = [
      'Movement: Arrow Keys',
      'Jump: Space',
      'Attack: X',
      'Special: Z',
      'Dash + Attack: Signature Move',
      'Jump + Attack: Jump Attack',
      'Attack + Jump: Back Attack',
      'Close + Attack: Grab',
      'Direction + Attack (while grabbing): Throw',
      'Jump (while grabbing): Vault',
    ];

    player1Controls.forEach((control) => {
      const text = this.add.text(width / 2, currentY, control, {
        fontSize: '18px',
        fontFamily: this.theme.typography.labelFont,
        color: `#${this.theme.colors.text.toString(16).padStart(6, '0')}`,
      });
      text.setOrigin(0.5).setDepth(1001);
      currentY += 28;
    });

    // Player 2 Controls
    currentY += 20;
    const player2Title = this.add.text(width / 2, currentY, 'PLAYER 2', {
      fontSize: '32px',
      fontFamily: this.theme.typography.itemFont,
      color: `#00ffff`,
      fontStyle: 'bold',
    });
    player2Title.setOrigin(0.5).setDepth(1001);
    currentY += 40;

    const player2Controls = [
      'Movement: WASD',
      'Jump: W',
      'Attack: B',
      'Special: A',
      'Dash + Attack: Signature Move',
      'Jump + Attack: Jump Attack',
      'Attack + Jump: Back Attack',
      'Close + Attack: Grab',
      'Direction + Attack (while grabbing): Throw',
      'Jump (while grabbing): Vault',
    ];

    player2Controls.forEach((control) => {
      const text = this.add.text(width / 2, currentY, control, {
        fontSize: '18px',
        fontFamily: this.theme.typography.labelFont,
        color: `#${this.theme.colors.text.toString(16).padStart(6, '0')}`,
      });
      text.setOrigin(0.5).setDepth(1001);
      currentY += 28;
    });

    // Tips
    currentY += 20;
    const tipsTitle = this.add.text(width / 2, currentY, 'TIPS', {
      fontSize: '28px',
      fontFamily: this.theme.typography.itemFont,
      color: `#${this.theme.colors.selected.toString(16).padStart(6, '0')}`,
      fontStyle: 'bold',
    });
    tipsTitle.setOrigin(0.5).setDepth(1001);
    currentY += 35;

    const tips = [
      'Mash Attack button for combos',
      'Walk over weapons and items to collect',
      'Double-tap direction + Attack to throw weapons',
      'Down throw causes screen shake!',
    ];

    tips.forEach((tip) => {
      const text = this.add.text(width / 2, currentY, tip, {
        fontSize: '16px',
        fontFamily: this.theme.typography.labelFont,
        color: `#${this.theme.colors.textSecondary.toString(16).padStart(6, '0')}`,
        fontStyle: 'italic',
      });
      text.setOrigin(0.5).setDepth(1001);
      currentY += 25;
    });

    // Back button
    this.backButton = new MenuButton(
      this,
      width / 2,
      height - 60,
      'BACK (ESC)',
      this.theme,
      () => {
        this.scene.start('MainMenuScene');
      }
    );

    // Keyboard controls
    this.input.keyboard?.on('keydown-ESC', () => {
      this.scene.start('MainMenuScene');
    });
  }

  protected playMenuMusic() {
    // Don't play music in controls scene
  }

  shutdown() {
    if (this.backButton) {
      this.backButton.destroy();
    }
  }
}

