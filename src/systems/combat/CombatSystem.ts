import Phaser from 'phaser';
import { Hitbox } from './Hitbox';
import { BaseEntity } from '../../entities/base/BaseEntity';
import { BaseCharacter } from '../../entities/characters/BaseCharacter';
import { DamageInfo } from '../../types/GameTypes';
import { GameConfig } from '../../config/GameConfig';
import { SpatialGrid } from '../collision/SpatialGrid';

/**
 * Combat system for handling attacks and damage
 * Uses spatial partitioning for efficient collision detection
 */
export class CombatSystem {
  private scene: Phaser.Scene;
  private activeHitboxes: Set<Hitbox> = new Set();
  private hitTargets: Map<Hitbox, Set<Phaser.Physics.Arcade.Sprite>> = new Map();
  private spatialGrid: SpatialGrid;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    // Initialize spatial grid with cell size from config
    const worldBounds = new Phaser.Geom.Rectangle(
      0,
      0,
      scene.cameras.main.width * 2, // Default to 2x camera width
      scene.cameras.main.height * 2 // Default to 2x camera height
    );
    this.spatialGrid = new SpatialGrid(GameConfig.SPATIAL_GRID_CELL_SIZE, worldBounds);
  }

  /**
   * Register a hitbox for collision detection
   */
  registerHitbox(hitbox: Hitbox) {
    this.activeHitboxes.add(hitbox);
    hitbox.activate();
    
    // Track which targets this hitbox has already hit (prevent multi-hits)
    if (!this.hitTargets.has(hitbox)) {
      this.hitTargets.set(hitbox, new Set());
    }
  }

  /**
   * Update combat system - check for collisions using spatial partitioning
   */
  update(targets: BaseEntity[]) {
    // Clear and rebuild spatial grid each frame
    this.spatialGrid.clear();

    // Insert all active hitboxes into the grid
    this.activeHitboxes.forEach(hitbox => {
      if (!hitbox.active) return;
      if (!hitbox.owner || !hitbox.owner.active) return;
      this.spatialGrid.insertHitbox(hitbox);
    });

    // Insert all targets into the grid
    targets.forEach(target => {
      if (!target || !target.sprite || !target.sprite.active) return;
      this.spatialGrid.insertEntity(target);
    });

    // Get potential collision pairs from spatial grid
    // This only returns pairs that are in the same or adjacent cells
    const collisionPairs = this.spatialGrid.getCollisionPairs();

    // Process collision pairs
    collisionPairs.forEach(({ hitbox, entity }) => {
      const hitTargets = this.hitTargets.get(hitbox) || new Set();

      // Skip if already hit by this hitbox
      if (hitTargets.has(entity.sprite)) return;

      // Verify both still exist and are active
      if (!hitbox.active || !hitbox.owner || !hitbox.owner.active) return;
      if (!entity || !entity.sprite || !entity.sprite.active) return;

      // Skip if hitting self
      if (entity.sprite === hitbox.owner) return;

      // Faction check: prevent friendly fire between same-faction entities.
      // Players should not hurt other players; enemies should not hurt other enemies.
      const ownerIsPlayer = hitbox.owner.getData('isPlayer');
      const ownerIsEnemy  = hitbox.owner.getData('isEnemy');
      const targetIsPlayer = entity.sprite.getData('isPlayer');
      const targetIsEnemy  = entity.sprite.getData('isEnemy');
      if (ownerIsPlayer && targetIsPlayer) return;
      if (ownerIsEnemy  && targetIsEnemy)  return;

      // Check collision (fine-grained check)
      if (hitbox.intersects(entity.sprite)) {
        this.applyDamage(entity, hitbox);
        hitTargets.add(entity.sprite);
      }
    });

    // Clean up inactive hitboxes
    this.cleanupHitboxes();
  }

  /**
   * Apply damage from a hitbox to a target
   */
  private applyDamage(target: BaseEntity, hitbox: Hitbox) {
    // Validate target and sprite exist
    if (!target || !target.sprite || !target.sprite.active) {
      return; // Target is destroyed or invalid
    }
    
    // Validate hitbox owner exists
    if (!hitbox.owner || !hitbox.owner.active) {
      return; // Hitbox owner is destroyed
    }
    
    const damageInfo: DamageInfo = {
      amount: hitbox.damage,
      isKnockdown: hitbox.isKnockdown,
      knockback: hitbox.knockback
    };

    target.takeDamage(damageInfo.amount);
    
    // Get player index for combo tracking and damage event
    const playerIndex = hitbox.owner.getData('playerIndex');
    
    // Emit combo hit event if this is a player hitting an enemy or boss
    if (playerIndex !== undefined && playerIndex >= 0) {
      // Check if target is an enemy or boss (not a player)
      const isEnemy = target.sprite.getData('isEnemy');
      const isBoss = target.sprite.getData('isBoss');
      if (isEnemy || isBoss) {
        this.scene.events.emit('comboHit', playerIndex);
      }
    }
    
    // Emit damage event for visual effects
    const isHeavy = damageInfo.amount >= GameConfig.HEAVY_HIT_THRESHOLD;
    const isKnockdown = damageInfo.isKnockdown;
    
    // Emit hit stop event based on hit type
    if (isKnockdown) {
      this.scene.events.emit('hitStop', 'knockdown');
    } else if (isHeavy) {
      this.scene.events.emit('hitStop', 'heavy');
    } else if (damageInfo.amount >= 15) {
      this.scene.events.emit('hitStop', 'medium');
    } else {
      this.scene.events.emit('hitStop', 'light');
    }
    
    this.scene.events.emit('entityDamaged', {
      entity: target,
      damage: damageInfo.amount,
      x: target.sprite.x,
      y: target.sprite.y,
      isHeavy: isHeavy,
      isKnockdown: isKnockdown,
      playerIndex: playerIndex !== undefined ? playerIndex : undefined
    });

    // Apply knockback with improved curves
    if (damageInfo.knockback) {
      // Check if sprite and body exist and are active
      if (!target.sprite || !target.sprite.active || !target.sprite.body) {
        return; // Entity is destroyed or has no physics body
      }
      
      const body = target.sprite.body as Phaser.Physics.Arcade.Body;
      if (!body) {
        return; // Body is null/undefined
      }
      
      const facingRight = !hitbox.owner.flipX;
      const knockbackX = facingRight ? damageInfo.knockback.x : -damageInfo.knockback.x;
      
      // Enhanced knockback with better curves using easing functions
      // Start with full velocity, then apply smooth deceleration
      const knockbackDuration = damageInfo.isKnockdown ? 500 : 250;
      const startVelX = knockbackX;
      const startVelY = damageInfo.knockback.y || 0;
      
      // Apply initial velocity
      body.setVelocityX(startVelX);
      if (startVelY !== 0) {
        body.setVelocityY(startVelY);
      }
      
      // Create smooth knockback curve using tween with easing
      const knockbackData = { velocityX: startVelX, velocityY: startVelY };
      const scene = (target.sprite.scene as Phaser.Scene);
      
      // Use Power2 easing for smooth deceleration (ease-out)
      scene.tweens.add({
        targets: knockbackData,
        velocityX: 0,
        velocityY: 0,
        duration: knockbackDuration,
        ease: 'Power2.easeOut', // Smooth deceleration curve
        onUpdate: () => {
          if (target.sprite && target.sprite.active && target.sprite.body && damageInfo.knockback) {
            const body = target.sprite.body as Phaser.Physics.Arcade.Body;
            body.setVelocityX(knockbackData.velocityX);
            if (damageInfo.knockback.y !== 0) {
              body.setVelocityY(knockbackData.velocityY);
            }
          }
        },
        onComplete: () => {
          // Ensure velocity is zero at end
          if (target.sprite && target.sprite.active && target.sprite.body && damageInfo.knockback) {
            const body = target.sprite.body as Phaser.Physics.Arcade.Body;
            body.setVelocityX(0);
            if (damageInfo.knockback.y !== 0) {
              body.setVelocityY(0);
            }
          }
        }
      });
      
    }

    // BaseCharacter handles knockdown in its own takeDamage() → onKnockdown() path.
    // Enemies and bosses extend BaseEntity (not BaseCharacter) so they have no
    // onKnockdown() — apply the state and schedule a get-up here instead.
    if (damageInfo.isKnockdown && !(target instanceof BaseCharacter)) {
      target.setState('knockedDown');
      const scene = target.sprite.scene as Phaser.Scene;
      scene.time.delayedCall(2000, () => {
        if (target.isAlive() && target.sprite && target.sprite.active) {
          target.setState('idle');
        }
      });
    }
  }

  /**
   * Clean up inactive hitboxes
   */
  private cleanupHitboxes() {
    const toRemove: Hitbox[] = [];
    
    this.activeHitboxes.forEach(hitbox => {
      if (!hitbox.active) {
        toRemove.push(hitbox);
        this.hitTargets.delete(hitbox);
      }
    });

    toRemove.forEach(hitbox => this.activeHitboxes.delete(hitbox));
  }

  /**
   * Clear all hitboxes
   */
  clear() {
    this.activeHitboxes.forEach(hitbox => hitbox.deactivate());
    this.activeHitboxes.clear();
    this.hitTargets.clear();
    this.spatialGrid.clear();
  }

  /**
   * Update world bounds for spatial grid (call when room size changes)
   */
  setWorldBounds(bounds: Phaser.Geom.Rectangle): void {
    this.spatialGrid.setWorldBounds(bounds);
  }

  /**
   * Get spatial grid statistics for debugging
   */
  getSpatialGridStats() {
    return this.spatialGrid.getStats();
  }
}

