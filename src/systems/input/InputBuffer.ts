import { PlayerInput } from '../../types/GameTypes';
import { GameConfig } from '../../config/GameConfig';

/**
 * Input buffer system for better combo execution
 * Allows inputs to be buffered slightly before the current action ends
 */
export class InputBuffer {
  private bufferedInputs: Map<number, BufferedInput[]> = new Map(); // playerIndex -> inputs
  private bufferWindow: number = GameConfig.INPUT_BUFFER_WINDOW;
  private comboBufferWindow: number = GameConfig.COMBO_INPUT_BUFFER;

  /**
   * Buffer an input for a player
   */
  bufferInput(playerIndex: number, input: PlayerInput, isComboInput: boolean = false): void {
    const window = isComboInput ? this.comboBufferWindow : this.bufferWindow;
    const timestamp = Date.now();
    
    if (!this.bufferedInputs.has(playerIndex)) {
      this.bufferedInputs.set(playerIndex, []);
    }
    
    const inputs = this.bufferedInputs.get(playerIndex)!;
    
    // Add input with timestamp
    inputs.push({
      input: { ...input },
      timestamp: timestamp,
      expiresAt: timestamp + window,
      isComboInput: isComboInput
    });
    
    // Clean up expired inputs
    this.cleanupExpired(playerIndex);
  }

  /**
   * Get and consume a buffered input for a player
   * @param playerIndex - Player index
   * @param canUseComboBuffer - Whether combo buffer can be used
   * @returns Buffered input if available, null otherwise
   */
  getBufferedInput(playerIndex: number, canUseComboBuffer: boolean = true): PlayerInput | null {
    const inputs = this.bufferedInputs.get(playerIndex);
    if (!inputs || inputs.length === 0) {
      return null;
    }
    
    // Find the most recent valid input
    const now = Date.now();
    for (let i = inputs.length - 1; i >= 0; i--) {
      const buffered = inputs[i];
      
      // Check if expired
      if (now > buffered.expiresAt) {
        continue;
      }
      
      // Check if combo buffer is allowed
      if (buffered.isComboInput && !canUseComboBuffer) {
        continue;
      }
      
      // Found valid input, remove it and return
      inputs.splice(i, 1);
      return buffered.input;
    }
    
    return null;
  }

  /**
   * Check if there's a buffered input without consuming it
   */
  hasBufferedInput(playerIndex: number, canUseComboBuffer: boolean = true): boolean {
    const inputs = this.bufferedInputs.get(playerIndex);
    if (!inputs || inputs.length === 0) {
      return false;
    }
    
    const now = Date.now();
    for (let i = inputs.length - 1; i >= 0; i--) {
      const buffered = inputs[i];
      if (now > buffered.expiresAt) {
        continue;
      }
      if (buffered.isComboInput && !canUseComboBuffer) {
        continue;
      }
      return true;
    }
    
    return false;
  }

  /**
   * Clear all buffered inputs for a player
   */
  clear(playerIndex: number): void {
    this.bufferedInputs.delete(playerIndex);
  }

  /**
   * Clear all buffered inputs
   */
  clearAll(): void {
    this.bufferedInputs.clear();
  }

  /**
   * Clean up expired inputs for a player
   */
  private cleanupExpired(playerIndex: number): void {
    const inputs = this.bufferedInputs.get(playerIndex);
    if (!inputs) return;
    
    const now = Date.now();
    const validInputs = inputs.filter(buffered => now <= buffered.expiresAt);
    this.bufferedInputs.set(playerIndex, validInputs);
  }

  /**
   * Update - clean up expired inputs
   */
  update(): void {
    this.bufferedInputs.forEach((_inputs, playerIndex) => {
      this.cleanupExpired(playerIndex);
    });
  }
}

interface BufferedInput {
  input: PlayerInput;
  timestamp: number;
  expiresAt: number;
  isComboInput: boolean;
}

