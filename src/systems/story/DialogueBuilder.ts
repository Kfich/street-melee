/**
 * Dialogue entry interface
 */
export interface DialogueEntry {
  speaker: string;
  text?: string;
  scene_dialogue_key?: string;
  portrait?: string | null;
  typewriter_speed?: number;
  min_display_time?: number;
  auto_advance?: boolean;
  auto_advance_delay?: number;
  voice_sound?: string;
  text_sound?: string;
  box_position?: 'center' | 'bottom' | 'top';
  box_style?: 'default' | 'boss' | 'narrative';
  text_color?: 'WHITE' | 'RED' | 'YELLOW' | 'BLUE';
  box_color?: 'BLACK' | 'WHITE' | 'TRANSPARENT';
}

/**
 * Cutscene scene interface
 */
export interface CutsceneScene {
  background?: string | 'current';
  transition?: 'fade_in' | 'fade_out' | 'none';
  duration?: number;
  music?: string | 'fade_out' | {
    file: string;
    loop: boolean;
    volume: number;
    fade_in?: boolean;
    fade_out?: boolean;
  };
  camera?: {
    x: number;
    y: number;
    zoom: number;
  };
  dialogue: DialogueEntry[];
  character_lineup?: boolean;
  actions?: {
    set_flag?: Record<string, boolean>;
  };
}

/**
 * Cutscene interface
 */
export interface Cutscene {
  id: string;
  name: string;
  type: 'dialogue' | 'narrative' | 'intro' | 'outro' | 'story_beat' | 'level_transition';
  repeatable?: boolean;
  conditions?: {
    scene_index?: number;
    level_index?: number;
    flags?: Record<string, boolean>;
    requires_viewed?: string[];
  };
  skip_without_confirm?: boolean;
  scenes: CutsceneScene[];
  actions?: {
    set_flag?: Record<string, boolean>;
  };
}

/**
 * Dialogue Builder - Fluent API for building dialogue cutscenes
 */
export class DialogueBuilder {
  private entries: DialogueEntry[] = [];

  /**
   * Add a character dialogue line
   */
  say(
    speaker: string,
    text: string,
    options: {
      typewriter_speed?: number;
      min_display_time?: number;
      auto_advance?: boolean;
      auto_advance_delay?: number;
      voice_sound?: string;
      text_sound?: string;
      box_position?: 'center' | 'bottom' | 'top';
      box_style?: 'default' | 'boss' | 'narrative';
      text_color?: 'WHITE' | 'RED' | 'YELLOW' | 'BLUE';
      box_color?: 'BLACK' | 'WHITE' | 'TRANSPARENT';
      portrait?: string | null;
    } = {}
  ): DialogueBuilder {
    this.entries.push({
      speaker,
      text,
      typewriter_speed: options.typewriter_speed ?? 0.015,
      min_display_time: options.min_display_time ?? 1.5,
      auto_advance: options.auto_advance ?? false,
      auto_advance_delay: options.auto_advance_delay,
      voice_sound: options.voice_sound,
      text_sound: options.text_sound,
      box_position: options.box_position ?? 'bottom',
      box_style: options.box_style ?? 'default',
      text_color: options.text_color ?? 'WHITE',
      box_color: options.box_color ?? 'BLACK',
      portrait: options.portrait ?? null,
    });
    return this;
  }

