/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../lib/supabase';

const CRMContext = createContext();

// Helper to format dates consistently (DD-MM-YYYY)
export const getTodayDateString = () => {
  const today = new Date();
  const yyyy = today.getFullYear();
  let mm = today.getMonth() + 1; // Months start at 0!
  let dd = today.getDate();
  if (dd < 10) dd = '0' + dd;
  if (mm < 10) mm = '0' + mm;
  return dd + '-' + mm + '-' + yyyy;
};

export const CRMProvider = ({ children }) => {
  const [enquiries, setEnquiries] = useState([]);
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Fetch Data from Supabase on mount
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const [enqRes, ordRes, custRes, subRes, expRes] = await Promise.all([
          supabase.from('enquiries').select('*').order('created_at', { ascending: false }),
          supabase.from('orders').select('*').order('created_at', { ascending: false }),
          supabase.from('customers').select('*').order('created_at', { ascending: false }),
          supabase.from('subscriptions').select('*').order('created_at', { ascending: false }),
          supabase.from('expenses').select('*').order('created_at', { ascending: false })
        ]);
        
        if (enqRes.data) setEnquiries(enqRes.data);
        if (ordRes.data) setOrders(ordRes.data);
        if (custRes.data) setCustomers(custRes.data);
        if (subRes.data) setSubscriptions(subRes.data);
        if (expRes.data) setExpenses(expRes.data);
      } catch (err) {
        console.error('Error fetching data from Supabase', err);
      } finally {
        setIsDataLoaded(true);
      }
    };
    fetchAllData();
  }, []);

  // Compute 360 Customer Master Dynamic Statistics on-the-fly
  const getCustomersWithStats = () => {
    // Detect duplicate phone numbers in the system
    const phoneCounts = {};
    customers.forEach(c => {
      phoneCounts[c.phone] = (phoneCounts[c.phone] || 0) + 1;
    });

    return customers.map(c => {
      const customerOrders = orders.filter(o => o.customerPhone === c.phone);
      const totalOrdersCount = customerOrders.length;
      const totalRevenueSum = customerOrders.reduce((sum, o) => sum + Number(o.amount || 0), 0);
      
      let lastOrderDate = 'N/A';
      if (customerOrders.length > 0) {
        // Find maximum order date by sorting (or simple comparison)
        const sorted = [...customerOrders].sort((a, b) => {
          const partsA = a.date.split('-');
          const partsB = b.date.split('-');
          // Convert DD-MM-YYYY to Date
          return new Date(partsB[2], partsB[1] - 1, partsB[0]) - new Date(partsA[2], partsA[1] - 1, partsA[0]);
        });
        lastOrderDate = sorted[0].date;
      }

      return {
        ...c,
        totalOrders: totalOrdersCount,
        totalRevenue: totalRevenueSum,
        lastOrderDate,
        duplicateDetected: phoneCounts[c.phone] > 1
      };
    });
  };

  // Mutators: Enquiries
  const addEnquiry = async (enquiry) => {
    const newEnq = {
      ...enquiry,
      id: `ENQ${Date.now()}`, // More reliable unique ID than length
      date: enquiry.date || getTodayDateString()
    };
    setEnquiries(prev => [newEnq, ...prev]);
    const { error } = await supabase.from('enquiries').insert([newEnq]);
    if (error) console.error('Error adding enquiry:', error);
    return newEnq;
  };

  const updateEnquiry = async (updatedEnq) => {
    setEnquiries(prev => prev.map(e => e.id === updatedEnq.id ? updatedEnq : e));
    const { error } = await supabase.from('enquiries').update(updatedEnq).eq('id', updatedEnq.id);
    if (error) console.error('Error updating enquiry:', error);
  };

  const deleteEnquiry = async (id) => {
    setEnquiries(prev => prev.filter(e => e.id !== id));
    const { error } = await supabase.from('enquiries').delete().eq('id', id);
    if (error) console.error('Error deleting enquiry:', error);
  };

  // Mutators: Orders
  const addOrder = async (order) => {
    const computedAmount = (Number(order.pricePerKg || 0) * Number(order.weight || 0)) + Number(order.deliveryChrg || 0);
    const newOrd = {
      ...order,
      id: `ORD${Date.now()}`,
      date: order.date || getTodayDateString(),
      amount: computedAmount
    };

    setOrders(prev => [newOrd, ...prev]);
    const { error } = await supabase.from('orders').insert([newOrd]);
    if (error) console.error('Error adding order:', error);

    // Check if customer exists in Customer Master, if not add them
    const customerExists = customers.some(c => c.phone === order.customerPhone);
    if (!customerExists) {
      addCustomer({
        name: order.customerName,
        phone: order.customerPhone,
        area: 'New Customer',
        address: 'N/A',
        customerType: 'Residential',
        plan: 'None',
        status: 'Active'
      });
    }

    // If customer has subscription and this service counts against weight, deduct remaining KG
    const customerSub = subscriptions.find(s => s.phone === order.customerPhone && s.renewalStatus === 'Active');
    if (customerSub) {
      updateSubscription({
        ...customerSub,
        remainingKg: Math.max(0, Number(customerSub.remainingKg) - Number(order.weight || 0))
      });
    }

    return newOrd;
  };

  const updateOrder = async (updatedOrd) => {
    const computedAmount = (Number(updatedOrd.pricePerKg || 0) * Number(updatedOrd.weight || 0)) + Number(updatedOrd.deliveryChrg || 0);
    const finalOrd = { ...updatedOrd, amount: computedAmount };
    
    // We adjust subscription if order weight changed
    const oldOrd = orders.find(o => o.id === updatedOrd.id);
    if (oldOrd && oldOrd.weight !== finalOrd.weight) {
      const customerSub = subscriptions.find(s => s.phone === finalOrd.customerPhone && s.renewalStatus === 'Active');
      if (customerSub) {
        const weightDifference = Number(finalOrd.weight) - Number(oldOrd.weight);
        updateSubscription({
          ...customerSub,
          remainingKg: Math.max(0, Number(customerSub.remainingKg) - weightDifference)
        });
      }
    }

    setOrders(prev => prev.map(o => o.id === finalOrd.id ? finalOrd : o));
    const { error } = await supabase.from('orders').update(finalOrd).eq('id', finalOrd.id);
    if (error) console.error('Error updating order:', error);
  };

  const deleteOrder = async (id) => {
    // Reverse subscription deduction if deleted
    const ord = orders.find(o => o.id === id);
    if (ord) {
      const customerSub = subscriptions.find(s => s.phone === ord.customerPhone && s.renewalStatus === 'Active');
      if (customerSub) {
        updateSubscription({
          ...customerSub,
          remainingKg: Number(customerSub.remainingKg) + Number(ord.weight || 0)
        });
      }
    }
    setOrders(prev => prev.filter(o => o.id !== id));
    const { error } = await supabase.from('orders').delete().eq('id', id);
    if (error) console.error('Error deleting order:', error);
  };

  // Mutators: Customers
  const addCustomer = async (customer) => {
    const newCust = {
      ...customer,
      id: `CUST${Date.now()}`,
      status: customer.status || 'Active'
    };
    setCustomers(prev => [newCust, ...prev]);
    const { error } = await supabase.from('customers').insert([newCust]);
    if (error) console.error('Error adding customer:', error);
    return newCust;
  };

  const updateCustomer = async (updatedCust) => {
    setCustomers(prev => prev.map(c => c.id === updatedCust.id ? updatedCust : c));
    const { error } = await supabase.from('customers').update(updatedCust).eq('id', updatedCust.id);
    if (error) console.error('Error updating customer:', error);
  };

  const deleteCustomer = async (id) => {
    setCustomers(prev => prev.filter(c => c.id !== id));
    const { error } = await supabase.from('customers').delete().eq('id', id);
    if (error) console.error('Error deleting customer:', error);
  };

  // Mutators: Subscriptions
  const addSubscription = async (sub) => {
    const newSub = {
      ...sub,
      id: `SUB${Date.now()}`,
      renewalStatus: sub.renewalStatus || 'Active'
    };
    setSubscriptions(prev => [newSub, ...prev]);
    const { error } = await supabase.from('subscriptions').insert([newSub]);
    if (error) console.error('Error adding subscription:', error);

    // Update plan in Customer Master
    const cust = customers.find(c => c.phone === sub.phone);
    if (cust) {
      updateCustomer({ ...cust, plan: sub.plan });
    }
    return newSub;
  };

  const updateSubscription = async (updatedSub) => {
    setSubscriptions(prev => prev.map(s => s.id === updatedSub.id ? updatedSub : s));
    const { error } = await supabase.from('subscriptions').update(updatedSub).eq('id', updatedSub.id);
    if (error) console.error('Error updating subscription:', error);
    
    // Make sure plan syncs in Customer Master
    const cust = customers.find(c => c.phone === updatedSub.phone);
    if (cust && cust.plan !== updatedSub.plan) {
      updateCustomer({ ...cust, plan: updatedSub.plan });
    }
  };

  const deleteSubscription = async (id) => {
    const sub = subscriptions.find(s => s.id === id);
    if (sub) {
      const cust = customers.find(c => c.phone === sub.phone);
      if (cust) {
        updateCustomer({ ...cust, plan: 'None' });
      }
    }
    setSubscriptions(prev => prev.filter(s => s.id !== id));
    const { error } = await supabase.from('subscriptions').delete().eq('id', id);
    if (error) console.error('Error deleting subscription:', error);
  };

  // Mutators: Expenses
  const addExpense = async (expense) => {
    const newExp = {
      ...expense,
      id: `EXP${Date.now()}`,
      date: expense.date || getTodayDateString()
    };
    setExpenses(prev => [newExp, ...prev]);
    const { error } = await supabase.from('expenses').insert([newExp]);
    if (error) console.error('Error adding expense:', error);
    return newExp;
  };

  const updateExpense = async (updatedExp) => {
    setExpenses(prev => prev.map(e => e.id === updatedExp.id ? updatedExp : e));
    const { error } = await supabase.from('expenses').update(updatedExp).eq('id', updatedExp.id);
    if (error) console.error('Error updating expense:', error);
  };

  const deleteExpense = async (id) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (error) console.error('Error deleting expense:', error);
  };

  // Enquiry Conversion flow helper
  const convertEnquiryToOrder = (enquiryId) => {
    const enq = enquiries.find(e => e.id === enquiryId);
    if (!enq) return null;

    // Check if customer exists in Customer Master
    const existingCustomer = customers.find(c => c.phone === enq.phone);
    if (!existingCustomer) {
      addCustomer({
        name: enq.name,
        phone: enq.phone,
        area: 'Converted Enquiry',
        address: 'N/A',
        customerType: 'Residential',
        plan: 'None',
        status: 'Active'
      });
    }

    // Mark enquiry as converted
    updateEnquiry({
      ...enq,
      converted: 'Yes',
      followUp: 'Completed'
    });

    // Return the prefilled order draft structure for the UI to open the order form
    return {
      customerPhone: enq.phone,
      customerName: enq.name,
      service: 'Wash+Iron',
      pricePerKg: 70,
      weight: 5,
      deliveryChrg: 50,
      payment: 'Unpaid',
      pickup: 'No',
      delivery: 'Pending',
      status: 'Pending',
      priority: 'Normal'
    };
  };

  return (
    <CRMContext.Provider value={{
      enquiries,
      orders,
      customers: getCustomersWithStats(),
      subscriptions,
      expenses,
      isDataLoaded,
      addEnquiry,
      updateEnquiry,
      deleteEnquiry,
      addOrder,
      updateOrder,
      deleteOrder,
      addCustomer,
      updateCustomer,
      deleteCustomer,
      addSubscription,
      updateSubscription,
      deleteSubscription,
      addExpense,
      updateExpense,
      deleteExpense,
      convertEnquiryToOrder
    }}>
      {children}
    </CRMContext.Provider>
  );
};

export const useCRM = () => {
  const context = useContext(CRMContext);
  if (!context) {
    throw new Error('useCRM must be used within a CRMProvider');
  }
  return context;
};
