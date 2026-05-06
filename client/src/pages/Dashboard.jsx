import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { STATUS_COLORS, getInitials } from '../utils/helpers';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/stats').then(r => { setStats(r.data); setLoading(false); }).catch(() => setLoading(false));
    const iv = setInterval(() => { api.get('/dashboard/stats').then(r => setStats(r.data)).catch(() => {}); }, 15000);
    return () => clearInterval(iv);
  }, []);

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;
  if (!stats) return <div className="empty-state"><div className="icon">📊</div><h3>No data available</h3></div>;

  const isManager = user?.role === 'manager' || user?.role === 'admin';
  const stageData = Object.entries(stats.blocksByStage).map(([name, value]) => ({ name, value }));
  const typeData = Object.entries(stats.blocksByType).map(([name, value]) => ({ name, value }));
  const COLORS = Object.values(STATUS_COLORS);

  return (
    <div className="animate-fade">
      <div className="topbar">
        <div>
          <h2>{isManager ? 'Manager' : 'Engineer'} Dashboard</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Welcome back, {user?.name}</p>
        </div>
        <div className="topbar-actions">
          <span className="tag">{user?.role?.toUpperCase()}</span>
          {user?.avatar ? <img src={user.avatar} alt="" style={{ width: 36, height: 36, borderRadius: '50%' }} /> : <div className="user-avatar">{getInitials(user?.name)}</div>}
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(0,240,255,0.12)', color: 'var(--cyan)' }}>🧱</div>
          <div className="stat-value">{stats.totalBlocks}</div>
          <div className="stat-label">Total Blocks</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.12)', color: 'var(--green)' }}>✅</div>
          <div className="stat-value">{stats.completionRate}%</div>
          <div className="stat-label">Completion Rate</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.12)', color: 'var(--orange)' }}>⏳</div>
          <div className="stat-value">{stats.pendingApprovals}</div>
          <div className="stat-label">Pending Approvals</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(239,68,68,0.12)', color: 'var(--red)' }}>⚠️</div>
          <div className="stat-value">{stats.delayRisks?.high || 0}</div>
          <div className="stat-label">High Delay Risks</div>
        </div>
      </div>

      {/* AI Delay Alerts */}
      {stats.delayRisks?.high > 0 && (
        <div className="glass-card" style={{ marginBottom: 20, borderColor: 'rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.05)' }}>
          <h4 style={{ color: 'var(--red)', marginBottom: 8 }}>🤖 AI Delay Alert</h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            {stats.delayRisks.high} block(s) have <span className="risk-high" style={{ fontWeight: 700 }}>HIGH</span> delay risk.
            {stats.delayRisks.medium > 0 && ` ${stats.delayRisks.medium} with medium risk.`}
          </p>
        </div>
      )}

      <div className="grid-2" style={{ marginBottom: 20 }}>
        {/* Blocks by Stage */}
        <div className="chart-container">
          <h4>📊 Blocks by Stage</h4>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={stageData}>
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} angle={-20} textAnchor="end" height={50} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} allowDecimals={false} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(0,240,255,0.2)', borderRadius: 8, color: '#f1f5f9' }} />
              <Bar dataKey="value" radius={[4,4,0,0]}>
                {stageData.map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Blocks by Type */}
        <div className="chart-container">
          <h4>🔧 Blocks by Type</h4>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={typeData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={{ stroke: '#64748b' }}>
                {typeData.map((e, i) => <Cell key={i} fill={['#00f0ff','#a855f7','#3b82f6','#10b981','#f59e0b','#ef4444','#ec4899','#8b5cf6','#06b6d4','#84cc16'][i % 10]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(0,240,255,0.2)', borderRadius: 8, color: '#f1f5f9' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Hours Comparison */}
      <div className="glass-card" style={{ marginBottom: 20 }}>
        <h4 style={{ marginBottom: 12 }}>⏱️ Estimated vs Actual Hours</h4>
        <div className="grid-2">
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4 }}>Estimated</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: 'var(--cyan)' }}>{stats.totalEstimated}h</div>
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4 }}>Actual</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: stats.totalActual > stats.totalEstimated ? 'var(--red)' : 'var(--green)' }}>{stats.totalActual}h</div>
          </div>
        </div>
        <div className="progress-bar" style={{ marginTop: 12 }}>
          <div className="progress-fill" style={{ width: `${Math.min((stats.totalActual / (stats.totalEstimated || 1)) * 100, 100)}%` }} />
        </div>
      </div>

      {/* Recent Blocks */}
      <div className="glass-card">
        <h4 style={{ marginBottom: 16 }}>🕐 Recent Activity</h4>
        {stats.recentBlocks?.map(b => (
          <div key={b._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-glass)' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{b.name}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{b.type} • {b.technologyNode}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className={`status-badge status-${b.status.toLowerCase().replace(/\s+/g, '-')}`}>{b.status}</span>
              {b.delayRisk && <span className={`risk-${b.delayRisk.toLowerCase()}`} style={{ fontSize: '0.7rem', fontWeight: 700 }}>⚡{b.delayRisk}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
