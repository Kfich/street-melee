import { BaseMenuScene } from '../../ui/menu/BaseMenuScene';
import { MenuButton } from '../../ui/menu/MenuButton';
import { CharacterSelectBox } from '../../ui/menu/CharacterSelectBox';
import { CharacterType } from '../types/CharacterType';
import { getCharacterData } from '../../ui/menu/CharacterData';

export class CharacterSelectScene extends BaseMenuScene {
  private selectedCharacters: (CharacterType | null)[] = [null, null];
  private currentPlayer: number = 0;
  private isMultiplayer: boolean = false;
  private roomId?: string;
  private characterBoxes: CharacterSelectBox[] = [];
  private playerText?: Phaser.GameObjects.Text;
  private startButton?: MenuButton;
  private descriptionText?: Phaser.GameObjects.Text;
  private playstyleText?: Phaser.GameObjects.Text;
  private selectedIndex: number = 0;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;

  constructor() {
    super('CharacterSelectScene');
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

    // Title - adjusted for 8-bit font
    const titleText = this.isMultiplayer ? 'SELECT CHARACTERS' : 'SELECT CHARACTER';
    const title = this.add.text(width / 2, 40, titleText, {
      fontSize: '32px', // Reduced for 8-bit font readability
      fontFamily: this.theme.typography.titleFont,
      color: `#${this.theme.colors.text.toString(16).padStart(6, '0')}`,
      stroke: '#000000',
      strokeThickness: this.theme.typography.titleStroke,
      fontStyle: 'bold',
    });
    title.setOrigin(0.5).setDepth(1001);

    // Player indicator - adjusted for 8-bit font
    this.playerText = this.add.text(
      width / 2,
      100,
      this.isMultiplayer ? `PLAYER ${this.currentPlayer + 1}` : 'PLAYER 1',
      {
        fontSize: '18px', // Reduced for 8-bit font readability
        fontFamily: this.theme.typography.itemFont,
        color: `#${this.theme.colors.selected.toString(16).padStart(6, '0')}`,
        fontStyle: 'bold',
      }
    );
    this.playerText.setOrigin(0.5).setDepth(1001);

    // Character options - larger boxes with more spacing
    const characters: CharacterType[] = ['axel', 'blaze', 'max', 'sammy'];
    const boxSpacing = 220; // Increased spacing to accommodate larger cards
    const startX = width / 2 - ((characters.length - 1) * boxSpacing) / 2;
    // Add spacing between PLAYER 1 text (at y=100) and cards
    // Card center is at y, card extends 144px up and down (288px total height after 10% reduction)
    // Add 40px gap between PLAYER 1 text and top of cards
    const playerTextBottom = 100 + 18; // Approximate bottom of PLAYER 1 text (18px font)
    const cardTop = playerTextBottom + 40; // 40px spacing
    const y = cardTop + 144; // Card center (144px is half of 288px card height)

    characters.forEach((char, index) => {
      const x = startX + index * boxSpacing;
      const box = new CharacterSelectBox(
        this,
        x,
        y,
        char,
        this.theme,
        () => this.selectCharacter(char),
        () => {
          // Update description on hover
          this.selectedIndex = index;
          this.updateSelection();
        }
      );
      this.characterBoxes.push(box);
    });

    // Description area (below character boxes) - enhanced with more info
    // Set to lower depth than character cards (1999) so cards appear on top
    // Adjusted font sizes for 8-bit font readability
    // Moved down to avoid overlap with cards (card bottom is at height/2 - 20 + 160 = height/2 + 140)
    // Adding 30px gap below cards
    this.descriptionText = this.add.text(width / 2, height / 2 + 180, '', {
      fontSize: '12px', // Reduced for 8-bit font
      fontFamily: this.theme.typography.labelFont,
      color: `#${this.theme.colors.text.toString(16).padStart(6, '0')}`,
      align: 'center',
      wordWrap: { width: width - 100 },
    });
    this.descriptionText.setOrigin(0.5, 0).setDepth(1999);

    // Playstyle text
    this.playstyleText = this.add.text(width / 2, height / 2 + 200, '', {
      fontSize: '10px', // Reduced for 8-bit font
      fontFamily: this.theme.typography.labelFont,
      color: `#${this.theme.colors.textSecondary.toString(16).padStart(6, '0')}`,
      fontStyle: 'italic',
      align: 'center',
    });
    this.playstyleText.setOrigin(0.5, 0).setDepth(1999);

    // Special moves text
    const specialMoveText = this.add.text(width / 2, height / 2 + 215, '', {
      fontSize: '10px', // Reduced for 8-bit font
      fontFamily: this.theme.typography.labelFont,
      color: `#${this.theme.colors.textSecondary.toString(16).padStart(6, '0')}`,
      align: 'center',
    });
    specialMoveText.setOrigin(0.5, 0).setDepth(1999);
    this.data.set('specialMoveText', specialMoveText);

    // Signature move text
    const signatureMoveText = this.add.text(width / 2, height / 2 + 230, '', {
      fontSize: '10px', // Reduced for 8-bit font
      fontFamily: this.theme.typography.labelFont,
      color: `#${this.theme.colors.selected.toString(16).padStart(6, '0')}`,
      align: 'center',
      fontStyle: 'bold',
    });
    signatureMoveText.setOrigin(0.5, 0).setDepth(1999);
    this.data.set('signatureMoveText', signatureMoveText);

    // Update description for first character
    this.updateDescription(0);

    // Start game button (initially hidden)
    this.startButton = new MenuButton(
      this,
      width / 2,
      height - 60,
      'PRESS ENTER TO START',
      this.theme,
      () => this.startGame()
    );
    this.startButton.setVisible(false);

    // Keyboard navigation
    this.cursors = this.input.keyboard?.createCursorKeys();
    this.input.keyboard?.on('keydown-ENTER', () => {
      if (this.canStartGame()) {
        this.startGame();
      } else {
        // Select current character if none selected
        this.selectCharacter(characters[this.selectedIndex]);
      }
    });

    // Instructions - adjusted for 8-bit font
    this.add.text(width / 2, height - 30, 'Arrow Keys: Navigate | Enter: Select', {
      fontSize: '10px', // Reduced for 8-bit font
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
    if (index >= 0 && index < this.characterBoxes.length) {
      const characterType = this.characterBoxes[index].getCharacterType();
      const characterData = getCharacterData(characterType);
      
      if (this.descriptionText) {
        this.descriptionText.setText(characterData.description);
      }
      if (this.playstyleText) {
        this.playstyleText.setText(`Playstyle: ${characterData.playstyle}`);
      }
      
      // Update special moves
      const specialMoveText = this.data.get('specialMoveText') as Phaser.GameObjects.Text;
      if (specialMoveText) {
        specialMoveText.setText(`Special: ${characterData.specialMove}`);
      }
      
      // Update signature move
      const signatureMoveText = this.data.get('signatureMoveText') as Phaser.GameObjects.Text;
      if (signatureMoveText) {
        signatureMoveText.setText(`Signature: ${characterData.signatureMove}`);
      }

      // Play hover sound
      if (this.audioManager) {
        this.audioManager.playSound('menuSelect', 0.3);
      }
    }
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

    // Play selection sound
    if (this.audioManager) {
      this.audioManager.playSound('menuSelect');
    }

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
      this.selectedIndex = 0;
      this.updateSelection();
      
      // Play transition sound
      if (this.audioManager) {
        this.audioManager.playSound('menuSelect', 0.7);
      }
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

