import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';

const socket = io('https://shapewebsitev2-production.up.railway.app', {
  auth: {
    token: localStorage.getItem('authToken'),
  },
  transports: ['websocket'],
});

function App() {
  const [messages, setMessages] = useState([]);
  const [msg, setMsg] = useState('');
  const [channel, setChannel] = useState('bots');
  const [isTyping, setIsTyping] = useState(false);
  const [username] = useState(localStorage.getItem('username') || 'Guest');
  const bottomRef = useRef(null);
  const navigate = useNavigate();

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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!msg.trim()) return;

    const messageObj = {
      text: msg,
      sender: username,
      userId: socket.id,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      channel,
    };

    socket.emit('chat-message', messageObj);
    setMsg('');
  };

  const handleTyping = (e) => {
    setMsg(e.target.value);
    socket.emit('user-typing');
  };

  const filteredMessages = messages.filter((m) => m.channel === channel);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('username');
    navigate('/login');
  };

  return (
    <div style={{
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      width: '100vw', height: '100vh', backgroundColor: '#000', margin: 0, padding: 0,
    }}>
      <div style={{
        position: 'relative', display: 'flex', flexDirection: 'column', width: '800px',
        height: '90vh', backgroundColor: '#000', color: '#fff', fontFamily: 'sans-serif',
        padding: '1rem', borderRadius: '10px', boxShadow: '0 0 10px rgba(255, 255, 255, 0.1)',
      }}>
        <button onClick={handleLogout}
          style={{
            position: 'absolute', top: 20, right: 20,
            background: 'transparent', color: '#fff', border: '1px solid #fff',
            borderRadius: '6px', padding: '6px 12px', cursor: 'pointer',
          }}>
          Logout
        </button>

        <h1 style={{ textAlign: 'center' }}>ShapeSpace</h1>
        <h2 style={{ marginTop: 0, textAlign: 'center' }}>
          Chatting as <span style={{ color: '#4caf50' }}>{username}</span>
        </h2>

        <div style={{ marginBottom: '1rem' }}>
          <button onClick={() => setChannel('bots')} style={{
            padding: '6px 12px', marginRight: 10,
            backgroundColor: channel === 'bots' ? '#4caf50' : '#333',
            color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer',
          }}>#bots</button>

          <button onClick={() => setChannel('general')} style={{
            padding: '6px 12px',
            backgroundColor: channel === 'general' ? '#4caf50' : '#333',
            color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer',
          }}>#general</button>
        </div>

        <div style={{
          flexGrow: 1, overflowY: 'auto', backgroundColor: '#111',
          border: '1px solid #444', padding: '10px', borderRadius: '8px', minHeight: 0
        }}>
          {filteredMessages.map((m, i) => {
            const isSelf = m.userId === socket.id;
            const isBot = m.bot === true;
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start',
                flexDirection: isSelf ? 'row-reverse' : 'row',
                marginBottom: '12px',
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  backgroundColor: isBot ? '#888' : isSelf ? '#4caf50' : '#2196f3',
                  color: '#000', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontWeight: 'bold', fontSize: '1rem', margin: '0 10px',
                }}>{m.sender[0]?.toUpperCase() || '?'}</div>

                <div style={{
                  backgroundColor: isBot ? '#ddd' : isSelf ? '#b2fab4' : '#fff',
                  color: '#000', padding: '8px 12px', borderRadius: '10px', maxWidth: '70%',
                }}>
                  <div style={{ fontSize: '0.85em', fontWeight: 'bold', marginBottom: '4px' }}>
                    {m.sender} <span style={{ fontWeight: 'normal', fontSize: '0.75em' }}>@ {m.time}</span>
                  </div>
                  <div>{m.text}</div>
                </div>
              </div>
            );
          })}

          {isTyping && (
            <div style={{ fontStyle: 'italic', fontSize: '0.85em', color: '#ccc', margin: '6px 0' }}>
              Someone is typing...
            </div>
          )}
          <div ref={bottomRef}></div>
        </div>

        <form onSubmit={sendMessage} style={{ display: 'flex', marginTop: 10 }}>
          <input
            type="text"
            value={msg}
            onChange={handleTyping}
            placeholder={`Send a message to #${channel}...`}
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
          <button type="submit" style={{
            padding: '10px 16px',
            backgroundColor: '#4caf50',
            color: '#fff',
            border: 'none',
            borderRadius: '0 6px 6px 0',
            cursor: 'pointer',
          }}>Send</button>
        </form>
      </div>
    </div>
  );
}

export default App;
