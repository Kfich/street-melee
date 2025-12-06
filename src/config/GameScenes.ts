/**
 * Game Scenes Configuration
 * Maps all 27 scenes from the boss interaction outline to level/room structure
 */

import { LevelData, SpawnPoint, Wave, Checkpoint } from '../systems/level/LevelManager';

/**
 * Scene mapping: Scene number -> Level and Room
 * Based on the boss interaction outline document
 */
export const SCENE_TO_LEVEL_MAP: Record<number, { level: number; room: number; name: string }> = {
  1: { level: 1, room: 1, name: 'School Entrance' },
  2: { level: 1, room: 2, name: 'School Entrance Hall' },
  3: { level: 1, room: 3, name: 'School Hallway (First Angela Meeting)' },
  4: { level: 1, room: 4, name: 'School Hallway Continued' },
  5: { level: 1, room: 5, name: 'School Hallway End' },
  6: { level: 2, room: 1, name: 'School Courtyard (Tony Confrontation)' },
  7: { level: 2, room: 2, name: 'School Courtyard Continued' },
  8: { level: 2, room: 3, name: 'Classroom (Doctor Midnight)' },
  9: { level: 2, room: 4, name: "Principal's Office" },
  10: { level: 2, room: 5, name: 'School Hallway Transition' },
  11: { level: 3, room: 1, name: 'School Hallway Continued' },
  12: { level: 3, room: 2, name: 'Hallway (Angela Recognition)' },
  13: { level: 3, room: 3, name: "School Basement Entrance (Tony's Challenge)" },
  14: { level: 3, room: 4, name: 'Basement (The Ambush)' },
  15: { level: 3, room: 5, name: 'Basement Exit' },
  16: { level: 4, room: 1, name: 'School Exterior (Arrest)' },
  17: { level: 4, room: 2, name: 'Prison Cell' },
  18: { level: 4, room: 3, name: 'Prison Transition' },
  19: { level: 4, room: 4, name: 'Prison Corridor' },
  20: { level: 4, room: 5, name: 'Prison Dining Hall (Big Ben Introduction)' },
  21: { level: 5, room: 1, name: 'Prison Transition 2' },
  22: { level: 5, room: 2, name: 'Prison Yard (The Escape)' },
  23: { level: 5, room: 3, name: 'Prison Exit' },
  24: { level: 5, room: 4, name: 'Bus Stop (Angela Reunion)' },
  25: { level: 5, room: 5, name: 'School Grounds (Final Fight)' },
  26: { level: 6, room: 1, name: 'School Rooftop (Final Romance Scene)' },
  27: { level: 6, room: 2, name: 'Epilogue' },
};

/**
 * Boss encounter configuration per scene
 */
export const SCENE_BOSS_CONFIG: Record<number, {
  bossType?: 'blizz' | 'tony' | 'midnight' | 'police' | 'angela' | 'principle' | 'benny';
  isCombat: boolean;
  triggerX?: number;
  cutsceneId?: string;
  health?: number;
}> = {
  1: { isCombat: false, cutsceneId: 'narrative_scene_1' },
  3: { bossType: 'angela', isCombat: false, triggerX: 400, cutsceneId: 'dialogue_3_meeting_angela' },
  6: { bossType: 'tony', isCombat: true, triggerX: 500, cutsceneId: 'cutscene_6_tony_intro', health: 155 },
  8: { bossType: 'midnight', isCombat: true, cutsceneId: 'cutscene_8_doctor_midnight_intro', health: 155 },
  9: { bossType: 'principle', isCombat: false, triggerX: 600, cutsceneId: 'cutscene_9_principal' },
  12: { bossType: 'angela', isCombat: false, triggerX: 300, cutsceneId: 'cutscene_12_angela_recognition' },
  13: { bossType: 'tony', isCombat: false, triggerX: 400, cutsceneId: 'cutscene_13_tony_challenge' },
  14: { bossType: 'police', isCombat: true, triggerX: 400, cutsceneId: 'cutscene_14_ambush', health: 100 },
  20: { bossType: 'benny', isCombat: false, triggerX: 500, cutsceneId: 'cutscene_20_big_ben' },
  22: { bossType: 'benny', isCombat: true, triggerX: 400, cutsceneId: 'cutscene_22_escape', health: 150 },
  24: { bossType: 'angela', isCombat: false, triggerX: 400, cutsceneId: 'cutscene_24_angela_reunion' },
  25: { bossType: 'tony', isCombat: true, triggerX: 500, cutsceneId: 'cutscene_25_final_tony', health: 200 },
  26: { bossType: 'angela', isCombat: false, cutsceneId: 'cutscene_26_final_romance' },
  27: { isCombat: false, cutsceneId: 'cutscene_27_epilogue' },
};

