import Phaser from 'phaser';
import { InGamePlayerHUD } from './InGamePlayerHUD';
import { InGamePlayer2HUD } from './InGamePlayer2HUD';
import { ContinueWidget } from './ContinueWidget';
import { InGameMenuWidget } from './InGameMenuWidget';
import { WIDGET_THEME } from './WidgetTheme';
import { Player } from '../../entities/characters/Player';

/**
 * Widget Manager
 * Coordinates all game widgets
 */
export class WidgetManager {
  private scene: Phaser.Scene;
  private playerHUD!: InGamePlayerHUD;
  private player2HUD!: InGamePlayer2HUD | null;
  private continueWidget!: ContinueWidget;
  private inGameMenuWidget!: InGameMenuWidget;
  private cameraWidth: number = 0;
  private cameraHeight: number = 0;
  private theme = WIDGET_THEME;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.cameraWidth = scene.cameras.main.width;
    this.cameraHeight = scene.cameras.main.height;
    this.initializeWidgets();
  }

  /**
   * Initialize all widgets
   */
  private initializeWidgets(): void {
    // Unified player 1 HUD - top of screen
    this.playerHUD = new InGamePlayerHUD(
      this.scene,
      this.cameraWidth / 2,
      this.theme.spacing.lg + 25
    );
    this.scene.children.bringToTop(this.playerHUD['container']);

    // Player 2 HUD - below player 1 HUD (initially null, created when player 2 exists)
    this.player2HUD = null;

    // Continue widget - center of screen
    this.continueWidget = new ContinueWidget(
      this.scene,
      this.cameraWidth / 2,
      this.cameraHeight / 2
    );
    // Continue widget starts hidden

    // In-game menu widget - bottom center (initially hidden)
    this.inGameMenuWidget = new InGameMenuWidget(
      this.scene,
      this.cameraWidth / 2,
      this.cameraHeight - 50
    );
    // Menu widget starts hidden
  }

  /**
   * Ensure all widgets are visible and properly initialized
   */
  ensureWidgetsVisible(): void {
    if (this.playerHUD) {
      this.playerHUD.show(false);
    }
  }

  /**
   * Update all widgets
   */
  update(): void {
    if (this.playerHUD) {
      this.playerHUD.update();
    }
    if (this.player2HUD) {
      this.player2HUD.update();
    }
  }

  /**
   * Set player 1 lives
   */
  setLives(lives: number, maxLives: number = 3): void {
    if (this.playerHUD) {
      this.playerHUD.setLives(lives, maxLives);
    }
  }

  /**
   * Set player 2 lives
   */
  setLives2(lives: number, maxLives: number = 3): void {
    if (this.player2HUD) {
      this.player2HUD.setLives(lives, maxLives);
    }
  }

  /**
   * Lose a life
   */
  loseLife(): void {
    if (this.playerHUD) {
      this.playerHUD.loseLife();
    }
  }

  /**
   * Gain a life
   */
  gainLife(): void {
    if (this.playerHUD) {
      this.playerHUD.gainLife();
    }
  }

  /**
   * Start game clock
   */
  startClock(): void {
    if (this.playerHUD) {
      this.playerHUD.startClock();
    }
  }

  /**
   * Stop game clock
   */
  stopClock(): void {
    if (this.playerHUD) {
      this.playerHUD.stopClock();
    }
  }

  /**
   * Reset game clock
   */
  resetClock(): void {
    if (this.playerHUD) {
      this.playerHUD.resetClock();
    }
  }

  /**
   * Get current game time
   */
  getGameTime(): number {
    return this.playerHUD ? this.playerHUD.getGameTime() : 0;
  }

  /**
   * Show continue prompt
   */
  showContinue(): void {
    this.continueWidget.showContinue();
  }

  /**
   * Hide continue prompt
   */
  hideContinue(): void {
    this.continueWidget.hideContinue();
  }

  /**
   * Check if continue is showing
   */
  isContinueShowing(): boolean {
    return this.continueWidget.isContinueShowing();
  }

  /**
   * Set player 1 for health tracking
   */
  setPlayer(player: Player | null): void {
    if (this.playerHUD) {
      this.playerHUD.setPlayer(player);
    }
  }

  /**
   * Set player 2 for health tracking (creates player 2 HUD if needed)
   */
  setPlayer2(player: Player | null): void {
    if (player && !this.player2HUD) {
      // Create player 2 HUD below player 1 HUD
      this.player2HUD = new InGamePlayer2HUD(
        this.scene,
        this.cameraWidth / 2,
        this.theme.spacing.lg + 25 + 60 // 60px below player 1 HUD
      );
      this.scene.children.bringToTop(this.player2HUD['container']);
    }
    
    if (this.player2HUD) {
      this.player2HUD.setPlayer(player);
    }
  }

  /**
   * Set player 1 score
   */
  setScore(score: number): void {
    if (this.playerHUD) {
      this.playerHUD.setScore(score);
    }
  }

  /**
   * Set player 2 score
   */
  setScore2(score: number): void {
    if (this.player2HUD) {
      this.player2HUD.setScore(score);
    }
  }

  /**
   * Add to player 1 score
   */
  addScore(points: number): void {
    if (this.playerHUD) {
      this.playerHUD.addScore(points);
    }
  }

  /**
   * Add to player 2 score
   */
  addScore2(points: number): void {
    if (this.player2HUD) {
      this.player2HUD.addScore(points);
    }
  }

  /**
   * Set player 1 pickup count
   */
  setPickupCount(count: number): void {
    if (this.playerHUD) {
      this.playerHUD.setPickupCount(count);
    }
  }

  /**
   * Set player 2 pickup count
   */
  setPickupCount2(count: number): void {
    if (this.player2HUD) {
      this.player2HUD.setPickupCount(count);
    }
  }

  /**
   * Increment player 1 pickup count
   */
  incrementPickup(): void {
    if (this.playerHUD) {
      this.playerHUD.incrementPickup();
    }
  }

  /**
   * Increment player 2 pickup count
   */
  incrementPickup2(): void {
    if (this.player2HUD) {
      this.player2HUD.incrementPickup();
    }
  }

  /**
   * Show in-game menu
   */
  showInGameMenu(): void {
    this.inGameMenuWidget.showMenu();
  }

  /**
   * Hide in-game menu
   */
  hideInGameMenu(): void {
    this.inGameMenuWidget.hideMenu();
  }

  /**
   * Check if in-game menu is showing
   */
  isInGameMenuShowing(): boolean {
    return this.inGameMenuWidget.isMenuShowing();
  }

  /**
   * Set menu button callback
   */
  setMenuButtonCallback(buttonType: 'menu' | 'continue' | 'minus' | 'pause' | 'plus' | 'quit', callback: () => void): void {
    this.inGameMenuWidget.setButtonCallback(buttonType, callback);
  }

  /**
   * Handle window resize
   */
  handleResize(): void {
    this.cameraWidth = this.scene.cameras.main.width;
    this.cameraHeight = this.scene.cameras.main.height;
    
    // Reposition player 1 HUD
    if (this.playerHUD) {
      this.playerHUD.setPosition(
        this.cameraWidth / 2,
        this.theme.spacing.lg + 25
      );
    }
    
    // Reposition player 2 HUD
    if (this.player2HUD) {
      this.player2HUD.setPosition(
        this.cameraWidth / 2,
        this.theme.spacing.lg + 25 + 60
      );
    }
    
    // Reposition continue widget
    if (this.continueWidget) {
      this.continueWidget.setPosition(
        this.cameraWidth / 2,
        this.cameraHeight / 2
      );
    }

    // Reposition in-game menu
    if (this.inGameMenuWidget) {
      this.inGameMenuWidget.setPosition(
        this.cameraWidth / 2,
        this.cameraHeight - 50
      );
    }
  }

  /**
   * Destroy all widgets
   */
  destroy(): void {
    if (this.playerHUD) {
      this.playerHUD.destroy();
    }
    if (this.player2HUD) {
      this.player2HUD.destroy();
    }
    if (this.continueWidget) {
      this.continueWidget.destroy();
    }
    if (this.inGameMenuWidget) {
      this.inGameMenuWidget.destroy();
    }
  }
}

