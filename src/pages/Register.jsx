import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Grid } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'Sale'
  });
  const [error, setError] = useState('');

  const handleRegister = (e) => {
    e.preventDefault();
    if (register(formData)) {
      navigate('/deals');
    } else {
      setError('Email này đã tồn tại trong hệ thống!');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <Grid size={32} color="var(--base-blue)" />
          <h1>Đăng Ký Tài Khoản</h1>
          <p>Gia nhập hệ thống QUYPRO CRM</p>
        </div>
        
        <form onSubmit={handleRegister} className="auth-form">
          {error && <div className="auth-error">{error}</div>}
          
          <div className="form-group">
            <label>Họ và Tên</label>
            <input 
              type="text" 
              value={formData.name} 
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="auth-input"
              placeholder="Nguyễn Văn A"
              required
            />
          </div>

          <div className="form-group">
            <label>Địa chỉ Email</label>
            <input 
              type="email" 
              value={formData.email} 
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="auth-input"
              placeholder="email@congty.com"
              required
            />
          </div>

          <div className="form-group">
            <label>Số điện thoại</label>
            <input 
              type="tel" 
              value={formData.phone} 
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              className="auth-input"
              placeholder="0912345678"
              required
            />
          </div>

          <div className="form-group">
            <label>Mật khẩu</label>
            <input 
              type="password" 
              value={formData.password} 
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="auth-input"
              placeholder="Tối thiểu 8 ký tự"
              minLength={8}
              required
            />
          </div>

          <div className="form-group">
            <label>Chức vụ (Quyền hạn)</label>
            <select 
              value={formData.role} 
              onChange={(e) => setFormData({...formData, role: e.target.value})}
              className="auth-input"
            >
              <option value="Sale">Nhân viên (Sale)</option>
              <option value="Manager">Quản lý (Manager)</option>
            </select>
          </div>
          
          <button type="submit" className="btn-auth">Tạo Tài Khoản & Đăng Nhập</button>
        </form>

        <div className="auth-footer">
          Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
