import Phaser from 'phaser';
import { globalTouchState, TouchState } from '../../systems/input/TouchInputState';

/**
 * Overlay scene that renders on-screen touch controls for mobile gameplay.
 * Launched by GameScene when a touch-capable device is detected.
 * Writes directional and action state into globalTouchState, which
 * InputManager merges with keyboard state every frame.
 */
export class MobileControlsScene extends Phaser.Scene {
  // Maps Phaser pointer ID → is this pointer controlling the D-pad?
  private dpadPointers: Map<number, boolean> = new Map();
  // Maps Phaser pointer ID → which action button it is pressing
  private btnPointers: Map<number, keyof TouchState> = new Map();

  private thumbGraphics?: Phaser.GameObjects.Graphics;
  private dpadCX: number = 0;
  private dpadCY: number = 0;
  private dpadOuterRadius: number = 0;

  // Per-button visual drawers (normal / active states)
  private btnDrawers: Map<keyof TouchState, { normal: () => void; active: () => void }> = new Map();

  // Stored handler references so shutdown() can remove them precisely
  private _onPointerMove?: (pointer: Phaser.Input.Pointer) => void;
  private _onPointerUp?: (pointer: Phaser.Input.Pointer) => void;

  constructor() {
    super({ key: 'MobileControlsScene' });
  }

  create() {
    // Only create controls on touch-capable devices
    if (!this.sys.game.device.input.touch) return;

    const { width, height } = this.cameras.main;

    // ── D-pad (lower-left) ─────────────────────────────────────────────────
    this.dpadCX = width * 0.14;
    this.dpadCY = height * 0.72;
    // Scale radius relative to screen dimensions so it fits phones and tablets
    this.dpadOuterRadius = Math.min(width * 0.115, height * 0.22);

    this.createDPad(this.dpadCX, this.dpadCY, this.dpadOuterRadius);

    // ── Action buttons (lower-right) ───────────────────────────────────────
    const btnCX = width * 0.86;
    const btnCY = height * 0.72;
    const btnRadius = Math.min(width * 0.052, height * 0.092);

    this.createActionButtons(btnCX, btnCY, btnRadius);

    // ── Global pointer handlers (track drags outside zones) ────────────────
    this.setupGlobalPointerEvents();
  }

  // ── D-pad ───────────────────────────────────────────────────────────────

  private createDPad(cx: number, cy: number, outerRadius: number) {
    // Background circle
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.22);
    bg.fillCircle(cx, cy, outerRadius);
    bg.lineStyle(1.5, 0x888888, 0.35);
    bg.strokeCircle(cx, cy, outerRadius);

    // Cardinal-direction arrow labels (visual guide only)
    const arrowDist = outerRadius * 0.66;
    const arrowFontSize = Math.round(outerRadius * 0.52);
    const arrowData = [
      { dx: -arrowDist, dy: 0, sym: '◄' },
      { dx: arrowDist,  dy: 0, sym: '►' },
      { dx: 0, dy: -arrowDist, sym: '▲' },
      { dx: 0, dy:  arrowDist, sym: '▼' },
    ];
    arrowData.forEach(({ dx, dy, sym }) => {
      this.add.text(cx + dx, cy + dy, sym, {
        fontSize: `${arrowFontSize}px`,
        color: '#aaaaaa',
        fontStyle: 'bold',
        fontFamily: 'Arial, sans-serif',
      }).setOrigin(0.5).setAlpha(0.65);
    });

    // Center nub (thumb indicator)
    this.thumbGraphics = this.add.graphics();
    this.drawThumb(cx, cy, false);

    // Single large circular interactive zone — direction is derived from
    // pointer position relative to the D-pad center.
    const zoneSize = outerRadius * 2.4;
    const zone = this.add.zone(cx, cy, zoneSize, zoneSize);
    zone.setInteractive(
      new Phaser.Geom.Circle(0, 0, zoneSize / 2),
      Phaser.Geom.Circle.Contains
    );

