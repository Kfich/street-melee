import Phaser from 'phaser';
import { MenuTheme } from './MenuTheme';
import { CharacterType, CHARACTER_STATS } from '../../game/types/CharacterType';
import { getCharacterData, getCharacterDisplaySprite } from './CharacterData';

/**
 * Character selection box component with sprite, stats, and description
 */
export class CharacterSelectBox {
  private scene: Phaser.Scene;
  private theme: MenuTheme;
  private characterType: CharacterType;
  private container: Phaser.GameObjects.Container;
  private background: Phaser.GameObjects.Graphics;
  private nameText: Phaser.GameObjects.Text;
  private spriteImage?: Phaser.GameObjects.Image;
  private placeholderText?: Phaser.GameObjects.Text;
  private glow: Phaser.GameObjects.Graphics;
  private isSelected: boolean = false;
  private isHovered: boolean = false;
  private onClickCallback?: () => void;
  private onHoverCallback?: () => void;
  private statsBars: Phaser.GameObjects.Graphics[] = [];
  private selectionIndicator?: Phaser.GameObjects.Text;
  private hoverOutline: Phaser.GameObjects.Graphics;
  private baseScale: number = 1.0;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    characterType: CharacterType,
    theme: MenuTheme,
    onClick?: () => void,
    onHover?: () => void
  ) {
    this.scene = scene;
    this.theme = theme;
    this.characterType = characterType;
    this.onClickCallback = onClick;
    this.onHoverCallback = onHover;

    const characterData = getCharacterData(characterType);
    const boxWidth = 200; // Increased width to better fit content
    const boxHeight = 288; // Reduced by 10% from 320 to 288
    const borderRadius = 12;

    // Create container with high depth to ensure it's always in foreground
    this.container = scene.add.container(x, y);
    this.container.setDepth(2000); // Very high depth to ensure foreground rendering

    // Create glow effect - rounded (add first, so it's behind everything)
    this.glow = scene.add.graphics();
    this.glow.fillStyle(theme.colors.selected, 0);
    this.glow.fillRoundedRect(
      -(boxWidth + 20) / 2,
      -(boxHeight + 20) / 2,
      boxWidth + 20,
      boxHeight + 20,
      borderRadius + 4
    );
    this.glow.setBlendMode(Phaser.BlendModes.ADD);
    this.container.add(this.glow); // Add first (bottom layer)

    // Create hover outline (initially hidden) - rounded with better styling
    this.hoverOutline = scene.add.graphics();
    this.hoverOutline.lineStyle(5, theme.colors.hover, 0); // Thicker outline
    this.hoverOutline.strokeRoundedRect(
      -(boxWidth + 10) / 2,
      -(boxHeight + 10) / 2,
      boxWidth + 10,
      boxHeight + 10,
      borderRadius + 3
    );
    this.container.add(this.hoverOutline); // Add second

    // Create background with rounded corners (add third, above glow/outline, below content)
    this.background = scene.add.graphics();
    // Use slightly darker background for better contrast
    this.background.fillStyle(theme.colors.primary, 0.95);
    this.background.fillRoundedRect(-boxWidth / 2, -boxHeight / 2, boxWidth, boxHeight, borderRadius);
    // Thicker, more prominent border
    this.background.lineStyle(3, theme.colors.text, 1);
    this.background.strokeRoundedRect(-boxWidth / 2, -boxHeight / 2, boxWidth, boxHeight, borderRadius);
    this.container.add(this.background); // Add third (above glow/outline)
    // Explicitly send background to back to ensure it stays behind content
    this.container.sendToBack(this.background);

    // Create character name - larger for 8-bit font with better styling
    // Note: Depth is managed by container order, not setDepth for container children
    this.nameText = scene.add.text(0, -140, characterData.name, {
      fontSize: '18px', // Adjusted for 8-bit font
      fontFamily: theme.typography.itemFont,
      color: `#${theme.colors.text.toString(16).padStart(6, '0')}`,
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2,
    });
    this.nameText.setOrigin(0.5);
    // Add name text after background (so it appears on top)
    this.container.add(this.nameText);
    // Explicitly bring name to front
    this.container.bringToTop(this.nameText);

    // Try to load character sprite
    const spriteKey = getCharacterDisplaySprite(characterType, 'right');
    if (scene.textures.exists(spriteKey)) {
      this.spriteImage = scene.add.image(0, -30, spriteKey);
      this.spriteImage.setOrigin(0.5, 0.5);
      
      // Scale sprite to fit in box - use larger size for all characters to match Blaze and Max
      // Some characters (Axel, Sammy) have smaller sprites, so we'll scale them up more
      const maxHeight = 130; // Increased from 110 to make all sprites larger and more consistent
      const baseScale = maxHeight / this.spriteImage.height;
      
      // For characters with naturally smaller sprites (Axel, Sammy), scale them up more
      // This ensures all character sprites appear similar in size
      let scale = baseScale;
      if (characterType === 'axel' || characterType === 'sammy') {
        // Scale up smaller sprites to match the visual size of Blaze and Max
        scale = baseScale * 1.15; // 15% larger to compensate for smaller base sprite
        // Cap at reasonable maximum
        scale = Math.min(scale, 2.0);
      } else {
        scale = Math.min(baseScale, 1.5);
      }
      
      this.spriteImage.setScale(scale);
      
      // Apply pixel-perfect rendering
      const texture = scene.textures.get(spriteKey);
      texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
      
      // Add subtle idle animation (gentle bounce)
      scene.tweens.add({
        targets: this.spriteImage,
        y: -30 - 3,
        duration: 1500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
      
      // Add sprite to container (depth managed by container order)
      this.container.add(this.spriteImage);
      // Explicitly bring sprite to front
      this.container.bringToTop(this.spriteImage);
    } else {
      // Fallback to placeholder
      this.placeholderText = scene.add.text(0, -30, '?', {
        fontSize: '64px',
        fontFamily: theme.typography.itemFont,
        color: `#${theme.colors.textSecondary.toString(16).padStart(6, '0')}`,
      });
      this.placeholderText.setOrigin(0.5);
      // Add placeholder to container (depth managed by container order)
      this.container.add(this.placeholderText);
      // Explicitly bring placeholder to front
      this.container.bringToTop(this.placeholderText);
    }

    // Create stats bars - centered under the player sprite
    const stats = CHARACTER_STATS[characterType];
    const statNames = ['PWR', 'TEC', 'SPD', 'JMP', 'STM'];
    const statValues = [stats.power, stats.technique, stats.speed, stats.jump, stats.stamina];
    // Calculate bar width with consistent margins (20px on each side of 200px card)
    const cardMargin = 20;
    const labelWidth = 30; // Approximate width for 3-letter stat names
    const labelBarGap = 8; // Gap between label and bar
    const actualBarWidth = boxWidth - (cardMargin * 2) - labelWidth - labelBarGap; // Remaining width for bar
    const barHeight = 8;
    const barSpacing = 14; // Increased spacing between bars
    const statsSectionHeight = (statNames.length - 1) * barSpacing + barHeight; // Total height of all stats
    
    // Calculate stats position to center them under the sprite
    // Sprite is at y = -30, calculate sprite bottom after scaling
    const spriteY = -30;
    let spriteBottomY = spriteY;
    if (this.spriteImage) {
      // Get sprite's scaled height
      const spriteScaledHeight = this.spriteImage.height * this.spriteImage.scaleY;
      spriteBottomY = spriteY + spriteScaledHeight / 2;
    } else if (this.placeholderText) {
      // Placeholder approximate height
      spriteBottomY = spriteY + 32; // Approximate half height of placeholder
    }
    
    // Position stats to start below sprite with spacing, then center the stats section
    const statsSpacing = 15; // Space between sprite bottom and stats start
    const statsY = spriteBottomY + statsSpacing + statsSectionHeight / 2; // Center stats section

    statNames.forEach((statName, index) => {
      // Position each stat bar relative to the centered stats section
      const y = statsY - statsSectionHeight / 2 + index * barSpacing + barHeight / 2;
      
      // Position label with consistent margin from card edge
      const labelX = -boxWidth / 2 + cardMargin; // Start from card edge + margin
      const barStartX = labelX + labelWidth + labelBarGap; // Bar starts after label + gap
      
      // Stat label - increased size and spacing for 8-bit font readability
      // Add label first so it appears behind bars (we'll bring it to front later)
      const label = scene.add.text(labelX, y, statName, {
        fontSize: '12px', // Increased from 10px for better readability
        fontFamily: theme.typography.labelFont,
        color: `#${theme.colors.text.toString(16).padStart(6, '0')}`, // Use primary text color for better visibility
        stroke: '#000000',
        strokeThickness: 1,
      });
      label.setOrigin(0, 0.5); // Left-aligned from margin position
      this.container.add(label);
      
      // Stat bar background (add first so it's behind the fill) - styled with rounded corners
      // Position bars to start after label with consistent margins
      const bgBar = scene.add.graphics();
      bgBar.fillStyle(theme.colors.secondary, 1);
      bgBar.fillRoundedRect(barStartX, y - barHeight / 2, actualBarWidth, barHeight, 4);
      bgBar.lineStyle(1, theme.colors.text, 0.3);
      bgBar.strokeRoundedRect(barStartX, y - barHeight / 2, actualBarWidth, barHeight, 4);
      this.container.add(bgBar);
      // Ensure background bar stays behind fill
      this.container.sendToBack(bgBar);

      // Stat bar fill with better color coding (add after background so it's on top)
      const fillBar = scene.add.graphics();
      const fillWidth = (actualBarWidth * statValues[index]) / 3; // Max stat is 3
      let fillColor: number;
      if (statValues[index] === 3) {
        fillColor = theme.colors.selected; // Gold for max
      } else if (statValues[index] === 2) {
        fillColor = theme.colors.accent; // Red for medium
      } else {
        fillColor = 0x4a90e2; // Blue for low (better visibility)
      }
      // Rounded fill bar with subtle border
      fillBar.fillStyle(fillColor, 1);
      fillBar.fillRoundedRect(barStartX, y - barHeight / 2, fillWidth, barHeight, 4);
      fillBar.lineStyle(1, fillColor, 0.8);
      fillBar.strokeRoundedRect(barStartX, y - barHeight / 2, fillWidth, barHeight, 4);
      this.container.add(fillBar);
      this.statsBars.push(fillBar);
      // Bring fill bar to front
      this.container.bringToTop(fillBar);
      
      // Bring label to front so it's always visible (after bars are added)
      this.container.bringToTop(label);
    });

    // Selection indicator (checkmark) - initially hidden, adjusted for 8-bit font
    // Add last so it appears on top of everything
    this.selectionIndicator = scene.add.text(boxWidth / 2 - 15, -boxHeight / 2 + 15, '✓', {
      fontSize: '24px', // Slightly larger for better visibility
      fontFamily: theme.typography.itemFont,
      color: `#${theme.colors.selected.toString(16).padStart(6, '0')}`,
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3,
    });
    this.selectionIndicator.setOrigin(0.5);
    this.selectionIndicator.setVisible(false);
    // Add selection indicator last (so it appears on top of everything)
    this.container.add(this.selectionIndicator);
    // Explicitly bring selection indicator to very top
    this.container.bringToTop(this.selectionIndicator);

    // Set up interactivity - use container for hit area (matches new card size)
    const hitArea = new Phaser.Geom.Rectangle(-boxWidth / 2, -boxHeight / 2, boxWidth, boxHeight);
    this.container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);
    if (this.container.input) {
      this.container.input.cursor = 'pointer';
    }
    this.container.on('pointerdown', () => this.handleClick());
    this.container.on('pointerover', () => this.handleHover());
    this.container.on('pointerout', () => this.handleOut());

    // Container depth is already set to 2000 above
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
      if (this.onHoverCallback) {
        this.onHoverCallback();
      }
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
      // Show/hide selection indicator
      if (this.selectionIndicator) {
        this.selectionIndicator.setVisible(selected);
      }
    }
  }

  private updateVisualState() {
    // Kill any in-flight tweens so rapid navigation doesn't stack conflicting
    // scale/glow tweens that prevent state from settling at the correct value.
    this.scene.tweens.killTweensOf(this.container);
    this.scene.tweens.killTweensOf(this.glow);

    const strokeColor = this.isSelected
      ? this.theme.colors.selected
      : this.isHovered
      ? this.theme.colors.hover
      : this.theme.colors.text;

    const glowAlpha = this.isSelected || this.isHovered ? this.theme.effects.glowIntensity : 0;
    const scale = (this.isSelected ? this.theme.effects.selectScale : this.isHovered ? this.theme.effects.hoverScale : 1.0) * this.baseScale;
    const outlineAlpha = this.isHovered ? 1.0 : 0;

    // Update stroke for rounded rectangle
    const boxWidth = 200; // Match increased width
    const boxHeight = 288; // Match reduced height (10% reduction)
    const borderRadius = 12;
    this.background.clear();
    // Use slightly darker background for better contrast
    this.background.fillStyle(this.theme.colors.primary, 0.95);
    this.background.fillRoundedRect(-boxWidth / 2, -boxHeight / 2, boxWidth, boxHeight, borderRadius);
    // Thicker, more prominent border that changes color based on state
    const strokeWidth = this.isSelected ? 4 : 3; // Thicker border when selected
    this.background.lineStyle(strokeWidth, strokeColor, 1);
    this.background.strokeRoundedRect(-boxWidth / 2, -boxHeight / 2, boxWidth, boxHeight, borderRadius);
    // Ensure background stays behind all content after redraw
    this.container.sendToBack(this.background);

    // Update container depth - bring to front when hovered or selected
    const newDepth = (this.isSelected || this.isHovered) ? 2010 : 2000;
    this.container.setDepth(newDepth);

    // Animate scale
    this.scene.tweens.add({
      targets: this.container,
      scaleX: scale,
      scaleY: scale,
      duration: this.theme.effects.transitionDuration,
      ease: 'Power2',
    });

    // Animate glow
    this.scene.tweens.add({
      targets: this.glow,
      alpha: glowAlpha,
      duration: this.theme.effects.transitionDuration,
    });

    // Animate hover outline
    if (this.hoverOutline) {
      this.hoverOutline.clear();
      this.hoverOutline.lineStyle(5, this.theme.colors.hover, outlineAlpha); // Thicker outline
      const boxWidth = 200; // Match increased width
      const boxHeight = 288; // Match reduced height (10% reduction)
      const borderRadius = 12;
      this.hoverOutline.strokeRoundedRect(
        -(boxWidth + 10) / 2,
        -(boxHeight + 10) / 2,
        boxWidth + 10,
        boxHeight + 10,
        borderRadius + 3
      );
    }
  }

  getCharacterType(): CharacterType {
    return this.characterType;
  }

  setVisible(visible: boolean) {
    this.container.setVisible(visible);
  }

  destroy() {
    this.scene.tweens.killTweensOf(this.container);
    this.scene.tweens.killTweensOf(this.glow);
    if (this.spriteImage) {
      this.scene.tweens.killTweensOf(this.spriteImage);
    }
    this.container.destroy();
  }

  setBaseScale(scale: number) {
    this.baseScale = scale;
  }

  getContainer(): Phaser.GameObjects.Container {
    return this.container;
  }
}

