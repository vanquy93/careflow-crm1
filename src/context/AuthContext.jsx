import React, { createContext, useState, useContext, useEffect } from 'react';
import { api } from '../api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  
  const [users, setUsers] = useState([]);

  // Fetch Users from Server
  useEffect(() => {
    const fetchUsers = async () => {
      if (!currentUser) return; // Wait until logged in to fetch users list
      try {
        const response = await api.get('/users');
        setUsers(response.data);
      } catch (err) {
        console.error("Lỗi khi tải danh sách nhân sự từ Server:", err);
      }
    };
    fetchUsers();
  }, [currentUser]);

  const login = async (email, password) => {
    try {
      const res = await api.post('/login', { email, password });
      const { token, user } = res.data;
      
      setCurrentUser(user);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', token);
      return true;
    } catch (err) {
      console.error('Login failed:', err);
      return false;
    }
  };

  const register = async (userData) => {
    const exists = users.find(u => u.email === userData.email);
    if (exists) return false;

    const newUser = {
      id: `EMP_${Date.now()}`,
      name: userData.name,
      email: userData.email,
      phone: userData.phone || '',
      password: userData.password || '12345678',
      mustChangePassword: true,
      role: userData.role,
      permissions: userData.permissions || [],
      avatar: `https://i.pravatar.cc/150?u=${userData.email}`,
      kpi: { target: userData.kpiTarget || 1000000000, achieved: 0 }
    };

    try {
      await api.post('/users', newUser);
      setUsers([...users, newUser]);
      const res = await api.post('/login', { email: userData.email, password: userData.password || '12345678' });
      setCurrentUser(res.data.user);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      localStorage.setItem('token', res.data.token);
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const adminAddUser = async (userData) => {
    const exists = users.find(u => u.email === userData.email);
    if (exists) return false;

    const newUser = {
      id: `EMP_${Date.now()}`,
      name: userData.name,
      email: userData.email,
      phone: userData.phone || '',
      password: userData.password || '12345678',
      mustChangePassword: true,
      role: userData.role,
      permissions: userData.permissions || [],
      avatar: `https://i.pravatar.cc/150?u=${userData.email}`,
      kpi: { target: userData.kpiTarget || 1000000000, achieved: 0 }
    };

    await api.post('/users', newUser);
    setUsers([...users, newUser]);
    return true;
  };

  const adminUpdateUser = async (id, data) => {
    const targetUser = users.find(u => u.id === id);
    if (!targetUser) return;
    
    const updatedUser = { ...targetUser, ...data, kpi: { ...targetUser.kpi, target: data.kpiTarget } };
    await api.put(`/users/${id}`, updatedUser);
    setUsers(users.map(u => u.id === id ? updatedUser : u));
  };

  const adminDeleteUser = async (id) => {
    if (currentUser?.id === id) return false;
    await api.delete(`/users/${id}`);
    setUsers(users.filter(u => u.id !== id));
    return true;
  };

  const adminResetPassword = async (id) => {
    const targetUser = users.find(u => u.id === id);
    if (!targetUser) return false;
    const updatedUser = { ...targetUser, password: '12345678', mustChangePassword: true };
    await api.put(`/users/${id}`, updatedUser);
    setUsers(users.map(u => u.id === id ? updatedUser : u));
    return true;
  };

  const updatePassword = async (id, newPassword) => {
    const targetUser = users.find(u => u.id === id);
    if (!targetUser) return false;
    const updatedUser = { ...targetUser, password: newPassword, mustChangePassword: false };
    await api.put(`/users/${id}`, updatedUser);
    setUsers(users.map(u => u.id === id ? updatedUser : u));
    if (currentUser?.id === id) {
      setCurrentUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
    return true;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ 
      currentUser, 
      login, 
      register, 
      logout, 
      isAdmin: currentUser?.role === 'Admin',
      isManager: currentUser?.role === 'Manager' || currentUser?.role === 'Admin',
      hasPermission: (perm) => currentUser?.permissions?.includes(perm) || currentUser?.role === 'Admin',
      users,
      adminAddUser,
      adminUpdateUser,
      adminDeleteUser,
      adminResetPassword,
      updatePassword
    }}>
      {children}
    </AuthContext.Provider>
  );
};
