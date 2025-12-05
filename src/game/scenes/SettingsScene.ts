import Phaser from 'phaser';

export class SettingsScene extends Phaser.Scene {
  private musicVolume: number = 0.5;
  private sfxVolume: number = 0.7;
  private musicEnabled: boolean = true;
  private sfxEnabled: boolean = true;
  private returnScene?: string;

  constructor() {
    super({ key: 'SettingsScene' });
  }

  init(data: { returnScene?: string }) {
    this.returnScene = data.returnScene;
  }

  create() {
    const { width, height } = this.cameras.main;

    // Title
    this.add.text(width / 2, 80, 'SETTINGS', {
      fontSize: '64px',
      fontFamily: 'Arial',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    // Load settings from data (if saved)
    this.loadSettings();

    // Settings options
    const startY = height / 2 - 100;
    const spacing = 80;

    // Music Volume
    this.createVolumeControl('MUSIC VOLUME', startY, this.musicVolume, (value) => {
      this.musicVolume = value;
      this.scene.get('GameScene').events?.emit('musicVolumeChanged', value);
    });

    // SFX Volume
    this.createVolumeControl('SFX VOLUME', startY + spacing, this.sfxVolume, (value) => {
      this.sfxVolume = value;
      this.scene.get('GameScene').events?.emit('sfxVolumeChanged', value);
    });

    // Music Toggle
    this.createToggle('MUSIC', startY + spacing * 2, this.musicEnabled, (value) => {
      this.musicEnabled = value;
      this.scene.get('GameScene').events?.emit('musicEnabledChanged', value);
    });

    // SFX Toggle
    this.createToggle('SOUND EFFECTS', startY + spacing * 3, this.sfxEnabled, (value) => {
      this.sfxEnabled = value;
      this.scene.get('GameScene').events?.emit('sfxEnabledChanged', value);
    });

    // Back button
    const backButton = this.add.text(width / 2, height - 100, 'BACK', {
      fontSize: '32px',
      fontFamily: 'Arial',
      color: '#ffff00',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    backButton.on('pointerdown', () => {
      this.saveSettings();
      this.returnToPrevious();
    });

        // Keyboard navigation
        this.input.keyboard?.on('keydown-ESC', () => {
      this.saveSettings();
      this.returnToPrevious();
    });

        // Apply settings to game scene if it exists
        const gameScene = this.scene.get('GameScene');
        if (gameScene && gameScene.scene && gameScene.scene.isActive()) {
      gameScene.events.emit('musicVolumeChanged', this.musicVolume);
      gameScene.events.emit('sfxVolumeChanged', this.sfxVolume);
      gameScene.events.emit('musicEnabledChanged', this.musicEnabled);
      gameScene.events.emit('sfxEnabledChanged', this.sfxEnabled);
    }
  }

  private returnToPrevious() {
    if (this.returnScene) {
      this.scene.stop();
      this.scene.resume(this.returnScene);
    } else {
      this.scene.start('MainMenuScene');
    }
  }

  private createVolumeControl(label: string, y: number, initialValue: number, onChange: (value: number) => void) {
    const { width } = this.cameras.main;
    const barWidth = 300;
    const barHeight = 20;
    const barX = width / 2 - barWidth / 2;

    // Label
    this.add.text(width / 2, y - 15, label, {
      fontSize: '24px',
      color: '#ffffff'
    }).setOrigin(0.5);

        // Volume bar background
        this.add.rectangle(barX + barWidth / 2, y + 15, barWidth, barHeight, 0x333333);
        
        // Volume bar fill
    const fill = this.add.rectangle(
      barX + (barWidth * initialValue) / 2,
      y + 15,
      barWidth * initialValue,
      barHeight,
      0x00ff00
    );

    // Volume text
    const volumeText = this.add.text(barX + barWidth + 20, y + 15, `${Math.round(initialValue * 100)}%`, {
      fontSize: '20px',
      color: '#ffffff'
    }).setOrigin(0, 0.5);

    // Interactive area
    const interactiveArea = this.add.rectangle(barX + barWidth / 2, y + 15, barWidth, barHeight + 20, 0x000000, 0)
      .setInteractive({ useHandCursor: true });

    interactiveArea.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const localX = pointer.x - barX;
      const newValue = Phaser.Math.Clamp(localX / barWidth, 0, 1);
      onChange(newValue);
      fill.setSize(barWidth * newValue, barHeight);
      fill.setX(barX + (barWidth * newValue) / 2);
      volumeText.setText(`${Math.round(newValue * 100)}%`);
    });
  }

  private createToggle(label: string, y: number, initialValue: boolean, onChange: (value: boolean) => void) {
    const { width } = this.cameras.main;

    // Label
    this.add.text(width / 2 - 150, y, label, {
      fontSize: '24px',
      color: '#ffffff'
    }).setOrigin(0, 0.5);

    // Toggle button
    const toggleButton = this.add.rectangle(width / 2 + 100, y, 80, 40, initialValue ? 0x00ff00 : 0x666666)
      .setInteractive({ useHandCursor: true });

    const toggleText = this.add.text(width / 2 + 100, y, initialValue ? 'ON' : 'OFF', {
      fontSize: '20px',
      color: '#000000',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    toggleButton.on('pointerdown', () => {
      const newValue = !initialValue;
      onChange(newValue);
      toggleButton.setFillStyle(newValue ? 0x00ff00 : 0x666666);
      toggleText.setText(newValue ? 'ON' : 'OFF');
      initialValue = newValue;
    });
  }

  private loadSettings() {
    // Load from localStorage if available
    const saved = localStorage.getItem('streetMeleeSettings');
    if (saved) {
      const settings = JSON.parse(saved);
      this.musicVolume = settings.musicVolume ?? 0.5;
      this.sfxVolume = settings.sfxVolume ?? 0.7;
      this.musicEnabled = settings.musicEnabled ?? true;
      this.sfxEnabled = settings.sfxEnabled ?? true;
    }
  }

  private saveSettings() {
    const settings = {
      musicVolume: this.musicVolume,
      sfxVolume: this.sfxVolume,
      musicEnabled: this.musicEnabled,
      sfxEnabled: this.sfxEnabled
    };
    localStorage.setItem('streetMeleeSettings', JSON.stringify(settings));
  }
}

