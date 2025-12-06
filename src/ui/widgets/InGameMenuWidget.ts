import Phaser from 'phaser';
import { BaseWidget } from './BaseWidget';

export type MenuButtonType = 'menu' | 'continue' | 'minus' | 'pause' | 'plus' | 'quit';

export interface MenuButton {
  type: MenuButtonType;
  label: string;
  color?: number;
  highlightColor?: number;
  callback?: () => void;
}

/**
 * In-Game Menu Widget
 * Displays circular menu buttons for game controls
 */
export class InGameMenuWidget extends BaseWidget {
  private buttons: Map<MenuButtonType, Phaser.GameObjects.Container> = new Map();
  private selectedButton: MenuButtonType | null = null;
  private buttonConfigs: MenuButton[] = [];
  private buttonRadius: number = 20;
  private buttonSpacing: number = 50;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);
  }

  protected createWidget(): void {
    // Create background panel
    const panelWidth = 350;
    const panelHeight = 60;
    const bg = this.createRoundedRect(
      0,
      0,
      panelWidth,
      panelHeight,
      this.theme.colors.background,
      0.9,
      this.theme.colors.border,
      2
    );
    this.container.add(bg);

    // Default button configurations
    this.buttonConfigs = [
      { type: 'menu', label: 'M', color: this.theme.colors.background, highlightColor: this.theme.colors.secondary },
      { type: 'continue', label: 'C', color: this.theme.colors.background, highlightColor: this.theme.colors.secondary },
      { type: 'minus', label: '-', color: this.theme.colors.background, highlightColor: this.theme.colors.secondary },
      { type: 'pause', label: 'P', color: this.theme.colors.background, highlightColor: this.theme.colors.secondary },
      { type: 'plus', label: '+', color: this.theme.colors.background, highlightColor: this.theme.colors.secondary },
      { type: 'quit', label: 'Q', color: this.theme.colors.danger, highlightColor: this.theme.colors.danger },
    ];

    this.createButtons();
    
    // Initially hidden
    this.hide(false);
  }

  /**
   * Create all menu buttons
   */
  private createButtons(): void {
    // Ensure buttons map is initialized
    if (!this.buttons) {
      this.buttons = new Map();
    }
    
    const startX = -(this.buttonConfigs.length - 1) * this.buttonSpacing / 2;
    
    this.buttonConfigs.forEach((config, index) => {
      const buttonX = startX + index * this.buttonSpacing;
      const button = this.createButton(buttonX, 0, config);
      if (button && this.buttons) {
        this.buttons.set(config.type, button);
        this.container.add(button);
      }
    });
  }

  /**
   * Create a single button
   */
  private createButton(x: number, y: number, config: MenuButton): Phaser.GameObjects.Container {
    const container = this.scene.add.container(x, y);
    
    // Button background
    const bg = this.scene.add.graphics();
    const bgColor = config.color || this.theme.colors.background;
    bg.fillStyle(bgColor, 1);
    bg.fillCircle(0, 0, this.buttonRadius);
    bg.lineStyle(2, this.theme.colors.border, 1);
    bg.strokeCircle(0, 0, this.buttonRadius);
    container.add(bg);

    // Button label
    const label = this.createText(
      0,
      0,
      config.label,
      this.theme.typography.fontSize.medium,
      `#${this.theme.colors.text.toString(16).padStart(6, '0')}`
    );
    container.add(label);

    // Make interactive
    container.setSize(this.buttonRadius * 2, this.buttonRadius * 2);
    container.setInteractive(new Phaser.Geom.Circle(0, 0, this.buttonRadius), Phaser.Geom.Circle.Contains);

    // Hover effects
    container.on('pointerover', () => {
      this.highlightButton(config.type, true);
    });

    container.on('pointerout', () => {
      if (this.selectedButton !== config.type) {
        this.highlightButton(config.type, false);
      }
    });

    container.on('pointerdown', () => {
      this.selectButton(config.type);
      // Get callback from config (may be updated via setButtonCallback)
      const currentConfig = container.getData('config') as MenuButton;
      const callback = currentConfig?.callback || config.callback;
      if (callback) {
        callback();
      }
    });

    // Store button graphics for highlighting
    container.setData('bg', bg);
    container.setData('config', config);

    return container;
  }

  /**
   * Highlight a button
   */
  private highlightButton(buttonType: MenuButtonType, highlight: boolean): void {
    if (!this.buttons) return;
    const button = this.buttons.get(buttonType);
    if (!button) return;

    const bg = button.getData('bg') as Phaser.GameObjects.Graphics;
    const config = button.getData('config') as MenuButton;
    
    if (!bg || !config) return;

    bg.clear();
    
    const color = highlight 
      ? (config.highlightColor || this.theme.colors.secondary)
      : (config.color || this.theme.colors.background);
    
    bg.fillStyle(color, 1);
    bg.fillCircle(0, 0, this.buttonRadius);
    bg.lineStyle(2, this.theme.colors.border, 1);
    bg.strokeCircle(0, 0, this.buttonRadius);

    // Add glow effect when highlighted
    if (highlight) {
      this.scene.tweens.add({
        targets: button,
        scaleX: 1.1,
        scaleY: 1.1,
        duration: 150,
        ease: 'Back.easeOut',
      });
    } else {
      this.scene.tweens.add({
        targets: button,
        scaleX: 1,
        scaleY: 1,
        duration: 150,
        ease: 'Back.easeOut',
      });
    }
  }

  /**
   * Select a button
   */
  private selectButton(buttonType: MenuButtonType): void {
    // Deselect previous button
    if (this.selectedButton && this.selectedButton !== buttonType) {
      this.highlightButton(this.selectedButton, false);
    }

    this.selectedButton = buttonType;
    this.highlightButton(buttonType, true);

    // Emit selection event
    this.scene.events.emit('menuButtonSelected', buttonType);
  }

  /**
   * Set button callback
   */
  setButtonCallback(buttonType: MenuButtonType, callback: () => void): void {
    if (!this.buttonConfigs) return;
    const config = this.buttonConfigs.find(c => c.type === buttonType);
    if (config) {
      config.callback = callback;
    }
    
    // Also update the button's callback if it already exists
    if (this.buttons) {
      const button = this.buttons.get(buttonType);
      if (button) {
        const existingConfig = button.getData('config') as MenuButton;
        if (existingConfig) {
          existingConfig.callback = callback;
          button.setData('config', existingConfig);
        }
      }
    }
  }

  /**
   * Show menu
   */
  showMenu(): void {
    this.show(true);
    // Position at bottom center of screen
    const cameraHeight = this.scene.cameras.main.height;
    this.setPosition(this.scene.cameras.main.width / 2, cameraHeight - 50);
  }

  /**
   * Hide menu
   */
  hideMenu(): void {
    this.hide(true);
  }

  /**
   * Check if menu is showing
   */
  isMenuShowing(): boolean {
    return this.isVisible;
  }
}

