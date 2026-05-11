import Phaser from 'phaser';
import { Cutscene, CutsceneScene, DialogueEntry } from './DialogueBuilder';
import { AudioManager } from '../audio/AudioManager';
import { MusicContext } from '../audio/MusicState';
import { getSceneDialogue } from './SceneDialogueData';

/**
 * Story Manager - Manages all storytelling systems
 */
export class StoryManager {
  private scene: Phaser.Scene;
  private audioManager?: AudioManager;
  private viewedCutscenes: Set<string> = new Set();
  private gameFlags: Map<string, boolean> = new Map();
  private currentCutscene: Cutscene | null = null;
  private currentSceneIndex: number = 0;
  private currentEntryIndex: number = 0;
  private cutsceneContainer?: Phaser.GameObjects.Container;
  private dialogueBox?: Phaser.GameObjects.Graphics;
  private dialogueText?: Phaser.GameObjects.Text;
  private speakerText?: Phaser.GameObjects.Text;
  private typewriterTimer?: Phaser.Time.TimerEvent;
  private isPlayingCutscene: boolean = false;
  private cutsceneRegistry: Map<string, () => Cutscene> = new Map();
  private currentCharacter: string = 'dario'; // Default character
  // True when this cutscene ducked the underlying combat music instead of
  // swapping the track; endCutscene uses this to know whether to unduck.
  private didDuckUnderlyingMusic: boolean = false;
  // Pending scene transition animation set by fadeIn()/fadeOut() and consumed
  // in createDialogueBox() / nextScene() respectively.
  private pendingTransition: 'fade_in' | 'fade_out' | null = null;
  private static readonly FADE_DURATION = 300;

  constructor(scene: Phaser.Scene, audioManager?: AudioManager) {
    this.scene = scene;
    this.audioManager = audioManager;
    this.loadFlags();
  }

  /**
   * Register a cutscene function
   */
  registerCutscene(id: string, cutsceneFactory: () => Cutscene): void {
    this.cutsceneRegistry.set(id, cutsceneFactory);
  }

  /**
   * Get a cutscene by ID
   */
  getCutscene(id: string): Cutscene | null {
    const factory = this.cutsceneRegistry.get(id);
    if (factory) {
      return factory();
    }
    return null;
  }

