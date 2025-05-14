// Load environment variables from .env file
require('dotenv').config();

// Import dependencies
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const axios = require('axios');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Setup
const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173', // Update to your frontend URL in prod
    methods: ['GET', 'POST'],
  },
});

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';
const users = []; // In-memory user store

// ===== /register =====
app.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'All fields required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  const existing = users.find(u => u.username === username || u.email === email);
  if (existing) {
    return res.status(409).json({ error: 'User already exists' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  users.push({ username, email, password: hashedPassword });

  res.status(201).json({ message: 'User registered successfully' });
});

// ===== /login =====
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const user = users.find(u => u.email === email);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign(
    { username: user.username, email: user.email },
    JWT_SECRET,
    { expiresIn: '2h' }
  );

  res.json({ token, username: user.username });
});

// ===== Shapes API Request =====
async function getShapeReply(userMessage, modelId, userId, channelId) {
  try {
    const response = await axios.post(
      'https://api.shapes.inc/v1/chat/completions',
      {
        model: modelId,
        messages: [{ role: 'user', content: userMessage }],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.SHAPESINC_API_KEY}`,
          'Content-Type': 'application/json',
          ...(userId && { 'X-User-Id': userId }),
          ...(channelId && { 'X-Channel-Id': channelId }),
        },
      }
    );
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error(`❌ Error from Shapes API (${modelId}):`, error.message);
    throw error;
  }
}

// ===== JWT/Guest Middleware for Socket.io =====
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  const guestName = socket.handshake.auth?.guestName;

  if (!token) {
    if (!guestName) return next(new Error('Guest name required'));
    socket.user = { username: guestName, email: `guest-${socket.id}` };
    return next();
  }

  try {
    const user = jwt.verify(token, JWT_SECRET);
    socket.user = user;
    next();
  } catch (err) {
    next(new Error('Invalid token'));
  }
});

// ===== Socket Events =====
io.on('connection', (socket) => {
  console.log(`🔌 Socket connected: ${socket.user.username} (${socket.id})`);

  socket.on('user-typing', () => {
    socket.broadcast.emit('user-typing');
  });

  socket.on('chat-message', async (msg) => {
    const enrichedMsg = {
      ...msg,
      sender: socket.user.username,
      userId: socket.user.email,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    console.log(`📨 [${enrichedMsg.channel}] ${enrichedMsg.sender}: ${enrichedMsg.text}`);
    io.emit('chat-message', enrichedMsg);

    const mentionMatch = msg.text.match(/@([\w-]+)/);
    const mentionedBot = mentionMatch?.[1];

    if (msg.channel === 'bots' && mentionedBot) {
      const modelId = `shapesinc/${mentionedBot.toLowerCase()}`;
      try {
        const botReply = await getShapeReply(
          msg.text,
          modelId,
          enrichedMsg.userId,
          enrichedMsg.channel
        );

        const botMsg = {
          text: botReply,
          sender: mentionedBot,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          channel: 'bots',
          bot: true,
        };

        io.emit('chat-message', botMsg);
      } catch {
        io.emit('chat-message', {
          text: `⚠️ @${mentionedBot} couldn't respond.`,
          sender: mentionedBot,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          channel: 'bots',
          bot: true,
        });
      }
    }
  });

  socket.on('disconnect', () => {
    console.log(`❌ Socket disconnected: ${socket.user.username} (${socket.id})`);
  });
});

// ===== Start Server =====
server.listen(3000, () => {
  console.log('✅ Server running at http://localhost:3000');
});