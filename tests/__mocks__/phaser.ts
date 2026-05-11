/**
 * Phaser module mock for the test environment.
 * Replaces the real Phaser import (which pulls in WebGL/canvas code that
 * crashes in jsdom) with lightweight stubs that satisfy all source-file
 * usage patterns found in the codebase.
 *
 * Wire it up in vitest.config.ts via resolve.alias:
 *   'phaser': path.resolve(__dirname, './tests/__mocks__/phaser.ts')
 */
import { vi } from 'vitest';

const makeSpriteBody = () => ({
  velocity: { x: 0, y: 0 },
  touching: { down: false, up: false, left: false, right: false },
  blocked: { down: false, up: false, left: false, right: false },
  setSize: vi.fn(),
  setOffset: vi.fn(),
  setAllowGravity: vi.fn(),
  setGravity: vi.fn(),
  setVelocity: vi.fn(),
  setVelocityX: vi.fn(),
  setVelocityY: vi.fn(),
  setCollideWorldBounds: vi.fn(),
  reset: vi.fn(),
  enable: true,
});

const makeSprite = () => ({
  x: 0,
  y: 0,
  scaleX: 1,
  scaleY: 1,
  angle: 0,
  alpha: 1,
  depth: 0,
  active: true,
  flipX: false,
  texture: { key: 'mock' },
  body: makeSpriteBody(),
  // truthy sentinel — prevents Item.setupItem() from recreating the sprite at (0,0)
  scene: {} as any,
  anims: {
    play: vi.fn(),
    stop: vi.fn(),
    isPlaying: false,
    currentAnim: null,
  },
  setActive: vi.fn().mockReturnThis(),
  setVisible: vi.fn().mockReturnThis(),
  setPosition: vi.fn().mockReturnThis(),
  setScale: vi.fn().mockReturnThis(),
  setFlipX: vi.fn().mockReturnThis(),
  setTint: vi.fn().mockReturnThis(),
  clearTint: vi.fn().mockReturnThis(),
  setAlpha: vi.fn().mockReturnThis(),
  setAngle: vi.fn().mockReturnThis(),
  setDepth: vi.fn().mockReturnThis(),
  setTexture: vi.fn().mockReturnThis(),
  setData: vi.fn().mockReturnThis(),
  getData: vi.fn(),
  setCollideWorldBounds: vi.fn().mockReturnThis(),
  setBounce: vi.fn().mockReturnThis(),
  setDragX: vi.fn().mockReturnThis(),
  setDisplaySize: vi.fn().mockReturnThis(),
  setSize: vi.fn().mockReturnThis(),
  setOrigin: vi.fn().mockReturnThis(),
  setScrollFactor: vi.fn().mockReturnThis(),
  destroy: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
});

