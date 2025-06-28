import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "https://panger-chat.netlify.app"],
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Add a basic route handler for the root path
app.get('/', (req, res) => {
  res.json({ 
    message: 'SecureComm Chat Server is running',
    status: 'online',
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// Store room data in memory (in production, use a database)
const rooms = new Map();
const userSockets = new Map();

// Helper function to get or create room
function getOrCreateRoom(roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      id: roomId,
      participants: new Map(),
      messages: [],
      createdAt: Date.now()
    });
  }
  return rooms.get(roomId);
}

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join room
  socket.on('join-room', ({ roomId, userName }) => {
    console.log(`User ${userName} joining room ${roomId}`);
    
    // Check if user is already in the room to prevent duplicate joins
    const existingUserInfo = userSockets.get(socket.id);
    if (existingUserInfo && existingUserInfo.roomId === roomId && existingUserInfo.userName === userName) {
      console.log(`User ${userName} already in room ${roomId}, skipping join`);
      return;
    }
    
    const room = getOrCreateRoom(roomId);
    
    // Check if user with same name is already in the room
    const existingParticipant = Array.from(room.participants.values()).find(p => p.name === userName);
    if (existingParticipant) {
      // Update existing participant's socket ID instead of creating duplicate
      room.participants.delete(existingParticipant.id);
      room.participants.set(socket.id, {
        id: socket.id,
        name: userName,
        isOnline: true,
        joinedAt: existingParticipant.joinedAt // Keep original join time
      });
      
      userSockets.set(socket.id, { roomId, userName });
      socket.join(roomId);
      
      // Send existing messages to the reconnected user
      socket.emit('room-messages', room.messages);
      
      // Send updated participants list to all users in room
      const participantsList = Array.from(room.participants.values());
      io.to(roomId).emit('participants-updated', participantsList);
      
      console.log(`User ${userName} reconnected to room ${roomId}`);
      return;
    }
    
    // Add new user to room
    const participant = {
      id: socket.id,
      name: userName,
      isOnline: true,
      joinedAt: Date.now()
    };
    
    room.participants.set(socket.id, participant);
    userSockets.set(socket.id, { roomId, userName });
    
    // Join socket room
    socket.join(roomId);
    
    // Send existing messages to the new user
    socket.emit('room-messages', room.messages);
    
    // Send updated participants list to all users in room
    const participantsList = Array.from(room.participants.values());
    io.to(roomId).emit('participants-updated', participantsList);
    
    // Send join notification to room (only for genuinely new users)
    const joinMessage = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      content: `${userName} joined the room`,
      timestamp: Date.now(),
      sender: 'System',
      type: 'system',
      encrypted: false
    };
    
    room.messages.push(joinMessage);
    io.to(roomId).emit('new-message', joinMessage);
    
    console.log(`Room ${roomId} now has ${room.participants.size} participants`);
  });

  // Handle new messages
  socket.on('send-message', (messageData) => {
    const userInfo = userSockets.get(socket.id);
    if (!userInfo) return;
    
    const room = rooms.get(userInfo.roomId);
    if (!room) return;
    
    const message = {
      ...messageData,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: Date.now()
    };
    
    room.messages.push(message);
    
    // Broadcast message to all users in the room
    io.to(userInfo.roomId).emit('new-message', message);
    
    console.log(`Message sent in room ${userInfo.roomId}:`, message.content);
  });

  // Handle typing indicators
  socket.on('typing-start', () => {
    const userInfo = userSockets.get(socket.id);
    if (userInfo) {
      socket.to(userInfo.roomId).emit('user-typing', {
        userId: socket.id,
        userName: userInfo.userName,
        isTyping: true
      });
    }
  });

  socket.on('typing-stop', () => {
    const userInfo = userSockets.get(socket.id);
    if (userInfo) {
      socket.to(userInfo.roomId).emit('user-typing', {
        userId: socket.id,
        userName: userInfo.userName,
        isTyping: false
      });
    }
  });

  // Handle call events
  socket.on('start-call', ({ isVideo }) => {
    const userInfo = userSockets.get(socket.id);
    if (userInfo) {
      socket.to(userInfo.roomId).emit('incoming-call', {
        from: userInfo.userName,
        isVideo,
        callerId: socket.id
      });
    }
  });

  socket.on('accept-call', ({ callerId }) => {
    socket.to(callerId).emit('call-accepted', {
      accepterId: socket.id
    });
  });

  socket.on('reject-call', ({ callerId }) => {
    socket.to(callerId).emit('call-rejected');
  });

  socket.on('end-call', () => {
    const userInfo = userSockets.get(socket.id);
    if (userInfo) {
      socket.to(userInfo.roomId).emit('call-ended');
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    const userInfo = userSockets.get(socket.id);
    if (userInfo) {
      const room = rooms.get(userInfo.roomId);
      if (room) {
        // Remove participant
        room.participants.delete(socket.id);
        
        // Send leave notification only if there are still participants
        if (room.participants.size > 0) {
          const leaveMessage = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            content: `${userInfo.userName} left the room`,
            timestamp: Date.now(),
            sender: 'System',
            type: 'system',
            encrypted: false
          };
          
          room.messages.push(leaveMessage);
          io.to(userInfo.roomId).emit('new-message', leaveMessage);
        }
        
        // Update participants list
        const participantsList = Array.from(room.participants.values());
        io.to(userInfo.roomId).emit('participants-updated', participantsList);
        
        // Clean up empty rooms
        if (room.participants.size === 0) {
          console.log(`Room ${userInfo.roomId} is empty, cleaning up`);
          rooms.delete(userInfo.roomId);
        }
        
        console.log(`Room ${userInfo.roomId} now has ${room.participants.size} participants`);
      }
      
      userSockets.delete(socket.id);
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});