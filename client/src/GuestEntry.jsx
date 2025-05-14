import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateGuestName } from './utils/generateGuestName';
import './Form.css';

function GuestEntry() {
  const [guestName, setGuestName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const existing = localStorage.getItem('guestName');
    if (existing) {
      navigate('/');
    } else {
      const { name } = generateGuestName();
      setGuestName(name);
    }
  }, [navigate]);

  const handleJoin = () => {
    const { emoji, color } = generateGuestName(); // re-pick color/emoji for this name
    localStorage.setItem('guestName', guestName.trim());
    localStorage.setItem('guestEmoji', emoji);
    localStorage.setItem('guestColor', color);
    navigate('/');
  };

  const handleShuffle = () => {
    const { name } = generateGuestName();
    setGuestName(name);
  };

  return (
    <div className="page">
      <div className="form-container">
        <h1>Join Chat as Guest</h1>
        <p style={{ marginBottom: '1rem' }}>A fun name is randomly generated for you:</p>
        <input
          type="text"
          value={guestName}
          onChange={(e) => setGuestName(e.target.value)}
          style={{ padding: '10px', width: '100%', borderRadius: '6px', marginBottom: '1rem' }}
        />
        <button onClick={handleShuffle} className="auth-btn" style={{ marginBottom: '0.75rem' }}>
          🔄 Shuffle Name
        </button>
        <button onClick={handleJoin} className="auth-btn">Join Chat</button>
        <div className="switch-link" style={{ marginTop: '1.5rem' }}>
          Have an account? <a href="/login">Log in</a> or <a href="/signup">sign up</a>
        </div>
      </div>
    </div>
  );
}

export default GuestEntry;
