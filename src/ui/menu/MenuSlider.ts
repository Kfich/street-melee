import Phaser from 'phaser';
import { MenuTheme } from './MenuTheme';

/**
 * Interactive slider component for settings
 */
export class MenuSlider {
  private scene: Phaser.Scene;
  private theme: MenuTheme;
  private container: Phaser.GameObjects.Container;
  private label: Phaser.GameObjects.Text;
  private track: Phaser.GameObjects.Rectangle;
  private fill: Phaser.GameObjects.Rectangle;
  private handle: Phaser.GameObjects.Rectangle;
  private valueText: Phaser.GameObjects.Text;
  private interactiveArea: Phaser.GameObjects.Rectangle;
  private value: number = 0.5;
  private min: number = 0;
  private max: number = 1;
  private onChangeCallback?: (value: number) => void;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    label: string,
    theme: MenuTheme,
    initialValue: number = 0.5,
    min: number = 0,
    max: number = 1,
    onChange?: (value: number) => void
  ) {
    this.scene = scene;
    this.theme = theme;
    this.value = Phaser.Math.Clamp(initialValue, min, max);
    this.min = min;
    this.max = max;
    this.onChangeCallback = onChange;

    // Create container
    this.container = scene.add.container(x, y);

    const trackWidth = 300;
    const trackHeight = 20;
    const handleSize = 30;

    // Create label
    this.label = scene.add.text(0, -30, label, {
      fontSize: this.theme.typography.labelSize,
      fontFamily: this.theme.typography.labelFont,
      color: `#${this.theme.colors.text.toString(16).padStart(6, '0')}`,
    });
    this.label.setOrigin(0.5, 0);

    // Create track background
    this.track = scene.add.rectangle(0, 0, trackWidth, trackHeight, this.theme.colors.secondary);
    this.track.setStrokeStyle(2, this.theme.colors.text);

    // Create fill
    const fillWidth = trackWidth * ((this.value - this.min) / (this.max - this.min));
    this.fill = scene.add.rectangle(
      -trackWidth / 2 + fillWidth / 2,
      0,
      fillWidth,
      trackHeight,
      this.theme.colors.accent
    );

    // Create handle
    const handleX = -trackWidth / 2 + fillWidth;
    this.handle = scene.add.rectangle(handleX, 0, handleSize, handleSize, this.theme.colors.selected);
    this.handle.setStrokeStyle(2, this.theme.colors.text);

    // Create value text
    this.valueText = scene.add.text(trackWidth / 2 + 40, 0, `${Math.round(this.value * 100)}%`, {
      fontSize: '20px',
      fontFamily: this.theme.typography.labelFont,
      color: `#${this.theme.colors.text.toString(16).padStart(6, '0')}`,
    });
    this.valueText.setOrigin(0, 0.5);

    // Create interactive area
    this.interactiveArea = scene.add.rectangle(0, 0, trackWidth + 100, trackHeight + 40, 0x000000, 0);
    this.interactiveArea.setInteractive({ useHandCursor: true });
    this.interactiveArea.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.handlePointerDown(pointer);
    });
    this.interactiveArea.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (pointer.isDown) {
        this.handlePointerMove(pointer);
      }
    });

    // Add to container
    this.container.add([
      this.label,
      this.track,
      this.fill,
      this.handle,
      this.valueText,
      this.interactiveArea,
    ]);

    this.container.setDepth(1000);
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer) {
    this.updateValueFromPointer(pointer);
  }

  private handlePointerMove(pointer: Phaser.Input.Pointer) {
    this.updateValueFromPointer(pointer);
  }

  private updateValueFromPointer(pointer: Phaser.Input.Pointer) {
    const worldX = pointer.worldX;
    const containerX = this.container.x;
    const trackWidth = 300;
    const localX = worldX - containerX;
    const normalizedX = Phaser.Math.Clamp(localX + trackWidth / 2, 0, trackWidth);
    const newValue = this.min + (normalizedX / trackWidth) * (this.max - this.min);
    this.setValue(newValue);
  }

  setValue(value: number) {
    this.value = Phaser.Math.Clamp(value, this.min, this.max);
    this.updateVisuals();
    if (this.onChangeCallback) {
      this.onChangeCallback(this.value);
    }
  }

  getValue(): number {
    return this.value;
  }

  private updateVisuals() {
    const trackWidth = 300;
    const fillWidth = trackWidth * ((this.value - this.min) / (this.max - this.min));
    const handleX = -trackWidth / 2 + fillWidth;

    // Update fill
    this.fill.setSize(fillWidth, 20);
    this.fill.setX(-trackWidth / 2 + fillWidth / 2);

    // Update handle
    this.scene.tweens.add({
      targets: this.handle,
      x: handleX,
      duration: 100,
      ease: 'Power2',
    });

    // Update value text
    this.valueText.setText(`${Math.round(this.value * 100)}%`);
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

