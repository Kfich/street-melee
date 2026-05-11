/**
 * GamepadManager — handles controller connect/disconnect (hotplugging),
 * player assignment, deadzone-corrected input reading, and custom button
 * remapping. Works with any W3C-standard gamepad: PlayStation, Xbox,
 * Switch Pro, generic USB/Bluetooth controllers.
 *
 * Bluetooth pairing is handled at the OS level; once paired the browser
 * surfaces the controller through the same Gamepad API automatically.
 */

import { PlayerInput } from '../../types/GameTypes';
import {
  ActionName,
  ControllerProfile,
  GamepadMapping,
  detectProfile,
  DEFAULT_GAMEPAD_MAPPING,
  ACTION_NAMES,
} from './GamepadProfiles';

const STORAGE_KEY = 'streetMeleeGamepadConfig';
const MAX_PLAYERS = 2;

// ── Stored config shape ────────────────────────────────────────────────────

interface StoredConfig {
  mappings: Array<[number, GamepadMapping]>; // [playerIndex, mapping]
  deadzone: number;
}

// ── Public types ───────────────────────────────────────────────────────────

/** Info about a currently connected controller */
export interface ConnectedController {
  /** Index from navigator.getGamepads() */
  index: number;
  /** Raw Gamepad.id string from the browser */
  id: string;
  /** Detected profile (PlayStation / Xbox / Switch / generic) */
  profile: ControllerProfile;
  /** Which player controls this pad, or -1 if unassigned */
  playerIndex: number;
}

// ── GamepadManager ─────────────────────────────────────────────────────────

export class GamepadManager {
  private controllers: Map<number, ConnectedController> = new Map();
  private playerAssignments: Map<number, number> = new Map(); // playerIndex → gamepadIndex
  private customMappings: Map<number, GamepadMapping> = new Map();
  private deadzone: number = 0.15;

  private boundOnConnect: (e: Event) => void;
  private boundOnDisconnect: (e: Event) => void;

  private connectListeners: Array<(ctrl: ConnectedController) => void> = [];
  private disconnectListeners: Array<(gamepadIndex: number) => void> = [];

  constructor() {
    this.boundOnConnect = (e: Event) => {
      const gpEvent = e as GamepadEvent;
      if (gpEvent.gamepad) this.registerGamepad(gpEvent.gamepad);
    };
    this.boundOnDisconnect = (e: Event) => {
      const gpEvent = e as GamepadEvent;
      if (gpEvent.gamepad) this.handleDisconnect(gpEvent.gamepad);
    };

    window.addEventListener('gamepadconnected', this.boundOnConnect);
    window.addEventListener('gamepaddisconnected', this.boundOnDisconnect);

    this.loadFromStorage();
    this.scanForGamepads();
  }

  // ── Connection management ────────────────────────────────────────────────

  /**
   * Scan navigator.getGamepads() for pads already connected before the
   * first 'gamepadconnected' event fires (common on page load).
   */
  private scanForGamepads(): void {
    try {
      const gamepads = navigator.getGamepads();
      for (const gp of gamepads) {
        if (gp) this.registerGamepad(gp);
      }
    } catch {
      // navigator.getGamepads() may be absent in non-browser environments
    }
  }

  private registerGamepad(gamepad: Gamepad): void {
    if (this.controllers.has(gamepad.index)) return;

    const profile = detectProfile(gamepad.id);
    const controller: ConnectedController = {
      index: gamepad.index,
      id: gamepad.id,
      profile,
      playerIndex: -1,
    };

    this.controllers.set(gamepad.index, controller);

    // Auto-assign to the first available player slot
    for (let p = 0; p < MAX_PLAYERS; p++) {
      if (!this.playerAssignments.has(p)) {
        this.assignGamepadToPlayer(gamepad.index, p);
        break;
      }
    }

    this.connectListeners.forEach(fn => fn(controller));
    this.saveToStorage();
  }

  private handleDisconnect(gamepad: Gamepad): void {
    const index = gamepad.index;
    const controller = this.controllers.get(index);
    if (!controller) return;

    if (controller.playerIndex >= 0) {
      this.playerAssignments.delete(controller.playerIndex);
    }

    this.controllers.delete(index);
    this.disconnectListeners.forEach(fn => fn(index));
    this.saveToStorage();
  }

