import { BaseMenuScene } from '../../ui/menu/BaseMenuScene';
import { MenuButton } from '../../ui/menu/MenuButton';
import { CharacterSelectBox } from '../../ui/menu/CharacterSelectBox';
import { CharacterType } from '../types/CharacterType';
import { CharacterPreviewPanel } from '../../ui/menu/CharacterPreviewPanel';
import { MusicContext } from '../../systems/audio/MusicState';
// CharacterData used via CharacterPreviewPanel internally

export class CharacterSelectScene extends BaseMenuScene {
  private selectedCharacters: (CharacterType | null)[] = [null, null];
  private currentPlayer: number = 0;
  private isMultiplayer: boolean = false;
  private roomId?: string;
  private characterBoxes: CharacterSelectBox[] = [];
  private startButton?: MenuButton;
  private previewPanel?: CharacterPreviewPanel;
  private selectedIndex: number = 0;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;

  constructor() {
    super('CharacterSelectScene');
  }

  protected playMenuMusic(): void {
    // Crossfade from main-menu chiptune into the slightly busier character-
    // select loop so the screen feels distinct from the title.
    this.time.delayedCall(100, () => {
      if (this.audioManager) {
        this.audioManager.playMusicWithContext(
          'menu_character_select',
          MusicContext.CHARACTER_SELECT,
          true
        );
      }
    });
  }

  init(data: { isMultiplayer?: boolean; roomId?: string }) {
    // Reset character selections when scene is initialized
    this.selectedCharacters = [null, null];
    this.currentPlayer = 0;
    this.selectedIndex = 0;
    
    this.isMultiplayer = data.isMultiplayer || false;
    this.roomId = data.roomId;
  }

