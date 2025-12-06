/**
 * Story Data - Centralized story cutscene definitions
 * 
 * This module defines all story cutscenes using the Dialogue Builder system.
 */

import { DialogueBuilder, create_dialogue_cutscene, create_narrative_cutscene, create_intro_cutscene, create_outro_cutscene, create_boss_dialogue_cutscene, CutsceneScene } from './DialogueBuilder';

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
 * Game Introduction - The main game intro sequence
 */
export function intro_game() {
  const scenes: CutsceneScene[] = [
    {
      background: "imgs/intro/sunset_variant_dawn.png",
      transition: "fade_in",
      duration: 5.0,
      character_lineup: true,
      music: {
        file: "sfx/background-sfx/dario-theme.mp3",
        loop: true,
        volume: 0.4,
        fade_in: true,
        fade_out: false,
      },
      camera: { x: 0, y: 0, zoom: 1.0 },
      dialogue: [
        {
          speaker: "",
          text: "WELCOME TO THE ADVENTURES OF LIL {CHARACTER}",
          portrait: null,
          typewriter_speed: 0.015,
          auto_advance: true,
          auto_advance_delay: 2.4,
          min_display_time: 2.1,
          box_position: "center",
          box_style: "default",
          text_color: "RED",
          box_color: "BLACK",
        },
      ],
    },
    {
      background: "imgs/intro/sunset_variant_dawn.png",
      transition: "fade_out",
      duration: 6.0,
      character_lineup: true,
      dialogue: [
        {
          speaker: "",
          scene_dialogue_key: "1",
          portrait: null,
          typewriter_speed: 0.012,
          auto_advance: true,
          auto_advance_delay: 3.0,
          min_display_time: 2.4,
          box_position: "center",
          text_color: "WHITE",
          box_color: "BLACK",
        },
      ],
    },
    {
      background: "imgs/intro/sunset_variant_dawn.png",
      transition: "fade_out",
      duration: 5.25,
      character_lineup: true,
      dialogue: [
        {
          speaker: "",
          text: "OUTHERE ACADEMY. A PLACE WHERE EVERY DAY IS A CHALLENGE... AND SURVIVAL IS THE ONLY OPTION.",
          portrait: null,
          typewriter_speed: 0.012,
          auto_advance: true,
          auto_advance_delay: 3.3,
          min_display_time: 2.7,
          box_position: "center",
          text_color: "WHITE",
          box_color: "BLACK",
        },
      ],
    },
    {
      background: "imgs/intro/sunset_variant_dawn.png",
      transition: "fade_out",
      duration: 5.3,
      character_lineup: true,
      dialogue: [
        {
          speaker: "",
          scene_dialogue_key: "3",
          portrait: null,
          typewriter_speed: 0.012,
          auto_advance: true,
          auto_advance_delay: 3.6,
          min_display_time: 3.0,
          box_position: "center",
          text_color: "WHITE",
          box_color: "BLACK",
        },
      ],
    },
    {
      background: "imgs/intro/sunset_variant_dawn.png",
      transition: "fade_out",
      duration: 4.5,
      character_lineup: true,
      dialogue: [
        {
          speaker: "",
          text: "BUT THE PATH TO LOVE IS NEVER EASY... {CHARACTER} WILL FACE BULLIES, TEACHERS, AND AUTHORITIES... ALL IN THE NAME OF LOVE.",
          portrait: null,
          typewriter_speed: 0.012,
          auto_advance: true,
          auto_advance_delay: 3.6,
          min_display_time: 3.0,
          box_position: "center",
          text_color: "WHITE",
          box_color: "BLACK",
        },
      ],
    },
    {
      background: "imgs/intro/sunset_variant_dawn.png",
      transition: "fade_out",
      duration: 0,
      character_lineup: true,
      dialogue: [
        {
          speaker: "",
          text: "WILL {CHARACTER} SUCCEED IN THEIR QUEST? OR WILL THE CHALLENGES PROVE TOO GREAT? THE ADVENTURE BEGINS NOW...",
          portrait: null,
          typewriter_speed: 0.015,
          auto_advance: true,
          auto_advance_delay: 3.6,
          min_display_time: 3.0,
          box_position: "center",
          text_color: "WHITE",
          box_color: "BLACK",
        },
      ],
      actions: {
        set_flag: {
          game_start_ready: true,
        },
      },
    },
  ];

  return create_intro_cutscene(
    "intro_game",
    "Game Introduction",
    scenes,
    {
      actions: {
        set_flag: {
          intro_game_shown: true,
          game_start_ready: true,
        },
      },
    }
  );
}

