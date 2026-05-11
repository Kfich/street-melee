import { describe, it, expect } from 'vitest';
import {
  detectProfile,
  getButtonName,
  formatBinding,
  DEFAULT_GAMEPAD_MAPPING,
  CONTROLLER_PROFILES,
  ACTION_NAMES,
  ACTION_LABELS,
} from '../../../src/systems/input/GamepadProfiles';

describe('GamepadProfiles', () => {
  describe('detectProfile', () => {
    it('detects PlayStation controller', () => {
      expect(detectProfile('DualShock 4 Controller').type).toBe('playstation');
    });

    it('detects DualSense', () => {
      expect(detectProfile('DualSense Wireless Controller').type).toBe('playstation');
    });

    it('detects Xbox controller', () => {
      expect(detectProfile('Xbox 360 Controller').type).toBe('xbox');
    });

    it('detects Switch Pro controller', () => {
      expect(detectProfile('Nintendo Switch Pro Controller').type).toBe('switch');
    });

    it('falls back to generic for unknown controllers', () => {
      expect(detectProfile('Totally Unknown Gamepad XYZ').type).toBe('generic');
    });

    it('is case-insensitive', () => {
      expect(detectProfile('DUALSHOCK 4').type).toBe('playstation');
      expect(detectProfile('xbox one').type).toBe('xbox');
    });
  });

  describe('getButtonName', () => {
    it('returns PlayStation button names', () => {
      expect(getButtonName(0, 'playstation')).toBe('CROSS');
      expect(getButtonName(1, 'playstation')).toBe('CIRCLE');
      expect(getButtonName(2, 'playstation')).toBe('SQUARE');
      expect(getButtonName(3, 'playstation')).toBe('TRIANGLE');
    });

    it('returns Xbox button names', () => {
      expect(getButtonName(0, 'xbox')).toBe('A');
      expect(getButtonName(1, 'xbox')).toBe('B');
      expect(getButtonName(2, 'xbox')).toBe('X');
      expect(getButtonName(3, 'xbox')).toBe('Y');
    });

    it('returns Switch button names', () => {
      expect(getButtonName(0, 'switch')).toBe('B');
      expect(getButtonName(1, 'switch')).toBe('A');
    });

    it('returns fallback for unknown button index', () => {
      expect(getButtonName(99, 'xbox')).toBe('BTN99');
    });

    it('returns Xbox names for generic controller', () => {
      expect(getButtonName(0, 'generic')).toBe('A');
    });
  });

  describe('formatBinding', () => {
    it('formats a single button', () => {
      expect(formatBinding({ buttons: [0], axes: [] }, 'xbox')).toBe('A');
    });

    it('formats multiple buttons with separator', () => {
      const result = formatBinding({ buttons: [0, 1], axes: [] }, 'xbox');
      expect(result).toContain('A');
      expect(result).toContain('B');
    });

    it('formats a left-stick-left axis binding', () => {
      const binding = { buttons: [], axes: [{ index: 0, threshold: 0.5, direction: -1 as const }] };
      const result = formatBinding(binding, 'xbox');
      expect(result).toContain('LS');
    });

    it('returns "---" for empty binding', () => {
      expect(formatBinding({ buttons: [], axes: [] }, 'xbox')).toBe('---');
    });
  });

  describe('DEFAULT_GAMEPAD_MAPPING', () => {
    it('has bindings for every action', () => {
      ACTION_NAMES.forEach(action => {
        expect(DEFAULT_GAMEPAD_MAPPING[action]).toBeDefined();
        expect(Array.isArray(DEFAULT_GAMEPAD_MAPPING[action].buttons)).toBe(true);
        expect(Array.isArray(DEFAULT_GAMEPAD_MAPPING[action].axes)).toBe(true);
      });
    });

    it('maps D-pad buttons to directional actions', () => {
      expect(DEFAULT_GAMEPAD_MAPPING.left.buttons).toContain(14);
      expect(DEFAULT_GAMEPAD_MAPPING.right.buttons).toContain(15);
      expect(DEFAULT_GAMEPAD_MAPPING.up.buttons).toContain(12);
      expect(DEFAULT_GAMEPAD_MAPPING.down.buttons).toContain(13);
    });

    it('maps face buttons to combat actions', () => {
      expect(DEFAULT_GAMEPAD_MAPPING.jump.buttons).toContain(0);
      expect(DEFAULT_GAMEPAD_MAPPING.attack.buttons).toContain(2);
      expect(DEFAULT_GAMEPAD_MAPPING.special.buttons).toContain(1);
    });
  });

  describe('ACTION_LABELS', () => {
    it('has a label for every action', () => {
      ACTION_NAMES.forEach(action => {
        expect(ACTION_LABELS[action]).toBeDefined();
        expect(typeof ACTION_LABELS[action]).toBe('string');
      });
    });
  });

  describe('CONTROLLER_PROFILES', () => {
    it('ends with generic as fallback', () => {
      const last = CONTROLLER_PROFILES[CONTROLLER_PROFILES.length - 1];
      expect(last.type).toBe('generic');
    });

    it('every profile has a defaultMapping', () => {
      CONTROLLER_PROFILES.forEach(profile => {
        expect(profile.defaultMapping).toBeDefined();
      });
    });
  });
});
