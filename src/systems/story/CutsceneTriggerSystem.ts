/**
 * Cutscene Trigger System
 * Handles position-based and automatic cutscene triggers
 */

import { SCENE_BOSS_CONFIG } from '../../config/GameScenes';
import { StoryManager } from './StoryManager';

export class CutsceneTriggerSystem {
  private storyManager: StoryManager;
  private triggeredCutscenes: Set<string> = new Set();
  private sceneNumber: number = 1;

  constructor(storyManager: StoryManager) {
    this.storyManager = storyManager;
  }

  /**
   * Set current scene number (based on level/room)
   */
  setSceneNumber(sceneNumber: number): void {
    this.sceneNumber = sceneNumber;
  }

  /**
   * Get current scene number
   */
  getSceneNumber(): number {
    return this.sceneNumber;
  }

  /**
   * Check if a cutscene should be triggered based on player position
   */
  checkPositionTriggers(playerX: number): void {
    const sceneConfig = SCENE_BOSS_CONFIG[this.sceneNumber];
    
    if (!sceneConfig || !sceneConfig.cutsceneId) {
      return;
    }

    // Check if cutscene has already been triggered
    if (this.triggeredCutscenes.has(sceneConfig.cutsceneId)) {
      return;
    }

    // Check if this is a position-based trigger
    if (sceneConfig.triggerX !== undefined) {
      // Trigger when player reaches or passes the trigger X position
      if (playerX >= sceneConfig.triggerX) {
        this.triggerCutscene(sceneConfig.cutsceneId);
      }
    }
  }

  /**
   * Check for automatic triggers (cutscenes that trigger on scene load)
   */
  checkAutomaticTriggers(): void {
    const sceneConfig = SCENE_BOSS_CONFIG[this.sceneNumber];
    
    if (!sceneConfig || !sceneConfig.cutsceneId) {
      return;
    }

    // Check if cutscene has already been triggered
    if (this.triggeredCutscenes.has(sceneConfig.cutsceneId)) {
      return;
    }

    // Automatic triggers don't have triggerX (they trigger immediately)
    if (sceneConfig.triggerX === undefined) {
      // Use Phaser's time system instead of setTimeout for better integration
      // This will be called from GameScene with proper timing
      this.triggerCutscene(sceneConfig.cutsceneId!);
    }
  }

  /**
   * Trigger a cutscene
   */
  private triggerCutscene(cutsceneId: string): void {
    if (this.triggeredCutscenes.has(cutsceneId)) {
      return;
    }

    const cutscene = this.storyManager.getCutscene(cutsceneId);
    if (cutscene) {
      console.log(`[CutsceneTriggerSystem] Triggering cutscene: ${cutsceneId} at scene ${this.sceneNumber}`);
      this.storyManager.playCutscene(cutscene);
      this.triggeredCutscenes.add(cutsceneId);
    } else {
      console.warn(`[CutsceneTriggerSystem] Cutscene not found: ${cutsceneId}`);
    }
  }

  /**
   * Reset triggers for a new game/level
   */
  reset(): void {
    this.triggeredCutscenes.clear();
    this.sceneNumber = 1;
  }

  /**
   * Mark a cutscene as triggered (useful for loading saved games)
   */
  markTriggered(cutsceneId: string): void {
    this.triggeredCutscenes.add(cutsceneId);
  }

  /**
   * Check if a cutscene has been triggered
   */
  hasTriggered(cutsceneId: string): boolean {
    return this.triggeredCutscenes.has(cutsceneId);
  }
}

