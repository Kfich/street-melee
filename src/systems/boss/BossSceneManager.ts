import Phaser from 'phaser';
import { Boss, BossType } from '../../entities/bosses/Boss';
import { SCENE_TO_LEVEL_MAP, SCENE_BOSS_CONFIG } from '../../config/GameScenes';

/**
 * Manages boss spawning and presence based on scene/room configuration
 * This system ensures the correct bosses appear in the correct scenes
 */
export class BossSceneManager {
  private scene: Phaser.Scene;
  private currentBosses: Map<string, Boss> = new Map(); // Map of scene number to boss
  private spawnedScenes: Set<number> = new Set(); // Track which scenes have spawned bosses

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Check if a boss should be present in the current room
   * and spawn it if needed
   */
  checkAndSpawnBoss(levelNumber: number, roomNumber: number): void {
    // Find the scene number for this level/room combination
    const sceneNumber = this.getSceneNumber(levelNumber, roomNumber);
    if (!sceneNumber) {
      console.log(`[BossSceneManager] No scene mapping for level ${levelNumber}, room ${roomNumber}`);
      return; // No scene mapping found
    }

    console.log(`[BossSceneManager] Checking boss for scene ${sceneNumber} (level ${levelNumber}, room ${roomNumber})`);

    // Check if boss already spawned for this scene
    if (this.spawnedScenes.has(sceneNumber)) {
      console.log(`[BossSceneManager] Boss already spawned for scene ${sceneNumber}`);
      return; // Boss already spawned
    }

    // Get boss configuration for this scene
    const bossConfig = SCENE_BOSS_CONFIG[sceneNumber];
    if (!bossConfig) {
      console.log(`[BossSceneManager] No boss config for scene ${sceneNumber}`);
      return; // No boss config for this scene
    }
    
    if (!bossConfig.bossType) {
      console.log(`[BossSceneManager] Scene ${sceneNumber} has no bossType (isCombat: ${bossConfig.isCombat})`);
      return; // No boss for this scene
    }

    // Spawn the boss
    this.spawnBossForScene(sceneNumber, bossConfig);
  }

  /**
   * Get scene number from level and room numbers
   */
  private getSceneNumber(levelNumber: number, roomNumber: number): number | null {
    for (const [sceneNum, sceneMap] of Object.entries(SCENE_TO_LEVEL_MAP)) {
      if (sceneMap.level === levelNumber && sceneMap.room === roomNumber) {
        return parseInt(sceneNum, 10);
      }
    }
    return null;
  }

  /**
   * Spawn a boss for a specific scene
   */
  private spawnBossForScene(sceneNumber: number, bossConfig: typeof SCENE_BOSS_CONFIG[number]): void {
    const bossType = bossConfig.bossType!;
    const sceneMap = SCENE_TO_LEVEL_MAP[sceneNumber];
    
    if (!sceneMap) {
      console.warn(`[BossSceneManager] No scene map found for scene ${sceneNumber}`);
      return;
    }

    // Calculate boss spawn position
    // For room-based system, spawn boss in the center-right area of the room
    const roomWidth = 2000; // Default room width
    const roomHeight = 576; // Default room height
    const spawnX = bossConfig.triggerX || roomWidth * 0.6; // Default to 60% across the room
    const spawnY = roomHeight - 100; // Ground level

    console.log(`[BossSceneManager] Spawning boss ${bossType} in scene ${sceneNumber} (${sceneMap.name}) at (${spawnX}, ${spawnY})`);

    try {
      // Create boss
      const boss = new Boss(this.scene, spawnX, spawnY, bossType as BossType);
      
      // Verify boss was created successfully
      if (!boss || !boss.sprite) {
        console.error(`[BossSceneManager] Failed to create boss ${bossType} for scene ${sceneNumber}`);
        return;
      }
      
      // Override health if specified in config
      if (bossConfig.health) {
        (boss as any).maxHealth = bossConfig.health;
        (boss as any).health = bossConfig.health;
      }

      // Store boss reference
      this.currentBosses.set(sceneNumber.toString(), boss);
      this.spawnedScenes.add(sceneNumber);

      // Set boss data
      boss.sprite.setData('entity', boss);
      boss.sprite.setData('isBoss', true);
      boss.sprite.setData('sceneNumber', sceneNumber);
      boss.sprite.setData('isCombat', bossConfig.isCombat);
      
      // Set depth for proper rendering
      boss.sprite.setDepth(boss.sprite.y);
      
      // Ensure sprite is visible and active
      boss.sprite.setVisible(true);
      boss.sprite.setActive(true);
      boss.sprite.setAlpha(1.0);

      // Emit boss spawned event
      this.scene.events.emit('bossSpawned', boss);
      
      console.log(`[BossSceneManager] Successfully spawned boss ${bossType} for scene ${sceneNumber}. Sprite key: ${boss.sprite.texture.key}, Visible: ${boss.sprite.visible}, Active: ${boss.sprite.active}`);

      // If non-combat boss, make them non-interactive
      if (!bossConfig.isCombat) {
        // Non-combat bosses don't attack or take damage
        boss.sprite.setTint(0xffffff); // Normal appearance
        // They can still be visible but won't engage in combat
      }
    } catch (error) {
      console.error(`[BossSceneManager] Error spawning boss ${bossType} for scene ${sceneNumber}:`, error);
    }
  }

  /**
   * Clean up bosses when leaving a scene
   */
  cleanupBossesForScene(levelNumber: number, roomNumber: number): void {
    const sceneNumber = this.getSceneNumber(levelNumber, roomNumber);
    if (!sceneNumber) {
      return;
    }

    // Remove boss for this scene if it exists
    const bossKey = sceneNumber.toString();
    const boss = this.currentBosses.get(bossKey);
    if (boss) {
      console.log(`[BossSceneManager] Cleaning up boss ${boss.getBossType()} for scene ${sceneNumber}`);
      
      // Emit event to notify GameScene to remove boss from entity manager and arrays
      this.scene.events.emit('bossDestroyed', boss);
      
      if (boss.sprite && boss.sprite.active) {
        boss.sprite.destroy();
      }
      this.currentBosses.delete(bossKey);
      // Don't remove from spawnedScenes - we want to prevent re-spawning if player returns
    } else {
      console.log(`[BossSceneManager] No boss to clean up for scene ${sceneNumber}`);
    }
  }

  /**
   * Get all active bosses
   */
  getActiveBosses(): Boss[] {
    return Array.from(this.currentBosses.values()).filter(boss => 
      boss && boss.sprite && boss.sprite.active
    );
  }

  /**
   * Get boss for a specific scene
   */
  getBossForScene(sceneNumber: number): Boss | null {
    return this.currentBosses.get(sceneNumber.toString()) || null;
  }

  /**
   * Clear all bosses (for level transitions, etc.)
   */
  clearAllBosses(): void {
    this.currentBosses.forEach((boss) => {
      if (boss && boss.sprite && boss.sprite.active) {
        boss.sprite.destroy();
      }
    });
    this.currentBosses.clear();
    this.spawnedScenes.clear();
  }

  /**
   * Update boss manager (called each frame)
   */
  update(): void {
    // Clean up destroyed bosses
    const keysToDelete: string[] = [];
    this.currentBosses.forEach((boss, key) => {
      if (!boss || !boss.sprite || !boss.sprite.active) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => this.currentBosses.delete(key));
  }
}

