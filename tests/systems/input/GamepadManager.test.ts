import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GamepadManager } from '../../../src/systems/input/GamepadManager';
import {
  DEFAULT_GAMEPAD_MAPPING,
  detectProfile,
  getButtonName,
  formatBinding,
} from '../../../src/systems/input/GamepadProfiles';

// ── Gamepad helpers ──────────────────────────────────────────────────────────

/** Build a minimal Gamepad object for test use */
function makeGamepad(
  index: number,
  id: string,
  pressedButtons: number[] = [],
  axes: number[] = [0, 0, 0, 0]
): Gamepad {
  const buttons = Array.from({ length: 17 }, (_, i) => ({
    pressed: pressedButtons.includes(i),
    touched: pressedButtons.includes(i),
    value:   pressedButtons.includes(i) ? 1 : 0,
  })) as GamepadButton[];

  return {
    index,
    id,
    connected: true,
    mapping: 'standard',
    axes,
    buttons,
    timestamp: Date.now(),
    vibrationActuator: null as unknown as GamepadHapticActuator,
    hapticActuators:   [],
  };
}

/** Fire a synthetic gamepadconnected / gamepaddisconnected event */
function dispatchGamepadEvent(type: 'gamepadconnected' | 'gamepaddisconnected', gamepad: Gamepad) {
  const event = Object.assign(new Event(type), { gamepad });
  window.dispatchEvent(event);
}

// ── Setup / teardown ─────────────────────────────────────────────────────────

let manager: GamepadManager;
let mockGetGamepads: ReturnType<typeof vi.fn>;

beforeEach(() => {
  // Return empty pad list by default; individual tests override as needed.
  mockGetGamepads = vi.fn<[], ReadonlyArray<Gamepad | null>>(() => []);

  Object.defineProperty(navigator, 'getGamepads', {
    value: mockGetGamepads,
    writable: true,
    configurable: true,
  });

  // global.localStorage is already localStorageMock (vi.fn() objects) from setup.ts.
  // Reset mock call history so each test starts clean.
  vi.mocked(localStorage.getItem).mockReset().mockReturnValue(null);
  vi.mocked(localStorage.setItem).mockReset();

  manager = new GamepadManager();
});

afterEach(() => {
  manager.destroy();
  vi.restoreAllMocks();
});

// ── Controller detection (profiles) ──────────────────────────────────────────

describe('detectProfile', () => {
  it('detects PlayStation via DualShock id', () => {
    const profile = detectProfile('Sony PLAYSTATION(R)3 Controller (STANDARD GAMEPAD Vendor: 054c)');
    expect(profile.type).toBe('playstation');
  });

  it('detects PlayStation via DualSense id', () => {
    const profile = detectProfile('DualSense Wireless Controller');
    expect(profile.type).toBe('playstation');
  });

  it('detects PlayStation via vendor id 054c', () => {
    const profile = detectProfile('Wireless Controller (STANDARD GAMEPAD Vendor: 054c Product: 05c4)');
    expect(profile.type).toBe('playstation');
  });

  it('detects Xbox via "Xbox" keyword', () => {
    const profile = detectProfile('Xbox 360 Controller (XInput STANDARD GAMEPAD)');
    expect(profile.type).toBe('xbox');
  });

  it('detects Xbox via Microsoft vendor id 045e', () => {
    const profile = detectProfile('Controller (STANDARD GAMEPAD Vendor: 045e Product: 028e)');
    expect(profile.type).toBe('xbox');
  });

  it('detects Switch Pro via "Nintendo" keyword', () => {
    const profile = detectProfile('Nintendo Switch Pro Controller');
    expect(profile.type).toBe('switch');
  });

  it('detects Switch Pro via vendor id 057e', () => {
    const profile = detectProfile('Pro Controller (STANDARD GAMEPAD Vendor: 057e Product: 2009)');
    expect(profile.type).toBe('switch');
  });

  it('falls back to generic for unknown controllers', () => {
    const profile = detectProfile('Unknown Generic HID Gamepad');
    expect(profile.type).toBe('generic');
  });
});

// ── Button name lookup ────────────────────────────────────────────────────────

