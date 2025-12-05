import Phaser from 'phaser';
import { RoomConfig, LevelConfig, BackgroundLayer, LEVEL_ROOM_CONFIGS } from './RoomConfig';
import { BACKGROUND_KEYS } from './BackgroundKeys';

/**
 * Room Manager - Handles room transitions, background rendering, and camera integration
 * 
 * This system manages:
 * - Room loading and transitions
 * - Background layer rendering with parallax
 * - Camera bounds management
 * - Player position on room transitions
 * - Level progression
 */
export class RoomManager {
  private scene: Phaser.Scene;
  private currentLevel: LevelConfig | null = null;
  private currentRoom: RoomConfig | null = null;
  // @ts-ignore - Set but not currently read, kept for future use
  private currentRoomIndex: number = -1;
  private backgroundLayers: Map<string, Phaser.GameObjects.TileSprite | Phaser.GameObjects.Image> = new Map();
  private transitionInProgress: boolean = false;
  private transitionDuration: number = 500; // ms for room transitions

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Initialize a level with its first room
   */
  initializeLevel(levelId: string): void {
    const levelConfig = LEVEL_ROOM_CONFIGS[levelId];
    if (!levelConfig) {
      console.error(`[RoomManager] Level not found: ${levelId}`);
      return;
    }

    this.currentLevel = levelConfig;
    this.currentRoomIndex = 0;
    
    // Load the first room
    const startRoomId = levelConfig.startRoomId;
    const startRoom = levelConfig.rooms.find(r => r.id === startRoomId) || levelConfig.rooms[0];
    
    if (!startRoom) {
      console.error(`[RoomManager] Start room not found: ${startRoomId}`);
      return;
    }

    this.loadRoom(startRoom, true);
    
    // Emit level started event
    this.scene.events.emit('levelStarted', {
      levelId: levelConfig.id,
      levelName: levelConfig.name,
      roomId: startRoom.id
    });
  }

  /**
   * Load a room and set up its backgrounds
   */
  private loadRoom(roomConfig: RoomConfig, isInitial: boolean = false): void {
    if (this.transitionInProgress) {
      return; // Prevent overlapping transitions
    }

    console.log(`[RoomManager] Loading room: ${roomConfig.name} (${roomConfig.id})`);
    console.log(`[RoomManager] Room background layers:`, roomConfig.backgroundLayers.map(l => l.key));

    // Clean up previous room backgrounds
    if (!isInitial) {
      this.cleanupRoom();
    }

    this.currentRoom = roomConfig;

    // Create background layers immediately
    // If textures aren't ready, they'll use placeholder and we can retry
    this.createBackgroundLayers(roomConfig.backgroundLayers);

    // Set up camera bounds
    this.setupCameraBounds(roomConfig);

    // Emit room loaded event
    this.scene.events.emit('roomLoaded', {
      roomId: roomConfig.id,
      roomName: roomConfig.name,
      width: roomConfig.width,
      height: roomConfig.height
    });

    // Play room-specific music if available
    if (this.currentLevel?.musicTrack) {
      this.scene.events.emit('playRoomMusic', this.currentLevel.musicTrack);
    }
    
    // Retry loading images if they weren't ready (for GIFs that take longer)
    // Check multiple times with increasing delays
    [100, 300, 500, 1000].forEach((delay, attempt) => {
      this.scene.time.delayedCall(delay, () => {
        roomConfig.backgroundLayers.forEach(layerConfig => {
          if (layerConfig.key.startsWith('level')) {
            const textureExists = this.scene.textures.exists(layerConfig.key);
            const existingLayer = this.backgroundLayers.get(layerConfig.key);
            
            if (!textureExists && attempt < 3) {
              console.log(`[RoomManager] Attempt ${attempt + 1}: ${layerConfig.key} still not loaded, will retry...`);
            } else if (textureExists && existingLayer) {
              // Check if we're using placeholder but image is now available
              const currentTexture = (existingLayer as Phaser.GameObjects.Image).texture?.key;
              if (currentTexture === BACKGROUND_KEYS.PLACEHOLDER) {
                console.log(`[RoomManager] Image ${layerConfig.key} is now available! Replacing placeholder...`);
                // Remove old placeholder layer
                existingLayer.destroy();
                this.backgroundLayers.delete(layerConfig.key);
                // Recreate with actual image
                this.createBackgroundLayers([layerConfig]);
              }
            } else if (!textureExists && attempt === 3) {
              console.error(`[RoomManager] Failed to load ${layerConfig.key} after all retries`);
            }
          }
        });
      });
    });
  }