/**
 * Generate level configuration for a specific scene range
 */
export function generateLevelConfigForScenes(
  levelNumber: number,
  sceneRange: { start: number; end: number },
  width: number = 2000,
  height: number = 576
): LevelData {
  const spawnPoints: SpawnPoint[] = [];
  const waves: Wave[] = [];
  const checkpoints: Checkpoint[] = [];

  // Add spawn points, waves, and checkpoints based on scenes in this level
  for (let sceneNum = sceneRange.start; sceneNum <= sceneRange.end; sceneNum++) {
    const sceneConfig = SCENE_BOSS_CONFIG[sceneNum];
    const sceneMap = SCENE_TO_LEVEL_MAP[sceneNum];
    
    if (!sceneMap) continue;

    // Calculate X position for this scene (assuming each scene is ~400 pixels wide)
    const sceneX = (sceneNum - sceneRange.start) * 400 + 200;

    // Add checkpoint for each scene
    checkpoints.push({
      x: sceneX,
      y: height - 100,
      id: `checkpoint_scene_${sceneNum}`,
      activated: false
    });

    // Add boss spawn if this scene has a combat boss
    if (sceneConfig?.isCombat && sceneConfig.bossType) {
      spawnPoints.push({
        x: sceneX + 100,
        y: height - 100,
        type: 'boss',
        bossType: sceneConfig.bossType as any,
        active: true,
        delay: 0
      });
    }

    // Add regular enemies for non-boss scenes or as part of waves
    if (!sceneConfig?.isCombat) {
      // Add some regular enemies
      spawnPoints.push(
        { x: sceneX - 50, y: height - 100, type: 'enemy', enemyType: 'basic', active: true, wave: 0 },
        { x: sceneX + 50, y: height - 100, type: 'enemy', enemyType: 'galsia', active: true, wave: 0 }
      );
    }
  }

  return {
    id: `level${levelNumber}`,
    name: `Level ${levelNumber}`,
    width,
    height,
    backgroundLayers: 3,
    scrollSpeed: 0.5,
    cameraBounds: {
      minX: 0,
      maxX: width,
      minY: 0,
      maxY: height
    },
    spawnPoints,
    waves,
    checkpoints,
    endTriggerX: width - 50,
    requiresAllWaves: true
  };
}

/**
 * Complete level configurations for all 6 levels (27 scenes)
 */
export const COMPLETE_LEVEL_CONFIGS: LevelData[] = [
  // Level 1: Scenes 1-5 (School Entrance through Hallway)
  generateLevelConfigForScenes(1, { start: 1, end: 5 }, 2000, 576),
  
  // Level 2: Scenes 6-10 (Courtyard through Principal's Office)
  generateLevelConfigForScenes(2, { start: 6, end: 10 }, 2000, 576),
  
  // Level 3: Scenes 11-15 (Hallway through Basement)
  generateLevelConfigForScenes(3, { start: 11, end: 15 }, 2000, 576),
  
  // Level 4: Scenes 16-20 (Arrest through Prison Dining Hall)
  generateLevelConfigForScenes(4, { start: 16, end: 20 }, 2000, 576),
  
  // Level 5: Scenes 21-25 (Prison Yard through Final Fight)
  generateLevelConfigForScenes(5, { start: 21, end: 25 }, 2000, 576),
  
  // Level 6: Scenes 26-27 (Rooftop through Epilogue)
  generateLevelConfigForScenes(6, { start: 26, end: 27 }, 2000, 576),
];

