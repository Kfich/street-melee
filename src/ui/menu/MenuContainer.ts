import Phaser from 'phaser';
import { MenuTheme } from './MenuTheme';
import { MenuButton } from './MenuButton';

/**
 * Menu container that manages multiple menu items with keyboard navigation
 */
export class MenuContainer {
  private scene: Phaser.Scene;
  private theme: MenuTheme;
  private container: Phaser.GameObjects.Container;
  private title: Phaser.GameObjects.Text;
  private subtitle?: Phaser.GameObjects.Text;
  private buttons: MenuButton[] = [];
  private selectedIndex: number = 0;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private audioManager?: any;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    title: string,
    theme: MenuTheme,
    subtitle?: string,
    audioManager?: any
  ) {
    this.scene = scene;
    this.theme = theme;
    this.audioManager = audioManager;

    // Create container
    this.container = scene.add.container(x, y);

    // Create title
    this.title = scene.add.text(0, 0, title, {
      fontSize: this.theme.typography.titleSize,
      fontFamily: this.theme.typography.titleFont,
      color: `#${this.theme.colors.text.toString(16).padStart(6, '0')}`,
      stroke: `#000000`,
      strokeThickness: this.theme.typography.titleStroke,
      fontStyle: 'bold',
    });
    this.title.setOrigin(0.5);

    // Create subtitle if provided - adjusted for 8-bit font
    if (subtitle) {
      this.subtitle = scene.add.text(0, this.theme.spacing.titleMargin, subtitle, {
        fontSize: '12px', // Reduced for 8-bit font readability
        fontFamily: this.theme.typography.itemFont,
        color: `#${this.theme.colors.textSecondary.toString(16).padStart(6, '0')}`,
      });
      this.subtitle.setOrigin(0.5);
      this.container.add(this.subtitle);
    }

    this.container.add(this.title);
    this.container.setDepth(1000);

    // Set up keyboard navigation
    this.cursors = scene.input.keyboard?.createCursorKeys();
    scene.input.keyboard?.on('keydown-ENTER', () => {
      if (this.buttons[this.selectedIndex]) {
        this.buttons[this.selectedIndex].getContainer().emit('pointerdown');
      }
    });
  }

  addButton(label: string, onClick: () => void, onHover?: () => void): MenuButton {
    // Calculate button Y position relative to container
    // Start after title/subtitle, then space buttons evenly
    const baseOffset = this.subtitle ? this.theme.spacing.titleMargin + 50 : this.theme.spacing.titleMargin + 30;
    const y = baseOffset + this.buttons.length * this.theme.spacing.itemSpacing;

    const button = new MenuButton(
      this.scene,
      0,
      y,
      label,
      this.theme,
      () => {
        if (this.audioManager) {
          this.audioManager.playSound('menuSelect');
        }
        onClick();
      },
      () => {
        if (this.audioManager) {
          this.audioManager.playSound('menuSelect', 0.5);
        }
        const index = this.buttons.indexOf(button);
        this.selectIndex(index);
        if (onHover) {
          onHover();
        }
      }
    );

    this.buttons.push(button);
    this.container.add(button.getContainer());

    // Update selection if this is the first button
    if (this.buttons.length === 1) {
      this.selectIndex(0);
    }

    return button;
  }

  selectIndex(index: number) {
    if (index >= 0 && index < this.buttons.length) {
      this.selectedIndex = index;
      this.buttons.forEach((button, i) => {
        button.setSelected(i === index);
      });
    }
  }

  update() {
    if (!this.cursors) return;

    if (Phaser.Input.Keyboard.JustDown(this.cursors.up!)) {
      this.selectedIndex = (this.selectedIndex - 1 + this.buttons.length) % this.buttons.length;
      this.selectIndex(this.selectedIndex);
      if (this.audioManager) {
        this.audioManager.playSound('menuSelect', 0.5);
      }
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.down!)) {
      this.selectedIndex = (this.selectedIndex + 1) % this.buttons.length;
      this.selectIndex(this.selectedIndex);
      if (this.audioManager) {
        this.audioManager.playSound('menuSelect', 0.5);
      }
    }
  }

  setVisible(visible: boolean) {
    this.container.setVisible(visible);
  }

  destroy() {
    this.buttons.forEach((button) => button.destroy());
    this.container.destroy();
  }

  getContainer(): Phaser.GameObjects.Container {
    return this.container;
  }
}

