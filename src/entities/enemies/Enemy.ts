import Phaser from 'phaser';
import { BaseEntity } from '../base/BaseEntity';
import { GameConfig } from '../../config/GameConfig';
import { Player } from '../characters/Player';
import { Hitbox } from '../../systems/combat/Hitbox';
import { getEnemySpriteConfig } from '../../systems/animation/EnemySpriteConfig';

export type EnemyType = 'galsia' | 'donovan' | 'basic';

export interface EnemyStats {
  health: number;
  speed: number;
  damage: number;
  attackRange: number;
  detectionRange: number;
}

export const ENEMY_STATS: Record<EnemyType, EnemyStats> = {
  galsia: {
    health: 50,
    speed: 80,
    damage: 10,
    attackRange: 40,
    detectionRange: 200
  },
  donovan: {
    health: 60,
    speed: 70,
    damage: 12,
    attackRange: 45,
    detectionRange: 180
  },
  basic: {
    health: 40,
    speed: 90,
    damage: 8,
    attackRange: 35,
    detectionRange: 150
  }
};

/**
 * Enemy entity
 */
export class Enemy extends BaseEntity {
  private enemyType: EnemyType;
  private stats: EnemyStats;
  private target: Player | null = null;
  private patrolDirection: number = 1; // 1 for right, -1 for left
  private patrolDistance: number = 100;
  private patrolStartX: number;
  private aiState: 'patrol' | 'pursue' | 'attack' | 'hit' = 'patrol';
  private attackCooldown: number = 0;
  private currentHitbox?: Hitbox;

  constructor(scene: Phaser.Scene, x: number, y: number, enemyType: EnemyType = 'basic') {
    super(scene, x, y, 'enemy');
    this.enemyType = enemyType;
    this.stats = ENEMY_STATS[enemyType];
    this.maxHealth = this.stats.health;
    this.health = this.maxHealth;
    this.patrolStartX = x;
    this.setupEnemy();
  }

  private setupEnemy() {
    const spriteConfig = getEnemySpriteConfig(this.enemyType);
    const idleTexture = `enemy_${this.enemyType}_idle_right`;
    
    if (this.scene.textures.exists(idleTexture)) {
      // Use real sprite texture
      this.sprite.setTexture(idleTexture);
      this.configureEnemySpriteDisplay(spriteConfig);
    } else {
      // Fallback to placeholder if sprites aren't loaded yet
      this.setupPlaceholderEnemySprite(spriteConfig);
    }
  }

  /**
   * Configure enemy sprite display properties
   */
  private configureEnemySpriteDisplay(config: { width: number; height: number; scale: number; originX: number; originY: number }) {
    // Set origin point (bottom center for proper ground alignment)
    this.sprite.setOrigin(config.originX, config.originY);
    
    // Get actual texture dimensions
    const texture = this.scene.textures.get(this.sprite.texture.key);
    const frameKeys = Object.keys(texture.frames);
    const frame = frameKeys.length > 0 ? texture.frames[frameKeys[0]] : null;
    
    if (frame) {
      const actualWidth = frame.width;
      const actualHeight = frame.height;
      
      // Calculate scale to fit desired size
      const scaleX = config.width / actualWidth;
      const scaleY = config.height / actualHeight;
      const scale = Math.min(scaleX, scaleY) * config.scale;
      
      // Set display size
      this.sprite.setDisplaySize(actualWidth * scale, actualHeight * scale);
      
      // Update physics body
      const body = this.sprite.body as Phaser.Physics.Arcade.Body;
      if (body) {
        body.setSize(this.sprite.displayWidth * 0.8, this.sprite.displayHeight * 0.9);
        body.setOffset(
          (this.sprite.displayWidth - body.width) / 2,
          this.sprite.displayHeight - body.height
        );
      }
    } else {
      // Fallback: use config dimensions
      this.sprite.setDisplaySize(config.width, config.height);
      const body = this.sprite.body as Phaser.Physics.Arcade.Body;
      if (body) {
        body.setSize(config.width * 0.8, config.height * 0.9);
        body.setOffset(
          (config.width - body.width) / 2,
          config.height - body.height
        );
      }
    }
    
    // Enable pixel-perfect rendering
    if (this.scene.textures.exists(this.sprite.texture.key)) {
      const texture = this.scene.textures.get(this.sprite.texture.key);
      texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
    }
  }

