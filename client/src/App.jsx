import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';

function App() {
  const [messages, setMessages] = useState([]);
  const [msg, setMsg] = useState('');
  const [channel, setChannel] = useState('bots');
  const [isTyping, setIsTyping] = useState(false);
  const [username, setUsername] = useState('');
  const [userId, setUserId] = useState('');
  const [auth, setAuth] = useState({
    token: localStorage.getItem('authToken'),
    guestName: localStorage.getItem('guestName'),
  });

  const navigate = useNavigate();
  const bottomRef = useRef(null);
  const socketRef = useRef(null);
  const guestEmoji = localStorage.getItem('guestEmoji');
  const guestColor = localStorage.getItem('guestColor');
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    const updateUser = () => {
      const token = localStorage.getItem('authToken');
      const stored = localStorage.getItem('username');
      const guest = localStorage.getItem('guestName');
      setUsername(token && stored ? stored : guest || 'Guest');
    };
    updateUser();
    window.addEventListener('storage', updateUser);
    return () => window.removeEventListener('storage', updateUser);
  }, []);

  useEffect(() => {
    const newSocket = io('https://shapewebsitev2-production.up.railway.app', {
      auth: {
        token: auth.token || '',
        guestName: auth.guestName || '',
      },
      transports: ['websocket'],
    });

    socketRef.current = newSocket;

    newSocket.on('user-info', (user) => {
      setUserId(user.email);
    });

    newSocket.on('chat-message', (message) => {
      console.log('🔁 Incoming message:', message);
      setMessages((prev) => [...prev, message]);
    });

    newSocket.on('online-users', (users) => {
      setOnlineUsers(users);
    });

    newSocket.on('user-typing', () => {
      setIsTyping(true);
      setTimeout(() => setIsTyping(false), 1500);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [auth.token, auth.guestName]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!msg.trim()) return;

    const messageObj = {
      text: msg,
      sender: username,
      userId: userId,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      channel,
    };

    socketRef.current.emit('chat-message', messageObj);
    setMsg('');
  };

  const handleTyping = (e) => {
    setMsg(e.target.value);
    socketRef.current.emit('user-typing');
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('username');
    localStorage.removeItem('guestName');
    localStorage.removeItem('guestEmoji');
    localStorage.removeItem('guestColor');
    setAuth({ token: '', guestName: '' });
    navigate('/guest');
  };

  const filteredMessages = messages.filter((m) => m.channel === channel);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center',
      width: '100vw', height: '100vh', backgroundColor: '#000' }}>
      <div style={{
        position: 'relative', display: 'flex', flexDirection: 'column', width: '800px',
        height: '90vh', backgroundColor: '#000', color: '#fff', fontFamily: 'sans-serif',
        padding: '1rem', borderRadius: '10px', boxShadow: '0 0 10px rgba(255, 255, 255, 0.1)',
      }}>
        <button onClick={handleLogout} style={{
          position: 'absolute', top: 20, right: 20, background: 'transparent', color: '#fff',
          border: '1px solid #fff', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer',
        }}>Logout</button>

        <h1 style={{ textAlign: 'center' }}>ShapeSpace</h1>
        <h2 style={{ textAlign: 'center' }}>
          Chatting as <span style={{ color: '#4caf50' }}>{username}</span>
        </h2>

        <div style={{ display: 'flex' }}>
          <div style={{
            width: '180px', marginRight: '1rem', background: '#111',
            padding: '10px', borderRadius: '8px', color: '#0f0'
          }}>
            <h3 style={{ fontSize: '1rem', borderBottom: '1px solid #444', paddingBottom: '4px' }}>Online</h3>
            <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
              {onlineUsers.map((user, i) => (
                <li key={i} style={{ fontSize: '0.9rem', marginBottom: '4px' }}>{user}</li>
              ))}
            </ul>
          </div>

          <div style={{ flex: 1 }}>
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
              flexGrow: 1, flexShrink: 1, overflowY: 'auto', backgroundColor: '#111',
              border: '1px solid #444', padding: '10px', borderRadius: '8px',
              height: '100%', minHeight: '300px'
            }}>
              {filteredMessages.map((m, i) => {
                const isSelf = m.userId === userId;
                const isBot = m.bot === true;
                const avatarBg = isBot ? '#888' : isSelf ? guestColor || '#4caf50' : '#2196f3';
                const avatarContent = isSelf ? guestEmoji || m.sender[0]?.toUpperCase() : m.sender[0]?.toUpperCase();

                return (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'flex-start',
                    flexDirection: isSelf ? 'row-reverse' : 'row',
                    marginBottom: '12px',
                  }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: '50%',
                      backgroundColor: avatarBg, color: '#000',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 'bold', fontSize: '1.2rem', margin: '0 10px',
                    }}>{avatarContent}</div>

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
                  flexGrow: 1, padding: '10px', border: '1px solid #333',
                  borderRadius: '6px 0 0 6px', fontSize: '1em',
                  backgroundColor: '#222', color: '#fff',
                }}
              />
              <button type="submit" style={{
                padding: '10px 16px', backgroundColor: '#4caf50',
                color: '#fff', border: 'none', borderRadius: '0 6px 6px 0', cursor: 'pointer',
              }}>Send</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
