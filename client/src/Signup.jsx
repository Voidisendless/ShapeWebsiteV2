import { useState } from 'react'; 
import { useNavigate, Link } from 'react-router-dom';
import PageWrapper from './PageWrapper';
import './Form.css';

function Signup() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!username || !email || !password) return alert('All fields are required');
    if (password.length < 6) return alert('Password must be at least 6 characters');

    try {
      const res = await fetch('https://shapewebsitev2-production.up.railway.app/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await res.json();
      if (!res.ok) return alert(data.error);

      alert('Account created!');
      navigate('/login');
    } catch (err) {
      alert('Signup failed.');
    }
  };

  return (
    <PageWrapper title="Sign Up" iconClass="fas fa-user-plus">
      <form className="auth-form" onSubmit={handleSignup}>
        <div className="form-group">
          <label>Username</label>
          <input
            type="text"
            placeholder="Choose a username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <i className="fas fa-user input-icon"></i>
        </div>

        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <i className="fas fa-envelope input-icon"></i>
        </div>

        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            placeholder="Create a password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <i className="fas fa-lock input-icon"></i>
        </div>

        <button className="auth-btn" type="submit">Sign Up</button>
        <div className="switch-link">Already have an account? <Link to="/login">Log in</Link></div>
        <div className="switch-link" style={{ marginTop: '1.5rem' }}>
          <Link to="/guest" style={{
            display: 'inline-block',
            padding: '10px',
            backgroundColor: '#4caf50',
            color: 'white',
            borderRadius: '6px',
            textDecoration: 'none',
            fontWeight: 'bold'
          }}>
            Or join as guest →
          </Link>
        </div>
      </form>
    </PageWrapper>
  );
}

export default Signup;