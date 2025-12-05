import Phaser from 'phaser';
import { MultiplayerClient } from '../../multiplayer/Client';

export class MultiplayerMenuScene extends Phaser.Scene {
  private multiplayerClient?: MultiplayerClient;
  private roomIdInput?: Phaser.GameObjects.DOMElement;
  private roomIdText?: Phaser.GameObjects.Text;
  private statusText?: Phaser.GameObjects.Text;
  private isConnected: boolean = false;

  constructor() {
    super({ key: 'MultiplayerMenuScene' });
  }

  create() {
    const { width, height } = this.cameras.main;

    // Title
    this.add.text(width / 2, 100, 'MULTIPLAYER', {
      fontSize: '64px',
      fontFamily: 'Arial',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    // Status text
    this.statusText = this.add.text(width / 2, 200, 'Connecting to server...', {
      fontSize: '24px',
      color: '#ffff00'
    }).setOrigin(0.5);

    // Initialize multiplayer client
    this.multiplayerClient = new MultiplayerClient();
    this.setupMultiplayerCallbacks();

    // Create Room button
    const createButton = this.add.text(width / 2, height / 2 - 60, 'CREATE ROOM', {
      fontSize: '36px',
      fontFamily: 'Arial',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    createButton.on('pointerdown', () => {
      if (this.isConnected) {
        this.multiplayerClient?.createRoom();
      }
    });

    createButton.on('pointerover', () => {
      createButton.setStyle({ color: '#ffff00' });
    });

    createButton.on('pointerout', () => {
      createButton.setStyle({ color: '#ffffff' });
    });

    // Join Room section
    this.add.text(width / 2, height / 2 + 40, 'JOIN ROOM', {
      fontSize: '32px',
      color: '#ffffff'
    }).setOrigin(0.5);

    // Room ID input (using DOM element for text input)
    const inputX = width / 2;
    const inputY = height / 2 + 100;

    // Create input field using DOM
    this.roomIdInput = this.add.dom(inputX, inputY, 'input', {
      type: 'text',
      placeholder: 'Enter Room ID',
      style: 'width: 300px; height: 40px; font-size: 20px; text-align: center;'
    });

    // Room ID display
    this.roomIdText = this.add.text(width / 2, inputY + 60, '', {
      fontSize: '20px',
      color: '#00ff00'
    }).setOrigin(0.5);

    // Join button
    const joinButton = this.add.text(width / 2, inputY + 100, 'JOIN', {
      fontSize: '32px',
      fontFamily: 'Arial',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    joinButton.on('pointerdown', () => {
      if (this.isConnected && this.roomIdInput) {
        const inputElement = this.roomIdInput.node as HTMLInputElement;
        const roomId = inputElement.value.trim();
        if (roomId) {
          this.multiplayerClient?.joinRoom(roomId);
        }
      }
    });

    // Back button
    const backButton = this.add.text(width / 2, height - 80, 'BACK', {
      fontSize: '32px',
      fontFamily: 'Arial',
      color: '#ffff00',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    backButton.on('pointerdown', () => {
      this.multiplayerClient?.disconnect();
      this.scene.start('MainMenuScene');
    });

    // Start button (appears when in room)
    const startButton = this.add.text(width / 2, height - 150, 'START GAME', {
      fontSize: '36px',
      fontFamily: 'Arial',
      color: '#00ff00',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setVisible(false);

    startButton.on('pointerdown', () => {
      if (this.roomIdText && this.roomIdText.text) {
        this.scene.start('CharacterSelectScene', {
          isMultiplayer: true,
          roomId: this.roomIdText.text
        });
      }
    });

    // Connect to server
    this.multiplayerClient.connect();

    // Store references
    this.data.set('startButton', startButton);
  }

  private setupMultiplayerCallbacks() {
    if (!this.multiplayerClient) return;

    this.multiplayerClient.onRoomCreatedCallback((roomId) => {
      if (this.roomIdText) {
        this.roomIdText.setText(`Room ID: ${roomId}`);
        this.roomIdText.setStyle({ color: '#00ff00' });
      }
      if (this.statusText) {
        this.statusText.setText('Room created! Waiting for players...');
        this.statusText.setStyle({ color: '#00ff00' });
      }
      const startButton = this.data.get('startButton') as Phaser.GameObjects.Text;
      if (startButton) {
        startButton.setVisible(true);
      }
    });

    this.multiplayerClient.onRoomJoinedCallback((roomId) => {
      if (this.roomIdText) {
        this.roomIdText.setText(`Room ID: ${roomId}`);
        this.roomIdText.setStyle({ color: '#00ff00' });
      }
      if (this.statusText) {
        this.statusText.setText('Joined room! Ready to play!');
        this.statusText.setStyle({ color: '#00ff00' });
      }
      const startButton = this.data.get('startButton') as Phaser.GameObjects.Text;
      if (startButton) {
        startButton.setVisible(true);
      }
    });

    // Track connection status
    const checkConnection = () => {
      if (this.multiplayerClient) {
        this.isConnected = this.multiplayerClient.getIsConnected();
        if (this.isConnected && this.statusText) {
          this.statusText.setText('Connected to server');
          this.statusText.setStyle({ color: '#00ff00' });
        } else if (!this.isConnected && this.statusText) {
          this.statusText.setText('Connecting to server...');
          this.statusText.setStyle({ color: '#ffff00' });
        }
      }
    };

    // Check connection status periodically
    this.time.addEvent({
      delay: 500,
      callback: checkConnection,
      loop: true
    });

    this.multiplayerClient.onErrorCallback((error) => {
      if (this.statusText) {
        this.statusText.setText(`Error: ${error}`);
        this.statusText.setStyle({ color: '#ff0000' });
      }
    });
  }
}

