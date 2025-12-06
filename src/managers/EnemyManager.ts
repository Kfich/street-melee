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
   * Handle enemy spawned event
   */
  private handleEnemySpawned(enemy: Enemy): void {
    this.enemies.push(enemy);
    this.entityManager.add(enemy);
    enemy.sprite.setData('entity', enemy);
    enemy.sprite.setData('isEnemy', true);
    
    // Set depth based on Y position for proper layering
    enemy.sprite.setDepth(enemy.sprite.y);
    
    // Set up ground collision
    this.scene.physics.add.collider(enemy.sprite, this.ground);
  }

  /**
   * Handle enemy defeated event
   */
  private handleEnemyDefeated(enemy: Enemy): void {
    const enemyId = enemy.sprite.getData('enemyId');
    const waveNumber = enemy.sprite.getData('waveNumber');
    
    // Notify level manager
    if (this.levelManager && enemyId) {
      this.levelManager.onEnemyDefeated(enemyId, waveNumber);
    }
    
    // Remove enemy from array
    const enemyIndex = this.enemies.findIndex(e => e === enemy);
    if (enemyIndex > -1) {
      // Clean up enemy shadow
      this.cleanupEnemyShadow(enemy);
      
      // Release to pool if available, otherwise destroy
      const enemyPool = (this.scene as any).enemyPool;
      if (enemyPool) {
        enemyPool.release(enemy);
      } else if (enemy && enemy.sprite) {
        enemy.sprite.destroy();
      }
      
      // Remove from array
      this.enemies.splice(enemyIndex, 1);
    }
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

