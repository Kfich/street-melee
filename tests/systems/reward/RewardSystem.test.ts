import { describe, it, expect, beforeEach } from 'vitest';
import { RewardSystem } from '../../../src/systems/reward/RewardSystem';

describe('RewardSystem', () => {
  let mockScene: any;
  let rewardSystem: RewardSystem;

  beforeEach(() => {
    mockScene = new (global.Phaser as any).Scene();
    rewardSystem = new RewardSystem(mockScene);
  });

  describe('getRewardValue', () => {
    it('returns config for apple', () => {
      const r = rewardSystem.getRewardValue('apple');
      expect(r?.points).toBe(100);
      expect(r?.health).toBe(20);
      expect(r?.rarity).toBe('common');
    });

    it('returns config for chicken', () => {
      const r = rewardSystem.getRewardValue('chicken');
      expect(r?.health).toBe(50);
      expect(r?.rarity).toBe('uncommon');
    });

    it('returns config for oneUp with lives', () => {
      const r = rewardSystem.getRewardValue('oneUp');
      expect(r?.lives).toBe(1);
      expect(r?.rarity).toBe('epic');
    });

    it('returns config for powerUp with powerBoost', () => {
      const r = rewardSystem.getRewardValue('powerUp');
      expect(r?.powerBoost?.multiplier).toBe(1.5);
    });

    it('returns undefined for unknown type', () => {
      expect(rewardSystem.getRewardValue('unknown' as any)).toBeUndefined();
    });
  });

  describe('getRewardDisplay', () => {
    it('returns health display for apple', () => {
      const d = rewardSystem.getRewardDisplay('apple');
      expect(d?.type).toBe('health');
      expect(d?.text).toBe('+20 HP');
    });

    it('returns points display for moneyBag', () => {
      const d = rewardSystem.getRewardDisplay('moneyBag');
      expect(d?.type).toBe('points');
      expect(d?.text).toBe('+500');
    });

    it('returns lives display for oneUp', () => {
      const d = rewardSystem.getRewardDisplay('oneUp');
      expect(d?.type).toBe('lives');
      expect(d?.text).toBe('+1 LIFE');
    });

    it('returns power display for powerUp', () => {
      const d = rewardSystem.getRewardDisplay('powerUp');
      expect(d?.type).toBe('power');
      expect(d?.text).toBe('+50% DMG');
    });

    it('returns null for unknown type', () => {
      expect(rewardSystem.getRewardDisplay('unknown' as any)).toBeNull();
    });

    it('assigns correct rarity colors', () => {
      expect(rewardSystem.getRewardDisplay('apple')?.color).toBe(0xffffff);  // common → white
      expect(rewardSystem.getRewardDisplay('oneUp')?.color).toBe(0xff00ff);  // epic → magenta
      expect(rewardSystem.getRewardDisplay('goldBar')?.color).toBe(0x0088ff); // rare → blue
    });
  });

  describe('processCollection', () => {
    it('returns correct reward data for apple', () => {
      const result = rewardSystem.processCollection('apple');
      expect(result.points).toBe(100);
      expect(result.health).toBe(20);
      expect(result.display).not.toBeNull();
    });

    it('returns 0 points and null display for unknown type', () => {
      const result = rewardSystem.processCollection('unknown' as any);
      expect(result.points).toBe(0);
      expect(result.display).toBeNull();
    });

    it('accumulates lifetime stats across calls', () => {
      rewardSystem.processCollection('apple');
      rewardSystem.processCollection('apple');
      const stats = rewardSystem.getStatistics();
      expect(stats.totalPoints).toBe(200);
      expect(stats.totalHealthRestored).toBe(40);
    });

    it('tracks lives gained', () => {
      rewardSystem.processCollection('oneUp');
      expect(rewardSystem.getStatistics().totalLivesGained).toBe(1);
    });
  });

  describe('getStatistics', () => {
    it('starts with zeroed stats', () => {
      const s = rewardSystem.getStatistics();
      expect(s.totalItems).toBe(0);
      expect(s.totalPoints).toBe(0);
      expect(s.totalHealthRestored).toBe(0);
      expect(s.totalLivesGained).toBe(0);
    });

    it('counts collected items by type', () => {
      rewardSystem.processCollection('apple');
      rewardSystem.processCollection('apple');
      rewardSystem.processCollection('moneyBag');
      const s = rewardSystem.getStatistics();
      expect(s.totalItems).toBe(3);
      expect(s.byType.get('apple')).toBe(2);
      expect(s.byType.get('moneyBag')).toBe(1);
    });
  });

  describe('resetStatistics', () => {
    it('resets all counters to zero', () => {
      rewardSystem.processCollection('apple');
      rewardSystem.resetStatistics();
      const s = rewardSystem.getStatistics();
      expect(s.totalItems).toBe(0);
      expect(s.totalPoints).toBe(0);
    });
  });

  describe('getRarityColor', () => {
    it('maps rarity to correct hex colors', () => {
      expect(rewardSystem.getRarityColor('apple')).toBe(0xffffff);     // common
      expect(rewardSystem.getRarityColor('moneyBag')).toBe(0x00ff00);  // uncommon
      expect(rewardSystem.getRarityColor('goldBar')).toBe(0x0088ff);   // rare
      expect(rewardSystem.getRarityColor('oneUp')).toBe(0xff00ff);     // epic
    });
  });

  describe('getRarityName', () => {
    it('returns rarity name for known types', () => {
      expect(rewardSystem.getRarityName('apple')).toBe('common');
      expect(rewardSystem.getRarityName('goldBar')).toBe('rare');
      expect(rewardSystem.getRarityName('oneUp')).toBe('epic');
    });

    it('returns "common" for unknown type', () => {
      expect(rewardSystem.getRarityName('unknown' as any)).toBe('common');
    });
  });
});
