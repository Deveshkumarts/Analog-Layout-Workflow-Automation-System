import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { BLOCK_TYPES, TECH_NODES, COMPLEXITY_LEVELS, PRIORITIES, getStatusClass, getPriorityClass, getInitials } from '../utils/helpers';

function BlockModal({ block, onClose, onSave }) {
  const [form, setForm] = useState(block || { name: '', type: 'Inverter', description: '', estimatedArea: '', technologyNode: '28nm', complexityLevel: 'Medium', priority: 'Medium', baseHours: '', dueDate: '' });
  const [aiHours, setAiHours] = useState(null);

  const predictHours = () => {
    api.post('/blocks/predict-effort', { type: form.type, technologyNode: form.technologyNode, complexityLevel: form.complexityLevel })
      .then(r => { setAiHours(r.data.predictedHours); setForm(f => ({ ...f, baseHours: r.data.predictedHours })); })
      .catch(() => toast.error('Prediction failed'));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (block?._id) {
        await api.put(`/blocks/${block._id}`, form);
        toast.success('Block updated');
      } else {
        await api.post('/blocks', form);
        toast.success('Block created');
      }
      onSave();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal animate-slide" onClick={e => e.stopPropagation()}>
        <h3>{block?._id ? 'Edit Block' : 'Create New Block'}</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group"><label>Block Name</label><input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. INV_5T_Core" /></div>
          <div className="form-row">
            <div className="form-group"><label>Type</label><select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>{BLOCK_TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
            <div className="form-group"><label>Technology Node</label><select value={form.technologyNode} onChange={e => setForm({ ...form, technologyNode: e.target.value })}>{TECH_NODES.map(t => <option key={t}>{t}</option>)}</select></div>
          </div>
          <div className="form-group"><label>Description</label><textarea rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
          <div className="form-row">
            <div className="form-group"><label>Estimated Area (µm²)</label><input type="number" step="0.1" required value={form.estimatedArea} onChange={e => setForm({ ...form, estimatedArea: e.target.value })} /></div>
            <div className="form-group"><label>Complexity</label><select value={form.complexityLevel} onChange={e => setForm({ ...form, complexityLevel: e.target.value })}>{COMPLEXITY_LEVELS.map(c => <option key={c}>{c}</option>)}</select></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Priority</label><select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>{PRIORITIES.map(p => <option key={p}>{p}</option>)}</select></div>
            <div className="form-group"><label>Due Date</label><input type="date" value={form.dueDate?.slice(0, 10) || ''} onChange={e => setForm({ ...form, dueDate: e.target.value })} /></div>
          </div>
          <div className="form-group">
            <label>Base Hours {aiHours && <span style={{ color: 'var(--cyan)' }}>(AI: {aiHours}h)</span>}</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input type="number" step="0.1" value={form.baseHours} onChange={e => setForm({ ...form, baseHours: e.target.value })} style={{ flex: 1 }} />
              <button type="button" className="btn btn-secondary btn-sm" onClick={predictHours}>🤖 AI Predict</button>
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">{block?._id ? 'Update' : 'Create'} Block</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AssignModal({ block, onClose, onAssign }) {
  const [engineers, setEngineers] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [tab, setTab] = useState('ai');

  useEffect(() => {
    api.get('/users/engineers').then(r => setEngineers(r.data)).catch(() => {});
    api.get(`/blocks/${block._id}/suggest-engineer`).then(r => setSuggestions(r.data)).catch(() => {});
  }, [block._id]);

  const assign = async (engId) => {
    try {
      const { data } = await api.post(`/blocks/${block._id}/assign`, { engineerId: engId });
      toast.success('Engineer assigned');
      if (data.warning) toast.warn(data.warning);
      onAssign();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal animate-slide" onClick={e => e.stopPropagation()} style={{ maxWidth: 620 }}>
        <h3>Assign Engineer to "{block.name}"</h3>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button className={`btn btn-sm ${tab === 'ai' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('ai')}>🤖 AI Suggestions</button>
          <button className={`btn btn-sm ${tab === 'all' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('all')}>👥 All Engineers</button>
        </div>
        {tab === 'ai' ? suggestions.map(s => (
          <div key={s.engineer._id} className="approval-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="user-avatar">{getInitials(s.engineer.name)}</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{s.engineer.name}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  {s.skillMatch ? '✅ Skill match' : '❌ No skill match'} • {s.currentWorkload} active • ⭐ {s.engineer.rating}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: s.matchPercentage > 70 ? 'var(--green)' : s.matchPercentage > 40 ? 'var(--orange)' : 'var(--red)' }}>{s.matchPercentage}%</span>
              <button className="btn btn-primary btn-sm" onClick={() => assign(s.engineer._id)}>Assign</button>
            </div>
          </div>
        )) : engineers.map(e => (
          <div key={e._id} className="approval-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="user-avatar">{getInitials(e.name)}</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{e.name}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{e.skills?.join(', ')} • {e.activeBlocks} active</div>
              </div>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => assign(e._id)}>Assign</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Blocks() {
  const { user } = useAuth();
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editBlock, setEditBlock] = useState(null);
  const [assignBlock, setAssignBlock] = useState(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');

  const isManager = user?.role === 'manager' || user?.role === 'admin';

  const fetchBlocks = () => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (filterStatus) params.set('status', filterStatus);
    if (filterType) params.set('type', filterType);
    if (isManager) params.set('assignedTo', '');
    api.get(`/blocks?${params}`).then(r => { setBlocks(r.data.blocks); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchBlocks(); }, [search, filterStatus, filterType]);

  const deleteBlock = async (id) => {
    if (!confirm('Delete this block?')) return;
    try { await api.delete(`/blocks/${id}`); toast.success('Deleted'); fetchBlocks(); } catch { toast.error('Delete failed'); }
  };

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <div className="animate-fade">
      <div className="topbar">
        <h2>🧱 Block Management</h2>
        <div className="topbar-actions">
          {isManager && <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ New Block</button>}
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div className="search-bar" style={{ flex: 1, minWidth: 200 }}>
          <span>🔍</span>
          <input placeholder="Search blocks..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ minWidth: 140 }}>
          <option value="">All Stages</option>
          {['Not Started','In Progress','DRC','LVS','Review','Completed'].map(s => <option key={s}>{s}</option>)}
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ minWidth: 140 }}>
          <option value="">All Types</option>
          {BLOCK_TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="glass-card" style={{ padding: 0, overflow: 'auto' }}>
        <table className="data-table">
          <thead><tr>
            <th>Block Name</th><th>Type</th><th>Tech Node</th><th>Complexity</th><th>Status</th><th>Priority</th><th>Assigned To</th><th>Est. Hours</th><th>Risk</th>{isManager && <th>Actions</th>}
          </tr></thead>
          <tbody>
            {blocks.map(b => (
              <tr key={b._id}>
                <td style={{ fontWeight: 600 }}>{b.name}</td>
                <td><span className="tag">{b.type}</span></td>
                <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8rem' }}>{b.technologyNode}</td>
                <td>{b.complexityLevel}</td>
                <td><span className={`status-badge ${getStatusClass(b.status)}`}>{b.status}</span></td>
                <td><span className={`priority-badge ${getPriorityClass(b.priority)}`}>{b.priority}</span></td>
                <td>{b.assignedTo ? (<span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span className="mini-avatar" style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg, var(--cyan), var(--purple))', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.55rem', fontWeight: 700, color: 'var(--bg-primary)' }}>{getInitials(b.assignedTo.name)}</span>{b.assignedTo.name}</span>) : <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>}</td>
                <td style={{ fontFamily: "'JetBrains Mono', monospace" }}>{b.estimatedHours?.toFixed(0)}h</td>
                <td>{b.delayRisk && <span className={`risk-${b.delayRisk.toLowerCase()}`} style={{ fontWeight: 700, fontSize: '0.8rem' }}>⚡{b.delayRisk}</span>}</td>
                {isManager && <td>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => setAssignBlock(b)} title="Assign">👤</button>
                    <button className="btn btn-secondary btn-sm" onClick={() => setEditBlock(b)} title="Edit">✏️</button>
                    <button className="btn btn-sm" style={{ color: 'var(--red)', background: 'none', border: '1px solid rgba(239,68,68,0.3)' }} onClick={() => deleteBlock(b._id)} title="Delete">🗑️</button>
                  </div>
                </td>}
              </tr>
            ))}
          </tbody>
        </table>
        {blocks.length === 0 && <div className="empty-state"><div className="icon">🧱</div><h3>No blocks found</h3></div>}
      </div>

      {(showCreate || editBlock) && <BlockModal block={editBlock} onClose={() => { setShowCreate(false); setEditBlock(null); }} onSave={() => { setShowCreate(false); setEditBlock(null); fetchBlocks(); }} />}
      {assignBlock && <AssignModal block={assignBlock} onClose={() => setAssignBlock(null)} onAssign={() => { setAssignBlock(null); fetchBlocks(); }} />}
    </div>
  );
}