  /**
   * Add a narrative line (no speaker)
   */
  narrate(
    textOrKey: string,
    options: {
      scene_dialogue_key?: string;
      typewriter_speed?: number;
      min_display_time?: number;
      auto_advance?: boolean;
      auto_advance_delay?: number;
      box_position?: 'center' | 'bottom' | 'top';
      text_color?: 'WHITE' | 'RED' | 'YELLOW' | 'BLUE';
      box_color?: 'BLACK' | 'WHITE' | 'TRANSPARENT';
    } = {}
  ): DialogueBuilder {
    const entry: DialogueEntry = {
      speaker: '',
      typewriter_speed: options.typewriter_speed ?? 0.012,
      min_display_time: options.min_display_time ?? 1.8,
      auto_advance: options.auto_advance ?? true,
      auto_advance_delay: options.auto_advance_delay ?? 2.4,
      box_position: options.box_position ?? 'center',
      box_style: 'narrative',
      text_color: options.text_color ?? 'WHITE',
      box_color: options.box_color ?? 'BLACK',
      portrait: null,
    };

    // If it's a scene dialogue key (just a number), use that
    if (options.scene_dialogue_key) {
      entry.scene_dialogue_key = options.scene_dialogue_key;
    } else if (/^\d+$/.test(textOrKey)) {
      // If textOrKey is just a number, treat it as scene_dialogue_key
      entry.scene_dialogue_key = textOrKey;
    } else {
      // Otherwise use as text
      entry.text = textOrKey;
    }

    this.entries.push(entry);
    return this;
  }

  /**
   * Add a pause (character thinking/processing)
   */
  pause(character: string, duration: number): DialogueBuilder {
    this.entries.push({
      speaker: character,
      text: '...',
      typewriter_speed: 0,
      min_display_time: duration,
      auto_advance: true,
      auto_advance_delay: duration,
      box_position: 'bottom',
      portrait: null,
    });
    return this;
  }

  /**
   * Build the dialogue array
   */
  build(): DialogueEntry[] {
    return this.entries;
  }
}

/**
 * Helper functions to create common cutscene types
 */
export function create_dialogue_cutscene(
  dialogue_id: string,
  name: string,
  scene_index: number,
  dialogue: DialogueBuilder,
  options: {
    skip_without_confirm?: boolean;
    requires_viewed?: string[];
    actions?: { set_flag?: Record<string, boolean> };
  } = {}
): Cutscene {
  return {
    id: dialogue_id,
    name,
    type: 'dialogue',
    repeatable: false,
    conditions: {
      scene_index,
      requires_viewed: options.requires_viewed,
    },
    skip_without_confirm: options.skip_without_confirm ?? false,
    scenes: [
      {
        background: 'current',
        transition: 'fade_in',
        duration: 0,
        camera: { x: 0, y: 0, zoom: 1.0 },
        dialogue: dialogue.build(),
        actions: options.actions,
      },
    ],
    actions: options.actions,
  };
}

export function create_boss_dialogue_cutscene(
  dialogue_id: string,
  name: string,
  scene_index: number,
  dialogue: DialogueBuilder,
  options: {
    camera_zoom?: number;
    requires_viewed?: string[];
    actions?: { set_flag?: Record<string, boolean> };
  } = {}
): Cutscene {
  return {
    id: dialogue_id,
    name,
    type: 'dialogue',
    repeatable: false,
    conditions: {
      scene_index,
      requires_viewed: options.requires_viewed,
    },
    skip_without_confirm: true,
    scenes: [
      {
        background: 'current',
        transition: 'fade_in',
        duration: 0,
        music: {
          file: 'sfx/background-sfx/boss-fight-song.mp3',
          loop: true,
          volume: 0.5,
          fade_in: true,
          fade_out: false,
        },
        camera: { x: 0, y: 0, zoom: options.camera_zoom ?? 1.2 },
        dialogue: dialogue.build(),
        actions: options.actions,
      },
    ],
    actions: options.actions,
  };
}

