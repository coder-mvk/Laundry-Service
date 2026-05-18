import { useState } from 'react';
import { CRMProvider, useCRM } from './context/CRMContext';
import Sidebar from './components/Sidebar';
import DashboardView from './components/DashboardView';
import EnquiryView from './components/EnquiryView';
import OrdersView from './components/OrdersView';
import CustomersView from './components/CustomersView';
import SubscriptionsView from './components/SubscriptionsView';
import ExpensesView from './components/ExpensesView';
import DataPortability from './components/DataPortability';
import SupabaseDiagnostic from './components/SupabaseDiagnostic';
import './App.css';

function AppContent() {
  const { isDataLoaded, connectionError } = useCRM();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [prefilledForm, setPrefilledForm] = useState(null);
  const [showDiagnostic, setShowDiagnostic] = useState(false);

  const clearPrefilledForm = () => setPrefilledForm(null);

  const handleConvertEnquiry = (draftOrder) => {
    setPrefilledForm(draftOrder);
    setActiveTab('orders');
  };

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView setActiveTab={setActiveTab} setPrefilledForm={setPrefilledForm} />;
      case 'enquiries':
        return <EnquiryView prefilledForm={prefilledForm} clearPrefilledForm={clearPrefilledForm} onConvertEnquiry={handleConvertEnquiry} />;
      case 'orders':
        return <OrdersView prefilledForm={prefilledForm} clearPrefilledForm={clearPrefilledForm} />;
      case 'customers':
        return <CustomersView />;
      case 'subscriptions':
        return <SubscriptionsView />;
      case 'expenses':
        return <ExpensesView prefilledForm={prefilledForm} clearPrefilledForm={clearPrefilledForm} />;
      case 'portability':
        return <DataPortability />;
      default:
        return <DashboardView setActiveTab={setActiveTab} setPrefilledForm={setPrefilledForm} />;
    }
  };

  // ── Loading screen (only shows briefly on first load) ────────────
  if (!isDataLoaded) {
    return (
      <div style={{
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        height: '100vh', width: '100vw', backgroundColor: 'var(--bg-body)',
        flexDirection: 'column', gap: '1rem'
      }}>
        <div style={{
          width: '48px', height: '48px', borderRadius: '50%',
          border: '4px solid rgba(99,102,241,0.15)', borderTopColor: 'var(--primary)',
          animation: 'spin 0.8s linear infinite'
        }} />
        <h3 style={{ color: 'var(--text-main)', fontFamily: 'var(--font-heading)', fontWeight: 700 }}>
          Loading CRM…
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Fetching live data from Supabase</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (connectionError) {
    return (
      <div style={{
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        height: '100vh', width: '100vw', backgroundColor: 'var(--bg-body)',
        flexDirection: 'column', gap: '1rem', padding: '2rem', textAlign: 'center'
      }}>
        <div style={{
          fontSize: '3rem', background: '#fee2e2', width: '5rem', height: '5rem',
          borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>⚠️</div>
        <h2 style={{ color: '#b91c1c', fontFamily: 'var(--font-heading)', fontWeight: 800 }}>
          Database Connection Failed
        </h2>
        <p style={{ color: 'var(--text-muted)', maxWidth: '500px', lineHeight: 1.6 }}>
          Could not connect to Supabase. Please verify your <code style={{ background: '#f1f5f9', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>.env</code> values and that the tables exist.
        </p>
        <div style={{
          background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '8px',
          padding: '0.75rem 1.25rem', fontSize: '0.8rem', color: '#991b1b',
          maxWidth: '600px', wordBreak: 'break-all'
        }}>
          <strong>Error:</strong> {connectionError}
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
          <button
            onClick={() => setShowDiagnostic(true)}
            style={{
              padding: '0.6rem 1.5rem', background: '#1e293b', color: '#fff',
              border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem'
            }}
          >
            🔬 Run Diagnostics
          </button>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '0.6rem 1.5rem', background: 'var(--primary)', color: '#fff',
              border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem'
            }}
          >
            🔄 Retry
          </button>
        </div>
        {showDiagnostic && <SupabaseDiagnostic onClose={() => setShowDiagnostic(false)} />}
      </div>
    );
  }

  // ── Main App ─────────────────────────────────────────────────────
  return (
    <div className="app-container">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="main-content">
        {renderActiveView()}
      </main>

      {/* Floating diagnostic button — always accessible */}
      <button
        onClick={() => setShowDiagnostic(true)}
        title="Run Supabase Diagnostics"
        style={{
          position: 'fixed', bottom: '1.25rem', right: '1.25rem', zIndex: 1000,
          width: '44px', height: '44px', borderRadius: '50%',
          background: '#1e293b', color: '#818cf8', border: '1px solid #334155',
          fontSize: '1.1rem', cursor: 'pointer', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          transition: 'transform 0.15s'
        }}
      >
        🔬
      </button>

      {showDiagnostic && <SupabaseDiagnostic onClose={() => setShowDiagnostic(false)} />}
    </div>
  );
}

export default function App() {
  return (
    <CRMProvider>
      <AppContent />
    </CRMProvider>
  );
}