/**
 * Dario's Introduction - Scene 1 intro
 */
export function intro_scene_1() {
  const scenes: CutsceneScene[] = [
    {
      background: "imgs/intro/sunset_variant_dawn.png",
      transition: "fade_in",
      duration: 8.0,
      music: "fade_out",
      camera: { x: 0, y: 0, zoom: 1.0 },
      dialogue: [
        {
          speaker: "",
          scene_dialogue_key: "1",
          portrait: null,
          typewriter_speed: 0.012,
          auto_advance: true,
          auto_advance_delay: 3.6,
          min_display_time: 2.1,
          box_position: "center",
          box_style: "default",
          text_color: "WHITE",
          box_color: "BLACK",
        },
      ],
    },
    {
      background: "imgs/intro/sunset_variant_dawn.png",
      transition: "fade_out",
      duration: 5.0,
      dialogue: [
        {
          speaker: "",
          text: "HE MAKES IT HIS MISSION TO GET THIS GIRL.",
          portrait: null,
          typewriter_speed: 0.012,
          auto_advance: true,
          auto_advance_delay: 3.0,
          min_display_time: 2.1,
          box_position: "center",
          text_color: "WHITE",
          box_color: "BLACK",
        },
      ],
    },
  ];

  return create_intro_cutscene(
    "intro_scene_1",
    "Dario's Introduction",
    scenes,
    {
      conditions: {
        scene_index: 1,
      },
      actions: {
        set_flag: {
          intro_viewed: true,
        },
      },
    }
  );
}

/**
 * Game Completion - Completion celebration cutscene
 */
export function outro_completion() {
  const scenes: CutsceneScene[] = [
    {
      background: "imgs/outro/sunset_variant_golden.png",
      transition: "fade_in",
      duration: 0,
      music: "fade_out",
      camera: { x: 0, y: 0, zoom: 1.0 },
      dialogue: [
        {
          speaker: "",
          text: "CONGRATULATIONS!",
          portrait: null,
          typewriter_speed: 0.018,
          auto_advance: true,
          auto_advance_delay: 1.8,
          min_display_time: 1.5,
          box_position: "center",
          box_style: "default",
          text_color: "RED",
          box_color: "BLACK",
        },
        {
          speaker: "",
          text: "YOU HAVE COMPLETED THE ADVENTURES OF LIL {CHARACTER}",
          portrait: null,
          typewriter_speed: 0.012,
          auto_advance: true,
          auto_advance_delay: 2.7,
          min_display_time: 2.1,
          box_position: "center",
          text_color: "RED",
          box_color: "BLACK",
        },
        {
          speaker: "",
          text: "{CHARACTER}'S JOURNEY HAS COME TO AN END...",
          portrait: null,
          typewriter_speed: 0.012,
          auto_advance: true,
          auto_advance_delay: 2.4,
          min_display_time: 1.8,
          box_position: "center",
          text_color: "WHITE",
          box_color: "BLACK",
        },
        {
          speaker: "",
          text: "BUT HIS STORY WILL LIVE ON FOREVER.",
          portrait: null,
          typewriter_speed: 0.015,
          auto_advance: true,
          auto_advance_delay: 2.7,
          min_display_time: 2.1,
          box_position: "center",
          text_color: "WHITE",
          box_color: "BLACK",
        },
        {
          speaker: "",
          text: "THANK YOU FOR PLAYING!",
          portrait: null,
          typewriter_speed: 0.018,
          auto_advance: true,
          auto_advance_delay: 3.0,
          min_display_time: 2.4,
          box_position: "center",
          text_color: "RED",
          box_color: "BLACK",
        },
      ],
    },
  ];

  return create_outro_cutscene(
    "outro_completion",
    "Game Completion",
    scenes,
    {
      conditions: {
        flags: {
          game_completed: true,
          story_complete: true,
        },
      },
      actions: {
        set_flag: {
          completion_cutscene_viewed: true,
        },
      },
    }
  );
}

/**
 * The End - Final story outro
 */
