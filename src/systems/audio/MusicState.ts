/**
 * Music context types - defines different music states
 */
export enum MusicContext {
  MENU = 'menu',
  CHARACTER_SELECT = 'character_select',
  GAMEPLAY = 'gameplay',
  BOSS = 'boss',
  VICTORY = 'victory',
  LEVEL_COMPLETE = 'level_complete',
  CUTSCENE = 'cutscene',
  DIALOGUE = 'dialogue',
  PAUSE = 'pause',
  GAME_OVER = 'game_over',
  NONE = 'none'
}

/**
 * Music state information
 */
export interface MusicState {
  context: MusicContext;
  trackKey: string;
  isPlaying: boolean;
  shouldLoop: boolean;
}

/**
 * Music transition configuration
 */
export interface MusicTransition {
  fadeOut: boolean;
  fadeOutDuration: number;
  fadeIn: boolean;
  fadeInDuration: number;
  stopPrevious: boolean;
  /**
   * When set, the new context does not start fresh music; instead the current
   * music is ducked to `volume` over `duration` ms. Used by DIALOGUE and PAUSE
   * so combat music keeps the moment grounded under overlays.
   */
  duck?: {
    volume: number;
    duration: number;
  };
}

/**
 * Default music transitions for different contexts
 */
export const MUSIC_TRANSITIONS: Record<MusicContext, MusicTransition> = {
  [MusicContext.MENU]: {
    fadeOut: true,
    fadeOutDuration: 500,
    fadeIn: true,
    fadeInDuration: 1000,
    stopPrevious: true
  },
  [MusicContext.CHARACTER_SELECT]: {
    fadeOut: true,
    fadeOutDuration: 400,
    fadeIn: true,
    fadeInDuration: 600,
    stopPrevious: true
  },
  [MusicContext.GAMEPLAY]: {
    fadeOut: true,
    fadeOutDuration: 500,
    fadeIn: true,
    fadeInDuration: 1000,
    stopPrevious: true
  },
  [MusicContext.BOSS]: {
    fadeOut: true,
    fadeOutDuration: 200,
    fadeIn: true,
    fadeInDuration: 250,
    stopPrevious: true
  },
  [MusicContext.VICTORY]: {
    fadeOut: true,
    fadeOutDuration: 200,
    fadeIn: false,
    fadeInDuration: 0,
    stopPrevious: true
  },
  [MusicContext.LEVEL_COMPLETE]: {
    fadeOut: true,
    fadeOutDuration: 400,
    fadeIn: true,
    fadeInDuration: 600,
    stopPrevious: true
  },
  [MusicContext.CUTSCENE]: {
    fadeOut: true,
    fadeOutDuration: 500,
    fadeIn: true,
    fadeInDuration: 1000,
    stopPrevious: true
  },
  [MusicContext.DIALOGUE]: {
    fadeOut: false,
    fadeOutDuration: 0,
    fadeIn: false,
    fadeInDuration: 0,
    stopPrevious: false,
    duck: {
      volume: 0.3,
      duration: 200
    }
  },
  [MusicContext.PAUSE]: {
    fadeOut: false,
    fadeOutDuration: 0,
    fadeIn: true,
    fadeInDuration: 250,
    stopPrevious: false,
    duck: {
      volume: 0.2,
      duration: 200
    }
  },
  [MusicContext.GAME_OVER]: {
    fadeOut: false,
    fadeOutDuration: 0,
    fadeIn: false,
    fadeInDuration: 0,
    stopPrevious: true
  },
  [MusicContext.NONE]: {
    fadeOut: true,
    fadeOutDuration: 500,
    fadeIn: false,
    fadeInDuration: 0,
    stopPrevious: true
  }
};

/**
 * Music context priority - higher priority can interrupt lower priority.
 *
 * - PAUSE / GAME_OVER are top so unpause and final-screen transitions always win.
 * - VICTORY (boss-defeat sting) sits above BOSS / CUTSCENE so the sting punches
 *   through combat music cleanly.
 * - LEVEL_COMPLETE sits above GAMEPLAY but below combat/cutscene contexts.
 */
export const MUSIC_PRIORITY: Record<MusicContext, number> = {
  [MusicContext.PAUSE]: 7,
  [MusicContext.GAME_OVER]: 7,
  [MusicContext.VICTORY]: 6,
  [MusicContext.BOSS]: 5,
  [MusicContext.CUTSCENE]: 5,
  [MusicContext.DIALOGUE]: 5,
  [MusicContext.LEVEL_COMPLETE]: 4,
  [MusicContext.GAMEPLAY]: 3,
  [MusicContext.CHARACTER_SELECT]: 2,
  [MusicContext.MENU]: 1,
  [MusicContext.NONE]: 0
};
