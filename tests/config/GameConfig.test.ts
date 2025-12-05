import { describe, it, expect } from 'vitest';
import { GameConfig } from '../../src/config/GameConfig';

describe('GameConfig', () => {
  describe('Configuration Values', () => {
    it('should have valid display dimensions', () => {
      expect(GameConfig.WIDTH).toBeGreaterThan(0);
      expect(GameConfig.HEIGHT).toBeGreaterThan(0);
    });

    it('should have valid physics values', () => {
      expect(GameConfig.GRAVITY).toBeGreaterThan(0);
      expect(GameConfig.PLAYER_DRAG).toBeGreaterThan(0);
    });

    it('should have valid player stats', () => {
      expect(GameConfig.PLAYER_BASE_SPEED).toBeGreaterThan(0);
      expect(GameConfig.PLAYER_BASE_JUMP).toBeGreaterThan(0);
      expect(GameConfig.PLAYER_MAX_HEALTH).toBeGreaterThan(0);
    });

    it('should have valid timing values', () => {
      expect(GameConfig.DASH_DOUBLE_TAP_TIME).toBeGreaterThan(0);
      expect(GameConfig.COMBO_WINDOW).toBeGreaterThan(0);
      expect(GameConfig.ATTACK_DURATION).toBeGreaterThan(0);
    });
  });
});

