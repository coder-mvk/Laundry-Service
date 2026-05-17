import { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  IndianRupee, 
  Calendar, 
  FileText, 
  TrendingDown,
  AlertTriangle
} from 'lucide-react';
import { useCRM, getTodayDateString } from '../context/CRMContext';

export default function ExpensesView({ prefilledForm, clearPrefilledForm }) {
  const { expenses, addExpense, updateExpense, deleteExpense } = useCRM();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');

  // Form Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  
  // Custom Delete Confirm state
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, id: null });
  const [formData, setFormData] = useState({
    type: 'Petrol',
    amount: 100,
    notes: '',
    date: ''
  });

  const openModal = (exp = null) => {
    if (exp) {
      setEditingExpense(exp);
      setFormData({
        type: exp.type,
        amount: exp.amount,
        notes: exp.notes,
        date: exp.date
      });
    } else {
      setEditingExpense(null);
      setFormData({
        type: 'Petrol',
        amount: 300,
        notes: '',
        date: getTodayDateString()
      });
    }
    setIsModalOpen(true);
  };

  // Open modal prefilled if triggered by quick actions
  useEffect(() => {
    if (prefilledForm === 'new') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      openModal();
      clearPrefilledForm();
    }
  }, [prefilledForm, clearPrefilledForm]);

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingExpense(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.amount || formData.amount <= 0) {
      alert("Please enter a valid expense amount!");
      return;
    }

    if (editingExpense) {
      updateExpense({
        ...editingExpense,
        ...formData
      });
    } else {
      addExpense(formData);
    }
    closeModal();
  };

  const handleDelete = (id) => {
    setDeleteConfirm({ isOpen: true, id });
  };

  const confirmDelete = () => {
    deleteExpense(deleteConfirm.id);
    setDeleteConfirm({ isOpen: false, id: null });
  };

  // Filter logic
  const filteredExpenses = expenses.filter(e => {
    const matchesSearch = e.notes.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          e.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'All' || e.type === typeFilter;
    return matchesSearch && matchesType;
  });

  // Calculate dynamic expense sum for metrics
  const totalSum = filteredExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

  return (
    <div className="fade-in">
      <div className="flex-row-between margin-bottom-md">
        <div>
          <h1 className="page-title">Operational Expenses</h1>
          <p className="page-subtitle">Track fuel rounds, raw detergent stocks, utility bills, and lease costs</p>
        </div>
        <button onClick={() => openModal()} className="btn btn-danger flex items-center gap-1">
          <Plus size={18} /> Record New Expense
        </button>
      </div>

      {/* Summary Card */}
      <div className="glass-card profit-banner margin-bottom-md" style={{ background: 'linear-gradient(135deg, #fef2f2, #fff5f5)', borderColor: '#fca5a5' }}>
        <div className="profit-banner-left">
          <div className="sparkle-icon" style={{ backgroundColor: '#fee2e2', color: '#ef4444' }}>
            <TrendingDown size={22} />
          </div>
          <div>
            <h3 style={{ color: '#991b1b' }}>Expense Audit Hub</h3>
            <p>Monitors aggregate spending categories to identify cost savings and overhead controls.</p>
          </div>
        </div>
        <div className="profit-banner-right">
          <div className="financial-stats">
            <div className="fin-stat" style={{ alignItems: 'center' }}>
              <span className="fin-label" style={{ color: '#991b1b' }}>AGGREGATE FILTERED COST</span>
              <span className="fin-val font-extrabold text-danger" style={{ fontSize: '2rem' }}>
                ₹{totalSum.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter panel */}
      <div className="glass-card flex-row-between flex-wrap gap-4 margin-bottom-md">
        <div className="search-box-container flex-1">
          <Search size={18} className="search-box-icon" />
          <input 
            type="text" 
            placeholder="Search within expense descriptions or types..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input search-box-input"
          />
        </div>
        <div className="filters-group">
          <div className="filter-item">
            <Filter size={14} className="text-muted" />
            <select 
              value={typeFilter} 
              onChange={(e) => setTypeFilter(e.target.value)}
              className="form-input form-select filter-select"
            >
              <option value="All">All Categories</option>
              <option value="Petrol">Petrol / Fuel</option>
              <option value="Detergents">Detergent Supplies</option>
              <option value="Electricity">Electricity Bills</option>
              <option value="Rent">Rent Overhead</option>
              <option value="Salaries">Staff Salaries</option>
              <option value="Others">Others</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table grid */}
      <div className="glass-card table-wrapper">
        {filteredExpenses.length === 0 ? (
          <div className="no-records-state">
            <FileText size={40} className="text-muted" />
            <p>No operational costs recorded under these filter criteria.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Category / Type</th>
                  <th>Amount Spent</th>
                  <th>Notes & Description</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map(e => (
                  <tr key={e.id}>
                    <td><div className="flex items-center gap-1"><Calendar size={13} className="text-muted" /> {e.date}</div></td>
                    <td>
                      <span className={`badge-expense ${e.type.toLowerCase()}`}>
                        {e.type}
                      </span>
                    </td>
                    <td>
                      <span className="font-extrabold text-danger-dark" style={{ fontSize: '1.05rem' }}>
                        ₹{e.amount}
                      </span>
                    </td>
                    <td>
                      <span className="text-slate-700 font-medium">{e.notes || 'No description recorded.'}</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="table-actions">
                        <button 
                          onClick={() => openModal(e)}
                          className="btn btn-sm btn-secondary text-indigo"
                          title="Edit Cost details"
                        >
                          <Edit size={12} />
                        </button>
                        <button 
                          onClick={() => handleDelete(e.id)}
                          className="btn btn-sm btn-secondary text-danger"
                          title="Delete Expense entry"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Expense Modal Form */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content slide-in">
            <h2 className="modal-title" style={{ color: '#b91c1c' }}>
              {editingExpense ? 'Modify Expense details' : 'Log Operational Expense'}
            </h2>
            <p className="modal-subtitle">Log cash distributions for supplies, utilities, or rounds.</p>
            
            <form onSubmit={handleSubmit} className="margin-top-md">
              <div className="grid-2-form">
                <div className="form-group">
                  <label className="form-label">Expense Category</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    className="form-input form-select"
                  >
                    <option value="Petrol">Petrol / Fuel</option>
                    <option value="Detergents">Detergent Supplies</option>
                    <option value="Electricity">Electricity Bills</option>
                    <option value="Rent">Rent Overhead</option>
                    <option value="Salaries">Staff Salaries</option>
                    <option value="Others">Others</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Amount (₹) *</label>
                  <div className="input-with-icon">
                    <IndianRupee size={14} className="input-inner-icon" />
                    <input 
                      type="number"
                      required
                      min="1"
                      value={formData.amount}
                      onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value) || 0})}
                      className="form-input padding-left-icon font-extrabold"
                    />
                  </div>
                </div>
              </div>

              <div className="grid-2-form">
                <div className="form-group">
                  <label className="form-label">Expense Date</label>
                  <input 
                    type="text"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    placeholder="DD-MM-YYYY"
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Notes & Purpose</label>
                <textarea 
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="e.g. Fuel rounds, purchased detergents..."
                  className="form-input"
                  style={{ minHeight: '80px', fontFamily: 'inherit' }}
                />
              </div>

              <div className="modal-actions">
                <button type="button" onClick={closeModal} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-danger bg-red-600 hover:bg-red-700 border-none">
                  {editingExpense ? 'Modify Details' : 'Log Expense'}
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
              <h3 className="confirm-modal-title">Delete Expense Entry</h3>
            </div>
            <p className="confirm-modal-body">
              Are you sure you want to delete this expense record? This will alter your dynamic reporting ledger stats.
            </p>
            <div className="confirm-modal-footer">
              <button 
                onClick={() => setDeleteConfirm({ isOpen: false, id: null })} 
                className="btn btn-secondary btn-sm"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete} 
                className="btn btn-danger btn-sm"
              >
                Delete Entry
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        /* Local layout styles for expenses */
        .badge-expense {
          display: inline-flex;
          font-size: 0.75rem;
          font-weight: 600;
          padding: 0.15rem 0.5rem;
          border-radius: var(--radius-sm);
          text-transform: uppercase;
        }

        .badge-expense.petrol { background-color: #fef3c7; color: #d97706; }
        .badge-expense.detergents { background-color: #e0f2fe; color: #0284c7; }
        .badge-expense.electricity { background-color: #fee2e2; color: #dc2626; }
        .badge-expense.rent { background-color: #f3e8ff; color: #7c3aed; }
        .badge-expense.salaries { background-color: #dcfce7; color: #16a34a; }
        .badge-expense.others { background-color: #f1f5f9; color: #475569; }
      `}</style>
    </div>
  );
}
