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

    // Create menu container - positioned higher to leave room for instructions
    this.menuContainer = new MenuContainer(
      this,
      width / 2,
      height / 5, // Moved up from height/4 to leave more room
      'STREET MELEE',
      this.theme,
      'A Streets of Rage Clone',
      this.audioManager
    );

    // Add menu buttons
    this.menuContainer.addButton('SINGLE PLAYER', () => this.startSinglePlayer());
    this.menuContainer.addButton('MULTIPLAYER', () => this.startMultiplayer());
    this.menuContainer.addButton('SETTINGS', () => this.openSettings());
    this.menuContainer.addButton('CONTROLS', () => this.showControls());
    this.menuContainer.addButton('QUIT', () => this.quit());

    // Instructions - positioned at the very bottom with more margin
    this.add.text(width / 2, height - 30, 'Arrow Keys: Navigate | Enter: Select', {
      fontSize: '14px',
      fontFamily: this.theme.typography.labelFont,
      color: `#${this.theme.colors.textSecondary.toString(16).padStart(6, '0')}`,
    }).setOrigin(0.5).setDepth(1001);
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
    if (this.audioManager) {
      this.audioManager.stopMusic(true);
    }
    alert('Thanks for playing!');
  }
}

