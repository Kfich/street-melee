import Phaser from 'phaser';

export class ControlsScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ControlsScene' });
  }

  create() {
    const { width, height } = this.cameras.main;

    // Title
    this.add.text(width / 2, 60, 'CONTROLS', {
      fontSize: '64px',
      fontFamily: 'Arial',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    // Player 1 Controls
    this.add.text(width / 2, 150, 'PLAYER 1', {
      fontSize: '36px',
      color: '#ffff00',
      fontStyle: 'bold'
    }).setOrigin(0.5);

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
      'Jump (while grabbing): Vault'
    ];

    let y = 220;
    player1Controls.forEach(control => {
      this.add.text(width / 2, y, control, {
        fontSize: '20px',
        color: '#ffffff'
      }).setOrigin(0.5);
      y += 35;
    });

    // Player 2 Controls
    y += 30;
    this.add.text(width / 2, y, 'PLAYER 2', {
      fontSize: '36px',
      color: '#00ffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    y += 50;

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
      'Jump (while grabbing): Vault'
    ];

    player2Controls.forEach(control => {
      this.add.text(width / 2, y, control, {
        fontSize: '20px',
        color: '#ffffff'
      }).setOrigin(0.5);
      y += 35;
    });

    // General Tips
    y += 30;
    this.add.text(width / 2, y, 'TIPS', {
      fontSize: '32px',
      color: '#ffff00',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    y += 40;

    const tips = [
      'Mash Attack button for combos',
      'Walk over weapons and items to collect',
      'Double-tap direction + Attack to throw weapons',
      'Down throw causes screen shake!'
    ];

    tips.forEach(tip => {
      this.add.text(width / 2, y, tip, {
        fontSize: '18px',
        color: '#cccccc',
        fontStyle: 'italic'
      }).setOrigin(0.5);
      y += 30;
    });

    // Back button
    const backButton = this.add.text(width / 2, height - 60, 'BACK (ESC)', {
      fontSize: '28px',
      fontFamily: 'Arial',
      color: '#ffff00',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    backButton.on('pointerdown', () => {
      this.scene.start('MainMenuScene');
    });

    this.input.keyboard?.on('keydown-ESC', () => {
      this.scene.start('MainMenuScene');
    });
  }
}

