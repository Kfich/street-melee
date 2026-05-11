import { BaseMenuScene } from '../../ui/menu/BaseMenuScene';
import { MenuButton } from '../../ui/menu/MenuButton';
import { getSharedMultiplayerClient, destroySharedMultiplayerClient } from '../../multiplayer/Client';

export class MultiplayerMenuScene extends BaseMenuScene {
  private multiplayerClient?: ReturnType<typeof getSharedMultiplayerClient>;
  private roomIdInput?: Phaser.GameObjects.DOMElement;
  private roomIdText?: Phaser.GameObjects.Text;
  private statusText?: Phaser.GameObjects.Text;
  private isConnected: boolean = false;
  private createButton?: MenuButton;
  private joinButton?: MenuButton;
  private backButton?: MenuButton;
  private startButton?: MenuButton;

  constructor() {
    super('MultiplayerMenuScene');
  }

  protected createMenu() {
    const { width, height } = this.cameras.main;

    // Title
    const title = this.add.text(width / 2, 80, 'MULTIPLAYER', {
      fontSize: this.theme.typography.titleSize,
      fontFamily: this.theme.typography.titleFont,
      color: `#${this.theme.colors.text.toString(16).padStart(6, '0')}`,
      stroke: '#000000',
      strokeThickness: this.theme.typography.titleStroke,
      fontStyle: 'bold',
    });
    title.setOrigin(0.5).setDepth(1001);

    // Status text
    this.statusText = this.add.text(width / 2, 150, 'Connecting to server...', {
      fontSize: '24px',
      fontFamily: this.theme.typography.labelFont,
      color: `#${this.theme.colors.selected.toString(16).padStart(6, '0')}`,
    });
    this.statusText.setOrigin(0.5).setDepth(1001);

    // Use the module-level singleton so the socket connection (and room membership)
    // survive the transition into CharacterSelectScene and GameScene.
    this.multiplayerClient = getSharedMultiplayerClient();
    this.setupMultiplayerCallbacks();

    // Create Room button
    this.createButton = new MenuButton(
      this,
      width / 2,
      height / 2 - 40,
      'CREATE ROOM',
      this.theme,
      () => {
        if (this.isConnected) {
          this.multiplayerClient?.createRoom();
        }
      }
    );

    // Join Room section label
    const joinLabel = this.add.text(width / 2, height / 2 + 30, 'JOIN ROOM', {
      fontSize: '28px',
      fontFamily: this.theme.typography.itemFont,
      color: `#${this.theme.colors.text.toString(16).padStart(6, '0')}`,
    });
    joinLabel.setOrigin(0.5).setDepth(1001);

    // Room ID input (using DOM element for text input)
    const inputX = width / 2;
    const inputY = height / 2 + 90;

    this.roomIdInput = this.add.dom(inputX, inputY, 'input', {
      type: 'text',
      placeholder: 'Enter Room ID',
      style: 'width: 300px; height: 40px; font-size: 20px; text-align: center; background: rgba(26, 26, 46, 0.9); color: #ffffff; border: 2px solid #ffffff; border-radius: 4px;',
    });
    this.roomIdInput.setDepth(1001);

    // Room ID display
    this.roomIdText = this.add.text(width / 2, inputY + 50, '', {
      fontSize: '20px',
      fontFamily: this.theme.typography.labelFont,
      color: `#00ff00`,
    });
    this.roomIdText.setOrigin(0.5).setDepth(1001);

    // Join button
    this.joinButton = new MenuButton(
      this,
      width / 2,
      inputY + 90,
      'JOIN',
      this.theme,
      () => {
        if (this.isConnected && this.roomIdInput) {
          const inputElement = this.roomIdInput.node as HTMLInputElement;
          const roomId = inputElement.value.trim();
          if (roomId) {
            this.multiplayerClient?.joinRoom(roomId);
          }
        }
      }
    );

    // Start button (appears when in room)
    this.startButton = new MenuButton(
      this,
      width / 2,
      height - 120,
      'START GAME',
      this.theme,
      () => {
        if (this.roomIdText && this.roomIdText.text) {
          const roomId = this.roomIdText.text.replace('Room ID: ', '');
          this.scene.start('CharacterSelectScene', {
            isMultiplayer: true,
            roomId: roomId,
          });
        }
      }
    );
    this.startButton.setVisible(false);

    // Back button
    this.backButton = new MenuButton(
      this,
      width / 2,
      height - 60,
      'BACK',
      this.theme,
      () => {
        // Intentionally leaving multiplayer — destroy the singleton so the next
        // visit to this scene starts fresh.
        destroySharedMultiplayerClient();
        this.scene.start('MainMenuScene');
      }
    );

    // Connect only if not already connected (singleton may have reconnected)
    if (!this.multiplayerClient.getIsConnected()) {
      this.multiplayerClient.connect();
    }
  }

  private setupMultiplayerCallbacks() {
    if (!this.multiplayerClient) return;

    this.multiplayerClient.onRoomCreatedCallback((roomId) => {
      if (this.roomIdText) {
        this.roomIdText.setText(`Room ID: ${roomId}`);
        this.roomIdText.setColor('#00ff00');
      }
      if (this.statusText) {
        this.statusText.setText('Room created! Waiting for players...');
        this.statusText.setColor('#00ff00');
      }
      if (this.startButton) {
        this.startButton.setVisible(true);
      }
    });

    this.multiplayerClient.onRoomJoinedCallback((roomId) => {
      if (this.roomIdText) {
        this.roomIdText.setText(`Room ID: ${roomId}`);
        this.roomIdText.setColor('#00ff00');
      }
      if (this.statusText) {
        this.statusText.setText('Joined room! Ready to play!');
        this.statusText.setColor('#00ff00');
      }
      if (this.startButton) {
        this.startButton.setVisible(true);
      }
    });

    // Track connection status
    const checkConnection = () => {
      if (this.multiplayerClient) {
        this.isConnected = this.multiplayerClient.getIsConnected();
        if (this.isConnected && this.statusText) {
          this.statusText.setText('Connected to server');
          this.statusText.setColor('#00ff00');
        } else if (!this.isConnected && this.statusText) {
          this.statusText.setText('Connecting to server...');
          this.statusText.setColor('#ffff00');
        }
      }
    };

    // Check connection status periodically
    this.time.addEvent({
      delay: 500,
      callback: checkConnection,
      loop: true,
    });

    this.multiplayerClient.onErrorCallback((error) => {
      if (this.statusText) {
        this.statusText.setText(`Error: ${error}`);
        this.statusText.setColor('#ff0000');
      }
    });
  }

  protected playMenuMusic() {
    // Don't play music in multiplayer menu
  }

  shutdown() {
    this.createButton?.destroy();
    this.joinButton?.destroy();
    this.backButton?.destroy();
    this.startButton?.destroy();
    // Do NOT disconnect the singleton client here — the connection must survive
    // the transition to CharacterSelectScene and GameScene.  The client is only
    // destroyed when the player explicitly presses BACK.
  }
}

