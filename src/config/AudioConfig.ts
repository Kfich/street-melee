/**
 * Audio configuration - maps sound effect and music names to file paths
 * This makes it easy to add new sounds without changing code
 */

export interface SoundEffectConfig {
  key: string;
  path: string;
  /** Optional alternate-format fallback path (e.g. .mp3 when path is .ogg). */
  fallbackPath?: string;
  volume?: number; // Optional default volume (0-1)
}

export interface MusicTrackConfig {
  key: string;
  path: string;
  /** Optional alternate-format fallback path (e.g. .mp3 when path is .ogg). */
  fallbackPath?: string;
  volume?: number; // Optional default volume (0-1)
  /** Phase 2 stem layering hook — not used by Phase 1. */
  stems?: {
    drums: string;
    bass: string;
    lead: string;
    leadIntense?: string;
  };
  /** Loop start sample, for assets that ship explicit loop points. */
  loopStart?: number;
  /** Loop end sample, for assets that ship explicit loop points. */
  loopEnd?: number;
  /** Track BPM (informational; used for future tempo-matched transitions). */
  bpm?: number;
  /** Whether this track is intended to loop. Defaults to true at play sites. */
  loop?: boolean;
}

/**
 * Sound effect mappings
 * Add new sounds here to make them available in the game
 */
export const SOUND_EFFECTS: Record<string, SoundEffectConfig> = {
  // Combat sounds
  punch: {
    key: 'punch',
    path: 'assets/sounds/8-bit-impact.mp3',
    volume: 0.8
  },
  kick: {
    key: 'kick',
    path: 'assets/sounds/8-bit-impact.mp3', // Reuse impact for now
    volume: 0.8
  },
  hit: {
    key: 'hit',
    path: 'assets/sounds/8-bit-impact.mp3',
    volume: 0.7
  },
  enemyHit: {
    key: 'enemyHit',
    path: 'assets/sounds/8-bit-impact.mp3',
    volume: 0.7
  },
  knockdown: {
    key: 'knockdown',
    path: 'assets/sounds/8-bit-impact.mp3',
    volume: 0.9
  },
  
  // Movement sounds
  jump: {
    key: 'jump',
    path: 'assets/sounds/8-bit-jump.mp3',
    volume: 0.6
  },
  
  // Special moves
  special: {
    key: 'special',
    path: 'assets/sounds/8-bit-fireball.mp3',
    volume: 0.8
  },
  fireball: {
    key: 'fireball',
    path: 'assets/sounds/8-bit-fireball.mp3',
    volume: 0.7
  },
  fireballExplode: {
    key: 'fireballExplode',
    path: 'assets/sounds/8-bit-fireball-explode.mp3',
    volume: 0.8
  },
  
  // Combat actions
  throw: {
    key: 'throw',
    path: 'assets/sounds/8-bit-whistle.mp3',
    volume: 0.6
  },
  grab: {
    key: 'grab',
    path: 'assets/sounds/8-bit-impact.mp3',
    volume: 0.7
  },
  weaponHit: {
    key: 'weaponHit',
    path: 'assets/sounds/8-bit-impact.mp3',
    volume: 0.8
  },
  
  // Items
  itemPickup: {
    key: 'itemPickup',
    path: 'assets/sounds/8-bit-item-collect.mp3',
    volume: 0.7
  },
  healthRestore: {
    key: 'healthRestore',
    path: 'assets/sounds/8-bit-item-collect.mp3', // Shares the item collect asset
    volume: 0.8
  },
  levelUp: {
    key: 'levelUp',
    path: 'assets/sounds/8-bit-level-up.mp3',
    volume: 0.8
  },
  levelAdvance: {
    key: 'levelAdvance',
    path: 'assets/sounds/8-bit-level-advance.mp3',
    volume: 0.8
  },
  
  // UI sounds
  menuSelect: {
    key: 'menuSelect',
    path: 'assets/sounds/8-bit-menu-item-select.mp3',
    volume: 0.6
  },
  menuBack: {
    key: 'menuBack',
    path: 'assets/sounds/8-bit-menu-item-select.mp3', // Reuse select for now
    volume: 0.5
  },
  menuAdvance: {
    key: 'menuAdvance',
    path: 'assets/sounds/8-bit-menu-item-select.mp3',
    volume: 0.6
  },
  menuError: {
    key: 'menuError',
    path: 'assets/sounds/8-bit-menu-item-select.mp3',
    volume: 0.4
  },
  gameOver: {
    key: 'gameOver',
    path: 'assets/sounds/8-bit-gameover.mp3',
    volume: 0.7
  },
  gameOverScreen: {
    key: 'gameOverScreen',
    path: 'assets/sounds/8-bit-gameover-screen.mp3',
    volume: 0.7
  },
  continue: {
    key: 'continue',
    path: 'assets/sounds/continue.mp3',
    volume: 0.7
  },
  
  // Environmental sounds
  policeSiren: {
    key: 'policeSiren',
    path: 'assets/sounds/police-siren.mp3',
    volume: 0.5
  },
  prisonSiren: {
    key: 'prisonSiren',
    path: 'assets/sounds/prison-siren.mp3',
    volume: 0.5
  },

  // Phase 1 stingers (OGG primary + MP3 fallback)
  sting_wave_clear: {
    key: 'sting_wave_clear',
    path: 'assets/sounds/stingers/sting_wave_clear.ogg',
    fallbackPath: 'assets/sounds/stingers/sting_wave_clear.mp3',
    volume: 0.9
  },
  sting_boss_defeat: {
    key: 'sting_boss_defeat',
    path: 'assets/sounds/stingers/sting_boss_defeat.ogg',
    fallbackPath: 'assets/sounds/stingers/sting_boss_defeat.mp3',
    volume: 0.95
  },
  sting_level_clear: {
    key: 'sting_level_clear',
    path: 'assets/sounds/stingers/sting_level_clear.ogg',
    fallbackPath: 'assets/sounds/stingers/sting_level_clear.mp3',
    volume: 0.95
  },
  sting_menu_confirm: {
    key: 'sting_menu_confirm',
    path: 'assets/sounds/stingers/sting_menu_confirm.ogg',
    fallbackPath: 'assets/sounds/stingers/sting_menu_confirm.mp3',
    volume: 0.8
  }
};

