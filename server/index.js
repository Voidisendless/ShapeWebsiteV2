// Load environment variables from .env file 
require('dotenv').config();

// Import dependencies
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const axios = require('axios'); // Used to make HTTP requests to Shapes API

// Create an Express app
const app = express();
app.use(cors()); // Allow cross-origin requests (so frontend can connect)

// Create an HTTP server using the Express app
const server = http.createServer(app);

// Initialize Socket.io server with CORS settings
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173', // Allow frontend origin
    methods: ['GET', 'POST'],
  },
});

// ===== 🧠 SHAPES BOT FUNCTION (with custom headers) =====
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
    console.error(`Error contacting Shapes API (${modelId}):`, error.message);
    throw error;
  }
}

// ===== 🔌 SOCKET.IO SETUP =====
io.on('connection', (socket) => {
  console.log(`🔌 New client connected: ${socket.id}`);

  socket.on('user-typing', () => {
    socket.broadcast.emit('user-typing');
  });

  socket.on('chat-message', async (msg) => {
    console.log(`📨 [${msg.channel}] ${msg.sender}: ${msg.text}`);
    io.emit('chat-message', msg);

    // Match @mention with hyphen support (e.g., @akio-nemo)
    const mentionMatch = msg.text.match(/@([\w-]+)/);
    const mentionedBot = mentionMatch?.[1];

    if (msg.channel === 'bots' && mentionedBot) {
      const modelId = `shapesinc/${mentionedBot.toLowerCase()}`;

      try {
        const botReply = await getShapeReply(
          msg.text,
          modelId,
          msg.userId,   // ✅ user ID from frontend
          msg.channel   // ✅ channel name from frontend
        );

        const botMessage = {
          text: botReply,
          sender: mentionedBot,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          channel: 'bots',
          bot: true,
        };

        io.emit('chat-message', botMessage);
      } catch (err) {
        io.emit('chat-message', {
          text: `⚠️ @${mentionedBot} couldn't respond right now.`,
          sender: mentionedBot,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          channel: 'bots',
          bot: true,
        });
      }
    }
  });

  socket.on('disconnect', () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
  });
});

// Start server on port 3000
server.listen(3000, () => {
  console.log('✅ Server listening on http://localhost:3000');
});