  /**
   * Create all background layers for a room
   */
  private createBackgroundLayers(layers: BackgroundLayer[]): void {
    const { height } = this.scene.cameras.main;

    layers.forEach((layerConfig) => {
      // Check if texture exists, use placeholder if not
      const textureExists = this.scene.textures.exists(layerConfig.key);
      const textureKey = textureExists ? layerConfig.key : BACKGROUND_KEYS.PLACEHOLDER;

      // Log texture status for debugging
      if (!textureExists && layerConfig.key.startsWith('level')) {
        console.warn(`[RoomManager] Level image not loaded yet: ${layerConfig.key}. Using placeholder.`);
        // List first 10 available textures for debugging
        const availableTextures = Object.keys(this.scene.textures.list).slice(0, 10);
        console.log(`[RoomManager] Sample available textures:`, availableTextures);
      } else if (textureExists && layerConfig.key.startsWith('level')) {
        console.log(`[RoomManager] ✓ Level image found: ${layerConfig.key}`);
      }

      // Create placeholder if needed
      if (!this.scene.textures.exists(BACKGROUND_KEYS.PLACEHOLDER)) {
        this.createPlaceholderBackground();
      }

      // Determine if we should tile or use a single image
      if (layerConfig.tileX || layerConfig.tileY) {
        // Use TileSprite for tiling backgrounds
        const tileSprite = this.scene.add.tileSprite(
          layerConfig.offsetX || 0,
          layerConfig.offsetY || 0,
          this.currentRoom!.width,
          height,
          textureKey
        );
        
        tileSprite.setOrigin(0, 0);
        tileSprite.setDepth(layerConfig.depth);
        tileSprite.setScrollFactor(layerConfig.scrollSpeed, 1);
        
        if (layerConfig.scale) {
          tileSprite.setScale(layerConfig.scale);
        }

        this.backgroundLayers.set(layerConfig.key, tileSprite);
      } else {
        // Use regular Image for non-tiling backgrounds
        // For level room images, position at (0, 0) to fill the room
        const isLevelRoomImage = layerConfig.key.startsWith('level') && layerConfig.key.includes('_room');
        
        let image: Phaser.GameObjects.Image;
        if (isLevelRoomImage) {
          // Level room images should fill the entire room
          // Try to get the actual texture, fallback to placeholder if not ready
          let finalTextureKey = textureKey;
          
          if (textureExists) {
            const texture = this.scene.textures.get(layerConfig.key);
            if (texture && texture.source && texture.source.length > 0) {
              finalTextureKey = layerConfig.key;
              console.log(`[RoomManager] Using level image: ${layerConfig.key} (${texture.source[0].width}x${texture.source[0].height})`);
            } else {
              console.warn(`[RoomManager] Texture ${layerConfig.key} exists but not ready, using placeholder`);
              finalTextureKey = BACKGROUND_KEYS.PLACEHOLDER;
            }
          }
          
          // For level room images, position at camera center with scrollFactor 0
          // This makes it a static background that fills the viewport
          const camera = this.scene.cameras.main;
          const viewportWidth = camera.width;
          const viewportHeight = camera.height;
          
          image = this.scene.add.image(viewportWidth / 2, viewportHeight / 2, finalTextureKey);
          image.setOrigin(0.5, 0.5);
          
          // Scale image to fill the entire room dimensions
          if (finalTextureKey !== BACKGROUND_KEYS.PLACEHOLDER) {
            const texture = this.scene.textures.get(finalTextureKey);
            if (texture && texture.source && texture.source.length > 0) {
              const textureWidth = texture.source[0].width;
              const textureHeight = texture.source[0].height;
              
              console.log(`[RoomManager] Scaling image from ${textureWidth}x${textureHeight} to fit room ${this.currentRoom!.width}x${height}`);
              
              // Scale to cover the entire viewport (camera size)
              const scaleY = viewportHeight / textureHeight;
              const scaleX = viewportWidth / textureWidth;
              
              // Use the larger scale to ensure full coverage of viewport
              const scale = Math.max(scaleX, scaleY) * 1.1; // Add 10% padding to ensure coverage
              image.setScale(scale);
              
              // Log final image dimensions for debugging
              const scaledWidth = textureWidth * scale;
              const scaledHeight = textureHeight * scale;
              console.log(`[RoomManager] Image scaled to ${scaledWidth}x${scaledHeight}, positioned at camera center (${viewportWidth / 2}, ${viewportHeight / 2})`);
              console.log(`[RoomManager] Viewport dimensions: ${viewportWidth}x${viewportHeight}`);
            }
          } else {
            // For placeholder, scale to room size
            const scaleY = height / 576; // Placeholder is 576px tall
            const scaleX = this.currentRoom!.width / 2000; // Placeholder is 2000px wide
            image.setScale(Math.max(scaleX, scaleY));
          }
        } else {
          // Regular backgrounds use center positioning
          image = this.scene.add.image(
            layerConfig.offsetX || this.currentRoom!.width / 2,
            layerConfig.offsetY || height / 2,
            textureKey
          );
          image.setOrigin(0.5, 0.5);
        }
        
        // Set depth to be behind everything (very negative)
        image.setDepth(-1000); // Use very negative depth to ensure it's behind everything
        
        // For level room images, use scrollFactor 0 (static relative to camera)
        // This ensures the background stays visible as the camera moves
        if (isLevelRoomImage) {
          image.setScrollFactor(0, 0); // Static background that doesn't scroll
          console.log(`[RoomManager] Using static background (scrollFactor 0, depth -1000) for ${layerConfig.key}`);
        } else {
          image.setDepth(layerConfig.depth);
          image.setScrollFactor(layerConfig.scrollSpeed, 1);
        }
        
        // Additional scaling for non-level-room images
        if (!isLevelRoomImage) {
          if (this.scene.textures.exists(textureKey)) {
            const texture = this.scene.textures.get(textureKey);
            if (texture && texture.source && texture.source.length > 0) {
              const textureWidth = texture.source[0].width;
              const scale = this.currentRoom!.width / textureWidth;
              image.setScale(scale);
            }
          } else if (layerConfig.scale) {
            image.setScale(layerConfig.scale);
          }
        }

        // Ensure image is visible and properly configured
        image.setVisible(true);
        image.setAlpha(1);
        image.setActive(true);
        
        // Ensure image is in the scene's display list
        if (!this.scene.children.exists(image)) {
          console.warn(`[RoomManager] WARNING: Image ${layerConfig.key} not in scene display list! Adding...`);
          this.scene.children.add(image);
        }
        
        this.backgroundLayers.set(layerConfig.key, image);
        
        // Enhanced logging for debugging
        const cameraX = this.scene.cameras.main.scrollX;
        const cameraY = this.scene.cameras.main.scrollY;
        const imageWorldX = image.x;
        const imageWorldY = image.y;
        const imageDisplayWidth = image.displayWidth;
        const imageDisplayHeight = image.displayHeight;
        
        // Calculate where the image should appear on screen
        const imageScreenX = imageWorldX - cameraX;
        const imageScreenY = imageWorldY - cameraY;
        
        console.log(`[RoomManager] Created background layer: ${layerConfig.key}`);
        console.log(`[RoomManager]   - Depth: ${layerConfig.depth}, ScrollFactor: ${layerConfig.scrollSpeed}`);
        console.log(`[RoomManager]   - World position: (${imageWorldX}, ${imageWorldY})`);
        console.log(`[RoomManager]   - Display size: ${imageDisplayWidth}x${imageDisplayHeight}`);
        console.log(`[RoomManager]   - Camera position: (${cameraX}, ${cameraY})`);
        console.log(`[RoomManager]   - Screen position (before scrollFactor): (${imageScreenX}, ${imageScreenY})`);
        console.log(`[RoomManager]   - Visible: ${image.visible}, Alpha: ${image.alpha}, Active: ${image.active}`);
        console.log(`[RoomManager]   - In display list: ${this.scene.children.exists(image)}`);
        
        // Verify texture is actually loaded
        if (image.texture && image.texture.key) {
          const texture = this.scene.textures.get(image.texture.key);
          const hasValidFrame = texture && texture.source && texture.source.length > 0;
          console.log(`[RoomManager]   - Texture key: ${image.texture.key}`);
          console.log(`[RoomManager]   - Texture valid: ${hasValidFrame}`);
          if (hasValidFrame) {
            console.log(`[RoomManager]   - Texture size: ${texture.source[0].width}x${texture.source[0].height}`);
          }
        } else {
          console.warn(`[RoomManager]   - WARNING: Image has no texture!`);
        }
        
        // Force a render update by toggling visibility
        image.setVisible(false);
        this.scene.time.delayedCall(10, () => {
          image.setVisible(true);
          console.log(`[RoomManager]   - Forced visibility update for ${layerConfig.key}`);
        });
      }
    });
  }

