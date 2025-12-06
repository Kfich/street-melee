import Phaser from 'phaser';
import { ItemType } from '../../entities/items/Item';

/**
 * Reward value configuration for items
 */
export interface RewardValue {
  points: number;
  health?: number;
  lives?: number;
  powerBoost?: {
    multiplier: number;
    duration: number; // in milliseconds
  };
  description: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}

/**
 * Reward display data
 */
export interface RewardDisplay {
  value: number;
  type: 'points' | 'health' | 'lives' | 'power';
  text: string;
  color: number;
  icon?: string;
}

/**
 * Reward system for managing item values and rewards
 */
export class RewardSystem {
  private rewardValues: Map<ItemType, RewardValue> = new Map();
  private totalRewardsCollected: Map<ItemType, number> = new Map();
  private lifetimePoints: number = 0;
  private lifetimeHealthRestored: number = 0;
  private lifetimeLivesGained: number = 0;

  constructor(_scene: Phaser.Scene) {
    this.initializeRewardValues();
    this.initializeCounters();
  }

  /**
   * Initialize reward values for all item types
   */
  private initializeRewardValues(): void {
    // Common items
    this.rewardValues.set('apple', {
      points: 100,
      health: 20,
      description: 'Restores 20 HP',
      rarity: 'common'
    });

    this.rewardValues.set('chicken', {
      points: 200,
      health: 50,
      description: 'Restores 50 HP',
      rarity: 'uncommon'
    });

    // Uncommon items
    this.rewardValues.set('moneyBag', {
      points: 500,
      description: 'Worth 500 points',
      rarity: 'uncommon'
    });

    // Rare items
    this.rewardValues.set('goldBar', {
      points: 1000,
      description: 'Worth 1000 points',
      rarity: 'rare'
    });

    this.rewardValues.set('powerUp', {
      points: 300,
      powerBoost: {
        multiplier: 1.5,
        duration: 10000 // 10 seconds
      },
      description: '50% damage boost for 10s',
      rarity: 'rare'
    });

    // Epic items
    this.rewardValues.set('oneUp', {
      points: 0, // Priceless
      lives: 1,
      description: 'Extra Life',
      rarity: 'epic'
    });
  }

  /**
   * Initialize counters for all item types
   */
  private initializeCounters(): void {
    const itemTypes: ItemType[] = ['apple', 'chicken', 'moneyBag', 'goldBar', 'oneUp', 'powerUp'];
    itemTypes.forEach(type => {
      this.totalRewardsCollected.set(type, 0);
    });
  }

  /**
   * Get reward value for an item type
   */
  getRewardValue(itemType: ItemType): RewardValue | undefined {
    return this.rewardValues.get(itemType);
  }

  /**
   * Get reward display information
   */
  getRewardDisplay(itemType: ItemType): RewardDisplay | null {
    const reward = this.rewardValues.get(itemType);
    if (!reward) return null;

    const rarityColors: Record<string, number> = {
      common: 0xffffff,      // White
      uncommon: 0x00ff00,    // Green
      rare: 0x0088ff,        // Blue
      epic: 0xff00ff,        // Magenta
      legendary: 0xffaa00    // Orange/Gold
    };

    // Determine primary reward type
    let type: 'points' | 'health' | 'lives' | 'power' = 'points';
    let value = reward.points;
    let text = `+${reward.points}`;

    if (reward.health) {
      type = 'health';
      value = reward.health;
      text = `+${reward.health} HP`;
    } else if (reward.lives) {
      type = 'lives';
      value = reward.lives;
      text = '+1 LIFE';
    } else if (reward.powerBoost) {
      type = 'power';
      value = reward.powerBoost.multiplier;
      text = `+${Math.floor((reward.powerBoost.multiplier - 1) * 100)}% DMG`;
    }

    return {
      value,
      type,
      text,
      color: rarityColors[reward.rarity] || 0xffffff
    };
  }

  /**
   * Process item collection and return reward data
   */
  processCollection(itemType: ItemType): {
    points: number;
    health?: number;
    lives?: number;
    powerBoost?: { multiplier: number; duration: number };
    display: RewardDisplay | null;
  } {
    const reward = this.rewardValues.get(itemType);
    if (!reward) {
      return { points: 0, display: null };
    }

    // Update counters
    const currentCount = this.totalRewardsCollected.get(itemType) || 0;
    this.totalRewardsCollected.set(itemType, currentCount + 1);

    // Update lifetime stats
    this.lifetimePoints += reward.points;
    if (reward.health) {
      this.lifetimeHealthRestored += reward.health;
    }
    if (reward.lives) {
      this.lifetimeLivesGained += reward.lives;
    }

    return {
      points: reward.points,
      health: reward.health,
      lives: reward.lives,
      powerBoost: reward.powerBoost,
      display: this.getRewardDisplay(itemType)
    };
  }

  /**
   * Get rarity color for an item type
   */
  getRarityColor(itemType: ItemType): number {
    const reward = this.rewardValues.get(itemType);
    if (!reward) return 0xffffff;

    const rarityColors: Record<string, number> = {
      common: 0xffffff,      // White
      uncommon: 0x00ff00,    // Green
      rare: 0x0088ff,        // Blue
      epic: 0xff00ff,        // Magenta
      legendary: 0xffaa00    // Orange/Gold
    };

    return rarityColors[reward.rarity] || 0xffffff;
  }

  /**
   * Get rarity name for an item type
   */
  getRarityName(itemType: ItemType): string {
    const reward = this.rewardValues.get(itemType);
    return reward?.rarity || 'common';
  }

  /**
   * Get total rewards collected statistics
   */
  getStatistics(): {
    totalItems: number;
    totalPoints: number;
    totalHealthRestored: number;
    totalLivesGained: number;
    byType: Map<ItemType, number>;
  } {
    let totalItems = 0;
    this.totalRewardsCollected.forEach(count => {
      totalItems += count;
    });

    return {
      totalItems,
      totalPoints: this.lifetimePoints,
      totalHealthRestored: this.lifetimeHealthRestored,
      totalLivesGained: this.lifetimeLivesGained,
      byType: new Map(this.totalRewardsCollected)
    };
  }

  /**
   * Reset statistics
   */
  resetStatistics(): void {
    this.initializeCounters();
    this.lifetimePoints = 0;
    this.lifetimeHealthRestored = 0;
    this.lifetimeLivesGained = 0;
  }
}

