import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StoryManager } from '../../../src/systems/story/StoryManager';

const makeScene = () => {
  const s = new (global.Phaser as any).Scene();
  s.scene = {
    key: 'GameScene',
    pause: vi.fn(),
    resume: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    launch: vi.fn(),
    isActive: vi.fn(() => false),
  };
  s.children = { list: [], bringToTop: vi.fn() };
  // Enrich container mock with methods StoryManager calls
  s.add.container = vi.fn(() => ({
    add: vi.fn().mockReturnThis(),
    setDepth: vi.fn().mockReturnThis(),
    setVisible: vi.fn().mockReturnThis(),
    setActive: vi.fn().mockReturnThis(),
    setScrollFactor: vi.fn().mockReturnThis(),
    setPosition: vi.fn().mockReturnThis(),
    destroy: vi.fn(),
    list: [],
  }));
  return s;
};

describe('StoryManager', () => {
  let mockScene: any;
  let sm: StoryManager;

  beforeEach(() => {
    vi.mocked(localStorage.getItem).mockReturnValue(null);
    vi.mocked(localStorage.setItem).mockClear();
    mockScene = makeScene();
    sm = new StoryManager(mockScene);
  });

  describe('setFlag / getFlag', () => {
    it('sets and retrieves a flag', () => {
      sm.setFlag('boss_defeated', true);
      expect(sm.getFlag('boss_defeated')).toBe(true);
    });

    it('returns false for flags that were never set', () => {
      expect(sm.getFlag('unknown_flag')).toBe(false);
    });

    it('persists flags to localStorage', () => {
      sm.setFlag('intro_seen', true);
      expect(localStorage.setItem).toHaveBeenCalled();
    });

    it('can overwrite a flag value', () => {
      sm.setFlag('test', true);
      sm.setFlag('test', false);
      expect(sm.getFlag('test')).toBe(false);
    });
  });

  describe('registerCutscene / getCutscene', () => {
    it('registers and retrieves a cutscene by id', () => {
      const cs = { id: 'test', type: 'narrative', scenes: [] };
      sm.registerCutscene('test', () => cs as any);
      expect(sm.getCutscene('test')).toEqual(cs);
    });

    it('returns null for unregistered id', () => {
      expect(sm.getCutscene('ghost')).toBeNull();
    });

    it('calls the factory each time (fresh object)', () => {
      let calls = 0;
      sm.registerCutscene('c1', () => { calls++; return { id: 'c1', scenes: [] } as any; });
      sm.getCutscene('c1');
      sm.getCutscene('c1');
      expect(calls).toBe(2);
    });
  });

  describe('setCharacter', () => {
    it('does not throw for any character name', () => {
      expect(() => sm.setCharacter('DARIO')).not.toThrow();
      expect(() => sm.setCharacter('sarah')).not.toThrow();
    });
  });

  describe('setSceneIndex / getSceneIndex', () => {
    it('stores the index and returns it incremented by 1', () => {
      sm.setSceneIndex(2);
      // getSceneIndex returns currentSceneIndex + 1 where currentSceneIndex = 2
      expect(sm.getSceneIndex()).toBe(3);
    });

    it('defaults to 1 (index 0 + 1) on fresh construction', () => {
      expect(sm.getSceneIndex()).toBe(1);
    });
  });

  describe('isCutscenePlaying', () => {
    it('returns false initially', () => {
      expect(sm.isCutscenePlaying()).toBe(false);
    });
  });

  describe('loadFlags from localStorage', () => {
    it('loads saved flags on construction', () => {
      vi.mocked(localStorage.getItem).mockImplementation((key: string) => {
        if (key === 'streetMelee_flags') return JSON.stringify({ saved_flag: true });
        if (key === 'streetMelee_viewedCutscenes') return JSON.stringify(['seen_cs']);
        return null;
      });
      const sm2 = new StoryManager(mockScene);
      expect(sm2.getFlag('saved_flag')).toBe(true);
    });

    it('handles corrupt localStorage data without throwing', () => {
      vi.mocked(localStorage.getItem).mockReturnValue('{broken json');
      expect(() => new StoryManager(mockScene)).not.toThrow();
    });
  });

  describe('checkAndTriggerCutscenes', () => {
    it('does nothing when registry is empty', () => {
      expect(() => sm.checkAndTriggerCutscenes()).not.toThrow();
    });

    it('ignores a second call while a cutscene is still playing', () => {
      // Use a duration-based scene so playScene queues a timer (mocked) without
      // calling createDialogueBox or pausing the GameScene.
      const cs = {
        id: 'visited',
        type: 'narrative',
        repeatable: false,
        scenes: [{ duration: 0.001 }], // duration path → scene.time.delayedCall (mocked)
      };
      sm.registerCutscene('visited', () => cs as any);

      sm.checkAndTriggerCutscenes(); // starts the cutscene
      expect(sm.isCutscenePlaying()).toBe(true);

      // A second call while playing should be silently ignored
      sm.checkAndTriggerCutscenes();
      // No assertions beyond "it does not throw"
    });
  });

  describe('update', () => {
    it('returns cleanly when no cutscene is active', () => {
      expect(() => sm.update()).not.toThrow();
    });
  });
});
