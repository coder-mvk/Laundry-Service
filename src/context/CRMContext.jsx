/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const CRMContext = createContext();

// ─── Date helper ─────────────────────────────────────────────────
export const getTodayDateString = () => {
  const today = new Date();
  const yyyy = today.getFullYear();
  let mm = today.getMonth() + 1;
  let dd = today.getDate();
  if (dd < 10) dd = '0' + dd;
  if (mm < 10) mm = '0' + mm;
  return dd + '-' + mm + '-' + yyyy;
};

// ─── Toast notification system ───────────────────────────────────
let _toastSetter = null; // module-level ref so useToast() works anywhere

export const useToast = () => {
  const ctx = useContext(CRMContext);
  return ctx ? ctx.showToast : () => {};
};

function ToastContainer({ toasts }) {
  return (
    <div style={{
      position: 'fixed', bottom: '1.5rem', left: '50%',
      transform: 'translateX(-50%)', zIndex: 99999,
      display: 'flex', flexDirection: 'column', gap: '0.5rem',
      alignItems: 'center', pointerEvents: 'none'
    }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          padding: '0.75rem 1.5rem',
          borderRadius: '10px',
          fontWeight: 600,
          fontSize: '0.85rem',
          maxWidth: '520px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
          animation: 'slideUp 0.25s ease',
          background: t.type === 'error' ? '#fef2f2' : t.type === 'success' ? '#f0fdf4' : '#eff6ff',
          color:      t.type === 'error' ? '#991b1b' : t.type === 'success' ? '#166534' : '#1e40af',
          border:     `1px solid ${t.type === 'error' ? '#fca5a5' : t.type === 'success' ? '#86efac' : '#bfdbfe'}`,
          display: 'flex', alignItems: 'flex-start', gap: '0.5rem'
        }}>
          <span>{t.type === 'error' ? '❌' : t.type === 'success' ? '✅' : 'ℹ️'}</span>
          <span>{t.message}</span>
        </div>
      ))}
      <style>{`@keyframes slideUp { from { opacity:0; transform: translateY(12px); } to { opacity:1; transform: translateY(0); } }`}</style>
    </div>
  );
}

