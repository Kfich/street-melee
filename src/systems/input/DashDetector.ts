import { GameConfig } from '../../config/GameConfig';

/**
 * Detects double-tap (dash) input
 */
export class DashDetector {
  private lastPressTime: number = 0;
  private lastDirection: 'left' | 'right' | null = null;

  /**
   * Check if a dash was performed
   * @param left - Left key is pressed
   * @param right - Right key is pressed
   * @returns true if dash detected
   */
  checkDash(left: boolean, right: boolean): boolean {
    const now = Date.now();
    let direction: 'left' | 'right' | null = null;

    if (left) direction = 'left';
    if (right) direction = 'right';

    if (!direction) {
      this.lastPressTime = 0;
      this.lastDirection = null;
      return false;
    }

    // Check if same direction pressed within time window
    if (direction === this.lastDirection && 
        (now - this.lastPressTime) < GameConfig.DASH_DOUBLE_TAP_TIME) {
      this.lastPressTime = 0;
      this.lastDirection = null;
      return true;
    }

    // Update state
    this.lastPressTime = now;
    this.lastDirection = direction;
    return false;
  }

  reset() {
    this.lastPressTime = 0;
    this.lastDirection = null;
  }
}

