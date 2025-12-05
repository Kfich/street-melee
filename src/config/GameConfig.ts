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
  HEAVY_HIT_THRESHOLD: 25, // damage threshold for heavy hit effects
  
  // Hit Stop (time freeze on hits)
  HIT_STOP_LIGHT: 30, // ms for light hits
  HIT_STOP_MEDIUM: 50, // ms for medium hits
  HIT_STOP_HEAVY: 80, // ms for heavy hits
  HIT_STOP_KNOCKDOWN: 120, // ms for knockdown hits
  HIT_STOP_TIME_SCALE: 0.05, // time scale during hit stop (0.05 = 5% speed)
  
  // Hit Reactions
  HIT_REACTION_DURATION: 150, // ms for hit reaction animation
  HIT_STUN_DURATION: 200, // ms for stun state after hit
  
  // Input Buffering
  INPUT_BUFFER_WINDOW: 200, // ms window to buffer inputs
  COMBO_INPUT_BUFFER: 300, // ms window for combo inputs

  // Multiplayer
  SERVER_PORT: 3001,
  CLIENT_PORT: 3000,

  // Assets
  SPRITE_SCALE: 1,
} as const;

