import Phaser from 'phaser';
import { Hitbox } from './Hitbox';
import { BaseEntity } from '../../entities/base/BaseEntity';
import { DamageInfo } from '../../types/GameTypes';
import { GameConfig } from '../../config/GameConfig';

/**
 * Combat system for handling attacks and damage
 */
export class CombatSystem {
  private scene: Phaser.Scene;
  private activeHitboxes: Set<Hitbox> = new Set();
  private hitTargets: Map<Hitbox, Set<Phaser.Physics.Arcade.Sprite>> = new Map();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
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
   * Update combat system - check for collisions
   */
  update(targets: BaseEntity[]) {
    // Check each active hitbox against all targets
    this.activeHitboxes.forEach(hitbox => {
      if (!hitbox.active) return;

      const hitTargets = this.hitTargets.get(hitbox) || new Set();

      targets.forEach(target => {
        // Skip if already hit by this hitbox
        if (hitTargets.has(target.sprite)) return;
        
        // Skip if hitting self
        if (target.sprite === hitbox.owner) return;

        // Check collision
        if (hitbox.intersects(target.sprite)) {
          this.applyDamage(target, hitbox);
          hitTargets.add(target.sprite);
        }
      });
    });

    // Clean up inactive hitboxes
    this.cleanupHitboxes();
  }

  /**
   * Apply damage from a hitbox to a target
   */
  private applyDamage(target: BaseEntity, hitbox: Hitbox) {
    const damageInfo: DamageInfo = {
      amount: hitbox.damage,
      isKnockdown: hitbox.isKnockdown,
      knockback: hitbox.knockback
    };

    target.takeDamage(damageInfo.amount);
    
    // Emit combo hit event if this is a player hitting an enemy
    const playerIndex = hitbox.owner.getData('playerIndex');
    if (playerIndex !== undefined && playerIndex >= 0) {
      // Check if target is an enemy (not a player)
      const isEnemy = target.sprite.getData('isEnemy');
      if (isEnemy) {
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
      isKnockdown: isKnockdown
    });

    // Apply knockback with improved curves
    if (damageInfo.knockback) {
      const body = target.sprite.body as Phaser.Physics.Arcade.Body;
      const facingRight = !hitbox.owner.flipX;
      const knockbackX = facingRight ? damageInfo.knockback.x : -damageInfo.knockback.x;
      
      // Apply knockback with easing (smooth acceleration/deceleration)
      // Start with full velocity, then apply drag
      body.setVelocityX(knockbackX);
      if (damageInfo.knockback.y !== 0) {
        body.setVelocityY(damageInfo.knockback.y);
      }
      
      // Apply knockback drag for smoother deceleration
      // Use tween to gradually reduce knockback velocity
      const knockbackDuration = damageInfo.isKnockdown ? 400 : 200;
      const startVelX = knockbackX;
      const startVelY = damageInfo.knockback.y || 0;
      
      this.scene.tweens.add({
        targets: { value: 1 },
        value: 0,
        duration: knockbackDuration,
        ease: 'Power2',
        onUpdate: (tween) => {
          const progress = tween.getValue();
          if (progress !== null && progress !== undefined) {
            body.setVelocityX(startVelX * progress);
            if (startVelY !== 0) {
              body.setVelocityY(startVelY * progress);
            }
          }
        }
      });
    }

    // Handle knockdown
    if (damageInfo.isKnockdown) {
      target.setState('knockedDown');
      // Reset state after knockdown duration
      this.scene.time.delayedCall(1000, () => {
        if (target.getState() === 'knockedDown') {
          target.setState('idle');
        }
      });
    }

    // Visual feedback (flash)
    this.flashSprite(target.sprite);
  }

  /**
   * Flash sprite to indicate hit
   */
  private flashSprite(sprite: Phaser.Physics.Arcade.Sprite) {
    sprite.setTint(0xff0000);
    this.scene.tweens.add({
      targets: sprite,
      alpha: 0.5,
      duration: 100,
      yoyo: true,
      onComplete: () => {
        sprite.clearTint();
        sprite.setAlpha(1);
      }
    });
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
  }
}