export function outro_end() {
  const scenes: CutsceneScene[] = [
    {
      background: "imgs/outro/sunset_variant_golden.png",
      transition: "fade_in",
      duration: 0,
      music: "fade_out",
      camera: { x: 0, y: 0, zoom: 1.0 },
      dialogue: [
        {
          speaker: "",
          scene_dialogue_key: "27",
          portrait: null,
          typewriter_speed: 0.012,
          auto_advance: true,
          auto_advance_delay: 3.0,
          min_display_time: 2.4,
          box_position: "center",
          text_color: "WHITE",
          box_color: "BLACK",
        },
      ],
    },
  ];

  return create_outro_cutscene(
    "outro_end",
    "The End",
    scenes,
    {
      conditions: {
        scene_index: 27,
        requires_viewed: ["story_beat_26_angela_dario_together"],
      },
      actions: {
        set_flag: {
          game_completed: true,
          story_complete: true,
        },
      },
    }
  );
}

/**
 * Scene 1: School Entrance - Opening narrative
 */
export function narrative_scene_1() {
  return create_narrative_cutscene(
    "narrative_scene_1",
    "School Entrance",
    1,
    {
      scene_dialogue_key: "1",
      auto_advance: true,
      auto_advance_delay: 5.0,
      min_display_time: 5.0,
      actions: { set_flag: { scene_1_viewed: true } }
    }
  );
}

/**
 * Scene 6: Tony Confrontation - Boss intro cutscene
 */
export function cutscene_6_tony_intro() {
  const dialogue = new DialogueBuilder();
  dialogue.narrate("TONY STEPS FORWARD, HIS EYES BURNING WITH RAGE.", {
    auto_advance_delay: 2.4,
    min_display_time: 2.0
  });
  dialogue.say("TONY", "YOU THINK YOU CAN JUST WALK AWAY?", {
    typewriter_speed: 0.015,
    auto_advance: true,
    auto_advance_delay: 2.1,
    min_display_time: 1.8
  });
  dialogue.say("DARIO", "I DON'T WANT TROUBLE, TONY.", {
    typewriter_speed: 0.015,
    auto_advance: true,
    auto_advance_delay: 2.1,
    min_display_time: 1.8
  });
  dialogue.say("TONY", "TOO BAD. YOU'RE GETTING IT ANYWAY!", {
    typewriter_speed: 0.015,
    auto_advance: true,
    auto_advance_delay: 2.4,
    min_display_time: 2.0
  });

  return create_boss_dialogue_cutscene(
    "cutscene_6_tony_intro",
    "Tony Confrontation",
    6,
    dialogue,
    {
      camera_zoom: 1.2,
      actions: { set_flag: { tony_intro_viewed: true, tony_fight_started: true } }
    }
  );
}


/**
 * Scene 8: Doctor Midnight Entry
 */
export function cutscene_8_doctor_midnight_intro() {
  const dialogue = new DialogueBuilder();
  dialogue.narrate("THE CLASSROOM DARKENS. A SHADOW FALLS OVER THE ROOM.", {
    auto_advance_delay: 2.7,
    min_display_time: 2.4
  });
  dialogue.say("DOCTOR MIDNIGHT", "SO... YOU'VE COME AT LAST.", {
    typewriter_speed: 0.018,
    auto_advance: true,
    auto_advance_delay: 2.4,
    min_display_time: 2.0,
    text_color: "RED"
  });
  dialogue.say("DARIO", "WHO ARE YOU?", {
    typewriter_speed: 0.015,
    auto_advance: true,
    auto_advance_delay: 2.1,
    min_display_time: 1.8
  });
  dialogue.say("DOCTOR MIDNIGHT", "I AM YOUR WORST NIGHTMARE.", {
    typewriter_speed: 0.018,
    auto_advance: true,
    auto_advance_delay: 2.7,
    min_display_time: 2.4,
    text_color: "RED"
  });

  return create_boss_dialogue_cutscene(
    "cutscene_8_doctor_midnight_intro",
    "Doctor Midnight Entry",
    8,
    dialogue,
    {
      camera_zoom: 1.1,
      actions: { set_flag: { doctor_midnight_intro_viewed: true } }
    }
  );
}

/**
 * Scene 9: Principal's Office
 */
