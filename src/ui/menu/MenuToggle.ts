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
  private background: Phaser.GameObjects.Graphics;
  private toggle: Phaser.GameObjects.Graphics;
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

    const borderRadius = 8;
    
    // Create background - rounded
    this.background = scene.add.graphics();
    this.background.fillStyle(this.theme.colors.secondary, 1);
    this.background.fillRoundedRect(100 - toggleWidth / 2, -toggleHeight / 2, toggleWidth, toggleHeight, borderRadius);
    this.background.lineStyle(2, this.theme.colors.text, 1);
    this.background.strokeRoundedRect(100 - toggleWidth / 2, -toggleHeight / 2, toggleWidth, toggleHeight, borderRadius);

    // Create toggle switch - rounded
    const toggleX = this.value ? 100 + toggleWidth / 4 : 100 - toggleWidth / 4;
    const toggleSize = toggleHeight - 8;
    this.toggle = scene.add.graphics();
    this.toggle.fillStyle(this.theme.colors.accent, 1);
    this.toggle.fillRoundedRect(toggleX - toggleSize / 2, -toggleSize / 2, toggleSize, toggleSize, toggleSize / 2);
    this.toggle.lineStyle(2, this.theme.colors.text, 1);
    this.toggle.strokeRoundedRect(toggleX - toggleSize / 2, -toggleSize / 2, toggleSize, toggleSize, toggleSize / 2);

    // Create toggle text - adjusted for 8-bit font
    this.toggleText = scene.add.text(100, 0, this.value ? 'ON' : 'OFF', {
      fontSize: '12px', // Reduced for 8-bit font
      fontFamily: this.theme.typography.labelFont,
      color: `#${this.theme.colors.text.toString(16).padStart(6, '0')}`,
      fontStyle: 'bold',
    });
    this.toggleText.setOrigin(0.5);

    // Set up interactivity - use container for hit area
    const hitArea = new Phaser.Geom.Rectangle(100 - toggleWidth / 2, -toggleHeight / 2, toggleWidth, toggleHeight);
    this.container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);
    if (this.container.input) {
      this.container.input.cursor = 'pointer';
    }
    this.container.on('pointerdown', () => this.toggleValue());

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
    const toggleHeight = 40;
    const borderRadius = 8;
    const toggleSize = toggleHeight - 8;
    const targetX = this.value ? 100 + toggleWidth / 4 : 100 - toggleWidth / 4;
    const bgColor = this.value ? this.theme.colors.accent : this.theme.colors.secondary;

    // Update background - redraw rounded rectangle
    this.background.clear();
    this.background.fillStyle(bgColor, 1);
    this.background.fillRoundedRect(100 - toggleWidth / 2, -toggleHeight / 2, toggleWidth, toggleHeight, borderRadius);
    this.background.lineStyle(2, this.theme.colors.text, 1);
    this.background.strokeRoundedRect(100 - toggleWidth / 2, -toggleHeight / 2, toggleWidth, toggleHeight, borderRadius);

    // Animate toggle position and redraw
    this.scene.tweens.add({
      targets: this.toggle,
      x: targetX,
      duration: 150,
      ease: 'Power2',
      onUpdate: () => {
        // Redraw toggle at new position
        this.toggle.clear();
        this.toggle.fillStyle(this.theme.colors.accent, 1);
        this.toggle.fillRoundedRect(this.toggle.x - toggleSize / 2, -toggleSize / 2, toggleSize, toggleSize, toggleSize / 2);
        this.toggle.lineStyle(2, this.theme.colors.text, 1);
        this.toggle.strokeRoundedRect(this.toggle.x - toggleSize / 2, -toggleSize / 2, toggleSize, toggleSize, toggleSize / 2);
      }
    });

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

