import Phaser from 'phaser';
import { Boss } from '../entities/bosses/Boss';
import { EntityManager } from './EntityManager';
import { BossSceneManager } from '../systems/boss/BossSceneManager';
import { BossHealthBar } from '../ui/BossHealthBar';
import { DialogueSystem } from '../systems/story/DialogueSystem';
import { StoryManager } from '../systems/story/StoryManager';
import { LevelManager } from '../systems/level/LevelManager';
import { GameConfig } from '../config/GameConfig';

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
    // Use Y position for depth sorting so lower entities appear in front
    boss.sprite.setDepth(boss.sprite.y);
    
    // Set up ground collision
    this.scene.physics.add.collider(boss.sprite, this.ground);
    
    // Show boss health bar (only for combat bosses)
    const isCombat = boss.sprite.getData('isCombat') !== false; // Default to true if not set
    if (isCombat && this.bossHealthBar) {
      // Defer setting boss to ensure scene is fully ready
      this.scene.time.delayedCall(16, () => {
        if (this.bossHealthBar && boss) {
          this.bossHealthBar.setBoss(boss);
        }
      });
    }
    
    // Trigger boss dialogue if available (with small delay to ensure boss is fully spawned)
    if (this.dialogueSystem && this.storyManager) {
      this.scene.time.delayedCall(GameConfig.INIT_DELAY_LONG, () => {
        if (this.levelManager) {
          const levelIndex = this.levelManager.getCurrentLevel() - 1;
          // Create a flags map for dialogue checking
          const flags = new Map<string, boolean>();
          // Check for boss-specific dialogues (they use scene_index matching level + 1)
          this.dialogueSystem!.checkAndTriggerDialogue(levelIndex + 1, flags);
        }
      });
    }
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
   * Clean up bosses array (removes stale references)
   */
  cleanup(): void {
    const activeBosses = this.entityManager.getBosses();
    this.bosses = this.bosses.filter(boss => {
      if (!boss || !boss.sprite || !boss.sprite.active) {
        return false;
      }
      return activeBosses.includes(boss);
    });
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

