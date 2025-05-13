import { useState } from 'react';
import PageWrapper from './PageWrapper';
import './Form.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    if (!email || !password) return alert('Fill in all fields');
    alert('Logging in...');
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
        <div className="switch-link">Don't have an account? <a href="#">Sign up</a></div>
      </form>
    </PageWrapper>
  );
}

export default Login;
