import { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  ShoppingBag, 
  AlertCircle,
  Phone,
  User
} from 'lucide-react';
import { useCRM, getTodayDateString } from '../context/CRMContext';

const DEFAULT_RATES = {
  'Wash+Iron': 70,
  'Wash+Fold': 50,
  'Dry Clean': 120,
  'Steam Iron': 40
};

export default function OrdersView({ prefilledForm, clearPrefilledForm }) {
  const { orders, customers, addOrder, updateOrder, deleteOrder } = useCRM();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [paymentFilter, setPaymentFilter] = useState('All');

  // Modal form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  
  // Custom Delete Confirm state
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, id: null });
  const [formData, setFormData] = useState({
    customerPhone: '',
    customerName: '',
    service: 'Wash+Iron',
    pricePerKg: 70,
    weight: 1,
    deliveryChrg: 50,
    payment: 'Unpaid',
    pickup: 'No',
    delivery: 'Pending',
    status: 'Pending',
    priority: 'Normal',
    date: ''
  });

  // Calculate live amount inside the form
  const liveAmount = (Number(formData.pricePerKg || 0) * Number(formData.weight || 0)) + Number(formData.deliveryChrg || 0);

  const openModal = (order = null, draft = null) => {
    if (order) {
      setEditingOrder(order);
      setFormData({
        customerPhone: order.customerPhone,
        customerName: order.customerName,
        service: order.service,
        pricePerKg: order.pricePerKg,
        weight: order.weight,
        deliveryChrg: order.deliveryChrg,
        payment: order.payment,
        pickup: order.pickup,
        delivery: order.delivery,
        status: order.status,
        priority: order.priority,
        date: order.date
      });
    } else if (draft) {
      setEditingOrder(null);
      setFormData({
        ...draft,
        date: getTodayDateString()
      });
      setIsModalOpen(true);
    } else {
      setEditingOrder(null);
      setFormData({
        customerPhone: '',
        customerName: '',
        service: 'Wash+Iron',
        pricePerKg: 70,
        weight: 5,
        deliveryChrg: 50,
        payment: 'Unpaid',
        pickup: 'No',
        delivery: 'Pending',
        status: 'Pending',
        priority: 'Normal',
        date: getTodayDateString()
      });
    }
    setIsModalOpen(true);
  };

  const handleCustomerPhoneChange = (value) => {
    setFormData(prev => {
      const next = { ...prev, customerPhone: value };
      if (value && value.length >= 10) {
        const match = customers.find(c => c.phone === value);
        if (match && match.name) {
          next.customerName = match.name;
        }
      }
      return next;
    });
  };

  // Triggered by quick actions or converted enquiries
  useEffect(() => {
    if (prefilledForm) {
      if (prefilledForm === 'new') {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        openModal();
      } else if (typeof prefilledForm === 'object') {
        openModal(null, prefilledForm);
      }
      clearPrefilledForm();
    }
  }, [prefilledForm, clearPrefilledForm]);

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingOrder(null);
  };

  const handleServiceChange = (e) => {
    const srv = e.target.value;
    const rate = DEFAULT_RATES[srv] || 70;
    setFormData(prev => ({
      ...prev,
      service: srv,
      pricePerKg: rate
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.customerPhone || !formData.customerName) {
      alert("Customer Phone and Name are required!");
      return;
    }

    if (editingOrder) {
      updateOrder({
        ...editingOrder,
        ...formData
      });
    } else {
      addOrder(formData);
    }
    closeModal();
  };

  const handleDelete = (id) => {
    setDeleteConfirm({ isOpen: true, id });
  };

  const confirmDelete = () => {
    deleteOrder(deleteConfirm.id);
    setDeleteConfirm({ isOpen: false, id: null });
  };

  // Filter orders based on user choice
  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          o.customerPhone.includes(searchTerm) || 
                          o.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || o.status === statusFilter;
    const matchesPayment = paymentFilter === 'All' || o.payment === paymentFilter;
    return matchesSearch && matchesStatus && matchesPayment;
  });

  return (
    <div className="fade-in">
      <div className="flex-row-between margin-bottom-md">
        <div>
          <h1 className="page-title">Daily Operations - Orders</h1>
          <p className="page-subtitle">Track incoming wash loads, weights, pricing, status, and cash flow</p>
        </div>
        <button onClick={() => openModal()} className="btn btn-primary">
          <Plus size={18} /> Add New Order
        </button>
      </div>

      {/* Metric stats bar */}
      <div className="grid-cols-4 margin-bottom-md">
        <div className="glass-card stat-mini">
          <span className="stat-mini-label">Total Volume</span>
          <span className="stat-mini-val text-indigo">
            {orders.reduce((sum, o) => sum + Number(o.weight || 0), 0)} KG
          </span>
        </div>
        <div className="glass-card stat-mini">
          <span className="stat-mini-label">Active Processing</span>
          <span className="stat-mini-val text-cyan">
            {orders.filter(o => o.status === 'In Progress').length}
          </span>
        </div>
        <div className="glass-card stat-mini">
          <span className="stat-mini-label">Pending Delivery</span>
          <span className="stat-mini-val text-warning">
            {orders.filter(o => o.delivery === 'Pending').length}
          </span>
        </div>
        <div className="glass-card stat-mini">
          <span className="stat-mini-label">Unpaid Billings</span>
          <span className="stat-mini-val text-danger">
            {orders.filter(o => o.payment === 'Unpaid').length}
          </span>
        </div>
      </div>

      {/* Filter panel */}
      <div className="glass-card flex-row-between flex-wrap gap-4 margin-bottom-md">
        <div className="search-box-container flex-1">
          <Search size={18} className="search-box-icon" />
          <input 
            type="text" 
            placeholder="Search by customer name, phone, or Order ID (e.g. ORD001)..."
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
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Ready">Ready</option>
              <option value="Done">Done (Completed)</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
          <div className="filter-item">
            <Filter size={14} className="text-muted" />
            <select 
              value={paymentFilter} 
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="form-input form-select filter-select"
            >
              <option value="All">All Payments</option>
              <option value="Paid">Paid</option>
              <option value="Unpaid">Unpaid</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table grid */}
      <div className="glass-card table-wrapper">
        {filteredOrders.length === 0 ? (
          <div className="no-records-state">
            <ShoppingBag size={40} className="text-muted" />
            <p>No operational orders found matching current criteria.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Date</th>
                  <th>Customer Name & Phone</th>
                  <th>Service type</th>
                  <th>Weight</th>
                  <th>Price/Kg</th>
                  <th>Delivery Chrg</th>
                  <th>Total Amount</th>
                  <th>Payment</th>
                  <th>Delivery</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map(o => (
                  <tr key={o.id}>
                    <td><span className="font-extrabold text-slate-800">{o.id}</span></td>
                    <td>{o.date}</td>
                    <td>
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900">{o.customerName}</span>
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Phone size={10} /> {o.customerPhone}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className="font-medium text-indigo">{o.service}</span>
                    </td>
                    <td className="font-bold text-slate-700">{o.weight} Kg</td>
                    <td>₹{o.pricePerKg}</td>
                    <td>₹{o.deliveryChrg}</td>
                    <td><span className="font-extrabold text-slate-900">₹{o.amount}</span></td>
                    <td>
                      <span className={`badge ${o.payment === 'Paid' ? 'badge-success' : 'badge-danger'}`}>
                        {o.payment}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${
                        o.delivery === 'Delivered' ? 'badge-success' : 
                        o.delivery === 'In Progress' ? 'badge-info' : 'badge-warning'
                      }`}>
                        {o.delivery}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${
                        o.status === 'Done' ? 'badge-success' : 
                        o.status === 'In Progress' ? 'badge-info' : 
                        o.status === 'Cancelled' ? 'badge-danger' : 'badge-warning'
                      }`}>
                        {o.status}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${o.priority === 'High' || o.priority === 'Urgent' ? 'badge-danger' : 'badge-info'}`}>
                        {o.priority}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="table-actions">
                        <button 
                          onClick={() => openModal(o)}
                          className="btn btn-sm btn-secondary text-indigo"
                          title="Modify Order Details"
                        >
                          <Edit size={12} />
                        </button>
                        <button 
                          onClick={() => handleDelete(o.id)}
                          className="btn btn-sm btn-secondary text-danger"
                          title="Remove Order"
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

      {/* Order Dialog Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content slide-in" style={{ maxWidth: '650px' }}>
            <h2 className="modal-title">
              {editingOrder ? `Modify Order - ${editingOrder.id}` : 'Create Operational Order'}
            </h2>
            <p className="modal-subtitle">Log clothing weight, service classifications, charges, and status logs.</p>
            
            <form onSubmit={handleSubmit} className="margin-top-md">
              <h3 className="section-label">1. Customer Identification</h3>
              <div className="grid-2-form">
                <div className="form-group">
                  <label className="form-label">Phone Number *</label>
                  <div className="input-with-icon">
                    <Phone size={14} className="input-inner-icon" />
                    <input 
                      type="tel"
                      required
                      value={formData.customerPhone}
                      onChange={(e) => handleCustomerPhoneChange(e.target.value)}
                      placeholder="e.g. 9876543210"
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
                      placeholder="e.g. Rahul"
                      className="form-input padding-left-icon"
                    />
                  </div>
                </div>
              </div>

              <h3 className="section-label margin-top-sm">2. Service & Financial Details</h3>
              <div className="grid-3-form">
                <div className="form-group">
                  <label className="form-label">Service Type</label>
                  <select
                    value={formData.service}
                    onChange={handleServiceChange}
                    className="form-input form-select"
                  >
                    <option value="Wash+Iron">Wash+Iron</option>
                    <option value="Wash+Fold">Wash+Fold</option>
                    <option value="Dry Clean">Dry Clean</option>
                    <option value="Steam Iron">Steam Ironing</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Weight (Kg) *</label>
                  <input 
                    type="number"
                    step="0.1"
                    min="0.1"
                    required
                    value={formData.weight}
                    onChange={(e) => setFormData({...formData, weight: parseFloat(e.target.value) || 0})}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Rate / Kg (₹)</label>
                  <input 
                    type="number"
                    min="0"
                    required
                    value={formData.pricePerKg}
                    onChange={(e) => setFormData({...formData, pricePerKg: parseFloat(e.target.value) || 0})}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="grid-2-form">
                <div className="form-group">
                  <label className="form-label">Delivery Charges (₹)</label>
                  <input 
                    type="number"
                    min="0"
                    required
                    value={formData.deliveryChrg}
                    onChange={(e) => setFormData({...formData, deliveryChrg: parseFloat(e.target.value) || 0})}
                    className="form-input"
                  />
                </div>
                
                {/* Visual calculation display */}
                <div className="live-calculation-card">
                  <span className="live-calc-label">Total Bill Amount</span>
                  <span className="live-calc-value">₹{liveAmount.toFixed(2)}</span>
                  <span className="live-calc-breakdown">
                    ({formData.weight} Kg × ₹{formData.pricePerKg}/Kg) + ₹{formData.deliveryChrg}
                  </span>
                </div>
              </div>

              <h3 className="section-label margin-top-sm">3. Logistics & Statuses</h3>
              <div className="grid-3-form">
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: e.target.value})}
                    className="form-input form-select"
                  >
                    <option value="Normal">Normal Priority</option>
                    <option value="High">High Priority</option>
                    <option value="Urgent">Urgent Priority</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Payment Status</label>
                  <select
                    value={formData.payment}
                    onChange={(e) => setFormData({...formData, payment: e.target.value})}
                    className="form-input form-select"
                  >
                    <option value="Unpaid">Unpaid</option>
                    <option value="Paid">Paid</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Pickup Log</label>
                  <select
                    value={formData.pickup}
                    onChange={(e) => setFormData({...formData, pickup: e.target.value})}
                    className="form-input form-select"
                  >
                    <option value="No">No Pickup needed</option>
                    <option value="Yes">Yes (Completed)</option>
                    <option value="Pending">Pending pickup</option>
                  </select>
                </div>
              </div>

              <div className="grid-3-form">
                <div className="form-group">
                  <label className="form-label">Delivery Log</label>
                  <select
                    value={formData.delivery}
                    onChange={(e) => setFormData({...formData, delivery: e.target.value})}
                    className="form-input form-select"
                  >
                    <option value="Pending">Pending Delivery</option>
                    <option value="In Progress">In Dispatch</option>
                    <option value="Delivered">Delivered (Done)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Wash Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({
                      ...formData, 
                      status: e.target.value,
                      delivery: e.target.value === 'Done' ? 'Delivered' : formData.delivery
                    })}
                    className="form-input form-select"
                  >
                    <option value="Pending">Pending Wash</option>
                    <option value="In Progress">In Machine</option>
                    <option value="Ready">Ready for pickup</option>
                    <option value="Done">Done & Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Order Date</label>
                  <input 
                    type="text"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    placeholder="DD-MM-YYYY"
                    className="form-input"
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" onClick={closeModal} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingOrder ? 'Save Updates' : 'Confirm Order'}
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
                <AlertCircle size={22} />
              </div>
              <h3 className="confirm-modal-title">Delete Laundry Order</h3>
            </div>
            <p className="confirm-modal-body">
              Are you sure you want to delete this laundry order? If this customer has an active subscription, their remaining weight allowance will be adjusted and refunded automatically.
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
                Delete Order
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        /* Local orders stylesheet specifications */
        .stat-mini {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          background: #ffffff;
          border: 1px solid #f1f5f9;
          border-radius: 16px;
          box-shadow: 0 10px 15px -3px rgba(15, 23, 42, 0.04), 0 4px 6px -2px rgba(15, 23, 42, 0.02);
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .stat-mini:hover {
          transform: translateY(-2px);
          box-shadow: 0 20px 25px -5px rgba(15, 23, 42, 0.08), 0 10px 10px -5px rgba(15, 23, 42, 0.04);
          position: relative;
          z-index: 5;
        }

        .stat-mini-label {
          font-size: 0.75rem;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          line-height: 1;
        }

        .stat-mini-val {
          font-size: 1.85rem;
          font-weight: 800;
          color: #0f172a;
          font-family: var(--font-heading);
          line-height: 1;
        }

        .grid-3-form {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
        }

        .section-label {
          font-size: 0.8rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--primary);
          padding-bottom: 0.25rem;
          border-bottom: 1px solid var(--border);
          margin-bottom: 1rem;
        }

        .input-with-icon {
          position: relative;
        }

        .padding-left-icon {
          padding-left: 2.5rem !important;
        }

        .input-inner-icon {
          position: absolute;
          left: 0.85rem;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
          pointer-events: none;
        }

        .live-calculation-card {
          background: linear-gradient(135deg, #e0e7ff, #eff6ff);
          border: 1px dashed var(--primary);
          border-radius: var(--radius-md);
          padding: 0.75rem 1.25rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          width: 100%;
          min-height: 80px;
        }

        .live-calc-label {
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          color: var(--primary-dark);
          letter-spacing: 0.05em;
        }

        .live-calc-value {
          font-size: 1.5rem;
          font-weight: 800;
          font-family: var(--font-heading);
          color: var(--text-main);
          line-height: 1.1;
        }

        .live-calc-breakdown {
          font-size: 0.65rem;
          color: var(--text-muted);
          font-weight: 500;
        }

        @media (max-width: 600px) {
          .grid-3-form {
            grid-template-columns: 1fr;
            gap: 0;
          }
        }
      `}</style>
    </div>
  );
}
