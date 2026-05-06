import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { STATUS_LIST, STATUS_COLORS, getInitials, getPriorityClass } from '../utils/helpers';

export default function Kanban() {
  const { user } = useAuth();
  const [blocks, setBlocks] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const isManager = user?.role === 'manager' || user?.role === 'admin';

  const fetchBlocks = () => {
    const params = isManager ? '' : `?assignedTo=${user?._id}`;
    api.get(`/blocks${params}`).then(r => { setBlocks(r.data.blocks); setLoading(false); }).catch(() => setLoading(false));
  };
  useEffect(() => { fetchBlocks(); }, []);

  const moveBlock = async (block, newStatus) => {
    try {
      await api.post(`/blocks/${block._id}/status`, { status: newStatus, comment: `Moved to ${newStatus}` });
      toast.success(`Moved to ${newStatus}`);
      fetchBlocks();
    } catch (err) { toast.error(err.response?.data?.message || 'Invalid transition'); }
  };

  const submitForReview = async (block) => {
    try {
      await api.post(`/blocks/${block._id}/submit-review`);
      toast.success('Submitted for review');
      fetchBlocks();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  const columns = STATUS_LIST.map(status => ({
    status,
    color: STATUS_COLORS[status],
    blocks: blocks.filter(b => b.status === status),
  }));

  return (
    <div className="animate-fade">
      <div className="topbar">
        <h2>📋 Kanban Workflow Board</h2>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{blocks.length} blocks</span>
      </div>

      <div className="kanban-board">
        {columns.map(col => (
          <div className="kanban-column" key={col.status}>
            <div className="kanban-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: col.color }} />
                {col.status}
              </div>
              <span className="count">{col.blocks.length}</span>
            </div>
            <div className="kanban-cards">
              {col.blocks.map(b => (
                <div className="kanban-card" key={b._id} onClick={() => setSelected(b)}>
                  <div className="card-title">{b.name}</div>
                  <div className="card-type">{b.type} • {b.technologyNode}</div>
                  <div style={{ marginBottom: 8 }}>
                    <span className={`priority-badge ${getPriorityClass(b.priority)}`}>{b.priority}</span>
                    {b.delayRisk && <span className={`risk-${b.delayRisk.toLowerCase()}`} style={{ marginLeft: 6, fontSize: '0.7rem', fontWeight: 700 }}>⚡{b.delayRisk}</span>}
                  </div>
                  {b.estimatedHours > 0 && (
                    <div className="progress-bar" style={{ marginBottom: 8 }}>
                      <div className="progress-fill" style={{ width: `${Math.min((b.actualHours / b.estimatedHours) * 100, 100)}%` }} />
                    </div>
                  )}
                  <div className="card-meta">
                    {b.assignedTo ? (
                      <div className="card-assignee"><div className="mini-avatar">{getInitials(b.assignedTo.name)}</div>{b.assignedTo.name.split(' ')[0]}</div>
                    ) : <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>}
                    <span>{b.estimatedHours?.toFixed(0)}h</span>
                  </div>
                </div>
              ))}
              {col.blocks.length === 0 && <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)', fontSize: '0.8rem' }}>No blocks</div>}
            </div>
          </div>
        ))}
      </div>

      {/* Block Detail Modal */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal animate-slide" onClick={e => e.stopPropagation()}>
            <h3>{selected.name}</h3>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
              <span className="tag">{selected.type}</span>
              <span className="tag">{selected.technologyNode}</span>
              <span className={`priority-badge ${getPriorityClass(selected.priority)}`}>{selected.priority}</span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 16 }}>{selected.description || 'No description'}</p>

            <div className="grid-2" style={{ marginBottom: 16 }}>
              <div><span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Estimated</span><div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>{selected.estimatedHours?.toFixed(1)}h</div></div>
              <div><span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Actual</span><div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>{selected.actualHours?.toFixed(1)}h</div></div>
              <div><span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>AI Predicted</span><div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: 'var(--cyan)' }}>{selected.aiPredictedHours?.toFixed(1) || 'N/A'}h</div></div>
              <div><span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Area</span><div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>{selected.estimatedArea} µm²</div></div>
            </div>

            {/* Status History */}
            <h4 style={{ fontSize: '0.85rem', marginBottom: 8, color: 'var(--text-secondary)' }}>Status History</h4>
            <div style={{ marginBottom: 16 }}>
              {selected.statusHistory?.map((h, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', fontSize: '0.8rem' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_COLORS[h.status], flexShrink: 0 }} />
                  <span style={{ fontWeight: 600 }}>{h.status}</span>
                  <span style={{ color: 'var(--text-muted)' }}>– {h.comment}</span>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {selected.status === 'Not Started' && (selected.assignedTo?._id === user?._id || isManager) &&
                <button className="btn btn-primary btn-sm" onClick={() => { moveBlock(selected, 'In Progress'); setSelected(null); }}>▶ Start</button>}
              {selected.status === 'In Progress' && (selected.assignedTo?._id === user?._id || isManager) &&
                <button className="btn btn-primary btn-sm" onClick={() => { moveBlock(selected, 'DRC'); setSelected(null); }}>→ DRC</button>}
              {selected.status === 'DRC' && (selected.assignedTo?._id === user?._id || isManager) &&
                <button className="btn btn-primary btn-sm" onClick={() => { moveBlock(selected, 'LVS'); setSelected(null); }}>→ LVS</button>}
              {selected.status === 'LVS' && (selected.assignedTo?._id === user?._id || isManager) &&
                <button className="btn btn-primary btn-sm" onClick={() => { submitForReview(selected); setSelected(null); }}>📤 Submit Review</button>}
              <button className="btn btn-secondary btn-sm" onClick={() => setSelected(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
