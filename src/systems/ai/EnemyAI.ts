import Phaser from 'phaser';
import { Enemy } from '../../entities/enemies/Enemy';
import { Player } from '../../entities/characters/Player';
import { BaseEntity } from '../../entities/base/BaseEntity';
import { EntityManager } from '../../managers/EntityManager';
import { SpatialGrid } from '../collision/SpatialGrid';

/**
 * Enhanced AI system for enemies with spatial awareness
 */
export class EnemyAI {
  private entityManager: EntityManager;
  private spatialGrid?: SpatialGrid;
  private avoidanceRadius: number = 60; // Distance to maintain from other enemies
  private obstacleCheckDistance: number = 50; // Distance to check for obstacles ahead
  private retreatHealthThreshold: number = 0.3; // Retreat when health below 30%
  private groupCoordinationRadius: number = 150; // Radius for group coordination
  private coordinationUpdateCounter: number = 0;
  private coordinationUpdateFrequency: number = 10; // Update every 10 frames

  constructor(entityManager: EntityManager, spatialGrid?: SpatialGrid) {
    this.entityManager = entityManager;
    this.spatialGrid = spatialGrid;
  }

  /**
   * Enhance enemy movement with spatial awareness, group coordination, and retreat behavior
   * This is called after the enemy's basic AI decides on direction
   */
  enhanceMovement(enemy: Enemy, baseVelocityX: number): number {
    if (!enemy || !enemy.sprite || !enemy.sprite.active) return baseVelocityX;

    const body = enemy.sprite.body as Phaser.Physics.Arcade.Body;
    if (!body) return baseVelocityX;

    // Check for retreat behavior (low health)
    const healthRatio = enemy.getHealth() / enemy.getMaxHealth();
    if (healthRatio < this.retreatHealthThreshold) {
      const retreatVelocity = this.calculateRetreat(enemy);
      if (retreatVelocity !== 0) {
        return retreatVelocity;
      }
    }

    // Get nearby entities for spatial awareness
    const nearbyEntities = this.getNearbyEntities(enemy, this.groupCoordinationRadius);
    const nearbyEnemies = nearbyEntities.filter(e => e !== enemy && e.sprite.getData('isEnemy'));

    // Apply group coordination (flanking, surrounding)
    this.coordinationUpdateCounter++;
    if (this.coordinationUpdateCounter >= this.coordinationUpdateFrequency) {
      this.coordinationUpdateCounter = 0;
      const coordinationAdjustment = this.calculateGroupCoordination(enemy, nearbyEnemies);
      baseVelocityX += coordinationAdjustment;
    }

    // Apply separation from nearby enemies (avoid clustering)
    const separation = this.calculateSeparation(enemy, nearbyEnemies);
    let enhancedVelocity = baseVelocityX + separation.x;

    // Check for obstacles ahead and adjust
    const obstacleAvoidance = this.checkObstaclesAhead(enemy, enhancedVelocity);
    enhancedVelocity += obstacleAvoidance;

    // Clamp to max speed
    const stats = (enemy as any).stats;
    const maxSpeed = stats?.speed || 80;
    enhancedVelocity = Phaser.Math.Clamp(enhancedVelocity, -maxSpeed, maxSpeed);

    return enhancedVelocity;
  }