export function cutscene_9_principal() {
  const dialogue = new DialogueBuilder();
  dialogue.narrate("THE PRINCIPAL STEPS FORWARD, HIS FACE STERN.", {
    auto_advance_delay: 2.4,
    min_display_time: 2.0
  });
  dialogue.say("PRINCIPAL", "DARIO. MY OFFICE. NOW.", {
    typewriter_speed: 0.015,
    auto_advance: true,
    auto_advance_delay: 2.1,
    min_display_time: 1.8,
    text_color: "YELLOW"
  });
  dialogue.say("DARIO", "BUT SIR, I...", {
    typewriter_speed: 0.015,
    auto_advance: true,
    auto_advance_delay: 2.1,
    min_display_time: 1.8
  });
  dialogue.say("PRINCIPAL", "NO EXCUSES. FOLLOW ME.", {
    typewriter_speed: 0.015,
    auto_advance: true,
    auto_advance_delay: 2.4,
    min_display_time: 2.0,
    text_color: "YELLOW"
  });

  return create_dialogue_cutscene(
    "cutscene_9_principal",
    "Principal's Office",
    9,
    dialogue,
    {
      skip_without_confirm: false,
      actions: { set_flag: { principal_met: true } }
    }
  );
}

/**
 * Scene 12: Angela Recognition
 */
export function cutscene_12_angela_recognition() {
  const dialogue = new DialogueBuilder();
  dialogue.narrate("DARIO SPOTS ANGELA IN THE HALLWAY.", {
    auto_advance_delay: 2.7,
    min_display_time: 2.4
  });
  dialogue.say("ANGELA", "HEY DARIO", {
    typewriter_speed: 0.015,
    auto_advance: true,
    auto_advance_delay: 1.8,
    min_display_time: 1.5
  });
  dialogue.say("DARIO", "ANGELA! YOU REMEMBER ME?", {
    typewriter_speed: 0.015,
    auto_advance: true,
    auto_advance_delay: 2.1,
    min_display_time: 1.8
  });
  dialogue.say("ANGELA", "OF COURSE. HOW COULD I FORGET?", {
    typewriter_speed: 0.015,
    auto_advance: true,
    auto_advance_delay: 2.4,
    min_display_time: 2.0
  });

  return create_dialogue_cutscene(
    "cutscene_12_angela_recognition",
    "Angela Recognition",
    12,
    dialogue,
    {
      skip_without_confirm: false,
      requires_viewed: ["dialogue_3_meeting_angela"],
      actions: { set_flag: { angela_recognized: true } }
    }
  );
}

/**
 * Scene 13: Tony's Challenge
 */
export function cutscene_13_tony_challenge() {
  const dialogue = new DialogueBuilder();
  dialogue.narrate("TONY BLOCKS THE PATH TO THE BASEMENT.", {
    auto_advance_delay: 2.4,
    min_display_time: 2.0
  });
  dialogue.say("TONY", "YOU'RE NOT GOING ANYWHERE.", {
    typewriter_speed: 0.015,
    auto_advance: true,
    auto_advance_delay: 2.1,
    min_display_time: 1.8
  });
  dialogue.say("DARIO", "I HAVE TO, TONY. STEP ASIDE.", {
    typewriter_speed: 0.015,
    auto_advance: true,
    auto_advance_delay: 2.4,
    min_display_time: 2.0
  });
  dialogue.say("TONY", "MAKE ME.", {
    typewriter_speed: 0.015,
    auto_advance: true,
    auto_advance_delay: 2.7,
    min_display_time: 2.4
  });

  return create_boss_dialogue_cutscene(
    "cutscene_13_tony_challenge",
    "Tony's Challenge",
    13,
    dialogue,
    {
      camera_zoom: 1.2,
      actions: { set_flag: { tony_challenge_viewed: true } }
    }
  );
}

/**
 * Scene 14: The Ambush
 */
export function cutscene_14_ambush() {
  const dialogue = new DialogueBuilder();
  dialogue.narrate("THE BASEMENT DOOR SLAMS SHUT. DARIO IS TRAPPED.", {
    auto_advance_delay: 3.0,
    min_display_time: 2.7
  });
  dialogue.say("PRINCIPAL", "IT'S OVER, DARIO.", {
    typewriter_speed: 0.015,
    auto_advance: true,
    auto_advance_delay: 2.1,
    min_display_time: 1.8,
    text_color: "YELLOW"
  });
  dialogue.say("ANGELA", "DARIO, I'M SORRY...", {
    typewriter_speed: 0.015,
    auto_advance: true,
    auto_advance_delay: 2.4,
    min_display_time: 2.0
  });
  dialogue.say("TONY", "YOU SHOULD HAVE LISTENED.", {
    typewriter_speed: 0.015,
    auto_advance: true,
    auto_advance_delay: 2.4,
    min_display_time: 2.0
  });
  dialogue.narrate("POLICE OFFICERS STEP FORWARD, TASERS READY.", {
    auto_advance_delay: 2.7,
    min_display_time: 2.4
  });

  return create_boss_dialogue_cutscene(
    "cutscene_14_ambush",
    "The Ambush",
    14,
    dialogue,
    {
      camera_zoom: 1.1,
      actions: { set_flag: { ambush_viewed: true, police_fight_started: true } }
    }
  );
}

