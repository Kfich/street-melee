/**
 * Core game types
 */
import { CharacterType } from '../game/types/CharacterType';

export type GameState = 'menu' | 'characterSelect' | 'playing' | 'paused' | 'gameOver';

export type PlayerState = 'idle' | 'walking' | 'jumping' | 'attacking' | 'grabbed' | 'grabbing' | 'throwing' | 'hit' | 'knockedDown' | 'hitReaction' | 'landing';

export interface PlayerInput {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  jump: boolean;
  attack: boolean;
  special: boolean;
}

export interface GameSceneData {
  player1Character?: CharacterType;
  player2Character?: CharacterType;
  isMultiplayer?: boolean;
  roomId?: string;
}

export interface DamageInfo {
  amount: number;
  isKnockdown: boolean;
  knockback?: { x: number; y: number };
}

