/**
 * Music context types - defines different music states
 */
export enum MusicContext {
  MENU = 'menu',
  GAMEPLAY = 'gameplay',
  BOSS = 'boss',
  CUTSCENE = 'cutscene',
  DIALOGUE = 'dialogue',
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
  [MusicContext.GAMEPLAY]: {
    fadeOut: true,
    fadeOutDuration: 500,
    fadeIn: true,
    fadeInDuration: 1000,
    stopPrevious: true
  },
  [MusicContext.BOSS]: {
    fadeOut: true,
    fadeOutDuration: 300,
    fadeIn: true,
    fadeInDuration: 800,
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
    fadeOut: true,
    fadeOutDuration: 300,
    fadeIn: true,
    fadeInDuration: 500,
    stopPrevious: true
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
 * Music context priority - higher priority can interrupt lower priority
 */
export const MUSIC_PRIORITY: Record<MusicContext, number> = {
  [MusicContext.BOSS]: 5,
  [MusicContext.CUTSCENE]: 4,
  [MusicContext.DIALOGUE]: 3,
  [MusicContext.GAMEPLAY]: 2,
  [MusicContext.MENU]: 1,
  [MusicContext.GAME_OVER]: 1,
  [MusicContext.NONE]: 0
};

