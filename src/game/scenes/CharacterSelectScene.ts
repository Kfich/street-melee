import Phaser from 'phaser';
import { CharacterType } from '../types/CharacterType';

export class CharacterSelectScene extends Phaser.Scene {
  private selectedCharacters: (CharacterType | null)[] = [null, null];
  private currentPlayer: number = 0;
  private isMultiplayer: boolean = false;
  private roomId?: string;

  constructor() {
    super({ key: 'CharacterSelectScene' });
  }

  init(data: { isMultiplayer?: boolean; roomId?: string }) {
    this.isMultiplayer = data.isMultiplayer || false;
    this.roomId = data.roomId;
  }

  create() {
    const { width, height } = this.cameras.main;

    // Title
    const titleText = this.isMultiplayer ? 'SELECT CHARACTERS' : 'SELECT CHARACTER';
    this.add.text(width / 2, 80, titleText, {
      fontSize: '48px',
      fontFamily: 'Arial',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    // Player indicator
    const playerText = this.add.text(width / 2, 150, this.isMultiplayer ? `PLAYER ${this.currentPlayer + 1}` : 'PLAYER 1', {
      fontSize: '32px',
      fontFamily: 'Arial',
      color: '#ffff00'
    }).setOrigin(0.5);

    // Character options
    const characters: CharacterType[] = ['axel', 'blaze', 'max', 'sammy'];
    const characterNames = ['AXEL', 'BLAZE', 'MAX', 'SAMMY'];
    const startX = width / 2 - 300;
    const y = height / 2;

    characters.forEach((char, index) => {
      const x = startX + (index * 200);
      
      // Character box
      const box = this.add.rectangle(x, y, 150, 200, 0x333333, 0.8);
      box.setStrokeStyle(2, 0xffffff);
      box.setInteractive({ useHandCursor: true });

      // Character name
      this.add.text(x, y - 60, characterNames[index], {
        fontSize: '20px',
        fontFamily: 'Arial',
        color: '#ffffff'
      }).setOrigin(0.5);

      // Placeholder for character sprite
      this.add.text(x, y, '?', {
        fontSize: '64px',
        fontFamily: 'Arial',
        color: '#888888'
      }).setOrigin(0.5);

      // Selection handler
      box.on('pointerdown', () => {
        this.selectCharacter(char);
      });

      box.on('pointerover', () => {
        box.setStrokeStyle(2, 0xffff00);
      });

      box.on('pointerout', () => {
        box.setStrokeStyle(2, 0xffffff);
      });
    });

    // Start game button (initially hidden)
    const startButton = this.add.text(width / 2, height - 100, 'PRESS ENTER TO START', {
      fontSize: '24px',
      fontFamily: 'Arial',
      color: '#00ff00',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setVisible(false);

    startButton.on('pointerdown', () => {
      this.startGame();
    });

    // Store references
    this.data.set('playerText', playerText);
    this.data.set('startButton', startButton);

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

    // For single player, start game immediately after selection
    if (!this.isMultiplayer && this.currentPlayer === 0) {
      // Single player mode - start game with just player 1
      this.startGame();
      return;
    }

    // For multiplayer, move to next player or show start button
    if (this.currentPlayer === 0) {
      this.currentPlayer = 1;
      const playerText = this.data.get('playerText') as Phaser.GameObjects.Text;
      if (playerText) {
        playerText.setText('PLAYER 2');
      }
    } else {
      const startButton = this.data.get('startButton') as Phaser.GameObjects.Text;
      if (startButton) {
        startButton.setVisible(true);
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
    
    // For single player, player 2 is optional (can be null)
    const player1Character = this.selectedCharacters[0]!;
    const player2Character = this.isMultiplayer ? this.selectedCharacters[1]! : null;
    
    this.scene.start('GameScene', {
      player1Character: player1Character,
      player2Character: player2Character,
      isMultiplayer: this.isMultiplayer,
      roomId: this.roomId
    });
  }
}

