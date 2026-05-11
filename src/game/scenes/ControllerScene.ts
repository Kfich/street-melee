import Phaser from 'phaser';
import { BaseMenuScene } from '../../ui/menu/BaseMenuScene';
import { MenuButton } from '../../ui/menu/MenuButton';
import { MenuSlider } from '../../ui/menu/MenuSlider';
import { getGamepadManager, ConnectedController } from '../../systems/input/GamepadManager';
import {
  ACTION_NAMES,
  ACTION_LABELS,
  ActionName,
  formatBinding,
} from '../../systems/input/GamepadProfiles';

/** Which player+action is currently awaiting a button press for remapping */
interface RemapState {
  playerIndex: number;
  action: ActionName;
  /** Don't accept input before this timestamp (prevents accidental instant trigger) */
  cooldownUntil: number;
}

// ── Layout constants ─────────────────────────────────────────────────────────

const COL = { P1: 0.28, P2: 0.72 }; // x-center as fraction of width
const FONT = '"Press Start 2P", "Courier New", monospace';

const ROW_H      = 22;  // px between binding rows
const ASSIGN_Y   = 62;  // top of controller-assignment section
const DIVIDER1_Y = 128; // between assignment and bindings
const HDR_Y      = 143; // column binding headers
const BIND_Y     = 162; // first binding row
const DIVIDER2_Y = BIND_Y + ACTION_NAMES.length * ROW_H + 8;
const DEADZONE_Y = DIVIDER2_Y + 42;
const BT_NOTE_Y  = DEADZONE_Y + 70;

// ── ControllerScene ───────────────────────────────────────────────────────────

export class ControllerScene extends BaseMenuScene {
  private remapState: RemapState | null = null;

  /** `"${playerIndex}-${action}"` → the text object showing that binding */
  private bindingTexts = new Map<string, Phaser.GameObjects.Text>();

  /** Controller-name display texts for each player */
  private ctrlNameTexts: [Phaser.GameObjects.Text | null, Phaser.GameObjects.Text | null] = [null, null];

  /** Status bar at the top showing remap instructions */
  private statusText: Phaser.GameObjects.Text | null = null;

  private deadzoneSlider?: MenuSlider;
  private mainButtons: MenuButton[] = [];

  private onConnected: (ctrl: ConnectedController) => void;
  private onDisconnected: (idx: number) => void;

  constructor() {
    super('ControllerScene');
    // Bound once so we can remove them later
    this.onConnected    = () => { this.refreshControllerDisplay(); };
    this.onDisconnected = () => { this.refreshControllerDisplay(); };
  }

  // ── Lifecycle ────────────────────────────────────────────────────────────────

  protected createMenu(): void {
    const { width, height } = this.cameras.main;
    const gfx = this.add.graphics().setDepth(1001);

    this.drawTitle(width);
    gfx.lineStyle(1, 0x333355, 1).lineBetween(40, 44, width - 40, 44);

    this.createAssignmentSection(width, 0);
    this.createAssignmentSection(width, 1);

    gfx.lineStyle(1, 0x333355, 1).lineBetween(width / 2, ASSIGN_Y - 8, width / 2, DIVIDER1_Y - 4);
    gfx.lineStyle(1, 0x333355, 1).lineBetween(40, DIVIDER1_Y, width - 40, DIVIDER1_Y);

    this.drawBindingHeaders(width);
    this.drawBindingRows(width);

    gfx.lineStyle(1, 0x333355, 1).lineBetween(40, DIVIDER2_Y, width - 40, DIVIDER2_Y);

    this.createDeadzoneSlider(width);
    this.drawBluetoothNote(width);
    this.createButtons(width, height);

    this.statusText = this.add.text(width / 2, 14, '', {
      fontSize: '7px', fontFamily: FONT, color: '#ffff00',
    }).setOrigin(0.5).setDepth(1002);

    // ESC: cancel remap, or leave scene
    this.input.keyboard?.on('keydown-ESC', () => {
      if (this.remapState) {
        this.cancelRemap();
      } else {
        this.scene.start('MainMenuScene');
      }
    });

    // Hotplug callbacks
    const gm = getGamepadManager();
    gm.onControllerConnected(this.onConnected);
    gm.onControllerDisconnected(this.onDisconnected);
  }

  update(): void {
    super.update();
    this.pollRemapInput();
  }

  shutdown(): void {
    const gm = getGamepadManager();
    gm.removeControllerConnectedListener(this.onConnected);
    gm.removeControllerDisconnectedListener(this.onDisconnected);

    this.deadzoneSlider?.destroy();
    this.mainButtons.forEach(b => b.destroy());
  }

  protected playMenuMusic(): void {
    // Keep whatever music is already playing
  }

  // ── Remap polling ────────────────────────────────────────────────────────────

  private pollRemapInput(): void {
    if (!this.remapState) return;
    if (this.time.now < this.remapState.cooldownUntil) return;

    const btn = getGamepadManager().readFirstPressedButton(this.remapState.playerIndex);
    if (btn !== null) {
      this.applyRemap(this.remapState.playerIndex, this.remapState.action, btn);
    }
  }