/**
 * Scene 20: Big Ben Introduction
 */
export function cutscene_20_big_ben() {
  const dialogue = new DialogueBuilder();
  dialogue.narrate("A LARGE MAN APPROACHES. BIG BEN.", {
    auto_advance_delay: 2.4,
    min_display_time: 2.0
  });
  dialogue.say("BIG BEN", "HEY KID. YOU LOOK LIKE YOU COULD USE A FRIEND.", {
    typewriter_speed: 0.015,
    auto_advance: true,
    auto_advance_delay: 2.7,
    min_display_time: 2.4
  });
  dialogue.say("DARIO", "WHO ARE YOU?", {
    typewriter_speed: 0.015,
    auto_advance: true,
    auto_advance_delay: 2.1,
    min_display_time: 1.8
  });
  dialogue.say("BIG BEN", "NAME'S BENNY. I CAN HELP YOU GET OUT OF HERE.", {
    typewriter_speed: 0.015,
    auto_advance: true,
    auto_advance_delay: 3.0,
    min_display_time: 2.7
  });
  dialogue.say("BIG BEN", "BUT FIRST, YOU GOTTA DO SOMETHING FOR ME.", {
    typewriter_speed: 0.015,
    auto_advance: true,
    auto_advance_delay: 2.7,
    min_display_time: 2.4
  });

  return create_dialogue_cutscene(
    "cutscene_20_big_ben",
    "Big Ben Introduction",
    20,
    dialogue,
    {
      actions: { set_flag: { big_ben_met: true, big_ben_deal_proposed: true } }
    }
  );
}

/**
 * Scene 22: The Escape
 */
export function cutscene_22_escape() {
  const dialogue = new DialogueBuilder();
  dialogue.narrate("THE CORRECTIONAL OFFICER FALLS. THE PATH IS CLEAR.", {
    auto_advance_delay: 2.7,
    min_display_time: 2.4
  });
  dialogue.say("BIG BEN", "NICE WORK, KID. YOU HELD UP YOUR END.", {
    typewriter_speed: 0.015,
    auto_advance: true,
    auto_advance_delay: 2.7,
    min_display_time: 2.4
  });
  dialogue.say("DARIO", "NOW WHAT?", {
    typewriter_speed: 0.015,
    auto_advance: true,
    auto_advance_delay: 2.1,
    min_display_time: 1.8
  });
  dialogue.say("BIG BEN", "NOW WE RUN. FOLLOW ME.", {
    typewriter_speed: 0.015,
    auto_advance: true,
    auto_advance_delay: 2.4,
    min_display_time: 2.0
  });

  return create_dialogue_cutscene(
    "cutscene_22_escape",
    "The Escape",
    22,
    dialogue,
    {
      actions: { set_flag: { escape_complete: true } }
    }
  );
}

/**
 * Scene 24: Angela Reunion
 */
export function cutscene_24_angela_reunion() {
  const dialogue = new DialogueBuilder();
  dialogue.narrate("AT THE BUS STOP, DARIO SEES A FAMILIAR FACE.", {
    auto_advance_delay: 2.7,
    min_display_time: 2.4
  });
  dialogue.say("ANGELA", "DARIO! YOU'RE FREE!", {
    typewriter_speed: 0.015,
    auto_advance: true,
    auto_advance_delay: 2.1,
    min_display_time: 1.8
  });
  dialogue.say("DARIO", "ANGELA... I THOUGHT I'D NEVER SEE YOU AGAIN.", {
    typewriter_speed: 0.015,
    auto_advance: true,
    auto_advance_delay: 2.7,
    min_display_time: 2.4
  });
  dialogue.say("ANGELA", "I WAS WORRIED ABOUT YOU.", {
    typewriter_speed: 0.015,
    auto_advance: true,
    auto_advance_delay: 2.4,
    min_display_time: 2.0
  });

  return create_dialogue_cutscene(
    "cutscene_24_angela_reunion",
    "Angela Reunion",
    24,
    dialogue,
    {
      skip_without_confirm: false,
      actions: { set_flag: { angela_reunion_viewed: true } }
    }
  );
}

/**
 * Scene 25: Final Tony Confrontation
 */
