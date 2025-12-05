import Phaser from 'phaser';
import { AudioManager } from '../../systems/audio/AudioManager';
import { MusicContext } from '../../systems/audio/MusicState';

export class MainMenuScene extends Phaser.Scene {
  private menuItems: Phaser.GameObjects.Text[] = [];
  private selectedIndex: number = 0;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private audioManager!: AudioManager;

  constructor() {
    super({ key: 'MainMenuScene' });
  }

  create() {
    const { width, height } = this.cameras.main;
    
    // Initialize audio manager
    this.audioManager = new AudioManager(this);
    
    // Play menu music (with small delay to ensure audio is ready)
    this.time.delayedCall(100, () => {
      this.audioManager.playMusicWithContext('menu', MusicContext.MENU, true);
    });

    // Title
    this.add.text(width / 2, height / 4, 'STREET MELEE', {
      fontSize: '72px',
      fontFamily: 'Arial',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 6,
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 4 + 90, 'A Streets of Rage Clone', {
      fontSize: '24px',
      fontFamily: 'Arial',
      color: '#cccccc'
    }).setOrigin(0.5);

    // Menu options
    const menuOptions = [
      { text: 'SINGLE PLAYER', action: () => this.startSinglePlayer() },
      { text: 'MULTIPLAYER', action: () => this.startMultiplayer() },
      { text: 'SETTINGS', action: () => this.openSettings() },
      { text: 'CONTROLS', action: () => this.showControls() },
      { text: 'QUIT', action: () => this.quit() }
    ];

    const startY = height / 2 + 50;
    const spacing = 60;

    menuOptions.forEach((option, index) => {
      const menuItem = this.add.text(width / 2, startY + (index * spacing), option.text, {
        fontSize: '36px',
        fontFamily: 'Arial',
        color: index === 0 ? '#ffff00' : '#ffffff',
        stroke: '#000000',
        strokeThickness: 2
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      menuItem.on('pointerdown', () => {
        this.audioManager.playSound('menuSelect');
        option.action();
      });
      menuItem.on('pointerover', () => {
        this.audioManager.playSound('menuSelect', 0.5);
        this.selectMenuItem(index);
      });

      this.menuItems.push(menuItem);
    });

    // Keyboard navigation
    this.cursors = this.input.keyboard?.createCursorKeys();
    this.input.keyboard?.on('keydown-ENTER', () => {
      this.audioManager.playSound('menuSelect');
      menuOptions[this.selectedIndex].action();
    });

    // Instructions
    this.add.text(width / 2, height - 50, 'Arrow Keys: Navigate | Enter: Select', {
      fontSize: '16px',
      color: '#888888'
    }).setOrigin(0.5);
  }

  update() {
    if (!this.cursors) return;

    if (Phaser.Input.Keyboard.JustDown(this.cursors.up!)) {
      this.selectedIndex = (this.selectedIndex - 1 + this.menuItems.length) % this.menuItems.length;
      this.updateSelection();
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.down!)) {
      this.selectedIndex = (this.selectedIndex + 1) % this.menuItems.length;
      this.updateSelection();
    }
  }

  private updateSelection() {
    this.menuItems.forEach((item, index) => {
      if (item && item.active) {
        item.setStyle({ color: index === this.selectedIndex ? '#ffff00' : '#ffffff' });
      }
    });
  }

  private selectMenuItem(index: number) {
    this.selectedIndex = index;
    this.updateSelection();
  }

  private startSinglePlayer() {
    this.scene.start('CharacterSelectScene', { isMultiplayer: false });
  }

  private startMultiplayer() {
    this.scene.start('MultiplayerMenuScene');
  }

  private openSettings() {
    this.scene.start('SettingsScene');
  }

  private showControls() {
    this.scene.start('ControlsScene');
  }

  private quit() {
    // In Electron, this would quit the app
    // In browser, just show message
    this.audioManager.stopMusic(true);
    alert('Thanks for playing!');
  }

  shutdown() {
    // Stop music when leaving menu
    if (this.audioManager) {
      this.audioManager.stopMusic(true);
    }
  }
}