  /**
   * Create a placeholder background for missing textures
   */
  private createPlaceholderBackground(): void {
    const graphics = this.scene.add.graphics();
    const width = 2000;
    const height = 576;
    
    // Create a simple gradient background
    graphics.fillGradientStyle(0x222222, 0x222222, 0x111111, 0x111111, 1);
    graphics.fillRect(0, 0, width, height);
    
    // Add some grid lines for reference
    graphics.lineStyle(1, 0x333333, 0.3);
    for (let x = 0; x < width; x += 100) {
      graphics.lineBetween(x, 0, x, height);
    }
    for (let y = 0; y < height; y += 100) {
      graphics.lineBetween(0, y, width, y);
    }
    
    graphics.generateTexture(BACKGROUND_KEYS.PLACEHOLDER, width, height);
    graphics.destroy();
  }

  /**
   * Set up camera bounds for the current room
   */
  private setupCameraBounds(roomConfig: RoomConfig): void {
    const camera = this.scene.cameras.main;
    camera.setBounds(
      roomConfig.cameraBounds.minX,
      roomConfig.cameraBounds.minY,
      roomConfig.cameraBounds.maxX - roomConfig.cameraBounds.minX,
      roomConfig.cameraBounds.maxY - roomConfig.cameraBounds.minY
    );
    
    // Ensure camera starts at the correct position (usually at spawn point)
    // The camera will be positioned by GameScene when following the player
    console.log(`[RoomManager] Camera bounds set: (${roomConfig.cameraBounds.minX}, ${roomConfig.cameraBounds.minY}) to (${roomConfig.cameraBounds.maxX}, ${roomConfig.cameraBounds.maxY})`);
    console.log(`[RoomManager] Camera current position: (${camera.scrollX}, ${camera.scrollY})`);
  }

