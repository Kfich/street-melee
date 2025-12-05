import { CharacterType } from '../../game/types/CharacterType';

/**
 * Sprite configuration for consistent sizing and rendering
 */
export interface SpriteConfig {
  width: number;
  height: number;
  scale: number;
  originX: number;
  originY: number;
}

/**
 * Character sprite dimensions and settings
 * These should match the actual sprite dimensions or desired display size
 */
export const CHARACTER_SPRITE_CONFIG: Record<CharacterType, SpriteConfig> = {
  axel: {
    width: 48,  // Dario sprites are typically around 48px wide
    height: 64, // Dario sprites are typically around 64px tall
    scale: 1,
    originX: 0.5,
    originY: 1.0  // Bottom center for proper ground alignment
  },
  blaze: {
    width: 48,
    height: 64,
    scale: 1,
    originX: 0.5,
    originY: 1.0
  },
  max: {
    width: 48,
    height: 64,
    scale: 1,
    originX: 0.5,
    originY: 1.0
  },
  sammy: {
    width: 48,
    height: 64,
    scale: 1,
    originX: 0.5,
    originY: 1.0
  }
};

/**
 * Get sprite config for a character
 */
export function getSpriteConfig(characterType: CharacterType): SpriteConfig {
  return CHARACTER_SPRITE_CONFIG[characterType] || CHARACTER_SPRITE_CONFIG.axel;
}

