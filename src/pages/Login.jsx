import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const success = await login(email, password);
    if (success) {
      navigate('/deals');
    } else {
      setError('Tài khoản hoặc mật khẩu không chính xác!');
    }
    setLoading(false);
  };

  return (
    <div className="auth-container">
      {/* Left branding panel */}
      <div className="auth-left">
        <div className="auth-brand">
          <img src="/nexthome-logo.png" alt="NEXTHOME Logo" className="auth-brand-logo" />
          <h1>NEXTHOME CRM</h1>
          <p>Hệ thống quản lý quan hệ khách hàng chuyên nghiệp — Tối ưu doanh số, nâng cao hiệu quả đội nhóm</p>
          <div className="auth-features">
            <div className="auth-feature-item">
              <div className="auth-feature-icon">🎯</div>
              <span>Quản lý KPI & doanh số theo thời gian thực</span>
            </div>
            <div className="auth-feature-item">
              <div className="auth-feature-icon">📊</div>
              <span>Báo cáo tháng/quý/năm trực quan</span>
            </div>
            <div className="auth-feature-item">
              <div className="auth-feature-icon">💬</div>
              <span>Gửi chiến dịch SMS & Zalo OA hàng loạt</span>
            </div>
            <div className="auth-feature-item">
              <div className="auth-feature-icon">🏗️</div>
              <span>Phân chia theo dự án & nhóm bán hàng</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right login form */}
      <div className="auth-right">
        <div className="auth-card">
          <div className="auth-header">
            <h2>Chào mừng trở lại 👋</h2>
            <p>Đăng nhập để truy cập NEXTHOME CRM</p>
          </div>

          <form onSubmit={handleLogin} className="auth-form">
            {error && <div className="auth-error">⚠️ {error}</div>}

            <div className="form-group">
              <label>Tài khoản</label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="auth-input"
                placeholder="Số điện thoại, Mã NV hoặc Email..."
                required
                autoFocus
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

            <button type="submit" className="btn-auth" disabled={loading}>
              {loading ? '⏳ Đang đăng nhập...' : '🚀 ĐĂNG NHẬP'}
            </button>
          </form>

          <div className="auth-hints">
            <strong>💡 Lần đầu đăng nhập?</strong>
            <ul>
              <li>Mật khẩu mặc định: <strong>12345678</strong></li>
              <li>Bạn sẽ được yêu cầu đổi mật khẩu ngay</li>
              <li>Liên hệ Admin nếu quên mật khẩu</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
