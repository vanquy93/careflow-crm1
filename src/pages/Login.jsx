import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Grid } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    if (login(email, password)) {
      navigate('/deals');
    } else {
      setError('Email (hoặc Mã NV) không chính xác!');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <Grid size={32} color="var(--base-blue)" />
          <h1>QUYPRO CRM</h1>
          <p>Đăng nhập vào Hệ thống</p>
        </div>
        
        <form onSubmit={handleLogin} className="auth-form">
          {error && <div className="auth-error">{error}</div>}
          <div className="form-group">
            <label>Email, Mã nhân viên hoặc Số điện thoại</label>
            <input 
              type="text" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              className="auth-input"
              placeholder="Ví dụ: 0912345678, EMP001 hoặc email..."
              required
            />
          </div>
          <div className="form-group">
            <label>Mật khẩu</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              className="auth-input"
              placeholder="Nhập mật khẩu..."
              required
            />
          </div>
          
          <button type="submit" className="btn-auth">Đăng Nhập</button>
        </form>

        <div className="auth-footer">
          Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
