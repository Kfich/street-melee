/**
 * Level Image Loader - Discovers and loads level room images
 * 
 * This system automatically discovers level room images from assets/sprites/imgs/levels
 * and generates room configurations based on the image files.
 */

export interface LevelRoomImage {
  levelNumber: number;
  roomNumber: number;
  key: string;
  path: string;
}

/**
 * Predefined level room image mappings
 * Based on the actual files in assets/sprites/imgs/levels
 */
export const LEVEL_ROOM_IMAGES: LevelRoomImage[] = [
  // Level 1 - 12 rooms
  { levelNumber: 1, roomNumber: 1, key: 'level1_room1', path: 'assets/sprites/imgs/levels/Level1.1.gif' },
  { levelNumber: 1, roomNumber: 2, key: 'level1_room2', path: 'assets/sprites/imgs/levels/Level1.2.gif' },
  { levelNumber: 1, roomNumber: 3, key: 'level1_room3', path: 'assets/sprites/imgs/levels/Level1.3.gif' },
  { levelNumber: 1, roomNumber: 4, key: 'level1_room4', path: 'assets/sprites/imgs/levels/Level1.4.gif' },
  { levelNumber: 1, roomNumber: 5, key: 'level1_room5', path: 'assets/sprites/imgs/levels/Level1.5.gif' },
  { levelNumber: 1, roomNumber: 6, key: 'level1_room6', path: 'assets/sprites/imgs/levels/Level1.6.gif' },
  { levelNumber: 1, roomNumber: 7, key: 'level1_room7', path: 'assets/sprites/imgs/levels/Level1.7.gif' },
  { levelNumber: 1, roomNumber: 8, key: 'level1_room8', path: 'assets/sprites/imgs/levels/Level1.8.gif' },
  { levelNumber: 1, roomNumber: 9, key: 'level1_room9', path: 'assets/sprites/imgs/levels/Level1.9.gif' },
  { levelNumber: 1, roomNumber: 10, key: 'level1_room10', path: 'assets/sprites/imgs/levels/Level1.10.gif' },
  { levelNumber: 1, roomNumber: 11, key: 'level1_room11', path: 'assets/sprites/imgs/levels/Level1.11.gif' },
  { levelNumber: 1, roomNumber: 12, key: 'level1_room12', path: 'assets/sprites/imgs/levels/Level1.12.gif' },
  
  // Level 2 - 10 rooms
  { levelNumber: 2, roomNumber: 1, key: 'level2_room1', path: 'assets/sprites/imgs/levels/Level2.1.gif' },
  { levelNumber: 2, roomNumber: 2, key: 'level2_room2', path: 'assets/sprites/imgs/levels/Level2.2.gif' },
  { levelNumber: 2, roomNumber: 3, key: 'level2_room3', path: 'assets/sprites/imgs/levels/Level2.3.gif' },
  { levelNumber: 2, roomNumber: 4, key: 'level2_room4', path: 'assets/sprites/imgs/levels/Level2.4.gif' },
  { levelNumber: 2, roomNumber: 5, key: 'level2_room5', path: 'assets/sprites/imgs/levels/Level2.5.gif' },
  { levelNumber: 2, roomNumber: 6, key: 'level2_room6', path: 'assets/sprites/imgs/levels/Level2.6.gif' },
  { levelNumber: 2, roomNumber: 7, key: 'level2_room7', path: 'assets/sprites/imgs/levels/Level2.7.gif' },
  { levelNumber: 2, roomNumber: 8, key: 'level2_room8', path: 'assets/sprites/imgs/levels/Level2.8.gif' },
  { levelNumber: 2, roomNumber: 9, key: 'level2_room9', path: 'assets/sprites/imgs/levels/Level2.9.gif' },
  { levelNumber: 2, roomNumber: 10, key: 'level2_room10', path: 'assets/sprites/imgs/levels/Level2.10.gif' },
  
  // Level 3 - 13 rooms
  { levelNumber: 3, roomNumber: 1, key: 'level3_room1', path: 'assets/sprites/imgs/levels/Level3.1.gif' },
  { levelNumber: 3, roomNumber: 2, key: 'level3_room2', path: 'assets/sprites/imgs/levels/Level3.2.gif' },
  { levelNumber: 3, roomNumber: 3, key: 'level3_room3', path: 'assets/sprites/imgs/levels/Level3.3.gif' },
  { levelNumber: 3, roomNumber: 4, key: 'level3_room4', path: 'assets/sprites/imgs/levels/Level3.4.gif' },
  { levelNumber: 3, roomNumber: 5, key: 'level3_room5', path: 'assets/sprites/imgs/levels/Level3.5.gif' },
  { levelNumber: 3, roomNumber: 6, key: 'level3_room6', path: 'assets/sprites/imgs/levels/Level3.6.gif' },
  { levelNumber: 3, roomNumber: 7, key: 'level3_room7', path: 'assets/sprites/imgs/levels/Level3.7.gif' },
  { levelNumber: 3, roomNumber: 8, key: 'level3_room8', path: 'assets/sprites/imgs/levels/Level3.8.gif' },
  { levelNumber: 3, roomNumber: 9, key: 'level3_room9', path: 'assets/sprites/imgs/levels/Level3.9.gif' },
  { levelNumber: 3, roomNumber: 10, key: 'level3_room10', path: 'assets/sprites/imgs/levels/Level3.10.gif' },
  { levelNumber: 3, roomNumber: 11, key: 'level3_room11', path: 'assets/sprites/imgs/levels/Level3.11.gif' },
  { levelNumber: 3, roomNumber: 12, key: 'level3_room12', path: 'assets/sprites/imgs/levels/Level3.12.gif' },
  { levelNumber: 3, roomNumber: 13, key: 'level3_room13', path: 'assets/sprites/imgs/levels/Level3.13.gif' },
  
  // Level 4 - 5 rooms
  { levelNumber: 4, roomNumber: 1, key: 'level4_room1', path: 'assets/sprites/imgs/levels/Level4.1.gif' },
  { levelNumber: 4, roomNumber: 2, key: 'level4_room2', path: 'assets/sprites/imgs/levels/Level4.2.gif' },
  { levelNumber: 4, roomNumber: 3, key: 'level4_room3', path: 'assets/sprites/imgs/levels/Level4.3.gif' },
  { levelNumber: 4, roomNumber: 4, key: 'level4_room4', path: 'assets/sprites/imgs/levels/Level4.4.gif' },
  { levelNumber: 4, roomNumber: 5, key: 'level4_room5', path: 'assets/sprites/imgs/levels/Level4.5.gif' },
];

