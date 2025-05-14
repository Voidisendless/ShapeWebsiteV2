require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');
const http = require('http');
const axios = require('axios');
const { Pool } = require('pg');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';
const PORT = process.env.PORT || 3001;

// Use Railway internal DB host if deployed in Railway
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

const app = express();
app.use(cors());
app.use(express.json());

app.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password)
    return res.status(400).json({ error: 'All fields required' });

  if (password.length < 6)
    return res.status(400).json({ error: 'Password too short' });

  try {
    const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userExists.rows.length > 0)
      return res.status(409).json({ error: 'User already exists' });

    const hashed = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING *',
      [username, email, hashed]
    );

    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, email, username }, JWT_SECRET);
    res.json({ token, username });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, email, username: user.username }, JWT_SECRET);
    res.json({ token, username: user.username });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

const connectedUsers = new Map();

io.use(async (socket, next) => {
  const { token, guestName } = socket.handshake.auth;
  if (token) {
    try {
      const user = jwt.verify(token, JWT_SECRET);
      socket.user = user;
      return next();
    } catch {
      return next(new Error('Invalid token'));
    }
  }
  if (guestName) {
    socket.user = { username: guestName, email: guestName };
    return next();
  }
  return next(new Error('Unauthorized'));
});

io.on('connection', (socket) => {
  console.log(`🔌 ${socket.user.username} connected`);
  connectedUsers.set(socket.id, socket.user.username);
  io.emit('online-users', Array.from(connectedUsers.values()));

  socket.emit('user-info', socket.user);

  socket.on('chat-message', async (msg) => {
    const enrichedMsg = {
      ...msg,
      sender: socket.user.username,
      userId: socket.user.id || socket.user.email || null,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      channel: msg.channel,
    };

    try {
      if (socket.user.id) {
        await pool.query(
          'INSERT INTO messages (user_id, text, channel, created_at) VALUES ($1, $2, $3, NOW())',
          [socket.user.id, msg.text, msg.channel]
        );
      }
    } catch (err) {
      console.error('DB message insert error:', err);
    }

    io.emit('chat-message', enrichedMsg);

    // Bot reply for @botname in #bots
    const mentionMatch = msg.text.match(/@([\w-]+)/);
    const mentionedBot = mentionMatch?.[1];

    if (msg.channel === 'bots' && mentionedBot) {
      try {
        const response = await axios.post('https://shapebots.onrender.com/api/reply', {
          message: msg.text,
          repo: `shapesinc/${mentionedBot.toLowerCase()}`,
          userId: enrichedMsg.userId,
          channel: enrichedMsg.channel
        });

        io.emit('chat-message', {
          text: response.data,
          sender: mentionedBot,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          channel: 'bots',
          bot: true
        });
      } catch {
        io.emit('chat-message', {
          text: `⚠️ @${mentionedBot} couldn't respond.`,
          sender: mentionedBot,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          channel: 'bots',
          bot: true
        });
      }
    }
  });

  socket.on('user-typing', () => {
    socket.broadcast.emit('user-typing');
  });

  socket.on('disconnect', () => {
    console.log(`❌ ${socket.user.username} disconnected`);
    connectedUsers.delete(socket.id);
    io.emit('online-users', Array.from(connectedUsers.values()));
  });
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

// ... original requires above
app.get('/messages', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        m.text,
        m.channel,
        m.created_at,
        COALESCE(u.username, m.guest_name) AS sender,
        m.user_id,
        m.guest_name
       FROM messages m
       LEFT JOIN users u ON m.user_id = u.id
       ORDER BY m.created_at ASC
       LIMIT 100`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Message history fetch failed:', err);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});