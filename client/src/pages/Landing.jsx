import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Landing() {
  const { user } = useAuth();
  return (
    <div className="landing-page">
      <nav className="landing-nav">
        <div className="landing-nav-brand">
          <div className="logo-icon" style={{ width: 36, height: 36, background: 'linear-gradient(135deg, var(--cyan), var(--purple))', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.9rem', color: 'var(--bg-primary)' }}>FS</div>
          <span style={{ background: 'linear-gradient(135deg, var(--cyan), var(--purple))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>FlowSync IC</span>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          {user ? (
            <Link to="/dashboard" className="btn btn-primary">Go to Dashboard</Link>
          ) : (
            <Link to="/login" className="btn btn-primary">Sign In with Google</Link>
          )}
        </div>
      </nav>
      <section className="landing-hero">
        <div className="hero-content animate-fade">
          <h1>Analog Layout Workflow Automation</h1>
          <p>A centralized project management platform for analog IC layout teams. Manage blocks, track workflows, estimate effort with AI, and deliver tape-outs on time.</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <Link to="/login" className="btn btn-primary" style={{ padding: '14px 32px', fontSize: '1rem' }}>
              🚀 Get Started
            </Link>
          </div>
          <div className="hero-features" style={{ marginTop: 48 }}>
            <div className="hero-feature animate-slide" style={{ animationDelay: '0.1s' }}>
              <div className="feat-icon">🧱</div>
              <h3>Block Management</h3>
              <p>Define and manage layout blocks – Inverter, OTA, Bandgap, PLL and more</p>
            </div>
            <div className="hero-feature animate-slide" style={{ animationDelay: '0.2s' }}>
              <div className="feat-icon">🤖</div>
              <h3>AI-Powered Estimation</h3>
              <p>Smart effort prediction, delay risk analysis, and resource matching</p>
            </div>
            <div className="hero-feature animate-slide" style={{ animationDelay: '0.3s' }}>
              <div className="feat-icon">📋</div>
              <h3>Kanban Workflow</h3>
              <p>Visual pipeline: Not Started → In Progress → DRC → LVS → Review → Completed</p>
            </div>
            <div className="hero-feature animate-slide" style={{ animationDelay: '0.4s' }}>
              <div className="feat-icon">✅</div>
              <h3>Approval System</h3>
              <p>Submit for review, approve or reject with feedback, automatic rework flow</p>
            </div>
            <div className="hero-feature animate-slide" style={{ animationDelay: '0.5s' }}>
              <div className="feat-icon">👥</div>
              <h3>Smart Resource Allocation</h3>
              <p>AI suggests best engineer based on skills, availability, and track record</p>
            </div>
            <div className="hero-feature animate-slide" style={{ animationDelay: '0.6s' }}>
              <div className="feat-icon">📊</div>
              <h3>Real-Time Analytics</h3>
              <p>Dashboards with charts, KPIs, estimated vs actual hours, and delay alerts</p>
            </div>
          </div>
        </div>
      </section>
      <footer style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '0.8rem', borderTop: '1px solid var(--border-glass)' }}>
        FlowSync IC © 2026 – Built for EPIC Build-A-Thon | MERN Stack + Google OAuth 2.0
      </footer>
    </div>
  );
}
