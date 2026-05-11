import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AudioManager } from '../../../src/systems/audio/AudioManager';
import { MusicContext } from '../../../src/systems/audio/MusicState';

const makeScene = () => {
  const scene = new (global.Phaser as any).Scene();
  scene.cache = { audio: { exists: vi.fn(() => false) } };
  scene.sound.get = vi.fn(() => null);
  scene.sound.stopAll = vi.fn();
  scene.sound.stop = vi.fn();
  return scene;
};

describe('AudioManager', () => {
  let mockScene: any;
  let audio: AudioManager;

  beforeEach(() => {
    vi.mocked(localStorage.getItem).mockReturnValue(null);
    mockScene = makeScene();
    audio = new AudioManager(mockScene);
  });

  describe('loadSettings from localStorage', () => {
    it('uses defaults when nothing is stored', () => {
      expect(audio.getMusicVolume()).toBe(0.5);
      expect(audio.getSFXVolume()).toBe(0.7);
      expect(audio.isMusicEnabled()).toBe(true);
      expect(audio.isSFXEnabled()).toBe(true);
    });

    it('loads saved settings', () => {
      const settings = { musicVolume: 0.3, sfxVolume: 0.4, musicEnabled: false, sfxEnabled: false };
      vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(settings));
      const a = new AudioManager(mockScene);
      expect(a.getMusicVolume()).toBe(0.3);
      expect(a.getSFXVolume()).toBe(0.4);
      expect(a.isMusicEnabled()).toBe(false);
      expect(a.isSFXEnabled()).toBe(false);
    });

    it('handles corrupt settings JSON gracefully', () => {
      vi.mocked(localStorage.getItem).mockReturnValue('{bad json');
      expect(() => new AudioManager(mockScene)).not.toThrow();
    });
  });

  describe('setMusicVolume', () => {
    it('clamps to [0, 1]', () => {
      audio.setMusicVolume(2.0);
      expect(audio.getMusicVolume()).toBe(1.0);
      audio.setMusicVolume(-0.5);
      expect(audio.getMusicVolume()).toBe(0.0);
    });

    it('sets exact value within range', () => {
      audio.setMusicVolume(0.6);
      expect(audio.getMusicVolume()).toBe(0.6);
    });
  });

  describe('setSFXVolume', () => {
    it('clamps to [0, 1]', () => {
      audio.setSFXVolume(5.0);
      expect(audio.getSFXVolume()).toBe(1.0);
      audio.setSFXVolume(-1.0);
      expect(audio.getSFXVolume()).toBe(0.0);
    });

    it('sets exact value within range', () => {
      audio.setSFXVolume(0.4);
      expect(audio.getSFXVolume()).toBe(0.4);
    });
  });

  describe('setMusicEnabled', () => {
    it('disables music', () => {
      audio.setMusicEnabled(false);
      expect(audio.isMusicEnabled()).toBe(false);
    });

    it('re-enables music', () => {
      audio.setMusicEnabled(false);
      audio.setMusicEnabled(true);
      expect(audio.isMusicEnabled()).toBe(true);
    });
  });

  describe('setSFXEnabled', () => {
    it('disables SFX', () => {
      audio.setSFXEnabled(false);
      expect(audio.isSFXEnabled()).toBe(false);
    });

    it('re-enables SFX', () => {
      audio.setSFXEnabled(false);
      audio.setSFXEnabled(true);
      expect(audio.isSFXEnabled()).toBe(true);
    });
  });

  describe('initial state', () => {
    it('getCurrentMusic returns null', () => {
      expect(audio.getCurrentMusic()).toBeNull();
    });

    it('getCurrentMusicContext returns NONE', () => {
      expect(audio.getCurrentMusicContext()).toBe(MusicContext.NONE);
    });

    it('getMusicState reflects no active track', () => {
      const s = audio.getMusicState();
      expect(s.context).toBe(MusicContext.NONE);
      expect(s.isPlaying).toBe(false);
    });

    it('isDucked returns false', () => {
      expect(audio.isDucked()).toBe(false);
    });

    it('isMusicPlaying returns false for any context', () => {
      expect(audio.isMusicPlaying(MusicContext.GAMEPLAY)).toBe(false);
      expect(audio.isMusicPlaying(MusicContext.BOSS)).toBe(false);
    });
  });

  describe('stopMusic', () => {
    it('does not throw when nothing is playing', () => {
      expect(() => audio.stopMusic()).not.toThrow();
      expect(() => audio.stopMusic(true, 500)).not.toThrow();
    });
  });

  describe('pauseMusic / resumeMusic', () => {
    it('does not throw when nothing is playing', () => {
      expect(() => audio.pauseMusic()).not.toThrow();
      expect(() => audio.resumeMusic()).not.toThrow();
    });
  });

  describe('duckMusic / unduckMusic', () => {
    it('does not throw when nothing is playing', () => {
      expect(() => audio.duckMusic(0.3, 200)).not.toThrow();
    });

    it('unduckMusic resets isMusicDucked when nothing is playing', () => {
      audio.unduckMusic(200);
      expect(audio.isDucked()).toBe(false);
    });
  });

  describe('playMusicWithContext — priority guard', () => {
    it('does not change context when audio cache is empty', () => {
      mockScene.cache.audio.exists.mockReturnValue(false);
      audio.playMusicWithContext('main_theme', MusicContext.GAMEPLAY);
      // Music not in cache → context unchanged
      expect(audio.getCurrentMusicContext()).toBe(MusicContext.NONE);
    });
  });

  describe('playSound', () => {
    it('does nothing when SFX is disabled', () => {
      audio.setSFXEnabled(false);
      audio.playSound('punch');
      expect(mockScene.sound.add).not.toHaveBeenCalled();
    });

    it('does not throw for an unknown sound key', () => {
      expect(() => audio.playSound('totally_unknown_sound_xyz')).not.toThrow();
    });
  });

  describe('stopPauseAmbient', () => {
    it('does not throw when nothing is playing', () => {
      expect(() => audio.stopPauseAmbient()).not.toThrow();
    });
  });

  describe('destroy', () => {
    it('cleans up without throwing', () => {
      expect(() => audio.destroy()).not.toThrow();
    });
  });
});
