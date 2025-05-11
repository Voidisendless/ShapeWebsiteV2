import { useEffect, useState, useRef } from 'react';   // React hooks
import { io } from 'socket.io-client';                // Socket.io client

// Create a socket connection to the backend server
const socket = io('https://shapewebsitev2-production.up.railway.app');

function App() {
  const [messages, setMessages] = useState([]);     // Chat message history
  const [msg, setMsg] = useState('');               // Current input text
  const [isTyping, setIsTyping] = useState(false);  // Track if someone else is typing
  const bottomRef = useRef(null);                   // Ref for auto-scrolling

  // Listen for messages and typing events
  useEffect(() => {
    // When a new message is received from the server
    socket.on('chat-message', (message) => {
      setMessages((prev) => [...prev, message]);   // Add to chat
    });

    // When someone else is typing
    socket.on('user-typing', () => {
      setIsTyping(true); // Show typing indicator
      // Auto-hide after 1.5 seconds
      setTimeout(() => setIsTyping(false), 1500);
    });

    // Cleanup event listeners on unmount
    return () => {
      socket.off('chat-message');
      socket.off('user-typing');
    };
  }, []);

  // Scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle sending a message
  const sendMessage = (e) => {
    e.preventDefault();             // Prevent page reload
    if (!msg.trim()) return;        // Skip if message is empty

    const messageObj = {
      text: msg,
      sender: `Guest-${socket.id.slice(0, 4)}`, // Temporary user name
      time: new Date().toLocaleTimeString(),   // Timestamp
    };

    socket.emit('chat-message', messageObj); // Send message to server
    setMsg('');                               // Clear input field
  };

  // Handle user typing
  const handleTyping = (e) => {
    setMsg(e.target.value);            // Update message state
    socket.emit('user-typing');        // Notify others that user is typing
  };

  return (
    <div style={{ maxWidth: 600, margin: '2rem auto', fontFamily: 'sans-serif' }}>
      <h2>💬 Real-Time Chat with ShapeBot</h2>

      {/* Chat message container */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid #ccc',
          padding: 10,
          height: 300,
          overflowY: 'auto',
          backgroundColor: '#fefefe',
        }}
      >
        {/* Display each message */}
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              alignSelf: m.sender === 'ShapeBot' ? 'flex-start' : 'flex-end',
              backgroundColor: m.sender === 'ShapeBot' ? '#f0f0f0' : '#d1e7dd',
              padding: '8px 12px',
              borderRadius: '8px',
              marginBottom: '8px',
              maxWidth: '75%',
            }}
          >
            <div style={{ fontSize: '0.85em', fontWeight: 'bold' }}>
              {m.sender} <span style={{ fontWeight: 'normal', fontSize: '0.75em' }}>@ {m.time}</span>
            </div>
            <div>{m.text}</div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div style={{ fontStyle: 'italic', fontSize: '0.85em', marginTop: '5px' }}>
            Someone is typing...
          </div>
        )}

        {/* Scroll anchor */}
        <div ref={bottomRef}></div>
      </div>

      {/* Message input form */}
      <form onSubmit={sendMessage} style={{ display: 'flex', marginTop: 10 }}>
        <input
          value={msg}
          onChange={handleTyping} // Handle typing as user types
          placeholder="Type a message..."
          style={{
            flexGrow: 1,
            padding: '10px',
            border: '1px solid #ccc',
            borderRadius: '6px 0 0 6px',
            fontSize: '1em',
          }}
        />
        <button
          type="submit"
          style={{
            padding: '10px 16px',
            backgroundColor: '#4caf50',
            color: '#fff',
            border: 'none',
            borderRadius: '0 6px 6px 0',
            cursor: 'pointer',
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
}

export default App;
