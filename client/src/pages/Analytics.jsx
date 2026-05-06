import { useState, useEffect } from 'react';
import api from '../utils/api';
import { STATUS_COLORS } from '../utils/helpers';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';

const chartTooltip = { contentStyle: { background: '#1e293b', border: '1px solid rgba(0,240,255,0.2)', borderRadius: 8, color: '#f1f5f9' } };

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/analytics').then(r => { setData(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;
  if (!data) return <div className="empty-state"><div className="icon">📈</div><h3>No analytics data</h3></div>;

  return (
    <div className="animate-fade">
      <div className="topbar"><h2>📈 Analytics & Reports</h2></div>

      <div className="grid-2" style={{ marginBottom: 20 }}>
        <div className="chart-container">
          <h4>📅 Weekly Progress</h4>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={data.weeklyData}>
              <XAxis dataKey="week" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} allowDecimals={false} />
              <Tooltip {...chartTooltip} />
              <Line type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981' }} name="Completed" />
              <Line type="monotone" dataKey="created" stroke="#00f0ff" strokeWidth={2} dot={{ fill: '#00f0ff' }} name="Created" />
              <Legend />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <h4>👤 Engineer Performance</h4>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.engineerPerformance}>
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} angle={-15} textAnchor="end" height={50} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} allowDecimals={false} />
              <Tooltip {...chartTooltip} />
              <Bar dataKey="completedBlocks" fill="#10b981" name="Completed" radius={[4,4,0,0]} />
              <Bar dataKey="activeBlocks" fill="#3b82f6" name="Active" radius={[4,4,0,0]} />
              <Legend />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="chart-container" style={{ marginBottom: 20 }}>
        <h4>⏱️ Efficiency: Estimated vs Actual Hours</h4>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data.efficiencyData}>
            <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} angle={-15} textAnchor="end" height={60} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <Tooltip {...chartTooltip} />
            <Bar dataKey="estimated" fill="#00f0ff" name="Estimated" radius={[4,4,0,0]} />
            <Bar dataKey="actual" fill="#a855f7" name="Actual" radius={[4,4,0,0]} />
            <Legend />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Engineer Stats Table */}
      <div className="glass-card">
        <h4 style={{ marginBottom: 16 }}>👥 Engineer Summary</h4>
        <table className="data-table">
          <thead><tr><th>Engineer</th><th>Completed</th><th>Active</th><th>Hours Logged</th><th>Rating</th></tr></thead>
          <tbody>
            {data.engineerPerformance?.map((e, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 600 }}>{e.name}</td>
                <td style={{ fontFamily: "'JetBrains Mono', monospace" }}>{e.completedBlocks}</td>
                <td style={{ fontFamily: "'JetBrains Mono', monospace" }}>{e.activeBlocks}</td>
                <td style={{ fontFamily: "'JetBrains Mono', monospace" }}>{e.hoursLogged}h</td>
                <td>⭐ {e.rating}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
