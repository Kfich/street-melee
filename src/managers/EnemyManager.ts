import Phaser from 'phaser';
import { Enemy } from '../entities/enemies/Enemy';
import { BaseEntity } from '../entities/base/BaseEntity';
import { EntityManager } from './EntityManager';
import { LevelManager } from '../systems/level/LevelManager';
import { VisualEffects } from '../systems/effects/VisualEffects';
import { EnemyAI } from '../systems/ai/EnemyAI';
import { SpatialGrid } from '../systems/collision/SpatialGrid';

/**
 * Manages enemy spawning, updates, and cleanup
 */
export class EnemyManager {
  private scene: Phaser.Scene;
  private enemies: Enemy[] = [];
  private entityManager: EntityManager;
  private levelManager?: LevelManager;
  private visualEffects?: VisualEffects;
  private enemyShadows: Map<Enemy, Phaser.GameObjects.Ellipse> = new Map();
  private ground: Phaser.GameObjects.Rectangle;
  private enemyAI?: EnemyAI;

  constructor(
    scene: Phaser.Scene,
    entityManager: EntityManager,
    ground: Phaser.GameObjects.Rectangle,
    levelManager?: LevelManager,
    visualEffects?: VisualEffects,
    spatialGrid?: SpatialGrid
  ) {
    this.scene = scene;
    this.entityManager = entityManager;
    this.ground = ground;
    this.levelManager = levelManager;
    this.visualEffects = visualEffects;
    
    // Initialize enhanced AI system
    this.enemyAI = new EnemyAI(entityManager, spatialGrid);
    
    this.setupEventListeners();
  }

  /**
   * Setup event listeners for enemy spawning and defeat
   */
  private setupEventListeners(): void {
    // Listen for enemy spawns
    this.scene.events.on('enemySpawned', (enemy: Enemy) => {
      this.handleEnemySpawned(enemy);
    });

    // Listen for enemy defeats
    this.scene.events.on('entityDefeated', (entity: BaseEntity) => {
      if (entity.sprite.getData('isEnemy')) {
        this.handleEnemyDefeated(entity as Enemy);
      }
    });
  }

  /**
   * Handle enemy spawned event — plays a brief entry flash so enemies don't
   * just pop into existence.
   */
  private handleEnemySpawned(enemy: Enemy): void {
    this.enemies.push(enemy);
    this.entityManager.add(enemy);
    enemy.sprite.setData('entity', enemy);
    enemy.sprite.setData('isEnemy', true);
    enemy.sprite.setData('enemyType', enemy.getEnemyType());

    // Depth from Y for proper layering
    enemy.sprite.setDepth(enemy.sprite.y);

    // Ground collision
    this.scene.physics.add.collider(enemy.sprite, this.ground);

    // --- Spawn entry effect ---
    // Capture the final scale set by setupEnemy/configureEnemySpriteDisplay
    const targetScaleX = enemy.sprite.scaleX;
    const targetScaleY = enemy.sprite.scaleY;

    // Start compressed + invisible with an orange flash tint
    enemy.sprite.setAlpha(0);
    enemy.sprite.setScale(targetScaleX * 1.3, targetScaleY * 0.4);
    enemy.sprite.setTint(0xff8800);

    this.scene.tweens.add({
      targets: enemy.sprite,
      alpha: 1,
      scaleX: targetScaleX,
      scaleY: targetScaleY,
      duration: 220,
      ease: 'Back.easeOut',
      onComplete: () => {
        if (enemy.sprite && enemy.sprite.active) {
          enemy.sprite.clearTint();
        }
      }
    });
  }

  /**
   * Handle enemy defeated event — runs a multi-phase death sequence before
   * releasing the enemy back to the pool.
   *
   * Phase 1 (0–300 ms)  : rapid red/white strobe (4 flashes × 75 ms)
   * Phase 2 (300–550 ms): collapse tween — rotate 90°, squish to flat
   * Phase 3 (550–850 ms): fade out alpha to 0
   * Phase 4            : release to pool / destroy
   */
  private handleEnemyDefeated(enemy: Enemy): void {
    if (!enemy || !enemy.sprite || !enemy.sprite.active) return;

    // Mark as dying so the enemy's own update() is skipped
    enemy.setState('dying');

    // Immediately detach from EntityManager so AI targets move on and
    // the entity is excluded from combat checks — but sprite stays alive.
    this.entityManager.detach(enemy);

    // Remove from our local tracking array
    const enemyIndex = this.enemies.findIndex(e => e === enemy);
    if (enemyIndex > -1) {
      this.enemies.splice(enemyIndex, 1);
    }

    // Shadow cleanup right away
    this.cleanupEnemyShadow(enemy);

    // Notify level manager (wave tracking)
    const enemyId = enemy.sprite.getData('enemyId');
    const waveNumber = enemy.sprite.getData('waveNumber');
    if (this.levelManager && enemyId) {
      this.levelManager.onEnemyDefeated(enemyId, waveNumber);
    }

    // Stop physics movement
    const body = enemy.sprite.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.setVelocity(0, 0);
      body.setGravityY(0);
    }

