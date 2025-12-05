import { describe, it, expect } from 'vitest';
import { CHARACTER_STATS, CharacterType } from '../../../src/game/types/CharacterType';

describe('CharacterType', () => {
  describe('Character Stats', () => {
    it('should have stats for all characters', () => {
      const characters: CharacterType[] = ['axel', 'blaze', 'max', 'sammy'];
      
      characters.forEach(char => {
        const stats = CHARACTER_STATS[char];
        expect(stats).toBeDefined();
        expect(stats.power).toBeGreaterThanOrEqual(1);
        expect(stats.power).toBeLessThanOrEqual(3);
        expect(stats.technique).toBeGreaterThanOrEqual(1);
        expect(stats.technique).toBeLessThanOrEqual(3);
        expect(stats.speed).toBeGreaterThanOrEqual(1);
        expect(stats.speed).toBeLessThanOrEqual(3);
        expect(stats.jump).toBeGreaterThanOrEqual(1);
        expect(stats.jump).toBeLessThanOrEqual(3);
        expect(stats.stamina).toBeGreaterThanOrEqual(1);
        expect(stats.stamina).toBeLessThanOrEqual(3);
      });
    });

    it('should have unique stat distributions', () => {
      const axelStats = CHARACTER_STATS.axel;
      const blazeStats = CHARACTER_STATS.blaze;
      const maxStats = CHARACTER_STATS.max;
      const sammyStats = CHARACTER_STATS.sammy;

      // Verify character-specific stats
      expect(maxStats.power).toBe(3); // Max has highest power
      expect(sammyStats.speed).toBe(3); // Sammy has highest speed
      expect(sammyStats.jump).toBe(3); // Sammy has highest jump
      expect(maxStats.stamina).toBe(3); // Max has highest stamina
      expect(axelStats.technique).toBe(3); // Axel has highest technique
    });
  });
});

