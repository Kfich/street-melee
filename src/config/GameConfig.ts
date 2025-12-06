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
  PLAYER_VERTICAL_SPEED: 120, // Speed for up/down depth navigation
  PLAYER_MAX_HEALTH: 100,
  PLAYER_WIDTH: 32,
  PLAYER_HEIGHT: 48,

  // Weapons
  WEAPON_WIDTH: 24,
  WEAPON_HEIGHT: 40,

  // Movement multipliers
  SPEED_MULTIPLIER: 0.1,
  JUMP_MULTIPLIER: 0.2,

  // Camera
  CAMERA_FOLLOW_LERP: 0.1,
  CAMERA_BOUNDS_MULTIPLIER: 2,

  // Input
  DASH_DOUBLE_TAP_TIME: 200, // milliseconds
  COMBO_WINDOW: 500, // milliseconds
  INPUT_BUFFER_WINDOW: 100, // milliseconds for input buffering

  // Combat
  ATTACK_DURATION: 300,
  SPECIAL_MOVE_DURATION: 500,
  KNOCKDOWN_THRESHOLD: 50, // damage threshold for knockdown
  HEAVY_HIT_THRESHOLD: 25, // damage threshold for heavy hit effects
  AIR_RECOVERY_COOLDOWN: 1000, // milliseconds - cooldown after using air recovery
  BLOCK_DURATION: 300, // milliseconds - how long block lasts
  BLOCK_COOLDOWN: 200, // milliseconds - cooldown between blocks
  
  // Spatial Partitioning
  SPATIAL_GRID_CELL_SIZE: 200, // Size of each grid cell for collision detection
  
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
  COMBO_RESET_DELAY: 3000, // ms delay before resetting combo if no new hits

  // Multiplayer
  SERVER_PORT: 3001,
  CLIENT_PORT: 3000,

  // Assets
  SPRITE_SCALE: 1,

  // Game Scene
  PLAYER_LIVES: 3,
  GROUND_HEIGHT_RANGE: 200, // 200px range from bottom for ground
  GROUND_OFFSET: 100, // Offset from bottom for ground Y position
  PLAYER_SPAWN_X_1: 200, // Player 1 initial X position
  PLAYER_SPAWN_X_2: 400, // Player 2 initial X position
  CAMERA_DEADZONE_X: 100,
  CAMERA_DEADZONE_Y: 50,
  CLEANUP_FREQUENCY: 60, // Clean up arrays every N frames (~1 second at 60fps)

  // Timing delays (milliseconds)
  INIT_DELAY_SHORT: 50,
  INIT_DELAY_MEDIUM: 200,
  INIT_DELAY_MEDIUM_LONG: 300,
  INIT_DELAY_LONG: 500,
  INIT_DELAY_VERY_LONG: 1000,
  INIT_DELAY_EXTRA_LONG: 3000,
} as const;

