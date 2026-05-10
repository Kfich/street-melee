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
  private roomWidth: number = 2000; // Default room width, will be updated
  private aiState: 'patrol' | 'pursue' | 'attack' | 'hit' = 'patrol';
  private attackCooldown: number = 0;
  private currentHitbox?: Hitbox;
  private targetUpdateCounter: number = 0;
  private targetUpdateFrequency: number = 3; // Update target every 3 frames (reduce from every frame)

  constructor(scene: Phaser.Scene, x: number, y: number, enemyType: EnemyType = 'basic') {
    super(scene, x, y, 'enemy');
    this.enemyType = enemyType;
    this.stats = ENEMY_STATS[enemyType];
    this.maxHealth = this.stats.health;
    this.health = this.maxHealth;
    this.patrolStartX = x;
    
    // Get room width from scene data or use default
    const roomManager = (scene as any).roomManager;
    if (roomManager && typeof roomManager.getRoomWidth === 'function') {
      this.roomWidth = roomManager.getRoomWidth();
      // Set patrol distance to 80% of room width (leaving margins)
      this.patrolDistance = Math.floor(this.roomWidth * 0.8);
    }
    
    this.setupEnemy();
  }

  private setupEnemy() {
    const spriteConfig = getEnemySpriteConfig(this.enemyType);
    
    // For basic (civi) enemies, use walk_1 as idle since idle texture doesn't exist
    let initialTexture = `enemy_${this.enemyType}_idle_right`;
    if (this.enemyType === 'basic') {
      // Civi enemies don't have idle textures, use first walk frame
      initialTexture = 'enemy_basic_walk_1';
    }
    
    if (this.scene.textures.exists(initialTexture)) {
      // Use real sprite texture
      this.sprite.setTexture(initialTexture);
      this.configureEnemySpriteDisplay(spriteConfig);
    } else if (this.scene.anims.exists(`enemy_${this.enemyType}_idle_right`)) {
      // If animation exists, use it
      this.sprite.play(`enemy_${this.enemyType}_idle_right`);
      this.configureEnemySpriteDisplay(spriteConfig);
    } else {
      // Fallback to placeholder if sprites aren't loaded yet
      this.setupPlaceholderEnemySprite(spriteConfig);
    }
  }

  /**
   * Configure enemy sprite display properties
   * Standardizes all enemy sprites to the same display size regardless of source texture size
   */
  private configureEnemySpriteDisplay(config: { width: number; height: number; scale: number; originX: number; originY: number }) {
    // Set origin point (bottom center for proper ground alignment)
    this.sprite.setOrigin(config.originX, config.originY);
    
    // Always use exact config dimensions for consistent sizing across all enemy types
    // This ensures all enemies appear at the same size regardless of source texture dimensions
    // Apply 18% size reduction (multiply by 0.82)
    const sizeMultiplier = 0.82;
    const displayWidth = config.width * config.scale * sizeMultiplier;
    const displayHeight = config.height * config.scale * sizeMultiplier;
    
    this.sprite.setDisplaySize(displayWidth, displayHeight);
    
    // Update physics body
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.setSize(displayWidth * 0.8, displayHeight * 0.9);
      body.setOffset(
        (displayWidth - body.width) / 2,
        displayHeight - body.height
      );
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
    
    // Apply 18% size reduction (multiply by 0.82)
    const sizeMultiplier = 0.82;
    const displayWidth = config.width * sizeMultiplier;
    const displayHeight = config.height * sizeMultiplier;
    this.sprite.setDisplaySize(displayWidth, displayHeight);
    
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
      body.setSize(displayWidth * 0.8, displayHeight * 0.9);
      body.setOffset(
        (displayWidth - body.width) / 2,
        displayHeight - body.height
      );
    }
  }

  update(): void {
    // Skip all logic during the death-sequence so the EnemyManager's tweens
    // can run without the AI fighting them.
    if (this.state === 'dying') return;

    this.checkGrounded();
    this.updateAI();
    this.updateState();
    this.updateAttackCooldown();
    this.updateAnimations();
  }

  /**
   * Update enemy state based on movement and grounded status
   */
  private updateState(): void {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    if (!body) return;

    const state = this.getState();
    // knockedDown and dying own their own lifecycle — don't override them.
    if (state === 'knockedDown' || state === 'dying') return;

    // Update state based on velocity and grounded status
    if (this.isGrounded) {
      if (Math.abs(body.velocity.x) < 10 && state !== 'attacking') {
        this.setState('idle');
      } else if (Math.abs(body.velocity.x) >= 10) {
        // Update facing direction FIRST, then set state
        // This ensures direction is correct before animation update
        this.setFacingRight(body.velocity.x > 0);
        this.setState('walking');
      }
    } else if (state !== 'jumping' && state !== 'attacking') {
      this.setState('jumping');
    }
  }

  /**
   * Update enemy animations based on state
   */
  private updateAnimations(): void {
    // Safety check: ensure sprite and anims exist
    if (!this.sprite || !this.sprite.active || !this.sprite.anims) {
      return;
    }

    // Death / knockdown states are handled by tween sequences — don't override
    const state = this.getState();
    if (state === 'dying' || state === 'knockedDown') return;

    const facingRight = this.isFacingRight();
    const direction = facingRight ? 'right' : 'left';

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
      case 'hitReaction':
        // Brief hit-reaction: play idle but tint is applied externally
        animKey = `enemy_${this.enemyType}_idle_${direction}`;
        break;
      default:
        animKey = `enemy_${this.enemyType}_idle_${direction}`;
    }
    
    // Play animation if it exists
    if (animKey && this.scene.anims.exists(animKey)) {
      // Always update animation if the key is different OR if direction changed
      // This ensures enemies face the correct direction even if state hasn't changed
      // Safety check: ensure anims exists before accessing currentAnim
      const currentAnimKey = (this.sprite.anims && this.sprite.anims.currentAnim) ? this.sprite.anims.currentAnim.key : '';
      const currentDirection = currentAnimKey.includes('_right') ? 'right' : 
                               currentAnimKey.includes('_left') ? 'left' : '';
      
      // Force animation update if key changed, direction changed, or animation is not playing
      const isPlaying = this.sprite.anims ? this.sprite.anims.isPlaying : false;
      if (currentAnimKey !== animKey || currentDirection !== direction || !isPlaying) {
        // When using directional animations (left/right), don't flip the sprite
        // The animation key already handles direction
        this.sprite.setFlipX(false);
        // Play animation with restart flag to ensure it cycles
        this.sprite.play(animKey, true);
      }
    } else {
      // Fallback: try to use texture directly
      const textureKey = `enemy_${this.enemyType}_${state}_${direction}`;
      if (this.scene.textures.exists(textureKey)) {
        // When using directional textures, don't flip - use the correct texture
        this.sprite.setFlipX(false);
        this.sprite.setTexture(textureKey);
      } else {
        // Try walking texture if state-specific doesn't exist
        const walkTextureKey = `enemy_${this.enemyType}_walk_${direction}`;
        const idleTextureKey = `enemy_${this.enemyType}_idle_${direction}`;
        const fallbackTextureKey = state === 'walking' ? walkTextureKey : idleTextureKey;
        
        if (this.scene.textures.exists(fallbackTextureKey)) {
          this.sprite.setFlipX(false);
          this.sprite.setTexture(fallbackTextureKey);
        } else {
          // If no directional texture exists, try flipping the sprite as fallback
          // Try right-facing textures first
          const baseWalkKey = `enemy_${this.enemyType}_walk_right`;
          const baseIdleKey = `enemy_${this.enemyType}_idle_right`;
          const baseTextureKey = state === 'walking' ? baseWalkKey : baseIdleKey;
          
          if (this.scene.textures.exists(baseTextureKey)) {
            this.sprite.setTexture(baseTextureKey);
            this.sprite.setFlipX(!facingRight);
          } else if (this.scene.textures.exists('enemy_placeholder')) {
            // Ultimate fallback: use placeholder and flip
            this.sprite.setTexture('enemy_placeholder');
            this.sprite.setFlipX(!facingRight);
          }
        }
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
    
    // Force animation update after AI updates direction
    // This ensures facing direction is immediately reflected
    this.updateAnimations();
  }

  private findTarget() {
    // Optimized: Use EntityManager instead of searching scene children
    // Update target less frequently to reduce CPU usage
    this.targetUpdateCounter++;
    if (this.targetUpdateCounter < this.targetUpdateFrequency) {
      return; // Skip target update this frame
    }
    this.targetUpdateCounter = 0;

    // Get EntityManager from scene (similar to roomManager access pattern)
    const entityManager = (this.scene as any).entityManager;
    if (!entityManager || typeof entityManager.getPlayers !== 'function') {
      // EntityManager not available, no target
      this.target = null;
      return;
    }

    // Use optimized EntityManager.getPlayers() method
    const players = entityManager.getPlayers();
    if (players.length === 0) {
      this.target = null;
      return;
    }

    // Find nearest player
    let nearestPlayer: Player | null = null;
    let nearestDistance = Infinity;

    for (const player of players) {
      if (!player || !player.sprite || !player.sprite.active) {
        continue;
      }

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

    this.target = nearestPlayer;
  }


  private patrol() {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    if (!body) return;
    
    const currentX = this.sprite.x;
    const leftBound = this.patrolStartX - this.patrolDistance / 2;
    const rightBound = this.patrolStartX + this.patrolDistance / 2;
    
    // Check if we've reached patrol boundary and reverse direction
    if (currentX <= leftBound && this.patrolDirection < 0) {
      this.patrolDirection = 1; // Turn right
    } else if (currentX >= rightBound && this.patrolDirection > 0) {
      this.patrolDirection = -1; // Turn left
    }

    // Move in patrol direction
    body.setVelocityX(this.stats.speed * this.patrolDirection);
    this.setFacingRight(this.patrolDirection > 0);
    // Ensure walking state is set when patrolling
    if (Math.abs(body.velocity.x) > 0) {
      this.setState('walking');
    }
  }

  private pursueTarget() {
    if (!this.target) return;

    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    if (!body) return;

    const targetX = this.target.sprite.x;
    const currentX = this.sprite.x;
    const direction = targetX > currentX ? 1 : -1;

    // Set base velocity - will be enhanced by EnemyAI if available
    body.setVelocityX(this.stats.speed * direction);
    this.setFacingRight(direction > 0);
    // Ensure walking state is set when pursuing
    if (Math.abs(body.velocity.x) > 0) {
      this.setState('walking');
    }
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

  /**
   * Update room width for patrol distance calculation
   */
  setRoomWidth(width: number): void {
    this.roomWidth = width;
    // Update patrol distance to 80% of room width
    this.patrolDistance = Math.floor(this.roomWidth * 0.8);
  }

  /**
   * Reset enemy state for object pooling
   */
  reset(x: number, y: number): void {
    // Reset base entity
    super.reset(x, y);
    
    // Reset enemy-specific state
    this.target = null;
    this.patrolDirection = 1;
    this.patrolStartX = x;
    this.aiState = 'patrol';
    this.attackCooldown = 0;
    this.currentHitbox = undefined;
    this.targetUpdateCounter = 0;
    
    // Reset health
    this.maxHealth = this.stats.health;
    this.health = this.maxHealth;
    
    // Update room width if available
    const roomManager = (this.scene as any).roomManager;
    if (roomManager && typeof roomManager.getRoomWidth === 'function') {
      this.roomWidth = roomManager.getRoomWidth();
      this.patrolDistance = Math.floor(this.roomWidth * 0.8);
    }
    
    // Re-setup enemy sprite
    this.setupEnemy();
  }
}

