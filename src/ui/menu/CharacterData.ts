import { CharacterType } from '../../game/types/CharacterType';

/**
 * Character description and metadata
 */
export interface CharacterData {
  name: string;
  description: string;
  playstyle: string;
  specialMove: string;
  signatureMove: string;
}

/**
 * Character descriptions and metadata
 */
export const CHARACTER_DATA: Record<CharacterType, CharacterData> = {
  axel: {
    name: 'AXEL',
    description: 'A skilled fighter with excellent technique and combo ability.',
    playstyle: 'Balanced fighter with strong combo potential',
    specialMove: 'Dragon Smash / Tornado Kick',
    signatureMove: 'Grand Upper',
  },
  blaze: {
    name: 'BLAZE',
    description: 'A well-rounded fighter with balanced stats across the board.',
    playstyle: 'Versatile fighter, good at everything',
    specialMove: 'Wave Motion / Windmill Kick',
    signatureMove: 'Er qi jiaq',
  },
  max: {
    name: 'MAX',
    description: 'A powerful brawler with immense strength and durability.',
    playstyle: 'Powerhouse, excels in close combat',
    specialMove: 'Shoulder Tackle / Double Lariat',
    signatureMove: 'Various Throws (Suplex, Piledriver)',
  },
  sammy: {
    name: 'SAMMY',
    description: 'A fast and agile fighter who relies on speed and mobility.',
    playstyle: 'Speed demon, hit and run tactics',
    specialMove: 'Corkscrew Kick / Double Spin Kick',
    signatureMove: 'Dash Punch / Dynamite Headbutt',
  },
};

/**
 * Get character data
 */
export function getCharacterData(characterType: CharacterType): CharacterData {
  return CHARACTER_DATA[characterType];
}

/**
 * Get character sprite key for display
 */
export function getCharacterDisplaySprite(characterType: CharacterType, direction: 'left' | 'right' = 'right'): string {
  return `${characterType}_idle_${direction}`;
}

