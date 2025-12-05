import Phaser from 'phaser';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    const { width, height } = this.cameras.main;

    // Title
    this.add.text(width / 2, height / 3, 'STREET MELEE', {
      fontSize: '64px',
      fontFamily: 'Arial',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    // Subtitle
    this.add.text(width / 2, height / 3 + 80, 'A Streets of Rage Clone', {
      fontSize: '24px',
      fontFamily: 'Arial',
      color: '#cccccc'
    }).setOrigin(0.5);

    // Start button
    const startButton = this.add.text(width / 2, height / 2 + 100, 'PRESS ENTER TO START', {
      fontSize: '32px',
      fontFamily: 'Arial',
      color: '#ffff00',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    startButton.on('pointerdown', () => {
      this.scene.start('CharacterSelectScene');
    });

    startButton.on('pointerover', () => {
      startButton.setStyle({ color: '#ffffff' });
    });

    startButton.on('pointerout', () => {
      startButton.setStyle({ color: '#ffff00' });
    });

    // Instructions
    this.add.text(width / 2, height - 100, 'Arrow Keys/WASD: Move | Space/C: Jump | X/B: Attack | Z/A: Special', {
      fontSize: '16px',
      fontFamily: 'Arial',
      color: '#888888'
    }).setOrigin(0.5);

    // Keyboard input
    this.input.keyboard?.on('keydown-ENTER', () => {
      this.scene.start('CharacterSelectScene');
    });
  }
}

