import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

// Connect to your live backend
const socket = io('https://shapewebsitev2-production.up.railway.app', {
  transports: ['websocket'],
});

function App() {
  const [messages, setMessages] = useState([]);
  const [msg, setMsg] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef(null);

  // Listen for chat messages and typing
  useEffect(() => {
    socket.on('chat-message', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    socket.on('user-typing', () => {
      setIsTyping(true);
      setTimeout(() => setIsTyping(false), 1500);
    });

    return () => {
      socket.off('chat-message');
      socket.off('user-typing');
    };
  }, []);

  // Show socket connection in console
  useEffect(() => {
    socket.on('connect', () => {
      console.log('✅ Connected to backend socket:', socket.id);
    });

    socket.on('disconnect', () => {
      console.log('❌ Disconnected from backend socket');
    });
  }, []);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message
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

  // Handle typing
  const handleTyping = (e) => {
    const value = e.target.value;
    setMsg(value);
    socket.emit('user-typing');
  };

  return (
    // Full-page black background + centered content
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      width: '100vw',
      height: '100vh',
      margin: 0,
      padding: 0,
      backgroundColor: '#000',
      boxSizing: 'border-box',
    }}>
      {/* Chat container */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        width: '800px',
        height: '90vh',
        backgroundColor: '#000',
        color: '#fff',
        fontFamily: 'sans-serif',
        padding: '1rem',
        borderRadius: '10px',
        boxShadow: '0 0 10px rgba(255, 255, 255, 0.1)',
      }}>
        <h2 style={{ marginTop: 0 }}>💬 Real-Time Chat with VoidAI</h2>

        {/* Chat messages */}
        <div style={{
          flexGrow: 1,
          overflowY: 'auto',
          backgroundColor: '#111',
          border: '1px solid #444',
          padding: '10px',
          borderRadius: '8px',
          minHeight: 0,
        }}>
          {messages.map((m, i) => {
            const isBot = m.sender.toLowerCase() === 'voidai';

            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  flexDirection: isBot ? 'row' : 'row-reverse',
                  marginBottom: '12px',
                }}
              >
                {/* Avatar */}
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    backgroundColor: isBot ? '#888' : '#4caf50',
                    color: '#000',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    fontSize: '1rem',
                    margin: '0 10px',
                  }}
                >
                  {m.sender[0].toUpperCase()}
                </div>

                {/* Message bubble */}
                <div
                  style={{
                    backgroundColor: isBot ? '#ddd' : '#b2fab4',
                    color: '#000',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    maxWidth: '70%',
                  }}
                >
                  <div style={{ fontSize: '0.85em', fontWeight: 'bold', marginBottom: '4px' }}>
                    {m.sender} <span style={{ fontWeight: 'normal', fontSize: '0.75em' }}>@ {m.time}</span>
                  </div>
                  <div>{m.text}</div>
                </div>
              </div>
            );
          })}

          {/* Typing indicator */}
          {isTyping && (
            <div style={{ fontStyle: 'italic', fontSize: '0.85em', color: '#ccc', margin: '6px 0' }}>
              Someone is typing...
            </div>
          )}

          <div ref={bottomRef}></div>
        </div>

        {/* Input area */}
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
              color: '#fff',
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
