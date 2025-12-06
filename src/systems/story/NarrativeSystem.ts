import { StoryManager } from './StoryManager';
import { create_narrative_cutscene } from './DialogueBuilder';

/**
 * Narrative data
 */
export interface NarrativeData {
  narrativeId: string;
  name: string;
  sceneIndex: number;
  sceneDialogueKey: string;
  options?: {
    requires_viewed?: string[];
    min_display_time?: number;
    auto_advance?: boolean;
    auto_advance_delay?: number;
    actions?: { set_flag?: Record<string, boolean> };
  };
}

/**
 * Scene Narrative System - Manages narrative cutscenes that explain game context
 */
export class NarrativeSystem {
  private storyManager: StoryManager;
  private narratives: Map<string, NarrativeData> = new Map();
  private sceneDialogue: Map<string, Map<string, string[]>> = new Map(); // character -> scene -> dialogue lines

  constructor(storyManager: StoryManager) {
    this.storyManager = storyManager;
    this.initializeDefaultNarratives();
  }

  /**
   * Initialize default narratives
   */
  private initializeDefaultNarratives(): void {
    // This will be populated from story data files
  }

  /**
   * Add a narrative
   */
  addNarrative(data: NarrativeData): void {
    this.narratives.set(data.narrativeId, data);

    // Register cutscene
    this.storyManager.registerCutscene(
      data.narrativeId,
      () => create_narrative_cutscene(
        data.narrativeId,
        data.name,
        data.sceneIndex,
        {
          scene_dialogue_key: data.sceneDialogueKey,
          requires_viewed: data.options?.requires_viewed,
          min_display_time: data.options?.min_display_time,
          auto_advance: data.options?.auto_advance,
          auto_advance_delay: data.options?.auto_advance_delay,
          actions: data.options?.actions,
        }
      )
    );
  }

  /**
   * Set scene dialogue for a character
   */
  setCharacterDialogue(character: string, sceneKey: string, dialogueLines: string[]): void {
    if (!this.sceneDialogue.has(character)) {
      this.sceneDialogue.set(character, new Map());
    }
    this.sceneDialogue.get(character)!.set(sceneKey, dialogueLines);
  }

  /**
   * Get scene dialogue for current character
   */
  getSceneDialogue(character: string, sceneKey: string): string {
    const characterDialogue = this.sceneDialogue.get(character);
    if (!characterDialogue) {
      return `[No dialogue for ${character} at scene ${sceneKey}]`;
    }

    const lines = characterDialogue.get(sceneKey);
    if (!lines || lines.length === 0) {
      return `[No dialogue for scene ${sceneKey}]`;
    }

    // Join lines with newlines
    return lines.join('\n');
  }

  /**
   * Check and trigger narrative for current scene
   */
  checkAndTriggerNarrative(sceneIndex: number, _character?: string): void {
    // Find narratives for this scene (narratives use 1-based scene index)
    const sceneIndex1Based = sceneIndex + 1;
    for (const [id, narrative] of this.narratives.entries()) {
      if (narrative.sceneIndex === sceneIndex1Based) {
        // Check if already viewed
        // This would be handled by StoryManager
        const cutscene = this.storyManager.getCutscene(id);
        if (cutscene) {
          this.storyManager.playCutscene(cutscene);
          break; // Only play one at a time
        }
      }
    }
  }
}

