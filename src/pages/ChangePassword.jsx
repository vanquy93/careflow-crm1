import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const ChangePassword = () => {
  const { currentUser, updatePassword } = useAuth();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setError('Mật khẩu phải có ít nhất 8 ký tự.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    const success = await updatePassword(currentUser.id, newPassword);
    if (success) {
      alert('Đổi mật khẩu thành công!');
      navigate('/deals');
    } else {
      setError('Có lỗi xảy ra khi đổi mật khẩu.');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <KeyRound size={32} color="var(--base-blue)" />
          <h1>Đổi Mật Khẩu</h1>
          <p>Vì lý do bảo mật, bạn phải đổi mật khẩu ở lần đăng nhập đầu tiên hoặc khi được Admin reset.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="auth-error">{error}</div>}
          <div className="form-group">
            <label>Mật khẩu mới</label>
            <input 
              type="password" 
              value={newPassword} 
              onChange={(e) => setNewPassword(e.target.value)}
              className="auth-input"
              placeholder="Nhập mật khẩu mới..."
              minLength={8}
              required
            />
          </div>
          <div className="form-group">
            <label>Xác nhận Mật khẩu mới</label>
            <input 
              type="password" 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="auth-input"
              placeholder="Nhập lại mật khẩu mới..."
              minLength={8}
              required
            />
          </div>
          
          <button type="submit" className="btn-auth">Cập nhật mật khẩu</button>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;
