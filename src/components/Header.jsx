import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Search, PlusCircle, Settings, Moon, Bell, Grid, Menu, BarChart2, Briefcase, Users, Mail, Activity, Target, LogOut, CheckCircle, Trash, Shield, Palette } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import './Header.css';

const Header = () => {
  const { currentUser, isManager, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  
  const [notifications, setNotifications] = useState([]);
  const [showNotif, setShowNotif] = useState(false);
  const [showTheme, setShowTheme] = useState(false);
  const notifRef = useRef(null);
  const themeRef = useRef(null);

  const colors = [
    { name: 'Xanh dương (Mặc định)', value: '#2563eb' },
    { name: 'Xanh ngọc (Thịnh vượng)', value: '#0ea5e9' },
    { name: 'Xanh lá (Tài lộc)', value: '#10b981' },
    { name: 'Tím (Sáng tạo)', value: '#8b5cf6' },
    { name: 'Cam (Năng lượng)', value: '#f59e0b' },
    { name: 'Đỏ (May mắn)', value: '#ef4444' }
  ];

  const loadNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.reverse()); // Mới nhất lên trên
    } catch(e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadNotifications();
    window.addEventListener('new_notification', loadNotifications);
    return () => window.removeEventListener('new_notification', loadNotifications);
  }, []);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotif(false);
      }
      if (themeRef.current && !themeRef.current.contains(event.target)) {
        setShowTheme(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  const toggleDarkMode = () => {
    const isDark = document.body.classList.toggle('dark-theme');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  };
  
  const changeThemeColor = (colorHex) => {
    document.documentElement.style.setProperty('--base-blue', colorHex);
    document.documentElement.style.setProperty('--primary-color', colorHex);
    localStorage.setItem('primaryColor', colorHex);
    setShowTheme(false);
  };
  
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAllAsRead = async () => {
    try {
      const unreads = notifications.filter(n => !n.isRead);
      const updatePromises = unreads.map(n => api.put(`/notifications/${n.id}`, { ...n, isRead: true }));
      await Promise.all(updatePromises);
      
      const updated = notifications.map(n => ({ ...n, isRead: true }));
      setNotifications(updated);
    } catch(e) {
      console.error(e);
    }
  };

  const handleNotificationClick = async (notif) => {
    // Đánh dấu đã đọc
    if (!notif.isRead) {
      try {
        const updated = { ...notif, isRead: true };
        await api.put(`/notifications/${notif.id}`, updated);
        setNotifications(notifications.map(n => n.id === notif.id ? updated : n));
      } catch(e) { console.error(e) }
    }
    
    // Đóng dropdown thông báo
    setShowNotif(false);

    // Chuyển hướng
    if (notif.type === 'DEAL' && notif.referenceId) {
      navigate(`/deals?id=${notif.referenceId}`);
    }
  };

  return (
    <header className="base-header">
      <div className="header-left">
        <div className="app-icon">
          <span style={{ fontWeight: 800, fontSize: '16px', letterSpacing: '0.5px', color: '#ffffff' }}>NEXTHOME CRM</span>
        </div>
        <div className="search-box" onClick={() => window.dispatchEvent(new Event('open_global_search'))} style={{ cursor: 'text', position: 'relative' }}>
          <input type="text" placeholder="Tìm kiếm (Ctrl + K)" readOnly style={{ cursor: 'text' }} />
          <Search size={14} className="search-icon" />
        </div>
      </div>

      <nav className="header-nav">
        <NavLink to="/deals" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}><Briefcase size={16}/> Thương vụ</NavLink>
        <NavLink to="/contacts" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}><Users size={16}/> Liên hệ</NavLink>
        <NavLink to="/customers" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}><Target size={16}/> Khách hàng</NavLink>
        <NavLink to="/projects" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}><Grid size={16}/> Dự án</NavLink>
        <NavLink to="/activities" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}><Activity size={16}/> Hoạt động</NavLink>
        <NavLink to="/campaigns" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}><Menu size={16}/> Chiến dịch</NavLink>
        {isManager && (
          <NavLink to="/revenue" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}><Target size={16}/> Ghi nhận DS</NavLink>
        )}
        {isManager && (
          <NavLink to="/dashboard" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}><BarChart2 size={16}/> Báo cáo & Dashboard</NavLink>
        )}
        {isManager && (
          <NavLink to="/settings" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}><Settings size={16}/> Nhân sự</NavLink>
        )}
        {isAdmin && (
          <NavLink to="/recycle-bin" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}><Trash size={16}/> Thùng rác</NavLink>
        )}
        {isAdmin && (
          <NavLink to="/audit-logs" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}><Shield size={16}/> Logs</NavLink>
        )}
      </nav>

      <div className="header-right">
        <div style={{ position: 'relative' }} ref={themeRef}>
          <button className="icon-btn" title="Đổi màu giao diện" onClick={() => setShowTheme(!showTheme)}><Palette size={18} /></button>
          {showTheme && (
            <div className="notification-dropdown" style={{ width: '200px', right: 0, left: 'auto', padding: '12px' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '12px', color: 'var(--text-main)' }}>Chọn màu chủ đạo</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {colors.map(c => (
                  <div 
                    key={c.value} 
                    title={c.name}
                    onClick={() => changeThemeColor(c.value)}
                    style={{
                      width: '24px', height: '24px', borderRadius: '50%', backgroundColor: c.value, 
                      cursor: 'pointer', border: '2px solid white', boxShadow: '0 0 0 1px var(--border-color)'
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <button className="icon-btn" title="Chế độ sáng tối" onClick={toggleDarkMode}><Moon size={18} /></button>
        
        <div className="notification-wrapper" ref={notifRef}>
          <button className="icon-btn" style={{ position: 'relative' }} title="Thông báo" onClick={() => setShowNotif(!showNotif)}>
            <Bell size={18} />
            {unreadCount > 0 && <span className="badge-notification">{unreadCount}</span>}
          </button>
          
          {showNotif && (
            <div className="notification-dropdown">
              <div className="notif-header">
                <h4>Thông báo</h4>
                {unreadCount > 0 && <button className="btn-mark-read" onClick={markAllAsRead}>Đánh dấu đã đọc</button>}
              </div>
              <div className="notif-list">
                {notifications.length === 0 ? (
                  <div className="notif-empty">Chưa có thông báo nào</div>
                ) : (
                  notifications.map(notif => (
                    <div 
                      key={notif.id} 
                      className={`notif-item ${notif.isRead ? 'read' : 'unread'}`}
                      onClick={() => handleNotificationClick(notif)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="notif-icon"><CheckCircle size={16} /></div>
                      <div className="notif-content">
                        <p>{notif.message}</p>
                        <small>{new Date(notif.timestamp).toLocaleString('vi-VN')}</small>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
        
        {currentUser && (
          <div className="user-profile" title={`Role: ${currentUser.role}`}>
            <img src={currentUser.avatar} alt="User" className="avatar-img" />
            <span style={{ fontSize: '13px', marginLeft: '6px', fontWeight: 500 }}>{currentUser.name}</span>
          </div>
        )}

        <button className="icon-btn" onClick={handleLogout} title="Đăng xuất" style={{ marginLeft: '8px' }}>
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
};

export default Header;
