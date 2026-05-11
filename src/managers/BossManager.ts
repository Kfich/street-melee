import Phaser from 'phaser';
import { Boss } from '../entities/bosses/Boss';
import { EntityManager } from './EntityManager';
import { BossSceneManager } from '../systems/boss/BossSceneManager';
import { BossHealthBar } from '../ui/BossHealthBar';
import { DialogueSystem } from '../systems/story/DialogueSystem';
import { StoryManager } from '../systems/story/StoryManager';
import { LevelManager } from '../systems/level/LevelManager';
/**
 * Manages boss spawning, updates, and cleanup
 */
export class BossManager {
  private scene: Phaser.Scene;
  private bosses: Boss[] = [];
  private entityManager: EntityManager;
  private bossSceneManager?: BossSceneManager;
  private bossHealthBar?: BossHealthBar;
  private dialogueSystem?: DialogueSystem;
  private storyManager?: StoryManager;
  private levelManager?: LevelManager;
  private ground: Phaser.GameObjects.Rectangle;

  constructor(
    scene: Phaser.Scene,
    entityManager: EntityManager,
    ground: Phaser.GameObjects.Rectangle,
    bossSceneManager?: BossSceneManager,
    bossHealthBar?: BossHealthBar,
    dialogueSystem?: DialogueSystem,
    storyManager?: StoryManager,
    levelManager?: LevelManager
  ) {
    this.scene = scene;
    this.entityManager = entityManager;
    this.ground = ground;
    this.bossSceneManager = bossSceneManager;
    this.bossHealthBar = bossHealthBar;
    this.dialogueSystem = dialogueSystem;
    this.storyManager = storyManager;
    this.levelManager = levelManager;
    
    this.setupEventListeners();
  }

  /**
   * Setup event listeners for boss spawning and destruction
   */
  private setupEventListeners(): void {
    // Listen for boss spawns
    this.scene.events.on('bossSpawned', (boss: Boss) => {
      this.handleBossSpawned(boss);
    });

    // Listen for boss destruction
    this.scene.events.on('bossDestroyed', (boss: Boss) => {
      this.handleBossDestroyed(boss);
    });
  }

  /** Display name shown on the entrance title card for each boss type */
  private static readonly BOSS_DISPLAY_NAMES: Record<string, string> = {
    blizz: 'BLIZZ',
    benny: 'BENNY',
    principle: 'THE PRINCIPAL',
    midnight: 'MIDNIGHT',
    angela: 'ANGELA',
    tony: 'TONY',
    police: 'POLICE',
  };

  /**
   * Handle boss spawned event
   */
  private handleBossSpawned(boss: Boss): void {
    // Check if boss is already in the list (prevent duplicates)
    if (this.bosses.includes(boss)) {
      return;
    }

    this.bosses.push(boss);
    this.entityManager.add(boss);
    boss.sprite.setData('entity', boss);
    boss.sprite.setData('isBoss', true);

    // Set depth for proper rendering (same layer as players/enemies)
    boss.sprite.setDepth(boss.sprite.y);

    // Set up ground collision
    this.scene.physics.add.collider(boss.sprite, this.ground);

    // Play entrance cinematic — freeze boss AI and player input while it runs
    this.playBossEntrance(boss);
  }

