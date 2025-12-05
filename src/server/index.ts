import { Server } from 'socket.io';
import { createServer } from 'http';

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

interface PlayerData {
  id: string;
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  character: string;
  state: string;
  facingRight: boolean;
  health: number;
  lastUpdate: number;
}

interface PlayerInput {
  playerId: string;
  input: {
    left: boolean;
    right: boolean;
    up: boolean;
    down: boolean;
    jump: boolean;
    attack: boolean;
    special: boolean;
  };
  timestamp: number;
}

interface GameRoom {
  id: string;
  players: Map<string, PlayerData>;
  createdAt: number;
}

const rooms = new Map<string, GameRoom>();

io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);

  socket.on('createRoom', () => {
    const roomId = `room_${Date.now()}`;
    const room: GameRoom = {
      id: roomId,
      players: new Map(),
      createdAt: Date.now()
    };
    rooms.set(roomId, room);
    socket.join(roomId);
    socket.emit('roomCreated', { roomId });
    console.log(`Room created: ${roomId}`);
  });

  socket.on('joinRoom', ({ roomId }: { roomId: string }) => {
    const room = rooms.get(roomId);
    if (room && room.players.size < 2) {
      socket.join(roomId);
      socket.emit('roomJoined', { roomId });
      console.log(`Player ${socket.id} joined room ${roomId}`);
    } else {
      socket.emit('roomJoinError', { message: 'Room is full or does not exist' });
    }
  });

  socket.on('playerUpdate', (data: PlayerData) => {
    const roomId = Array.from(socket.rooms).find(room => room.startsWith('room_'));
    if (roomId) {
      const room = rooms.get(roomId);
      if (room) {
        data.id = socket.id;
        data.lastUpdate = Date.now();
        room.players.set(socket.id, data);
        
        // Broadcast to other players in room
        socket.to(roomId).emit('playerUpdate', data);
      }
    }
  });

  socket.on('playerInput', (data: PlayerInput) => {
    const roomId = Array.from(socket.rooms).find(room => room.startsWith('room_'));
    if (roomId) {
      // Broadcast input to other players for prediction
      socket.to(roomId).emit('playerInput', {
        ...data,
        playerId: socket.id
      });
    }
  });

  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);
    // Clean up player from all rooms
    rooms.forEach((room, roomId) => {
      if (room.players.has(socket.id)) {
        room.players.delete(socket.id);
        io.to(roomId).emit('playerLeft', { playerId: socket.id });
        if (room.players.size === 0) {
          rooms.delete(roomId);
        }
      }
    });
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Multiplayer server running on port ${PORT}`);
});