describe('getButtonName', () => {
  it('returns PS button names', () => {
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

  it('returns generic BTN label for unknown button indices', () => {
    expect(getButtonName(99, 'xbox')).toBe('BTN99');
  });
});

// ── Binding display formatting ────────────────────────────────────────────────

describe('formatBinding', () => {
  it('formats a button-only binding', () => {
    const str = formatBinding({ buttons: [0], axes: [] }, 'xbox');
    expect(str).toBe('A');
  });

  it('formats a button + axis binding', () => {
    const str = formatBinding(
      { buttons: [14], axes: [{ index: 0, threshold: 0.5, direction: -1 }] },
      'xbox'
    );
    expect(str).toContain('D\u2190'); // D-left
    expect(str).toContain('LS\u2190'); // left stick left
  });

  it('returns --- for empty bindings', () => {
    expect(formatBinding({ buttons: [], axes: [] }, 'xbox')).toBe('---');
  });
});

// ── Hotplugging ───────────────────────────────────────────────────────────────

describe('hotplugging', () => {
  it('registers a controller when gamepadconnected fires', () => {
    const gp = makeGamepad(0, 'Xbox 360 Controller');
    dispatchGamepadEvent('gamepadconnected', gp);

    const controllers = manager.getConnectedControllers();
    expect(controllers).toHaveLength(1);
    expect(controllers[0].id).toBe('Xbox 360 Controller');
  });

  it('auto-assigns the first pad to player 1', () => {
    const gp = makeGamepad(0, 'Xbox 360 Controller');
    dispatchGamepadEvent('gamepadconnected', gp);

    const ctrl = manager.getPlayerController(0);
    expect(ctrl).not.toBeNull();
    expect(ctrl!.index).toBe(0);
  });

  it('auto-assigns the second pad to player 2', () => {
    dispatchGamepadEvent('gamepadconnected', makeGamepad(0, 'Xbox 360'));
    dispatchGamepadEvent('gamepadconnected', makeGamepad(1, 'DualSense'));

    expect(manager.getPlayerController(0)?.index).toBe(0);
    expect(manager.getPlayerController(1)?.index).toBe(1);
  });

  it('does not assign a third pad when both slots are full', () => {
    dispatchGamepadEvent('gamepadconnected', makeGamepad(0, 'Xbox 360'));
    dispatchGamepadEvent('gamepadconnected', makeGamepad(1, 'DualSense'));
    dispatchGamepadEvent('gamepadconnected', makeGamepad(2, 'Generic'));

    // Third controller exists but is unassigned
    const controllers = manager.getConnectedControllers();
    expect(controllers).toHaveLength(3);
    expect(controllers[2].playerIndex).toBe(-1);
  });

  it('removes controller and clears assignment on gamepaddisconnected', () => {
    const gp = makeGamepad(0, 'Xbox 360');
    dispatchGamepadEvent('gamepadconnected', gp);
    expect(manager.getPlayerController(0)).not.toBeNull();

    dispatchGamepadEvent('gamepaddisconnected', gp);
    expect(manager.getPlayerController(0)).toBeNull();
    expect(manager.getConnectedControllers()).toHaveLength(0);
  });

  it('fires onControllerConnected callback', () => {
    const cb = vi.fn();
    manager.onControllerConnected(cb);

    dispatchGamepadEvent('gamepadconnected', makeGamepad(0, 'Xbox'));
    expect(cb).toHaveBeenCalledOnce();
    expect(cb.mock.calls[0][0].id).toBe('Xbox');
  });

  it('fires onControllerDisconnected callback', () => {
    const cb = vi.fn();
    manager.onControllerDisconnected(cb);

    const gp = makeGamepad(0, 'Xbox');
    dispatchGamepadEvent('gamepadconnected', gp);
    dispatchGamepadEvent('gamepaddisconnected', gp);
    expect(cb).toHaveBeenCalledWith(0);
  });

  it('does not fire removed listeners', () => {
    const cb = vi.fn();
    manager.onControllerConnected(cb);
    manager.removeControllerConnectedListener(cb);

    dispatchGamepadEvent('gamepadconnected', makeGamepad(0, 'Xbox'));
    expect(cb).not.toHaveBeenCalled();
  });
});

// ── Player assignment ─────────────────────────────────────────────────────────

describe('player assignment', () => {
  it('assignGamepadToPlayer moves a pad to a specific player', () => {
    dispatchGamepadEvent('gamepadconnected', makeGamepad(0, 'Xbox'));
    dispatchGamepadEvent('gamepadconnected', makeGamepad(1, 'DualSense'));

    // Reassign pad 1 to player 1 (displacing pad 0)
    manager.assignGamepadToPlayer(1, 0);
    expect(manager.getPlayerController(0)?.index).toBe(1);
    expect(manager.getPlayerController(1)?.index).toBeUndefined();
  });

  it('unassignPlayer removes the controller from a slot', () => {
    dispatchGamepadEvent('gamepadconnected', makeGamepad(0, 'Xbox'));
    expect(manager.getPlayerController(0)).not.toBeNull();

    manager.unassignPlayer(0);
    expect(manager.getPlayerController(0)).toBeNull();
  });

  it('hasAnyController returns true when pads are connected', () => {
    expect(manager.hasAnyController()).toBe(false);
    dispatchGamepadEvent('gamepadconnected', makeGamepad(0, 'Xbox'));
    expect(manager.hasAnyController()).toBe(true);
  });
});

// ── Input reading ─────────────────────────────────────────────────────────────

describe('getPlayerInput', () => {
  it('returns all-false when no gamepad is assigned', () => {
    const input = manager.getPlayerInput(0);
    expect(Object.values(input).every(v => v === false)).toBe(true);
  });

  it('reads jump from button 0 (A / Cross)', () => {
    const gp = makeGamepad(0, 'Xbox 360', [0]); // button 0 pressed
    mockGetGamepads.mockReturnValue([gp]);
    dispatchGamepadEvent('gamepadconnected', gp);

    const input = manager.getPlayerInput(0);
    expect(input.jump).toBe(true);
    expect(input.attack).toBe(false);
    expect(input.special).toBe(false);
  });

  it('reads attack from button 2 (X / Square)', () => {
    const gp = makeGamepad(0, 'Xbox 360', [2]);
    mockGetGamepads.mockReturnValue([gp]);
    dispatchGamepadEvent('gamepadconnected', gp);

    expect(manager.getPlayerInput(0).attack).toBe(true);
  });

  it('reads special from button 1 (B / Circle)', () => {
    const gp = makeGamepad(0, 'Xbox 360', [1]);
    mockGetGamepads.mockReturnValue([gp]);
    dispatchGamepadEvent('gamepadconnected', gp);

    expect(manager.getPlayerInput(0).special).toBe(true);
  });

  it('reads directional input from D-pad (buttons 12-15)', () => {
    // D-Left = button 14
    const gp = makeGamepad(0, 'Xbox 360', [14]);
    mockGetGamepads.mockReturnValue([gp]);
    dispatchGamepadEvent('gamepadconnected', gp);

    const input = manager.getPlayerInput(0);
    expect(input.left).toBe(true);
    expect(input.right).toBe(false);
  });

  it('reads left movement from left analog stick (axis 0, negative)', () => {
    const gp = makeGamepad(0, 'Xbox 360', [], [-0.8, 0, 0, 0]);
    mockGetGamepads.mockReturnValue([gp]);
    dispatchGamepadEvent('gamepadconnected', gp);

    expect(manager.getPlayerInput(0).left).toBe(true);
    expect(manager.getPlayerInput(0).right).toBe(false);
  });

  it('reads right movement from left analog stick (axis 0, positive)', () => {
    const gp = makeGamepad(0, 'Xbox 360', [], [0.8, 0, 0, 0]);
    mockGetGamepads.mockReturnValue([gp]);
    dispatchGamepadEvent('gamepadconnected', gp);

    expect(manager.getPlayerInput(0).right).toBe(true);
    expect(manager.getPlayerInput(0).left).toBe(false);
  });

  it('reads up movement from left analog stick (axis 1, negative)', () => {
    const gp = makeGamepad(0, 'Xbox 360', [], [0, -0.8, 0, 0]);
    mockGetGamepads.mockReturnValue([gp]);
    dispatchGamepadEvent('gamepadconnected', gp);

    expect(manager.getPlayerInput(0).up).toBe(true);
  });

  it('reads down movement from left analog stick (axis 1, positive)', () => {
    const gp = makeGamepad(0, 'Xbox 360', [], [0, 0.8, 0, 0]);
    mockGetGamepads.mockReturnValue([gp]);
    dispatchGamepadEvent('gamepadconnected', gp);

    expect(manager.getPlayerInput(0).down).toBe(true);
  });

  it('returns all-false when navigator.getGamepads throws', () => {
    mockGetGamepads.mockImplementation(() => { throw new Error('no gamepad'); });
    dispatchGamepadEvent('gamepadconnected', makeGamepad(0, 'Xbox'));

    const input = manager.getPlayerInput(0);
    expect(Object.values(input).every(v => v === false)).toBe(true);
  });
});

// ── Deadzone ──────────────────────────────────────────────────────────────────

describe('deadzone', () => {
  it('filters out axis values below the deadzone', () => {
    manager.setDeadzone(0.3);
    const gp = makeGamepad(0, 'Xbox', [], [0.1, 0, 0, 0]); // axis below deadzone
    mockGetGamepads.mockReturnValue([gp]);
    dispatchGamepadEvent('gamepadconnected', gp);

    expect(manager.getPlayerInput(0).left).toBe(false);
    expect(manager.getPlayerInput(0).right).toBe(false);
  });

  it('accepts axis values above the deadzone', () => {
    manager.setDeadzone(0.3);
    const gp = makeGamepad(0, 'Xbox', [], [0.8, 0, 0, 0]); // above deadzone
    mockGetGamepads.mockReturnValue([gp]);
    dispatchGamepadEvent('gamepadconnected', gp);

    expect(manager.getPlayerInput(0).right).toBe(true);
  });

  it('clamps deadzone to min 0.05', () => {
    manager.setDeadzone(-1);
    expect(manager.getDeadzone()).toBe(0.05);
  });

  it('clamps deadzone to max 0.95', () => {
    manager.setDeadzone(2);
    expect(manager.getDeadzone()).toBe(0.95);
  });

  it('returns the current deadzone value', () => {
    manager.setDeadzone(0.25);
    expect(manager.getDeadzone()).toBe(0.25);
  });
});

// ── Custom mapping ────────────────────────────────────────────────────────────

describe('custom button mapping', () => {
  it('getEffectiveMapping returns default mapping by default', () => {
    const mapping = manager.getEffectiveMapping(0);
    expect(mapping).toEqual(DEFAULT_GAMEPAD_MAPPING);
  });

  it('setActionBinding overrides a single action', () => {
    dispatchGamepadEvent('gamepadconnected', makeGamepad(0, 'Xbox'));

    // Remap jump from button 0 to button 3 (Y)
    manager.setActionBinding(0, 'jump', 3);

    const gp = makeGamepad(0, 'Xbox', [3]);
    mockGetGamepads.mockReturnValue([gp]);

    expect(manager.getPlayerInput(0).jump).toBe(true);
  });

  it('setActionBinding keeps other actions unchanged', () => {
    dispatchGamepadEvent('gamepadconnected', makeGamepad(0, 'Xbox'));
    manager.setActionBinding(0, 'jump', 3);

    const mapping = manager.getEffectiveMapping(0);
    // attack and special should still use their defaults
    expect(mapping.attack.buttons).toContain(2);
    expect(mapping.special.buttons).toContain(1);
  });

  it('setCustomMapping replaces the full mapping', () => {
    const customMapping = {
      ...DEFAULT_GAMEPAD_MAPPING,
      jump: { buttons: [5], axes: [] },
    };
    manager.setCustomMapping(0, customMapping);

    const gp = makeGamepad(0, 'Xbox', [5]);
    dispatchGamepadEvent('gamepadconnected', gp);
    mockGetGamepads.mockReturnValue([gp]);

    expect(manager.getPlayerInput(0).jump).toBe(true);
  });

  it('resetMappings reverts to default', () => {
    manager.setActionBinding(0, 'jump', 5);
    manager.resetMappings();

    const mapping = manager.getEffectiveMapping(0);
    expect(mapping.jump).toEqual(DEFAULT_GAMEPAD_MAPPING.jump);
  });

  it('custom mappings are independent per player', () => {
    dispatchGamepadEvent('gamepadconnected', makeGamepad(0, 'Xbox'));
    dispatchGamepadEvent('gamepadconnected', makeGamepad(1, 'Xbox'));

    manager.setActionBinding(0, 'jump', 3); // P1 remapped
    // P2 should still use default
    expect(manager.getEffectiveMapping(1).jump).toEqual(DEFAULT_GAMEPAD_MAPPING.jump);
  });
});

// ── readFirstPressedButton ────────────────────────────────────────────────────

describe('readFirstPressedButton', () => {
  it('returns null when no gamepad assigned', () => {
    expect(manager.readFirstPressedButton(0)).toBeNull();
  });

  it('returns the index of the first pressed button', () => {
    const gp = makeGamepad(0, 'Xbox', [3]); // button 3 pressed
    dispatchGamepadEvent('gamepadconnected', gp);
    mockGetGamepads.mockReturnValue([gp]);

    expect(manager.readFirstPressedButton(0)).toBe(3);
  });

  it('returns null when no buttons are pressed', () => {
    const gp = makeGamepad(0, 'Xbox', []); // nothing pressed
    dispatchGamepadEvent('gamepadconnected', gp);
    mockGetGamepads.mockReturnValue([gp]);

    expect(manager.readFirstPressedButton(0)).toBeNull();
  });
});

// ── Persistence ───────────────────────────────────────────────────────────────

describe('localStorage persistence', () => {
  // global.localStorage is the localStorageMock from setup.ts — use it directly.

  it('saves config when a mapping changes', () => {
    dispatchGamepadEvent('gamepadconnected', makeGamepad(0, 'Xbox'));
    vi.mocked(localStorage.setItem).mockClear();
    manager.setActionBinding(0, 'jump', 5);

    expect(localStorage.setItem).toHaveBeenCalledWith(
      'streetMeleeGamepadConfig',
      expect.stringContaining('"deadzone"')
    );
  });

  it('saves config when deadzone changes', () => {
    vi.mocked(localStorage.setItem).mockClear();
    manager.setDeadzone(0.25);

    const calls = vi.mocked(localStorage.setItem).mock.calls;
    expect(calls.length).toBeGreaterThan(0);
    const saved = JSON.parse(calls[calls.length - 1][1] as string);
    expect(saved.deadzone).toBeCloseTo(0.25);
  });

  it('loads deadzone from storage on creation', () => {
    vi.mocked(localStorage.getItem).mockReturnValue(
      JSON.stringify({ deadzone: 0.35, mappings: [] })
    );
    const fresh = new GamepadManager();
    expect(fresh.getDeadzone()).toBeCloseTo(0.35);
    fresh.destroy();
  });

  it('loads custom mappings from storage on creation', () => {
    const customMapping = {
      ...DEFAULT_GAMEPAD_MAPPING,
      jump: { buttons: [4], axes: [] },
    };
    vi.mocked(localStorage.getItem).mockReturnValue(
      JSON.stringify({ deadzone: 0.15, mappings: [[0, customMapping]] })
    );
    const fresh = new GamepadManager();
    expect(fresh.getEffectiveMapping(0).jump.buttons).toContain(4);
    fresh.destroy();
  });

  it('handles corrupted localStorage without throwing', () => {
    vi.mocked(localStorage.getItem).mockReturnValue('{bad json{{');
    expect(() => new GamepadManager().destroy()).not.toThrow();
  });

  it('clamps stored deadzone to valid range', () => {
    vi.mocked(localStorage.getItem).mockReturnValue(
      JSON.stringify({ deadzone: 99, mappings: [] })
    );
    const fresh = new GamepadManager();
    expect(fresh.getDeadzone()).toBe(0.95);
    fresh.destroy();
  });
});

// ── Cleanup ───────────────────────────────────────────────────────────────────

describe('destroy', () => {
  it('stops firing callbacks after destroy', () => {
    const cb = vi.fn();
    manager.onControllerConnected(cb);
    manager.destroy();

    dispatchGamepadEvent('gamepadconnected', makeGamepad(0, 'Xbox'));
    expect(cb).not.toHaveBeenCalled();
  });
});
