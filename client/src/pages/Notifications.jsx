import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../utils/api';
import { timeAgo } from '../utils/helpers';

const TYPE_ICONS = { assignment: '👤', status_update: '🔄', approval_request: '📤', approval_result: '✅', delay_alert: '⚠️', system: '🔔' };
const TYPE_COLORS = { assignment: 'rgba(59,130,246,0.15)', status_update: 'rgba(168,85,247,0.15)', approval_request: 'rgba(0,240,255,0.15)', approval_result: 'rgba(16,185,129,0.15)', delay_alert: 'rgba(239,68,68,0.15)', system: 'rgba(245,158,11,0.15)' };

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetch = () => {
    api.get('/notifications').then(r => { setNotifications(r.data.notifications); setUnread(r.data.unreadCount); setLoading(false); }).catch(() => setLoading(false));
  };
  useEffect(() => { fetch(); }, []);

  const markRead = async (id) => { await api.put(`/notifications/${id}/read`); fetch(); };
  const markAllRead = async () => { await api.put('/notifications/read-all'); toast.success('All marked as read'); fetch(); };

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <div className="animate-fade">
      <div className="topbar">
        <h2>🔔 Notifications</h2>
        <div className="topbar-actions">
          {unread > 0 && <span className="tag" style={{ background: 'rgba(239,68,68,0.15)', color: 'var(--red)' }}>{unread} unread</span>}
          <button className="btn btn-secondary btn-sm" onClick={markAllRead}>Mark All Read</button>
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="empty-state"><div className="icon">🔔</div><h3>No notifications</h3></div>
      ) : notifications.map(n => (
        <div key={n._id} className={`notification-item ${n.read ? '' : 'unread'}`} onClick={() => !n.read && markRead(n._id)}>
          <div className="notification-icon" style={{ background: TYPE_COLORS[n.type] || 'rgba(0,240,255,0.1)' }}>
            {TYPE_ICONS[n.type] || '🔔'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ fontWeight: n.read ? 400 : 600, fontSize: '0.9rem' }}>{n.title}</div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{timeAgo(n.createdAt)}</span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 2 }}>{n.message}</p>
            {n.blockId && <span className="tag" style={{ marginTop: 4 }}>{n.blockId.name || 'Block'}</span>}
          </div>
          {!n.read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--cyan)', flexShrink: 0, marginTop: 6 }} />}
        </div>
      ))}
    </div>
  );
}