  /**
   * Find best target considering spatial factors (for target selection enhancement)
   */
  findBestTarget(enemy: Enemy): Player | null {
    const players = this.entityManager.getPlayers();
    if (players.length === 0) return null;

    // Get nearby enemies for spatial awareness
    const nearbyEntities = this.getNearbyEntities(enemy);
    const nearbyEnemies = nearbyEntities.filter(e => e !== enemy && e.sprite.getData('isEnemy'));

    let bestTarget: Player | null = null;
    let bestScore = -Infinity;

    for (const player of players) {
      if (!player || !player.sprite || !player.sprite.active) continue;

      const distance = Phaser.Math.Distance.Between(
        enemy.sprite.x,
        enemy.sprite.y,
        player.sprite.x,
        player.sprite.y
      );

      // Score based on distance (closer is better)
      let score = 1000 / (distance + 1);

      // Penalize if target is surrounded by other enemies (avoid clustering)
      const enemiesNearTarget = nearbyEnemies.filter(e => {
        if (!e.sprite) return false;
        const dist = Phaser.Math.Distance.Between(
          player.sprite.x,
          player.sprite.y,
          e.sprite.x,
          e.sprite.y
        );
        return dist < this.avoidanceRadius * 2;
      });

      // Reduce score if many enemies are already near target
      score -= enemiesNearTarget.length * 50;

      // Prefer targets that are isolated (less competition)
      if (enemiesNearTarget.length === 0) {
        score += 100;
      }

      if (score > bestScore) {
        bestScore = score;
        bestTarget = player;
      }
    }

    return bestTarget;
  }

  /**
   * Get entities near the enemy using spatial grid or fallback
   */
  private getNearbyEntities(enemy: Enemy, radius: number = 150): BaseEntity[] {
    if (!enemy.sprite || !enemy.sprite.active) return [];

    // Use spatial grid if available
    if (this.spatialGrid) {
      const bounds = new Phaser.Geom.Rectangle(
        enemy.sprite.x - radius,
        enemy.sprite.y - radius,
        radius * 2,
        radius * 2
      );
      return this.spatialGrid.queryEntities(bounds);
    }

    // Fallback: check all entities
    const allEntities = this.entityManager.getAll();
    const nearby: BaseEntity[] = [];

    for (const entity of allEntities) {
      if (!entity || !entity.sprite || !entity.sprite.active) continue;
      if (entity === enemy) continue;

      const distance = Phaser.Math.Distance.Between(
        enemy.sprite.x,
        enemy.sprite.y,
        entity.sprite.x,
        entity.sprite.y
      );

      if (distance <= radius) {
        nearby.push(entity);
      }
    }

    return nearby;
  }


  /**
   * Calculate separation force from nearby enemies (steering behavior)
   */
  private calculateSeparation(enemy: Enemy, nearbyEnemies: BaseEntity[]): { x: number; y: number } {
    let separationX = 0;
    let separationY = 0;
    let count = 0;

    for (const other of nearbyEnemies) {
      if (!other.sprite || !other.sprite.active) continue;

      const distance = Phaser.Math.Distance.Between(
        enemy.sprite.x,
        enemy.sprite.y,
        other.sprite.x,
        other.sprite.y
      );

      if (distance > 0 && distance < this.avoidanceRadius) {
        // Calculate direction away from other enemy
        const dx = enemy.sprite.x - other.sprite.x;
        const dy = enemy.sprite.y - other.sprite.y;
        const normalizedDistance = distance || 1;

        // Weight by inverse distance (closer = stronger separation)
        const strength = (this.avoidanceRadius - distance) / this.avoidanceRadius;
        separationX += (dx / normalizedDistance) * strength * 30;
        separationY += (dy / normalizedDistance) * strength * 30;
        count++;
      }
    }

    if (count > 0) {
      separationX /= count;
      separationY /= count;
    }

    return { x: separationX, y: separationY };
  }

  /**
   * Check for obstacles ahead and return avoidance force
   */
  private checkObstaclesAhead(enemy: Enemy, desiredVelocityX: number): number {
    if (desiredVelocityX === 0) return 0;

    const body = enemy.sprite.body as Phaser.Physics.Arcade.Body;
    if (!body) return 0;

    // Check if we're hitting a wall
    if (body.blocked.left || body.blocked.right) {
      // Reverse direction if blocked
      return -desiredVelocityX * 0.5;
    }

    // Check for obstacles ahead using raycast (simplified)
    const checkX = enemy.sprite.x + (desiredVelocityX > 0 ? this.obstacleCheckDistance : -this.obstacleCheckDistance);
    const checkY = enemy.sprite.y;

    // Get entities at check position
    const nearby = this.getNearbyEntities(enemy, this.obstacleCheckDistance);
    const obstacles = nearby.filter(e => {
      if (!e.sprite) return false;
      const dist = Math.abs(e.sprite.x - checkX);
      return dist < 30 && Math.abs(e.sprite.y - checkY) < 50;
    });

    // If obstacles ahead, slow down or reverse
    if (obstacles.length > 0) {
      return -desiredVelocityX * 0.3;
    }

    return 0;
  }

