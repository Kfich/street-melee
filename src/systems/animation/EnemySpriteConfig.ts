import { EnemyType } from '../../entities/enemies/Enemy';

/**
 * Enemy sprite mapping
 * Maps enemy types to available sprite folders
 */
export const ENEMY_SPRITE_MAP: Record<EnemyType, string> = {
  basic: 'civi',      // Civi has good animation frames
  galsia: 'police',   // Police sprites for Galsia
  donovan: 'prison-civi' // Prison civi for Donovan
};

/**
 * Enemy sprite configuration
 */
export interface EnemySpriteConfig {
  width: number;
  height: number;
  scale: number;
  originX: number;
  originY: number;
}

export const ENEMY_SPRITE_CONFIG: Record<EnemyType, EnemySpriteConfig> = {
  basic: {
    width: 48,
    height: 64,
    scale: 1,
    originX: 0.5,
    originY: 1.0
  },
  galsia: {
    width: 48,
    height: 64,
    scale: 1,
    originX: 0.5,
    originY: 1.0
  },
  donovan: {
    width: 48,
    height: 64,
    scale: 1,
    originX: 0.5,
    originY: 1.0
  }
};

/**
 * Get enemy sprite config
 */
export function getEnemySpriteConfig(enemyType: EnemyType): EnemySpriteConfig {
  return ENEMY_SPRITE_CONFIG[enemyType] || ENEMY_SPRITE_CONFIG.basic;
}