  /**
   * Setup placeholder enemy sprite
   */
  private setupPlaceholderEnemySprite(config: { width: number; height: number; originX: number; originY: number }) {
    if (!this.scene.textures.exists('enemy_placeholder')) {
      const graphics = this.scene.add.graphics();
      
      // Draw body (rounded rectangle)
      graphics.fillStyle(0xff0000);
      graphics.fillRoundedRect(0, 0, config.width, config.height, 4);
      
      // Draw head (circle on top)
      graphics.fillStyle(0x8b4513); // Brown
      graphics.fillCircle(config.width / 2, 8, 8);
      
      // Draw angry eyes
      graphics.fillStyle(0x000000);
      graphics.fillCircle(config.width / 2 - 3, 7, 2);
      graphics.fillCircle(config.width / 2 + 3, 7, 2);
      
      graphics.generateTexture('enemy_placeholder', config.width, config.height);
      graphics.destroy();
    }

    this.sprite.setTexture('enemy_placeholder');
    this.sprite.setOrigin(config.originX, config.originY);
    this.sprite.setDisplaySize(config.width, config.height);
    
    // Enemy type-specific colors
    const colors: Record<EnemyType, number> = {
      basic: 0xff0000,   // Red
      galsia: 0xff6600,  // Orange
      donovan: 0x990000  // Dark red
    };
    this.sprite.setTint(colors[this.enemyType] || 0xff0000);
    
    // Update physics body
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.setSize(config.width * 0.8, config.height * 0.9);
      body.setOffset(
        (config.width - body.width) / 2,
        config.height - body.height
      );
    }
  }

  update(): void {
    this.checkGrounded();
    this.updateAI();
    this.updateAttackCooldown();
    this.updateAnimations();
  }

  /**
   * Update enemy animations based on state
   */
  private updateAnimations(): void {
    const facingRight = this.isFacingRight();
    const direction = facingRight ? 'right' : 'left';
    const state = this.getState();
    
    let animKey: string | null = null;
    
    // Determine animation based on state
    switch (state) {
      case 'idle':
        animKey = `enemy_${this.enemyType}_idle_${direction}`;
        break;
      case 'walking':
        animKey = `enemy_${this.enemyType}_walk_${direction}`;
        break;
      case 'attacking':
        animKey = `enemy_${this.enemyType}_attack_${direction}`;
        break;
      default:
        animKey = `enemy_${this.enemyType}_idle_${direction}`;
    }
    
    // Play animation if it exists
    if (animKey && this.scene.anims.exists(animKey)) {
      if (this.sprite.anims.currentAnim?.key !== animKey) {
        this.sprite.play(animKey, true);
      }
    } else {
      // Fallback: try to use texture directly
      const textureKey = `enemy_${this.enemyType}_idle_${direction}`;
      if (this.scene.textures.exists(textureKey)) {
        this.sprite.setTexture(textureKey);
      }
    }
    
    // Ensure pixel-perfect rendering
    if (this.scene.textures.exists(this.sprite.texture.key)) {
      const texture = this.scene.textures.get(this.sprite.texture.key);
      texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
    }
  }

  private updateAttackCooldown() {
    if (this.attackCooldown > 0) {
      this.attackCooldown -= 16; // ~60fps
    }
  }

  private updateAI() {
    // Find nearest player
    this.findTarget();

    if (this.target) {
      const distance = Phaser.Math.Distance.Between(
        this.sprite.x,
        this.sprite.y,
        this.target.sprite.x,
        this.target.sprite.y
      );

      if (distance < this.stats.attackRange && this.attackCooldown <= 0) {
        // Attack
        this.aiState = 'attack';
        this.performAttack();
      } else if (distance < this.stats.detectionRange) {
        // Pursue
        this.aiState = 'pursue';
        this.pursueTarget();
      } else {
        // Patrol
        this.aiState = 'patrol';
        this.patrol();
      }
    } else {
      // No target, patrol
      this.aiState = 'patrol';
      this.patrol();
    }
  }

  private findTarget() {
    // Find nearest player by searching scene data
    // This is a simplified approach - in production, use a proper entity manager
    let nearestPlayer: Player | null = null;
    let nearestDistance = Infinity;

    // Search through scene's data manager or use a global player list
    // For now, we'll use a simple approach: check all sprites with player data
    this.scene.children.list.forEach(child => {
      if (child instanceof Phaser.Physics.Arcade.Sprite) {
        const isPlayer = child.getData('isPlayer');
        if (isPlayer) {
          const player = child.getData('playerEntity') as Player;
          if (player) {
            const distance = Phaser.Math.Distance.Between(
              this.sprite.x,
              this.sprite.y,
              player.sprite.x,
              player.sprite.y
            );
            if (distance < nearestDistance) {
              nearestDistance = distance;
              nearestPlayer = player;
            }
          }
        }
      }
    });

    this.target = nearestPlayer;
  }

  private patrol() {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    const currentX = this.sprite.x;
    
    // Check if we've reached patrol boundary
    if (Math.abs(currentX - this.patrolStartX) >= this.patrolDistance) {
      this.patrolDirection *= -1;
    }

    // Move in patrol direction
    body.setVelocityX(this.stats.speed * this.patrolDirection);
    this.setFacingRight(this.patrolDirection > 0);
  }

  private pursueTarget() {
    if (!this.target) return;

    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    const targetX = this.target.sprite.x;
    const currentX = this.sprite.x;
    const direction = targetX > currentX ? 1 : -1;

    body.setVelocityX(this.stats.speed * direction);
    this.setFacingRight(direction > 0);
  }

  private performAttack() {
    if (this.attackCooldown > 0) return;

    this.attackCooldown = 600; // 1 second cooldown
    this.setState('attacking');

    // Create attack hitbox
    const facingRight = this.facingRight;
    const offsetX = facingRight ? 20 : -20;
    
    this.currentHitbox = new Hitbox(
      this.sprite,
      offsetX,
      -10,
      30,
      40,
      this.stats.damage,
      { x: 100, y: 0 },
      false
    );

    // Register hitbox
    this.scene.events.emit('hitboxCreated', this.currentHitbox);

    // End attack after duration
    this.scene.time.delayedCall(GameConfig.ATTACK_DURATION, () => {
      if (this.aiState === 'attack') {
        this.setState('idle');
        this.aiState = 'patrol';
      }
      if (this.currentHitbox) {
        this.currentHitbox.deactivate();
        this.currentHitbox = undefined;
      }
    });
  }

  getEnemyType(): EnemyType {
    return this.enemyType;
  }

  getCurrentHitbox(): Hitbox | undefined {
    return this.currentHitbox;
  }
}