  /**
   * Calculate retreat behavior when health is low
   */
  private calculateRetreat(enemy: Enemy): number {
    const players = this.entityManager.getPlayers();
    if (players.length === 0) return 0;

    // Find nearest player to retreat from
    let nearestPlayer: Player | null = null;
    let nearestDistance = Infinity;

    for (const player of players) {
      if (!player || !player.sprite || !player.sprite.active) continue;

      const distance = Phaser.Math.Distance.Between(
        enemy.sprite.x,
        enemy.sprite.y,
        player.sprite.x,
        player.sprite.y
      );

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestPlayer = player;
      }
    }

    if (!nearestPlayer) return 0;

    // Move away from nearest player
    const direction = enemy.sprite.x > nearestPlayer.sprite.x ? 1 : -1;
    const stats = (enemy as any).stats;
    const speed = stats?.speed || 80;
    
    // Retreat at reduced speed (70% of normal)
    return speed * direction * 0.7;
  }

  /**
   * Calculate group coordination (flanking, surrounding players)
   */
  private calculateGroupCoordination(enemy: Enemy, nearbyEnemies: BaseEntity[]): number {
    const players = this.entityManager.getPlayers();
    if (players.length === 0 || nearbyEnemies.length === 0) return 0;

    // Find nearest player
    let nearestPlayer: Player | null = null;
    let nearestDistance = Infinity;

    for (const player of players) {
      if (!player || !player.sprite || !player.sprite.active) continue;

      const distance = Phaser.Math.Distance.Between(
        enemy.sprite.x,
        enemy.sprite.y,
        player.sprite.x,
        player.sprite.y
      );

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestPlayer = player;
      }
    }

    if (!nearestPlayer) return 0;

    // Count enemies on each side of the player
    let enemiesOnLeft = 0;
    let enemiesOnRight = 0;

    nearbyEnemies.forEach(otherEnemy => {
      if (!otherEnemy.sprite) return;
      const enemyX = otherEnemy.sprite.x;
      const playerX = nearestPlayer!.sprite.x;
      
      if (enemyX < playerX) {
        enemiesOnLeft++;
      } else {
        enemiesOnRight++;
      }
    });

    // Determine enemy's position relative to player
    const enemyX = enemy.sprite.x;
    const playerX = nearestPlayer.sprite.x;
    const isOnLeft = enemyX < playerX;

    // Coordinate: if more enemies on one side, try to balance by moving to the other side
    let coordinationAdjustment = 0;
    const stats = (enemy as any).stats;
    const speed = stats?.speed || 80;

    if (isOnLeft && enemiesOnLeft > enemiesOnRight) {
      // Too many on left, move right to flank
      coordinationAdjustment = speed * 0.3;
    } else if (!isOnLeft && enemiesOnRight > enemiesOnLeft) {
      // Too many on right, move left to flank
      coordinationAdjustment = -speed * 0.3;
    } else if (enemiesOnLeft === enemiesOnRight && nearestDistance < 150) {
      // Balanced, try to surround from behind if close
      const playerY = nearestPlayer.sprite.y;
      const enemyY = enemy.sprite.y;
      
      // If enemy is in front, try to move behind
      if (Math.abs(enemyY - playerY) < 30) {
        // Move to opposite side for better positioning
        coordinationAdjustment = isOnLeft ? speed * 0.2 : -speed * 0.2;
      }
    }

    return coordinationAdjustment;
  }

  /**
   * Set spatial grid (for efficient queries)
   */
  setSpatialGrid(grid: SpatialGrid): void {
    this.spatialGrid = grid;
  }
}