  /**
   * Check if cutscene conditions are met
   */
  private checkCutsceneConditions(cutscene: Cutscene): boolean {
    if (!cutscene.conditions) return true;

    // Check scene index (conditions use 1-based, we store 0-based internally)
    if (cutscene.conditions.scene_index !== undefined) {
      const currentSceneIndex1Based = this.currentSceneIndex + 1; // Convert to 1-based
      if (currentSceneIndex1Based !== cutscene.conditions.scene_index) {
        return false;
      }
    }

    // Check level index
    if (cutscene.conditions.level_index !== undefined) {
      // This would need to be passed in or tracked
      // For now, we'll skip this check
    }

    // Check flags
    if (cutscene.conditions.flags) {
      for (const [flag, value] of Object.entries(cutscene.conditions.flags)) {
        if (this.gameFlags.get(flag) !== value) {
          return false;
        }
      }
    }

    // Check requires_viewed
    if (cutscene.conditions.requires_viewed) {
      for (const requiredId of cutscene.conditions.requires_viewed) {
        if (!this.viewedCutscenes.has(requiredId)) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Play a cutscene
   */
  playCutscene(cutscene: Cutscene): void {
    if (this.isPlayingCutscene) {
      console.warn('[StoryManager] Cutscene already playing, ignoring request');
      return;
    }

    if (!this.checkCutsceneConditions(cutscene)) {
      return;
    }

    // Check if already viewed (unless repeatable)
    // For intro/outro, allow replaying (they're special)
    const isSpecialCutscene = cutscene.type === 'intro' || cutscene.type === 'outro';
    if (!cutscene.repeatable && !isSpecialCutscene && this.viewedCutscenes.has(cutscene.id)) {
      return;
    }

    this.currentCutscene = cutscene;
    this.currentSceneIndex = 0;
    this.currentEntryIndex = 0;
    this.isPlayingCutscene = true;

    // Mark as viewed (except for intro/outro which can be replayed)
    if (!isSpecialCutscene) {
      this.viewedCutscenes.add(cutscene.id);
      this.saveFlags();
    }

    // Only pause for dialogue / story-beat cutscenes — NOT for narrative, intro, outro,
    // or level_transition types.  Narrative overlays run while the game is live so
    // their auto_advance timers and the update() keyboard checks still work.
    if (cutscene.type === 'dialogue' || cutscene.type === 'story_beat') {
      if (this.scene.scene.key === 'GameScene') {
        this.scene.scene.pause('GameScene');
      }

      // In-gameplay dialogue ducking: when a dialogue cutscene fires on top of
      // GAMEPLAY or BOSS music, duck the underlying track to 0.3 instead of
      // letting the existing audio fight the dialogue VO. CUTSCENE / MENU /
      // CHARACTER_SELECT / etc. contexts keep their existing handling.
      if (this.audioManager) {
        const currentContext = this.audioManager.getCurrentMusicContext();
        const shouldDuck =
          currentContext === MusicContext.GAMEPLAY ||
          currentContext === MusicContext.BOSS;
        if (shouldDuck) {
          this.audioManager.duckMusic(0.3, 200);
          this.didDuckUnderlyingMusic = true;
        }
      }
    }

    // Start first scene
    this.playScene(cutscene.scenes[0]);
  }

  /**
   * Play a cutscene scene
   */
  private playScene(scene: CutsceneScene): void {
    // Handle background
    if (scene.background && scene.background !== 'current') {
      // Load background image if needed
      // For now, we'll use current background
    }

    // Handle music
    if (scene.music) {
      if (scene.music === 'fade_out') {
        if (this.audioManager) {
          this.audioManager.stopMusic(true);
        }
      } else if (typeof scene.music === 'object') {
        if (this.audioManager) {
          // Play music track
          // This would need to be implemented in AudioManager
        }
      }
    }

    // Handle camera — only for blocking cutscenes that own the camera.
    // Narrative/intro/outro overlays run while gameplay is live; touching setScroll
    // would teleport the camera away from the player.
    const isBlockingCutscene = this.currentCutscene?.type === 'dialogue' ||
                               this.currentCutscene?.type === 'story_beat';
    if (scene.camera && isBlockingCutscene) {
      const camera = this.scene.cameras.main;
      camera.setZoom(scene.camera.zoom);
      camera.setScroll(scene.camera.x, scene.camera.y);
    }

    // Handle transition
    if (scene.transition === 'fade_in') {
      this.fadeIn();
    } else if (scene.transition === 'fade_out') {
      this.fadeOut();
    }

    // Start dialogue
    if (scene.dialogue && scene.dialogue.length > 0) {
      this.currentEntryIndex = 0;
      this.playDialogueEntry(scene.dialogue[0]);
    } else if (scene.duration !== undefined) {
      // Just wait for duration
      this.scene.time.delayedCall(scene.duration * 1000, () => {
        this.nextScene();
      });
    }
  }

  /**
   * Play a dialogue entry
   */
  private playDialogueEntry(entry: DialogueEntry): void {
    if (!this.currentCutscene) return;

    const currentScene = this.currentCutscene.scenes[this.currentSceneIndex];
    if (!currentScene || !currentScene.dialogue) return;

    // Clear previous dialogue
    this.clearDialogue();

    // Get text (either from entry or scene dialogue)
    let text = entry.text || '';
    if (entry.scene_dialogue_key) {
      // Load character-specific dialogue
      text = this.getSceneDialogue(entry.scene_dialogue_key);
      console.log('[StoryManager] Loaded scene dialogue for key:', entry.scene_dialogue_key, 'text:', text);
    }

    // Replace {CHARACTER} placeholder with actual character name
    if (text.includes('{CHARACTER}')) {
      const characterName = this.currentCharacter ? this.currentCharacter.toUpperCase() : 'HERO';
      text = text.replace(/{CHARACTER}/g, characterName);
    }

    // Ensure we have text to display
    if (!text || text.trim().length === 0) {
      console.warn('[StoryManager] No text to display for dialogue entry:', entry);
      text = '[No text available]';
    }
    
    console.log('[StoryManager] Displaying dialogue text:', text.substring(0, 50) + (text.length > 50 ? '...' : ''));

    // Create dialogue box — synchronously sets this.dialogueText
    this.createDialogueBox(entry, text);

    if (!this.dialogueText) return;

    // Start typewriter or set text directly
    if (entry.typewriter_speed && entry.typewriter_speed > 0) {
      this.startTypewriter(text, entry.typewriter_speed);
    } else {
      this.dialogueText.setText(text);
    }

    // Auto-advance if enabled
    if (entry.auto_advance) {
      const delay = entry.auto_advance_delay ?? entry.min_display_time ?? 2.0;
      this.scene.time.delayedCall(delay * 1000, () => {
        this.nextDialogueEntry();
      });
    }

    // Play sounds
    if (entry.voice_sound && this.audioManager) {
      this.audioManager.playSound(entry.voice_sound as any);
    }
    if (entry.text_sound && this.audioManager) {
      this.audioManager.playSound(entry.text_sound as any);
    }
  }

  /**
   * Create dialogue box UI
   */
  private createDialogueBox(entry: DialogueEntry, _text: string): void {
    const { width, height } = this.scene.cameras.main;

    // Determine box position
    let boxY = height - 150; // Default bottom
    if (entry.box_position === 'center') {
      boxY = height / 2;
    } else if (entry.box_position === 'top') {
      boxY = 100;
    }

    // Create container — fixed to the screen (not the world) so it doesn't scroll
    // with the camera during narrative overlays or any other cutscene type.
    this.cutsceneContainer = this.scene.add.container(width / 2, boxY);
    this.cutsceneContainer.setDepth(10000);
    this.cutsceneContainer.setScrollFactor(0);
    this.cutsceneContainer.setVisible(true);
    this.cutsceneContainer.setActive(true);
    // Ensure container is in the display list and on top
    this.scene.children.bringToTop(this.cutsceneContainer);

    // Create dialogue box background
    const boxWidth = width - 100;
    const boxHeight = 140; // Increased height for better text display
    this.dialogueBox = this.scene.add.graphics();
    
    // Box color
    const boxColor = entry.box_color === 'WHITE' ? 0xffffff : 
                    entry.box_color === 'TRANSPARENT' ? 0x000000 : 0x000000;
    const boxAlpha = entry.box_color === 'TRANSPARENT' ? 0 : 0.9; // More opaque for better visibility
    
    this.dialogueBox.fillStyle(boxColor, boxAlpha);
    this.dialogueBox.fillRoundedRect(-boxWidth / 2, -boxHeight / 2, boxWidth, boxHeight, 12);
    this.dialogueBox.lineStyle(3, 0xffffff, 1); // Thicker border
    this.dialogueBox.strokeRoundedRect(-boxWidth / 2, -boxHeight / 2, boxWidth, boxHeight, 12);
    this.dialogueBox.setDepth(10001);

    // Add dialogue box to container first (background layer)
    this.cutsceneContainer.add(this.dialogueBox);

    // Speaker name (if present)
    if (entry.speaker) {
      this.speakerText = this.scene.add.text(-boxWidth / 2 + 20, -boxHeight / 2 + 15, entry.speaker, {
        fontSize: '14px',
        fontFamily: '"Press Start 2P", "Courier New", monospace',
        color: '#ffff00',
        stroke: '#000000',
        strokeThickness: 2,
      });
      this.speakerText.setDepth(10002);
      this.cutsceneContainer.add(this.speakerText);
    }

    // Dialogue text
    const textColor = entry.text_color === 'RED' ? '#ff0000' :
                     entry.text_color === 'YELLOW' ? '#ffff00' :
                     entry.text_color === 'BLUE' ? '#0000ff' : '#ffffff';

    this.dialogueText = this.scene.add.text(-boxWidth / 2 + 20, -boxHeight / 2 + (entry.speaker ? 50 : 30), '', {
      fontSize: '12px',
      fontFamily: '"Press Start 2P", "Courier New", monospace',
      color: textColor,
      stroke: '#000000',
      strokeThickness: 2, // Increased for better visibility
      wordWrap: { width: boxWidth - 40 },
      lineSpacing: 4,
    });
    this.dialogueText.setDepth(10002);
    this.cutsceneContainer.add(this.dialogueText);

    // Add prompt text for manual advance
    if (!entry.auto_advance) {
      const promptText = this.scene.add.text(boxWidth / 2 - 30, boxHeight / 2 - 20, 'ENTER', {
        fontSize: '10px',
        fontFamily: '"Press Start 2P", "Courier New", monospace',
        color: '#cccccc',
        stroke: '#000000',
        strokeThickness: 1,
      });
      promptText.setDepth(10002);
      this.cutsceneContainer.add(promptText);
    }

    // Set up input to advance (will be checked in update loop)
    // We'll handle this in the update method

    // Apply pending fade-in: tween the container from transparent to opaque.
    if (this.pendingTransition === 'fade_in') {
      this.pendingTransition = null;
      this.cutsceneContainer.setAlpha(0);
      this.scene.tweens.add({
        targets: this.cutsceneContainer,
        alpha: 1,
        duration: StoryManager.FADE_DURATION,
        ease: 'Linear',
      });
    }
  }

  /**
   * Start typewriter effect
   */
  private startTypewriter(fullText: string, speed: number): void {
    if (!this.dialogueText) return;

    if (fullText.length === 0) return;

    // Show first character immediately
    this.dialogueText.setText(fullText.substring(0, 1));

    if (fullText.length === 1) return;

    let currentIndex = 1;
    const delayMs = speed * 1000;

    this.typewriterTimer = this.scene.time.addEvent({
      delay: delayMs,
      callback: () => {
        // dialogueText can legitimately be null if clearDialogue() was called
        // while the timer was still queued — just stop cleanly
        if (!this.dialogueText) {
          this.typewriterTimer?.destroy();
          this.typewriterTimer = undefined;
          return;
        }

        if (currentIndex < fullText.length) {
          this.dialogueText.setText(fullText.substring(0, currentIndex + 1));
          currentIndex++;
        } else {
          this.typewriterTimer?.destroy();
          this.typewriterTimer = undefined;
        }
      },
      repeat: fullText.length,
    });
  }

  /**
   * Get scene dialogue text (character-specific)
   */
  private getSceneDialogue(key: string): string {
    // Get character-specific dialogue
    const lines = getSceneDialogue(this.currentCharacter, key);
    if (lines && lines.length > 0) {
      return lines.join('\n');
    }
    const fallback = `[Scene Dialogue ${key}]`;
    console.warn('[StoryManager] No dialogue found for key:', key, 'using fallback');
    return fallback;
  }

  /**
   * Set current character for dialogue
   */
  setCharacter(character: string): void {
    this.currentCharacter = character.toLowerCase();
  }

  /**
   * Move to next dialogue entry
   */
  private nextDialogueEntry(): void {
    if (!this.currentCutscene) return;

    const currentScene = this.currentCutscene.scenes[this.currentSceneIndex];
    if (!currentScene || !currentScene.dialogue) {
      this.nextScene();
      return;
    }

    this.currentEntryIndex++;
    if (this.currentEntryIndex >= currentScene.dialogue.length) {
      this.nextScene();
    } else {
      this.playDialogueEntry(currentScene.dialogue[this.currentEntryIndex]);
    }
  }

  /**
   * Move to next scene, with optional fade-out on the current container.
   */
  private nextScene(): void {
    if (this.pendingTransition === 'fade_out' && this.cutsceneContainer?.active) {
      this.pendingTransition = null;
      this.scene.tweens.add({
        targets: this.cutsceneContainer,
        alpha: 0,
        duration: StoryManager.FADE_DURATION,
        ease: 'Linear',
        onComplete: () => this.advanceScene(),
      });
    } else {
      this.pendingTransition = null;
      this.advanceScene();
    }
  }

  private advanceScene(): void {
    if (!this.currentCutscene) {
      this.endCutscene();
      return;
    }

    this.currentSceneIndex++;
    if (this.currentSceneIndex >= this.currentCutscene.scenes.length) {
      this.endCutscene();
    } else {
      this.currentEntryIndex = 0;
      this.playScene(this.currentCutscene.scenes[this.currentSceneIndex]);
    }
  }

  /**
   * End cutscene
   */
  private endCutscene(): void {
    // Apply actions
    if (this.currentCutscene?.actions?.set_flag) {
      for (const [flag, value] of Object.entries(this.currentCutscene.actions.set_flag)) {
        this.gameFlags.set(flag, value);
      }
      this.saveFlags();
    }
    
    // Mark intro/outro as viewed after completion (so they can be skipped on replay)
    if (this.currentCutscene) {
      const isSpecialCutscene = this.currentCutscene.type === 'intro' || this.currentCutscene.type === 'outro';
      if (isSpecialCutscene) {
        this.viewedCutscenes.add(this.currentCutscene.id);
        this.saveFlags();
      }
    }

    // Clear dialogue
    this.clearDialogue();

    // Resume game only if we actually paused it (dialogue / story_beat types only).
    if (this.currentCutscene?.type === 'dialogue' || this.currentCutscene?.type === 'story_beat') {
      this.scene.scene.resume('GameScene');
    }

    // Unduck combat music if this cutscene ducked it on entry.
    if (this.didDuckUnderlyingMusic && this.audioManager) {
      this.audioManager.unduckMusic(200);
      this.didDuckUnderlyingMusic = false;
    }

    // Reset state
    this.currentCutscene = null;
    this.isPlayingCutscene = false;
    this.currentSceneIndex = 0;
    this.currentEntryIndex = 0;

    // Emit event
    this.scene.events.emit('cutsceneEnded');
  }

  /**
   * Clear dialogue UI
   */
  private clearDialogue(): void {
    if (this.typewriterTimer) {
      this.typewriterTimer.destroy();
      this.typewriterTimer = undefined;
    }

    if (this.cutsceneContainer) {
      this.cutsceneContainer.destroy();
      this.cutsceneContainer = undefined;
    }

    this.dialogueBox = undefined;
    this.dialogueText = undefined;
    this.speakerText = undefined;
  }

  /**
   * Fade in effect — marks the intent so createDialogueBox() can tween the
   * container from transparent to opaque once it exists.
   */
  private fadeIn(): void {
    this.pendingTransition = 'fade_in';
  }

  /**
   * Fade out effect — marks the intent so nextScene() can tween the container
   * to transparent before advancing to the next cutscene scene.
   */
  private fadeOut(): void {
    this.pendingTransition = 'fade_out';
  }

  /**
   * Set game flag
   */
  setFlag(flag: string, value: boolean): void {
    this.gameFlags.set(flag, value);
    this.saveFlags();
  }

  /**
   * Get game flag
   */
  getFlag(flag: string): boolean {
    return this.gameFlags.get(flag) ?? false;
  }

  /**
   * Set scene index (for cutscene condition checking)
   * Note: Scene index maps to level index (Level 1 = Scene 1, Level 2 = Scene 2, etc.)
   */
  setSceneIndex(index: number): void {
    // Scene index is 1-based in cutscenes, but we store 0-based internally
    // So we add 1 when checking conditions
    this.currentSceneIndex = index;
  }

  /**
   * Get current scene index (1-based for cutscene conditions)
   */
  getSceneIndex(): number {
    return this.currentSceneIndex + 1;
  }

  /**
   * Check and trigger cutscenes for current scene
   */
  checkAndTriggerCutscenes(): void {
    // Check all registered cutscenes
    for (const [_id, factory] of this.cutsceneRegistry.entries()) {
      const cutscene = factory();
      if (this.checkCutsceneConditions(cutscene) && !this.viewedCutscenes.has(cutscene.id)) {
        this.playCutscene(cutscene);
        break; // Only play one at a time
      }
    }
  }

  /**
   * Load flags from localStorage
   */
  private loadFlags(): void {
    try {
      const saved = localStorage.getItem('streetMelee_flags');
      if (saved) {
        const flags = JSON.parse(saved);
        this.gameFlags = new Map(Object.entries(flags));
      }

      const viewed = localStorage.getItem('streetMelee_viewedCutscenes');
      if (viewed) {
        this.viewedCutscenes = new Set(JSON.parse(viewed));
      }
    } catch (e) {
      console.warn('[StoryManager] Failed to load flags:', e);
    }
  }

  /**
   * Save flags to localStorage
   */
  private saveFlags(): void {
    try {
      localStorage.setItem('streetMelee_flags', JSON.stringify(Object.fromEntries(this.gameFlags)));
      localStorage.setItem('streetMelee_viewedCutscenes', JSON.stringify(Array.from(this.viewedCutscenes)));
    } catch (e) {
      console.warn('[StoryManager] Failed to save flags:', e);
    }
  }

  /**
   * Check if cutscene is playing
   */
  isCutscenePlaying(): boolean {
    return this.isPlayingCutscene;
  }

  /**
   * Update method - handles input for dialogue advancement
   */
  update(): void {
    if (!this.isPlayingCutscene || !this.currentCutscene) return;

    const currentScene = this.currentCutscene.scenes[this.currentSceneIndex];
    if (!currentScene || !currentScene.dialogue) return;

    const currentEntry = currentScene.dialogue[this.currentEntryIndex];
    if (!currentEntry) return;

    // Check for manual advance (Enter or Space)
    if (!currentEntry.auto_advance) {
      const keyboard = this.scene.input.keyboard;
      if (keyboard) {
        const enterKey = keyboard.addKey('ENTER');
        const spaceKey = keyboard.addKey('SPACE');
        
        if (Phaser.Input.Keyboard.JustDown(enterKey) || Phaser.Input.Keyboard.JustDown(spaceKey)) {
          this.nextDialogueEntry();
        }
      }
    }
  }
}

