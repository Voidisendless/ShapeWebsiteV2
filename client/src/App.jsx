import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

// Connect to your live backend URL
const socket = io('https://your-backend-name.up.railway.app', {
  transports: ['websocket'],
});

function App() {
  const [messages, setMessages] = useState([]);
  const [msg, setMsg] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef(null);

  // Handle incoming messages and typing signals
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

  // Auto-scroll to the bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send chat message
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

  // Handle typing input
  const handleTyping = (e) => {
    setMsg(e.target.value);
    socket.emit('user-typing');
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
          height: 300,
          overflowY: 'auto',
          backgroundColor: '#111',
        }}
      >
        {messages.map((m, i) => {
          const isBot = m.sender.toLowerCase() === 'voidai'; // Bot check

          return (
            <div
              key={i}
              style={{
                alignSelf: isBot ? 'flex-start' : 'flex-end',
                backgroundColor: isBot ? '#ddd' : '#b2fab4', // Bot = light gray, User = light green
                color: '#000', // Black text in bubbles
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

        <div ref={bottomRef}></div>
      </div>

      {/* Input form */}
      <form onSubmit={sendMessage} style={{ display: 'flex', marginTop: 10 }}>
        <input
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
