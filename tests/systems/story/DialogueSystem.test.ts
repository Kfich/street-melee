import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DialogueSystem } from '../../../src/systems/story/DialogueSystem';

const makeCutscene = (id: string, conditions?: any) => ({
  id,
  type: 'dialogue',
  scenes: [{ dialogue: [{ text: 'Hello' }] }],
  repeatable: false,
  conditions,
});

describe('DialogueSystem', () => {
  let mockStoryManager: any;
  let system: DialogueSystem;

  beforeEach(() => {
    mockStoryManager = { playCutscene: vi.fn() };
    system = new DialogueSystem(mockStoryManager);
  });

  describe('registerDialogue / triggerDialogue', () => {
    it('triggers a registered dialogue via playCutscene', () => {
      const cs = makeCutscene('intro');
      system.registerDialogue('intro', () => cs);
      system.triggerDialogue('intro');
      expect(mockStoryManager.playCutscene).toHaveBeenCalledWith(cs);
    });

    it('does not throw for an unregistered dialogue id', () => {
      expect(() => system.triggerDialogue('nonexistent')).not.toThrow();
    });

    it('does not call playCutscene for unregistered id', () => {
      system.triggerDialogue('nonexistent');
      expect(mockStoryManager.playCutscene).not.toHaveBeenCalled();
    });
  });

  describe('checkAndTriggerDialogue', () => {
    it('triggers dialogue with matching scene index', () => {
      const cs = makeCutscene('level1_start', { scene_index: 1 });
      system.registerDialogue('level1_start', () => cs);
      system.checkAndTriggerDialogue(1, new Map());
      expect(mockStoryManager.playCutscene).toHaveBeenCalledWith(cs);
    });

    it('does not trigger when scene index does not match', () => {
      const cs = makeCutscene('level1_start', { scene_index: 1 });
      system.registerDialogue('level1_start', () => cs);
      system.checkAndTriggerDialogue(2, new Map());
      expect(mockStoryManager.playCutscene).not.toHaveBeenCalled();
    });

    it('respects required flags — does not trigger without flag', () => {
      const cs = makeCutscene('boss_talk', { flags: { boss_met: true } });
      system.registerDialogue('boss_talk', () => cs);
      system.checkAndTriggerDialogue(1, new Map());
      expect(mockStoryManager.playCutscene).not.toHaveBeenCalled();
    });

    it('triggers when required flag is set', () => {
      const cs = makeCutscene('boss_talk', { flags: { boss_met: true } });
      system.registerDialogue('boss_talk', () => cs);
      system.checkAndTriggerDialogue(1, new Map([['boss_met', true]]));
      expect(mockStoryManager.playCutscene).toHaveBeenCalledWith(cs);
    });

    it('triggers dialogue with no conditions', () => {
      const cs = makeCutscene('always_play');
      system.registerDialogue('always_play', () => cs);
      system.checkAndTriggerDialogue(1, new Map());
      expect(mockStoryManager.playCutscene).toHaveBeenCalledWith(cs);
    });

    it('only triggers one dialogue at a time (breaks after first)', () => {
      const c1 = makeCutscene('d1');
      const c2 = makeCutscene('d2');
      system.registerDialogue('d1', () => c1);
      system.registerDialogue('d2', () => c2);
      system.checkAndTriggerDialogue(1, new Map());
      expect(mockStoryManager.playCutscene).toHaveBeenCalledTimes(1);
    });
  });
});
