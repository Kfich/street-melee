/**
 * Shared touch input state for mobile controls.
 * Updated by MobileControlsScene, read by InputManager.
 */
export interface TouchState {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  jump: boolean;
  attack: boolean;
  special: boolean;
}

export const globalTouchState: TouchState = {
  left: false,
  right: false,
  up: false,
  down: false,
  jump: false,
  attack: false,
  special: false,
};