  private applyRemap(playerIndex: number, action: ActionName, button: number): void {
    getGamepadManager().setActionBinding(playerIndex, action, button);
    this.remapState = null;
    this.updateBindingDisplay(playerIndex);
    this.statusText?.setText('');
  }

  private cancelRemap(): void {
    if (!this.remapState) return;
    const { playerIndex, action } = this.remapState;
    this.remapState = null;
    this.restoreBindingText(playerIndex, action);
    this.statusText?.setText('');
  }

  // ── Controller assignment ─────────────────────────────────────────────────────

  private cycleGamepad(playerIndex: number, direction: 1 | -1): void {
    const gm = getGamepadManager();
    const controllers = gm.getConnectedControllers();
    if (controllers.length === 0) return;

    // Options: each connected gamepad index, plus -1 for "None"
    const options = [...controllers.map(c => c.index), -1];
    const current = gm.getPlayerController(playerIndex);
    const currentPos = current
      ? options.indexOf(current.index)
      : options.indexOf(-1);

    const nextPos = (currentPos + direction + options.length) % options.length;
    const next = options[nextPos];

    if (next === -1) {
      gm.unassignPlayer(playerIndex);
    } else {
      gm.assignGamepadToPlayer(next, playerIndex);
    }

    this.refreshControllerDisplay();
    this.updateBindingDisplay(playerIndex);
  }

  // ── UI construction ──────────────────────────────────────────────────────────

