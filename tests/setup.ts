import { vi } from 'vitest';

// Phaser's CanvasFeatures.js runs at module-import time and calls
// canvas.getContext('2d').fillStyle = ... — jsdom returns null for getContext,
// which crashes before any test mock can help. Patch the prototype here so it's
// in place when the Phaser module is first loaded by any test file.
HTMLCanvasElement.prototype.getContext = vi.fn((contextType: string) => {
  if (contextType === '2d') {
    return {
      fillStyle: '',
      strokeStyle: '',
      globalAlpha: 1,
      fillRect: vi.fn(),
      clearRect: vi.fn(),
      getImageData: vi.fn(() => ({ data: new Uint8Array(4) })),
      putImageData: vi.fn(),
      createImageData: vi.fn(() => ({ data: new Uint8Array(4) })),
      setTransform: vi.fn(),
      drawImage: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      fillText: vi.fn(),
      strokeText: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      closePath: vi.fn(),
      stroke: vi.fn(),
      fill: vi.fn(),
      arc: vi.fn(),
      rect: vi.fn(),
      clip: vi.fn(),
      translate: vi.fn(),
      scale: vi.fn(),
      rotate: vi.fn(),
      transform: vi.fn(),
      measureText: vi.fn(() => ({ width: 0 })),
      createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
      createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
      createPattern: vi.fn(() => null),
      isPointInPath: vi.fn(() => false),
    };
  }
  return null;
}) as any;

