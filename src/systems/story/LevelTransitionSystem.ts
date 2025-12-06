import { StoryManager } from './StoryManager';
import { create_level_transition_cutscene } from './DialogueBuilder';

/**
 * Level transition data
 */
export interface LevelTransitionData {
  levelIndex: number;
  title: string;
  summary: string;
  background?: string;
}

/**
 * Level Transition System - Manages level transition screens
 */
export class LevelTransitionSystem {
  private storyManager: StoryManager;
  private transitions: Map<number, LevelTransitionData> = new Map();

  constructor(storyManager: StoryManager) {
    this.storyManager = storyManager;
    this.initializeDefaultTransitions();
  }

  /**
   * Initialize default level transitions
   */
  private initializeDefaultTransitions(): void {
    // Level 1 -> Level 2
    this.addTransition(1, {
      levelIndex: 1,
      title: 'LEVEL 2',
      summary: 'DARIO FIGHTS FOR LOVE',
    });

    // Level 2 -> Level 3
    this.addTransition(2, {
      levelIndex: 2,
      title: 'LEVEL 3',
      summary: 'DARIO GOES TO JAIL FOR LOVE',
    });

    // Level 3 -> Level 4
    this.addTransition(3, {
      levelIndex: 3,
      title: 'LEVEL 4',
      summary: 'DARIO GETS THE GIRL',
    });
  }

  /**
   * Add a level transition
   */
  addTransition(levelIndex: number, data: LevelTransitionData): void {
    this.transitions.set(levelIndex, data);
    
    // Register cutscene
    this.storyManager.registerCutscene(
      `level_transition_${levelIndex}`,
      () => create_level_transition_cutscene(
        `level_transition_${levelIndex}`,
        `Level ${levelIndex + 1} Transition`,
        levelIndex,
        {
          title: data.title,
          summary: data.summary,
          background: data.background,
        }
      )
    );
  }

  /**
   * Show level transition for completed level
   */
  showTransition(levelIndex: number): void {
    const transition = this.transitions.get(levelIndex);
    if (!transition) {
      console.warn(`[LevelTransitionSystem] No transition found for level ${levelIndex}`);
      return;
    }

    const cutscene = this.storyManager.getCutscene(`level_transition_${levelIndex}`);
    if (cutscene) {
      this.storyManager.playCutscene(cutscene);
    }
  }

  /**
   * Check if transition should be shown (called when level completes)
   */
  shouldShowTransition(completedLevelIndex: number, totalLevels: number): boolean {
    // Show transition if there's a next level
    return completedLevelIndex < totalLevels - 1;
  }
}