  private drawTitle(width: number): void {
    const title = this.add.text(width / 2, 24, 'CONTROLLERS', {
      fontSize: '22px', fontFamily: FONT, color: '#ffff00',
      stroke: '#000000', strokeThickness: 6, fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(1002).setAlpha(0);

    this.tweens.add({ targets: title, alpha: 1, duration: 300, ease: 'Power2' });
  }

  private createAssignmentSection(width: number, playerIndex: number): void {
    const x = width * (playerIndex === 0 ? COL.P1 : COL.P2);
    const gm = getGamepadManager();

    // Player header
    this.add.text(x, ASSIGN_Y, `PLAYER ${playerIndex + 1}`, {
      fontSize: '11px', fontFamily: FONT, color: '#ffff00',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(1001);

    // Controller name (updated on hotplug)
    const ctrl = gm.getPlayerController(playerIndex);
    const nameText = this.add.text(x, ASSIGN_Y + 24, this.formatControllerName(ctrl), {
      fontSize: '8px', fontFamily: FONT, color: '#ffffff',
    }).setOrigin(0.5).setDepth(1001);
    this.ctrlNameTexts[playerIndex] = nameText;

    // PREV arrow
    const prevTxt = this.add.text(x - 64, ASSIGN_Y + 50, '\u25c4 PREV', {
      fontSize: '8px', fontFamily: FONT, color: '#00ffff',
    }).setOrigin(0.5).setDepth(1001)
      .setInteractive({ useHandCursor: true });
    prevTxt.on('pointerover', () => prevTxt.setColor('#ffff00'));
    prevTxt.on('pointerout',  () => prevTxt.setColor('#00ffff'));
    prevTxt.on('pointerdown', () => this.cycleGamepad(playerIndex, -1));

    // NEXT arrow
    const nextTxt = this.add.text(x + 64, ASSIGN_Y + 50, 'NEXT \u25ba', {
      fontSize: '8px', fontFamily: FONT, color: '#00ffff',
    }).setOrigin(0.5).setDepth(1001)
      .setInteractive({ useHandCursor: true });
    nextTxt.on('pointerover', () => nextTxt.setColor('#ffff00'));
    nextTxt.on('pointerout',  () => nextTxt.setColor('#00ffff'));
    nextTxt.on('pointerdown', () => this.cycleGamepad(playerIndex, 1));
  }

  private drawBindingHeaders(width: number): void {
    const hStyle = { fontSize: '9px', fontFamily: FONT, color: '#888899' };
    this.add.text(width * COL.P1, HDR_Y, 'PLAYER 1 BINDINGS  (CLICK TO REMAP)', hStyle)
      .setOrigin(0.5).setDepth(1001);
    this.add.text(width * COL.P2, HDR_Y, 'PLAYER 2 BINDINGS  (CLICK TO REMAP)', hStyle)
      .setOrigin(0.5).setDepth(1001);
  }

  private drawBindingRows(width: number): void {
    const gm = getGamepadManager();

    ACTION_NAMES.forEach((action, i) => {
      const y = BIND_Y + i * ROW_H;
      const label = ACTION_LABELS[action];

      [0, 1].forEach(playerIndex => {
        const colX = width * (playerIndex === 0 ? COL.P1 : COL.P2);
        const labelX = colX - 6;
        const valueX = colX + 6;

        // Action label (static)
        this.add.text(labelX, y, `${label}:`, {
          fontSize: '8px', fontFamily: FONT, color: '#888899',
        }).setOrigin(1, 0.5).setDepth(1001);

        // Binding value (interactive, updates on remap)
        const ctrl = gm.getPlayerController(playerIndex);
        const ctrlType = ctrl?.profile.type ?? 'xbox';
        const mapping  = gm.getEffectiveMapping(playerIndex);
        const bindStr  = formatBinding(mapping[action], ctrlType);

        const valueTxt = this.add.text(valueX, y, bindStr, {
          fontSize: '8px', fontFamily: FONT, color: '#ffffff',
        }).setOrigin(0, 0.5).setDepth(1001)
          .setInteractive({ useHandCursor: true });

        valueTxt.on('pointerover', () => {
          if (!this.remapState) valueTxt.setColor('#00ffff');
        });
        valueTxt.on('pointerout', () => {
          if (!this.remapState) valueTxt.setColor('#ffffff');
        });
        valueTxt.on('pointerdown', () => {
          if (!this.remapState) this.startRemap(playerIndex, action);
        });

        this.bindingTexts.set(`${playerIndex}-${action}`, valueTxt);
      });
    });
  }

  private createDeadzoneSlider(width: number): void {
    const gm = getGamepadManager();
    this.deadzoneSlider = new MenuSlider(
      this,
      width / 2,
      DEADZONE_Y,
      'DEADZONE',
      this.theme,
      gm.getDeadzone(),
      0.05,
      0.50,
      (value) => gm.setDeadzone(value)
    );
  }

  private drawBluetoothNote(width: number): void {
    this.add.text(width / 2, BT_NOTE_Y,
      'BLUETOOTH: PAIR YOUR CONTROLLER VIA OS SETTINGS',
      { fontSize: '7px', fontFamily: FONT, color: '#444466' }
    ).setOrigin(0.5).setDepth(1001);

    this.add.text(width / 2, BT_NOTE_Y + 16,
      'IT WILL APPEAR HERE AUTOMATICALLY WHEN CONNECTED',
      { fontSize: '7px', fontFamily: FONT, color: '#444466' }
    ).setOrigin(0.5).setDepth(1001);
  }

  private createButtons(width: number, height: number): void {
    const resetBtn = new MenuButton(
      this, width * 0.28, height - 56,
      'RESET DEFAULTS', this.theme,
      () => {
        getGamepadManager().resetMappings();
        this.updateAllBindingDisplays();
      }
    );

    const backBtn = new MenuButton(
      this, width * 0.72, height - 56,
      'BACK (ESC)', this.theme,
      () => this.scene.start('MainMenuScene')
    );

    this.mainButtons.push(resetBtn, backBtn);
  }

  // ── Remap state ──────────────────────────────────────────────────────────────

  private startRemap(playerIndex: number, action: ActionName): void {
    this.remapState = {
      playerIndex,
      action,
      cooldownUntil: this.time.now + 350, // debounce window
    };

    const key = `${playerIndex}-${action}`;
    this.bindingTexts.get(key)?.setText('PRESS BTN...');
    this.bindingTexts.get(key)?.setColor('#ffff00');

    const playerLabel = `PLAYER ${playerIndex + 1}`;
    this.statusText?.setText(
      `REMAPPING ${playerLabel}: ${ACTION_LABELS[action]}  |  ESC TO CANCEL`
    );
  }

  private restoreBindingText(playerIndex: number, action: ActionName): void {
    const gm = getGamepadManager();
    const ctrl = gm.getPlayerController(playerIndex);
    const ctrlType = ctrl?.profile.type ?? 'xbox';
    const mapping  = gm.getEffectiveMapping(playerIndex);
    const bindStr  = formatBinding(mapping[action], ctrlType);

    const key = `${playerIndex}-${action}`;
    this.bindingTexts.get(key)?.setText(bindStr);
    this.bindingTexts.get(key)?.setColor('#ffffff');
  }

  // ── Display refresh ──────────────────────────────────────────────────────────

  private refreshControllerDisplay(): void {
    const gm = getGamepadManager();
    [0, 1].forEach(p => {
      const ctrl = gm.getPlayerController(p);
      this.ctrlNameTexts[p]?.setText(this.formatControllerName(ctrl));
    });
  }

  private updateBindingDisplay(playerIndex: number): void {
    const gm = getGamepadManager();
    const ctrl = gm.getPlayerController(playerIndex);
    const ctrlType = ctrl?.profile.type ?? 'xbox';
    const mapping  = gm.getEffectiveMapping(playerIndex);

    ACTION_NAMES.forEach(action => {
      const key = `${playerIndex}-${action}`;
      const txt = this.bindingTexts.get(key);
      if (txt) {
        txt.setText(formatBinding(mapping[action], ctrlType));
        txt.setColor('#ffffff');
      }
    });
  }

  private updateAllBindingDisplays(): void {
    [0, 1].forEach(p => this.updateBindingDisplay(p));
  }

  // ── Helpers ───────────────────────────────────────────────────────────────────

  private formatControllerName(ctrl: ConnectedController | null): string {
    if (!ctrl) return 'NOT CONNECTED';
    const name = `${ctrl.profile.displayName} #${ctrl.index}`;
    return name.toUpperCase().substring(0, 22);
  }
}
