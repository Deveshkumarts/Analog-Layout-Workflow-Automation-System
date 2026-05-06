import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getInitials } from '../utils/helpers';
import { useState, useEffect } from 'react';
import api from '../utils/api';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    api.get('/notifications?unreadOnly=true').then(r => setUnread(r.data.unreadCount)).catch(() => {});
    const iv = setInterval(() => {
      api.get('/notifications?unreadOnly=true').then(r => setUnread(r.data.unreadCount)).catch(() => {});
    }, 30000);
    return () => clearInterval(iv);
  }, []);

  const isActive = (path) => location.pathname === path ? 'nav-item active' : 'nav-item';

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">FS</div>
        <div>
          <h1>FlowSync IC</h1>
          <span>Analog Workflow Automation</span>
        </div>
      </div>

      <nav>
        <div className="nav-section">
          <div className="nav-section-title">Main</div>
          <NavLink to="/dashboard" className={isActive('/dashboard')}>
            <span className="icon">📊</span> Dashboard
          </NavLink>
          <NavLink to="/blocks" className={isActive('/blocks')}>
            <span className="icon">🧱</span> Blocks
          </NavLink>
          <NavLink to="/kanban" className={isActive('/kanban')}>
            <span className="icon">📋</span> Kanban Board
          </NavLink>
        </div>

        <div className="nav-section">
          <div className="nav-section-title">Workflow</div>
          <NavLink to="/approvals" className={isActive('/approvals')}>
            <span className="icon">✅</span> Approvals
          </NavLink>
          <NavLink to="/analytics" className={isActive('/analytics')}>
            <span className="icon">📈</span> Analytics
          </NavLink>
          <NavLink to="/notifications" className={isActive('/notifications')}>
            <span className="icon">🔔</span> Notifications
            {unread > 0 && <span className="badge">{unread}</span>}
          </NavLink>
        </div>
      </nav>

      <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border-glass)', paddingTop: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, padding: '0 8px' }}>
          {user?.avatar ? (
            <img src={user.avatar} alt="" style={{ width: 34, height: 34, borderRadius: '50%' }} />
          ) : (
            <div className="user-avatar">{getInitials(user?.name)}</div>
          )}
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{user?.name}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{user?.role}</div>
          </div>
        </div>
        <button className="nav-item" onClick={logout} style={{ color: 'var(--red)' }}>
          <span className="icon">🚪</span> Sign Out
        </button>
      </div>
    </aside>
  );
}