  // ── Input reading ────────────────────────────────────────────────────────

  /**
   * Read the current input state for a player, applying deadzone correction.
   * Returns all-false if no gamepad is assigned to this player.
   */
  getPlayerInput(playerIndex: number): PlayerInput {
    const gamepadIndex = this.playerAssignments.get(playerIndex);
    if (gamepadIndex === undefined) return this.emptyInput();

    let gamepad: Gamepad | null = null;
    try {
      gamepad = navigator.getGamepads()[gamepadIndex] ?? null;
    } catch {
      return this.emptyInput();
    }

    if (!gamepad || !gamepad.connected) return this.emptyInput();

    return this.readGamepadState(gamepad, this.getEffectiveMapping(playerIndex));
  }

  private readGamepadState(gamepad: Gamepad, mapping: GamepadMapping): PlayerInput {
    const result: PlayerInput = {
      left: false, right: false, up: false, down: false,
      jump: false, attack: false, special: false,
    };

    for (const action of ACTION_NAMES) {
      const binding = mapping[action];

      // Digital buttons
      for (const idx of binding.buttons) {
        if (gamepad.buttons[idx]?.pressed) {
          result[action] = true;
          break;
        }
      }

      // Analog axes with deadzone
      if (!result[action]) {
        for (const axis of binding.axes) {
          const raw = gamepad.axes[axis.index] ?? 0;
          const val = Math.abs(raw) >= this.deadzone ? raw : 0;
          if (axis.direction === -1 && val <= -axis.threshold) { result[action] = true; break; }
          if (axis.direction ===  1 && val >=  axis.threshold) { result[action] = true; break; }
        }
      }
    }

    return result;
  }

  /**
   * Return the index of the first currently-pressed button on the gamepad
   * assigned to playerIndex. Falls back to scanning all connected pads if
   * the player has no assignment. Returns null if nothing is pressed.
   */
  readFirstPressedButton(playerIndex: number): number | null {
    let gamepads: ReadonlyArray<Gamepad | null>;
    try {
      gamepads = navigator.getGamepads();
    } catch {
      return null;
    }

    const assignedIndex = this.playerAssignments.get(playerIndex);
    if (assignedIndex !== undefined) {
      const gp = gamepads[assignedIndex];
      if (gp) return this.findPressedButton(gp);
    }

    // No assignment — scan all connected pads
    for (const gp of gamepads) {
      if (!gp) continue;
      const btn = this.findPressedButton(gp);
      if (btn !== null) return btn;
    }
    return null;
  }

  private findPressedButton(gamepad: Gamepad): number | null {
    for (let i = 0; i < gamepad.buttons.length; i++) {
      if (gamepad.buttons[i].pressed) return i;
    }
    return null;
  }

  // ── Assignment ───────────────────────────────────────────────────────────

  /** Assign a gamepad to a player, removing any conflicting prior assignments */
  assignGamepadToPlayer(gamepadIndex: number, playerIndex: number): void {
    // Detach the gamepad from whichever other player had it
    this.controllers.forEach(ctrl => {
      if (ctrl.index === gamepadIndex && ctrl.playerIndex !== playerIndex && ctrl.playerIndex >= 0) {
        this.playerAssignments.delete(ctrl.playerIndex);
        ctrl.playerIndex = -1;
      }
    });

    // Detach whoever was previously assigned to this player slot
    const prevIndex = this.playerAssignments.get(playerIndex);
    if (prevIndex !== undefined && prevIndex !== gamepadIndex) {
      const prev = this.controllers.get(prevIndex);
      if (prev) prev.playerIndex = -1;
    }

    this.playerAssignments.set(playerIndex, gamepadIndex);
    const controller = this.controllers.get(gamepadIndex);
    if (controller) controller.playerIndex = playerIndex;

    this.saveToStorage();
  }

  /** Remove the gamepad assignment from a player slot */
  unassignPlayer(playerIndex: number): void {
    const idx = this.playerAssignments.get(playerIndex);
    if (idx !== undefined) {
      const ctrl = this.controllers.get(idx);
      if (ctrl) ctrl.playerIndex = -1;
    }
    this.playerAssignments.delete(playerIndex);
    this.saveToStorage();
  }