  /**
   * 2.4-second boss entrance: camera flash → WARNING card → boss name → unfreeze.
   */
  private playBossEntrance(boss: Boss): void {
    const bossType = boss.getBossType();
    const isCombat = (bossType !== 'angela' && bossType !== 'principle');
    const displayName = BossManager.BOSS_DISPLAY_NAMES[bossType] ?? bossType.toUpperCase();

    // Freeze the boss so it can't pursue the player during the cinematic
    boss.sprite.setActive(false);

    // Notify GameScene to freeze player input (pass bossType so scene can pick the right music)
    this.scene.events.emit('bossEntranceStart', { bossType });

    // ── Camera flash ─────────────────────────────────────────────────
    this.scene.cameras.main.flash(300, 255, 255, 255);

    // ── Build title card (pinned to camera via scrollFactor=0) ───────
    const cam = this.scene.cameras.main;
    const cx = cam.width / 2;
    const cy = cam.height / 2;

    // Semi-opaque horizontal bar
    const bar = this.scene.add.graphics();
    bar.fillStyle(0x000000, 0.85);
    bar.fillRect(0, cy - 60, cam.width, 120);
    bar.setScrollFactor(0);
    bar.setDepth(20000);
    bar.setAlpha(0);

    // Red top & bottom border lines
    const borders = this.scene.add.graphics();
    borders.lineStyle(2, 0xff2222, 1);
    borders.beginPath();
    borders.moveTo(0, cy - 60);
    borders.lineTo(cam.width, cy - 60);
    borders.moveTo(0, cy + 60);
    borders.lineTo(cam.width, cy + 60);
    borders.strokePath();
    borders.setScrollFactor(0);
    borders.setDepth(20001);
    borders.setAlpha(0);

    const fontFamily = '"Press Start 2P", monospace';

    // "WARNING" label
    const warningText = this.scene.add.text(cx, cy - 28, 'WARNING', {
      fontFamily,
      fontSize: '11px',
      color: '#ef4444',
      stroke: '#000000',
      strokeThickness: 3,
    });
    warningText.setOrigin(0.5, 0.5);
    warningText.setScrollFactor(0);
    warningText.setDepth(20002);
    warningText.setAlpha(0);

    // Boss name (large)
    const nameText = this.scene.add.text(cx, cy + 20, displayName, {
      fontFamily,
      fontSize: '22px',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 4,
    });
    nameText.setOrigin(0.5, 0.5);
    nameText.setScrollFactor(0);
    nameText.setDepth(20002);
    nameText.setAlpha(0);
    nameText.setScale(0.6);

    const cardObjects = [bar, borders, warningText, nameText];

    const cleanup = () => {
      cardObjects.forEach(obj => obj.destroy());
    };

    // Phase 1 (0–400ms): fade in the bar + borders
    this.scene.tweens.add({
      targets: [bar, borders],
      alpha: 1,
      duration: 250,
      ease: 'Power2',
      onComplete: () => {
        // Phase 2 (400–600ms): flash WARNING 3 times
        let flashes = 0;
        this.scene.time.addEvent({
          delay: 80,
          repeat: 5,
          callback: () => {
            warningText.setAlpha(flashes % 2 === 0 ? 1 : 0);
            flashes++;
          }
        });

        // Phase 3 (600–900ms): scale-in boss name
        this.scene.time.delayedCall(480, () => {
          warningText.setAlpha(1);
          this.scene.tweens.add({
            targets: nameText,
            alpha: 1,
            scaleX: 1,
            scaleY: 1,
            duration: 300,
            ease: 'Back.easeOut',
          });
        });

        // Phase 4 (1800–2200ms): hold → fade out everything
        this.scene.time.delayedCall(1400, () => {
          this.scene.tweens.add({
            targets: cardObjects,
            alpha: 0,
            duration: 350,
            ease: 'Power2',
            onComplete: () => {
              cleanup();
              // Unfreeze boss AI
              if (boss.sprite && boss.sprite.scene) {
                boss.sprite.setActive(true);
              }
              // Unfreeze player input
              this.scene.events.emit('bossEntranceEnd');

              // Show health bar and trigger dialogue now that entrance is done
              if (isCombat && this.bossHealthBar) {
                this.bossHealthBar.setBoss(boss);
              }
              if (this.dialogueSystem && this.storyManager && this.levelManager) {
                const levelIndex = this.levelManager.getCurrentLevel() - 1;
                const flags = new Map<string, boolean>();
                this.dialogueSystem.checkAndTriggerDialogue(levelIndex + 1, flags);
              }
            }
          });
        });
      }
    });
  }

  /**
   * Handle boss destroyed event
   */
  private handleBossDestroyed(boss: Boss): void {
    // Remove from bosses array
    this.bosses = this.bosses.filter(b => b !== boss);
    
    // Remove from entity manager
    this.entityManager.remove(boss);
    
    // Clear boss health bar if this was the active boss
    if (this.bossHealthBar) {
      this.bossHealthBar.clearBoss();
    }
  }

  /**
   * Update all bosses
   */
  update(): void {
    // Use EntityManager.getBosses() for active bosses (already cached and filtered)
    const activeBosses = this.entityManager.getBosses();
    activeBosses.forEach(boss => {
      try {
        boss.update();
        // Update depth based on Y position
        boss.sprite.setDepth(boss.sprite.y);
      } catch (error) {
        console.warn('[BossManager] Error updating boss:', error);
      }
    });
    
    // Sync boss array with BossSceneManager (for compatibility with existing code)
    // Only sync periodically to reduce overhead
    if (this.bossSceneManager) {
      const managerBosses = this.bossSceneManager.getActiveBosses();
      // Add any new bosses from manager
      managerBosses.forEach(boss => {
        if (!this.bosses.includes(boss)) {
          this.bosses.push(boss);
        }
      });
    }
  }

  /**
   * Update boss health bar
   */
  updateHealthBar(): void {
    if (this.bossHealthBar) {
      this.bossHealthBar.update();
    }
  }

  /**
   * Clean up bosses array (removes truly destroyed sprites).
   * A boss whose sprite.active is false may be mid-entrance cinematic — keep it.
   */
  cleanup(): void {
    this.bosses = this.bosses.filter(
      boss => boss?.sprite && boss.sprite.scene != null
    );
  }

  /**
   * Clear all bosses
   */
  clear(): void {
    this.bosses.forEach(boss => {
      if (boss && boss.sprite) {
        boss.sprite.destroy();
      }
    });
    this.bosses = [];
  }

  /**
   * Get all bosses
   */
  getAll(): Boss[] {
    return this.bosses;
  }

  /**
   * Get boss count
   */
  getCount(): number {
    return this.bosses.length;
  }

  /**
   * Clean up event listeners
   */
  destroy(): void {
    this.scene.events.off('bossSpawned');
    this.scene.events.off('bossDestroyed');
    this.clear();
  }
}

