import Phaser from 'phaser';
import { Player } from '../entities/characters/Player';
import { InputManager } from '../systems/input/InputManager';
import { WeaponManager } from '../systems/weapon/WeaponManager';
import { ItemManager } from '../systems/item/ItemManager';
import { MultiplayerClient } from '../multiplayer/Client';
import { WeaponIndicator } from '../ui/WeaponIndicator';
import { GameConfig } from '../config/GameConfig';
import { RoomManager } from '../systems/background/RoomManager';

/**
 * Manages player updates, input handling, and related systems
 */
export class PlayerUpdateManager {
  private scene: Phaser.Scene;
  private players: Player[];
  private inputManager: InputManager;
  private weaponManager: WeaponManager;
  private itemManager: ItemManager;
  private multiplayerClient?: MultiplayerClient;
  private weaponIndicators: WeaponIndicator[];
  private playerGroundColliders: Map<Player, Phaser.Physics.Arcade.Collider>;
  private roomManager?: RoomManager;
  private isMultiplayer: boolean;
  private inputFrozen: boolean = false;

  constructor(
    scene: Phaser.Scene,
    players: Player[],
    inputManager: InputManager,
    weaponManager: WeaponManager,
    itemManager: ItemManager,
    weaponIndicators: WeaponIndicator[],
    playerGroundColliders: Map<Player, Phaser.Physics.Arcade.Collider>,
    roomManager?: RoomManager,
    multiplayerClient?: MultiplayerClient,
    isMultiplayer: boolean = false
  ) {
    this.scene = scene;
    this.players = players;
    this.inputManager = inputManager;
    this.weaponManager = weaponManager;
    this.itemManager = itemManager;
    this.weaponIndicators = weaponIndicators;
    this.playerGroundColliders = playerGroundColliders;
    this.roomManager = roomManager;
    this.multiplayerClient = multiplayerClient;
    this.isMultiplayer = isMultiplayer;
  }

  /**
   * Freeze or unfreeze all player input (used during boss entrance cutscenes).
   * When frozen, handleInput receives a zeroed-out input so the character idles.
   */
  setInputFrozen(frozen: boolean): void {
    this.inputFrozen = frozen;
    if (frozen) {
      // Immediately zero out velocity so players don't slide
      this.players.forEach(player => {
        if (player?.sprite?.body) {
          const body = player.sprite.body as Phaser.Physics.Arcade.Body;
          body.setVelocityX(0);
        }
      });
    }
  }

  /**
   * Update all players - handle input, physics, pickups, etc.
   */
  update(): void {
    this.players.forEach((player, index) => {
      if (!player || !player.sprite || !player.sprite.active) {
        return;
      }

      const input = this.inputFrozen
        ? { left: false, right: false, up: false, down: false, jump: false, attack: false, special: false }
        : this.inputManager.getPlayerInput(index);

      // Handle ground collision and physics
      this.handlePlayerPhysics(player, input);

      // Process input
      player.handleInput(input);

      // Update weapon indicator
      this.updateWeaponIndicator(player, index);

      // Send input to multiplayer server if connected
      this.sendMultiplayerInput(input, index);

      // Check for weapon/item pickups
      this.checkPickups(player);
    });
  }

  /**
   * Handle player physics (ground collision, gravity, vertical movement)
   */
  private handlePlayerPhysics(player: Player, input: { up: boolean; down: boolean }): void {
    const body = player.sprite.body as Phaser.Physics.Arcade.Body;
    if (!body) return;

    const roomHeight = this.roomManager?.getRoomHeight() || this.scene.cameras.main.height;
    const groundRangeTop = roomHeight - GameConfig.GROUND_HEIGHT_RANGE;
    const groundRangeBottom = roomHeight;
    const isMovingVertically = input.up || input.down;
    const isAtForeground = player.sprite.y >= groundRangeBottom - 10; // Within 10px of bottom

    // Enable/disable ground collision based on depth
    const collider = this.playerGroundColliders.get(player);
    if (collider) {
      // Only enable ground collision at foreground level (bottom)
      // This prevents collision forces from causing drift at depth levels
      if (isAtForeground && !isMovingVertically) {
        collider.active = true;
      } else {
        collider.active = false;
      }
    }

    // Handle gravity and vertical movement
    const isGrounded = body && body.touching && body.touching.down;
    const isInAir = !isGrounded && player.sprite.y < groundRangeBottom - 10;
    const isJumping = player.getState() === 'jumping';
    const isMovingUp = body && body.velocity && body.velocity.y < 0;

    if (isMovingVertically) {
      // Moving vertically (depth navigation) - disable gravity
      body.setGravityY(0);
    } else if (isJumping || isInAir || isMovingUp) {
      // Jumping or in air - enable gravity for proper jump physics
      body.setGravityY(GameConfig.GRAVITY);
    } else {
      // On ground and not moving vertically - disable gravity and stop velocity
      body.setGravityY(0);
      body.setVelocityY(0);

      // Clamp to ground range if outside
      if (player.sprite.y < groundRangeTop) {
        player.sprite.setPosition(player.sprite.x, groundRangeTop);
      } else if (player.sprite.y > groundRangeBottom) {
        player.sprite.setPosition(player.sprite.x, groundRangeBottom);
      }
    }
  }

  /**
   * Update weapon indicator for player
   */
  private updateWeaponIndicator(player: Player, index: number): void {
    if (this.weaponIndicators[index]) {
      const weapon = player.getWeapon();
      if (weapon) {
        const throwCount = weapon.getThrowCount();
        const maxThrows = (weapon as any).maxThrows || 3;
        this.weaponIndicators[index].updateWeapon(
          weapon.getWeaponType(),
          throwCount,
          maxThrows
        );
      } else {
        this.weaponIndicators[index].updateWeapon(null);
      }
    }
  }

  /**
   * Send input to multiplayer server if connected
   */
  private sendMultiplayerInput(input: any, index: number): void {
    if (this.isMultiplayer && this.multiplayerClient && index === 0) {
      this.multiplayerClient.sendInput(input);
    }
  }

  /**
   * Check for weapon and item pickups
   */
  private checkPickups(player: Player): void {
    // Check for weapon pickup
    const weapon = this.weaponManager.checkPickup(player);
    if (weapon && !player.hasWeapon()) {
      player.pickupWeapon(weapon);
    }

    // Check for item collection
    this.itemManager.checkCollection(player);
  }

  /**
   * Send player state update to multiplayer server
   */
  sendPlayerStateUpdate(player: Player): void {
    if (this.isMultiplayer && this.multiplayerClient && player) {
      const body = player.sprite.body as Phaser.Physics.Arcade.Body;
      
      this.multiplayerClient.sendPlayerUpdate({
        x: player.sprite.x,
        y: player.sprite.y,
        velocityX: body.velocity.x,
        velocityY: body.velocity.y,
        state: player.getState(),
        character: player.getCharacterType(),
        facingRight: player.isFacingRight(),
        health: player.getHealth()
      });
    }
  }
}

