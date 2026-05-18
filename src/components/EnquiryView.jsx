import { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Phone, 
  Calendar,
  Sparkles,
  ArrowRightLeft,
  AlertTriangle
} from 'lucide-react';
import { useCRM, getTodayDateString } from '../context/CRMContext';

export default function EnquiryView({ prefilledForm, clearPrefilledForm, onConvertEnquiry }) {
  const { enquiries, addEnquiry, updateEnquiry, deleteEnquiry, convertEnquiryToOrder } = useCRM();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sourceFilter, setSourceFilter] = useState('All');

  // Form Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEnq, setEditingEnq] = useState(null);
  
  // Custom Delete Confirm state
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, id: null });
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    source: 'Whatsapp',
    converted: 'Follow-up Pending',
    followUp: 'Tomorrow',
    date: ''
  });

  const openModal = (enq = null) => {
    if (enq) {
      setEditingEnq(enq);
      setFormData({
        name: enq.name,
        phone: enq.phone,
        source: enq.source,
        converted: enq.converted,
        followUp: enq.followUp,
        date: enq.date
      });
    } else {
      setEditingEnq(null);
      setFormData({
        name: '',
        phone: '',
        source: 'Whatsapp',
        converted: 'Follow-up Pending',
        followUp: 'Tomorrow',
        date: getTodayDateString()
      });
    }
    setIsModalOpen(true);
  };

  // Handle prefilled triggers from Quick Actions
  useEffect(() => {
    if (prefilledForm === 'new') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      openModal();
      clearPrefilledForm();
    }
  }, [prefilledForm, clearPrefilledForm]);

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingEnq(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      alert("Name and Phone number are required!");
      return;
    }

    if (editingEnq) {
      updateEnquiry({
        ...editingEnq,
        ...formData
      });
    } else {
      addEnquiry(formData);
    }
    closeModal();
  };

  const handleDelete = (id) => {
    setDeleteConfirm({ isOpen: true, id });
  };

  const confirmDelete = () => {
    deleteEnquiry(deleteConfirm.id);
    setDeleteConfirm({ isOpen: false, id: null });
  };

  const handleConvert = (id) => {
    const draftOrder = convertEnquiryToOrder(id);
    if (draftOrder) {
      alert("Lead successfully registered as Customer in Customer Master!");
      onConvertEnquiry(draftOrder); // Prop callback to shift to Orders page and prefill order
    }
  };

  // Filter logic
  const filteredEnquiries = enquiries.filter(e => {
    const matchesSearch = e.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          e.phone.includes(searchTerm);
    const matchesStatus = statusFilter === 'All' || e.converted === statusFilter;
    const matchesSource = sourceFilter === 'All' || e.source.toLowerCase() === sourceFilter.toLowerCase();
    return matchesSearch && matchesStatus && matchesSource;
  });

  return (
    <div className="fade-in">
      <div className="flex-row-between margin-bottom-md">
        <div>
          <h1 className="page-title">Enquiry & Leads Tracker</h1>
          <p className="page-subtitle">Manage laundry business opportunities and prospective customers</p>
        </div>
        <button onClick={() => openModal()} className="btn btn-primary">
          <Plus size={18} /> Add New Enquiry
        </button>
      </div>

      {/* Stats Quickbar */}
      <div className="grid-cols-4 margin-bottom-md">
        <div className="glass-card stat-mini">
          <span className="stat-mini-label">Total Leads</span>
          <span className="stat-mini-val text-indigo">{enquiries.length}</span>
        </div>
        <div className="glass-card stat-mini">
          <span className="stat-mini-label">Follow-ups Pending</span>
          <span className="stat-mini-val text-warning">
            {enquiries.filter(e => e.converted === 'Follow-up Pending').length}
          </span>
        </div>
        <div className="glass-card stat-mini">
          <span className="stat-mini-label">Converted Leads</span>
          <span className="stat-mini-val text-success">
            {enquiries.filter(e => e.converted === 'Yes').length}
          </span>
        </div>
        <div className="glass-card stat-mini">
          <span className="stat-mini-label">Declined Leads</span>
          <span className="stat-mini-val text-danger">
            {enquiries.filter(e => e.converted === 'No').length}
          </span>
        </div>
      </div>

      {/* Filter and Search Panel */}
      <div className="glass-card flex-row-between flex-wrap gap-4 margin-bottom-md">
        <div className="search-box-container flex-1">
          <Search size={18} className="search-box-icon" />
          <input 
            type="text" 
            placeholder="Search by lead name or phone number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input search-box-input"
          />
        </div>
        <div className="filters-group">
          <div className="filter-item">
            <Filter size={14} className="text-muted" />
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-input form-select filter-select"
            >
              <option value="All">All Statuses</option>
              <option value="Follow-up Pending">Follow-up Pending</option>
              <option value="Yes">Converted</option>
              <option value="No">Declined</option>
            </select>
          </div>
          <div className="filter-item">
            <Filter size={14} className="text-muted" />
            <select 
              value={sourceFilter} 
              onChange={(e) => setSourceFilter(e.target.value)}
              className="form-input form-select filter-select"
            >
              <option value="All">All Sources</option>
              <option value="Whatsapp">WhatsApp</option>
              <option value="Call">Phone Call</option>
              <option value="Website">Website</option>
              <option value="Referral">Referral</option>
              <option value="Walk-in">Walk-in</option>
            </select>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="glass-card table-wrapper">
        {filteredEnquiries.length === 0 ? (
          <div className="no-records-state">
            <Sparkles size={40} className="text-muted" />
            <p>No enquiry records match your current filter settings.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Name</th>
                  <th>Phone Number</th>
                  <th>Lead Source</th>
                  <th>Status</th>
                  <th>Follow-up Detail</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEnquiries.map(e => (
                  <tr key={e.id}>
                    <td><div className="flex items-center gap-1"><Calendar size={14} className="text-muted" /> {e.date}</div></td>
                    <td><span className="font-semibold text-slate-900">{e.name}</span></td>
                    <td><div className="flex items-center gap-1 text-slate-600"><Phone size={13} className="text-muted" /> {e.phone}</div></td>
                    <td>
                      <span className={`badge-source ${e.source.toLowerCase()}`}>
                        {e.source}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${
                        e.converted === 'Yes' ? 'badge-success' : 
                        e.converted === 'No' ? 'badge-danger' : 'badge-warning'
                      }`}>
                        {e.converted}
                      </span>
                    </td>
                    <td>
                      <span className={`followup-detail-text ${e.converted === 'Follow-up Pending' ? 'text-warning font-bold' : ''}`}>
                        {e.followUp}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="table-actions">
                        {e.converted === 'Follow-up Pending' && (
                          <button 
                            onClick={() => handleConvert(e.id)}
                            className="btn btn-sm btn-primary bg-emerald-600 hover:bg-emerald-700 border-none flex items-center gap-1"
                            title="Convert to Customer & Place Order"
                          >
                            <ArrowRightLeft size={12} /> Convert
                          </button>
                        )}
                        <button 
                          onClick={() => openModal(e)}
                          className="btn btn-sm btn-secondary text-indigo"
                          title="Edit Enquiry"
                        >
                          <Edit size={12} />
                        </button>
                        <button 
                          onClick={() => handleDelete(e.id)}
                          className="btn btn-sm btn-secondary text-danger"
                          title="Delete Record"
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

      {/* Form Modal Drawer */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content slide-in">
            <h2 className="modal-title">
              {editingEnq ? 'Edit Enquiry Details' : 'Record New Customer Enquiry'}
            </h2>
            <p className="modal-subtitle">Enter details of the incoming customer inquiry or wash lead.</p>
            
            <form onSubmit={handleSubmit} className="margin-top-md">
              <div className="grid-2-form">
                <div className="form-group">
                  <label className="form-label">Customer Name *</label>
                  <input 
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g. Amit Kumar"
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number *</label>
                  <input 
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="e.g. 9123456789"
                    className="form-input"
                  />
                </div>
              </div>

              <div className="grid-2-form">
                <div className="form-group">
                  <label className="form-label">Enquiry Date</label>
                  <input 
                    type="text"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    placeholder="DD-MM-YYYY"
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Lead Source</label>
                  <select
                    value={formData.source}
                    onChange={(e) => setFormData({...formData, source: e.target.value})}
                    className="form-input form-select"
                  >
                    <option value="Whatsapp">WhatsApp</option>
                    <option value="Call">Phone Call</option>
                    <option value="Website">Website</option>
                    <option value="Referral">Referral</option>
                    <option value="Walk-in">Walk-in</option>
                  </select>
                </div>
              </div>

              <div className="grid-2-form">
                <div className="form-group">
                  <label className="form-label">Converted?</label>
                  <select
                    value={formData.converted}
                    onChange={(e) => setFormData({
                      ...formData, 
                      converted: e.target.value,
                      followUp: e.target.value === 'Yes' ? 'Completed' : e.target.value === 'No' ? 'Not Interested' : 'Tomorrow'
                    })}
                    className="form-input form-select"
                  >
                    <option value="Follow-up Pending">Follow-up Pending</option>
                    <option value="Yes">Yes (Converted)</option>
                    <option value="No">No (Declined)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Follow-up Details</label>
                  <input 
                    type="text"
                    value={formData.followUp}
                    onChange={(e) => setFormData({...formData, followUp: e.target.value})}
                    placeholder="e.g. Tomorrow or Next Week"
                    className="form-input"
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" onClick={closeModal} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingEnq ? 'Save Changes' : 'Record Lead'}
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
              <h3 className="confirm-modal-title">Delete Enquiry Lead</h3>
            </div>
            <p className="confirm-modal-body">
              Are you sure you want to delete this laundry enquiry record? This action cannot be undone.
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
                Delete Lead
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        /* Local layout styles for leads tracker */
        .badge-source {
          display: inline-flex;
          font-size: 0.75rem;
          font-weight: 600;
          padding: 0.15rem 0.5rem;
          border-radius: var(--radius-sm);
        }

        .badge-source.whatsapp { background-color: #dcfce7; color: #166534; }
        .badge-source.call { background-color: #e0f2fe; color: #0369a1; }
        .badge-source.website { background-color: #f3e8ff; color: #6b21a8; }
        .badge-source.referral { background-color: #eff6ff; color: #1e40af; }
        .badge-source.walk-in { background-color: #f1f5f9; color: #475569; }
      `}</style>
    </div>
  );
}
