import Phaser from 'phaser';
import { BaseCharacter } from './BaseCharacter';
import { CharacterType } from '../../game/types/CharacterType';
import { AnimationSystem } from '../../systems/animation/AnimationSystem';
import { ComboSystem } from '../../systems/combat/ComboSystem';
import { SpecialMoveSystem } from '../../systems/combat/SpecialMoveSystem';

/**
 * Player character entity
 * Currently uses BaseCharacter, but can be extended with character-specific logic
 */
export class Player extends BaseCharacter {
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    characterType: CharacterType,
    playerIndex: number,
    animationSystem?: AnimationSystem,
    comboSystem?: ComboSystem,
    specialMoveSystem?: SpecialMoveSystem
  ) {
    super(scene, x, y, characterType, playerIndex, animationSystem, comboSystem, specialMoveSystem);
  }

  // Character-specific implementations can be added here
  // For now, we use the base implementation
}

