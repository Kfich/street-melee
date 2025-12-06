import { StoryManager } from './StoryManager';

/**
 * In-Game Dialogue System - Manages real-time character dialogue
 */
export class DialogueSystem {
  private storyManager: StoryManager;
  private dialogueRegistry: Map<string, () => any> = new Map();

  constructor(storyManager: StoryManager) {
    this.storyManager = storyManager;
  }

  /**
   * Register a dialogue cutscene
   */
  registerDialogue(id: string, dialogueFactory: () => any): void {
    this.dialogueRegistry.set(id, dialogueFactory);
  }

  /**
   * Trigger a dialogue by ID
   */
  triggerDialogue(id: string): void {
    const factory = this.dialogueRegistry.get(id);
    if (factory) {
      const cutscene = factory();
      if (cutscene) {
        this.storyManager.playCutscene(cutscene);
      }
    } else {
      console.warn(`[DialogueSystem] Dialogue ${id} not found`);
    }
  }

  /**
   * Check and trigger dialogue based on game state
   */
  checkAndTriggerDialogue(sceneIndex: number, flags: Map<string, boolean>): void {
    // Check all registered dialogues
    for (const [_id, factory] of this.dialogueRegistry.entries()) {
      const cutscene = factory();
      if (cutscene && this.checkDialogueConditions(cutscene, sceneIndex, flags)) {
        this.storyManager.playCutscene(cutscene);
        break; // Only play one at a time
      }
    }
  }

  /**
   * Check if dialogue conditions are met
   */
  private checkDialogueConditions(cutscene: any, sceneIndex: number, flags: Map<string, boolean>): boolean {
    if (!cutscene.conditions) return true;

    // Check scene index
    if (cutscene.conditions.scene_index !== undefined) {
      if (sceneIndex !== cutscene.conditions.scene_index) {
        return false;
      }
    }

    // Check flags
    if (cutscene.conditions.flags) {
      for (const [flag, value] of Object.entries(cutscene.conditions.flags)) {
        if (flags.get(flag) !== value) {
          return false;
        }
      }
    }

    // Check requires_viewed
    if (cutscene.conditions.requires_viewed) {
      // This would need access to viewed cutscenes
      // For now, we'll skip this check here
    }

    return true;
  }
}

