import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

// Connect to your live backend URL (replace with yours)
const socket = io('https://shapewebsitev2-production.up.railway.app', {
  transports: ['websocket'],
});

useEffect(() => {
  socket.on('connect', () => {
    console.log('✅ Connected to backend socket:', socket.id);
  });

  socket.on('disconnect', () => {
    console.log('❌ Disconnected from backend socket');
  });
}, []);


function App() {
  const [messages, setMessages] = useState([]);           // Chat message history
  const [msg, setMsg] = useState('');                     // Input message text
  const [isTyping, setIsTyping] = useState(false);        // Typing indicator
  const bottomRef = useRef(null);                         // Ref for auto-scroll

  // Listen for messages and typing from backend
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

  // Scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle form submit
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

  // Handle input change (typing)
  const handleTyping = (e) => {
    const value = e.target.value;
    setMsg(value);                       // Update input value
    socket.emit('user-typing');         // Notify others you're typing
  };

  return (
    <div style={{
      maxWidth: 600,
      margin: '2rem auto',
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
          height: 500,
          overflowY: 'auto',
          backgroundColor: '#111',
        }}
      >
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

        {isTyping && (
          <div style={{ fontStyle: 'italic', fontSize: '0.85em', marginTop: '5px', color: '#ccc' }}>
            Someone is typing...
          </div>
        )}

        <div ref={bottomRef}></div>
      </div>

      {/* Message input */}
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
  );
}

export default App;
