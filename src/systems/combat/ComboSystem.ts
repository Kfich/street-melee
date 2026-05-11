import Phaser from 'phaser';
import { CharacterType } from '../../game/types/CharacterType';
import { GameConfig } from '../../config/GameConfig';

/**
 * Combo move definition
 */
export interface ComboMove {
  name: string;
  damage: number;
  isKnockdown: boolean;
  hitbox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

/**
 * Combo chain definition
 */
export interface ComboChain {
  moves: ComboMove[];
  inputWindow: number; // Time window between attacks in ms
}

/**
 * Combo system for managing character combos
 */
export class ComboSystem {
  private scene: Phaser.Scene;
  private comboChains: Map<CharacterType, ComboChain> = new Map();
  private activeCombos: Map<number, {
    characterType: CharacterType;
    currentMove: number;
    lastAttackTime: number;
    chain: ComboChain;
    /** Timestamp until which pressing Special cancels this combo into a special move */
    cancelWindowEnd: number;
  }> = new Map();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.initializeCombos();
  }

  /**
   * Initialize combo chains for each character
   */
  private initializeCombos() {
    // Axel's combo: Jab → Jab → Straight → Mid-Kick → High Kick
    this.comboChains.set('axel', {
      moves: [
        { name: 'Jab', damage: 10, isKnockdown: false, hitbox: { x: 20, y: -10, width: 30, height: 40 } },
        { name: 'Jab', damage: 10, isKnockdown: false, hitbox: { x: 20, y: -10, width: 30, height: 40 } },
        { name: 'Straight', damage: 15, isKnockdown: false, hitbox: { x: 25, y: -10, width: 35, height: 40 } },
        { name: 'Mid-Kick', damage: 18, isKnockdown: false, hitbox: { x: 20, y: -5, width: 30, height: 45 } },
        { name: 'High Kick', damage: 25, isKnockdown: true, hitbox: { x: 20, y: -15, width: 30, height: 50 } },
      ],
      inputWindow: GameConfig.COMBO_WINDOW
    });

    // Blaze's combo: Palm → Palm → Roundhouse Elbow → Sokushūtai
    this.comboChains.set('blaze', {
      moves: [
        { name: 'Palm', damage: 8, isKnockdown: false, hitbox: { x: 20, y: -10, width: 28, height: 40 } },
        { name: 'Palm', damage: 8, isKnockdown: false, hitbox: { x: 20, y: -10, width: 28, height: 40 } },
        { name: 'Roundhouse Elbow', damage: 16, isKnockdown: false, hitbox: { x: 25, y: -10, width: 35, height: 40 } },
        { name: 'Sokushūtai', damage: 22, isKnockdown: true, hitbox: { x: 20, y: -10, width: 40, height: 50 } },
      ],
      inputWindow: GameConfig.COMBO_WINDOW
    });

    // Max's combo: Right Chop → Left Hook → Two-Hand Assault
    this.comboChains.set('max', {
      moves: [
        { name: 'Right Chop', damage: 15, isKnockdown: false, hitbox: { x: 22, y: -10, width: 32, height: 40 } },
        { name: 'Left Hook', damage: 18, isKnockdown: false, hitbox: { x: 25, y: -10, width: 35, height: 40 } },
        { name: 'Two-Hand Assault', damage: 30, isKnockdown: true, hitbox: { x: 20, y: -10, width: 45, height: 50 } },
      ],
      inputWindow: GameConfig.COMBO_WINDOW
    });

    // Sammy's combo: Punch → Punch → Knee Kick → Roller Kick
    this.comboChains.set('sammy', {
      moves: [
        { name: 'Punch', damage: 6, isKnockdown: false, hitbox: { x: 18, y: -10, width: 25, height: 40 } },
        { name: 'Punch', damage: 6, isKnockdown: false, hitbox: { x: 18, y: -10, width: 25, height: 40 } },
        { name: 'Knee Kick', damage: 12, isKnockdown: false, hitbox: { x: 20, y: 0, width: 28, height: 35 } },
        { name: 'Roller Kick', damage: 20, isKnockdown: true, hitbox: { x: 20, y: -10, width: 35, height: 45 } },
      ],
      inputWindow: GameConfig.COMBO_WINDOW
    });
  }

  /**
   * Start a combo for a player
   */
  startCombo(playerIndex: number, characterType: CharacterType): ComboMove | null {
    const chain = this.comboChains.get(characterType);
    if (!chain) return null;

    const now = Date.now();
    this.activeCombos.set(playerIndex, {
      characterType,
      currentMove: 0,
      lastAttackTime: now,
      chain,
      cancelWindowEnd: now + 150,
    });

    return chain.moves[0];
  }

  /**
   * Continue combo if within time window
   */
  continueCombo(playerIndex: number): ComboMove | null {
    const combo = this.activeCombos.get(playerIndex);
    if (!combo) return null;

    const now = Date.now();
    const timeSinceLastAttack = now - combo.lastAttackTime;

    // Check if still within combo window
    if (timeSinceLastAttack > combo.chain.inputWindow) {
      this.activeCombos.delete(playerIndex);
      return null;
    }

    // Move to next combo move
    combo.currentMove++;
    combo.lastAttackTime = now;
    combo.cancelWindowEnd = now + 150;

    // Check if combo is complete
    if (combo.currentMove >= combo.chain.moves.length) {
      this.activeCombos.delete(playerIndex);
      return null; // Combo finished
    }

    return combo.chain.moves[combo.currentMove];
  }

  /**
   * Get current combo move for a player
   */
  getCurrentComboMove(playerIndex: number): ComboMove | null {
    const combo = this.activeCombos.get(playerIndex);
    if (!combo) return null;

    return combo.chain.moves[combo.currentMove];
  }

  /**
   * Returns true if the player is mid-combo and within the cancel window,
   * meaning they can break into a special move right now.
   */
  canCancelToSpecial(playerIndex: number): boolean {
    const combo = this.activeCombos.get(playerIndex);
    if (!combo) return false;
    return Date.now() <= combo.cancelWindowEnd;
  }

  /**
   * Consume the cancel — clears the active combo so the special fires cleanly.
   * Call this immediately before performSpecialMove when a cancel is detected.
   */
  consumeCancel(playerIndex: number): void {
    this.activeCombos.delete(playerIndex);
  }

  /**
   * Reset combo for a player
   */
  resetCombo(playerIndex: number) {
    this.activeCombos.delete(playerIndex);
    // Emit event for UI updates
    if (this.scene && this.scene.events) {
      this.scene.events.emit('comboReset', playerIndex);
    }
  }

  /**
   * Check if player has an active combo
   */
  hasActiveCombo(playerIndex: number): boolean {
    return this.activeCombos.has(playerIndex);
  }
}

