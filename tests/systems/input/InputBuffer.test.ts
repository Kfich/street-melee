import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { InputBuffer } from '../../../src/systems/input/InputBuffer';

const makeInput = (overrides: Record<string, boolean> = {}) => ({
  left: false, right: false, up: false, down: false,
  jump: false, attack: false, special: false,
  ...overrides,
});

describe('InputBuffer', () => {
  let buffer: InputBuffer;
  let mockNow: number;

  beforeEach(() => {
    mockNow = 10_000;
    vi.spyOn(Date, 'now').mockImplementation(() => mockNow);
    buffer = new InputBuffer();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('bufferInput / getBufferedInput', () => {
    it('stores and returns a buffered input', () => {
      buffer.bufferInput(0, makeInput({ attack: true }));
      const result = buffer.getBufferedInput(0);
      expect(result?.attack).toBe(true);
    });

    it('returns null when no inputs buffered', () => {
      expect(buffer.getBufferedInput(0)).toBeNull();
    });

    it('consumes the input on retrieval', () => {
      buffer.bufferInput(0, makeInput({ jump: true }));
      buffer.getBufferedInput(0);
      expect(buffer.getBufferedInput(0)).toBeNull();
    });

    it('returns null for inputs past the buffer window', () => {
      buffer.bufferInput(0, makeInput({ attack: true }));
      mockNow += 300; // past the 200 ms default window
      expect(buffer.getBufferedInput(0)).toBeNull();
    });

    it('keeps separate buffers per player', () => {
      buffer.bufferInput(0, makeInput({ attack: true }));
      buffer.bufferInput(1, makeInput({ jump: true }));
      expect(buffer.getBufferedInput(0)?.attack).toBe(true);
      expect(buffer.getBufferedInput(1)?.jump).toBe(true);
    });

    it('does not return combo input when canUseComboBuffer is false', () => {
      buffer.bufferInput(0, makeInput({ special: true }), true);
      expect(buffer.getBufferedInput(0, false)).toBeNull();
    });

    it('returns combo input when canUseComboBuffer is true', () => {
      buffer.bufferInput(0, makeInput({ special: true }), true);
      expect(buffer.getBufferedInput(0, true)?.special).toBe(true);
    });
  });

  describe('hasBufferedInput', () => {
    it('returns true when valid input is buffered', () => {
      buffer.bufferInput(0, makeInput({ attack: true }));
      expect(buffer.hasBufferedInput(0)).toBe(true);
    });

    it('returns false when no inputs buffered', () => {
      expect(buffer.hasBufferedInput(0)).toBe(false);
    });

    it('returns false when all inputs are expired', () => {
      buffer.bufferInput(0, makeInput({ attack: true }));
      mockNow += 300;
      expect(buffer.hasBufferedInput(0)).toBe(false);
    });

    it('does not consume the input', () => {
      buffer.bufferInput(0, makeInput({ attack: true }));
      buffer.hasBufferedInput(0);
      expect(buffer.getBufferedInput(0)).not.toBeNull();
    });

    it('respects canUseComboBuffer flag', () => {
      buffer.bufferInput(0, makeInput({ special: true }), true);
      expect(buffer.hasBufferedInput(0, false)).toBe(false);
      expect(buffer.hasBufferedInput(0, true)).toBe(true);
    });
  });

  describe('clear', () => {
    it('clears inputs for one player, leaving others intact', () => {
      buffer.bufferInput(0, makeInput({ attack: true }));
      buffer.bufferInput(1, makeInput({ jump: true }));
      buffer.clear(0);
      expect(buffer.getBufferedInput(0)).toBeNull();
      expect(buffer.getBufferedInput(1)).not.toBeNull();
    });
  });

  describe('clearAll', () => {
    it('clears inputs for all players', () => {
      buffer.bufferInput(0, makeInput({ attack: true }));
      buffer.bufferInput(1, makeInput({ jump: true }));
      buffer.clearAll();
      expect(buffer.getBufferedInput(0)).toBeNull();
      expect(buffer.getBufferedInput(1)).toBeNull();
    });
  });

  describe('update', () => {
    it('removes expired inputs on update', () => {
      buffer.bufferInput(0, makeInput({ attack: true }));
      mockNow += 300;
      buffer.update();
      expect(buffer.hasBufferedInput(0)).toBe(false);
    });

    it('keeps still-valid inputs after update', () => {
      buffer.bufferInput(0, makeInput({ jump: true }));
      mockNow += 50; // well within window
      buffer.update();
      expect(buffer.hasBufferedInput(0)).toBe(true);
    });
  });
});
