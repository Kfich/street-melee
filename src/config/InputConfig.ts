/**
 * Input key mappings for players
 * Uses Phaser key codes
 */
export interface PlayerInputKeys {
  left: string;
  right: string;
  up: string;
  down: string;
  jump: string;
  attack: string;
  special: string;
}

export const InputConfig = {
  PLAYER_1: {
    left: 'LEFT',
    right: 'RIGHT',
    up: 'UP',
    down: 'DOWN',
    jump: 'SPACE',
    attack: 'X',
    special: 'Z',
  } as PlayerInputKeys,

  PLAYER_2: {
    left: 'A',
    right: 'D',
    up: 'W',
    down: 'S',
    jump: 'W',
    attack: 'B',
    special: 'A',
  } as PlayerInputKeys,
} as const;