export function create_narrative_cutscene(
  narrative_id: string,
  name: string,
  scene_index: number,
  options: {
    scene_dialogue_key?: string;
    cutscene_type?: string;
    background?: string | 'current';
    requires_viewed?: string[];
    auto_advance?: boolean;
    auto_advance_delay?: number;
    min_display_time?: number;
    music?: string | 'fade_out';
    camera?: { x: number; y: number; zoom: number };
    actions?: { set_flag?: Record<string, boolean> };
  } = {}
): Cutscene {
  const dialogue = new DialogueBuilder();
  if (options.scene_dialogue_key) {
    dialogue.narrate('', { scene_dialogue_key: options.scene_dialogue_key });
  }

  return {
    id: narrative_id,
    name,
    type: (options.cutscene_type as any) ?? 'narrative',
    repeatable: false,
    conditions: {
      scene_index,
      requires_viewed: options.requires_viewed,
    },
    skip_without_confirm: false,
    scenes: [
      {
        background: options.background ?? 'current',
        transition: 'fade_in',
        duration: 0,
        music: options.music,
        camera: options.camera ?? { x: 0, y: 0, zoom: 1.0 },
        dialogue: dialogue.build(),
        character_lineup: true,
        actions: options.actions,
      },
    ],
    actions: options.actions,
  };
}

export function create_story_beat_cutscene(
  dialogue_id: string,
  name: string,
  scene_index: number,
  dialogue: DialogueBuilder,
  options: {
    requires_viewed?: string[];
    actions?: { set_flag?: Record<string, boolean> };
  } = {}
): Cutscene {
  return {
    id: dialogue_id,
    name,
    type: 'story_beat',
    repeatable: false,
    conditions: {
      scene_index,
      requires_viewed: options.requires_viewed,
    },
    skip_without_confirm: false,
    scenes: [
      {
        background: 'current',
        transition: 'fade_in',
        duration: 0,
        camera: { x: 0, y: 0, zoom: 1.0 },
        dialogue: dialogue.build(),
        actions: options.actions,
      },
    ],
    actions: options.actions,
  };
}

export function create_intro_cutscene(
  intro_id: string,
  name: string,
  scenes: CutsceneScene[],
  options: {
    conditions?: {
      scene_index?: number;
      flags?: Record<string, boolean>;
    };
    actions?: { set_flag?: Record<string, boolean> };
  } = {}
): Cutscene {
  return {
    id: intro_id,
    name,
    type: 'intro',
    repeatable: false,
    conditions: options.conditions,
    skip_without_confirm: false,
    scenes,
    actions: options.actions,
  };
}

export function create_outro_cutscene(
  outro_id: string,
  name: string,
  scenes: CutsceneScene[],
  options: {
    conditions?: {
      scene_index?: number;
      flags?: Record<string, boolean>;
      requires_viewed?: string[];
    };
    actions?: { set_flag?: Record<string, boolean> };
  } = {}
): Cutscene {
  return {
    id: outro_id,
    name,
    type: 'outro',
    repeatable: false,
    conditions: options.conditions,
    skip_without_confirm: false,
    scenes,
    actions: options.actions,
  };
}

export function create_level_transition_cutscene(
  transition_id: string,
  name: string,
  level_index: number,
  options: {
    title?: string;
    summary?: string;
    background?: string;
    actions?: { set_flag?: Record<string, boolean> };
  } = {}
): Cutscene {
  const dialogue = new DialogueBuilder();
  if (options.title) {
    dialogue.narrate(options.title, {
      text_color: 'RED',
      box_color: 'BLACK',
      box_position: 'center',
      typewriter_speed: 0.018,
      min_display_time: 2.0,
      auto_advance_delay: 2.4,
    });
  }
  if (options.summary) {
    dialogue.narrate(options.summary, {
      text_color: 'WHITE',
      box_color: 'BLACK',
      box_position: 'center',
      typewriter_speed: 0.012,
      min_display_time: 2.4,
      auto_advance_delay: 3.0,
    });
  }

  return {
    id: transition_id,
    name,
    type: 'level_transition',
    repeatable: false,
    conditions: {
      level_index,
    },
    skip_without_confirm: false,
    scenes: [
      {
        background: options.background ?? 'current',
        transition: 'fade_in',
        duration: 0,
        music: 'fade_out',
        camera: { x: 0, y: 0, zoom: 1.0 },
        dialogue: dialogue.build(),
        actions: options.actions,
      },
    ],
    actions: options.actions,
  };
}

