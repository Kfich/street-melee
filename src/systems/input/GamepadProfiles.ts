/**
 * Controller profiles and button mappings for the gamepad system.
 * Uses the W3C Standard Gamepad layout (https://www.w3.org/TR/gamepad/).
 *
 * Standard button indices:
 *   0=A/Cross   1=B/Circle  2=X/Square  3=Y/Triangle
 *   4=LB/L1     5=RB/R1     6=LT/L2     7=RT/R2
 *   8=Back/Share  9=Start/Options  10=LS  11=RS
 *   12=D-Up  13=D-Down  14=D-Left  15=D-Right  16=Home/PS
 *
 * Standard axes:
 *   0=LS-X  1=LS-Y  2=RS-X  3=RS-Y  (negative = left/up)
 */

export type ControllerType = 'playstation' | 'xbox' | 'switch' | 'generic';

/** Game actions that can be bound to gamepad inputs */
export type ActionName = 'left' | 'right' | 'up' | 'down' | 'jump' | 'attack' | 'special';

/** All game actions in display order */
export const ACTION_NAMES: ActionName[] = [
  'left', 'right', 'up', 'down', 'jump', 'attack', 'special',
];

/** Human-readable labels for each action */
export const ACTION_LABELS: Record<ActionName, string> = {
  left:    'LEFT',
  right:   'RIGHT',
  up:      'UP',
  down:    'DOWN',
  jump:    'JUMP',
  attack:  'ATTACK',
  special: 'SPECIAL',
};

/** Axis-based input trigger */
export interface AxisBinding {
  /** Axis index (0=LS-X, 1=LS-Y, 2=RS-X, 3=RS-Y) */
  index: number;
  /** Minimum absolute value to count as pressed (after deadzone) */
  threshold: number;
  /** -1 = negative direction (left/up), 1 = positive (right/down) */
  direction: 1 | -1;
}

/** All inputs that can trigger a single game action */
export interface ActionBinding {
  /** Button indices (OR logic — any one of these counts) */
  buttons: number[];
  /** Axis bindings (OR logic) */
  axes: AxisBinding[];
}

/** Complete mapping from action name to its bound inputs */
export type GamepadMapping = Record<ActionName, ActionBinding>;

/** A detected controller type with its display name and default mapping */
export interface ControllerProfile {
  type: ControllerType;
  displayName: string;
  /** Regexes matched against Gamepad.id (case-insensitive) to identify this type */
  idPatterns: RegExp[];
  defaultMapping: GamepadMapping;
}

/**
 * Default W3C mapping used as the baseline for all controller types.
 * D-pad + left stick for movement; face buttons for actions.
 */
export const DEFAULT_GAMEPAD_MAPPING: GamepadMapping = {
  left:    { buttons: [14], axes: [{ index: 0, threshold: 0.5, direction: -1 }] },
  right:   { buttons: [15], axes: [{ index: 0, threshold: 0.5, direction:  1 }] },
  up:      { buttons: [12], axes: [{ index: 1, threshold: 0.5, direction: -1 }] },
  down:    { buttons: [13], axes: [{ index: 1, threshold: 0.5, direction:  1 }] },
  jump:    { buttons: [0],  axes: [] },   // A / Cross
  attack:  { buttons: [2],  axes: [] },   // X / Square
  special: { buttons: [1],  axes: [] },   // B / Circle
};

export const CONTROLLER_PROFILES: ControllerProfile[] = [
  {
    type: 'playstation',
    displayName: 'PlayStation',
    idPatterns: [/dualshock/i, /dualsense/i, /playstation/i, /wireless controller/i, /054c:/i],
    defaultMapping: DEFAULT_GAMEPAD_MAPPING,
  },
  {
    type: 'xbox',
    displayName: 'Xbox',
    idPatterns: [/xbox/i, /microsoft/i, /045e/i, /xinput/i],
    defaultMapping: DEFAULT_GAMEPAD_MAPPING,
  },
  {
    type: 'switch',
    displayName: 'Switch Pro',
    idPatterns: [/nintendo/i, /pro controller/i, /057e:/i, /joy-con/i],
    defaultMapping: DEFAULT_GAMEPAD_MAPPING,
  },
  {
    type: 'generic',
    displayName: 'Controller',
    idPatterns: [],
    defaultMapping: DEFAULT_GAMEPAD_MAPPING,
  },
];

/** Identify a controller type from its Gamepad.id string */
export function detectProfile(gamepadId: string): ControllerProfile {
  for (const profile of CONTROLLER_PROFILES) {
    if (profile.idPatterns.some(p => p.test(gamepadId))) {
      return profile;
    }
  }
  return CONTROLLER_PROFILES[CONTROLLER_PROFILES.length - 1]; // generic fallback
}

// ── Per-type button name tables ────────────────────────────────────────────

const PS_NAMES: Record<number, string> = {
  0: 'CROSS',  1: 'CIRCLE', 2: 'SQUARE', 3: 'TRIANGLE',
  4: 'L1',     5: 'R1',     6: 'L2',     7: 'R2',
  8: 'SHARE',  9: 'OPTIONS', 10: 'L3',  11: 'R3',
  12: 'D\u2191', 13: 'D\u2193', 14: 'D\u2190', 15: 'D\u2192', 16: 'PS',
};

const XBOX_NAMES: Record<number, string> = {
  0: 'A',    1: 'B',    2: 'X',    3: 'Y',
  4: 'LB',   5: 'RB',   6: 'LT',   7: 'RT',
  8: 'BACK', 9: 'START', 10: 'LS', 11: 'RS',
  12: 'D\u2191', 13: 'D\u2193', 14: 'D\u2190', 15: 'D\u2192', 16: 'HOME',
};

const SWITCH_NAMES: Record<number, string> = {
  0: 'B',  1: 'A',  2: 'Y',  3: 'X',
  4: 'L',  5: 'R',  6: 'ZL', 7: 'ZR',
  8: '-',  9: '+',  10: 'LS', 11: 'RS',
  12: 'D\u2191', 13: 'D\u2193', 14: 'D\u2190', 15: 'D\u2192', 16: 'HOME',
};

/** Human-readable button name for a given index and controller type */
export function getButtonName(buttonIndex: number, controllerType: ControllerType): string {
  const map =
    controllerType === 'playstation' ? PS_NAMES :
    controllerType === 'switch'      ? SWITCH_NAMES :
                                       XBOX_NAMES;
  return map[buttonIndex] ?? `BTN${buttonIndex}`;
}

/** Short display string for an ActionBinding, e.g. "D\u2190/LS\u2190" */
export function formatBinding(binding: ActionBinding, controllerType: ControllerType): string {
  const parts: string[] = [];

  for (const btn of binding.buttons) {
    parts.push(getButtonName(btn, controllerType));
  }

  for (const axis of binding.axes) {
    const name = axis.index <= 1 ? 'LS' : 'RS';
    const isXAxis = axis.index % 2 === 0;
    const arrow = axis.direction === -1
      ? (isXAxis ? '\u2190' : '\u2191')
      : (isXAxis ? '\u2192' : '\u2193');
    parts.push(`${name}${arrow}`);
  }

  return parts.join('/') || '---';
}