    // --- Phase 1: strobe flash ---
    let flashCount = 0;
    const flashTimer = this.scene.time.addEvent({
      delay: 75,
      repeat: 7, // 4 on + 4 off cycles
      callback: () => {
        if (!enemy.sprite || !enemy.sprite.active) {
          flashTimer.destroy();
          return;
        }
        if (flashCount % 2 === 0) {
          enemy.sprite.setTint(0xff2222);
        } else {
          enemy.sprite.clearTint();
        }
        flashCount++;
      }
    });

    // --- Phase 2: collapse (starts after strobe) ---
    this.scene.time.delayedCall(300, () => {
      if (!enemy.sprite || !enemy.sprite.active) return;
      enemy.sprite.clearTint();

      const sx = enemy.sprite.scaleX;
      const sy = enemy.sprite.scaleY;

      this.scene.tweens.add({
        targets: enemy.sprite,
        angle: enemy.sprite.flipX ? -90 : 90,
        scaleX: sx * 1.4,
        scaleY: sy * 0.25,
        duration: 220,
        ease: 'Power3.easeIn',

        // --- Phase 3: fade out ---
        onComplete: () => {
          if (!enemy.sprite || !enemy.sprite.active) return;

          this.scene.tweens.add({
            targets: enemy.sprite,
            alpha: 0,
            duration: 280,
            ease: 'Power2',

            // --- Phase 4: pool / destroy ---
            onComplete: () => {
              const enemyPool = (this.scene as any).enemyPool;
              if (enemyPool) {
                enemyPool.release(enemy);
              } else if (enemy.sprite) {
                enemy.sprite.destroy();
              }
            }
          });
        }
      });
    });
  }

  /**
   * Update all enemies
   */
  update(): void {
    // Use EntityManager.getEnemies() for active enemies (already cached and filtered)
    const activeEnemies = this.entityManager.getEnemies();
    
    // Update spatial grid for AI if available
    if (this.enemyAI && this.scene) {
      const combatSystem = (this.scene as any).combatSystem;
      if (combatSystem && combatSystem.getSpatialGridStats) {
        const spatialGrid = (combatSystem as any).spatialGrid;
        if (spatialGrid) {
          this.enemyAI.setSpatialGrid(spatialGrid);
        }
      }
    }
    
    activeEnemies.forEach(enemy => {
      try {
        // Update enemy (uses internal AI for state management)
        enemy.update();
        
        // Enhance movement with spatial awareness if AI system available
        if (this.enemyAI) {
          const body = enemy.sprite.body as Phaser.Physics.Arcade.Body;
          if (body) {
            const baseVelocity = body.velocity.x;
            const enhancedVelocity = this.enemyAI.enhanceMovement(enemy, baseVelocity);
            body.setVelocityX(enhancedVelocity);
          }
        }
        
        // Update depth based on Y position for proper layering
        enemy.sprite.setDepth(enemy.sprite.y);
      } catch (error) {
        console.warn('[EnemyManager] Error updating enemy:', error);
      }
    });
  }

  /**
   * Setup ground collisions for all enemies
   */
  setupGroundCollisions(): void {
    this.enemies.forEach(enemy => {
      this.scene.physics.add.collider(enemy.sprite, this.ground);
    });
  }

  /**
   * Clean up enemy shadow
   */
  private cleanupEnemyShadow(enemy: Enemy): void {
    if (this.enemyShadows.has(enemy)) {
      const shadow = this.enemyShadows.get(enemy);
      if (shadow) {
        shadow.destroy();
      }
      this.enemyShadows.delete(enemy);
    }
  }

  /**
   * Update enemy shadows
   */
  updateShadows(): void {
    if (!this.visualEffects) return;

    this.enemyShadows.forEach((shadow, enemy) => {
      if (enemy && enemy.sprite && enemy.sprite.active && shadow && shadow.active) {
        this.visualEffects!.updateShadow(shadow, enemy.sprite);
      } else if (shadow) {
        shadow.destroy();
        this.enemyShadows.delete(enemy);
      }
    });
  }

  /**
   * Clean up enemies array (removes stale references)
   */
  cleanup(): void {
    const activeEnemies = this.entityManager.getEnemies();
    this.enemies = this.enemies.filter(enemy => {
      if (!enemy || !enemy.sprite || !enemy.sprite.active) {
        this.cleanupEnemyShadow(enemy);
        return false;
      }
      return activeEnemies.includes(enemy);
    });
  }

  /**
   * Clear all enemies
   */
  clear(): void {
    const enemyPool = (this.scene as any).enemyPool;
    this.enemies.forEach(enemy => {
      this.cleanupEnemyShadow(enemy);
      if (enemyPool) {
        enemyPool.release(enemy);
      } else if (enemy && enemy.sprite) {
        enemy.sprite.destroy();
      }
    });
    this.enemies = [];
  }

  /**
   * Get all enemies
   */
  getAll(): Enemy[] {
    return this.enemies;
  }

  /**
   * Get enemy count
   */
  getCount(): number {
    return this.enemies.length;
  }

  /**
   * Clean up event listeners
   */
  destroy(): void {
    this.scene.events.off('enemySpawned');
    this.scene.events.off('entityDefeated');
    this.clear();
  }
}

