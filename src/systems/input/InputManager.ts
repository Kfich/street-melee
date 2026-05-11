import Phaser from 'phaser';
import { InputConfig, PlayerInputKeys } from '../../config/InputConfig';
import { PlayerInput } from '../../types/GameTypes';
import { globalTouchState } from './TouchInputState';
import { getGamepadManager } from './GamepadManager';

/**
 * Manages input for all players
 */
export class InputManager {
  // @ts-ignore - Stored for potential future use
  private _scene: Phaser.Scene;
  private keyboard?: Phaser.Input.Keyboard.KeyboardPlugin;
  private playerKeys: Map<number, Map<string, Phaser.Input.Keyboard.Key>> = new Map();

  constructor(scene: Phaser.Scene) {
    this._scene = scene;
    this.keyboard = scene.input.keyboard || undefined;
    this.initializeKeys();
  }

  private initializeKeys() {
    // Player 1 keys
    const player1Keys = new Map<string, Phaser.Input.Keyboard.Key>();
    if (this.keyboard) {
      player1Keys.set('left', this.keyboard.addKey(InputConfig.PLAYER_1.left));
      player1Keys.set('right', this.keyboard.addKey(InputConfig.PLAYER_1.right));
      player1Keys.set('up', this.keyboard.addKey(InputConfig.PLAYER_1.up));
      player1Keys.set('down', this.keyboard.addKey(InputConfig.PLAYER_1.down));
      player1Keys.set('jump', this.keyboard.addKey(InputConfig.PLAYER_1.jump));
      player1Keys.set('attack', this.keyboard.addKey(InputConfig.PLAYER_1.attack));
      player1Keys.set('special', this.keyboard.addKey(InputConfig.PLAYER_1.special));
    }
    this.playerKeys.set(0, player1Keys);

    // Player 2 keys
    const player2Keys = new Map<string, Phaser.Input.Keyboard.Key>();
    if (this.keyboard) {
      player2Keys.set('left', this.keyboard.addKey(InputConfig.PLAYER_2.left));
      player2Keys.set('right', this.keyboard.addKey(InputConfig.PLAYER_2.right));
      player2Keys.set('up', this.keyboard.addKey(InputConfig.PLAYER_2.up));
      player2Keys.set('down', this.keyboard.addKey(InputConfig.PLAYER_2.down));
      player2Keys.set('jump', this.keyboard.addKey(InputConfig.PLAYER_2.jump));
      player2Keys.set('attack', this.keyboard.addKey(InputConfig.PLAYER_2.attack));
      player2Keys.set('special', this.keyboard.addKey(InputConfig.PLAYER_2.special));
    }
    this.playerKeys.set(1, player2Keys);
  }

  /**
   * Get current input state for a player.
   * Merges keyboard, mobile touch (P1 only), and gamepad inputs — any
   * active source can trigger an action.
   */
  getPlayerInput(playerIndex: number): PlayerInput {
    const keys = this.playerKeys.get(playerIndex);
    const kb: PlayerInput = keys ? {
      left:    keys.get('left')?.isDown    || false,
      right:   keys.get('right')?.isDown   || false,
      up:      keys.get('up')?.isDown      || false,
      down:    keys.get('down')?.isDown    || false,
      jump:    keys.get('jump')?.isDown    || false,
      attack:  keys.get('attack')?.isDown  || false,
      special: keys.get('special')?.isDown || false,
    } : this.emptyInput();

    const gp = getGamepadManager().getPlayerInput(playerIndex);

    if (playerIndex === 0) {
      return {
        left:    kb.left    || globalTouchState.left    || gp.left,
        right:   kb.right   || globalTouchState.right   || gp.right,
        up:      kb.up      || globalTouchState.up      || gp.up,
        down:    kb.down    || globalTouchState.down    || gp.down,
        jump:    kb.jump    || globalTouchState.jump    || gp.jump,
        attack:  kb.attack  || globalTouchState.attack  || gp.attack,
        special: kb.special || globalTouchState.special || gp.special,
      };
    }

    return {
      left:    kb.left    || gp.left,
      right:   kb.right   || gp.right,
      up:      kb.up      || gp.up,
      down:    kb.down    || gp.down,
      jump:    kb.jump    || gp.jump,
      attack:  kb.attack  || gp.attack,
      special: kb.special || gp.special,
    };
  }

  /**
   * Check if a specific key was just pressed (not held)
   */
  wasKeyJustPressed(playerIndex: number, key: keyof PlayerInputKeys): boolean {
    const keys = this.playerKeys.get(playerIndex);
    if (!keys) return false;
    
    const phaserKey = keys.get(key);
    return phaserKey ? Phaser.Input.Keyboard.JustDown(phaserKey) : false;
  }

  private emptyInput(): PlayerInput {
    return {
      left: false,
      right: false,
      up: false,
      down: false,
      jump: false,
      attack: false,
      special: false,
    };
  }

  /**
   * Clean up
   */
  destroy() {
    this.playerKeys.forEach(keys => {
      keys.forEach(key => key.destroy());
    });
    this.playerKeys.clear();
  }
}

