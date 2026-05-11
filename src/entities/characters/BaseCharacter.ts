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
import { InputBuffer } from '../../systems/input/InputBuffer';
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
  protected inputBuffer: InputBuffer;
  protected currentHitbox?: Hitbox;
  protected attackCooldown: number = 0;
  protected isPerformingSpecial: boolean = false;
  protected lastDirection: { left: boolean; right: boolean } = { left: false, right: false };
  protected currentWeapon: Weapon | null = null;
  protected lastDropTime: number = 0;
  protected dropCooldown: number = 300; // Prevent accidental double drops
  private lastVerticalInput: { up: boolean; down: boolean } = { up: false, down: false };
  private targetYPosition: number | null = null; // Store target Y position to prevent drift
  protected grabSystem?: GrabSystem;
  protected grabbedTarget: BaseEntity | null = null;
  protected wasInAir: boolean = false; // Track if character was in air last frame
  protected landingCooldown: number = 0; // Cooldown for landing animation
  protected knockdownCooldown: number = 0; // Cooldown for knockdown state
  protected invincibilityFrames: number = 0; // Invincibility frames after knockdown/get-up
  protected airRecoveryCooldown: number = 0; // Cooldown for air recovery
  protected isBlocking: boolean = false; // Whether character is currently blocking
  protected blockCooldown: number = 0; // Cooldown between blocks
  protected blockDuration: number = 0; // Remaining block duration
  protected parryWindow: number = 0; // Parry timing window (active when blocking starts)
  protected canCounter: boolean = false; // Whether character can perform counter attack
  protected parryCooldown: number = 0; // Cooldown after parry
  protected airComboCount: number = 0; // Track air combo hits
  protected lastAirAttackTime: number = 0; // Track timing for air combos
  protected airComboWindow: number = 600; // Time window for air combos in ms
  protected weaponComboCount: number = 0; // Track weapon combo hits
  protected lastWeaponAttackTime: number = 0; // Track timing for weapon combos
  protected weaponComboWindow: number = 500; // Time window for weapon combos in ms
  private _knockdownTimer?: Phaser.Time.TimerEvent;

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
    this.inputBuffer = new InputBuffer();
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

    // Enhanced input buffering - buffer inputs when actions are unavailable
    if (input.attack && !this.canAttack() && this.state !== 'attacking') {
      this.inputBuffer.bufferInput(this.playerIndex, input, true);
      return;
    }
    
    // Buffer special moves if unavailable
    if (input.special && !this.canUseSpecial() && !this.isPerformingSpecial) {
      this.inputBuffer.bufferInput(this.playerIndex, input, false);
      return;
    }
    
    // Buffer jumps if in air or during attack recovery
    if (input.jump && !this.isGrounded && this.state !== 'jumping' && this.state !== 'attacking') {
      this.inputBuffer.bufferInput(this.playerIndex, input, false);
      // Don't return - allow other inputs to process
    }

    const body = this.sprite.body as Phaser.Physics.Arcade.Body;

    // Check for dash (double-tap)
    const dashDetected = this.dashDetector.checkDash(input.left, input.right);
    if (dashDetected) {
      this.scene.events.emit('dashPerformed', { x: this.sprite.x, y: this.sprite.y });
    }

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

    // Vertical movement (depth navigation) - separate from jump
    // Up moves backward (decreases Y), Down moves forward (increases Y)
    // Bottom of screen is foreground (highest Y), top is background (lowest Y)
    // Use direct position updates for smooth depth navigation without physics interference
    const verticalSpeed = GameConfig.PLAYER_VERTICAL_SPEED * (1 + this.stats.speed * GameConfig.SPEED_MULTIPLIER);
    const deltaTime = this.scene.game.loop.delta;
    const verticalDelta = (verticalSpeed * deltaTime) / 1000; // Convert to pixels per frame
    
    // Get room dimensions and ground range
    const roomHeight = (this.scene as any).roomManager?.getRoomHeight() || this.scene.cameras.main.height;
    const groundRangeTop = roomHeight - 200; // Top of ground range (200px from bottom) - UPPER CAP
    const groundRangeBottom = roomHeight; // Bottom of frame
    
    // Track vertical input state changes for debugging
    const currentVerticalInput = { up: input.up && !input.jump, down: input.down && !input.jump };
    const verticalInputChanged = 
      currentVerticalInput.up !== this.lastVerticalInput.up || 
      currentVerticalInput.down !== this.lastVerticalInput.down;
    
    // Update last vertical input state
    if (verticalInputChanged) {
      this.lastVerticalInput = { ...currentVerticalInput };
    }
    
    // Track if we're manually controlling vertical movement
    let isManuallyMovingVertical = false;
    
    if (input.up && !input.jump) {
      // Move up (backward in depth) - use direct position update
      // Cap at groundRangeTop (cannot move above ground range)
      if (this.sprite.active) {
        const newY = Math.max(groundRangeTop, this.sprite.y - verticalDelta); // Clamp to top of ground range
        this.sprite.setPosition(this.sprite.x, newY);
        // Disable gravity and stop vertical velocity immediately
        if (body) {
          body.setVelocityY(0);
          body.setGravityY(0);
        }
        isManuallyMovingVertical = true;
      }
    } else if (input.down && !input.jump) {
      // Move down (forward in depth) - use direct position update
      if (this.sprite.active) {
        const newY = Math.min(groundRangeBottom, this.sprite.y + verticalDelta); // Clamp to bottom of frame
        this.sprite.setPosition(this.sprite.x, newY);
        // Disable gravity and stop vertical velocity immediately
        if (body) {
          body.setVelocityY(0);
          body.setGravityY(0);
        }
        isManuallyMovingVertical = true;
      }
    }
    
    // When not manually moving vertically, handle gravity based on jump state
    // Store the target Y position to prevent drift
    if (!isManuallyMovingVertical && body) {
      const isInAir = !this.isGrounded && this.sprite.y < groundRangeBottom - 10;
      const isJumping = this.state === 'jumping';
      
      // Allow gravity when jumping or in the air
      if (isJumping || isInAir) {
        // Enable gravity for proper jump physics
        body.setGravityY(GameConfig.GRAVITY);
        this.targetYPosition = null; // Clear target when in air
      } else {
        // On ground - disable gravity and stop velocity
        // Store target Y position when input stops (first frame after release)
        if (this.targetYPosition === null) {
          this.targetYPosition = this.sprite.y;
        }
        
        body.setGravityY(0);
        body.setVelocityY(0);
        
        // Restore to target position if it has drifted
        if (this.targetYPosition !== null && Math.abs(this.sprite.y - this.targetYPosition) > 0.1) {
          this.sprite.setPosition(this.sprite.x, this.targetYPosition);
        }
        
        // Clamp position to ground range if outside
        if (this.sprite.y < groundRangeTop) {
          // Above ground range - clamp to top of ground range
          this.sprite.setPosition(this.sprite.x, groundRangeTop);
          this.targetYPosition = groundRangeTop;
        } else if (this.sprite.y > groundRangeBottom) {
          // Below ground range - clamp to bottom
          this.sprite.setPosition(this.sprite.x, groundRangeBottom);
          this.targetYPosition = groundRangeBottom;
        }
      }
    } else if (isManuallyMovingVertical) {
      // Clear target position when moving manually
      this.targetYPosition = null;
      // Disable gravity during depth navigation
      body.setGravityY(0);
    }

    // Jump (works independently, but vertical movement takes priority when both are pressed)
    // If player is pressing up/down, they're controlling depth, so don't jump
    // Check grounded state via body touching instead of isGrounded flag for more reliable detection
    const bodyTouchingDown = body && body.touching && body.touching.down;
    const canJump = bodyTouchingDown || (this.isGrounded && body && body.velocity && body.velocity.y >= -5);
    
    if (input.jump && !input.up && !input.down && canJump && this.state !== 'jumping') {
      const jumpPower = GameConfig.PLAYER_BASE_JUMP * (1 + this.stats.jump * GameConfig.JUMP_MULTIPLIER);
      if (this.sprite.active && body) {
        body.setVelocityY(-jumpPower);
        // Enable gravity for jump
        body.setGravityY(GameConfig.GRAVITY);
      }
      this.isGrounded = false;
      this.setState('jumping');
      this.scene.events.emit('jumpPerformed');
    }

    // Air recovery (jump + special while in air, on cooldown)
    if (input.jump && input.special && !this.isGrounded && this.airRecoveryCooldown <= 0) {
      this.performAirRecovery();
      return;
    }

    // Jump attack (attack while in air)
    if (input.attack && !this.isGrounded && this.state === 'jumping' && this.canAttack()) {
      this.performJumpAttack();
      return; // Don't perform regular attack
    }

    // Block (hold special while on ground, not attacking)
    if (input.special && this.isGrounded && !input.attack && this.blockCooldown <= 0) {
      this.startBlocking();
    } else if (!input.special && this.isBlocking) {
      this.stopBlocking();
    }
    
    // Counter attack (attack while canCounter is true)
    if (input.attack && this.canCounter && this.canAttack()) {
      this.performCounterAttack();
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

    // Back attack (attack + jump simultaneously) — must be checked BEFORE regular attack
    // so pressing attack+jump always triggers back attack, not plain attack.
    if (input.attack && input.jump && this.canAttack() && this.isGrounded) {
      this.performBackAttack();
      return;
    }

    // Grab attempt (when close to enemy and pressing attack) — checked BEFORE regular
    // attack so a nearby grab takes priority over a plain punch.
    if (input.attack && this.isGrounded && this.state !== 'grabbing' && this.grabSystem) {
      const nearbyTarget = this.findNearbyGrabTarget();
      if (nearbyTarget && this.grabSystem.attemptGrab(this, nearbyTarget)) {
        this.grabbedTarget = nearbyTarget;
        this.scene.events.emit('grabPerformed');
        return;
      }
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

    // Throw (when grabbing and pressing direction + attack) with variations
    if (this.grabSystem && this.grabSystem.isGrabbing(this)) {
      if (input.attack) {
        let throwDirection: 'left' | 'right' | 'up' | 'down' | null = null;
        if (input.left) throwDirection = 'left';
        else if (input.right) throwDirection = 'right';
        else if (input.up) throwDirection = 'up';
        else if (input.down) throwDirection = 'down';
        
        if (throwDirection) {
          // Check for multi-enemy throw opportunity
          const nearbyEnemies = this.findNearbyEnemies(150);
          if (nearbyEnemies.length > 0) {
            // Multi-enemy throw (ground or air)
            this.grabSystem.performMultiEnemyThrow(this, throwDirection, nearbyEnemies);
            this.scene.events.emit('throwPerformed', { isSlam: throwDirection === 'down' });
            return;
          }
          
          // Regular throw with wall bounce potential
          const isSlam = throwDirection === 'down';
          this.grabSystem.performThrow(this, throwDirection, isSlam);
          this.scene.events.emit('throwPerformed', { isSlam: isSlam });
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
   * Find nearby enemies for multi-enemy throws
   */
  private findNearbyEnemies(range: number): BaseEntity[] {
    const nearby: BaseEntity[] = [];
    
    // Get all scene children and filter for enemies
    const sceneChildren = this.scene.children.list;
    
    for (const child of sceneChildren) {
      if (!(child instanceof Phaser.GameObjects.Sprite)) continue;
      if (child === this.sprite) continue;
      
      const isEnemy = child.getData('isEnemy');
      if (!isEnemy) continue;
      
      const distance = Phaser.Math.Distance.Between(
        this.sprite.x,
        this.sprite.y,
        child.x,
        child.y
      );
      
      if (distance <= range) {
        // Find the entity that owns this sprite
        const entity = child.getData('entity') as BaseEntity;
        if (entity) {
          nearby.push(entity);
        }
      }
    }
    
    return nearby;
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
    const wasInAirBefore = this.wasInAir;
    this.checkGrounded();

    // Detect landing (transition from air to ground)
    if (wasInAirBefore && this.isGrounded && this.landingCooldown <= 0) {
      this.onLanding();
    }

    // Update wasInAir for next frame
    this.wasInAir = !this.isGrounded;

    // Update landing cooldown
    if (this.landingCooldown > 0) {
      this.landingCooldown -= 16; // ~60fps
    }

    // Update air recovery cooldown
    if (this.airRecoveryCooldown > 0) {
      this.airRecoveryCooldown -= 16; // ~60fps
    }

    // Decrement invincibility frames (bug fix: was never decremented, causing permanent invincibility)
    if (this.invincibilityFrames > 0) {
      this.invincibilityFrames--;
    }

    // Update block duration and cooldown
    if (this.blockDuration > 0) {
      this.blockDuration -= 16; // ~60fps
      if (this.blockDuration <= 0) {
        this.isBlocking = false;
      }
    }
    if (this.blockCooldown > 0) {
      this.blockCooldown -= 16; // ~60fps
    }

    // Update parry window
    if (this.parryWindow > 0) {
      this.parryWindow -= 16; // ~60fps
    }

    // Update parry cooldown
    if (this.parryCooldown > 0) {
      this.parryCooldown -= 16; // ~60fps
    }

    // Update knockdown cooldown
    if (this.knockdownCooldown > 0) {
      this.knockdownCooldown -= 16; // ~60fps
    }

    this.updateState();
    this.updateAnimations();

    // Update attack cooldown
    if (this.attackCooldown > 0) {
      this.attackCooldown -= 16; // ~60fps
    }

    // Update input buffer
    this.inputBuffer.update();

    // Check for buffered inputs when attack cooldown is ending
    // This allows combos to flow more smoothly
    if (this.attackCooldown <= GameConfig.INPUT_BUFFER_WINDOW && this.attackCooldown > 0) {
      const bufferedInput = this.inputBuffer.getBufferedInput(this.playerIndex, true);
      if (bufferedInput && bufferedInput.attack && this.canAttack()) {
        // Execute buffered attack
        this.handleInput(bufferedInput);
      }
    }

    // Update grab position if grabbing
    if (this.grabSystem && this.grabSystem.isGrabbing(this)) {
      // Position is handled by grab system
    }
  }

  /**
   * Perform air recovery (recover from hit in air)
   */
  protected performAirRecovery(): void {
    if (!this.sprite || !this.sprite.active) return;
    
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    if (!body) return;
    
    // Reset vertical velocity to stop falling
    body.setVelocityY(-200); // Small upward boost
    
    // Set air recovery cooldown
    this.airRecoveryCooldown = GameConfig.AIR_RECOVERY_COOLDOWN;
    
    // Emit recovery event for visual effects
    this.scene.events.emit('airRecoveryPerformed', {
      x: this.sprite.x,
      y: this.sprite.y,
      characterType: this.characterType
    });
    
    // Brief invincibility frames
    this.invincibilityFrames = 30; // ~0.5 seconds at 60fps
  }

  /**
   * Start blocking (with parry window)
   */
  protected startBlocking(): void {
    if (this.isBlocking || this.state === 'attacking' || this.state === 'grabbing') return;
    
    this.isBlocking = true;
    this.blockDuration = GameConfig.BLOCK_DURATION;
    this.parryWindow = GameConfig.PARRY_WINDOW; // Activate parry window
    this.setState('idle'); // Could be 'blocking' state if we add animation
    
    // Emit block event
    this.scene.events.emit('blockStarted', {
      x: this.sprite.x,
      y: this.sprite.y,
      characterType: this.characterType
    });
  }

  /**
   * Stop blocking
   */
  protected stopBlocking(): void {
    if (!this.isBlocking) return;
    
    this.isBlocking = false;
    this.blockDuration = 0;
    this.blockCooldown = GameConfig.BLOCK_COOLDOWN;
    
    // Emit block end event
    this.scene.events.emit('blockEnded', {
      x: this.sprite.x,
      y: this.sprite.y,
      characterType: this.characterType
    });
  }

  /**
   * Check if character is blocking
   */
  isCurrentlyBlocking(): boolean {
    return this.isBlocking;
  }
  
  /**
   * Perform counter attack (after successful parry)
   */
  protected performCounterAttack(): void {
    if (!this.canCounter || this.attackCooldown > 0) return;
    
    this.canCounter = false;
    this.setState('attacking');
    this.attackCooldown = GameConfig.ATTACK_DURATION;
    
    const facingRight = this.facingRight;
    const offsetX = facingRight ? 30 : -30;
    
    // Counter attack has increased damage and knockback
    this.currentHitbox = new Hitbox(
      this.sprite,
      offsetX,
      -10,
      40,
      40,
      Math.floor(this.stats.power * 15 * GameConfig.COUNTER_ATTACK_DAMAGE_MULTIPLIER), // Higher damage for counter
      { x: facingRight ? 300 : -300, y: -100 }, // Strong knockback
      true // Counter attacks can knockdown
    );
    
    this.scene.events.emit('counterAttackPerformed', {
      x: this.sprite.x,
      y: this.sprite.y,
      characterType: this.characterType
    });
    this.scene.events.emit('hitboxCreated', this.currentHitbox);
    
    // End counter attack after duration
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
   * Handle landing animation and effects
   */
  protected onLanding(): void {
    if (!this.sprite || !this.sprite.active) return;
    
    // Set landing cooldown to prevent multiple triggers
    this.landingCooldown = 200; // ~200ms cooldown
    
    // Emit landing event for visual effects
    this.scene.events.emit('characterLanded', {
      x: this.sprite.x,
      y: this.sprite.y,
      characterType: this.characterType,
      playerIndex: this.playerIndex
    });
    
    // Set landing state briefly (if not attacking or in other important state)
    if (this.state !== 'attacking' && this.state !== 'grabbing' && this.state !== 'hit') {
      this.setState('landing');
      // Revert to idle after the landing animation has had time to play.
      // The guard in updateState() prevents it from being overridden mid-flight.
      this.scene.time.delayedCall(150, () => {
        if (this.sprite && this.sprite.active && this.state === 'landing') {
          this.setState('idle');
        }
      });
    }
  }

  /**
   * Update animations based on current state
   */
  protected updateAnimations() {
    // Don't override the collapse/restore tweens while knocked down or dying
    if (this.state === 'knockedDown' || this.state === 'dying') return;

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
        // When using directional animations, don't flip - animation key handles direction
        this.sprite.setFlipX(false);
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

    // Update state based on velocity and grounded status.
    // States that own their own lifecycle must not be overridden by the generic
    // velocity-based state machine.
    if (this.isGrounded) {
      if (
        Math.abs(body.velocity.x) < 10 &&
        this.state !== 'attacking' &&
        this.state !== 'hitReaction' &&
        this.state !== 'landing' &&
        this.state !== 'knockedDown' &&
        this.state !== 'dying'
      ) {
        this.setState('idle');
      } else if (
        this.state !== 'attacking' &&
        this.state !== 'walking' &&
        this.state !== 'hitReaction' &&
        this.state !== 'landing' &&
        this.state !== 'knockedDown' &&
        this.state !== 'dying'
      ) {
        this.setState('walking');
      }
    } else if (
      this.state !== 'jumping' &&
      this.state !== 'attacking' &&
      this.state !== 'hitReaction' &&
      this.state !== 'knockedDown' &&
      this.state !== 'dying'
    ) {
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

    // Combo cancel: player pressed Special mid-combo within the cancel window.
    // The special fires at 80 % damage as a trade-off for the early interrupt.
    const isCancelMove = this.comboSystem?.canCancelToSpecial(this.playerIndex) ?? false;
    if (isCancelMove) {
      this.comboSystem!.consumeCancel(this.playerIndex);
    }

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
      if (isCancelMove) hitbox.damage = Math.floor(hitbox.damage * 0.8);
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
    // Emit weapon pickup event for tracking
    this.scene.events.emit('weaponPickedUp', {
      weapon: weapon,
      weaponType: weapon.getWeaponType(),
      character: this
    });
    if (this.currentWeapon) {
      // Drop current weapon if holding one
      this.currentWeapon.drop();
    }
    
    this.currentWeapon = weapon;
    weapon.pickup(this.sprite);
    
    // Reset weapon combo when picking up new weapon
    this.weaponComboCount = 0;
    this.lastWeaponAttackTime = 0;
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
    
    // Reset weapon combo when throwing
    this.weaponComboCount = 0;
    this.lastWeaponAttackTime = 0;
  }

  /**
   * Perform weapon attack with combo system
   */
  protected performWeaponAttack(): void {
    if (!this.currentWeapon || this.attackCooldown > 0) return;
    
    const now = Date.now();
    const timeSinceLastWeaponAttack = now - this.lastWeaponAttackTime;
    
    // Check if we can continue weapon combo
    if (timeSinceLastWeaponAttack > this.weaponComboWindow) {
      this.weaponComboCount = 0; // Reset combo if too much time passed
    }
    
    this.weaponComboCount++;
    this.lastWeaponAttackTime = now;
    this.setState('attacking');
    this.attackCooldown = GameConfig.ATTACK_DURATION;
    this.scene.events.emit('weaponHit');
    
    // Weapon combo damage increases with each hit (up to 4 hits)
    const comboMultiplier = Math.min(1.0 + (this.weaponComboCount - 1) * 0.15, 1.45); // Max 45% bonus
    
    // Emit weapon swing event for visual effects
    this.scene.events.emit('weaponSwing', {
      weapon: this.currentWeapon,
      character: this,
      x: this.sprite.x,
      y: this.sprite.y,
      facingRight: this.facingRight,
      weaponType: this.currentWeapon.getWeaponType(),
      comboCount: this.weaponComboCount
    });
    
    // Create weapon attack hitbox with combo multiplier
    const baseHitbox = this.currentWeapon.createAttackHitbox(
      this.sprite,
      this.facingRight
    );
    
    // Apply combo damage multiplier
    baseHitbox.damage = Math.floor(baseHitbox.damage * comboMultiplier);
    
    // Third and fourth hits can knockdown
    if (this.weaponComboCount >= 3) {
      baseHitbox.isKnockdown = true;
    }
    
    this.currentHitbox = baseHitbox;
    this.scene.events.emit('hitboxCreated', this.currentHitbox);
    
    // Emit weapon combo event
    if (this.weaponComboCount >= 2) {
      this.scene.events.emit('weaponComboHit', {
        playerIndex: this.playerIndex,
        comboCount: this.weaponComboCount,
        weaponType: this.currentWeapon.getWeaponType(),
        x: this.sprite.x,
        y: this.sprite.y
      });
    }
    
    // Animate weapon swing
    this.animateWeaponSwing();
    
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
   * Animate weapon swing
   */
  private animateWeaponSwing(): void {
    if (!this.currentWeapon || !this.currentWeapon.sprite) return;
    
    const weaponSprite = this.currentWeapon.sprite;
    const swingAngle = this.facingRight ? -45 : 45; // Swing angle based on direction
    const swingDuration = GameConfig.ATTACK_DURATION * 0.6; // 60% of attack duration
    
    // Reset rotation first
    weaponSprite.setRotation(0);
    
    // Swing animation - rotate weapon during attack
    this.scene.tweens.add({
      targets: weaponSprite,
      angle: swingAngle,
      duration: swingDuration * 0.5,
      ease: 'Power2.easeOut',
      yoyo: true,
      onComplete: () => {
        if (weaponSprite && weaponSprite.active) {
          weaponSprite.setRotation(0);
        }
      }
    });
    
    // Scale animation for impact feel
    const originalScaleX = weaponSprite.scaleX;
    const originalScaleY = weaponSprite.scaleY;
    this.scene.tweens.add({
      targets: weaponSprite,
      scaleX: originalScaleX * 1.2,
      scaleY: originalScaleY * 1.2,
      duration: swingDuration * 0.3,
      yoyo: true,
      ease: 'Power2',
      onComplete: () => {
        if (weaponSprite && weaponSprite.active) {
          weaponSprite.setScale(originalScaleX, originalScaleY);
        }
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
   * Override takeDamage to handle blocking, hit reactions, and drop weapon
   */
  takeDamage(amount: number): void {
    // Check invincibility frames first
    if (this.invincibilityFrames > 0) {
      return; // Ignore damage during invincibility
    }
    
    // Check if blocking (reduces damage by 80% or parries if in parry window)
    if (this.isBlocking && amount > 0) {
      // Check for parry opportunity (perfect timing)
      // Parry window is active during the first part of blocking
      if (this.parryWindow > 0 && this.parryWindow > GameConfig.PARRY_WINDOW * 0.5) {
        // Parry successful - no damage taken
        this.scene.events.emit('parrySuccessful', {
          x: this.sprite.x,
          y: this.sprite.y,
          characterType: this.characterType
        });
        this.canCounter = true;
        this.parryWindow = 0;
        this.stopBlocking();
        return; // No damage taken
      }
      
      // Regular block - reduces damage by 80%
      const blockedDamage = Math.floor(amount * 0.2); // Only 20% damage gets through
      super.takeDamage(blockedDamage);
      
      // Emit block success event
      this.scene.events.emit('blockSuccessful', {
        x: this.sprite.x,
        y: this.sprite.y,
        characterType: this.characterType,
        originalDamage: amount,
        blockedDamage: blockedDamage
      });
      
      // Stop blocking after taking blocked damage
      this.stopBlocking();
      return;
    }
    
    // Check for knockdown (heavy damage or health reaching 0)
    const wasAlive = this.health > 0;
    const willBeKnockedDown = amount >= GameConfig.KNOCKDOWN_THRESHOLD || (this.health - amount <= 0 && wasAlive);
    
    super.takeDamage(amount);
    
    // Handle hit reaction state
    if (amount > 0 && !willBeKnockedDown) {
      this.onCharacterHitReaction(amount);
    } else if (willBeKnockedDown) {
      this.onKnockdown();
    }
    
    // Drop weapon when taking damage (only if taking damage, not healing)
    if (amount > 0 && this.currentWeapon) {
      this.loseWeapon();
    }
  }

  /**
   * Handle character-specific hit reaction
   */
  protected onCharacterHitReaction(damage: number): void {
    if (!this.sprite || !this.sprite.active) return;
    
    // Set hit reaction state briefly
    const previousState = this.state;
    this.setState('hitReaction');
    
    // Brief stun duration based on damage
    const stunDuration = Math.min(200, damage * 8); // Max 200ms stun
    
    // Stop movement during hit reaction
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    if (body) {
      const originalVelocityX = body.velocity.x;
      body.setVelocityX(originalVelocityX * 0.3); // Reduce horizontal velocity
    }
    
    // Return to previous state after stun
    this.scene.time.delayedCall(stunDuration, () => {
      if (this.sprite && this.sprite.active && this.state === 'hitReaction') {
        this.setState(previousState === 'attacking' ? 'idle' : previousState);
      }
    });
  }

  /**
   * Handle knockdown — plays a collapse tween and schedules auto get-up.
   */
  protected onKnockdown(): void {
    if (!this.sprite || !this.sprite.active) return;

    this.setState('knockedDown');
    this.knockdownCooldown = 2000; // 2 seconds on the ground

    // Stop all movement immediately
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.setVelocity(0, 0);
    }

    // --- Collapse visual ---
    // Record normal scale so we can restore it on get-up
    const normalScaleX = this.sprite.scaleX;
    const normalScaleY = this.sprite.scaleY;
    (this.sprite as any)._knockdownScaleX = normalScaleX;
    (this.sprite as any)._knockdownScaleY = normalScaleY;

    // Phase 1: brief squish upward (impact absorption)
    this.scene.tweens.add({
      targets: this.sprite,
      scaleX: normalScaleX * 1.3,
      scaleY: normalScaleY * 0.5,
      duration: 80,
      ease: 'Power2.easeOut',
      onComplete: () => {
        if (!this.sprite || !this.sprite.active) return;
        // Phase 2: flatten to floor (lying down)
        this.scene.tweens.add({
          targets: this.sprite,
          angle: this.facingRight ? 80 : -80,
          scaleX: normalScaleX * 1.5,
          scaleY: normalScaleY * 0.3,
          duration: 180,
          ease: 'Power3.easeIn',
        });
      }
    });

    // Red flash to signal heavy damage
    this.sprite.setTint(0xff3333);
    this.scene.time.delayedCall(160, () => {
      if (this.sprite && this.sprite.active) {
        this.sprite.clearTint();
      }
    });

    // Emit knockdown event
    this.scene.events.emit('entityKnockedDown', {
      entity: this,
      x: this.sprite.x,
      y: this.sprite.y
    });

    // Auto get-up after cooldown — store the timer so reset() can cancel it
    this._knockdownTimer = this.scene.time.delayedCall(this.knockdownCooldown, () => {
      this._knockdownTimer = undefined;
      if (this.health > 0 && this.sprite && this.sprite.active) {
        this.onGetUp();
      }
    });
  }

  /**
   * Handle get-up from knockdown — restores sprite geometry and grants
   * brief invincibility with a visible blink.
   */
  protected onGetUp(): void {
    if (!this.sprite || !this.sprite.active) return;

    this.setState('idle');
    this.knockdownCooldown = 0;
    this.invincibilityFrames = 60; // ~1 second at 60 fps

    // Restore normal orientation
    const normalScaleX = (this.sprite as any)._knockdownScaleX ?? this.sprite.scaleX;
    const normalScaleY = (this.sprite as any)._knockdownScaleY ?? this.sprite.scaleY;

    this.scene.tweens.add({
      targets: this.sprite,
      angle: 0,
      scaleX: normalScaleX,
      scaleY: normalScaleY,
      duration: 200,
      ease: 'Back.easeOut',
    });

    // Invincibility blink (6 flashes over ~600 ms)
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: { from: 1, to: 0.25 },
      duration: 80,
      yoyo: true,
      repeat: 5,
      ease: 'Linear',
      onComplete: () => {
        if (this.sprite && this.sprite.active) {
          this.sprite.setAlpha(1);
        }
      }
    });

    // Emit get-up event
    this.scene.events.emit('entityGotUp', {
      entity: this,
      x: this.sprite.x,
      y: this.sprite.y
    });
  }

  /**
   * Reset character state — clears all combat flags so the character is
   * ready to play from a clean slate (used for respawn / continue).
   */
  reset(x?: number, y?: number): void {
    // Kill in-flight tweens before super.reset() so they can't override the
    // restored sprite geometry after the call returns.
    if (this.sprite) {
      this.scene.tweens.killTweensOf(this.sprite);
    }

    // Cancel the auto-get-up timer so it can't fire on the respawned character.
    if (this._knockdownTimer) {
      this._knockdownTimer.remove();
      this._knockdownTimer = undefined;
    }

    // Deactivate any active attack hitbox so it can't deal phantom damage at
    // the new spawn position.
    if (this.currentHitbox) {
      this.currentHitbox.deactivate();
      this.currentHitbox = undefined;
    }

    super.reset(x, y);

    // Restore scale — BaseEntity.reset() deletes the saved knockdown scale
    // values without restoring them, so the sprite would remain deformed.
    if (this.sprite) {
      this.sprite.setScale(1, 1);
    }

    // Reset all character-specific cooldowns and flags
    this.attackCooldown = 0;
    this.isPerformingSpecial = false;
    this.knockdownCooldown = 0;
    this.invincibilityFrames = 0;
    this.isBlocking = false;
    this.blockDuration = 0;
    this.blockCooldown = 0;
    this.parryWindow = 0;
    this.canCounter = false;
    this.parryCooldown = 0;
    this.landingCooldown = 0;
    this.airRecoveryCooldown = 0;
    this.wasInAir = false;
    this.grabbedTarget = null;
    this.targetYPosition = null;
    this.airComboCount = 0;
    this.weaponComboCount = 0;
    this.lastDirection = { left: false, right: false };

    // Drop any held weapon cleanly
    if (this.currentWeapon) {
      this.currentWeapon.drop();
      this.currentWeapon = null;
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

