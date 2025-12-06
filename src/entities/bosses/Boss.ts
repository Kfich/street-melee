import Phaser from 'phaser';
import { BaseEntity } from '../base/BaseEntity';
import { Player } from '../characters/Player';
import { Hitbox } from '../../systems/combat/Hitbox';

export type BossType = 'blizz' | 'benny' | 'principle' | 'midnight' | 'angela' | 'tony' | 'police';

export interface BossStats {
  health: number;
  speed: number;
  damage: number;
  attackRange: number;
  detectionRange: number;
  attackCooldown: number;
  canAttack: boolean; // Whether this boss can attack
  spriteKey: string; // Base sprite key for this boss
}

export interface BossPhase {
  healthThreshold: number; // Health percentage (0-1) when this phase starts
  attackPatterns: string[]; // Available attack patterns in this phase
  speedMultiplier: number; // Speed modifier for this phase
  damageMultiplier: number; // Damage modifier for this phase
}

export const BOSS_STATS: Record<BossType, BossStats> = {
  blizz: {
    health: 500,
    speed: 60,
    damage: 20,
    attackRange: 80,
    detectionRange: 400,
    attackCooldown: 2000,
    canAttack: true,
    spriteKey: 'blizz'
  },
  benny: {
    health: 600,
    speed: 50,
    damage: 25,
    attackRange: 100,
    detectionRange: 350,
    attackCooldown: 2500,
    canAttack: true,
    spriteKey: 'benny'
  },
  principle: {
    health: 300,
    speed: 0,
    damage: 0,
    attackRange: 0,
    detectionRange: 0,
    attackCooldown: 0,
    canAttack: false,
    spriteKey: 'principle'
  },
  midnight: {
    health: 450,
    speed: 70,
    damage: 18,
    attackRange: 70,
    detectionRange: 450,
    attackCooldown: 1800,
    canAttack: true,
    spriteKey: 'midnight'
  },
  angela: {
    health: 200,
    speed: 0,
    damage: 0,
    attackRange: 0,
    detectionRange: 0,
    attackCooldown: 0,
    canAttack: false,
    spriteKey: 'angela'
  },
  tony: {
    health: 155, // Base health, can be scaled up for final fight (200 HP)
    speed: 60,
    damage: 20,
    attackRange: 400, // Ranged attacker (ice shards)
    detectionRange: 500,
    attackCooldown: 1200, // Shoots every 1.2 seconds (72 frames)
    canAttack: true,
    spriteKey: 'tony'
  },
  police: {
    health: 100,
    speed: 50,
    damage: 15,
    attackRange: 350, // Projectile-based (taser)
    detectionRange: 400,
    attackCooldown: 1500, // Burst fire pattern
    canAttack: true,
    spriteKey: 'police'
  }
};

/**
 * Boss entity with multiple phases and attack patterns
 */
