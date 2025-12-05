export type CharacterType = 'axel' | 'blaze' | 'max' | 'sammy';

export interface CharacterStats {
  power: number;
  technique: number;
  speed: number;
  jump: number;
  stamina: number;
}

export const CHARACTER_STATS: Record<CharacterType, CharacterStats> = {
  axel: {
    power: 2,
    technique: 3,
    speed: 2,
    jump: 1,
    stamina: 2
  },
  blaze: {
    power: 2,
    technique: 2,
    speed: 2,
    jump: 2,
    stamina: 2
  },
  max: {
    power: 3,
    technique: 2,
    speed: 1,
    jump: 1,
    stamina: 3
  },
  sammy: {
    power: 1,
    technique: 2,
    speed: 3,
    jump: 3,
    stamina: 1
  }
};

