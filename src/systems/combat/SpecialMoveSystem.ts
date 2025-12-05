import Phaser from 'phaser';
import { CharacterType } from '../../game/types/CharacterType';
import { Hitbox } from './Hitbox';

/**
 * Special move definition
 */
export interface SpecialMove {
  name: string;
  damage: number;
  isKnockdown: boolean;
  duration: number;
  hitbox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  knockback: { x: number; y: number };
  createHitbox: (owner: Phaser.Physics.Arcade.Sprite, facingRight: boolean) => Hitbox;
}

/**
 * Special move system for character special moves
 */
export class SpecialMoveSystem {
  private scene: Phaser.Scene;
  private specialMoves: Map<CharacterType, {
    forward: SpecialMove; // → + A
    neutral: SpecialMove; // A
  }> = new Map();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.initializeSpecialMoves();
  }

  /**
   * Initialize special moves for each character
   */
  private initializeSpecialMoves() {
    // Axel's special moves
    this.specialMoves.set('axel', {
      forward: {
        name: 'Dragon Smash',
        damage: 30,
        isKnockdown: true,
        duration: 400,
        hitbox: { x: 30, y: -10, width: 50, height: 50 },
        knockback: { x: 250, y: -50 },
        createHitbox: (owner, facingRight) => {
          const offsetX = facingRight ? 30 : -30;
          return new Hitbox(owner, offsetX, -10, 50, 50, 30, { x: 250, y: -50 }, true);
        }
      },
      neutral: {
        name: 'Tornado Kick',
        damage: 25,
        isKnockdown: false,
        duration: 500,
        hitbox: { x: 0, y: -10, width: 60, height: 50 },
        knockback: { x: 150, y: 0 },
        createHitbox: (owner, facingRight) => {
          return new Hitbox(owner, 0, -10, 60, 50, 25, { x: 150, y: 0 }, false);
        }
      }
    });

    // Blaze's special moves
    this.specialMoves.set('blaze', {
      forward: {
        name: 'Wave Motion',
        damage: 28,
        isKnockdown: true,
        duration: 450,
        hitbox: { x: 40, y: -10, width: 60, height: 40 },
        knockback: { x: 200, y: 0 },
        createHitbox: (owner, facingRight) => {
          const offsetX = facingRight ? 40 : -40;
          return new Hitbox(owner, offsetX, -10, 60, 40, 28, { x: 200, y: 0 }, true);
        }
      },
      neutral: {
        name: 'Windmill Kick',
        damage: 22,
        isKnockdown: false,
        duration: 500,
        hitbox: { x: 0, y: -10, width: 55, height: 50 },
        knockback: { x: 120, y: 0 },
        createHitbox: (owner, facingRight) => {
          return new Hitbox(owner, 0, -10, 55, 50, 22, { x: 120, y: 0 }, false);
        }
      }
    });

    // Max's special moves
    this.specialMoves.set('max', {
      forward: {
        name: 'Shoulder Tackle',
        damage: 35,
        isKnockdown: true,
        duration: 350,
        hitbox: { x: 35, y: -10, width: 55, height: 45 },
        knockback: { x: 300, y: 0 },
        createHitbox: (owner, facingRight) => {
          const offsetX = facingRight ? 35 : -35;
          return new Hitbox(owner, offsetX, -10, 55, 45, 35, { x: 300, y: 0 }, true);
        }
      },
      neutral: {
        name: 'Double Lariat',
        damage: 30,
        isKnockdown: true,
        duration: 400,
        hitbox: { x: 0, y: -10, width: 65, height: 50 },
        knockback: { x: 200, y: -30 },
        createHitbox: (owner, facingRight) => {
          return new Hitbox(owner, 0, -10, 65, 50, 30, { x: 200, y: -30 }, true);
        }
      }
    });

    // Sammy's special moves
    this.specialMoves.set('sammy', {
      forward: {
        name: 'Corkscrew Kick',
        damage: 20,
        isKnockdown: false,
        duration: 400,
        hitbox: { x: 25, y: -15, width: 45, height: 55 },
        knockback: { x: 180, y: -40 },
        createHitbox: (owner, facingRight) => {
          const offsetX = facingRight ? 25 : -25;
          return new Hitbox(owner, offsetX, -15, 45, 55, 20, { x: 180, y: -40 }, false);
        }
      },
      neutral: {
        name: 'Double Spin Kick',
        damage: 18,
        isKnockdown: false,
        duration: 450,
        hitbox: { x: 0, y: -10, width: 50, height: 50 },
        knockback: { x: 100, y: 0 },
        createHitbox: (owner, facingRight) => {
          return new Hitbox(owner, 0, -10, 50, 50, 18, { x: 100, y: 0 }, false);
        }
      }
    });
  }

  /**
   * Get special move for a character
   */
  getSpecialMove(characterType: CharacterType, isForward: boolean): SpecialMove | null {
    const moves = this.specialMoves.get(characterType);
    if (!moves) return null;

    return isForward ? moves.forward : moves.neutral;
  }

  /**
   * Create hitbox for a special move
   */
  createSpecialMoveHitbox(
    characterType: CharacterType,
    owner: Phaser.Physics.Arcade.Sprite,
    isForward: boolean,
    facingRight: boolean
  ): Hitbox | null {
    const move = this.getSpecialMove(characterType, isForward);
    if (!move) return null;

    return move.createHitbox(owner, facingRight);
  }
}

