import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

// Connect to live backend (make sure to use the full https:// URL)
const socket = io('https://shapewebsitev2-production.up.railway.app', {
  transports: ['websocket'],
});

function App() {
  const [messages, setMessages] = useState([]);     // All messages in the chat
  const [msg, setMsg] = useState('');               // Current message being typed
  const [isTyping, setIsTyping] = useState(false);  // Show typing indicator
  const bottomRef = useRef(null);                   // Ref to scroll to bottom

  // Listen for chat messages and typing from server
  useEffect(() => {
    socket.on('chat-message', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    socket.on('user-typing', () => {
      setIsTyping(true);
      setTimeout(() => setIsTyping(false), 1500); // Auto-clear after 1.5s
    });

    return () => {
      socket.off('chat-message');
      socket.off('user-typing');
    };
  }, []);

  // Show socket connection status in console
  useEffect(() => {
    socket.on('connect', () => {
      console.log('✅ Connected to backend socket:', socket.id);
    });

    socket.on('disconnect', () => {
      console.log('❌ Disconnected from backend socket');
    });
  }, []);

  // Scroll to the latest message automatically
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message to server
  const sendMessage = (e) => {
    e.preventDefault();
    if (!msg.trim()) return;

    const messageObj = {
      text: msg,
      sender: `Guest-${socket.id.slice(0, 4)}`,
      time: new Date().toLocaleTimeString(),
    };

    socket.emit('chat-message', messageObj);
    setMsg('');
  };

  // Handle user typing in the input
  const handleTyping = (e) => {
    const value = e.target.value;
    setMsg(value);
    socket.emit('user-typing');
  };

  return (
    // Full-screen wrapper to center chat
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      backgroundColor: '#000',
    }}>
      {/* Chat container box */}
      <div style={{
        width: '800px',
        height: '90vh',
        fontFamily: 'sans-serif',
        backgroundColor: '#000',
        color: '#fff',
        padding: '1rem',
        borderRadius: '10px',
        boxShadow: '0 0 10px rgba(255, 255, 255, 0.1)'
      }}>
        <h2>💬 Real-Time Chat with VoidAI</h2>

        {/* Chat display area */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            border: '1px solid #444',
            padding: 10,
            height: '70vh',
            overflowY: 'auto',
            backgroundColor: '#111',
          }}
        >
          {/* Render each message */}
          {messages.map((m, i) => {
            const isBot = m.sender.toLowerCase() === 'voidai';

            return (
              <div
                key={i}
                style={{
                  alignSelf: isBot ? 'flex-start' : 'flex-end',
                  backgroundColor: isBot ? '#ddd' : '#b2fab4',
                  color: '#000',
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
            );
          })}

          {/* Typing indicator */}
          {isTyping && (
            <div style={{ fontStyle: 'italic', fontSize: '0.85em', marginTop: '5px', color: '#ccc' }}>
              Someone is typing...
            </div>
          )}

          {/* Invisible element to scroll to */}
          <div ref={bottomRef}></div>
        </div>

        {/* Message input form */}
        <form onSubmit={sendMessage} style={{ display: 'flex', marginTop: 10 }}>
          <input
            type="text"
            value={msg}
            onChange={handleTyping}
            placeholder="Type a message..."
            style={{
              flexGrow: 1,
              padding: '10px',
              border: '1px solid #333',
              borderRadius: '6px 0 0 6px',
              fontSize: '1em',
              backgroundColor: '#222',
              color: '#fff'
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
    </div>
  );
}

export default App;
