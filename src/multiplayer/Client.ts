import { io, Socket } from 'socket.io-client';
import { PlayerInput } from '../types/GameTypes';
import { CharacterType } from '../game/types/CharacterType';

export interface PlayerState {
  id: string;
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  state: string;
  character: CharacterType;
  facingRight: boolean;
  health: number;
}

export interface GameState {
  players: Map<string, PlayerState>;
  timestamp: number;
}

/**
 * Multiplayer client for online play
 */
export class MultiplayerClient {
  private socket: Socket | null = null;
  private roomId: string | null = null;
  private playerId: string | null = null;
  private isConnected: boolean = false;
  private serverUrl: string;
  private onStateUpdate?: (state: GameState) => void;
  // @ts-ignore - Set via callback, called when player joins
  private onPlayerJoined?: (playerId: string) => void;
  private onPlayerLeft?: (playerId: string) => void;
  private onRoomCreated?: (roomId: string) => void;
  private onRoomJoined?: (roomId: string) => void;
  private onError?: (error: string) => void;

  constructor(serverUrl: string = 'http://localhost:3001') {
    this.serverUrl = serverUrl;
  }

  /**
   * Connect to server
   */
  connect() {
    if (this.socket) {
      this.disconnect();
    }

    this.socket = io(this.serverUrl, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    this.setupEventHandlers();
  }

  /**
   * Setup socket event handlers
   */
  private setupEventHandlers() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this.isConnected = true;
      this.playerId = this.socket?.id || null;
      console.log('Connected to multiplayer server');
    });

    this.socket.on('disconnect', () => {
      this.isConnected = false;
      console.log('Disconnected from multiplayer server');
    });

    this.socket.on('roomCreated', (data: { roomId: string }) => {
      this.roomId = data.roomId;
      if (this.onRoomCreated) {
        this.onRoomCreated(data.roomId);
      }
    });

    this.socket.on('roomJoined', (data: { roomId: string }) => {
      this.roomId = data.roomId;
      if (this.onRoomJoined) {
        this.onRoomJoined(data.roomId);
      }
    });

    this.socket.on('roomJoinError', (data: { message: string }) => {
      if (this.onError) {
        this.onError(data.message);
      }
    });

    this.socket.on('playerUpdate', (data: PlayerState) => {
      // Handle remote player state update
      if (this.onStateUpdate) {
        const gameState: GameState = {
          players: new Map([[data.id, data]]),
          timestamp: Date.now()
        };
        this.onStateUpdate(gameState);
      }
    });

    this.socket.on('playerLeft', (data: { playerId: string }) => {
      if (this.onPlayerLeft) {
        this.onPlayerLeft(data.playerId);
      }
    });
  }

  /**
   * Create a new room
   */
  createRoom() {
    if (!this.socket || !this.isConnected) {
      console.error('Not connected to server');
      return;
    }

    this.socket.emit('createRoom');
  }

  /**
   * Join an existing room
   */
  joinRoom(roomId: string) {
    if (!this.socket || !this.isConnected) {
      console.error('Not connected to server');
      return;
    }

    this.socket.emit('joinRoom', { roomId });
  }

  /**
   * Send player state update to server
   */
  sendPlayerUpdate(state: {
    x: number;
    y: number;
    velocityX: number;
    velocityY: number;
    state: string;
    character: CharacterType;
    facingRight: boolean;
    health: number;
  }) {
    if (!this.socket || !this.isConnected || !this.playerId) {
      return;
    }

    const playerData: PlayerState = {
      id: this.playerId,
      ...state
    };

    this.socket.emit('playerUpdate', playerData);
  }

  /**
   * Send input to server (for input prediction)
   */
  sendInput(input: PlayerInput) {
    if (!this.socket || !this.isConnected) {
      return;
    }

    this.socket.emit('playerInput', {
      playerId: this.playerId,
      input,
      timestamp: Date.now()
    });
  }

  /**
   * Disconnect from server
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.roomId = null;
      this.playerId = null;
    }
  }

  /**
   * Set event callbacks
   */
  onStateUpdateCallback(callback: (state: GameState) => void) {
    this.onStateUpdate = callback;
  }

  onPlayerJoinedCallback(callback: (playerId: string) => void) {
    this.onPlayerJoined = callback;
  }

  onPlayerLeftCallback(callback: (playerId: string) => void) {
    this.onPlayerLeft = callback;
  }

  onRoomCreatedCallback(callback: (roomId: string) => void) {
    this.onRoomCreated = callback;
  }

  onRoomJoinedCallback(callback: (roomId: string) => void) {
    this.onRoomJoined = callback;
  }

  onErrorCallback(callback: (error: string) => void) {
    this.onError = callback;
  }

  /**
   * Get connection status
   */
  getIsConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Get current room ID
   */
  getRoomId(): string | null {
    return this.roomId;
  }

  /**
   * Get player ID
   */
  getPlayerId(): string | null {
    return this.playerId;
  }
}

