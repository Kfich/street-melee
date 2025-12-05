import Phaser from 'phaser';
import { BaseEntity } from '../base/BaseEntity';
import { CharacterType, CHARACTER_STATS } from '../../game/types/CharacterType';
import { PlayerInput } from '../../types/GameTypes';
import { GameConfig } from '../../config/GameConfig';
import { Hitbox } from '../../systems/combat/Hitbox';
import { AnimationSystem } from '../../systems/animation/AnimationSystem';
import { ComboSystem } from '../../systems/combat/ComboSystem';
import { SpecialMoveSystem } from '../../systems/combat/SpecialMoveSystem';
import { DashDetector } from '../../systems/input/DashDetector';
import { Weapon } from '../weapons/Weapon';
import { getSpriteConfig } from '../../systems/animation/SpriteConfig';
import { GrabSystem } from '../../systems/combat/GrabSystem';

/**
 * Base class for playable characters
 */
export abstract class BaseCharacter extends BaseEntity {
  protected characterType: CharacterType;
  protected stats: typeof CHARACTER_STATS[CharacterType];
  protected playerIndex: number;
  protected animationSystem?: AnimationSystem;
  protected comboSystem?: ComboSystem;
  protected specialMoveSystem?: SpecialMoveSystem;
  protected dashDetector: DashDetector;
  protected currentHitbox?: Hitbox;
  protected attackCooldown: number = 0;
  protected isPerformingSpecial: boolean = false;
  protected lastDirection: { left: boolean; right: boolean } = { left: false, right: false };
  protected currentWeapon: Weapon | null = null;
  protected lastDropTime: number = 0;
  protected dropCooldown: number = 300; // Prevent accidental double drops
  protected grabSystem?: GrabSystem;
  protected grabbedTarget: BaseEntity | null = null;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    characterType: CharacterType,
    playerIndex: number,
    animationSystem?: AnimationSystem,
    comboSystem?: ComboSystem,
    specialMoveSystem?: SpecialMoveSystem,
    grabSystem?: GrabSystem
  ) {
    super(scene, x, y, 'player');
    this.characterType = characterType;
    this.playerIndex = playerIndex;
    this.stats = CHARACTER_STATS[characterType];
    this.maxHealth = GameConfig.PLAYER_MAX_HEALTH;
    this.health = this.maxHealth;
    this.animationSystem = animationSystem;
    this.comboSystem = comboSystem;
    this.specialMoveSystem = specialMoveSystem;
    this.grabSystem = grabSystem;
    this.dashDetector = new DashDetector();
    this.setupCharacter();
  }

  protected setupCharacter() {
    const spriteConfig = getSpriteConfig(this.characterType);
    const idleTexture = `${this.characterType}_idle_right`;
    
    // Store original Y position before changing origin (X stays the same for center origin)
    const originalY = this.sprite.y;
    
    if (this.scene.textures.exists(idleTexture)) {
      // Use real sprite texture
      this.sprite.setTexture(idleTexture);
      
      // Configure sprite display properties (this will change origin)
      this.configureSpriteDisplay(spriteConfig);
      
      // Adjust position to account for origin change
      // Origin changes from default (0.5, 0.5) to (0.5, 1.0) - bottom center
      // We need to adjust Y position upward by half the sprite height
      const texture = this.scene.textures.get(idleTexture);
      const frame = texture.frames 
        ? (Array.isArray(texture.frames) ? texture.frames[0] : Object.values(texture.frames)[0])
        : null;
      
      if (frame) {
        const displayHeight = this.sprite.displayHeight || frame.height;
        // Adjust Y: move up by half height to account for origin moving from center to bottom
        this.sprite.y = originalY - (displayHeight * 0.5);
      }
    } else {
      // Fallback to placeholder if sprites aren't loaded yet
      this.setupPlaceholderSprite(spriteConfig);
      
      // Adjust position for placeholder too
      const displayHeight = this.sprite.displayHeight || spriteConfig.height;
      this.sprite.y = originalY - (displayHeight * 0.5);
    }
  }

  /**
   * Configure sprite display properties for proper rendering
   */
  private configureSpriteDisplay(config: { width: number; height: number; scale: number; originX: number; originY: number }) {
    // Set origin point (bottom center for proper ground alignment)
    this.sprite.setOrigin(config.originX, config.originY);
    
    // Get actual texture dimensions
    const texture = this.scene.textures.get(this.sprite.texture.key);
    // Get first frame from texture (frames can be array or object)
    const frame = texture.frames 
      ? (Array.isArray(texture.frames) ? texture.frames[0] : Object.values(texture.frames)[0])
      : null;
    
    if (frame) {
      const actualWidth = frame.width;
      const actualHeight = frame.height;
      
      // Calculate scale to fit desired size, or use 1:1 if close enough
      const scaleX = config.width / actualWidth;
      const scaleY = config.height / actualHeight;
      
      // Use uniform scaling to maintain aspect ratio
      const scale = Math.min(scaleX, scaleY) * config.scale;
      
      // Set display size to ensure consistent rendering
      this.sprite.setDisplaySize(actualWidth * scale, actualHeight * scale);
      
      // Update physics body to match display size
      const body = this.sprite.body as Phaser.Physics.Arcade.Body;
      if (body) {
        body.setSize(this.sprite.displayWidth * 0.8, this.sprite.displayHeight * 0.9);
        body.setOffset(
          (this.sprite.displayWidth - body.width) / 2,
          this.sprite.displayHeight - body.height
        );
        // Sync body position with sprite after origin/display changes
        body.updateFromGameObject();
      }
    } else {
      // Fallback: use config dimensions directly
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
    
    // Enable pixel-perfect rendering (no smoothing for pixel art)
    if (this.scene.textures.exists(this.sprite.texture.key)) {
      const texture = this.scene.textures.get(this.sprite.texture.key);
      texture.setFilter(Phaser.Textures.FilterMode.NEAREST); // Pixel-perfect filtering
    }
  }

  /**
   * Setup placeholder sprite
   */
  private setupPlaceholderSprite(config: { width: number; height: number; originX: number; originY: number }) {
    if (!this.scene.textures.exists('player_placeholder')) {
      const graphics = this.scene.add.graphics();
      
      // Draw body (rounded rectangle)
      graphics.fillStyle(0x00ff00);
      graphics.fillRoundedRect(0, 0, config.width, config.height, 4);
      
      // Draw head (circle on top)
      graphics.fillStyle(0xffdbac); // Skin tone
      graphics.fillCircle(config.width / 2, 8, 8);
      
      // Draw eyes
      graphics.fillStyle(0x000000);
      graphics.fillCircle(config.width / 2 - 3, 8, 2);
      graphics.fillCircle(config.width / 2 + 3, 8, 2);
      
      graphics.generateTexture('player_placeholder', config.width, config.height);
      graphics.destroy();
    }
    
    this.sprite.setTexture('player_placeholder');
    this.sprite.setOrigin(config.originX, config.originY);
    this.sprite.setDisplaySize(config.width, config.height);
    
    // Character-specific colors for placeholder
    const colors: Record<CharacterType, number> = {
      axel: 0x00ff00,    // Green
      blaze: 0xff0066,   // Pink/Magenta
      max: 0x0066ff,     // Blue
      sammy: 0xffff00    // Yellow
    };
    this.sprite.setTint(colors[this.characterType] || 0x00ff00);
    
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

  /**
   * Handle player input
   */
  handleInput(input: PlayerInput): void {
    // Check if sprite and body are valid
    if (!this.sprite || !this.sprite.body || !this.sprite.active) {
      return;
    }

    const body = this.sprite.body as Phaser.Physics.Arcade.Body;

    // Check for dash (double-tap)
    const dashDetected = this.dashDetector.checkDash(input.left, input.right);

    // Check if sprite and body are valid
    if (!this.sprite || !this.sprite.body) {
      return;
    }

    // Check if blocked by world bounds
    const isBlockedRight = body.blocked && body.blocked.right;
    const isBlockedLeft = body.blocked && body.blocked.left;

    // Horizontal movement
    if (input.left && !isBlockedLeft) {
      const speed = GameConfig.PLAYER_BASE_SPEED * (1 + this.stats.speed * GameConfig.SPEED_MULTIPLIER);
      if (this.sprite.active) {
        this.sprite.setVelocityX(-speed);
      }
      this.setFacingRight(false);
      this.setState('walking');
      this.lastDirection = { left: true, right: false };
    } else if (input.right && !isBlockedRight) {
      const speed = GameConfig.PLAYER_BASE_SPEED * (1 + this.stats.speed * GameConfig.SPEED_MULTIPLIER);
      if (this.sprite.active) {
        this.sprite.setVelocityX(speed);
      }
      this.setFacingRight(true);
      this.setState('walking');
      this.lastDirection = { left: false, right: true };
    } else {
      // Apply drag when no input (but don't stop completely if moving)
      if (this.isGrounded && Math.abs(body.velocity.x) > 10) {
        // Let drag naturally slow down movement
        this.lastDirection = { left: false, right: false };
        this.setState('idle');
      } else if (!this.isGrounded) {
        // In air, maintain horizontal velocity unless explicitly stopped
        this.lastDirection = { left: false, right: false };
      } else {
        // On ground with no input, ensure velocity is zero
        if (this.sprite.active) {
          this.sprite.setVelocityX(0);
        }
        this.lastDirection = { left: false, right: false };
        this.setState('idle');
      }
    }

    // Jump
    if (input.jump && this.isGrounded && this.state !== 'jumping') {
      const jumpPower = GameConfig.PLAYER_BASE_JUMP * (1 + this.stats.jump * GameConfig.JUMP_MULTIPLIER);
      if (this.sprite.active && body) {
        body.setVelocityY(-jumpPower);
      }
      this.isGrounded = false;
      this.setState('jumping');
      this.scene.events.emit('jumpPerformed');
    }

    // Jump attack (attack while in air)
    if (input.attack && !this.isGrounded && this.state === 'jumping' && this.canAttack()) {
      this.performJumpAttack();
      return; // Don't perform regular attack
    }

    // Weapon drop/throw (double-tap direction + attack)
    if (dashDetected && input.attack && this.currentWeapon) {
      const now = Date.now();
      if (now - this.lastDropTime > this.dropCooldown) {
        this.throwWeapon();
        this.lastDropTime = now;
        return; // Don't perform regular attack
      }
    }

    // Signature move (dash + attack, only if no weapon)
    if (dashDetected && input.attack && !this.currentWeapon && this.canAttack()) {
      this.performSignatureMove();
      return; // Don't perform regular attack
    }

    // Attack (with combo support or weapon attack)
    if (input.attack && this.canAttack()) {
      if (this.currentWeapon) {
        this.performWeaponAttack();
      } else {
        this.performAttack();
      }
    }

    // Special move (forward + special or just special)
    if (input.special && this.canUseSpecial()) {
      const isForward = input.right || input.left;
      this.performSpecialMove(isForward);
    }

    // Back attack (attack + jump button simultaneously)
    if (input.attack && input.jump && this.canAttack() && this.isGrounded) {
      this.performBackAttack();
      return; // Don't perform regular attack
    }

    // Grab attempt (when close to enemy and pressing attack)
    if (input.attack && this.isGrounded && this.state !== 'grabbing' && this.grabSystem) {
      const nearbyTarget = this.findNearbyGrabTarget();
      if (nearbyTarget && this.grabSystem.attemptGrab(this, nearbyTarget)) {
        this.grabbedTarget = nearbyTarget;
        this.scene.events.emit('grabPerformed');
        return; // Don't perform regular attack
      }
    }

    // Throw (when grabbing and pressing direction + attack)
    if (this.grabSystem && this.grabSystem.isGrabbing(this)) {
      if (input.attack) {
        let throwDirection: 'left' | 'right' | 'up' | 'down' | null = null;
        if (input.left) throwDirection = 'left';
        else if (input.right) throwDirection = 'right';
        else if (input.up) throwDirection = 'up';
        else if (input.down) throwDirection = 'down';
        
        if (throwDirection) {
          const isSlam = throwDirection === 'down';
          this.grabSystem.performThrow(this, throwDirection, isSlam);
          this.scene.events.emit('throwPerformed');
          if (isSlam) {
            this.scene.events.emit('knockdown');
          }
          this.grabbedTarget = null;
          return;
        }
      }

      // Vault (jump while grabbing)
      if (input.jump && this.canVault()) {
        this.grabSystem.vault(this);
      }
    }
  }

  /**
   * Find nearby target for grabbing
   */
  private findNearbyGrabTarget(): BaseEntity | null {
    // Search for nearby enemies or players
    const grabRange = 35;
    let nearestTarget: BaseEntity | null = null;
    let nearestDistance = Infinity;

    // Check all entities in scene
    this.scene.children.list.forEach(child => {
      if (child instanceof Phaser.Physics.Arcade.Sprite) {
        const entity = child.getData('entity') as BaseEntity;
        if (entity && entity !== this && entity.isAlive()) {
          const distance = Phaser.Math.Distance.Between(
            this.sprite.x,
            this.sprite.y,
            entity.sprite.x,
            entity.sprite.y
          );
          
          if (distance < grabRange && distance < nearestDistance) {
            nearestDistance = distance;
            nearestTarget = entity;
          }
        }
      }
    });

    return nearestTarget;
  }

  /**
   * Check if character can vault
   */
  protected canVault(): boolean {
    // Axel, Blaze, and Sammy can vault (switch front/back)
    // Max has different vault (jump while holding)
    return this.characterType !== 'max' || this.characterType === 'max';
  }

  update(): void {
    this.checkGrounded();
    this.updateState();
    this.updateAnimations();
    
    // Update attack cooldown
    if (this.attackCooldown > 0) {
      this.attackCooldown -= 16; // ~60fps
    }

    // Update grab position if grabbing
    if (this.grabSystem && this.grabSystem.isGrabbing(this)) {
      // Position is handled by grab system
    }
  }

  /**
   * Update animations based on current state
   */
  protected updateAnimations() {
    if (this.animationSystem) {
      // Check for special attack animations
      let animKey: string | null = null;
      const direction = this.facingRight ? 'right' : 'left';
      
      // Check if we're performing a jump attack (attacking while in air)
      const body = this.sprite.body as Phaser.Physics.Arcade.Body;
      if (this.state === 'attacking' && body && !body.blocked.down) {
        const jumpAttackKey = `${this.characterType}_jump_attack_${direction}`;
        if (this.scene.anims.exists(jumpAttackKey)) {
          animKey = jumpAttackKey;
        }
      }
      
      // Check if we're performing a back attack (punch jump)
      if (this.state === 'attacking' && (this as any).isPerformingBackAttack) {
        const backAttackKey = `${this.characterType}_punch_jump_${direction}`;
        if (this.scene.anims.exists(backAttackKey)) {
          animKey = backAttackKey;
        }
      }
      
      // Use standard animation system if no special animation
      if (!animKey) {
        this.animationSystem.playAnimation(this.sprite, this.state, this.facingRight, this.characterType);
      } else {
        // Play special animation directly
        this.sprite.play(animKey, true);
        // Ensure pixel-perfect rendering
        if (this.scene.textures.exists(this.sprite.texture.key)) {
          const texture = this.scene.textures.get(this.sprite.texture.key);
          texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
        }
      }
    }
  }

  protected updateState(): void {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;

    // Update state based on velocity and grounded status
    if (this.isGrounded) {
      if (Math.abs(body.velocity.x) < 10 && this.state !== 'attacking') {
        this.setState('idle');
      } else if (this.state !== 'attacking' && this.state !== 'walking') {
        this.setState('walking');
      }
    } else if (this.state !== 'jumping' && this.state !== 'attacking') {
      this.setState('jumping');
    }
  }

  /**
   * Check if character can attack
   */
  protected canAttack(): boolean {
    return this.state !== 'attacking' && 
           this.state !== 'grabbed' && 
           this.state !== 'throwing' &&
           this.state !== 'grabbing';
  }

  /**
   * Check if character can use special move
   */
  protected canUseSpecial(): boolean {
    return this.canAttack();
  }

  /**
   * Perform basic attack (with combo support)
   */
  protected performAttack(): void {
    if (this.attackCooldown > 0) return;
    
    let comboMove = null;
    
    // Check if we should continue a combo or start a new one
    if (this.comboSystem && this.comboSystem.hasActiveCombo(this.playerIndex)) {
      comboMove = this.comboSystem.continueCombo(this.playerIndex);
    } else if (this.comboSystem) {
      comboMove = this.comboSystem.startCombo(this.playerIndex, this.characterType);
    }

    // Use combo move if available, otherwise use basic attack
    if (comboMove) {
      this.performComboAttack(comboMove);
    } else {
      this.performBasicAttack();
    }
  }

  /**
   * Perform basic attack (no combo)
   */
  protected performBasicAttack(): void {
    this.setState('attacking');
    this.attackCooldown = GameConfig.ATTACK_DURATION;
    this.scene.events.emit('attackPerformed');
    
    const facingRight = this.facingRight;
    const offsetX = facingRight ? 20 : -20;
    
    this.currentHitbox = new Hitbox(
      this.sprite,
      offsetX,
      -10,
      30,
      40,
      this.stats.power * 10,
      { x: 150, y: 0 },
      false
    );
    
    this.scene.events.emit('hitboxCreated', this.currentHitbox);
    
    this.scene.time.delayedCall(GameConfig.ATTACK_DURATION, () => {
      if (this.state === 'attacking') {
        this.setState('idle');
      }
      if (this.currentHitbox) {
        this.currentHitbox.deactivate();
        this.currentHitbox = undefined;
      }
    });
  }

  /**
   * Perform combo attack
   */
  protected performComboAttack(comboMove: { name: string; damage: number; isKnockdown: boolean; hitbox: { x: number; y: number; width: number; height: number } }): void {
    this.setState('attacking');
    this.attackCooldown = GameConfig.ATTACK_DURATION;
    
    const facingRight = this.facingRight;
    const offsetX = facingRight ? comboMove.hitbox.x : -comboMove.hitbox.x;
    
    this.currentHitbox = new Hitbox(
      this.sprite,
      offsetX,
      comboMove.hitbox.y,
      comboMove.hitbox.width,
      comboMove.hitbox.height,
      comboMove.damage,
      { x: 180, y: 0 },
      comboMove.isKnockdown
    );
    
    this.scene.events.emit('hitboxCreated', this.currentHitbox);
    
    this.scene.time.delayedCall(GameConfig.ATTACK_DURATION, () => {
      if (this.state === 'attacking') {
        this.setState('idle');
      }
      if (this.currentHitbox) {
        this.currentHitbox.deactivate();
        this.currentHitbox = undefined;
      }
    });
  }

  /**
   * Perform special move
   */
  protected performSpecialMove(isForward: boolean = false): void {
    if (!this.specialMoveSystem || this.isPerformingSpecial) return;
    
    const specialMove = this.specialMoveSystem.getSpecialMove(this.characterType, isForward);
    if (!specialMove) return;
    
    this.isPerformingSpecial = true;
    this.setState('attacking');
    this.scene.events.emit('specialMovePerformed', {
      x: this.sprite.x,
      y: this.sprite.y,
      characterType: this.characterType
    });
    
    // Create special move hitbox
    const hitbox = this.specialMoveSystem.createSpecialMoveHitbox(
      this.characterType,
      this.sprite,
      isForward,
      this.facingRight
    );
    
    if (hitbox) {
      this.currentHitbox = hitbox;
      this.scene.events.emit('hitboxCreated', hitbox);
    }
    
    // End special move after duration
    this.scene.time.delayedCall(specialMove.duration, () => {
      this.isPerformingSpecial = false;
      if (this.state === 'attacking') {
        this.setState('idle');
      }
      if (this.currentHitbox) {
        this.currentHitbox.deactivate();
        this.currentHitbox = undefined;
      }
    });
  }

  /**
   * Perform signature move (dash + attack)
   */
  protected performSignatureMove(): void {
    // Character-specific signature moves will be implemented in subclasses
    // For now, use a powerful attack
    this.setState('attacking');
    this.attackCooldown = 500;
    
    const facingRight = this.facingRight;
    const offsetX = facingRight ? 30 : -30;
    
    this.currentHitbox = new Hitbox(
      this.sprite,
      offsetX,
      -10,
      40,
      50,
      this.stats.power * 15, // More damage than regular attack
      { x: 250, y: -30 },
      true // Knockdown
    );
    
    this.scene.events.emit('hitboxCreated', this.currentHitbox);
    
    this.scene.time.delayedCall(400, () => {
      if (this.state === 'attacking') {
        this.setState('idle');
      }
      if (this.currentHitbox) {
        this.currentHitbox.deactivate();
        this.currentHitbox = undefined;
      }
    });
  }

  /**
   * Get current active hitbox
   */
  getCurrentHitbox(): Hitbox | undefined {
    return this.currentHitbox;
  }

  /**
   * Pick up a weapon
   */
  pickupWeapon(weapon: Weapon) {
    if (this.currentWeapon) {
      // Drop current weapon if holding one
      this.currentWeapon.drop();
    }
    
    this.currentWeapon = weapon;
    weapon.pickup(this.sprite);
  }

  /**
   * Drop current weapon
   */
  dropWeapon() {
    if (this.currentWeapon) {
      this.currentWeapon.drop();
      this.currentWeapon = null;
    }
  }

  /**
   * Throw current weapon
   */
  throwWeapon() {
    if (!this.currentWeapon) return;
    
    const direction = this.facingRight ? 'right' : 'left';
    this.currentWeapon.throw(direction);
    this.currentWeapon = null;
  }

  /**
   * Perform weapon attack
   */
  protected performWeaponAttack(): void {
    if (!this.currentWeapon || this.attackCooldown > 0) return;
    
    this.setState('attacking');
    this.attackCooldown = GameConfig.ATTACK_DURATION;
    this.scene.events.emit('weaponHit');
    
    // Create weapon attack hitbox
    this.currentHitbox = this.currentWeapon.createAttackHitbox(
      this.sprite,
      this.facingRight
    );
    
    this.scene.events.emit('hitboxCreated', this.currentHitbox);
    
    // End attack after duration
    this.scene.time.delayedCall(GameConfig.ATTACK_DURATION, () => {
      if (this.state === 'attacking') {
        this.setState('idle');
      }
      if (this.currentHitbox) {
        this.currentHitbox.deactivate();
        this.currentHitbox = undefined;
      }
    });
  }

  /**
   * Check if character has a weapon
   */
  hasWeapon(): boolean {
    return this.currentWeapon !== null && this.currentWeapon.isHeld();
  }

  /**
   * Get current weapon
   */
  getWeapon(): Weapon | null {
    return this.currentWeapon;
  }

  /**
   * Lose weapon (e.g., when taking damage)
   */
  loseWeapon() {
    if (this.currentWeapon) {
      this.currentWeapon.drop();
      this.currentWeapon = null;
    }
  }

  /**
   * Perform jump attack
   */
  protected performJumpAttack(): void {
    if (this.attackCooldown > 0) return;
    
    this.setState('attacking');
    this.attackCooldown = GameConfig.ATTACK_DURATION;
    
    const facingRight = this.facingRight;
    const offsetX = facingRight ? 20 : -20;
    
    // Jump attacks have different hitbox (below character)
    this.currentHitbox = new Hitbox(
      this.sprite,
      offsetX,
      10, // Below character
      30,
      30,
      this.stats.power * 8, // Slightly less damage than ground attack
      { x: 100, y: 50 }, // Downward knockback
      false
    );
    
    this.scene.events.emit('jumpAttackPerformed');
    this.scene.events.emit('hitboxCreated', this.currentHitbox);
    
    this.scene.time.delayedCall(GameConfig.ATTACK_DURATION, () => {
      if (this.state === 'attacking') {
        this.setState('jumping');
      }
      if (this.currentHitbox) {
        this.currentHitbox.deactivate();
        this.currentHitbox = undefined;
      }
    });
    
    // Update animations to show jump attack
    this.updateAnimations();
  }

  /**
   * Perform back attack (B + C)
   */
  protected performBackAttack(): void {
    if (this.attackCooldown > 0) return;
    
    this.setState('attacking');
    this.attackCooldown = GameConfig.ATTACK_DURATION;
    (this as any).isPerformingBackAttack = true; // Track back attack
    
    // Back attack hits behind the character
    const facingRight = this.facingRight;
    const offsetX = facingRight ? -25 : 25; // Behind character
    
    this.currentHitbox = new Hitbox(
      this.sprite,
      offsetX,
      -10,
      35,
      40,
      this.stats.power * 12, // More damage than regular attack
      { x: -200, y: 0 }, // Knockback behind
      false
    );
    
    this.scene.events.emit('backAttackPerformed');
    this.scene.events.emit('hitboxCreated', this.currentHitbox);
    
    this.scene.time.delayedCall(GameConfig.ATTACK_DURATION, () => {
      (this as any).isPerformingBackAttack = false; // Clear back attack flag
      if (this.state === 'attacking') {
        this.setState('idle');
      }
      if (this.currentHitbox) {
        this.currentHitbox.deactivate();
        this.currentHitbox = undefined;
      }
    });
    
    // Update animations to show back attack
    this.updateAnimations();
  }

  /**
   * Override takeDamage to drop weapon (only when taking damage, not healing)
   */
  takeDamage(amount: number): void {
    super.takeDamage(amount);
    
    // Drop weapon when taking damage (only if taking damage, not healing)
    if (amount > 0 && this.currentWeapon) {
      this.loseWeapon();
    }
  }

  /**
   * Get character type
   */
  getCharacterType(): CharacterType {
    return this.characterType;
  }

  /**
   * Get player index
   */
  getPlayerIndex(): number {
    return this.playerIndex;
  }
}

