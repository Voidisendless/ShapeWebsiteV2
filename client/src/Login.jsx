import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import PageWrapper from './PageWrapper';
import './Form.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return alert('Fill in all fields');

    try {
      const res = await fetch('https://shapewebsitev2-production.up.railway.app/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) return alert(data.error);

      localStorage.removeItem('guestName');
      localStorage.removeItem('guestEmoji');
      localStorage.removeItem('guestColor');
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('username', data.username);
      navigate('/');
    } catch (err) {
      alert('Login failed.');
    }
  };

  return (
    <PageWrapper title="Welcome back" iconClass="fas fa-shield-alt">
      <form className="auth-form" onSubmit={handleLogin}>
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
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <i className="fas fa-lock input-icon"></i>
        </div>

        <button className="auth-btn" type="submit">Log In</button>
        <div className="switch-link">Don't have an account? <Link to="/signup">Sign up</Link></div>
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

export default Login;