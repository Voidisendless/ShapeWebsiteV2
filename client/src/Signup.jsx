import { useState } from 'react';
import PageWrapper from './PageWrapper';
import './Form.css';

function Signup() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignup = (e) => {
    e.preventDefault();
    if (!username || !email || !password) return alert('All fields are required');
    if (password.length < 6) return alert('Password must be at least 6 characters');
    alert('Account created!');
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
        <div className="switch-link">Already have an account? <a href="#">Log in</a></div>
      </form>
    </PageWrapper>
  );
}

export default Signup;
