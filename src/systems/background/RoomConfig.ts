/**
 * Room and Background Configuration System
 * 
 * This system manages room transitions, background layers, and camera integration
 * for seamless level progression.
 */

export interface BackgroundLayer {
  key: string; // Texture key for the background image
  scrollSpeed: number; // Parallax scroll speed (0.0 = static, 1.0 = full speed)
  depth: number; // Rendering depth (lower = further back)
  offsetX?: number; // Horizontal offset
  offsetY?: number; // Vertical offset
  tileX?: boolean; // Whether to tile horizontally
  tileY?: boolean; // Whether to tile vertically
  scale?: number; // Scale factor for the background
}

export interface RoomConfig {
  id: string;
  name: string;
  width: number; // Room width in pixels
  height: number; // Room height in pixels
  backgroundLayers: BackgroundLayer[]; // Multiple layers for parallax
  spawnX: number; // Player spawn X position (usually 0 or left edge)
  spawnY: number; // Player spawn Y position (ground level)
  exitX?: number; // X position where player exits to next room (usually width)
  exitY?: number; // Y position for exit (for vertical transitions)
  nextRoomId?: string; // ID of the next room (for room transitions)
  nextLevelId?: string; // ID of the next level (for level transitions)
  cameraBounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };
  // Room-specific spawn points
  enemySpawns?: Array<{ x: number; y: number; type: string; delay?: number }>;
  itemSpawns?: Array<{ x: number; y: number; type: string }>;
  weaponSpawns?: Array<{ x: number; y: number; type: string }>;
}

export interface LevelConfig {
  id: string;
  name: string;
  rooms: RoomConfig[]; // Ordered list of rooms in the level
  startRoomId: string; // ID of the first room
  musicTrack?: string; // Background music for the level
}

import { getLevelRoomImages, getLevelRoomImage } from './LevelImageLoader';

/**
 * Generate room configuration from level room image
 */
function generateRoomFromLevelImage(levelNumber: number, roomNumber: number): RoomConfig | null {
  const roomImage = getLevelRoomImage(levelNumber, roomNumber);
  if (!roomImage) return null;

  // Default room dimensions (can be adjusted based on actual image dimensions)
  const defaultWidth = 2000;
  const defaultHeight = 576;

  return {
    id: `level${levelNumber}_room${roomNumber}`,
    name: `Level ${levelNumber} - Room ${roomNumber}`,
    width: defaultWidth,
    height: defaultHeight,
    backgroundLayers: [
      {
        key: roomImage.key,
        scrollSpeed: 1.0, // Full scroll speed for main background
        depth: -10,
        tileX: false, // Don't tile, use full image
        tileY: false
      }
    ],
    spawnX: 200,
    spawnY: defaultHeight - 100, // Ground level
    exitX: defaultWidth - 100,
    nextRoomId: roomNumber < getLevelRoomImages(levelNumber).length 
      ? `level${levelNumber}_room${roomNumber + 1}`
      : undefined,
    nextLevelId: roomNumber === getLevelRoomImages(levelNumber).length 
      ? `level${levelNumber + 1}`
      : undefined,
    cameraBounds: {
      minX: 0,
      maxX: defaultWidth,
      minY: 0,
      maxY: defaultHeight
    }
  };
}

/**
 * Generate all room configurations for a level
 */
export function generateLevelRooms(levelNumber: number): RoomConfig[] {
  const roomImages = getLevelRoomImages(levelNumber);
  const rooms: RoomConfig[] = [];

  // Sort room images by roomNumber to ensure correct order
  const sortedRoomImages = [...roomImages].sort((a, b) => a.roomNumber - b.roomNumber);

  sortedRoomImages.forEach(roomImage => {
    const room = generateRoomFromLevelImage(levelNumber, roomImage.roomNumber);
    if (room) {
      rooms.push(room);
    }
  });

  // Verify room progression
  console.log(`[RoomConfig] Generated ${rooms.length} rooms for level ${levelNumber}:`);
  rooms.forEach((room, index) => {
    console.log(`  Room ${index + 1}: ${room.id} -> ${room.nextRoomId || 'END'}`);
  });

  return rooms;
}

/**
 * Room configurations are now generated automatically from level images
 * No need for predefined room configs - they're created dynamically
 */
export const ROOM_CONFIGS: Record<string, RoomConfig> = {};

/**
 * Level configurations with room sequences
 * Now uses actual level room images
 */
export const LEVEL_ROOM_CONFIGS: Record<string, LevelConfig> = {
  level1: {
    id: 'level1',
    name: 'City Streets',
    rooms: generateLevelRooms(1),
    startRoomId: 'level1_room1',
    musicTrack: 'level1'
  },
  
  level2: {
    id: 'level2',
    name: 'Industrial District',
    rooms: generateLevelRooms(2),
    startRoomId: 'level2_room1',
    musicTrack: 'level2'
  },
  
  level3: {
    id: 'level3',
    name: 'Level 3',
    rooms: generateLevelRooms(3),
    startRoomId: 'level3_room1',
    musicTrack: 'level1' // Can be updated with level3 music
  },
  
  level4: {
    id: 'level4',
    name: 'Level 4',
    rooms: generateLevelRooms(4),
    startRoomId: 'level4_room1',
    musicTrack: 'level1' // Can be updated with level4 music
  }
};

