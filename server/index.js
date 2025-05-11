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
    // Send user's message to the Shapes API using POST
    const response = await axios.post(
      'https://api.shapes.inc/v1/chat/completions', // Endpoint for Shape chat
      {
        model: process.env.SHAPE_USERNAME, // Your specific Shape ID (from .env)
        messages: [{ role: 'user', content: userMessage }], // User's message
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.SHAPESINC_API_KEY}`, // API key for auth
          'Content-Type': 'application/json',
        },
      }
    );

    // Extract the AI's reply from the response
    return response.data.choices[0].message.content;

  } catch (error) {
    // Handle errors gracefully
    console.error('Error contacting Shapes API:', error.message);
    return "Sorry, I couldn't respond right now.";
  }
}

// ===== 🔌 SOCKET.IO SETUP =====
io.on('connection', (socket) => {
  console.log(`🔌 New client connected: ${socket.id}`);

  socket.on('user-typing', () => {
  socket.broadcast.emit('user-typing'); // Let others know someone is typing
});

  // When a user sends a chat message
  socket.on('chat-message', async (msg) => {
    // Broadcast the message to all connected clients (including sender)
    io.emit('chat-message', msg);

    // Check if the message mentions @ShapeBot
    if (msg.text.includes('@VoidAI')) {
      // Call Shapes API and get bot's reply
      const botReply = await getShapeReply(msg.text);

      // Format bot message as a chat object
      const botMessage = {
        text: botReply,
        sender: 'VoidAI',
        time: new Date().toLocaleTimeString(),
      };

      // Broadcast the bot's reply to all clients
      io.emit('chat-message', botMessage);
    }
  });

  // Log when user disconnects
  socket.on('disconnect', () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
  });
});

// Start server on port 3000
server.listen(3000, () => {
  console.log('✅ Server listening on http://localhost:3000');
});
