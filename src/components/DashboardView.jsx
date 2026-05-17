import { 
  TrendingUp, 
  IndianRupee, 
  ShoppingCart, 
  Users, 
  ArrowUpRight, 
  ArrowDownRight, 
  Calendar,
  AlertTriangle,
  Sparkles,
  Activity,
  Plus
} from 'lucide-react';
import { useCRM } from '../context/CRMContext';

export default function DashboardView({ setActiveTab, setPrefilledForm }) {
  const { orders, enquiries, subscriptions, expenses } = useCRM();

  // Dynamic Metric Calculations
  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.amount || 0), 0);
  const totalOrders = orders.length;
  
  const convertedEnquiries = enquiries.filter(e => e.converted === 'Yes').length;
  const totalEnquiries = enquiries.length;
  const conversionRate = totalEnquiries > 0 ? ((convertedEnquiries / totalEnquiries) * 100).toFixed(1) : 0;
  
  const activeSubs = subscriptions.filter(s => s.renewalStatus === 'Active').length;
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  
  const netProfit = totalRevenue - totalExpenses;
  const isProfitable = netProfit >= 0;

  // Find recent orders (last 4 orders)
  const recentOrders = [...orders].slice(0, 4);

  // Find urgent pending follow-ups
  const pendingFollowups = enquiries.filter(e => e.converted === 'Follow-up Pending');

  // Compute Source Distribution for Chart
  const sources = ['Whatsapp', 'Call', 'Website', 'Referral', 'Walk-in'];
  const sourceCounts = sources.reduce((acc, src) => {
    acc[src] = enquiries.filter(e => e.source.toLowerCase() === src.toLowerCase()).length;
    return acc;
  }, {});

  // Quick Action Handlers
  const handleQuickAction = (tab, formType) => {
    if (formType) {
      setPrefilledForm(formType);
    }
    setActiveTab(tab);
  };

  return (
    <div className="fade-in">
      <div className="flex-row-between margin-bottom-md">
        <div>
          <h1 className="page-title">Operational Dashboard</h1>
          <p className="page-subtitle">Real-time statistics & financial insights for A-1 Laundry Service</p>
        </div>
        <div className="date-badge">
          <Calendar size={16} />
          <span>{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid-cols-4">
        {/* Revenue Card */}
        <div className="glass-card metric-card border-left-indigo">
          <div className="metric-icon-wrapper bg-indigo-light text-indigo">
            <IndianRupee size={24} />
          </div>
          <div className="metric-info">
            <span className="metric-val">₹{totalRevenue.toLocaleString('en-IN')}</span>
            <span className="metric-label">Total Revenue</span>
          </div>
        </div>

        {/* Orders Card */}
        <div className="glass-card metric-card border-left-cyan">
          <div className="metric-icon-wrapper bg-cyan-light text-cyan">
            <ShoppingCart size={24} />
          </div>
          <div className="metric-info">
            <span className="metric-val">{totalOrders}</span>
            <span className="metric-label">Total Orders</span>
          </div>
        </div>

        {/* Conversion Rate Card */}
        <div className="glass-card metric-card border-left-emerald">
          <div className="metric-icon-wrapper bg-emerald-light text-emerald">
            <TrendingUp size={24} />
          </div>
          <div className="metric-info">
            <span className="metric-val">{conversionRate}%</span>
            <span className="metric-label">Lead Conversion</span>
          </div>
        </div>

        {/* Active Subscriptions */}
        <div className="glass-card metric-card border-left-amber">
          <div className="metric-icon-wrapper bg-amber-light text-amber">
            <Users size={24} />
          </div>
          <div className="metric-info">
            <span className="metric-val">{activeSubs}</span>
            <span className="metric-label">Active Subscriptions</span>
          </div>
        </div>
      </div>

      {/* Financial Health Summary Callout */}
      <div className="glass-card profit-banner margin-bottom-md">
        <div className="profit-banner-left">
          <div className="sparkle-icon">
            <Sparkles size={22} />
          </div>
          <div>
            <h3>Cash Flow & Net Performance</h3>
            <p>Calculated total earnings minus operational expenses (detergents, water bills, fuels).</p>
          </div>
        </div>
        <div className="profit-banner-right">
          <div className="financial-stats">
            <div className="fin-stat">
              <span className="fin-label">Revenue</span>
              <span className="fin-val text-indigo">₹{totalRevenue}</span>
            </div>
            <div className="fin-stat-operator">-</div>
            <div className="fin-stat">
              <span className="fin-label">Expenses</span>
              <span className="fin-val text-danger">₹{totalExpenses}</span>
            </div>
            <div className="fin-stat-operator">=</div>
            <div className={`fin-stat profit-container ${isProfitable ? 'text-success' : 'text-danger'}`}>
              <span className="fin-label">Net Performance</span>
              <span className="fin-val font-extrabold flex items-center">
                {isProfitable ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                ₹{netProfit}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Shortcuts Panel */}
      <div className="glass-card margin-bottom-md bg-gradient-action text-white">
        <div className="flex-row-between flex-wrap gap-4">
          <div>
            <h3 className="text-lg font-bold" style={{ color: '#ffffff' }}>Quick Actions Panel</h3>
            <p className="text-sm" style={{ color: '#ffffff', opacity: 0.9 }}>Instantly log records from anywhere within the CRM</p>
          </div>
          <div className="action-buttons-container">
            <button onClick={() => handleQuickAction('orders', 'new')} className="btn btn-primary bg-white text-indigo-900 border-none hover:bg-slate-100">
              <Plus size={16} /> New Order
            </button>
            <button onClick={() => handleQuickAction('enquiries', 'new')} className="btn btn-accent bg-cyan-400 text-slate-900 border-none hover:bg-cyan-300">
              <Plus size={16} /> New Lead Enquiry
            </button>
            <button onClick={() => handleQuickAction('expenses', 'new')} className="btn btn-secondary bg-slate-800 text-white border-slate-700 hover:bg-slate-700">
              <Plus size={16} /> Log Expense
            </button>
          </div>
        </div>
      </div>

      {/* Charts & Graphs Layout */}
      <div className="grid-cols-2">
        {/* Custom SVG Bar Chart: Financial Trends */}
        <div className="glass-card">
          <div className="chart-header flex-row-between">
            <div>
              <h3 className="chart-title">Financial Trends</h3>
              <span className="chart-subtitle">Revenue vs Expenses Comparison</span>
            </div>
            <div className="chart-legends">
              <div className="chart-legend"><span className="legend-dot bg-indigo"></span><span>Revenue</span></div>
              <div className="chart-legend"><span className="legend-dot bg-danger"></span><span>Expenses</span></div>
            </div>
          </div>
          <div className="svg-chart-container">
            {/* Elegant Responsive SVG Bar Chart */}
            <svg viewBox="0 0 400 200" className="svg-chart">
              {/* Grid Lines */}
              <line x1="40" y1="20" x2="380" y2="20" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="40" y1="60" x2="380" y2="60" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="40" y1="100" x2="380" y2="100" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="40" y1="140" x2="380" y2="140" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="40" y1="170" x2="380" y2="170" stroke="#cbd5e1" strokeWidth="2" />

              {/* Data Bars */}
              {/* Month 1: Demo (Previous Month) */}
              <rect x="80" y="50" width="22" height="120" rx="3" fill="var(--primary)" opacity="0.65" />
              <rect x="106" y="90" width="22" height="80" rx="3" fill="var(--danger)" opacity="0.65" />
              <text x="104" y="185" className="chart-text" textAnchor="middle">Prev Month</text>

              {/* Month 2: Current (Seeded Month calculations) */}
              {/* Dynamic calculations based on state data */}
              <rect x="230" y={Math.max(20, 170 - (totalRevenue / 50))} width="22" height={Math.min(150, totalRevenue / 50)} rx="3" fill="var(--primary)" />
              <rect x="256" y={Math.max(20, 170 - (totalExpenses / 50))} width="22" height={Math.min(150, totalExpenses / 50)} rx="3" fill="var(--danger)" />
              <text x="254" y="185" className="chart-text font-bold" textAnchor="middle">Current Month</text>
            </svg>
          </div>
        </div>

        {/* Leads Acquisition Distribution */}
        <div className="glass-card">
          <h3 className="chart-title">Lead Acquisition Channels</h3>
          <span className="chart-subtitle">Distribution of laundry customer sources</span>
          
          <div className="source-list margin-top-md">
            {sources.map(src => {
              const count = sourceCounts[src] || 0;
              const percentage = totalEnquiries > 0 ? ((count / totalEnquiries) * 100).toFixed(0) : 0;
              return (
                <div key={src} className="source-item">
                  <div className="flex-row-between text-sm font-semibold margin-bottom-xs">
                    <span>{src}</span>
                    <span className="text-muted">{count} leads ({percentage}%)</span>
                  </div>
                  <div className="source-bar-bg">
                    <div 
                      className={`source-bar-fill ${src === 'Whatsapp' ? 'bg-whatsapp' : src === 'Call' ? 'bg-call' : 'bg-primary'}`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Grid: Recent activity vs Follow-up alerts */}
      <div className="grid-cols-2">
        {/* Recent Orders List */}
        <div className="glass-card">
          <div className="flex-row-between margin-bottom-md">
            <h3 className="card-inner-title flex items-center gap-2">
              <Activity size={18} className="text-indigo" /> Recent Activity Stream
            </h3>
            <button onClick={() => setActiveTab('orders')} className="btn btn-sm btn-secondary">
              View All
            </button>
          </div>
          
          {recentOrders.length === 0 ? (
            <p className="no-data-text">No active orders placed yet.</p>
          ) : (
            <div className="recent-orders-list">
              {recentOrders.map(o => (
                <div key={o.id} className="recent-order-row">
                  <div className="recent-order-avatar">ORD</div>
                  <div className="recent-order-details">
                    <span className="ro-name">{o.customerName}</span>
                    <span className="ro-service">{o.service} • {o.weight} Kg</span>
                  </div>
                  <div className="recent-order-financials">
                    <span className="ro-amt">₹{o.amount}</span>
                    <span className={`badge ${o.payment === 'Paid' ? 'badge-success' : 'badge-danger'} badge-pill`}>
                      {o.payment}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actionable Followups */}
        <div className="glass-card">
          <h3 className="card-inner-title margin-bottom-md flex items-center gap-2">
            <AlertTriangle size={18} className="text-warning" /> Pending Lead Follow-ups
          </h3>
          
          {pendingFollowups.length === 0 ? (
            <div className="no-followups-splash">
              <div className="check-icon-large">✓</div>
              <p>Awesome! All enquiry follow-ups have been resolved or converted.</p>
            </div>
          ) : (
            <div className="followup-list">
              {pendingFollowups.map(f => (
                <div key={f.id} className="followup-row">
                  <div className="followup-main">
                    <div className="followup-header flex items-center gap-2">
                      <span className="followup-name">{f.name}</span>
                      <span className="badge badge-info">{f.source}</span>
                    </div>
                    <span className="followup-phone">{f.phone}</span>
                  </div>
                  <div className="followup-action-container">
                    <span className="followup-time text-warning font-bold">{f.followUp}</span>
                    <button 
                      onClick={() => handleQuickAction('enquiries')}
                      className="btn btn-sm btn-primary bg-indigo-600 border-none"
                    >
                      Resolve
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        /* Local Dashboard view components style sheets */
        .date-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background-color: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-full);
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-muted);
        }

        .border-left-indigo { border-left: 4px solid var(--primary); }
        .border-left-cyan { border-left: 4px solid var(--secondary); }
        .border-left-emerald { border-left: 4px solid var(--success); }
        .border-left-amber { border-left: 4px solid var(--warning); }

        .bg-indigo-light { background-color: var(--primary-light); }
        .bg-cyan-light { background-color: var(--secondary-light); }
        .bg-emerald-light { background-color: var(--success-light); }
        .bg-amber-light { background-color: var(--warning-light); }

        .profit-banner {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: linear-gradient(135deg, #eff6ff, #f0fdf4);
          border: 1px solid #dbeafe;
          padding: 1.5rem 2rem;
          border-radius: var(--radius-lg);
        }

        .profit-banner-left {
          display: flex;
          align-items: center;
          gap: 1.25rem;
        }

        .sparkle-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 3rem;
          height: 3rem;
          background-color: var(--primary-light);
          color: var(--primary);
          border-radius: var(--radius-md);
        }

        .profit-banner-left h3 {
          font-size: 1.15rem;
          font-weight: 700;
          margin-bottom: 0.15rem;
        }

        .profit-banner-left p {
          font-size: 0.85rem;
          color: var(--text-muted);
        }

        .financial-stats {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }

        .fin-stat {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }

        .fin-label {
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          color: var(--text-muted);
          letter-spacing: 0.05em;
        }

        .fin-val {
          font-size: 1.25rem;
          font-weight: 800;
          font-family: var(--font-heading);
        }

        .fin-stat-operator {
          font-size: 1.5rem;
          font-weight: 300;
          color: var(--text-muted);
        }

        .profit-container .fin-val {
          font-size: 1.5rem;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .bg-gradient-action {
          background: linear-gradient(135deg, #312e81, #1e1b4b);
          border: none;
        }

        .action-buttons-container {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        /* Chart Components */
        .chart-header {
          margin-bottom: 1.25rem;
        }

        .chart-title {
          font-size: 1.15rem;
          font-weight: 700;
        }

        .chart-subtitle {
          font-size: 0.85rem;
          color: var(--text-muted);
        }

        .chart-legends {
          display: flex;
          gap: 1rem;
        }

        .chart-legend {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .legend-dot {
          width: 8px;
          height: 8px;
          border-radius: var(--radius-full);
        }

        .legend-dot.bg-indigo { background-color: var(--primary); }
        .legend-dot.bg-danger { background-color: var(--danger); }

        .svg-chart-container {
          height: 220px;
          width: 100%;
          display: flex;
          justify-content: center;
        }

        .svg-chart {
          width: 100%;
          height: 100%;
        }

        .chart-text {
          font-size: 8px;
          fill: var(--text-muted);
          font-weight: 500;
        }

        /* Lead source progress bars */
        .source-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .margin-bottom-xs {
          margin-bottom: 0.25rem;
        }

        .source-bar-bg {
          height: 8px;
          width: 100%;
          background-color: var(--border);
          border-radius: var(--radius-full);
          overflow: hidden;
        }

        .source-bar-fill {
          height: 100%;
          border-radius: var(--radius-full);
          transition: width var(--transition-slow);
        }

        .bg-whatsapp { background-color: #25d366; }
        .bg-call { background-color: #0ea5e9; }

        /* Recent Activity lists */
        .recent-orders-list, .followup-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-top: 1rem;
        }

        .recent-order-row {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.75rem;
          border-radius: var(--radius-md);
          background-color: var(--bg-main);
          border: 1px solid var(--border);
          transition: transform var(--transition-fast);
        }

        .recent-order-row:hover {
          transform: translateX(3px);
        }

        .recent-order-avatar {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 2.25rem;
          height: 2.25rem;
          border-radius: var(--radius-full);
          background-color: var(--primary-light);
          color: var(--primary);
          font-size: 0.7rem;
          font-weight: 800;
        }

        .recent-order-details {
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .ro-name {
          font-size: 0.9rem;
          font-weight: 700;
        }

        .ro-service {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .recent-order-financials {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.15rem;
        }

        .ro-amt {
          font-size: 0.9rem;
          font-weight: 700;
        }

        /* Followups */
        .no-followups-splash {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 180px;
          text-align: center;
          color: var(--text-muted);
          padding: 1.5rem;
        }

        .check-icon-large {
          font-size: 2.5rem;
          color: var(--success);
          margin-bottom: 0.5rem;
          background-color: var(--success-light);
          width: 4rem;
          height: 4rem;
          border-radius: var(--radius-full);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
        }

        .followup-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.85rem 1rem;
          border-radius: var(--radius-md);
          background-color: var(--bg-main);
          border: 1px solid var(--border);
        }

        .followup-main {
          display: flex;
          flex-direction: column;
        }

        .followup-name {
          font-size: 0.9rem;
          font-weight: 700;
        }

        .followup-phone {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .followup-action-container {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .followup-time {
          font-size: 0.85rem;
        }

        @media (max-width: 1024px) {
          .profit-banner {
            flex-direction: column;
            gap: 1rem;
            align-items: flex-start;
          }
          .financial-stats {
            gap: 0.75rem;
            flex-wrap: wrap;
          }
        }
      `}</style>
    </div>
  );
}