    zone.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.dpadPointers.set(pointer.id, true);
      this.updateDpad(pointer.x, pointer.y);
    });
    // pointermove on the zone handles in-zone drags; global handler covers out-of-zone
    zone.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.dpadPointers.has(pointer.id) && pointer.isDown) {
        this.updateDpad(pointer.x, pointer.y);
      }
    });
  }

  private drawThumb(x: number, y: number, active: boolean) {
    if (!this.thumbGraphics) return;
    this.thumbGraphics.clear();
    if (active) {
      this.thumbGraphics.fillStyle(0x5599ff, 0.75);
      this.thumbGraphics.fillCircle(x, y, 20);
      this.thumbGraphics.lineStyle(2, 0x99ccff, 0.9);
      this.thumbGraphics.strokeCircle(x, y, 20);
    } else {
      this.thumbGraphics.fillStyle(0x555555, 0.55);
      this.thumbGraphics.fillCircle(x, y, 15);
    }
  }

  private updateDpad(px: number, py: number) {
    const dx = px - this.dpadCX;
    const dy = py - this.dpadCY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const deadzone = 14;

    if (dist < deadzone) {
      globalTouchState.left = false;
      globalTouchState.right = false;
      globalTouchState.up = false;
      globalTouchState.down = false;
      this.drawThumb(this.dpadCX, this.dpadCY, false);
      return;
    }

    const adx = Math.abs(dx);
    const ady = Math.abs(dy);

    // Allow diagonal input (both horizontal and vertical simultaneously)
    globalTouchState.left  = dx < -deadzone && adx > ady * 0.4;
    globalTouchState.right = dx >  deadzone && adx > ady * 0.4;
    globalTouchState.up    = dy < -deadzone && ady > adx * 0.4;
    globalTouchState.down  = dy >  deadzone && ady > adx * 0.4;

    // Move thumb indicator (clamped within the outer ring)
    const clampedDist = Math.min(dist, this.dpadOuterRadius * 0.72);
    const thumbX = this.dpadCX + (dx / dist) * clampedDist;
    const thumbY = this.dpadCY + (dy / dist) * clampedDist;
    this.drawThumb(thumbX, thumbY, true);
  }

  private releaseDpad() {
    globalTouchState.left = false;
    globalTouchState.right = false;
    globalTouchState.up = false;
    globalTouchState.down = false;
    this.drawThumb(this.dpadCX, this.dpadCY, false);
  }

  // ── Action buttons ──────────────────────────────────────────────────────

  private createActionButtons(cx: number, cy: number, btnRadius: number) {
    // Standard fighting-game button layout:
    //  JUMP (top-left) · SPECIAL (top-right)
    //        ATK (center, larger)
    const jmpR = btnRadius;
    const atkR = btnRadius * 1.25;
    const spcR = btnRadius;
    const spread = btnRadius * 1.85;
    const rise   = btnRadius * 1.05;

    this.createBtn(cx - spread, cy - rise, jmpR, 'JUMP', 'jump', 0x2255dd);
    this.createBtn(cx,          cy,        atkR, 'ATK',  'attack', 0xcc2222);
    this.createBtn(cx + spread, cy - rise, spcR, 'SPC',  'special', 0xddaa00);
  }

  private createBtn(
    x: number, y: number, radius: number,
    label: string, action: keyof TouchState, color: number
  ) {
    const gfx = this.add.graphics();

    const drawNormal = () => {
      gfx.clear();
      gfx.fillStyle(color, 0.45);
      gfx.fillCircle(x, y, radius);
      gfx.lineStyle(2.5, color, 0.75);
      gfx.strokeCircle(x, y, radius);
    };

    const drawActive = () => {
      gfx.clear();
      gfx.fillStyle(color, 0.92);
      gfx.fillCircle(x, y, radius);
      gfx.lineStyle(3, 0xffffff, 1.0);
      gfx.strokeCircle(x, y, radius);
    };

    drawNormal();
    this.btnDrawers.set(action, { normal: drawNormal, active: drawActive });

    const fontSize = Math.max(Math.round(radius * 0.44), 9);
    this.add.text(x, y, label, {
      fontSize: `${fontSize}px`,
      color: '#ffffff',
      fontStyle: 'bold',
      fontFamily: 'Arial, sans-serif',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5);

    // Circular interactive zone (slightly larger than visual for easier tapping)
    const hitR = radius * 1.15;
    const zone = this.add.zone(x, y, hitR * 2, hitR * 2);
    zone.setInteractive(
      new Phaser.Geom.Circle(0, 0, hitR),
      Phaser.Geom.Circle.Contains
    );

    zone.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.btnPointers.set(pointer.id, action);
      globalTouchState[action] = true;
      drawActive();
    });

    zone.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      this.releaseButton(pointer.id, action, drawNormal);
    });

    zone.on('pointerout', (pointer: Phaser.Input.Pointer) => {
      // Release when finger slides off so the button doesn't stay "stuck"
      this.releaseButton(pointer.id, action, drawNormal);
    });
  }

  private releaseButton(
    pointerId: number,
    action: keyof TouchState,
    drawNormal: () => void
  ) {
    if (!this.btnPointers.has(pointerId)) return;
    this.btnPointers.delete(pointerId);
    // Only clear state if no other pointer is still pressing this action
    const stillHeld = [...this.btnPointers.values()].includes(action);
    if (!stillHeld) {
      globalTouchState[action] = false;
      drawNormal();
    }
  }

  // ── Global pointer event handlers ────────────────────────────────────────

  private setupGlobalPointerEvents() {
    // Store handler references so shutdown() can remove exactly these listeners
    this._onPointerMove = (pointer: Phaser.Input.Pointer) => {
      if (this.dpadPointers.has(pointer.id) && pointer.isDown) {
        this.updateDpad(pointer.x, pointer.y);
      }
    };

    this._onPointerUp = (pointer: Phaser.Input.Pointer) => {
      if (this.dpadPointers.has(pointer.id)) {
        this.dpadPointers.delete(pointer.id);
        if (this.dpadPointers.size === 0) {
          this.releaseDpad();
        }
      }

      const action = this.btnPointers.get(pointer.id);
      if (action !== undefined) {
        const drawer = this.btnDrawers.get(action);
        this.releaseButton(pointer.id, action, drawer?.normal ?? (() => {}));
      }
    };

    // Track D-pad when the finger moves outside the zone
    this.input.on('pointermove', this._onPointerMove);
    // Unified pointerup — covers finger lifts anywhere on screen
    this.input.on('pointerup', this._onPointerUp);
  }

  // ── Lifecycle ────────────────────────────────────────────────────────────

  shutdown() {
    // Remove global pointer handlers — must be done explicitly to prevent listener
    // accumulation on scene restart (each launch() → create() adds a new pair).
    if (this._onPointerMove) {
      this.input.off('pointermove', this._onPointerMove);
      this._onPointerMove = undefined;
    }
    if (this._onPointerUp) {
      this.input.off('pointerup', this._onPointerUp);
      this._onPointerUp = undefined;
    }

    // Reset all touch state so no phantom inputs linger after scene stops
    (Object.keys(globalTouchState) as Array<keyof TouchState>).forEach(key => {
      globalTouchState[key] = false;
    });
    this.dpadPointers.clear();
    this.btnPointers.clear();
    this.btnDrawers.clear();
  }
}
