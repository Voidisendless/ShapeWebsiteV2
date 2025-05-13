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

// ===== 🧠 SHAPES BOT FUNCTION =====
async function getShapeReply(userMessage) {
  try {
    const response = await axios.post(
      'https://api.shapes.inc/v1/chat/completions',
      {
        model: process.env.SHAPE_USERNAME,
        messages: [{ role: 'user', content: userMessage }],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.SHAPESINC_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Error contacting Shapes API:', error.message);
    return "Sorry, I couldn't respond right now.";
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

    // Case-insensitive check for @VoidAI in the bots channel
    if (
      msg.channel === 'bots' &&
      msg.text.toLowerCase().includes('@voidai')
    ) {
      const botReply = await getShapeReply(msg.text);

      const botMessage = {
        text: botReply,
        sender: 'VoidAI',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        channel: 'bots',
      };

      io.emit('chat-message', botMessage);
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
