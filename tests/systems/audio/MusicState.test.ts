import { describe, it, expect } from 'vitest';
import { MusicContext, MUSIC_PRIORITY, MUSIC_TRANSITIONS } from '../../../src/systems/audio/MusicState';

describe('MusicState', () => {
  describe('MusicContext enum', () => {
    it('has expected string values', () => {
      expect(MusicContext.MENU).toBe('menu');
      expect(MusicContext.GAMEPLAY).toBe('gameplay');
      expect(MusicContext.BOSS).toBe('boss');
      expect(MusicContext.PAUSE).toBe('pause');
      expect(MusicContext.DIALOGUE).toBe('dialogue');
      expect(MusicContext.NONE).toBe('none');
      expect(MusicContext.VICTORY).toBe('victory');
      expect(MusicContext.GAME_OVER).toBe('game_over');
    });
  });

  describe('MUSIC_PRIORITY', () => {
    it('covers all MusicContext values', () => {
      Object.values(MusicContext).forEach(ctx => {
        expect(MUSIC_PRIORITY[ctx]).toBeDefined();
        expect(typeof MUSIC_PRIORITY[ctx]).toBe('number');
      });
    });

    it('PAUSE and GAME_OVER share the highest priority', () => {
      expect(MUSIC_PRIORITY[MusicContext.PAUSE]).toBe(MUSIC_PRIORITY[MusicContext.GAME_OVER]);
      expect(MUSIC_PRIORITY[MusicContext.PAUSE]).toBeGreaterThan(MUSIC_PRIORITY[MusicContext.BOSS]);
    });

    it('VICTORY outranks BOSS and CUTSCENE', () => {
      expect(MUSIC_PRIORITY[MusicContext.VICTORY]).toBeGreaterThan(MUSIC_PRIORITY[MusicContext.BOSS]);
      expect(MUSIC_PRIORITY[MusicContext.VICTORY]).toBeGreaterThan(MUSIC_PRIORITY[MusicContext.CUTSCENE]);
    });

    it('BOSS outranks GAMEPLAY', () => {
      expect(MUSIC_PRIORITY[MusicContext.BOSS]).toBeGreaterThan(MUSIC_PRIORITY[MusicContext.GAMEPLAY]);
    });

    it('GAMEPLAY outranks MENU', () => {
      expect(MUSIC_PRIORITY[MusicContext.GAMEPLAY]).toBeGreaterThan(MUSIC_PRIORITY[MusicContext.MENU]);
    });

    it('NONE has the lowest priority', () => {
      const min = Math.min(...Object.values(MUSIC_PRIORITY));
      expect(MUSIC_PRIORITY[MusicContext.NONE]).toBe(min);
    });
  });

  describe('MUSIC_TRANSITIONS', () => {
    it('covers all MusicContext values', () => {
      Object.values(MusicContext).forEach(ctx => {
        expect(MUSIC_TRANSITIONS[ctx]).toBeDefined();
      });
    });

    it('every transition has required fields', () => {
      Object.values(MUSIC_TRANSITIONS).forEach(t => {
        expect(typeof t.fadeOut).toBe('boolean');
        expect(typeof t.fadeOutDuration).toBe('number');
        expect(typeof t.fadeIn).toBe('boolean');
        expect(typeof t.fadeInDuration).toBe('number');
        expect(typeof t.stopPrevious).toBe('boolean');
      });
    });

    it('DIALOGUE uses duck instead of stopping music', () => {
      const t = MUSIC_TRANSITIONS[MusicContext.DIALOGUE];
      expect(t.duck).toBeDefined();
      expect(t.stopPrevious).toBe(false);
    });

    it('PAUSE uses duck instead of stopping music', () => {
      const t = MUSIC_TRANSITIONS[MusicContext.PAUSE];
      expect(t.duck).toBeDefined();
      expect(t.stopPrevious).toBe(false);
    });

    it('BOSS stops previous quickly (≤ 300 ms fade)', () => {
      const t = MUSIC_TRANSITIONS[MusicContext.BOSS];
      expect(t.stopPrevious).toBe(true);
      expect(t.fadeOutDuration).toBeLessThanOrEqual(300);
    });

    it('GAMEPLAY fades in and fades out previous', () => {
      const t = MUSIC_TRANSITIONS[MusicContext.GAMEPLAY];
      expect(t.fadeOut).toBe(true);
      expect(t.fadeIn).toBe(true);
      expect(t.stopPrevious).toBe(true);
    });
  });
});
