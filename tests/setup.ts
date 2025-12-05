import { vi } from 'vitest';

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
      this.add = {
        text: vi.fn(() => ({ setOrigin: vi.fn(), setInteractive: vi.fn(), setText: vi.fn(), setStyle: vi.fn(), setVisible: vi.fn(), setPosition: vi.fn(), setFlipX: vi.fn(), setTint: vi.fn(), clearTint: vi.fn(), setAlpha: vi.fn(), setScale: vi.fn(), destroy: vi.fn() })),
        rectangle: vi.fn(() => ({ setStrokeStyle: vi.fn(), setInteractive: vi.fn(), setPosition: vi.fn(), setFillStyle: vi.fn(), setSize: vi.fn(), destroy: vi.fn() })),
        graphics: vi.fn(() => ({ fillStyle: vi.fn().mockReturnThis(), fillRect: vi.fn().mockReturnThis(), generateTexture: vi.fn(), clear: vi.fn(), fillCircle: vi.fn().mockReturnThis(), lineStyle: vi.fn().mockReturnThis(), lineBetween: vi.fn().mockReturnThis(), destroy: vi.fn() })),
        sprite: vi.fn(),
        tileSprite: vi.fn(() => ({ setOrigin: vi.fn(), setDepth: vi.fn(), setScrollFactor: vi.fn(), tilePositionX: 0, destroy: vi.fn() })),
        ellipse: vi.fn(() => ({ setDepth: vi.fn(), setScrollFactor: vi.fn(), setPosition: vi.fn(), destroy: vi.fn() })),
        dom: vi.fn(() => ({ node: { value: '' } }))
      };
      this.physics = {
        add: {
          sprite: vi.fn(() => ({
            setCollideWorldBounds: vi.fn(),
            setBounce: vi.fn(),
            setDragX: vi.fn(),
            setVelocityX: vi.fn(),
            setVelocityY: vi.fn(),
            setVelocity: vi.fn(),
            setFlipX: vi.fn(),
            setTexture: vi.fn(),
            setTint: vi.fn(),
            setPosition: vi.fn(),
            setDisplaySize: vi.fn(),
            setSize: vi.fn(),
            setData: vi.fn(),
            getData: vi.fn(),
            body: { velocity: { x: 0, y: 0 }, touching: { down: false }, setSize: vi.fn(), setAllowGravity: vi.fn(), setVelocity: vi.fn() },
            flipX: false,
            x: 0,
            y: 0,
            active: true,
            depth: 0,
            destroy: vi.fn()
          })),
          existing: vi.fn(),
          collider: vi.fn()
        }
      };
      this.cameras = {
        main: {
          width: 1024,
          height: 576,
          centerX: 512,
          centerY: 288,
          scrollX: 0,
          startFollow: vi.fn(),
          setBounds: vi.fn(),
          shake: vi.fn()
        }
      };
      this.input = {
        keyboard: {
          createCursorKeys: vi.fn(() => ({
            left: { isDown: false },
            right: { isDown: false },
            up: { isDown: false },
            down: { isDown: false },
            space: { isDown: false }
          })),
          addKeys: vi.fn(),
          addKey: vi.fn(() => ({ isDown: false })),
          on: vi.fn(),
          checkDown: vi.fn()
        }
      };
      this.events = {
        on: vi.fn(),
        emit: vi.fn(),
        off: vi.fn()
      };
      this.time = {
        delayedCall: vi.fn((delay, callback) => {
          setTimeout(callback, delay);
          return { destroy: vi.fn() };
        }),
        addEvent: vi.fn()
      };
      this.tweens = {
        add: vi.fn(() => ({ onComplete: vi.fn() }))
      };
      this.children = {
        list: []
      };
      this.sound = {
        add: vi.fn(() => ({ play: vi.fn(), stop: vi.fn(), setVolume: vi.fn() }))
      };
      this.data = {
        set: vi.fn(),
        get: vi.fn()
      };
      this.textures = {
        exists: vi.fn(() => false),
        generate: vi.fn()
      };
      this.anims = {
        generateFrameNumbers: vi.fn(() => []),
        create: vi.fn(),
        exists: vi.fn(() => false)
      };
    }
  },
  Math: {
    Distance: {
      Between: vi.fn(() => 0)
    },
    Clamp: vi.fn((value, min, max) => Math.max(min, Math.min(max, value)))
  },
  Geom: {
    Rectangle: {
      Overlaps: vi.fn(() => false)
    }
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

