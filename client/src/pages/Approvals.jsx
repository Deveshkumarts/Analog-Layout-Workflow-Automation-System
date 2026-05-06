import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { getInitials, timeAgo } from '../utils/helpers';

export default function Approvals() {
  const { user } = useAuth();
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const isManager = user?.role === 'manager' || user?.role === 'admin';

  const fetchBlocks = () => {
    api.get('/blocks?status=Review').then(r => { setBlocks(r.data.blocks); setLoading(false); }).catch(() => setLoading(false));
  };
  useEffect(() => { fetchBlocks(); }, []);

  const handleReview = async (blockId, action) => {
    try {
      await api.post(`/blocks/${blockId}/review`, { action, comments: comment || (action === 'approved' ? 'Approved' : 'Needs revision') });
      toast.success(action === 'approved' ? 'Block approved! ✅' : 'Block rejected, sent back for rework');
      setComment('');
      fetchBlocks();
    } catch (err) { toast.error(err.response?.data?.message || 'Review failed'); }
  };

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <div className="animate-fade">
      <div className="topbar">
        <h2>✅ Approval Queue</h2>
        <span className="tag">{blocks.length} pending</span>
      </div>

      {blocks.length === 0 ? (
        <div className="empty-state"><div className="icon">✅</div><h3>No pending approvals</h3><p style={{ color: 'var(--text-muted)' }}>All blocks are up to date</p></div>
      ) : blocks.map(b => (
        <div key={b._id} className="approval-card animate-slide">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div>
              <h4 style={{ fontSize: '1rem', marginBottom: 4 }}>{b.name}</h4>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span className="tag">{b.type}</span>
                <span className="tag">{b.technologyNode}</span>
                <span className="tag">{b.complexityLevel}</span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Submitted {timeAgo(b.approvals?.[b.approvals.length - 1]?.submittedAt || b.updatedAt)}</div>
              {b.delayRisk && <span className={`risk-${b.delayRisk.toLowerCase()}`} style={{ fontWeight: 700, fontSize: '0.8rem' }}>⚡ {b.delayRisk} Risk</span>}
            </div>
          </div>

          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 12 }}>{b.description || 'No description provided'}</p>

          <div className="grid-3" style={{ marginBottom: 12 }}>
            <div><span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Estimated</span><div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>{b.estimatedHours?.toFixed(0)}h</div></div>
            <div><span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Actual</span><div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>{b.actualHours?.toFixed(0)}h</div></div>
            <div><span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Assigned</span><div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}>{b.assignedTo && <><div className="mini-avatar" style={{ width: 22, height: 22, borderRadius: '50%', background: 'linear-gradient(135deg, var(--cyan), var(--purple))', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.5rem', fontWeight: 700, color: 'var(--bg-primary)' }}>{getInitials(b.assignedTo.name)}</div>{b.assignedTo.name}</>}</div></div>
          </div>

          {/* Past approvals */}
          {b.approvals?.filter(a => a.status !== 'pending').length > 0 && (
            <div style={{ marginBottom: 12, padding: 10, background: 'rgba(0,0,0,0.2)', borderRadius: 8, fontSize: '0.8rem' }}>
              <div style={{ fontWeight: 600, marginBottom: 4, color: 'var(--text-muted)' }}>History:</div>
              {b.approvals.filter(a => a.status !== 'pending').map((a, i) => (
                <div key={i} style={{ color: a.status === 'approved' ? 'var(--green)' : 'var(--red)' }}>
                  {a.status === 'approved' ? '✅' : '❌'} {a.status} – {a.comments || 'No comment'}
                </div>
              ))}
            </div>
          )}

          {isManager && (
            <div>
              <textarea rows={2} placeholder="Add comments (optional)..." value={comment} onChange={e => setComment(e.target.value)} style={{ width: '100%', marginBottom: 10 }} />
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-success" onClick={() => handleReview(b._id, 'approved')}>✅ Approve</button>
                <button className="btn btn-danger" onClick={() => handleReview(b._id, 'rejected')}>❌ Reject</button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
