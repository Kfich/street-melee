import { BaseMenuScene } from '../../ui/menu/BaseMenuScene';
import { MenuSlider } from '../../ui/menu/MenuSlider';
import { MenuToggle } from '../../ui/menu/MenuToggle';
import { MenuButton } from '../../ui/menu/MenuButton';
import { AudioManager } from '../../systems/audio/AudioManager';

export class SettingsScene extends BaseMenuScene {
  private musicVolume: number = 0.5;
  private sfxVolume: number = 0.7;
  private musicEnabled: boolean = true;
  private sfxEnabled: boolean = true;
  private returnScene?: string;
  private gameSceneKey?: string;
  private sliders: MenuSlider[] = [];
  private toggles: MenuToggle[] = [];
  private backButton?: MenuButton;

  constructor() {
    super('SettingsScene');
  }

  init(data: { returnScene?: string; gameSceneKey?: string }) {
    this.returnScene = data.returnScene;
    this.gameSceneKey = data.gameSceneKey;
  }

  create() {
    const { width, height } = this.cameras.main;

    // Initialize audio manager (only if not already set)
    if (!this.audioManager) {
      this.audioManager = new AudioManager(this);
    }

    // Always create our own background to ensure proper layering
    // This ensures SettingsScene covers any underlying scenes (like PauseScene)
    this.background = this.add.rectangle(
      width / 2,
      height / 2,
      width,
      height,
      this.theme.colors.background,
      this.theme.colors.backgroundAlpha
    );
    this.background.setDepth(0);

    // Play menu music if needed
    this.playMenuMusic();

    // Create menu
    this.createMenu();
  }

  protected createMenu() {
    const { width, height } = this.cameras.main;

    // Load settings
    this.loadSettings();

    // Create title
    const title = this.add.text(width / 2, 44, 'SETTINGS', {
      fontSize: '24px',
      fontFamily: this.theme.typography.titleFont,
      color: `#${this.theme.colors.selected.toString(16).padStart(6, '0')}`,
      stroke: `#000000`,
      strokeThickness: this.theme.typography.titleStroke,
      fontStyle: 'bold',
    });
    title.setOrigin(0.5).setDepth(1001);

    // Create settings controls - adjusted spacing to fit better
    const startY = height / 2 - 90;
    const spacing = 80;

    // Music Volume Slider
    const musicSlider = new MenuSlider(
      this,
      width / 2,
      startY,
      'MUSIC VOLUME',
      this.theme,
      this.musicVolume,
      0,
      1,
      (value) => {
        this.musicVolume = value;
        this.emitSettingsChange('musicVolumeChanged', value);
      }
    );
    this.sliders.push(musicSlider);

    // SFX Volume Slider
    const sfxSlider = new MenuSlider(
      this,
      width / 2,
      startY + spacing,
      'SFX VOLUME',
      this.theme,
      this.sfxVolume,
      0,
      1,
      (value) => {
        this.sfxVolume = value;
        this.emitSettingsChange('sfxVolumeChanged', value);
      }
    );
    this.sliders.push(sfxSlider);

    // Music Toggle
    const musicToggle = new MenuToggle(
      this,
      width / 2,
      startY + spacing * 2,
      'MUSIC',
      this.theme,
      this.musicEnabled,
      (value) => {
        this.musicEnabled = value;
        this.emitSettingsChange('musicEnabledChanged', value);
      }
    );
    this.toggles.push(musicToggle);

    // SFX Toggle
    const sfxToggle = new MenuToggle(
      this,
      width / 2,
      startY + spacing * 3,
      'SOUND EFFECTS',
      this.theme,
      this.sfxEnabled,
      (value) => {
        this.sfxEnabled = value;
        this.emitSettingsChange('sfxEnabledChanged', value);
      }
    );
    this.toggles.push(sfxToggle);

    // Back button
    this.backButton = new MenuButton(
      this,
      width / 2,
      height - 80,
      'BACK',
      this.theme,
      () => {
        this.saveSettings();
        this.returnToPrevious();
      }
    );

    // Keyboard navigation
    this.input.keyboard?.on('keydown-ESC', () => {
      this.saveSettings();
      this.returnToPrevious();
    });

    // Apply settings to game scene if it exists
    this.applySettingsToGame();
  }

  private emitSettingsChange(event: string, value: number | boolean) {
    const gameScene = this.scene.get('GameScene');
    if (gameScene && gameScene.events) {
      gameScene.events.emit(event, value);
    }
  }

  private applySettingsToGame() {
    const gameScene = this.scene.get('GameScene');
    if (gameScene && gameScene.scene && gameScene.scene.isActive()) {
      gameScene.events.emit('musicVolumeChanged', this.musicVolume);
      gameScene.events.emit('sfxVolumeChanged', this.sfxVolume);
      gameScene.events.emit('musicEnabledChanged', this.musicEnabled);
      gameScene.events.emit('sfxEnabledChanged', this.sfxEnabled);
    }
  }

  private returnToPrevious() {
    if (this.returnScene === 'PauseScene' && this.gameSceneKey) {
      // Return to pause menu - need to relaunch it
      this.scene.stop();
      this.scene.launch('PauseScene', { gameSceneKey: this.gameSceneKey });
    } else if (this.returnScene) {
      // Return to other scene
      this.scene.stop();
      this.scene.resume(this.returnScene);
    } else {
      // No return scene, go to main menu
      this.scene.start('MainMenuScene');
    }
  }

  private loadSettings() {
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
      sfxEnabled: this.sfxEnabled,
    };
    localStorage.setItem('streetMeleeSettings', JSON.stringify(settings));
  }

  shutdown() {
    this.sliders.forEach((slider) => slider.destroy());
    this.toggles.forEach((toggle) => toggle.destroy());
    if (this.backButton) {
      this.backButton.destroy();
    }
  }
}

