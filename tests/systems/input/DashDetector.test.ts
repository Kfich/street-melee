import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DashDetector } from '../../../src/systems/input/DashDetector';
import { GameConfig } from '../../../src/config/GameConfig';

describe('DashDetector', () => {
  let dashDetector: DashDetector;

  beforeEach(() => {
    dashDetector = new DashDetector();
  });

  describe('Dash Detection', () => {
    it('should not detect dash on single press', () => {
      const detected = dashDetector.checkDash(true, false);
      expect(detected).toBe(false);
    });

    it('should detect dash on double-tap within time window', async () => {
      dashDetector.checkDash(true, false);
      
      await new Promise(resolve => setTimeout(resolve, 100)); // Within 200ms window
      const detected = dashDetector.checkDash(true, false);
      expect(detected).toBe(true);
    });

    it('should not detect dash if too much time passes', async () => {
      dashDetector.checkDash(true, false);
      
      await new Promise(resolve => setTimeout(resolve, GameConfig.DASH_DOUBLE_TAP_TIME + 50));
      const detected = dashDetector.checkDash(true, false);
      expect(detected).toBe(false);
    });

    it('should detect dash in both directions', async () => {
      dashDetector.checkDash(false, true);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      const detected = dashDetector.checkDash(false, true);
      expect(detected).toBe(true);
    });

    it('should reset after detecting dash', async () => {
      dashDetector.checkDash(true, false);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      dashDetector.checkDash(true, false); // First dash
      const secondDash = dashDetector.checkDash(true, false); // Immediate second
      expect(secondDash).toBe(false); // Should not detect immediately
    });
  });
});

