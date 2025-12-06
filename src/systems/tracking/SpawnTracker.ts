import Phaser from 'phaser';
import { WeaponType } from '../../entities/weapons/Weapon';
import { ItemType } from '../../entities/items/Item';

/**
 * Spawn statistics for a scene/room
 */
export interface SceneSpawnStats {
  sceneId: string;
  weapons: {
    total: number;
    active: number;
    byType: Map<WeaponType, number>;
    spawned: number; // Total spawned in this scene
    collected: number; // Total collected in this scene
  };
  items: {
    total: number;
    active: number;
    byType: Map<ItemType, number>;
    spawned: number; // Total spawned in this scene
    collected: number; // Total collected in this scene
  };
}

/**
 * Unified spawn tracker for weapons and items
 */
export class SpawnTracker {
  private scene: Phaser.Scene;
  private currentSceneId: string = 'unknown';
  private sceneStats: Map<string, SceneSpawnStats> = new Map();
  private weaponSpawnCount: number = 0;
  private weaponCollectionCount: number = 0;
  private itemSpawnCount: number = 0;
  private itemCollectionCount: number = 0;
  private weaponTypeCounts: Map<WeaponType, number> = new Map();
  private itemTypeCounts: Map<ItemType, number> = new Map();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.initializeCounters();
    this.setupEventListeners();
  }

  /**
   * Initialize counters for all types
   */
  private initializeCounters(): void {
    const weaponTypes: WeaponType[] = ['pipe', 'knife', 'bottle', 'bat'];
    const itemTypes: ItemType[] = ['apple', 'chicken', 'moneyBag', 'goldBar', 'oneUp', 'powerUp'];
    
    weaponTypes.forEach(type => {
      this.weaponTypeCounts.set(type, 0);
    });
    
    itemTypes.forEach(type => {
      this.itemTypeCounts.set(type, 0);
    });
  }

  /**
   * Setup event listeners for spawn tracking
   */
  private setupEventListeners(): void {
    // Track weapon spawns
    this.scene.events.on('weaponSpawned', (weapon: any) => {
      this.trackWeaponSpawn(weapon);
    });

    // Track item spawns
    this.scene.events.on('itemSpawned', (item: any) => {
      this.trackItemSpawn(item);
    });

    // Track item collections
    this.scene.events.on('itemCollected', () => {
      this.itemCollectionCount++;
      this.updateCurrentSceneStats();
    });

    // Track weapon pickups (when player picks up weapon)
    this.scene.events.on('weaponPickedUp', () => {
      this.weaponCollectionCount++;
      this.updateCurrentSceneStats();
    });
  }

  /**
   * Track weapon spawn
   */
  trackWeaponSpawn(weapon: any): void {
    this.weaponSpawnCount++;
    
    if (weapon && weapon.getWeaponType) {
      const weaponType = weapon.getWeaponType();
      const currentCount = this.weaponTypeCounts.get(weaponType) || 0;
      this.weaponTypeCounts.set(weaponType, currentCount + 1);
    }
    
    this.updateCurrentSceneStats();
  }

  /**
   * Track item spawn
   */
  trackItemSpawn(item: any): void {
    this.itemSpawnCount++;
    
    if (item && item.getItemType) {
      const itemType = item.getItemType();
      const currentCount = this.itemTypeCounts.get(itemType) || 0;
      this.itemTypeCounts.set(itemType, currentCount + 1);
    }
    
    this.updateCurrentSceneStats();
  }

  /**
   * Set current scene/room ID
   */
  setSceneId(sceneId: string): void {
    // Save current scene stats before switching
    if (this.currentSceneId !== 'unknown') {
      this.saveSceneStats();
    }
    
    // Load or create new scene stats
    this.currentSceneId = sceneId;
    if (!this.sceneStats.has(sceneId)) {
      this.createSceneStats(sceneId);
    }
    
    // Reset counters for new scene
    this.resetCounters();
  }

  /**
   * Create new scene stats
   */
  private createSceneStats(sceneId: string): void {
    const stats: SceneSpawnStats = {
      sceneId,
      weapons: {
        total: 0,
        active: 0,
        byType: new Map(),
        spawned: 0,
        collected: 0
      },
      items: {
        total: 0,
        active: 0,
        byType: new Map(),
        spawned: 0,
        collected: 0
      }
    };
    
    this.sceneStats.set(sceneId, stats);
  }

  /**
   * Update current scene statistics
   */
  updateCurrentSceneStats(): void {
    const stats = this.sceneStats.get(this.currentSceneId);
    if (!stats) return;

    // Update weapon stats
    stats.weapons.spawned = this.weaponSpawnCount;
    stats.weapons.collected = this.weaponCollectionCount;
    stats.weapons.byType = new Map(this.weaponTypeCounts);

    // Update item stats
    stats.items.spawned = this.itemSpawnCount;
    stats.items.collected = this.itemCollectionCount;
    stats.items.byType = new Map(this.itemTypeCounts);
  }

  /**
   * Update active counts from managers
   */
  updateActiveCounts(activeWeapons: number, activeItems: number): void {
    const stats = this.sceneStats.get(this.currentSceneId);
    if (!stats) return;

    stats.weapons.active = activeWeapons;
    stats.weapons.total = activeWeapons;
    stats.items.active = activeItems;
    stats.items.total = activeItems;
  }

  /**
   * Save current scene stats
   */
  private saveSceneStats(): void {
    this.updateCurrentSceneStats();
  }

  /**
   * Reset counters for new scene
   */
  private resetCounters(): void {
    this.weaponSpawnCount = 0;
    this.weaponCollectionCount = 0;
    this.itemSpawnCount = 0;
    this.itemCollectionCount = 0;
    
    // Reset type counts
    this.weaponTypeCounts.forEach((_, type) => {
      this.weaponTypeCounts.set(type, 0);
    });
    this.itemTypeCounts.forEach((_, type) => {
      this.itemTypeCounts.set(type, 0);
    });
  }

  /**
   * Get current scene statistics
   */
  getCurrentSceneStats(): SceneSpawnStats | undefined {
    this.updateCurrentSceneStats();
    return this.sceneStats.get(this.currentSceneId);
  }

  /**
   * Get statistics for a specific scene
   */
  getSceneStats(sceneId: string): SceneSpawnStats | undefined {
    return this.sceneStats.get(sceneId);
  }

  /**
   * Get all scene statistics
   */
  getAllSceneStats(): Map<string, SceneSpawnStats> {
    this.updateCurrentSceneStats();
    return new Map(this.sceneStats);
  }

  /**
   * Get total weapons spawned across all scenes
   */
  getTotalWeaponsSpawned(): number {
    let total = 0;
    this.sceneStats.forEach(stats => {
      total += stats.weapons.spawned;
    });
    return total;
  }

  /**
   * Get total items spawned across all scenes
   */
  getTotalItemsSpawned(): number {
    let total = 0;
    this.sceneStats.forEach(stats => {
      total += stats.items.spawned;
    });
    return total;
  }

  /**
   * Get total weapons collected across all scenes
   */
  getTotalWeaponsCollected(): number {
    let total = 0;
    this.sceneStats.forEach(stats => {
      total += stats.weapons.collected;
    });
    return total;
  }

  /**
   * Get total items collected across all scenes
   */
  getTotalItemsCollected(): number {
    let total = 0;
    this.sceneStats.forEach(stats => {
      total += stats.items.collected;
    });
    return total;
  }

  /**
   * Reset all statistics
   */
  reset(): void {
    this.sceneStats.clear();
    this.currentSceneId = 'unknown';
    this.resetCounters();
  }

  /**
   * Clean up
   */
  destroy(): void {
    this.scene.events.off('weaponSpawned');
    this.scene.events.off('itemSpawned');
    this.scene.events.off('itemCollected');
    this.scene.events.off('weaponPickedUp');
    this.reset();
  }
}

