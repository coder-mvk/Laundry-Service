import { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  User, 
  Phone, 
  MapPin, 
  Compass, 
  AlertOctagon,
  X,
  CreditCard,
  ShoppingBag,
  Award
} from 'lucide-react';
import { useCRM } from '../context/CRMContext';

export default function CustomersView() {
  const { customers, orders, subscriptions, enquiries, addCustomer, updateCustomer, deleteCustomer } = useCRM();

  // Search & Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [planFilter, setPlanFilter] = useState('All');

  // Modal / Drawer state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCust, setEditingCust] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    area: '',
    address: '',
    customerType: 'Residential',
    plan: 'None',
    status: 'Active'
  });

  // 360 Profile Drawer state
  const [selectedCust, setSelectedCust] = useState(null);
  
  // Custom Delete Confirm state
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, id: null });

  const openModal = (cust = null) => {
    if (cust) {
      setEditingCust(cust);
      setFormData({
        name: cust.name,
        phone: cust.phone,
        area: cust.area,
        address: cust.address,
        customerType: cust.customerType,
        plan: cust.plan,
        status: cust.status
      });
    } else {
      setEditingCust(null);
      setFormData({
        name: '',
        phone: '',
        area: '',
        address: '',
        customerType: 'Residential',
        plan: 'None',
        status: 'Active'
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCust(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      alert("Name and Phone number are required!");
      return;
    }

    if (editingCust) {
      updateCustomer({
        ...editingCust,
        ...formData
      });
    } else {
      addCustomer(formData);
    }
    closeModal();
  };

  const handleDelete = (id) => {
    setDeleteConfirm({ isOpen: true, id });
  };

  const confirmDelete = () => {
    const id = deleteConfirm.id;
    deleteCustomer(id);
    if (selectedCust && selectedCust.id === id) {
      setSelectedCust(null);
    }
    setDeleteConfirm({ isOpen: false, id: null });
  };

  // 360 Profile Data Compiler
  const open360Profile = (cust) => {
    const customerOrders = orders.filter(o => o.customerPhone === cust.phone);
    const customerEnquiries = enquiries.filter(e => e.phone === cust.phone);
    const customerSub = subscriptions.find(s => s.phone === cust.phone && s.renewalStatus === 'Active');

    setSelectedCust({
      ...cust,
      orders: customerOrders,
      enquiries: customerEnquiries,
      subscription: customerSub
    });
  };

  // Filter customers list
  const filteredCustomers = customers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.phone.includes(searchTerm) || 
                          c.area.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'All' || c.customerType === typeFilter;
    const matchesPlan = planFilter === 'All' || c.plan === planFilter;
    return matchesSearch && matchesType && matchesPlan;
  });

  return (
    <div className="fade-in">
      <div className="flex-row-between margin-bottom-md">
        <div>
          <h1 className="page-title">Customer Master Directory</h1>
          <p className="page-subtitle">360-degree customer records, active pricing tiers, order count summaries & audits</p>
        </div>
        <button onClick={() => openModal()} className="btn btn-primary">
          <Plus size={18} /> Add Customer Record
        </button>
      </div>

      {/* Audit Warnings */}
      {customers.some(c => c.duplicateDetected) && (
        <div className="alert-card warning-alert margin-bottom-md">
          <AlertOctagon className="text-warning flex-shrink-0" size={20} />
          <div>
            <h4 className="font-bold">Auditing Flag: Duplicate Contact Fields Detected</h4>
            <p className="text-sm">Multiple customer cards share the same contact number. Click "Edit" to reconcile discrepancies and maintain unique business logs.</p>
          </div>
        </div>
      )}

      {/* Filters bar */}
      <div className="glass-card flex-row-between flex-wrap gap-4 margin-bottom-md">
        <div className="search-box-container flex-1">
          <Search size={18} className="search-box-icon" />
          <input 
            type="text" 
            placeholder="Search by customer name, phone number, area location..."
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
              <option value="All">All Types</option>
              <option value="Hostel">Hostel</option>
              <option value="Residential">Residential</option>
              <option value="Commercial">Commercial</option>
            </select>
          </div>
          <div className="filter-item">
            <Filter size={14} className="text-muted" />
            <select 
              value={planFilter} 
              onChange={(e) => setPlanFilter(e.target.value)}
              className="form-input form-select filter-select"
            >
              <option value="All">All Plans</option>
              <option value="None">No Active Plan</option>
              <option value="Silver">Silver Plan</option>
              <option value="Gold">Gold Plan</option>
              <option value="Platinum">Platinum Plan</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Customers List */}
      <div className="glass-card table-wrapper">
        {filteredCustomers.length === 0 ? (
          <div className="no-records-state">
            <User size={40} className="text-muted" />
            <p>No customers recorded under the current filter combinations.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Customer ID</th>
                  <th>Name</th>
                  <th>Phone Number</th>
                  <th>Area Location</th>
                  <th>Customer Type</th>
                  <th>Active Plan</th>
                  <th>Orders Logged</th>
                  <th>Spent Total</th>
                  <th>Last Order</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map(c => (
                  <tr 
                    key={c.id} 
                    className={`cursor-pointer ${c.duplicateDetected ? 'duplicate-row-highlight' : ''}`}
                    onClick={() => open360Profile(c)}
                  >
                    <td>
                      <span className="font-extrabold text-slate-800 flex items-center gap-1">
                        {c.id} 
                        {c.duplicateDetected && (
                          <AlertOctagon size={12} className="text-danger-dark" title="Duplicate Phone Number detected!" />
                        )}
                      </span>
                    </td>
                    <td><span className="font-semibold text-slate-900">{c.name}</span></td>
                    <td>{c.phone}</td>
                    <td>{c.area}</td>
                    <td>
                      <span className={`badge ${
                        c.customerType === 'Hostel' ? 'badge-info' : 
                        c.customerType === 'Residential' ? 'badge-success' : 'badge-warning'
                      }`}>
                        {c.customerType}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${c.plan === 'None' ? 'badge-secondary' : 'badge-success'} flex items-center gap-1`}>
                        {c.plan !== 'None' && <Award size={10} />}
                        {c.plan}
                      </span>
                    </td>
                    <td className="font-bold">{c.totalOrders} orders</td>
                    <td className="font-bold text-indigo">₹{c.totalRevenue}</td>
                    <td>{c.lastOrderDate}</td>
                    <td>
                      <span className={`badge ${c.status === 'Active' ? 'badge-success' : 'badge-danger'}`}>
                        {c.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                      <div className="table-actions">
                        <button 
                          onClick={() => openModal(c)}
                          className="btn btn-sm btn-secondary text-indigo"
                          title="Edit Customer Profile"
                        >
                          <Edit size={12} />
                        </button>
                        <button 
                          onClick={() => handleDelete(c.id)}
                          className="btn btn-sm btn-secondary text-danger"
                          title="Remove Customer Record"
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

      {/* Customer Record Modification Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content slide-in">
            <h2 className="modal-title">
              {editingCust ? 'Modify Customer Profile' : 'Register New Customer Profile'}
            </h2>
            <p className="modal-subtitle">Add contact fields, physical addresses, and classifications.</p>
            
            <form onSubmit={handleSubmit} className="margin-top-md">
              <div className="grid-2-form">
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input 
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g. Rahul"
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
                    placeholder="e.g. 9876543210"
                    className="form-input"
                  />
                </div>
              </div>

              <div className="grid-2-form">
                <div className="form-group">
                  <label className="form-label">Area Sector / Ward</label>
                  <input 
                    type="text"
                    value={formData.area}
                    onChange={(e) => setFormData({...formData, area: e.target.value})}
                    placeholder="e.g. Talegaon"
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Customer Classification</label>
                  <select
                    value={formData.customerType}
                    onChange={(e) => setFormData({...formData, customerType: e.target.value})}
                    className="form-input form-select"
                  >
                    <option value="Hostel">Hostel</option>
                    <option value="Residential">Residential</option>
                    <option value="Commercial">Commercial</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Complete Street Address</label>
                <textarea 
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  placeholder="Flat No, Wing, Housing Society name, Street details..."
                  className="form-input"
                  style={{ minHeight: '80px', fontFamily: 'inherit' }}
                />
              </div>

              <div className="grid-2-form">
                <div className="form-group">
                  <label className="form-label">Subscription Tier</label>
                  <select
                    value={formData.plan}
                    onChange={(e) => setFormData({...formData, plan: e.target.value})}
                    className="form-input form-select"
                  >
                    <option value="None">No Plan (None)</option>
                    <option value="Silver">Silver Package</option>
                    <option value="Gold">Gold Package</option>
                    <option value="Platinum">Platinum Package</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Card Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="form-input form-select"
                  >
                    <option value="Active">Active Profile</option>
                    <option value="Inactive">Inactive Profile</option>
                  </select>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" onClick={closeModal} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingCust ? 'Save Profile' : 'Register Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 360-degree Profile Drawer */}
      <div className={`drawer ${selectedCust ? 'open' : ''}`}>
        {selectedCust && (
          <>
            <div className="drawer-header flex-row-between">
              <div className="drawer-title-group">
                <span className="drawer-tag">Customer Profile 360°</span>
                <h2 className="drawer-title">{selectedCust.name}</h2>
                <span className="drawer-id-badge">{selectedCust.id}</span>
              </div>
              <button className="drawer-close" onClick={() => setSelectedCust(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="drawer-body">
              {/* Duplicate Warn Badge */}
              {selectedCust.duplicateDetected && (
                <div className="drawer-audit-alert">
                  <AlertOctagon size={16} />
                  <span>Duplicate contacts exist with this phone!</span>
                </div>
              )}

              {/* Core Information Section */}
              <div className="drawer-section">
                <h3 className="drawer-sec-title">Core Contact & Area</h3>
                <div className="drawer-info-grid">
                  <div className="drawer-info-item">
                    <Phone size={14} className="text-muted" />
                    <div className="drawer-info-item-content">
                      <span className="d-label">Phone</span>
                      <span className="d-val">{selectedCust.phone}</span>
                    </div>
                  </div>
                  <div className="drawer-info-item">
                    <MapPin size={14} className="text-muted" />
                    <div className="drawer-info-item-content">
                      <span className="d-label">Location Area</span>
                      <span className="d-val">{selectedCust.area || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="drawer-info-item" style={{ gridColumn: 'span 2' }}>
                    <Compass size={14} className="text-muted" />
                    <div className="drawer-info-item-content">
                      <span className="d-label">Street Address</span>
                      <span className="d-val address-text">{selectedCust.address || 'No street details recorded.'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Subscription Plan details */}
              <div className="drawer-section">
                <h3 className="drawer-sec-title">Active Package Quota</h3>
                {selectedCust.subscription ? (
                  <div className="drawer-sub-card">
                    <div className="sub-card-header flex-row-between">
                      <span className="sub-card-plan">{selectedCust.subscription.plan} Plan</span>
                      <span className="badge badge-success">{selectedCust.subscription.renewalStatus}</span>
                    </div>
                    <div className="sub-card-progress margin-top-sm">
                      <div className="flex-row-between text-xs font-semibold margin-bottom-xs">
                        <span>Remaining Allowance</span>
                        <span>{selectedCust.subscription.remainingKg} KG remaining</span>
                      </div>
                      <div className="sub-progress-bar-bg">
                        <div 
                          className="sub-progress-bar-fill"
                          style={{ 
                            width: `${(selectedCust.subscription.remainingKg / (selectedCust.subscription.plan === 'Silver' ? 15 : selectedCust.subscription.plan === 'Gold' ? 30 : 50)) * 100}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                    <div className="sub-card-dates flex-row-between margin-top-sm text-xs">
                      <span>Started: {selectedCust.subscription.startDate}</span>
                      <span>Expires: {selectedCust.subscription.endDate}</span>
                    </div>
                  </div>
                ) : (
                  <div className="drawer-no-sub">
                    <CreditCard size={18} />
                    <span>No active subscription. Customer is on Pay-As-You-Go pricing.</span>
                  </div>
                )}
              </div>

              {/* Orders History List */}
              <div className="drawer-section flex-1 overflow-hidden flex flex-col">
                <h3 className="drawer-sec-title flex items-center justify-between">
                  <span>Operational Order History</span>
                  <span className="orders-count-pill">{selectedCust.orders.length} orders</span>
                </h3>
                
                {selectedCust.orders.length === 0 ? (
                  <div className="drawer-empty-orders text-center padding-md">
                    <ShoppingBag size={24} className="text-muted margin-bottom-xs" />
                    <p className="text-xs text-slate-500">No transactions recorded for this customer phone.</p>
                  </div>
                ) : (
                  <div className="drawer-orders-scroll">
                    {selectedCust.orders.map(o => (
                      <div key={o.id} className="drawer-order-item">
                        <div className="flex-row-between">
                          <span className="d-ord-id font-bold">{o.id}</span>
                          <span className="d-ord-date text-xs text-slate-500">{o.date}</span>
                        </div>
                        <div className="flex-row-between margin-top-xs">
                          <span className="d-ord-service text-slate-700">{o.service} • {o.weight} Kg</span>
                          <span className="d-ord-amt font-extrabold text-indigo">₹{o.amount}</span>
                        </div>
                        <div className="flex-row-between margin-top-xs">
                          <span className={`badge ${
                            o.status === 'Done' ? 'badge-success' : 'badge-warning'
                          } badge-pill`} style={{ fontSize: '0.65rem' }}>
                            Wash: {o.status}
                          </span>
                          <span className={`badge ${
                            o.payment === 'Paid' ? 'badge-success' : 'badge-danger'
                          } badge-pill`} style={{ fontSize: '0.65rem' }}>
                            {o.payment}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Enquiry funnel log */}
              {selectedCust.enquiries.length > 0 && (
                <div className="drawer-section">
                  <h3 className="drawer-sec-title">Original Sales Funnel Logs</h3>
                  {selectedCust.enquiries.map(enq => (
                    <div key={enq.id} className="drawer-funnel-item">
                      <div className="flex-row-between text-xs">
                        <span className="font-semibold text-slate-700">Source: {enq.source}</span>
                        <span className="text-slate-500">Logged: {enq.date}</span>
                      </div>
                      <div className="flex-row-between text-xs margin-top-xs">
                        <span>Lead Status: <span className="badge badge-success" style={{ fontSize: '0.6rem' }}>Converted</span></span>
                        <span>Follow-up: {enq.followUp}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Premium Glassmorphic Deletion Modal */}
      {deleteConfirm.isOpen && (
        <div className="confirm-modal-overlay" onClick={() => setDeleteConfirm({ isOpen: false, id: null })}>
          <div className="confirm-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-modal-header">
              <div className="confirm-modal-icon-wrapper danger">
                <AlertOctagon size={22} />
              </div>
              <h3 className="confirm-modal-title">Delete Customer Record</h3>
            </div>
            <p className="confirm-modal-body">
              Are you sure you want to permanently remove this customer? This will not wipe out their order histories, but will affect dynamic statistics and reports.
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
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        /* Local style layouts for Customer Master */
        .duplicate-row-highlight {
          background-color: #fef2f2 !important;
          border-left: 3px solid var(--danger);
        }

        .duplicate-row-highlight:hover {
          background-color: #fee2e2 !important;
        }

        .alert-card {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem 1.25rem;
          border-radius: var(--radius-md);
        }

        .warning-alert {
          background-color: #fffbeb;
          border: 1px solid #fef3c7;
          color: #92400e;
        }

        /* Drawer internal specifications */
        .drawer-header {
          padding-bottom: 1.5rem;
          border-bottom: 1px solid var(--border);
          margin-bottom: 1.5rem;
        }

        .drawer-tag {
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--primary);
        }

        .drawer-title {
          font-size: 1.75rem;
          font-weight: 800;
          line-height: 1.1;
          color: var(--text-main);
        }

        .drawer-id-badge {
          font-size: 0.75rem;
          font-weight: 800;
          background-color: var(--bg-main);
          padding: 0.2rem 0.5rem;
          border-radius: var(--radius-sm);
          color: var(--text-muted);
          display: inline-block;
          margin-top: 0.25rem;
        }

        .drawer-close {
          background: transparent;
          border: none;
          cursor: pointer;
          color: var(--text-muted);
          padding: 0.5rem;
          border-radius: var(--radius-full);
          transition: all var(--transition-fast);
        }

        .drawer-close:hover {
          background-color: var(--bg-main);
          color: var(--text-main);
        }

        .drawer-body {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          height: calc(100% - 90px);
          overflow-y: auto;
          padding-right: 0.25rem;
        }

        .drawer-audit-alert {
          background-color: var(--danger-light);
          color: var(--danger-dark);
          padding: 0.5rem 0.75rem;
          border-radius: var(--radius-md);
          font-size: 0.8rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .drawer-section {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .drawer-sec-title {
          font-size: 0.85rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-muted);
          padding-bottom: 0.25rem;
          border-bottom: 1.5px solid var(--border);
        }

        .drawer-info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .drawer-info-item {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          background-color: var(--bg-main);
          padding: 0.75rem;
          border-radius: var(--radius-md);
          border: 1px solid var(--border);
        }

        .drawer-info-item-content {
          display: flex;
          flex-direction: column;
        }

        .d-label {
          font-size: 0.65rem;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
        }

        .d-val {
          font-size: 0.9rem;
          font-weight: 700;
          color: var(--text-main);
        }

        .address-text {
          font-weight: 500;
          font-size: 0.85rem;
          line-height: 1.4;
        }

        .drawer-sub-card {
          background: linear-gradient(135deg, #f0fdf4, #ecfdf5);
          border: 1px solid #a7f3d0;
          border-radius: var(--radius-md);
          padding: 1rem;
        }

        .sub-card-plan {
          font-size: 1.1rem;
          font-weight: 800;
          color: #065f46;
        }

        .sub-progress-bar-bg {
          height: 6px;
          background-color: #d1fae5;
          border-radius: var(--radius-full);
          overflow: hidden;
        }

        .sub-progress-bar-fill {
          height: 100%;
          background-color: var(--success);
          border-radius: var(--radius-full);
        }

        .drawer-no-sub {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background-color: var(--bg-main);
          border: 1px dashed var(--border);
          border-radius: var(--radius-md);
          padding: 1rem;
          font-size: 0.8rem;
          font-weight: 500;
          color: var(--text-muted);
        }

        .orders-count-pill {
          background-color: var(--primary-light);
          color: var(--primary-dark);
          font-size: 0.7rem;
          font-weight: 800;
          padding: 0.15rem 0.5rem;
          border-radius: var(--radius-full);
        }

        .drawer-orders-scroll {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          max-height: 250px;
          overflow-y: auto;
          padding-right: 0.25rem;
        }

        .drawer-order-item {
          background-color: var(--bg-main);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 0.75rem 1rem;
          transition: transform var(--transition-fast);
        }

        .drawer-order-item:hover {
          transform: translateY(-1px);
          box-shadow: var(--shadow-sm);
        }

        .drawer-funnel-item {
          background-color: var(--bg-main);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 0.75rem;
        }
      `}</style>
    </div>
  );
}