/**
 * Music track mappings
 * Add new music tracks here
 */
export const MUSIC_TRACKS: Record<string, MusicTrackConfig> = {
  menu: {
    key: 'menu',
    path: 'assets/music/8-bit-menu-song.mp3',
    volume: 0.6
  },
  level1: {
    key: 'level1',
    path: 'assets/music/game-song-mix.mp3',
    volume: 0.5
  },
  level2: {
    key: 'level2',
    path: 'assets/music/dario-theme.mp3',
    volume: 0.5
  },
  boss: {
    key: 'boss',
    path: 'assets/music/8-bit-boss-fight-song.mp3',
    volume: 0.6
  },
  bossFight: {
    key: 'bossFight',
    path: 'assets/music/boss-fight-song.mp3',
    volume: 0.6
  },
  dialogue: {
    key: 'dialogue',
    path: 'assets/music/8-bit-dialogue-song.mp3',
    volume: 0.4
  },

  // Phase 1 UI loops (OGG primary + MP3 fallback)
  menu_character_select: {
    key: 'menu_character_select',
    path: 'assets/music/ui/menu_character_select.ogg',
    fallbackPath: 'assets/music/ui/menu_character_select.mp3',
    volume: 0.75,
    bpm: 120,
    loop: true,
    loopStart: 0,
    loopEnd: 2116800
  },
  pause_ambient: {
    key: 'pause_ambient',
    path: 'assets/music/ui/pause_ambient.ogg',
    fallbackPath: 'assets/music/ui/pause_ambient.mp3',
    volume: 0.35,
    bpm: 80,
    loop: true,
    loopStart: 0,
    loopEnd: 1323000
  }
};

/**
 * Get sound effect config by key
 */
export function getSoundEffect(key: string): SoundEffectConfig | undefined {
  return SOUND_EFFECTS[key];
}

/**
 * Get music track config by key
 */
export function getMusicTrack(key: string): MusicTrackConfig | undefined {
  return MUSIC_TRACKS[key];
}

/**
 * Get all sound effect keys
 */
export function getAllSoundEffectKeys(): string[] {
  return Object.keys(SOUND_EFFECTS);
}

/**
 * Get all music track keys
 */
export function getAllMusicTrackKeys(): string[] {
  return Object.keys(MUSIC_TRACKS);
}

