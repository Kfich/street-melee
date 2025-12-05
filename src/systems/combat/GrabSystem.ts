import Phaser from 'phaser';
import { BaseCharacter } from '../../entities/characters/BaseCharacter';
import { BaseEntity } from '../../entities/base/BaseEntity';
import { Hitbox } from './Hitbox';
import { GameConfig } from '../../config/GameConfig';

export type GrabType = 'front' | 'back' | 'fullNelson';

/**
 * Grab system for handling character grabs and throws
 */
export class GrabSystem {
  private scene: Phaser.Scene;
  private activeGrabs: Map<BaseCharacter, {
    target: BaseEntity;
    type: GrabType;
    startTime: number;
  }> = new Map();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Attempt to grab a target
   */
  attemptGrab(graber: BaseCharacter, target: BaseEntity, grabRange: number = 35): boolean {
    // Can't grab if already grabbing
    if (this.activeGrabs.has(graber)) return false;
    
    // Can't grab if target is already being grabbed
    for (const grab of this.activeGrabs.values()) {
      if (grab.target === target) return false;
    }

    // Check distance
    const distance = Phaser.Math.Distance.Between(
      graber.sprite.x,
      graber.sprite.y,
      target.sprite.x,
      target.sprite.y
    );

    if (distance > grabRange) return false;

    // Determine grab type based on facing direction
    const graberFacingRight = graber.isFacingRight();
    const targetX = target.sprite.x;
    const graberX = graber.sprite.x;
    
    let grabType: GrabType = 'front';
    
    // Check if behind target
    if ((graberFacingRight && graberX < targetX) || (!graberFacingRight && graberX > targetX)) {
      grabType = 'back';
    }

    // Start grab
    this.startGrab(graber, target, grabType);
    return true;
  }

  /**
   * Start a grab
   */
  private startGrab(graber: BaseCharacter, target: BaseEntity, type: GrabType) {
    this.activeGrabs.set(graber, {
      target,
      type,
      startTime: Date.now()
    });

    // Set states
    graber.setState('grabbing');
    target.setState('grabbed');

    // Position target relative to graber
    this.updateGrabPosition(graber, target, type);
  }

  /**
   * Update grab position
   */
  private updateGrabPosition(graber: BaseCharacter, target: BaseEntity, type: GrabType) {
    const graberSprite = graber.sprite;
    const targetSprite = target.sprite;
    
    let offsetX = 0;
    let offsetY = 0;

    if (type === 'front') {
      offsetX = graber.isFacingRight() ? 20 : -20;
    } else if (type === 'back') {
      offsetX = graber.isFacingRight() ? -20 : 20;
    } else if (type === 'fullNelson') {
      offsetX = 0;
      offsetY = -5;
    }

    targetSprite.setPosition(graberSprite.x + offsetX, graberSprite.y + offsetY);
    
    // Stop target movement
    const targetBody = targetSprite.body as Phaser.Physics.Arcade.Body;
    targetBody.setVelocity(0, 0);
  }

  /**
   * Release a grab
   */
  releaseGrab(graber: BaseCharacter) {
    const grab = this.activeGrabs.get(graber);
    if (!grab) return;

    grab.target.setState('idle');
    graber.setState('idle');
    
    this.activeGrabs.delete(graber);
  }

  /**
   * Perform a throw
   */
  performThrow(graber: BaseCharacter, direction: 'left' | 'right' | 'up' | 'down', isSlam: boolean = false): boolean {
    const grab = this.activeGrabs.get(graber);
    if (!grab) return false;

    const target = grab.target;
    const targetBody = target.sprite.body as Phaser.Physics.Arcade.Body;
    
    // Calculate throw force
    let throwX = 0;
    let throwY = 0;
    let damage = 20;

    switch (direction) {
      case 'left':
        throwX = -300;
        throwY = -50;
        break;
      case 'right':
        throwX = 300;
        throwY = -50;
        break;
      case 'up':
        throwX = 0;
        throwY = -400;
        damage = 25;
        break;
      case 'down':
        throwX = 0;
        throwY = 200;
        damage = 30;
        isSlam = true; // Down throws are always slams
        break;
    }

    // Apply throw force
    targetBody.setVelocity(throwX, throwY);

    // Apply damage
    target.takeDamage(damage);

    // Screen shake for slams
    if (isSlam) {
      this.scene.cameras.main.shake(200, 0.01);
      target.setState('knockedDown');
    } else {
      target.setState('idle');
    }

    // Release grab
    this.releaseGrab(graber);

    // Visual feedback
    this.createThrowEffect(target.sprite, isSlam);

    return true;
  }

  /**
   * Create visual effect for throw
   */
  private createThrowEffect(sprite: Phaser.Physics.Arcade.Sprite, isSlam: boolean) {
    if (isSlam) {
      // Slam effect - flash and scale
      sprite.setTint(0xff0000);
      this.scene.tweens.add({
        targets: sprite,
        scaleX: 1.2,
        scaleY: 0.8,
        duration: 100,
        yoyo: true,
        onComplete: () => {
          sprite.clearTint();
          sprite.setScale(1, 1);
        }
      });
    }
  }

  /**
   * Update all active grabs
   */
  update() {
    this.activeGrabs.forEach((grab, graber) => {
      this.updateGrabPosition(graber, grab.target, grab.type);
    });
  }

  /**
   * Check if character is grabbing
   */
  isGrabbing(character: BaseCharacter): boolean {
    return this.activeGrabs.has(character);
  }

  /**
   * Get grab info for a character
   */
  getGrabInfo(character: BaseCharacter): { target: BaseEntity; type: GrabType } | null {
    const grab = this.activeGrabs.get(character);
    if (!grab) return null;
    return { target: grab.target, type: grab.type };
  }

  /**
   * Vault over enemy (switch grab position)
   */
  vault(graber: BaseCharacter): boolean {
    const grab = this.activeGrabs.get(graber);
    if (!grab) return false;

    // Switch between front and back
    let newType: GrabType = grab.type === 'front' ? 'back' : 'front';
    
    // Update grab type
    grab.type = newType;
    
    return true;
  }
}