  protected createMenu() {
    const { width, height } = this.cameras.main;

    // Title
    const titleText = this.isMultiplayer ? 'SELECT YOUR CHARACTER' : 'SELECT CHARACTER';
    this.add.text(width / 2, 38, titleText, {
      fontSize: '30px',
      fontFamily: this.theme.typography.titleFont,
      color: `#${this.theme.colors.text.toString(16).padStart(6, '0')}`,
      stroke: '#000000',
      strokeThickness: this.theme.typography.titleStroke,
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(1001);

    // Player indicator
    this.add.text(
      width / 2, 90,
      'PLAYER 1',
      {
        fontSize: '16px',
        fontFamily: this.theme.typography.itemFont,
        color: `#${this.theme.colors.selected.toString(16).padStart(6, '0')}`,
        fontStyle: 'bold',
      }
    ).setOrigin(0.5).setDepth(1001);

    // ── Character select cards ─────────────────────────────────────────────
    // Cards are scaled down to 0.65 to free vertical space for the preview panel.
    const characters: CharacterType[] = ['axel', 'blaze', 'max', 'sammy'];
    const CARD_SCALE = 0.65;
    const boxSpacing = 158; // centres spaced so scaled edges don't touch
    const startX = width / 2 - ((characters.length - 1) * boxSpacing) / 2;

    // Card centre y: keep same logic as before, now leaves bottom at ~396
    const playerTextBottom = 90 + 16;
    const cardTop = playerTextBottom + 36;
    const cardY = cardTop + 144; // 144 = half the native 288 card height

    characters.forEach((char, index) => {
      const x = startX + index * boxSpacing;
      const box = new CharacterSelectBox(
        this, x, cardY, char, this.theme,
        () => this.selectCharacter(char),
        () => { this.selectedIndex = index; this.updateSelection(); }
      );
      // Scale the whole card down so we gain ~110px below for the preview panel
      box.getContainer().setScale(CARD_SCALE);
      box.setBaseScale(CARD_SCALE); // keep tween targets relative to this base
      this.characterBoxes.push(box);
    });

    // ── Character preview panel ────────────────────────────────────────────
    // Sits in the space between card bottoms (~396) and instructions (~548).
    // Panel centre is halfway through that gap.
    const previewPanelY = Math.round(cardY + 144 * CARD_SCALE + 10 + 52);
    this.previewPanel = new CharacterPreviewPanel(
      this, width / 2, previewPanelY, this.theme
    );

    // Initialise preview with the first character
    this.updateDescription(0);

    // ── Start button (multiplayer only) ───────────────────────────────────
    this.startButton = new MenuButton(
      this, width / 2, height - 58,
      'PRESS ENTER TO START', this.theme,
      () => this.startGame()
    );
    this.startButton.setVisible(false);

    // Keyboard navigation
    this.cursors = this.input.keyboard?.createCursorKeys();
    this.input.keyboard?.on('keydown-ENTER', () => {
      if (this.canStartGame()) {
        this.startGame();
      } else {
        this.selectCharacter(characters[this.selectedIndex]);
      }
    });

    // Instructions
    this.add.text(width / 2, height - 30, 'Arrow Keys: Navigate | Enter: Select', {
      fontSize: '10px',
      fontFamily: this.theme.typography.labelFont,
      color: `#${this.theme.colors.textSecondary.toString(16).padStart(6, '0')}`,
    }).setOrigin(0.5).setDepth(1001);
  }

  update() {
    super.update();
    if (!this.cursors) return;

    if (Phaser.Input.Keyboard.JustDown(this.cursors.left!)) {
      this.selectedIndex = (this.selectedIndex - 1 + this.characterBoxes.length) % this.characterBoxes.length;
      this.updateSelection();
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.right!)) {
      this.selectedIndex = (this.selectedIndex + 1) % this.characterBoxes.length;
      this.updateSelection();
    }
  }

  private updateSelection() {
    this.characterBoxes.forEach((box, index) => {
      box.setSelected(index === this.selectedIndex);
    });
    this.updateDescription(this.selectedIndex);
    
    // Play navigation sound (quieter than selection)
    if (this.audioManager) {
      this.audioManager.playSound('menuSelect', 0.2);
    }
  }

  private updateDescription(index: number) {
    if (index < 0 || index >= this.characterBoxes.length) return;
    const characterType = this.characterBoxes[index].getCharacterType();
    this.previewPanel?.updateCharacter(characterType);
    this.audioManager?.playSound('menuSelect', 0.3);
  }

  selectCharacter(character: CharacterType) {
    console.log(`CharacterSelectScene: Player ${this.currentPlayer + 1} selected ${character}`);
    this.selectedCharacters[this.currentPlayer] = character;

    // Update visual selection
    this.characterBoxes.forEach((box, index) => {
      const char = ['axel', 'blaze', 'max', 'sammy'][index];
      const isSelected = char === character;
      box.setSelected(isSelected);
      if (isSelected) {
        this.selectedIndex = index;
        this.updateDescription(index);
      }
    });

    // Confirm sting — sits on top of the navigation tone so the selection
    // moment feels weighty without interrupting the character-select loop.
    if (this.audioManager) {
      this.audioManager.playSting('sting_menu_confirm');
    }

    // Single player or network multiplayer: start immediately after local selection
    if (!this.isMultiplayer || this.currentPlayer === 0) {
      if (this.isMultiplayer) {
        // Network multiplayer: P2's character comes from the remote state — no
        // need to pick it locally.  Show START button instead.
        if (this.startButton) {
          this.startButton.setVisible(true);
        }
      } else {
        this.startGame();
      }
      return;
    }

    // Local co-op (isMultiplayer === false is already handled above, so this
    // branch is only reached in a future local-co-op mode, kept for safety)
    if (this.startButton) {
      this.startButton.setVisible(true);
    }
  }

  /**
   * Check if game can be started
   */
  private canStartGame(): boolean {
    // Both single-player and network multiplayer only need the local player's
    // character selection.  P2's character arrives via network state updates.
    return this.selectedCharacters[0] !== null;
  }

  startGame() {
    console.log('CharacterSelectScene: Starting game with characters:', this.selectedCharacters);

    if (!this.canStartGame()) {
      console.error('CharacterSelectScene: Cannot start - required characters not selected!');
      return;
    }

    const player1Character = this.selectedCharacters[0]!;
    const player2Character = this.isMultiplayer ? this.selectedCharacters[1]! : null;

    this.scene.start('GameScene', {
      player1Character: player1Character,
      player2Character: player2Character,
      isMultiplayer: this.isMultiplayer,
      roomId: this.roomId,
    });
  }

  shutdown() {
    this.characterBoxes.forEach((box) => box.destroy());
    this.startButton?.destroy();
    this.previewPanel?.destroy();
  }
}