  // ── Mapping ──────────────────────────────────────────────────────────────

  /** Override a single action binding for a player */
  setActionBinding(playerIndex: number, action: ActionName, buttonIndex: number): void {
    const current = this.getEffectiveMapping(playerIndex);
    const updated: GamepadMapping = {
      ...current,
      [action]: { buttons: [buttonIndex], axes: [] },
    };
    this.customMappings.set(playerIndex, updated);
    this.saveToStorage();
  }

  /** Replace the entire mapping for a player */
  setCustomMapping(playerIndex: number, mapping: GamepadMapping): void {
    this.customMappings.set(playerIndex, mapping);
    this.saveToStorage();
  }

  /** Return the active mapping for a player (custom or default) */
  getEffectiveMapping(playerIndex: number): GamepadMapping {
    return this.customMappings.get(playerIndex) ?? DEFAULT_GAMEPAD_MAPPING;
  }

  /** Erase all custom mappings and revert to defaults */
  resetMappings(): void {
    this.customMappings.clear();
    this.saveToStorage();
  }

  // ── Deadzone ─────────────────────────────────────────────────────────────

  setDeadzone(value: number): void {
    this.deadzone = Math.max(0.05, Math.min(0.95, value));
    this.saveToStorage();
  }

  getDeadzone(): number { return this.deadzone; }

  // ── Queries ──────────────────────────────────────────────────────────────

  getConnectedControllers(): ConnectedController[] {
    return Array.from(this.controllers.values());
  }

  getPlayerController(playerIndex: number): ConnectedController | null {
    const idx = this.playerAssignments.get(playerIndex);
    if (idx === undefined) return null;
    return this.controllers.get(idx) ?? null;
  }

  hasAnyController(): boolean {
    return this.controllers.size > 0;
  }

  // ── Event subscriptions ──────────────────────────────────────────────────

  onControllerConnected(fn: (ctrl: ConnectedController) => void): void {
    this.connectListeners.push(fn);
  }

  onControllerDisconnected(fn: (gamepadIndex: number) => void): void {
    this.disconnectListeners.push(fn);
  }

  removeControllerConnectedListener(fn: (ctrl: ConnectedController) => void): void {
    this.connectListeners = this.connectListeners.filter(l => l !== fn);
  }

  removeControllerDisconnectedListener(fn: (gamepadIndex: number) => void): void {
    this.disconnectListeners = this.disconnectListeners.filter(l => l !== fn);
  }

  // ── Persistence ──────────────────────────────────────────────────────────

  private saveToStorage(): void {
    const config: StoredConfig = {
      mappings: Array.from(this.customMappings.entries()),
      deadzone: this.deadzone,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch {
      // Storage may be unavailable (private browsing, quota exceeded)
    }
  }

  private loadFromStorage(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const config: StoredConfig = JSON.parse(raw);

      if (typeof config.deadzone === 'number') {
        this.deadzone = Math.max(0.05, Math.min(0.95, config.deadzone));
      }

      if (Array.isArray(config.mappings)) {
        config.mappings.forEach(([playerIndex, mapping]) => {
          if (typeof playerIndex === 'number' && mapping) {
            this.customMappings.set(playerIndex, mapping);
          }
        });
      }
    } catch {
      // Ignore corrupted config
    }
  }

  // ── Cleanup ───────────────────────────────────────────────────────────────

  destroy(): void {
    window.removeEventListener('gamepadconnected', this.boundOnConnect);
    window.removeEventListener('gamepaddisconnected', this.boundOnDisconnect);
    this.connectListeners = [];
    this.disconnectListeners = [];
  }

  private emptyInput(): PlayerInput {
    return {
      left: false, right: false, up: false, down: false,
      jump: false, attack: false, special: false,
    };
  }
}

// ── Singleton ─────────────────────────────────────────────────────────────

let _instance: GamepadManager | null = null;

/**
 * Returns the shared GamepadManager instance.
 * Lazy-initialised on first call so tests can safely import the module
 * without triggering a side-effectful constructor.
 */
export function getGamepadManager(): GamepadManager {
  if (!_instance) {
    _instance = new GamepadManager();
  }
  return _instance;
}