  /**
   * Update background layers based on camera position
   */
  update(cameraX: number, _cameraY: number = 0): void {
    // Update tile sprites for parallax scrolling
    this.backgroundLayers.forEach((layer) => {
      if (layer instanceof Phaser.GameObjects.TileSprite) {
        // Update tile position for parallax effect
        const scrollSpeed = layer.scrollFactorX || 1;
        layer.tilePositionX = cameraX * scrollSpeed;
      }
    });
  }

  /**
   * Check if player should transition to next room
   */
  checkRoomTransition(playerX: number, playerY: number): { transition: boolean; newX?: number; newY?: number } {
    if (!this.currentRoom || this.transitionInProgress) {
      return { transition: false };
    }

    // Check for room exit (right edge)
    if (this.currentRoom.exitX && playerX >= this.currentRoom.exitX) {
      return this.transitionToNextRoom('right', playerX, playerY);
    }

    // Check for level exit (if nextLevelId is set)
    if (this.currentRoom.nextLevelId) {
      if (this.currentRoom.exitX && playerX >= this.currentRoom.exitX) {
        return this.transitionToNextLevel(this.currentRoom.nextLevelId, playerX, playerY);
      }
    }

    return { transition: false };
  }

  /**
   * Transition to the next room
   */
  private transitionToNextRoom(direction: 'left' | 'right' | 'up' | 'down', _playerX: number, _playerY: number): { transition: boolean; newX?: number; newY?: number } {
    if (!this.currentLevel || !this.currentRoom) {
      return { transition: false };
    }

    const nextRoomId = this.currentRoom.nextRoomId;
    if (!nextRoomId) {
      return { transition: false };
    }

    // Find next room in level
    const nextRoomIndex = this.currentLevel.rooms.findIndex(r => r.id === nextRoomId);
    if (nextRoomIndex === -1) {
      console.warn(`[RoomManager] Next room not found: ${nextRoomId}`);
      return { transition: false };
    }

    const nextRoom = this.currentLevel.rooms[nextRoomIndex];
    
    // Calculate new player position based on transition direction
    let newX = nextRoom.spawnX;
    let newY = nextRoom.spawnY;

    // Adjust spawn position based on transition direction
    if (direction === 'right') {
      // Coming from left, spawn at left edge
      newX = nextRoom.spawnX;
    } else if (direction === 'left') {
      // Coming from right, spawn at right edge
      newX = nextRoom.width - 100;
    }

    // Start transition
    this.startRoomTransition(nextRoom, newX, newY);

    return {
      transition: true,
      newX: newX,
      newY: newY
    };
  }

