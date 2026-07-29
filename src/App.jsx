import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CRMProvider } from './context/CRMContext';
import Header from './components/Header';
import GlobalSearch from './components/GlobalSearch';
import AIAssistant from './components/AIAssistant';
import GlobalToast from './components/GlobalToast';

import Login from './pages/Login';
import Register from './pages/Register';
import DealsBoard from './pages/Customers';
import Dashboard from './pages/Dashboard';
import Contacts from './pages/Contacts';
import CustomersList from './pages/CustomersList';
import Activities from './pages/Activities';
import Settings from './pages/Settings';
import Campaigns from './pages/Campaigns';
import Revenue from './pages/Revenue';
import Projects from './pages/Projects';
import RecycleBin from './pages/RecycleBin';
import AuditLogs from './pages/AuditLogs';
import ChangePassword from './pages/ChangePassword';
import { ErrorBoundary } from 'react-error-boundary';

function ErrorFallback({error}) {
  return (
    <div role="alert" style={{ padding: 20, color: 'red' }}>
      <p>Something went wrong:</p>
      <pre style={{ color: 'red' }}>{error.message}</pre>
      <pre style={{ color: 'gray', fontSize: 11 }}>{error.stack}</pre>
    </div>
  )
}

const ProtectedRoute = ({ children, requireManager, requireAdmin }) => {
  const { currentUser, isManager, isAdmin } = useAuth();
  const location = useLocation();

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (currentUser.mustChangePassword && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }

  if (!currentUser.mustChangePassword && location.pathname === '/change-password') {
    return <Navigate to="/deals" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/deals" replace />;
  }

  if (requireManager && !isManager) {
    return <Navigate to="/deals" replace />;
  }

  return (
    <div className="app-container">
      <Header />
      <div className="main-wrapper">
        <div className="main-content">
          <div className="content-scrollable">
            <ErrorBoundary FallbackComponent={ErrorFallback}>
              {children}
            </ErrorBoundary>
          </div>
        </div>
      </div>
    </div>
  );
};

function App() {
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.body.classList.add('dark-theme');
    }
    const savedColor = localStorage.getItem('primaryColor');
    if (savedColor) {
      document.documentElement.style.setProperty('--base-blue', savedColor);
      document.documentElement.style.setProperty('--primary-color', savedColor);
    }
    const savedBg = localStorage.getItem('bgColor');
    if (savedBg) {
      document.documentElement.style.setProperty('--bg-body', savedBg);
    }
  }, []);

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <AuthProvider>
        <CRMProvider>
          <Router>
            <GlobalSearch />
            <AIAssistant />
            <GlobalToast />
            <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />
            
            <Route path="/" element={<Navigate to="/deals" replace />} />
            
            <Route path="/deals" element={<ProtectedRoute><DealsBoard /></ProtectedRoute>} />
            <Route path="/contacts" element={<ProtectedRoute><Contacts /></ProtectedRoute>} />
            <Route path="/customers" element={<ProtectedRoute><CustomersList /></ProtectedRoute>} />
            <Route path="/activities" element={<ProtectedRoute><Activities /></ProtectedRoute>} />
            <Route path="/campaigns" element={<ProtectedRoute><Campaigns /></ProtectedRoute>} />
            
            <Route path="/revenue" element={<ProtectedRoute requireManager={true}><Revenue /></ProtectedRoute>} />
            <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute requireManager={true}><Dashboard /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute requireManager={true}><Settings /></ProtectedRoute>} />
            
            {/* Admin Only Routes */}
            <Route path="/recycle-bin" element={<ProtectedRoute requireAdmin={true}><RecycleBin /></ProtectedRoute>} />
            <Route path="/audit-logs" element={<ProtectedRoute requireAdmin={true}><AuditLogs /></ProtectedRoute>} />
          </Routes>
        </Router>
      </CRMProvider>
    </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