// Mock Phaser
global.Phaser = {
  Scene: class MockScene {
    add: any;
    physics: any;
    cameras: any;
    input: any;
    events: any;
    time: any;
    tweens: any;
    children: any;
    sound: any;
    data: any;
    
    constructor() {
      // Capture `this` so sprite factory can set sprite.scene to a truthy value,
      // preventing Item.setupItem() from recreating the sprite at (0,0).
      const self = this;

      const makeBody = () => {
        const vel = { x: 0, y: 0 };
        return {
          velocity: vel,
          touching: { down: false, up: false, left: false, right: false },
          blocked: { down: false },
          width: 32, height: 32,
          setSize: vi.fn(),
          setOffset: vi.fn(),
          setAllowGravity: vi.fn(),
          setGravity: vi.fn(),
          setGravityY: vi.fn(),
          setVelocity: vi.fn((vx: number, vy: number) => { vel.x = vx; vel.y = vy; }),
          setVelocityX: vi.fn((v: number) => { vel.x = v; }),
          setVelocityY: vi.fn((v: number) => { vel.y = v; }),
        };
      };

      const makeSprite = (x = 0, y = 0) => ({
        x, y, scaleX: 1, scaleY: 1, angle: 0, alpha: 1, depth: 0,
        active: true, flipX: false,
        texture: { key: 'mock' },
        body: makeBody(),
        anims: { play: vi.fn(), stop: vi.fn(), isPlaying: false, currentAnim: null },
        scene: self,          // truthy scene ref so setupItem() doesn't recreate sprite
        setActive: vi.fn().mockReturnThis(),
        setVisible: vi.fn().mockReturnThis(),
        setPosition: vi.fn().mockReturnThis(),
        setY: vi.fn().mockReturnThis(),
        setScale: vi.fn().mockReturnThis(),
        setOrigin: vi.fn().mockReturnThis(),
        setFlipX: vi.fn().mockReturnThis(),
        setTint: vi.fn().mockReturnThis(),
        clearTint: vi.fn().mockReturnThis(),
        setAlpha: vi.fn().mockReturnThis(),
        setAngle: vi.fn().mockReturnThis(),
        setDepth: vi.fn().mockReturnThis(),
        setTexture: vi.fn().mockReturnThis(),
        setData: vi.fn().mockReturnThis(),
        getData: vi.fn(() => undefined),
        setCollideWorldBounds: vi.fn().mockReturnThis(),
        setBounce: vi.fn().mockReturnThis(),
        setDragX: vi.fn().mockReturnThis(),
        setDisplaySize: vi.fn().mockReturnThis(),
        setSize: vi.fn().mockReturnThis(),
        setScrollFactor: vi.fn().mockReturnThis(),
        destroy: vi.fn(),
        on: vi.fn(), off: vi.fn(),
      });

      const makeGraphics = () => ({
        fillStyle: vi.fn().mockReturnThis(),
        fillRect: vi.fn().mockReturnThis(),
        fillRoundedRect: vi.fn().mockReturnThis(),
        fillCircle: vi.fn().mockReturnThis(),
        lineStyle: vi.fn().mockReturnThis(),
        strokeRoundedRect: vi.fn().mockReturnThis(),
        lineBetween: vi.fn().mockReturnThis(),
        strokeRect: vi.fn().mockReturnThis(),
        clear: vi.fn().mockReturnThis(),
        generateTexture: vi.fn(),
        setDepth: vi.fn().mockReturnThis(),
        setAlpha: vi.fn().mockReturnThis(),
        setVisible: vi.fn().mockReturnThis(),
        destroy: vi.fn(),
      });

      this.add = {
        text: vi.fn(() => ({
          setOrigin: vi.fn().mockReturnThis(), setInteractive: vi.fn().mockReturnThis(),
          setText: vi.fn().mockReturnThis(), setStyle: vi.fn().mockReturnThis(),
          setVisible: vi.fn().mockReturnThis(), setPosition: vi.fn().mockReturnThis(),
          setFlipX: vi.fn().mockReturnThis(), setTint: vi.fn().mockReturnThis(),
          clearTint: vi.fn().mockReturnThis(), setAlpha: vi.fn().mockReturnThis(),
          setScale: vi.fn().mockReturnThis(), setDepth: vi.fn().mockReturnThis(),
          destroy: vi.fn(), x: 0, y: 0, alpha: 1, active: true,
        })),
        rectangle: vi.fn(() => ({
          setStrokeStyle: vi.fn().mockReturnThis(), setInteractive: vi.fn().mockReturnThis(),
          setPosition: vi.fn().mockReturnThis(), setFillStyle: vi.fn().mockReturnThis(),
          setSize: vi.fn().mockReturnThis(), destroy: vi.fn(),
        })),
        graphics: vi.fn(makeGraphics),
        sprite: vi.fn((x?: number, y?: number) => makeSprite(x, y)),
        tileSprite: vi.fn(() => ({
          setOrigin: vi.fn().mockReturnThis(), setDepth: vi.fn().mockReturnThis(),
          setScrollFactor: vi.fn().mockReturnThis(), tilePositionX: 0, destroy: vi.fn(),
        })),
        ellipse: vi.fn(() => ({
          setDepth: vi.fn().mockReturnThis(), setScrollFactor: vi.fn().mockReturnThis(),
          setPosition: vi.fn().mockReturnThis(), destroy: vi.fn(),
        })),
        existing: vi.fn(),
        dom: vi.fn(() => ({ node: { value: '' } })),
        container: vi.fn(() => ({
          add: vi.fn().mockReturnThis(), setDepth: vi.fn().mockReturnThis(),
          setVisible: vi.fn().mockReturnThis(), destroy: vi.fn(), list: [],
        })),
        image: vi.fn(() => ({
          setOrigin: vi.fn().mockReturnThis(), setDepth: vi.fn().mockReturnThis(),
          setAlpha: vi.fn().mockReturnThis(), setVisible: vi.fn().mockReturnThis(),
          destroy: vi.fn(), x: 0, y: 0,
        })),
      };
      this.physics = {
        add: {
          sprite: vi.fn((x?: number, y?: number) => makeSprite(x, y)),
          existing: vi.fn(),
          collider: vi.fn(),
          overlap: vi.fn(),
        },
        world: {
          enable: vi.fn(), setBounds: vi.fn(),
          bounds: { x: 0, y: 0, width: 1024, height: 576 },
        },
      };
      this.cameras = {
        main: {
          width: 1024, height: 576, centerX: 512, centerY: 288,
          scrollX: 0, scrollY: 0,
          startFollow: vi.fn(), setBounds: vi.fn(), shake: vi.fn(),
        }
      };
      this.input = {
        keyboard: {
          createCursorKeys: vi.fn(() => ({
            left: { isDown: false }, right: { isDown: false },
            up: { isDown: false }, down: { isDown: false },
            space: { isDown: false }
          })),
          addKeys: vi.fn(() => ({})),
          addKey: vi.fn(() => ({ isDown: false })),
          on: vi.fn(), checkDown: vi.fn(),
        },
        on: vi.fn(),
      };
      this.events = { on: vi.fn(), emit: vi.fn(), off: vi.fn() };
      this.time = {
        delayedCall: vi.fn(() => ({ remove: vi.fn(), destroy: vi.fn() })),
        addEvent: vi.fn(() => ({ remove: vi.fn(), destroy: vi.fn() })),
        now: 0,
      };
      this.tweens = {
        add: vi.fn(() => ({ onComplete: vi.fn(), stop: vi.fn() })),
        killTweensOf: vi.fn(),
      };
      this.children = { list: [] };
      this.game = { loop: { delta: 16 } };
      this.sys = { game: { device: { os: {} } } };
      this.scene = { start: vi.fn(), stop: vi.fn(), launch: vi.fn(), isActive: vi.fn(() => false) };
      this.sound = {
        add: vi.fn(() => ({ play: vi.fn(), stop: vi.fn(), setVolume: vi.fn(), isPlaying: false })),
        play: vi.fn(),
      };
      this.data = { set: vi.fn(), get: vi.fn() };
      this.textures = {
        exists: vi.fn(() => false),
        get: vi.fn(() => ({ setFilter: vi.fn(), get: vi.fn(() => null) })),
        generate: vi.fn(),
      };
      this.anims = {
        generateFrameNumbers: vi.fn(() => []),
        create: vi.fn(),
        exists: vi.fn(() => false),
      };
    }
  },
  Math: {
    Distance: {
      Between: (x1: number, y1: number, x2: number, y2: number) =>
        Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
    },
    Clamp: (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))
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
      JustDown: vi.fn(() => false)
    }
  },
  Scale: {
    FIT: 'FIT',
    CENTER_BOTH: 'CENTER_BOTH'
  },
  Types: {
    Core: {
      GameConfig: {}
    },
    Input: {
      Keyboard: {
        CursorKeys: {}
      }
    },
    Physics: {
      Arcade: {
        Body: {}
      }
    }
  },
  AUTO: 'AUTO',
  Game: vi.fn()
} as any;

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};
global.localStorage = localStorageMock as any;

// Mock window
global.window = {
  ...global.window,
  localStorage: localStorageMock
} as any;