  /**
   * Start room transition with visual effects
   */
  private startRoomTransition(nextRoom: RoomConfig, newX: number, newY: number): void {
    this.transitionInProgress = true;

    // Fade out current room
    this.scene.cameras.main.fadeOut(this.transitionDuration, 0, 0, 0);

    // After fade out, load new room
    this.scene.time.delayedCall(this.transitionDuration, () => {
      // Load new room
      this.currentRoomIndex = this.currentLevel!.rooms.findIndex(r => r.id === nextRoom.id);
      this.loadRoom(nextRoom, false);

      // Fade in new room
      this.scene.cameras.main.fadeIn(this.transitionDuration, 0, 0, 0);

      // Complete transition
      this.scene.time.delayedCall(this.transitionDuration, () => {
        this.transitionInProgress = false;
        
        // Emit transition complete event
        this.scene.events.emit('roomTransitionComplete', {
          fromRoomId: this.currentRoom?.id,
          toRoomId: nextRoom.id,
          playerX: newX,
          playerY: newY
        });
      });
    });
  }

  /**
   * Transition to next level
   */
  private transitionToNextLevel(nextLevelId: string, _playerX: number, _playerY: number): { transition: boolean; newX?: number; newY?: number } {
    console.log(`[RoomManager] Transitioning to level: ${nextLevelId}`);

    // Fade out current level
    this.scene.cameras.main.fadeOut(this.transitionDuration * 2, 0, 0, 0);

    this.scene.time.delayedCall(this.transitionDuration * 2, () => {
      // Initialize new level
      this.initializeLevel(nextLevelId);
      
      // Get spawn position from first room
      const startRoom = this.currentLevel!.rooms.find(r => r.id === this.currentLevel!.startRoomId) || this.currentLevel!.rooms[0];
      const newX = startRoom.spawnX;
      const newY = startRoom.spawnY;

      // Fade in new level
      this.scene.cameras.main.fadeIn(this.transitionDuration * 2, 0, 0, 0);

      this.scene.time.delayedCall(this.transitionDuration * 2, () => {
        this.transitionInProgress = false;
        
        // Emit level transition complete event
        this.scene.events.emit('levelTransitionComplete', {
          fromLevelId: this.currentLevel?.id,
          toLevelId: nextLevelId,
          playerX: newX,
          playerY: newY
        });
      });
    });

    return {
      transition: true,
      newX: this.currentLevel?.rooms[0]?.spawnX || 200,
      newY: this.currentLevel?.rooms[0]?.spawnY || 476
    };
  }

  /**
   * Get current room configuration
   */
  getCurrentRoom(): RoomConfig | null {
    return this.currentRoom;
  }

  /**
   * Get current level configuration
   */
  getCurrentLevel(): LevelConfig | null {
    return this.currentLevel;
  }

  /**
   * Get room width
   */
  getRoomWidth(): number {
    return this.currentRoom?.width || 2000;
  }

  /**
   * Get room height
   */
  getRoomHeight(): number {
    return this.currentRoom?.height || 576;
  }

  /**
   * Get camera bounds for current room
   */
  getCameraBounds(): { minX: number; maxX: number; minY: number; maxY: number } | null {
    if (!this.currentRoom) return null;
    return this.currentRoom.cameraBounds;
  }

  /**
   * Clean up current room (remove backgrounds, etc.)
   */
  private cleanupRoom(): void {
    this.backgroundLayers.forEach((layer) => {
      layer.destroy();
    });
    this.backgroundLayers.clear();
  }

  /**
   * Destroy room manager
   */
  destroy(): void {
    this.cleanupRoom();
    this.currentRoom = null;
    this.currentLevel = null;
  }
}

