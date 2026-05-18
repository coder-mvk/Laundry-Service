import { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  CreditCard, 
  Calendar, 
  AlertTriangle,
  Phone,
  User
} from 'lucide-react';
import { useCRM, getTodayDateString } from '../context/CRMContext';

const PLAN_LIMITS = {
  'Silver': 15,
  'Gold': 30,
  'Platinum': 50
};

export default function SubscriptionsView() {
  const { subscriptions, customers, addSubscription, updateSubscription, deleteSubscription } = useCRM();

  // Search & Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [planFilter, setPlanFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Form Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSub, setEditingSub] = useState(null);
  
  // Custom Delete Confirm state
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, id: null });
  const [formData, setFormData] = useState({
    customerName: '',
    phone: '',
    plan: 'Silver',
    startDate: '',
    endDate: '',
    remainingKg: 15,
    renewalStatus: 'Active'
  });

  // Auto-complete customer name from phone selector
  const handleSubscriberPhoneChange = (value) => {
    setFormData(prev => {
      const next = { ...prev, phone: value };
      if (value && value.length >= 10) {
        const match = customers.find(c => c.phone === value);
        if (match && match.name) {
          next.customerName = match.name;
        }
      }
      return next;
    });
  };

  const openModal = (sub = null) => {
    if (sub) {
      setEditingSub(sub);
      setFormData({
        customerName: sub.customerName,
        phone: sub.phone,
        plan: sub.plan,
        startDate: sub.startDate,
        endDate: sub.endDate,
        remainingKg: sub.remainingKg,
        renewalStatus: sub.renewalStatus
      });
    } else {
      // Calculate standard start & end date (30 days from today)
      const start = getTodayDateString();
      const today = new Date();
      const nextMonth = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));
      const dd = String(nextMonth.getDate()).padStart(2, '0');
      const mm = String(nextMonth.getMonth() + 1).padStart(2, '0');
      const yyyy = nextMonth.getFullYear();
      const end = `${dd}-${mm}-${yyyy}`;

      setEditingSub(null);
      setFormData({
        customerName: '',
        phone: '',
        plan: 'Silver',
        startDate: start,
        endDate: end,
        remainingKg: 15,
        renewalStatus: 'Active'
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingSub(null);
  };

  const handlePlanChange = (e) => {
    const selectedPlan = e.target.value;
    const limit = PLAN_LIMITS[selectedPlan] || 15;
    setFormData(prev => ({
      ...prev,
      plan: selectedPlan,
      remainingKg: limit
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.phone || !formData.customerName) {
      alert("Customer details are required!");
      return;
    }

    if (editingSub) {
      updateSubscription({
        ...editingSub,
        ...formData
      });
    } else {
      addSubscription(formData);
    }
    closeModal();
  };

  const handleDelete = (id) => {
    setDeleteConfirm({ isOpen: true, id });
  };

  const confirmDelete = () => {
    deleteSubscription(deleteConfirm.id);
    setDeleteConfirm({ isOpen: false, id: null });
  };

  // Filter subscriptions
  const filteredSubs = subscriptions.filter(s => {
    const matchesSearch = s.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.phone.includes(searchTerm);
    const matchesPlan = planFilter === 'All' || s.plan === planFilter;
    const matchesStatus = statusFilter === 'All' || s.renewalStatus === statusFilter;
    return matchesSearch && matchesPlan && matchesStatus;
  });

  return (
    <div className="fade-in">
      <div className="flex-row-between margin-bottom-md">
        <div>
          <h1 className="page-title">Subscription Packages</h1>
          <p className="page-subtitle">Track recurring laundry weight plans, active allowances, and renewal dates</p>
        </div>
        <button onClick={() => openModal()} className="btn btn-primary">
          <Plus size={18} /> Add New Subscriber
        </button>
      </div>

      {/* Subscription Quick stats */}
      <div className="grid-cols-4 margin-bottom-md">
        <div className="glass-card stat-mini">
          <span className="stat-mini-label">Silver Members</span>
          <span className="stat-mini-val text-indigo">
            {subscriptions.filter(s => s.plan === 'Silver' && s.renewalStatus === 'Active').length}
          </span>
        </div>
        <div className="glass-card stat-mini">
          <span className="stat-mini-label">Gold Members</span>
          <span className="stat-mini-val text-cyan">
            {subscriptions.filter(s => s.plan === 'Gold' && s.renewalStatus === 'Active').length}
          </span>
        </div>
        <div className="glass-card stat-mini">
          <span className="stat-mini-label">Platinum Members</span>
          <span className="stat-mini-val text-primary">
            {subscriptions.filter(s => s.plan === 'Platinum' && s.renewalStatus === 'Active').length}
          </span>
        </div>
        <div className="glass-card stat-mini">
          <span className="stat-mini-label">Near Expiry / Expired</span>
          <span className="stat-mini-val text-danger">
            {subscriptions.filter(s => s.renewalStatus !== 'Active').length}
          </span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="glass-card flex-row-between flex-wrap gap-4 margin-bottom-md">
        <div className="search-box-container flex-1">
          <Search size={18} className="search-box-icon" />
          <input 
            type="text" 
            placeholder="Search by subscriber name, phone number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input search-box-input"
          />
        </div>
        <div className="filters-group">
          <div className="filter-item">
            <Filter size={14} className="text-muted" />
            <select 
              value={planFilter} 
              onChange={(e) => setPlanFilter(e.target.value)}
              className="form-input form-select filter-select"
            >
              <option value="All">All Tiers</option>
              <option value="Silver">Silver Plan</option>
              <option value="Gold">Gold Plan</option>
              <option value="Platinum">Platinum Plan</option>
            </select>
          </div>
          <div className="filter-item">
            <Filter size={14} className="text-muted" />
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-input form-select filter-select"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active Plan</option>
              <option value="Near Expiry">Near Expiry</option>
              <option value="Expired">Expired</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid List or Table of subscriptions */}
      <div className="glass-card table-wrapper">
        {filteredSubs.length === 0 ? (
          <div className="no-records-state">
            <CreditCard size={40} className="text-muted" />
            <p>No subscriber profiles found matching the current selections.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Subscriber Name</th>
                  <th>Phone Number</th>
                  <th>Plan Tier</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th style={{ width: '220px' }}>Allowance Progress (Remaining Kg)</th>
                  <th>Renewal Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubs.map(s => {
                  const maxAllowance = PLAN_LIMITS[s.plan] || 15;
                  const ratio = (Number(s.remainingKg) / maxAllowance) * 100;
                  const isLowAllowance = Number(s.remainingKg) <= 5;
                  return (
                    <tr key={s.id}>
                      <td><span className="font-semibold text-slate-900">{s.customerName}</span></td>
                      <td>
                        <div className="flex items-center gap-1 text-slate-600"><Phone size={13} /> {s.phone}</div>
                      </td>
                      <td>
                        <span className="badge badge-info">{s.plan}</span>
                      </td>
                      <td><div className="flex items-center gap-1"><Calendar size={13} className="text-muted" /> {s.startDate}</div></td>
                      <td><div className="flex items-center gap-1"><Calendar size={13} className="text-muted" /> {s.endDate}</div></td>
                      <td>
                        <div className="flex flex-col gap-1">
                          <div className="flex-row-between text-xs font-bold">
                            <span className={isLowAllowance ? 'text-danger font-extrabold flex items-center gap-1' : 'text-slate-600'}>
                              {isLowAllowance && <AlertTriangle size={12} />}
                              {s.remainingKg} / {maxAllowance} KG
                            </span>
                            <span className="text-muted">{ratio.toFixed(0)}%</span>
                          </div>
                          <div className="sub-progress-bar-bg">
                            <div 
                              className={`sub-progress-bar-fill ${isLowAllowance ? 'bg-danger-fill' : ''}`}
                              style={{ width: `${Math.min(100, Math.max(0, ratio))}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${
                          s.renewalStatus === 'Active' ? 'badge-success' : 
                          s.renewalStatus === 'Expired' ? 'badge-danger' : 'badge-warning'
                        }`}>
                          {s.renewalStatus}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="table-actions">
                          <button 
                            onClick={() => openModal(s)}
                            className="btn btn-sm btn-secondary text-indigo"
                            title="Edit Plan"
                          >
                            <Edit size={12} />
                          </button>
                          <button 
                            onClick={() => handleDelete(s.id)}
                            className="btn btn-sm btn-secondary text-danger"
                            title="Cancel Plan"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Subscription creation Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content slide-in">
            <h2 className="modal-title">
              {editingSub ? 'Modify Subscription Plan' : 'Add Membership Subscription'}
            </h2>
            <p className="modal-subtitle">Register a laundry quota package (Silver/Gold/Platinum) for a customer.</p>
            
            <form onSubmit={handleSubmit} className="margin-top-md">
              <div className="grid-2-form">
                <div className="form-group">
                  <label className="form-label">Phone Number *</label>
                  <div className="input-with-icon">
                    <Phone size={14} className="input-inner-icon" />
                    <input 
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => handleSubscriberPhoneChange(e.target.value)}
                      placeholder="e.g. 9123456789"
                      className="form-input padding-left-icon"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Customer Name *</label>
                  <div className="input-with-icon">
                    <User size={14} className="input-inner-icon" />
                    <input 
                      type="text"
                      required
                      value={formData.customerName}
                      onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                      placeholder="e.g. Amit Kumar"
                      className="form-input padding-left-icon"
                    />
                  </div>
                </div>
              </div>

              <div className="grid-2-form">
                <div className="form-group">
                  <label className="form-label">Plan Tier</label>
                  <select
                    value={formData.plan}
                    onChange={handlePlanChange}
                    className="form-input form-select"
                  >
                    <option value="Silver">Silver Package (15 Kg allowance)</option>
                    <option value="Gold">Gold Package (30 Kg allowance)</option>
                    <option value="Platinum">Platinum Package (50 Kg allowance)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Remaining Kg Allowance</label>
                  <input 
                    type="number"
                    step="0.1"
                    min="0"
                    required
                    value={formData.remainingKg}
                    onChange={(e) => setFormData({...formData, remainingKg: parseFloat(e.target.value) || 0})}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="grid-2-form">
                <div className="form-group">
                  <label className="form-label">Start Date</label>
                  <input 
                    type="text"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    placeholder="DD-MM-YYYY"
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Expiry Date</label>
                  <input 
                    type="text"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                    placeholder="DD-MM-YYYY"
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Renewal Status</label>
                <select
                  value={formData.renewalStatus}
                  onChange={(e) => setFormData({...formData, renewalStatus: e.target.value})}
                  className="form-input form-select"
                >
                  <option value="Active">Active (Healthy)</option>
                  <option value="Near Expiry">Near Expiry Alert</option>
                  <option value="Expired">Expired</option>
                </select>
              </div>

              <div className="modal-actions">
                <button type="button" onClick={closeModal} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingSub ? 'Save Subscription' : 'Activate Package'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Premium Glassmorphic Deletion Modal */}
      {deleteConfirm.isOpen && (
        <div className="confirm-modal-overlay" onClick={() => setDeleteConfirm({ isOpen: false, id: null })}>
          <div className="confirm-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-modal-header">
              <div className="confirm-modal-icon-wrapper danger">
                <AlertTriangle size={22} />
              </div>
              <h3 className="confirm-modal-title">Cancel Subscription</h3>
            </div>
            <p className="confirm-modal-body">
              Are you sure you want to cancel this subscription package? The customer's plan tier in the Customer Master profile will instantly revert to 'None'.
            </p>
            <div className="confirm-modal-footer">
              <button 
                onClick={() => setDeleteConfirm({ isOpen: false, id: null })} 
                className="btn btn-secondary btn-sm"
              >
                Keep Active
              </button>
              <button 
                onClick={confirmDelete} 
                className="btn btn-danger btn-sm"
              >
                Cancel Subscription
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        /* Local subscriptions CSS overrides */
        .sub-progress-bar-bg {
          height: 8px;
          background-color: var(--border);
          border-radius: var(--radius-full);
          overflow: hidden;
          width: 100%;
        }

        .sub-progress-bar-fill {
          height: 100%;
          background-color: var(--success);
          border-radius: var(--radius-full);
          transition: width var(--transition-normal);
        }

        .sub-progress-bar-fill.bg-danger-fill {
          background-color: var(--danger) !important;
        }

        .bg-danger-fill {
          background-color: var(--danger) !important;
        }

        .text-danger.font-extrabold {
          color: var(--danger-dark) !important;
        }
      `}</style>
    </div>
  );
}
