import { CharacterType } from '../../game/types/CharacterType';
import { PlayerState } from '../../types/GameTypes';

/**
 * Animation configuration for each character
 */
export interface AnimationConfig {
  key: string;
  frames: string[];
  frameRate: number;
  repeat: number;
}

/**
 * Character animation definitions
 */
export class CharacterAnimationConfig {
  /**
   * Get animation config for a character state
   */
  static getAnimation(
    characterType: CharacterType,
    state: PlayerState,
    facingRight: boolean
  ): AnimationConfig | null {
    const direction = facingRight ? 'right' : 'left';
    
    switch (characterType) {
      case 'axel':
        return this.getDarioAnimation(state, direction);
      case 'blaze':
        return this.getZaraAnimation(state, direction);
      case 'max':
        return this.getRexAnimation(state, direction);
      case 'sammy':
        return this.getAngelaAnimation(state, direction);
      default:
        return null;
    }
  }

  /**
   * Dario animations (for Axel)
   */
  private static getDarioAnimation(state: PlayerState, direction: string): AnimationConfig | null {
    switch (state) {
      case 'idle':
        return {
          key: `axel_idle_${direction}`,
          frames: [`axel_idle_${direction}`],
          frameRate: 1,
          repeat: -1
        };
      
      case 'walking':
        return {
          key: `axel_walk_${direction}`,
          frames: [
            `axel_walk_${direction}_1`,
            `axel_walk_${direction}_2`,
            `axel_walk_${direction}_3`,
            `axel_walk_${direction}_4`
          ],
          frameRate: 8,
          repeat: -1
        };
      
      case 'jumping':
        return {
          key: `axel_jump_${direction}`,
          frames: [`axel_jump_${direction}`],
          frameRate: 1,
          repeat: 0
        };
      
      case 'attacking':
        return {
          key: `axel_attack_${direction}`,
          frames: [
            `axel_attack_${direction}_1`,
            `axel_attack_${direction}_2`,
            `axel_attack_${direction}_3`,
            `axel_attack_${direction}_4`
          ],
          frameRate: 12,
          repeat: 0
        };
      
      default:
        return null;
    }
  }

  /**
   * Zara animations (for Blaze)
   */
  private static getZaraAnimation(state: PlayerState, direction: string): AnimationConfig | null {
    switch (state) {
      case 'idle':
        return {
          key: `blaze_idle_${direction}`,
          frames: [`blaze_idle_${direction}`],
          frameRate: 1,
          repeat: -1
        };
      
      case 'walking':
        return {
          key: `blaze_walk_${direction}`,
          frames: [
            `blaze_walk_${direction}_1`,
            `blaze_walk_${direction}_2`
          ],
          frameRate: 8,
          repeat: -1
        };
      
      case 'attacking':
        return {
          key: `blaze_attack_${direction}`,
          frames: [`blaze_attack_${direction}`],
          frameRate: 12,
          repeat: 0
        };
      
      default:
        return null;
    }
  }

  /**
   * Rex animations (for Max)
   */
  private static getRexAnimation(state: PlayerState, direction: string): AnimationConfig | null {
    switch (state) {
      case 'idle':
        return {
          key: `max_idle_${direction}`,
          frames: [`max_idle_${direction}`],
          frameRate: 1,
          repeat: -1
        };
      
      case 'walking':
        return {
          key: `max_walk_${direction}`,
          frames: [
            `max_walk_${direction}_1`,
            `max_walk_${direction}_2`
          ],
          frameRate: 8,
          repeat: -1
        };
      
      case 'attacking':
        return {
          key: `max_attack_${direction}`,
          frames: [`max_attack_${direction}`],
          frameRate: 12,
          repeat: 0
        };
      
      default:
        return null;
    }
  }

  /**
   * Angela animations (for Sammy)
   */
  private static getAngelaAnimation(state: PlayerState, direction: string): AnimationConfig | null {
    switch (state) {
      case 'idle':
        return {
          key: `sammy_idle_${direction}`,
          frames: [`sammy_idle_${direction}`],
          frameRate: 1,
          repeat: -1
        };
      
      case 'walking':
        return {
          key: `sammy_walk_${direction}`,
          frames: [
            `sammy_walk_${direction}_1`,
            `sammy_walk_${direction}_2`
          ],
          frameRate: 8,
          repeat: -1
        };
      
      case 'attacking':
        return {
          key: `sammy_attack_${direction}`,
          frames: [`sammy_attack_${direction}`],
          frameRate: 12,
          repeat: 0
        };
      
      default:
        return null;
    }
  }
}