/**
 * Get all room images for a specific level
 */
export function getLevelRoomImages(levelNumber: number): LevelRoomImage[] {
  return LEVEL_ROOM_IMAGES.filter(img => img.levelNumber === levelNumber);
}

/**
 * Get a specific room image by level and room number
 */
export function getLevelRoomImage(levelNumber: number, roomNumber: number): LevelRoomImage | undefined {
  return LEVEL_ROOM_IMAGES.find(
    img => img.levelNumber === levelNumber && img.roomNumber === roomNumber
  );
}

/**
 * Get room image by key
 */
export function getLevelRoomImageByKey(key: string): LevelRoomImage | undefined {
  return LEVEL_ROOM_IMAGES.find(img => img.key === key);
}

/**
 * Level Image Loader class
 */
export class LevelImageLoader {
  /**
   * Preload all level room images for a specific level
   */
  static preloadLevelImages(scene: Phaser.Scene, levelNumber: number): void {
    const roomImages = getLevelRoomImages(levelNumber);
    console.log(`[LevelImageLoader] Loading ${roomImages.length} room images for level ${levelNumber}`);
    
    roomImages.forEach(roomImage => {
      scene.load.image(roomImage.key, roomImage.path);
    });
  }

  /**
   * Preload all level room images for all levels
   */
  static preloadAllLevelImages(scene: Phaser.Scene): void {
    console.log('[LevelImageLoader] Loading all level room images...');
    
    LEVEL_ROOM_IMAGES.forEach(roomImage => {
      // Load GIF files - Phaser supports GIFs natively
      scene.load.image(roomImage.key, roomImage.path);
      console.log(`[LevelImageLoader] Queued: ${roomImage.key} from ${roomImage.path}`);
    });
    
    console.log(`[LevelImageLoader] Queued ${LEVEL_ROOM_IMAGES.length} level room images for loading`);
    
    // Add load event listeners to verify images are loading
    scene.load.on('filecomplete-image-' + LEVEL_ROOM_IMAGES[0].key, () => {
      console.log(`[LevelImageLoader] First image loaded: ${LEVEL_ROOM_IMAGES[0].key}`);
    });
    
    scene.load.on('complete', () => {
      console.log(`[LevelImageLoader] All images loaded. Checking textures...`);
      LEVEL_ROOM_IMAGES.slice(0, 5).forEach(img => {
        if (scene.textures.exists(img.key)) {
          console.log(`[LevelImageLoader] ✓ ${img.key} is available`);
        } else {
          console.warn(`[LevelImageLoader] ✗ ${img.key} is NOT available`);
        }
      });
    });
  }

  /**
   * Check if a level room image is loaded
   */
  static isLevelImageLoaded(scene: Phaser.Scene, levelNumber: number, roomNumber: number): boolean {
    const roomImage = getLevelRoomImage(levelNumber, roomNumber);
    if (!roomImage) return false;
    return scene.textures.exists(roomImage.key);
  }

  /**
   * Get the texture key for a level room image
   */
  static getLevelImageKey(levelNumber: number, roomNumber: number): string | null {
    const roomImage = getLevelRoomImage(levelNumber, roomNumber);
    return roomImage ? roomImage.key : null;
  }
}

