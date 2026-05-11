/**
 * Street Melee deterministic scene music routing.
 *
 * Maps every one of the 27 story scenes (see `SCENE_TO_LEVEL_MAP` in
 * GameScenes.ts) to a track key per phase (cutscene, gameplay, boss,
 * victory, gameComplete). Phase 1 ships before final composition, so any
 * intended-but-missing track key is rerouted via PHASE1_MUSIC_FALLBACKS to an
 * existing track that already lives in AudioConfig + the preload list.
 *
 * Call sites:
 *   const track = getMusicForScene(sceneNumber, 'gameplay');
 *   const bossTrack = getMusicForScene(sceneNumber, 'boss');
 *   const victorySting = getMusicForScene(sceneNumber, 'victory');
 */

export type SceneMusicPhase =
  | 'cutscene'
  | 'gameplay'
  | 'boss'
  | 'victory'
  | 'levelComplete'
  | 'waveClear'
  | 'gameComplete';

export interface SceneMusicEntry {
  cutscene?: string;
  gameplay?: string;
  boss?: string;
  victory?: string;
  gameComplete?: string;
}

export const SCENE_MUSIC_MAP: Record<number, SceneMusicEntry> = {
  1: { cutscene: 'cutscene_intro', gameplay: 'street_school_day' },
  2: { gameplay: 'street_school_day' },
  3: { cutscene: 'cutscene_angela_meeting', gameplay: 'street_school_day' },
  4: { gameplay: 'street_school_day' },
  5: { gameplay: 'street_school_day' },
  6: {
    cutscene: 'cutscene_rival_tension',
    boss: 'boss_tony_first',
    victory: 'sting_boss_defeat',
    gameplay: 'street_courtyard'
  },
  7: { gameplay: 'street_courtyard' },
  8: { cutscene: 'cutscene_authority', boss: 'boss_midnight' },
  9: { cutscene: 'cutscene_authority', gameplay: 'street_courtyard' },
  10: { gameplay: 'street_courtyard' },
  11: { gameplay: 'street_hallway_rematch' },
  12: { cutscene: 'cutscene_angela_meeting', gameplay: 'street_hallway_rematch' },
  13: { cutscene: 'cutscene_rival_tension', gameplay: 'street_hallway_rematch' },
  14: { cutscene: 'cutscene_authority', boss: 'boss_police_ambush' },
  15: { gameplay: 'street_hallway_rematch' },
  16: { gameplay: 'street_arrest_outside' },
  17: { cutscene: 'cutscene_prison_cell', gameplay: 'prison_corridor_cold' },
  18: { gameplay: 'prison_corridor_cold' },
  19: { gameplay: 'prison_corridor_cold' },
  20: { cutscene: 'cutscene_prison_cell', gameplay: 'prison_dining_hall' },
  21: { gameplay: 'prison_dining_hall' },
  22: {
    cutscene: 'cutscene_escape_plan',
    boss: 'boss_benny_brawl',
    victory: 'sting_boss_defeat',
    gameplay: 'prison_yard_escape'
  },
  23: { gameplay: 'prison_yard_escape' },
  24: { cutscene: 'cutscene_angela_meeting', gameplay: 'return_streets' },
  25: {
    cutscene: 'cutscene_rival_tension',
    boss: 'boss_final_tony',
    victory: 'sting_boss_defeat'
  },
  26: { cutscene: 'cutscene_romance_finale' },
  27: { cutscene: 'cutscene_epilogue', gameComplete: 'sting_game_complete' }
};

/**
 * Phase 1 fallbacks — every intended-but-not-yet-composed track is rerouted
 * to an existing key that's already loaded into the preload list. Remove
 * entries from this map as final tracks are added in Phase 2/3.
 */
export const PHASE1_MUSIC_FALLBACKS: Record<string, string> = {
  // Cutscene underscore — every cinematic stub falls back to the existing
  // chiptune dialogue loop until cinematic tracks are composed.
  cutscene_intro: 'dialogue',
  cutscene_neutral_school: 'dialogue',
  cutscene_angela_meeting: 'dialogue',
  cutscene_rival_tension: 'dialogue',
  cutscene_authority: 'dialogue',
  cutscene_prison_cell: 'dialogue',
  cutscene_escape_plan: 'dialogue',
  cutscene_romance_finale: 'dialogue',
  cutscene_epilogue: 'dialogue',

  // Gameplay arcs — bright funk falls back to level1, gritty/prison to level2.
  street_school_day: 'level1',
  street_courtyard: 'level2',
  street_hallway_rematch: 'level2',
  street_arrest_outside: 'level2',
  prison_corridor_cold: 'level2',
  prison_dining_hall: 'level2',
  prison_yard_escape: 'level2',
  return_streets: 'level1',

  // Boss battles — split between the chiptune boss loop and the full mix.
  boss_tony_first: 'boss',
  boss_midnight: 'bossFight',
  boss_police_ambush: 'bossFight',
  boss_benny_brawl: 'boss',
  boss_final_tony: 'bossFight',

  // Stingers — identity (these keys already exist in AudioConfig SOUND_EFFECTS).
  sting_boss_defeat: 'sting_boss_defeat',
  sting_level_clear: 'sting_level_clear',
  sting_wave_clear: 'sting_wave_clear',
  // Game-complete jingle isn't authored yet; reuse level-clear.
  sting_game_complete: 'sting_level_clear'
};

/**
 * Resolve the track key to play for a given scene and phase. When
 * `usePhase1Fallbacks` is true (default), missing/future track keys are
 * rerouted through PHASE1_MUSIC_FALLBACKS so routing is deterministic before
 * final composition is delivered.
 *
 * Returns undefined when the scene has no entry for the requested phase.
 */
export function getMusicForScene(
  sceneNumber: number,
  phase: SceneMusicPhase,
  usePhase1Fallbacks: boolean = true
): string | undefined {
  // Universal stingers are not scene-keyed.
  if (phase === 'levelComplete') return 'sting_level_clear';
  if (phase === 'waveClear') return 'sting_wave_clear';

  const entry = SCENE_MUSIC_MAP[sceneNumber];
  if (!entry) return undefined;

  const direct = entry[phase as keyof SceneMusicEntry];
  if (!direct) return undefined;

  return usePhase1Fallbacks ? (PHASE1_MUSIC_FALLBACKS[direct] ?? direct) : direct;
}

/**
 * Return every track key that needs to be preloaded for a given scene
 * (deduplicated). Used by streaming preload strategies to warm up audio
 * between scenes.
 */
export function getRequiredMusicKeysForScene(
  sceneNumber: number,
  usePhase1Fallbacks: boolean = true
): string[] {
  const phases: SceneMusicPhase[] = [
    'cutscene',
    'gameplay',
    'boss',
    'victory',
    'gameComplete'
  ];
  const seen = new Set<string>();
  for (const phase of phases) {
    const key = getMusicForScene(sceneNumber, phase, usePhase1Fallbacks);
    if (key) seen.add(key);
  }
  return [...seen];
}