export function cutscene_25_final_tony() {
  const dialogue = new DialogueBuilder();
  dialogue.narrate("TONY STANDS AT THE SCHOOL GATES, FINAL AND RESOLUTE.", {
    auto_advance_delay: 3.0,
    min_display_time: 2.7
  });
  dialogue.say("TONY", "THIS ENDS NOW, DARIO.", {
    typewriter_speed: 0.015,
    auto_advance: true,
    auto_advance_delay: 2.4,
    min_display_time: 2.0
  });
  dialogue.say("DARIO", "TONY, IT DOESN'T HAVE TO BE THIS WAY.", {
    typewriter_speed: 0.015,
    auto_advance: true,
    auto_advance_delay: 2.7,
    min_display_time: 2.4
  });
  dialogue.say("TONY", "YES. IT DOES.", {
    typewriter_speed: 0.015,
    auto_advance: true,
    auto_advance_delay: 2.7,
    min_display_time: 2.4
  });

  return create_boss_dialogue_cutscene(
    "cutscene_25_final_tony",
    "Final Tony Confrontation",
    25,
    dialogue,
    {
      camera_zoom: 1.2,
      actions: { set_flag: { final_tony_fight_started: true } }
    }
  );
}

/**
 * Scene 26: Final Romance Scene
 */
export function cutscene_26_final_romance() {
  const dialogue = new DialogueBuilder();
  dialogue.narrate("ON THE ROOFTOP, AS THE SUN SETS...", {
    auto_advance_delay: 3.0,
    min_display_time: 2.7
  });
  dialogue.say("ANGELA", "DARIO... I'M GLAD YOU'RE OKAY.", {
    typewriter_speed: 0.012,
    auto_advance: true,
    auto_advance_delay: 2.7,
    min_display_time: 2.4
  });
  dialogue.say("DARIO", "I COULDN'T HAVE DONE IT WITHOUT YOU.", {
    typewriter_speed: 0.012,
    auto_advance: true,
    auto_advance_delay: 3.0,
    min_display_time: 2.7
  });
  dialogue.say("ANGELA", "MAYBE... MAYBE WE COULD...", {
    typewriter_speed: 0.012,
    auto_advance: true,
    auto_advance_delay: 3.0,
    min_display_time: 2.7
  });
  dialogue.narrate("THEY STAND TOGETHER, WATCHING THE SUNSET.", {
    auto_advance_delay: 3.6,
    min_display_time: 3.0
  });

  return create_dialogue_cutscene(
    "cutscene_26_final_romance",
    "Final Romance Scene",
    26,
    dialogue,
    {
      skip_without_confirm: false,
      actions: { set_flag: { final_romance_viewed: true, story_beat_26_angela_dario_together: true } }
    }
  );
}

/**
 * Scene 27: Epilogue
 */
export function cutscene_27_epilogue() {
  return create_narrative_cutscene(
    "cutscene_27_epilogue",
    "Epilogue",
    27,
    {
      scene_dialogue_key: "27",
      auto_advance: true,
      auto_advance_delay: 3.0,
      min_display_time: 2.7,
      requires_viewed: ["cutscene_26_final_romance"],
      actions: { set_flag: { epilogue_viewed: true } }
    }
  );
}

/**
 * Registry of all story cutscenes
 */
export const STORY_REGISTRY: Record<string, () => any> = {
  "dialogue_3_meeting_angela": dialogue_3_meeting_angela,
  "narrative_1": narrative_1,
  "narrative_scene_1": narrative_scene_1,
  "intro_game": intro_game,
  "intro_scene_1": intro_scene_1,
  "cutscene_6_tony_intro": cutscene_6_tony_intro,
  "cutscene_8_doctor_midnight_intro": cutscene_8_doctor_midnight_intro,
  "cutscene_9_principal": cutscene_9_principal,
  "cutscene_12_angela_recognition": cutscene_12_angela_recognition,
  "cutscene_13_tony_challenge": cutscene_13_tony_challenge,
  "cutscene_14_ambush": cutscene_14_ambush,
  "cutscene_20_big_ben": cutscene_20_big_ben,
  "cutscene_22_escape": cutscene_22_escape,
  "cutscene_24_angela_reunion": cutscene_24_angela_reunion,
  "cutscene_25_final_tony": cutscene_25_final_tony,
  "cutscene_26_final_romance": cutscene_26_final_romance,
  "cutscene_27_epilogue": cutscene_27_epilogue,
  "outro_completion": outro_completion,
  "outro_end": outro_end,
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

