/**
 * Game configuration constants
 */
export const GameConfig = {
  // Display
  WIDTH: 1024,
  HEIGHT: 576,
  BACKGROUND_COLOR: '#000000',

  // Physics
  GRAVITY: 800,
  PLAYER_DRAG: 500,
  GROUND_FRICTION: 0.8,

  // Player
  PLAYER_BASE_SPEED: 150,
  PLAYER_BASE_JUMP: 400,
  PLAYER_MAX_HEALTH: 100,
  PLAYER_WIDTH: 32,
  PLAYER_HEIGHT: 48,

  // Movement multipliers
  SPEED_MULTIPLIER: 0.1,
  JUMP_MULTIPLIER: 0.2,

  // Camera
  CAMERA_FOLLOW_LERP: 0.1,
  CAMERA_BOUNDS_MULTIPLIER: 2,

  // Input
  DASH_DOUBLE_TAP_TIME: 200, // milliseconds
  COMBO_WINDOW: 500, // milliseconds

  // Combat
  ATTACK_DURATION: 300,
  SPECIAL_MOVE_DURATION: 500,
  KNOCKDOWN_THRESHOLD: 50, // damage threshold for knockdown

  // Multiplayer
  SERVER_PORT: 3001,
  CLIENT_PORT: 3000,

  // Assets
  SPRITE_SCALE: 1,
} as const;

