import Phaser from 'phaser';
import { MenuTheme } from './MenuTheme';

/**
 * Interactive toggle switch component
 */
export class MenuToggle {
  private scene: Phaser.Scene;
  private theme: MenuTheme;
  private container: Phaser.GameObjects.Container;
  private label: Phaser.GameObjects.Text;
  private background: Phaser.GameObjects.Rectangle;
  private toggle: Phaser.GameObjects.Rectangle;
  private toggleText: Phaser.GameObjects.Text;
  private value: boolean = false;
  private onChangeCallback?: (value: boolean) => void;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    label: string,
    theme: MenuTheme,
    initialValue: boolean = false,
    onChange?: (value: boolean) => void
  ) {
    this.scene = scene;
    this.theme = theme;
    this.value = initialValue;
    this.onChangeCallback = onChange;

    // Create container
    this.container = scene.add.container(x, y);

    const toggleWidth = 80;
    const toggleHeight = 40;

    // Create label
    this.label = scene.add.text(-150, 0, label, {
      fontSize: this.theme.typography.labelSize,
      fontFamily: this.theme.typography.labelFont,
      color: `#${this.theme.colors.text.toString(16).padStart(6, '0')}`,
    });
    this.label.setOrigin(0, 0.5);

    // Create background
    this.background = scene.add.rectangle(100, 0, toggleWidth, toggleHeight, this.theme.colors.secondary);
    this.background.setStrokeStyle(2, this.theme.colors.text);

    // Create toggle switch
    const toggleX = this.value ? 100 + toggleWidth / 4 : 100 - toggleWidth / 4;
    this.toggle = scene.add.rectangle(toggleX, 0, toggleHeight - 8, toggleHeight - 8, this.theme.colors.accent);
    this.toggle.setStrokeStyle(2, this.theme.colors.text);

    // Create toggle text
    this.toggleText = scene.add.text(100, 0, this.value ? 'ON' : 'OFF', {
      fontSize: '16px',
      fontFamily: this.theme.typography.labelFont,
      color: `#${this.theme.colors.text.toString(16).padStart(6, '0')}`,
      fontStyle: 'bold',
    });
    this.toggleText.setOrigin(0.5);

    // Set up interactivity
    this.background.setInteractive({ useHandCursor: true });
    this.background.on('pointerdown', () => this.toggleValue());

    // Add to container
    this.container.add([this.label, this.background, this.toggle, this.toggleText]);

    this.container.setDepth(1000);

    // Update initial state
    this.updateVisuals();
  }

  private toggleValue() {
    this.setValue(!this.value);
  }

  setValue(value: boolean) {
    if (this.value !== value) {
      this.value = value;
      this.updateVisuals();
      if (this.onChangeCallback) {
        this.onChangeCallback(this.value);
      }
    }
  }

  getValue(): boolean {
    return this.value;
  }

  private updateVisuals() {
    const toggleWidth = 80;
    const targetX = this.value ? 100 + toggleWidth / 4 : 100 - toggleWidth / 4;

    // Animate toggle position
    this.scene.tweens.add({
      targets: this.toggle,
      x: targetX,
      duration: 150,
      ease: 'Power2',
    });

    // Update background color
    const bgColor = this.value ? this.theme.colors.accent : this.theme.colors.secondary;
    this.background.setFillStyle(bgColor);

    // Update text
    this.toggleText.setText(this.value ? 'ON' : 'OFF');
    this.toggleText.setColor(
      `#${this.value ? this.theme.colors.text : this.theme.colors.textSecondary.toString(16).padStart(6, '0')}`
    );
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

