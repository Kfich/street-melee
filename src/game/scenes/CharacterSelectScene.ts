import { BaseMenuScene } from '../../ui/menu/BaseMenuScene';
import { MenuButton } from '../../ui/menu/MenuButton';
import { CharacterSelectBox } from '../../ui/menu/CharacterSelectBox';
import { CharacterType } from '../types/CharacterType';

export class CharacterSelectScene extends BaseMenuScene {
  private selectedCharacters: (CharacterType | null)[] = [null, null];
  private currentPlayer: number = 0;
  private isMultiplayer: boolean = false;
  private roomId?: string;
  private characterBoxes: CharacterSelectBox[] = [];
  private playerText?: Phaser.GameObjects.Text;
  private startButton?: MenuButton;

  constructor() {
    super('CharacterSelectScene');
  }

  init(data: { isMultiplayer?: boolean; roomId?: string }) {
    this.isMultiplayer = data.isMultiplayer || false;
    this.roomId = data.roomId;
  }

  protected createMenu() {
    const { width, height } = this.cameras.main;

    // Title
    const titleText = this.isMultiplayer ? 'SELECT CHARACTERS' : 'SELECT CHARACTER';
    const title = this.add.text(width / 2, 60, titleText, {
      fontSize: '56px',
      fontFamily: this.theme.typography.titleFont,
      color: `#${this.theme.colors.text.toString(16).padStart(6, '0')}`,
      stroke: '#000000',
      strokeThickness: this.theme.typography.titleStroke,
      fontStyle: 'bold',
    });
    title.setOrigin(0.5).setDepth(1001);

    // Player indicator
    this.playerText = this.add.text(
      width / 2,
      120,
      this.isMultiplayer ? `PLAYER ${this.currentPlayer + 1}` : 'PLAYER 1',
      {
        fontSize: '32px',
        fontFamily: this.theme.typography.itemFont,
        color: `#${this.theme.colors.selected.toString(16).padStart(6, '0')}`,
        fontStyle: 'bold',
      }
    );
    this.playerText.setOrigin(0.5).setDepth(1001);

    // Character options
    const characters: CharacterType[] = ['axel', 'blaze', 'max', 'sammy'];
    const characterNames = ['AXEL', 'BLAZE', 'MAX', 'SAMMY'];
    const boxSpacing = 180;
    const startX = width / 2 - ((characters.length - 1) * boxSpacing) / 2;
    const y = height / 2 - 20;

    characters.forEach((char, index) => {
      const x = startX + index * boxSpacing;
      const box = new CharacterSelectBox(
        this,
        x,
        y,
        characterNames[index],
        this.theme,
        () => this.selectCharacter(char)
      );
      this.characterBoxes.push(box);
    });

    // Start game button (initially hidden)
    this.startButton = new MenuButton(
      this,
      width / 2,
      height - 80,
      'PRESS ENTER TO START',
      this.theme,
      () => this.startGame()
    );
    this.startButton.setVisible(false);

    // Keyboard input
    this.input.keyboard?.on('keydown-ENTER', () => {
      if (this.canStartGame()) {
        this.startGame();
      }
    });
  }

  selectCharacter(character: CharacterType) {
    console.log(`CharacterSelectScene: Player ${this.currentPlayer + 1} selected ${character}`);
    this.selectedCharacters[this.currentPlayer] = character;

    // Update visual selection
    this.characterBoxes.forEach((box, index) => {
      const char = ['axel', 'blaze', 'max', 'sammy'][index];
      box.setSelected(char === character);
    });

    // For single player, start game immediately after selection
    if (!this.isMultiplayer && this.currentPlayer === 0) {
      this.startGame();
      return;
    }

    // For multiplayer, move to next player or show start button
    if (this.currentPlayer === 0) {
      this.currentPlayer = 1;
      if (this.playerText) {
        this.playerText.setText('PLAYER 2');
      }
      // Clear selection for next player
      this.characterBoxes.forEach((box) => box.setSelected(false));
    } else {
      if (this.startButton) {
        this.startButton.setVisible(true);
      }
    }
  }

  /**
   * Check if game can be started
   */
  private canStartGame(): boolean {
    if (!this.isMultiplayer) {
      // Single player only needs player 1
      return this.selectedCharacters[0] !== null;
    } else {
      // Multiplayer needs both players
      return this.selectedCharacters[0] !== null && this.selectedCharacters[1] !== null;
    }
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
    if (this.startButton) {
      this.startButton.destroy();
    }
  }
}