// ─── Provider ─────────────────────────────────────────────────────
export const CRMProvider = ({ children }) => {
  const [enquiries,    setEnquiries]    = useState([]);
  const [orders,       setOrders]       = useState([]);
  const [customers,    setCustomers]    = useState([]);
  const [subscriptions,setSubscriptions]= useState([]);
  const [expenses,     setExpenses]     = useState([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [toasts, setToasts] = useState([]);

  // ── Toast helpers ─────────────────────────────────────────────
  const showToast = useCallback((message, type = 'info', duration = 5000) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
  }, []);

  // Helper: show error toast from Supabase error object
  const toastError = useCallback((op, tableName, err) => {
    const msg = `${op} failed on "${tableName}": ${err.message}${err.code ? ` (code ${err.code})` : ''}`;
    console.error(msg, err);
    showToast(msg, 'error', 8000);
  }, [showToast]);

  // ── Fetch all data from Supabase on mount ─────────────────────
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const [enqRes, ordRes, custRes, subRes, expRes] = await Promise.all([
          supabase.from('enquiries').select('*').order('created_at', { ascending: false }),
          supabase.from('orders').select('*').order('created_at', { ascending: false }),
          supabase.from('customers').select('*').order('created_at', { ascending: false }),
          supabase.from('subscriptions').select('*').order('created_at', { ascending: false }),
          supabase.from('expenses').select('*').order('created_at', { ascending: false }),
        ]);

        // Load whatever data succeeded — never block the whole app
        if (enqRes.data)  setEnquiries(enqRes.data);
        if (ordRes.data)  setOrders(ordRes.data);
        if (custRes.data) setCustomers(custRes.data);
        if (subRes.data)  setSubscriptions(subRes.data);
        if (expRes.data)  setExpenses(expRes.data);

        // Only set connectionError if ALL 5 tables failed (true DB outage)
        const allFailed = [enqRes, ordRes, custRes, subRes, expRes].every(r => r.error);
        if (allFailed) {
          const firstErr = enqRes.error || ordRes.error || custRes.error;
          setConnectionError(firstErr?.message || 'Could not connect to database');
        } else {
          // Partial errors: warn via toast but let app run
          [enqRes, ordRes, custRes, subRes, expRes].forEach((r, i) => {
            if (r.error) {
              const names = ['enquiries','orders','customers','subscriptions','expenses'];
              console.warn(`Warning: could not load ${names[i]}:`, r.error.message);
            }
          });
        }
      } catch (err) {
        console.error('Fatal error fetching data:', err);
        setConnectionError(err.message);
      } finally {
        // Always mark as loaded so the app renders
        setIsDataLoaded(true);
      }
    };
    fetchAllData();
  }, []);

  // ─── Customer stats ──────────────────────────────────────────
  const getCustomersWithStats = () => {
    const phoneCounts = {};
    customers.forEach(c => { phoneCounts[c.phone] = (phoneCounts[c.phone] || 0) + 1; });

    return customers.map(c => {
      const customerOrders = orders.filter(o => o.customerPhone === c.phone);
      const totalRevenueSum = customerOrders.reduce((s, o) => s + Number(o.amount || 0), 0);
      let lastOrderDate = 'N/A';
      if (customerOrders.length > 0) {
        const sorted = [...customerOrders].sort((a, b) => {
          const pA = (a.date || '').split('-'), pB = (b.date || '').split('-');
          return new Date(pB[2], pB[1]-1, pB[0]) - new Date(pA[2], pA[1]-1, pA[0]);
        });
        lastOrderDate = sorted[0].date || 'N/A';
      }
      return { ...c, totalOrders: customerOrders.length, totalRevenue: totalRevenueSum, lastOrderDate, duplicateDetected: phoneCounts[c.phone] > 1 };
    });
  };

  // ─── ENQUIRIES ───────────────────────────────────────────────
  const addEnquiry = async (enquiry) => {
    const payload = {
      name:      enquiry.name,
      phone:     enquiry.phone,
      source:    enquiry.source    || 'Direct',
      converted: enquiry.converted || 'Follow-up Pending',
      followUp:  enquiry.followUp  || 'Tomorrow',
      date:      enquiry.date      || getTodayDateString(),
    };
    const { data, error } = await supabase.from('enquiries').insert([payload]).select();
    if (error) { toastError('INSERT', 'enquiries', error); return null; }
    showToast('Enquiry saved successfully!', 'success', 3000);
    setEnquiries(prev => [data[0], ...prev]);
    return data[0];
  };

  const updateEnquiry = async (updatedEnq) => {
    const { totalOrders, totalRevenue, lastOrderDate, duplicateDetected, ...payload } = updatedEnq;
    setEnquiries(prev => prev.map(e => e.id === updatedEnq.id ? updatedEnq : e));
    const { error } = await supabase.from('enquiries').update(payload).eq('id', updatedEnq.id);
    if (error) toastError('UPDATE', 'enquiries', error);
  };

  const deleteEnquiry = async (id) => {
    setEnquiries(prev => prev.filter(e => e.id !== id));
    const { error } = await supabase.from('enquiries').delete().eq('id', id);
    if (error) toastError('DELETE', 'enquiries', error);
  };

  // ─── ORDERS ─────────────────────────────────────────────────
  const addOrder = async (order) => {
    const computedAmount = (Number(order.pricePerKg||0) * Number(order.weight||0)) + Number(order.deliveryChrg||0);
    const payload = {
      customerPhone: order.customerPhone,
      customerName:  order.customerName,
      service:       order.service      || 'Wash+Iron',
      weight:        Number(order.weight       || 0),
      pricePerKg:    Number(order.pricePerKg   || 0),
      deliveryChrg:  Number(order.deliveryChrg || 0),
      amount:        computedAmount,
      payment:       order.payment  || 'Unpaid',
      pickup:        order.pickup   || 'No',
      delivery:      order.delivery || 'Pending',
      status:        order.status   || 'Pending',
      priority:      order.priority || 'Normal',
      date:          order.date     || getTodayDateString(),
    };
    const { data, error } = await supabase.from('orders').insert([payload]).select();
    if (error) { toastError('INSERT', 'orders', error); return null; }
    showToast('Order saved successfully!', 'success', 3000);
    setOrders(prev => [data[0], ...prev]);
    return data[0];
  };

  const updateOrder = async (updatedOrd) => {
    const computedAmount = (Number(updatedOrd.pricePerKg||0) * Number(updatedOrd.weight||0)) + Number(updatedOrd.deliveryChrg||0);
    const finalOrd = { ...updatedOrd, amount: computedAmount };

    const oldOrd = orders.find(o => o.id === updatedOrd.id);
    if (oldOrd && oldOrd.weight !== finalOrd.weight) {
      const customerSub = subscriptions.find(s => s.phone === finalOrd.customerPhone && s.renewalStatus === 'Active');
      if (customerSub) {
        updateSubscription({ ...customerSub, remainingKg: Math.max(0, Number(customerSub.remainingKg) - (Number(finalOrd.weight) - Number(oldOrd.weight))) });
      }
    }
    setOrders(prev => prev.map(o => o.id === finalOrd.id ? finalOrd : o));
    const { error } = await supabase.from('orders').update(finalOrd).eq('id', finalOrd.id);
    if (error) toastError('UPDATE', 'orders', error);
  };

  const deleteOrder = async (id) => {
    const ord = orders.find(o => o.id === id);
    if (ord) {
      const customerSub = subscriptions.find(s => s.phone === ord.customerPhone && s.renewalStatus === 'Active');
      if (customerSub) updateSubscription({ ...customerSub, remainingKg: Number(customerSub.remainingKg) + Number(ord.weight||0) });
    }
    setOrders(prev => prev.filter(o => o.id !== id));
    const { error } = await supabase.from('orders').delete().eq('id', id);
    if (error) toastError('DELETE', 'orders', error);
  };

  // ─── CUSTOMERS ──────────────────────────────────────────────
  const addCustomer = async (customer) => {
    const payload = {
      name:         customer.name,
      phone:        customer.phone,
      area:         customer.area         || '',
      address:      customer.address      || 'N/A',
      customerType: customer.customerType || 'Residential',
      plan:         customer.plan         || 'None',
      status:       customer.status       || 'Active',
    };
    const { data, error } = await supabase.from('customers').insert([payload]).select();
    if (error) {
      toastError('INSERT', 'customers', error);
      return false;
    }
    if (data?.length) {
      showToast('Customer saved successfully!', 'success', 3000);
      setCustomers(prev => [data[0], ...prev]);
      return true;
    }
    return false;
  };

  const updateCustomer = async (updatedCust) => {
    const { totalOrders, totalRevenue, lastOrderDate, duplicateDetected, ...payload } = updatedCust;
    setCustomers(prev => prev.map(c => c.id === updatedCust.id ? updatedCust : c));
    const { error } = await supabase.from('customers').update(payload).eq('id', updatedCust.id);
    if (error) {
      toastError('UPDATE', 'customers', error);
      return false;
    }
    showToast('Customer updated successfully!', 'success', 3000);
    return true;
  };

  const deleteCustomer = async (id) => {
    setCustomers(prev => prev.filter(c => c.id !== id));
    const { error } = await supabase.from('customers').delete().eq('id', id);
    if (error) toastError('DELETE', 'customers', error);
  };

  // ─── SUBSCRIPTIONS ──────────────────────────────────────────
  const addSubscription = async (sub) => {
    const payload = {
      customerName:  sub.customerName,
      phone:         sub.phone,
      plan:          sub.plan          || 'Silver',
      startDate:     sub.startDate     || getTodayDateString(),
      endDate:       sub.endDate       || '',
      remainingKg:   Number(sub.remainingKg || 0),
      renewalStatus: sub.renewalStatus || 'Active',
    };
    const { data, error } = await supabase.from('subscriptions').insert([payload]).select();
    if (error) { toastError('INSERT', 'subscriptions', error); return null; }
    showToast('Subscription saved successfully!', 'success', 3000);
    setSubscriptions(prev => [data[0], ...prev]);
    const cust = customers.find(c => c.phone === sub.phone);
    if (cust && cust.plan !== sub.plan) updateCustomer({ ...cust, plan: sub.plan });
    return data[0];
  };

  const updateSubscription = async (updatedSub) => {
    setSubscriptions(prev => prev.map(s => s.id === updatedSub.id ? updatedSub : s));
    const { error } = await supabase.from('subscriptions').update(updatedSub).eq('id', updatedSub.id);
    if (error) toastError('UPDATE', 'subscriptions', error);
    const cust = customers.find(c => c.phone === updatedSub.phone);
    if (cust && cust.plan !== updatedSub.plan) updateCustomer({ ...cust, plan: updatedSub.plan });
  };

  const deleteSubscription = async (id) => {
    const sub = subscriptions.find(s => s.id === id);
    if (sub) {
      const cust = customers.find(c => c.phone === sub.phone);
      if (cust) updateCustomer({ ...cust, plan: 'None' });
    }
    setSubscriptions(prev => prev.filter(s => s.id !== id));
    const { error } = await supabase.from('subscriptions').delete().eq('id', id);
    if (error) toastError('DELETE', 'subscriptions', error);
  };

  // ─── EXPENSES ───────────────────────────────────────────────
  const addExpense = async (expense) => {
    const payload = {
      type:   expense.type   || 'Petrol',
      amount: Number(expense.amount || 0),
      notes:  expense.notes  || '',
      date:   expense.date   || getTodayDateString(),
    };
    const { data, error } = await supabase.from('expenses').insert([payload]).select();
    if (error) { toastError('INSERT', 'expenses', error); return null; }
    showToast('Expense saved successfully!', 'success', 3000);
    setExpenses(prev => [data[0], ...prev]);
    return data[0];
  };

  const updateExpense = async (updatedExp) => {
    setExpenses(prev => prev.map(e => e.id === updatedExp.id ? updatedExp : e));
    const { error } = await supabase.from('expenses').update(updatedExp).eq('id', updatedExp.id);
    if (error) toastError('UPDATE', 'expenses', error);
  };

  const deleteExpense = async (id) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (error) toastError('DELETE', 'expenses', error);
  };

  const clearAllData = async () => {
    const tables = ['orders', 'customers', 'subscriptions', 'enquiries', 'expenses'];
    try {
      for (const table of tables) {
        const { error } = await supabase.from(table).delete().not('id', 'is', null);
        if (error) {
          toastError('DELETE', table, error);
          return false;
        }
      }
      setEnquiries([]);
      setOrders([]);
      setCustomers([]);
      setSubscriptions([]);
      setExpenses([]);
      showToast('All CRM data has been cleared.', 'success', 3000);
      return true;
    } catch (err) {
      console.error('clearAllData error:', err);
      showToast(`Unable to clear CRM data: ${err.message || err}`, 'error', 8000);
      return false;
    }
  };

  const restoreSeedData = async () => {
    const demoCustomers = [
      { name: 'Asha Patel', phone: '9876543210', area: 'MG Road', address: '121 Main Street', customerType: 'Residential', plan: 'Silver', status: 'Active' },
      { name: 'Ravi Shah', phone: '9123456780', area: 'Baner', address: '34 Lotus Apartments', customerType: 'Residential', plan: 'Gold', status: 'Active' },
      { name: 'Neha Verma', phone: '9988776655', area: 'Kalyani Nagar', address: '78 Horizon Tower', customerType: 'Commercial', plan: 'Platinum', status: 'Active' }
    ];

    const demoSubscriptions = [
      { customerName: 'Asha Patel', phone: '9876543210', plan: 'Silver', startDate: getTodayDateString(), endDate: '', remainingKg: 30, renewalStatus: 'Active' },
      { customerName: 'Ravi Shah', phone: '9123456780', plan: 'Gold', startDate: getTodayDateString(), endDate: '', remainingKg: 45, renewalStatus: 'Active' }
    ];

    const demoOrders = [
      { customerPhone: '9876543210', customerName: 'Asha Patel', service: 'Wash+Iron', weight: 6, pricePerKg: 65, deliveryChrg: 25, amount: 415, payment: 'Unpaid', pickup: 'Yes', delivery: 'Pending', status: 'Pending', priority: 'Normal', date: getTodayDateString() },
      { customerPhone: '9123456780', customerName: 'Ravi Shah', service: 'Dry Clean', weight: 4, pricePerKg: 85, deliveryChrg: 35, amount: 375, payment: 'Paid', pickup: 'Yes', delivery: 'Delivered', status: 'Done', priority: 'High', date: getTodayDateString() }
    ];

    const demoEnquiries = [
      { name: 'Pooja Desai', phone: '9012345678', source: 'Instagram', converted: 'Follow-up Pending', followUp: 'Tomorrow', date: getTodayDateString() },
      { name: 'Karan Mehta', phone: '9023456789', source: 'Referral', converted: 'Follow-up Pending', followUp: 'Today', date: getTodayDateString() }
    ];

    const demoExpenses = [
      { type: 'Detergent', amount: 850, notes: 'Monthly detergent refill', date: getTodayDateString() },
      { type: 'Fuel', amount: 1200, notes: 'Delivery petrol expense', date: getTodayDateString() }
    ];

    const cleared = await clearAllData();
    if (!cleared) return false;

    try {
      const [{ data: custData, error: custError }, { data: subData, error: subError }, { data: ordData, error: ordError }, { data: enqData, error: enqError }, { data: expData, error: expError }] = await Promise.all([
        supabase.from('customers').insert(demoCustomers).select(),
        supabase.from('subscriptions').insert(demoSubscriptions).select(),
        supabase.from('orders').insert(demoOrders).select(),
        supabase.from('enquiries').insert(demoEnquiries).select(),
        supabase.from('expenses').insert(demoExpenses).select(),
      ]);

      if (custError) toastError('INSERT', 'customers', custError);
      if (subError) toastError('INSERT', 'subscriptions', subError);
      if (ordError) toastError('INSERT', 'orders', ordError);
      if (enqError) toastError('INSERT', 'enquiries', enqError);
      if (expError) toastError('INSERT', 'expenses', expError);

      if (custError || subError || ordError || enqError || expError) return false;

      setCustomers(custData || []);
      setSubscriptions(subData || []);
      setOrders(ordData || []);
      setEnquiries(enqData || []);
      setExpenses(expData || []);
      showToast('Demo dataset restored successfully.', 'success', 3000);
      return true;
    } catch (err) {
      console.error('restoreSeedData error:', err);
      showToast(`Unable to restore demo dataset: ${err.message || err}`, 'error', 8000);
      return false;
    }
  };

  // ─── Enquiry → Order Conversion ─────────────────────────────
  const convertEnquiryToOrder = (enquiryId) => {
    const enq = enquiries.find(e => e.id === enquiryId);
    if (!enq) return null;
    const existingCustomer = customers.find(c => c.phone === enq.phone);
    if (!existingCustomer) {
      addCustomer({ name: enq.name, phone: enq.phone, area: 'Converted Enquiry', address: 'N/A', customerType: 'Residential', plan: 'None', status: 'Active' });
    }
    updateEnquiry({ ...enq, converted: 'Yes', followUp: 'Completed' });
    return { customerPhone: enq.phone, customerName: enq.name, service: 'Wash+Iron', pricePerKg: 70, weight: 5, deliveryChrg: 50, payment: 'Unpaid', pickup: 'No', delivery: 'Pending', status: 'Pending', priority: 'Normal' };
  };

  return (
    <CRMContext.Provider value={{
      enquiries, orders, customers: getCustomersWithStats(), subscriptions, expenses,
      isDataLoaded, connectionError, showToast,
      clearAllData, restoreSeedData,
      addEnquiry, updateEnquiry, deleteEnquiry,
      addOrder, updateOrder, deleteOrder,
      addCustomer, updateCustomer, deleteCustomer,
      addSubscription, updateSubscription, deleteSubscription,
      addExpense, updateExpense, deleteExpense,
      convertEnquiryToOrder,
    }}>
      {children}
      <ToastContainer toasts={toasts} />
    </CRMContext.Provider>
  );
};

export const useCRM = () => {
  const context = useContext(CRMContext);
  if (!context) throw new Error('useCRM must be used within a CRMProvider');
  return context;
};
