import Phaser from 'phaser';
import { MenuTheme } from './MenuTheme';

/**
 * Character selection box component
 */
export class CharacterSelectBox {
  private scene: Phaser.Scene;
  private theme: MenuTheme;
  private container: Phaser.GameObjects.Container;
  private background: Phaser.GameObjects.Rectangle;
  private nameText: Phaser.GameObjects.Text;
  private placeholderText: Phaser.GameObjects.Text;
  private glow: Phaser.GameObjects.Rectangle;
  private isSelected: boolean = false;
  private isHovered: boolean = false;
  private onClickCallback?: () => void;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    characterName: string,
    theme: MenuTheme,
    onClick?: () => void
  ) {
    this.scene = scene;
    this.theme = theme;
    this.onClickCallback = onClick;

    const boxWidth = 150;
    const boxHeight = 200;

    // Create container
    this.container = scene.add.container(x, y);

    // Create glow effect
    this.glow = scene.add.rectangle(0, 0, boxWidth + 20, boxHeight + 20, theme.colors.selected, 0);
    this.glow.setBlendMode(Phaser.BlendModes.ADD);

    // Create background
    this.background = scene.add.rectangle(0, 0, boxWidth, boxHeight, theme.colors.primary, 0.8);
    this.background.setStrokeStyle(2, theme.colors.text);

    // Create character name
    this.nameText = scene.add.text(0, -60, characterName, {
      fontSize: '20px',
      fontFamily: theme.typography.itemFont,
      color: `#${theme.colors.text.toString(16).padStart(6, '0')}`,
    });
    this.nameText.setOrigin(0.5);

    // Create placeholder
    this.placeholderText = scene.add.text(0, 0, '?', {
      fontSize: '64px',
      fontFamily: theme.typography.itemFont,
      color: `#${theme.colors.textSecondary.toString(16).padStart(6, '0')}`,
    });
    this.placeholderText.setOrigin(0.5);

    // Add to container
    this.container.add([this.glow, this.background, this.nameText, this.placeholderText]);

    // Set up interactivity
    this.background.setInteractive({ useHandCursor: true });
    this.background.on('pointerdown', () => this.handleClick());
    this.background.on('pointerover', () => this.handleHover());
    this.background.on('pointerout', () => this.handleOut());

    this.container.setDepth(1000);
  }

  private handleClick() {
    if (this.onClickCallback) {
      this.onClickCallback();
    }
  }

  private handleHover() {
    if (!this.isHovered) {
      this.isHovered = true;
      this.updateVisualState();
    }
  }

  private handleOut() {
    if (this.isHovered) {
      this.isHovered = false;
      this.updateVisualState();
    }
  }

  setSelected(selected: boolean) {
    if (this.isSelected !== selected) {
      this.isSelected = selected;
      this.updateVisualState();
    }
  }

  private updateVisualState() {
    const strokeColor = this.isSelected
      ? this.theme.colors.selected
      : this.isHovered
      ? this.theme.colors.hover
      : this.theme.colors.text;

    const glowAlpha = this.isSelected || this.isHovered ? this.theme.effects.glowIntensity : 0;

    this.background.setStrokeStyle(2, strokeColor);

    this.scene.tweens.add({
      targets: this.glow,
      alpha: glowAlpha,
      duration: this.theme.effects.transitionDuration,
    });
  }

  setVisible(visible: boolean) {
    this.container.setVisible(visible);
  }

  destroy() {
    this.container.destroy();
  }

  getContainer(): Phaser.GameObjects.Container {
    return this.container;
  }
}