export class Boss extends BaseEntity {
  private bossType: BossType;
  private stats: BossStats;
  private target: Player | null = null;
  private aiState: 'idle' | 'pursue' | 'attack' | 'hit' | 'special' = 'idle';
  private attackCooldown: number = 0;
  private currentHitbox?: Hitbox;
  private currentPhase: number = 0;
  private phases: BossPhase[] = [];
  private lastAttackPattern: string = '';
  private attackPatternCooldown: number = 0;
  private invincibilityFrames: number = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, bossType: BossType) {
    const stats = BOSS_STATS[bossType];
    const initialSpriteKey = `${stats.spriteKey}_idle_left`;
    
    // Use boss-specific sprite, or fallback if it doesn't exist
    const spriteKey = scene.textures.exists(initialSpriteKey) ? initialSpriteKey : 'blizz_idle_left';
    if (!scene.textures.exists(initialSpriteKey)) {
      console.warn(`[Boss] Sprite ${initialSpriteKey} not found for boss type ${bossType}, using fallback`);
    }
    
    super(scene, x, y, spriteKey);
    
    this.bossType = bossType;
    this.stats = stats;
    this.maxHealth = this.stats.health;
    this.health = this.maxHealth;
    this.setupBoss();
    if (this.stats.canAttack) {
      this.initializePhases();
    }
    
    // Ensure sprite is visible
    this.sprite.setVisible(true);
    this.sprite.setActive(true);
    console.log(`[Boss] Created ${bossType} boss at (${x}, ${y}) with sprite ${this.sprite.texture.key}`);
  }

  private setupBoss() {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    if (body) {
      // Set size based on boss type
      if (this.bossType === 'principle' || this.bossType === 'midnight') {
        body.setSize(50, 80);
        body.setOffset(5, 5);
      } else if (this.bossType === 'angela') {
        body.setSize(40, 70);
        body.setOffset(5, 5);
      } else {
        body.setSize(60, 80);
        body.setOffset(10, 10);
      }
    }

    // Set boss appearance
    if (this.bossType === 'angela' || this.bossType === 'principle') {
      this.sprite.setScale(1.0); // Normal size for non-combat bosses
    } else if (this.bossType === 'police') {
      this.sprite.setScale(0.8); // Smaller scale for police characters
    } else {
      this.sprite.setScale(1.2); // Slightly larger for combat bosses
    }

    // Set origin for proper positioning
    this.sprite.setOrigin(0.5, 1); // Bottom center

    // Set initial depth based on Y position for proper layering
    // Entities lower on screen (higher Y) should appear in front
    this.sprite.setDepth(this.sprite.y);

    // Boss-specific physics (only for attacking bosses)
    if (this.stats.canAttack && body) {
      body.setMass(2); // Heavier than regular enemies
    }
  }

  /**
   * Initialize boss phases based on health thresholds
   */
  private initializePhases() {
    this.phases = [
      {
        healthThreshold: 1.0, // Phase 1: 100-66% health
        attackPatterns: ['basic_attack', 'charge_attack'],
        speedMultiplier: 1.0,
        damageMultiplier: 1.0
      },
      {
        healthThreshold: 0.66, // Phase 2: 66-33% health
        attackPatterns: ['basic_attack', 'charge_attack', 'area_attack'],
        speedMultiplier: 1.2,
        damageMultiplier: 1.2
      },
      {
        healthThreshold: 0.33, // Phase 3: 33-0% health (enraged)
        attackPatterns: ['basic_attack', 'charge_attack', 'area_attack', 'desperation_attack'],
        speedMultiplier: 1.5,
        damageMultiplier: 1.5
      }
    ];
  }

  /**
   * Update boss AI and behavior
   */
  update(): void {
    // Safety check: don't update if sprite is destroyed or inactive
    if (!this.sprite || !this.sprite.active || !this.sprite.body) {
      return;
    }

    this.checkGrounded();
    this.updatePhase();
    this.updateAI();
    this.updateAttackCooldown();
    this.updateInvincibility();
    this.updateSprite();
    this.updateDepth();
  }

  /**
   * Update boss depth based on Y position for proper layering
   * Entities lower on screen should appear in front
   */
  private updateDepth(): void {
    // Use Y position for depth sorting (lower Y = higher depth = appears in front)
    // This ensures proper layering when entities are at different heights
    this.sprite.setDepth(this.sprite.y);
  }

  /**
   * Update boss sprite based on state and direction
   */
  private updateSprite(): void {
    const direction = this.isFacingRight() ? 'right' : 'left';
    const spriteKey = this.stats.spriteKey;
    let newTextureKey = '';

    // Determine texture based on state
    if (this.aiState === 'attack' && this.stats.canAttack) {
      newTextureKey = `${spriteKey}_attack_${direction}`;
    } else if (this.aiState === 'pursue' && this.sprite.body && Math.abs((this.sprite.body as Phaser.Physics.Arcade.Body).velocity.x) > 10) {
      // Walking animation for bosses with multiple walk frames
      if (spriteKey === 'blizz' || spriteKey === 'tony') {
        const walkFrame = Math.floor(Date.now() / 200) % 3 + 1;
        newTextureKey = `${spriteKey}_walk_${direction}_${walkFrame}`;
      } else if (spriteKey === 'angela') {
        const walkFrame = Math.floor(Date.now() / 200) % 3 + 1;
        newTextureKey = `${spriteKey}_walk_${direction}_${walkFrame}`;
      } else {
        newTextureKey = `${spriteKey}_walk_${direction}`;
      }
    } else {
      // Idle or special states
      if (spriteKey === 'principle' && this.aiState === 'special') {
        newTextureKey = `${spriteKey}_action_${direction}`;
      } else if (spriteKey === 'midnight' && this.aiState === 'special') {
        newTextureKey = `${spriteKey}_point_${direction}`;
      } else {
        newTextureKey = `${spriteKey}_idle_${direction}`;
      }
    }

    // Always update texture if direction changed, even if texture key is the same
    // This ensures bosses face the correct direction
    const currentTextureKey = this.sprite.texture.key;
    const currentDirection = currentTextureKey.includes('_right') ? 'right' : 
                            currentTextureKey.includes('_left') ? 'left' : '';
    
    // Update if texture exists and is different, OR if direction changed
    if (this.scene.textures.exists(newTextureKey) && 
        (currentTextureKey !== newTextureKey || currentDirection !== direction)) {
      this.sprite.setTexture(newTextureKey);
      // Never flip sprite when using directional textures
      this.sprite.setFlipX(false);
      // Maintain scale for police characters after texture change
      if (this.bossType === 'police') {
        this.sprite.setScale(0.8);
      }
    } else if (!this.scene.textures.exists(newTextureKey)) {
      // Fallback: if directional texture doesn't exist, try base texture and flip
      const baseTextureKey = newTextureKey.replace(`_${direction}`, '_right');
      if (this.scene.textures.exists(baseTextureKey)) {
        this.sprite.setTexture(baseTextureKey);
        this.sprite.setFlipX(!this.isFacingRight());
      }
    }
  }

  /**
   * Update current phase based on health
   */
  private updatePhase(): void {
    const healthPercent = this.health / this.maxHealth;
    
    for (let i = this.phases.length - 1; i >= 0; i--) {
      if (healthPercent <= this.phases[i].healthThreshold) {
        if (this.currentPhase !== i) {
          this.currentPhase = i;
          this.onPhaseChange(i);
        }
        break;
      }
    }
  }

  /**
   * Called when boss enters a new phase
   */
  private onPhaseChange(phase: number): void {
    const phaseData = this.phases[phase];
    console.log(`[Boss] ${this.bossType} entering phase ${phase + 1} (${(phaseData.healthThreshold * 100).toFixed(0)}% health threshold)`);
    
    // Visual effect for phase change
    this.scene.events.emit('bossPhaseChange', {
      boss: this,
      phase: phase + 1,
      bossType: this.bossType
    });

    // Flash effect
    this.sprite.setTint(0xffffff);
    this.scene.time.delayedCall(200, () => {
      this.sprite.clearTint();
    });
  }

  /**
   * Update boss AI behavior
   */
  private updateAI(): void {
    // Safety check: ensure sprite and body exist
    if (!this.sprite || !this.sprite.active || !this.sprite.body) {
      return;
    }

    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    if (!body) {
      return;
    }

    // Non-attacking bosses just stay idle
    if (!this.stats.canAttack) {
      this.aiState = 'idle';
      body.setVelocityX(0);
      return;
    }

    if (this.aiState === 'hit' && this.invincibilityFrames <= 0) {
      this.aiState = 'idle';
    }

    // Find nearest player target
    this.findTarget();

    if (!this.target) {
      this.aiState = 'idle';
      return;
    }

    const distance = Phaser.Math.Distance.Between(
      this.sprite.x,
      this.sprite.y,
      this.target.sprite.x,
      this.target.sprite.y
    );

    const currentPhase = this.phases[this.currentPhase];
    const effectiveSpeed = this.stats.speed * currentPhase.speedMultiplier;

    switch (this.aiState) {
      case 'idle':
      case 'pursue':
        // Update facing direction to face the target
        const dx = this.target.sprite.x - this.sprite.x;
        this.facingRight = dx > 0;
        
        if (distance <= this.stats.attackRange && this.attackCooldown <= 0) {
          this.performAttack();
        } else if (distance <= this.stats.detectionRange) {
          this.pursueTarget(effectiveSpeed);
        }
        break;

      case 'attack':
        // Attack state is handled by attack patterns
        if (this.attackCooldown <= 0) {
          this.aiState = 'idle';
        }
        break;

      case 'special':
        // Special attack state
        if (this.attackPatternCooldown <= 0) {
          this.aiState = 'idle';
        }
        break;
    }
  }

  /**
   * Find nearest player target
   */
  private findTarget(): void {
    const players = this.scene.children.list.filter(
      (child: any) => child.getData && child.getData('entity') instanceof Player
    ) as Phaser.GameObjects.GameObject[];

    if (players.length === 0) {
      this.target = null;
      return;
    }

    let nearestPlayer: Player | null = null;
    let nearestDistance = Infinity;

    players.forEach((playerObj: any) => {
      const player = playerObj.getData('entity') as Player;
      if (!player || !player.sprite || !player.sprite.active) return;

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
    });

    this.target = nearestPlayer;
  }

  /**
   * Pursue target player
   */
  private pursueTarget(speed: number): void {
    if (!this.target) return;
    
    // Safety check: ensure sprite and body exist
    if (!this.sprite || !this.sprite.active || !this.sprite.body) {
      return;
    }

    this.aiState = 'pursue';
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    if (!body) {
      return;
    }
    
    const dx = this.target.sprite.x - this.sprite.x;
    // Update facing direction (don't flip sprite - directional textures handle direction)
    this.facingRight = dx > 0;

    if (Math.abs(dx) > 10) {
      body.setVelocityX(dx > 0 ? speed : -speed);
      this.state = 'walking';
    } else {
      body.setVelocityX(0);
      this.state = 'idle';
    }
    
    // updateSprite() will be called in the update loop to apply the correct directional texture
  }

  /**
   * Perform an attack based on current phase
   */
  private performAttack(): void {
    if (this.attackCooldown > 0 || !this.target) return;

    const currentPhase = this.phases[this.currentPhase];
    const availablePatterns = currentPhase.attackPatterns.filter(
      pattern => pattern !== this.lastAttackPattern || this.attackPatternCooldown <= 0
    );

    if (availablePatterns.length === 0) {
      availablePatterns.push(...currentPhase.attackPatterns);
    }

    // Select attack pattern (weighted towards more powerful attacks in later phases)
    let selectedPattern: string;
    if (this.currentPhase === 2 && Math.random() < 0.4) {
      // 40% chance for desperation attack in phase 3
      selectedPattern = 'desperation_attack';
    } else if (this.currentPhase >= 1 && Math.random() < 0.3) {
      // 30% chance for area attack in phase 2+
      selectedPattern = 'area_attack';
    } else if (Math.random() < 0.5) {
      selectedPattern = 'charge_attack';
    } else {
      selectedPattern = 'basic_attack';
    }

    // Ensure selected pattern is available
    if (!availablePatterns.includes(selectedPattern)) {
      selectedPattern = availablePatterns[0];
    }

    this.executeAttackPattern(selectedPattern);
    this.lastAttackPattern = selectedPattern;
    this.attackPatternCooldown = 1000; // Prevent same pattern spam
  }

  /**
   * Execute a specific attack pattern
   */
  private executeAttackPattern(pattern: string): void {
    const currentPhase = this.phases[this.currentPhase];
    const effectiveDamage = this.stats.damage * currentPhase.damageMultiplier;

    switch (pattern) {
      case 'basic_attack':
        this.basicAttack(effectiveDamage);
        break;
      case 'charge_attack':
        this.chargeAttack(effectiveDamage);
        break;
      case 'area_attack':
        this.areaAttack(effectiveDamage);
        break;
      case 'desperation_attack':
        this.desperationAttack(effectiveDamage);
        break;
    }

    this.attackCooldown = this.stats.attackCooldown;
    this.aiState = 'attack';
  }

  /**
   * Basic melee attack
   */
  private basicAttack(damage: number): void {
    const offsetX = this.facingRight ? 50 : -50;
    const hitbox = new Hitbox(
      this.sprite,
      offsetX,
      -20,
      60,
      50,
      damage,
      { x: this.facingRight ? 100 : -100, y: -50 },
      false
    );

    this.currentHitbox = hitbox;
    this.scene.events.emit('hitboxCreated', hitbox);

    // Attack animation timing
    this.scene.time.delayedCall(300, () => {
      if (this.currentHitbox) {
        this.currentHitbox.deactivate();
        this.currentHitbox = undefined;
      }
    });
  }

  /**
   * Charge attack - boss dashes forward
   */
  private chargeAttack(damage: number): void {
    if (!this.target) return;
    
    // Safety check: ensure sprite and body exist
    if (!this.sprite || !this.sprite.active || !this.sprite.body) {
      return;
    }

    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    if (!body) {
      return;
    }
    
    const chargeSpeed = this.stats.speed * 2.5 * this.phases[this.currentPhase].speedMultiplier;
    const direction = this.target.sprite.x > this.sprite.x ? 1 : -1;

    body.setVelocityX(chargeSpeed * direction);
    // Update facing direction (don't flip sprite - directional textures handle direction)
    this.facingRight = direction > 0;

    // Create hitbox during charge
    const hitbox = new Hitbox(
      this.sprite,
      direction * 40,
      -10,
      80,
      60,
      damage,
      { x: direction * 150, y: -30 },
      false
    );

    this.currentHitbox = hitbox;
    this.scene.events.emit('hitboxCreated', hitbox);

    // Stop charge after duration
    this.scene.time.delayedCall(800, () => {
      // Safety check: ensure sprite and body still exist
      if (this.sprite && this.sprite.active && this.sprite.body) {
        const body = this.sprite.body as Phaser.Physics.Arcade.Body;
        if (body) {
          body.setVelocityX(0);
        }
      }
      if (this.currentHitbox) {
        this.currentHitbox.deactivate();
        this.currentHitbox = undefined;
      }
    });
  }

  /**
   * Area attack - damages in a radius
   */
  private areaAttack(damage: number): void {
    // Create circular hitbox around boss
    const hitbox = new Hitbox(
      this.sprite,
      0,
      -30,
      120,
      120,
      damage,
      { x: 0, y: -80 },
      false
    );

    this.currentHitbox = hitbox;
    this.scene.events.emit('hitboxCreated', hitbox);

    // Visual effect
    this.scene.events.emit('bossAreaAttack', {
      x: this.sprite.x,
      y: this.sprite.y,
      radius: 60
    });

    this.scene.time.delayedCall(400, () => {
      if (this.currentHitbox) {
        this.currentHitbox.deactivate();
        this.currentHitbox = undefined;
      }
    });
  }

  /**
   * Desperation attack - powerful multi-hit attack
   */
  private desperationAttack(damage: number): void {
    this.aiState = 'special';
    this.attackPatternCooldown = 3000; // Longer cooldown for desperation

    // Multiple hit attacks in sequence
    const attacks = 3;
    let attackCount = 0;

    const performDesperationHit = () => {
      if (attackCount >= attacks) {
        this.aiState = 'idle';
        return;
      }

      const offsetX = this.facingRight ? 60 : -60;
      const hitbox = new Hitbox(
        this.sprite,
        offsetX,
        -25,
        70,
        55,
        damage * 1.5, // 50% more damage
        { x: this.facingRight ? 120 : -120, y: -60 },
        false
      );

      this.currentHitbox = hitbox;
      this.scene.events.emit('hitboxCreated', hitbox);

      attackCount++;
      this.scene.time.delayedCall(200, () => {
        if (this.currentHitbox) {
          this.currentHitbox.deactivate();
          this.currentHitbox = undefined;
        }
        if (attackCount < attacks) {
          this.scene.time.delayedCall(150, performDesperationHit);
        }
      });
    };

    performDesperationHit();
  }

  /**
   * Update attack cooldown
   */
  private updateAttackCooldown(): void {
    if (this.attackCooldown > 0) {
      this.attackCooldown -= 16; // ~60fps
    }
    if (this.attackPatternCooldown > 0) {
      this.attackPatternCooldown -= 16;
    }
  }

  /**
   * Update invincibility frames
   */
  private updateInvincibility(): void {
    if (this.invincibilityFrames > 0) {
      this.invincibilityFrames -= 16;
      // Flash effect during invincibility
      if (Math.floor(this.invincibilityFrames / 50) % 2 === 0) {
        this.sprite.setAlpha(0.5);
      } else {
        this.sprite.setAlpha(1.0);
      }
    }
  }

  /**
   * Override takeDamage to add invincibility frames and phase change effects
   */
  takeDamage(amount: number): void {
    if (this.invincibilityFrames > 0) return; // Invincible during frames

    const oldHealthPercent = this.health / this.maxHealth;
    super.takeDamage(amount);
    const newHealthPercent = this.health / this.maxHealth;

    // Add invincibility frames after taking damage
    this.invincibilityFrames = 300;
    this.aiState = 'hit';

    // Emit damage event
    this.scene.events.emit('entityDamaged', {
      entity: this,
      damage: amount,
      x: this.sprite.x,
      y: this.sprite.y,
      isHeavy: amount >= 20,
      isKnockdown: false
    });

    // Check if phase changed
    if (oldHealthPercent !== newHealthPercent) {
      // Phase change will be detected in updatePhase()
    }

    // Check if boss is defeated
    if (this.health <= 0) {
      this.onDefeat();
    }
  }

  /**
   * Called when boss is defeated
   */
  private onDefeat(): void {
    console.log(`[Boss] ${this.bossType} defeated!`);
    this.scene.events.emit('bossDefeated', {
      boss: this,
      bossType: this.bossType
    });

    // Death animation/effect
    this.scene.events.emit('bossDefeatEffect', {
      x: this.sprite.x,
      y: this.sprite.y
    });

    // Destroy after delay
    this.scene.time.delayedCall(1000, () => {
      this.sprite.destroy();
    });
  }

  /**
   * Get current phase number (1-indexed)
   */
  getCurrentPhase(): number {
    return this.currentPhase + 1;
  }

  /**
   * Get health percentage
   */
  getHealthPercent(): number {
    return this.health / this.maxHealth;
  }

  /**
   * Get boss type
   */
  getBossType(): BossType {
    return this.bossType;
  }
}

