/**
 * Story Data - Centralized story cutscene definitions
 * 
 * This module defines all story cutscenes using the Dialogue Builder system.
 */

import { DialogueBuilder, create_dialogue_cutscene, create_narrative_cutscene } from './DialogueBuilder';

/**
 * Example dialogue: Meeting Angela
 */
export function dialogue_3_meeting_angela() {
  const dialogue = new DialogueBuilder();
  
  // Character-specific narrative intro
  dialogue.narrate("3", { auto_advance_delay: 3.6, min_display_time: 1.8 });
  
  // Internal thought
  dialogue.narrate("DARIO'S HEART SKIPPED A BEAT. THIS WAS HIS MOMENT.", 
                   { auto_advance_delay: 2.4, min_display_time: 1.5 });
  
  // Dario introduces himself
  dialogue.say(
    "DARIO",
    "HEY I'M DARIO",
    {
      typewriter_speed: 0.018,
      min_display_time: 1.5,
      voice_sound: "dario_whistle_sound",
      text_sound: "menu_toggle_sound"
    }
  );
  
  // Angela's dramatic pause
  dialogue.pause("ANGELA", 3.5);
  
  // Dario tries again
  dialogue.say(
    "DARIO",
    "HEY! WAIT! I'M TALKING TO YOU!",
    {
      typewriter_speed: 0.015,
      min_display_time: 1.5,
      text_sound: "menu_toggle_sound"
    }
  );
  
  // Angela's response
  dialogue.say(
    "ANGELA",
    "I DON'T TALK TO STRANGERS.",
    {
      typewriter_speed: 0.018,
      min_display_time: 1.8,
      auto_advance: true,
      auto_advance_delay: 2.1,
      text_sound: "menu_toggle_sound"
    }
  );
  
  // Dario's desperate attempt
  dialogue.say(
    "DARIO",
    "BUT... I'M NOT A STRANGER! I'M DARIO!",
    {
      typewriter_speed: 0.015,
      min_display_time: 1.8,
      text_sound: "menu_toggle_sound"
    }
  );
  
  // Narrative conclusion
  dialogue.narrate("BUT SHE JUST WALKS AWAY.", { auto_advance_delay: 2.7, min_display_time: 1.8 });
  
  // Emotional conclusion
  dialogue.narrate("DARIO STOOD THERE, WATCHING HER WALK AWAY. HE KNEW THIS WASN'T OVER.", 
                   { auto_advance_delay: 1.8, min_display_time: 2.1 });
  
  return create_dialogue_cutscene(
    "dialogue_3_meeting_angela",
    "Meeting Angela",
    3,
    dialogue,
    {
      skip_without_confirm: false,
      actions: { set_flag: { met_angela: true, angela_rejected: true } }
    }
  );
}

/**
 * Example narrative: Level 1 Introduction
 */
export function narrative_1() {
  return create_narrative_cutscene(
    "narrative_1",
    "Level 1 Introduction",
    1,
    {
      scene_dialogue_key: "1",
      actions: { set_flag: { narrative_1_viewed: true } }
    }
  );
}

/**
 * Registry of all story cutscenes
 */
export const STORY_REGISTRY: Record<string, () => any> = {
  "dialogue_3_meeting_angela": dialogue_3_meeting_angela,
  "narrative_1": narrative_1,
  // Add more cutscenes here as they are created
};

/**
 * Get a story cutscene by ID
 */
export function getStoryCutscene(id: string): any {
  const factory = STORY_REGISTRY[id];
  if (factory) {
    return factory();
  }
  return null;
}

