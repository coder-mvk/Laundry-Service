import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  ClipboardList, 
  UserCheck, 
  CreditCard, 
  Receipt, 
  Menu, 
  X, 
  RotateCcw,
  TrendingUp,
  FileSpreadsheet,
  AlertTriangle,
  Trash2
} from 'lucide-react';
import { useCRM } from '../context/CRMContext';

export default function Sidebar({ activeTab, setActiveTab }) {
  const { orders, enquiries, restoreSeedData, clearAllData } = useCRM();
  const [isOpen, setIsOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: null, title: '', message: '', severity: '' });

  // Compute quick counts for badges
  const pendingOrdersCount = orders.filter(o => o.status !== 'Done').length;
  const pendingEnquiriesCount = enquiries.filter(e => e.converted === 'Follow-up Pending').length;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'enquiries', label: 'Enquiries', icon: UserCheck, count: pendingEnquiriesCount, badgeColor: 'badge-warning' },
    { id: 'orders', label: 'Daily Orders', icon: ClipboardList, count: pendingOrdersCount, badgeColor: 'badge-danger' },
    { id: 'customers', label: 'Customer Master', icon: Users },
    { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
    { id: 'expenses', label: 'Expenses', icon: Receipt },
    { id: 'portability', label: 'Excel Sync', icon: FileSpreadsheet }
  ];

  const triggerRestoreSeed = () => {
    setConfirmModal({
      isOpen: true,
      type: 'restore',
      title: 'Load Demo Dataset',
      message: 'Are you sure you want to restore the default demo data? This will overwrite your existing Customer and Order history with the preloaded worksheet data.',
      severity: 'warning'
    });
  };

  const triggerClearAll = () => {
    setConfirmModal({
      isOpen: true,
      type: 'clear',
      title: 'Clear All CRM Data',
      message: 'Are you sure you want to wipe the CRM database? This will completely empty all customers, orders, subscriptions, enquiries, and expenses, leaving you with a fresh start to enter your real business data.',
      severity: 'danger'
    });
  };

  const handleConfirmAction = () => {
    if (confirmModal.type === 'restore') {
      restoreSeedData();
      window.location.reload();
    } else if (confirmModal.type === 'clear') {
      clearAllData();
      window.location.reload();
    }
    setConfirmModal({ isOpen: false, type: null, title: '', message: '', severity: '' });
  };

  return (
    <>
      {/* Desktop & Tablet Sidebar */}
      <aside className="sidebar-desktop">
        <div className="sidebar-brand">
          <div className="brand-logo">💧</div>
          <div className="brand-details">
            <h2 className="brand-title">A-1 Laundry</h2>
            <span className="brand-subtitle">CRM SaaS Dashboard</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button 
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`nav-link ${isActive ? 'active' : ''}`}
              >
                <div className="nav-link-content">
                  <Icon size={20} className="nav-icon" />
                  <span className="nav-text">{item.label}</span>
                </div>
                {item.count > 0 && (
                  <span className={`badge ${item.badgeColor} badge-pill nav-badge`}>
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <button onClick={triggerClearAll} className="btn-clear-database">
            <Trash2 size={14} />
            <span>Clear CRM Database</span>
          </button>
          <button onClick={triggerRestoreSeed} className="btn-reset-data">
            <RotateCcw size={14} />
            <span>Load Demo Dataset</span>
          </button>
          <div className="sidebar-version">v1.2 Premium</div>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className="mobile-header">
        <div className="mobile-logo-area">
          <span className="mobile-logo">💧</span>
          <h1 className="mobile-title">A-1 Laundry</h1>
        </div>
        <button className="mobile-menu-btn" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Mobile Sidebar Overlay Drawer */}
      <div className={`mobile-sidebar-drawer ${isOpen ? 'open' : ''}`}>
        <div className="mobile-drawer-inner">
          <div className="drawer-menu-title">NAVIGATION MENU</div>
          <nav className="mobile-nav">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button 
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsOpen(false);
                  }}
                  className={`mobile-nav-link ${isActive ? 'active' : ''}`}
                >
                  <div className="nav-link-content">
                    <Icon size={22} className="nav-icon" />
                    <span className="nav-text">{item.label}</span>
                  </div>
                  {item.count > 0 && (
                    <span className={`badge ${item.badgeColor} nav-badge`}>
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
          
          <div className="mobile-drawer-footer">
            <button onClick={triggerClearAll} className="btn-clear-database w-full margin-bottom-xs">
              <Trash2 size={16} />
              <span>Clear CRM Database</span>
            </button>
            <button onClick={triggerRestoreSeed} className="btn-reset-data w-full">
              <RotateCcw size={16} />
              <span>Load Demo Dataset</span>
            </button>
          </div>
        </div>
      </div>

      {/* Styles local to Sidebar layout (to prevent index.css bloating) */}
      {/* Premium Glassmorphic Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="confirm-modal-overlay" onClick={() => setConfirmModal({ isOpen: false, type: null })}>
          <div className="confirm-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-modal-header">
              <div className={`confirm-modal-icon-wrapper ${confirmModal.severity}`}>
                <AlertTriangle size={22} />
              </div>
              <h3 className="confirm-modal-title">{confirmModal.title}</h3>
            </div>
            <p className="confirm-modal-body">
              {confirmModal.message}
            </p>
            <div className="confirm-modal-footer">
              <button 
                onClick={() => setConfirmModal({ isOpen: false, type: null })} 
                className="btn btn-secondary btn-sm"
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmAction} 
                className={`btn btn-sm ${confirmModal.severity === 'danger' ? 'btn-danger' : 'btn-primary'}`}
              >
                Confirm Action
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        /* Sidebar layout designs */
        .sidebar-desktop {
          width: 260px;
          background-color: var(--bg-sidebar);
          color: var(--sidebar-text);
          display: flex;
          flex-direction: column;
          border-right: 1px solid rgba(255, 255, 255, 0.05);
          height: 100vh;
          position: sticky;
          top: 0;
          left: 0;
          z-index: 100;
          padding: 1.5rem;
          flex-shrink: 0;
        }

        .sidebar-brand {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding-bottom: 2rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          margin-bottom: 1.5rem;
        }

        .brand-logo {
          font-size: 2.25rem;
          filter: drop-shadow(0 0 10px rgba(59, 130, 246, 0.3));
        }

        .brand-details {
          display: flex;
          flex-direction: column;
        }

        .brand-title {
          font-size: 1.2rem;
          font-weight: 800;
          color: var(--text-inverse);
          line-height: 1.1;
        }

        .brand-subtitle {
          font-size: 0.7rem;
          color: #64748b;
          font-weight: 600;
          letter-spacing: 0.02em;
        }

        .sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
          flex: 1;
        }

        .nav-link {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.85rem 1rem;
          border-radius: var(--radius-md);
          background: transparent;
          border: none;
          color: var(--sidebar-text);
          cursor: pointer;
          font-family: var(--font-body);
          font-weight: 500;
          font-size: 0.925rem;
          text-align: left;
          transition: all var(--transition-fast);
        }

        .nav-link-content {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .nav-icon {
          color: #64748b;
          transition: color var(--transition-fast);
        }

        .nav-link:hover {
          background-color: var(--sidebar-hover);
          color: var(--text-inverse);
        }

        .nav-link:hover .nav-icon {
          color: var(--secondary);
        }

        .nav-link.active {
          background-color: var(--primary);
          color: var(--text-inverse);
          box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25);
        }

        .nav-link.active .nav-icon {
          color: var(--text-inverse);
        }

        .nav-badge {
          font-size: 0.7rem;
          padding: 0.15rem 0.4rem;
          border-radius: var(--radius-sm);
        }

        .sidebar-footer {
          margin-top: auto;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          padding-top: 1.5rem;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }

        .btn-clear-database {
          background: rgba(239, 68, 68, 0.15);
          border: 1px solid rgba(239, 68, 68, 0.35);
          color: #fca5a5;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.6rem;
          border-radius: var(--radius-sm);
          font-family: var(--font-body);
          font-weight: 600;
          font-size: 0.825rem;
          cursor: pointer;
          transition: all var(--transition-fast);
          margin-bottom: 0.4rem;
        }

        .btn-clear-database:hover {
          background: rgba(239, 68, 68, 0.3);
          color: #ffffff;
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.15);
        }

        .btn-reset-data {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #94a3b8;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.6rem;
          border-radius: var(--radius-sm);
          font-family: var(--font-body);
          font-weight: 600;
          font-size: 0.825rem;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .btn-reset-data:hover {
          background: rgba(255, 255, 255, 0.08);
          color: #ffffff;
        }

        .sidebar-version {
          font-size: 0.65rem;
          color: #475569;
          text-align: center;
          font-weight: 500;
        }

        /* Mobile Header */
        .mobile-header {
          display: none;
          background-color: var(--bg-sidebar);
          color: var(--text-inverse);
          height: 60px;
          padding: 0 1.25rem;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          position: sticky;
          top: 0;
          z-index: 99;
        }

        .mobile-logo-area {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .mobile-logo {
          font-size: 1.5rem;
        }

        .mobile-title {
          font-size: 1.1rem;
          font-weight: 800;
        }

        .mobile-menu-btn {
          background: transparent;
          border: none;
          color: var(--text-inverse);
          cursor: pointer;
        }

        .mobile-sidebar-drawer {
          position: fixed;
          top: 60px;
          left: 0;
          width: 100%;
          height: calc(100vh - 60px);
          background-color: var(--bg-sidebar);
          z-index: 98;
          transform: translateX(-100%);
          transition: transform var(--transition-normal);
          overflow-y: auto;
        }

        .mobile-sidebar-drawer.open {
          transform: translateX(0);
        }

        .mobile-drawer-inner {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          height: 100%;
        }

        .drawer-menu-title {
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: #475569;
        }

        .mobile-nav {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .mobile-nav-link {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem;
          border-radius: var(--radius-md);
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          color: var(--sidebar-text);
          text-align: left;
          font-family: var(--font-body);
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .mobile-nav-link.active {
          background-color: var(--primary);
          color: var(--text-inverse);
          border-color: var(--primary);
        }

        .mobile-drawer-footer {
          margin-top: auto;
          padding-bottom: 2rem;
        }

        /* Responsive styling */
        @media (max-width: 768px) {
          .sidebar-desktop {
            display: none;
          }
          .mobile-header {
            display: flex;
          }
        }
      `}</style>
    </>
  );
}