const makeScene = () => ({
  add: {
    text: vi.fn(() => ({
      setOrigin: vi.fn().mockReturnThis(),
      setInteractive: vi.fn().mockReturnThis(),
      setDepth: vi.fn().mockReturnThis(),
      setVisible: vi.fn().mockReturnThis(),
      setPosition: vi.fn().mockReturnThis(),
      setAlpha: vi.fn().mockReturnThis(),
      setScale: vi.fn().mockReturnThis(),
      setStyle: vi.fn().mockReturnThis(),
      setText: vi.fn().mockReturnThis(),
      setFlipX: vi.fn().mockReturnThis(),
      setTint: vi.fn().mockReturnThis(),
      clearTint: vi.fn().mockReturnThis(),
      destroy: vi.fn(),
      x: 0, y: 0, alpha: 1,
    })),
    graphics: vi.fn(() => ({
      fillStyle: vi.fn().mockReturnThis(),
      fillRect: vi.fn().mockReturnThis(),
      fillCircle: vi.fn().mockReturnThis(),
      fillRoundedRect: vi.fn().mockReturnThis(),
      lineStyle: vi.fn().mockReturnThis(),
      strokeRoundedRect: vi.fn().mockReturnThis(),
      lineBetween: vi.fn().mockReturnThis(),
      clear: vi.fn().mockReturnThis(),
      generateTexture: vi.fn(),
      setDepth: vi.fn().mockReturnThis(),
      setAlpha: vi.fn().mockReturnThis(),
      destroy: vi.fn(),
    })),
    rectangle: vi.fn(() => ({
      setStrokeStyle: vi.fn().mockReturnThis(),
      setInteractive: vi.fn().mockReturnThis(),
      setFillStyle: vi.fn().mockReturnThis(),
      setSize: vi.fn().mockReturnThis(),
      setPosition: vi.fn().mockReturnThis(),
      destroy: vi.fn(),
    })),
    image: vi.fn(() => ({
      setOrigin: vi.fn().mockReturnThis(),
      setDepth: vi.fn().mockReturnThis(),
      setAlpha: vi.fn().mockReturnThis(),
      setVisible: vi.fn().mockReturnThis(),
      destroy: vi.fn(),
      x: 0, y: 0,
    })),
    existing: vi.fn(),
    sprite: vi.fn(() => makeSprite()),
    tileSprite: vi.fn(() => ({
      setOrigin: vi.fn().mockReturnThis(),
      setDepth: vi.fn().mockReturnThis(),
      setScrollFactor: vi.fn().mockReturnThis(),
      tilePositionX: 0,
      destroy: vi.fn(),
    })),
    container: vi.fn(() => ({
      add: vi.fn().mockReturnThis(),
      setDepth: vi.fn().mockReturnThis(),
      setVisible: vi.fn().mockReturnThis(),
      setPosition: vi.fn().mockReturnThis(),
      setAlpha: vi.fn().mockReturnThis(),
      setScale: vi.fn().mockReturnThis(),
      destroy: vi.fn(),
      list: [],
    })),
  },
  physics: {
    add: {
      sprite: vi.fn((x?: number, y?: number) => ({ ...makeSprite(), x: x ?? 0, y: y ?? 0 })),
      existing: vi.fn(),
      collider: vi.fn(),
      overlap: vi.fn(),
    },
    world: {
      enable: vi.fn(),
      setBounds: vi.fn(),
    },
  },
  cameras: {
    main: {
      width: 1024, height: 576,
      centerX: 512, centerY: 288,
      scrollX: 0, scrollY: 0,
      startFollow: vi.fn(),
      setBounds: vi.fn(),
      shake: vi.fn(),
    },
  },
  input: {
    keyboard: {
      createCursorKeys: vi.fn(() => ({
        left: { isDown: false }, right: { isDown: false },
        up: { isDown: false }, down: { isDown: false },
        space: { isDown: false },
      })),
      addKeys: vi.fn(() => ({})),
      addKey: vi.fn(() => ({ isDown: false })),
      on: vi.fn(),
      checkDown: vi.fn(),
    },
    on: vi.fn(),
  },
  events: { on: vi.fn(), emit: vi.fn(), off: vi.fn() },
  time: {
    delayedCall: vi.fn(() => ({ remove: vi.fn(), destroy: vi.fn() })),
    addEvent: vi.fn(() => ({ remove: vi.fn(), destroy: vi.fn() })),
    now: 0,
  },
  tweens: {
    add: vi.fn(() => ({ onComplete: vi.fn(), stop: vi.fn() })),
    killTweensOf: vi.fn(),
  },
  sound: {
    add: vi.fn(() => ({ play: vi.fn(), stop: vi.fn(), setVolume: vi.fn(), isPlaying: false })),
    play: vi.fn(),
  },
  textures: {
    exists: vi.fn(() => false),
    get: vi.fn(() => ({ setFilter: vi.fn() })),
    generate: vi.fn(),
  },
  anims: {
    generateFrameNumbers: vi.fn(() => []),
    create: vi.fn(),
    exists: vi.fn(() => false),
  },
  children: { list: [] },
  data: { set: vi.fn(), get: vi.fn() },
  sys: { game: { device: { os: {} } } },
  scene: { start: vi.fn(), stop: vi.fn(), launch: vi.fn(), isActive: vi.fn(() => false) },
});

class MockScene {
  [key: string]: any;
  constructor() {
    Object.assign(this, makeScene());
  }
}

// Fallback Math used only if global.Phaser is not yet set (shouldn't normally happen).
const fallbackMath = {
  Distance: {
    Between: (x1: number, y1: number, x2: number, y2: number) =>
      Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2),
  },
  Clamp: (value: number, min: number, max: number) => Math.max(min, Math.min(max, value)),
  Between: (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min,
  FloatBetween: (min: number, max: number) => Math.random() * (max - min) + min,
};

const Phaser = {
  Scene: MockScene,
  // Use a getter so this always returns the same object as global.Phaser.Math.
  // This lets tests spy on global.Phaser.Math.Distance.Between and have it
  // affect the Phaser import used in source files.
  get Math() {
    return (globalThis as any).Phaser?.Math ?? fallbackMath;
  },
  Geom: {
    Rectangle: Object.assign(
      class Rectangle {
        x: number; y: number; width: number; height: number;
        constructor(x = 0, y = 0, w = 0, h = 0) { this.x = x; this.y = y; this.width = w; this.height = h; }
        contains(x: number, y: number) { return x >= this.x && x <= this.x + this.width && y >= this.y && y <= this.y + this.height; }
      },
      { Overlaps: (a: any, b: any) => a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y }
    ),
    Intersects: { RectangleToRectangle: vi.fn(() => false) },
  },
  Input: {
    Keyboard: {
      JustDown: vi.fn(() => false),
      JustUp: vi.fn(() => false),
      KeyCodes: { SHIFT: 16, CTRL: 17, ALT: 18, ENTER: 13, ESC: 27 },
    },
  },
  Scale: { FIT: 'FIT', CENTER_BOTH: 'CENTER_BOTH', NO_CENTER: 'NO_CENTER' },
  Textures: { FilterMode: { NEAREST: 0, LINEAR: 1 } },
  Physics: { Arcade: { Body: class {} } },
  Types: {
    Core: { GameConfig: {} },
    Input: { Keyboard: { CursorKeys: {} } },
    Physics: { Arcade: { Body: {} } },
  },
  AUTO: 'AUTO',
  WEBGL: 'WEBGL',
  CANVAS: 'CANVAS',
  Game: vi.fn(),
  GameObjects: {
    Container: class {},
    Graphics: class {},
    Text: class {},
    Image: class {},
    Sprite: class {},
  },
};

export default Phaser;
