import React, { createContext, useState, useEffect, useContext } from 'react';

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

// Initial Demo/Seed Data matching the screenshots
const initialEnquiries = [
  {
    id: 'ENQ001',
    date: '17-05-2026',
    name: 'Amit Kumar',
    phone: '9123456789',
    source: 'Whatsapp',
    converted: 'Follow-up Pending', // 'Yes', 'No', 'Follow-up Pending'
    followUp: 'Tomorrow'
  },
  {
    id: 'ENQ002',
    date: '16-05-2026',
    name: 'Sneha Patel',
    phone: '9812345678',
    source: 'Call',
    converted: 'Yes',
    followUp: 'Completed'
  },
  {
    id: 'ENQ003',
    date: '15-05-2026',
    name: 'Rohan Sharma',
    phone: '9765432109',
    source: 'Website',
    converted: 'No',
    followUp: 'Not Interested'
  }
];

const initialOrders = [
  {
    id: 'ORD001',
    date: '17-05-2026',
    customerPhone: '9876543210',
    customerName: 'Rahul',
    service: 'Wash+Iron', // 'Wash+Iron', 'Wash+Fold', 'Dry Clean', 'Steam Iron'
    pricePerKg: 70,
    weight: 5,
    deliveryChrg: 70,
    amount: 420, // Calculated: (Price * Weight) + Delivery
    payment: 'Paid', // 'Paid', 'Unpaid'
    pickup: 'No', // 'Yes', 'No'
    delivery: 'Delivered', // 'Delivered', 'Pending', 'In Progress'
    status: 'Done', // 'Done', 'In Progress', 'Pending'
    priority: 'Normal' // 'Normal', 'High'
  },
  {
    id: 'ORD002',
    date: '17-05-2026',
    customerPhone: '9123456789',
    customerName: 'Amit Kumar',
    service: 'Dry Clean',
    pricePerKg: 120,
    weight: 3,
    deliveryChrg: 50,
    amount: 410,
    payment: 'Unpaid',
    pickup: 'Yes',
    delivery: 'Pending',
    status: 'In Progress',
    priority: 'High'
  }
];

const initialCustomers = [
  {
    id: 'CUST2026001',
    name: 'Rahul',
    phone: '9876543210',
    area: 'Talegaon',
    address: 'Somatne',
    customerType: 'Hostel', // 'Hostel', 'Residential', 'Commercial'
    plan: 'None', // 'None', 'Silver', 'Gold', 'Platinum'
    status: 'Active' // 'Active', 'Inactive'
  },
  {
    id: 'CUST2026002',
    name: 'Amit Kumar',
    phone: '9123456789',
    area: 'Ravet',
    address: 'Sector 29, Flat 405',
    customerType: 'Residential',
    plan: 'Silver',
    status: 'Active'
  },
  {
    id: 'CUST2026003',
    name: 'Sneha Patel',
    phone: '9812345678',
    area: 'Akurdi',
    address: 'Near Station',
    customerType: 'Hostel',
    plan: 'Gold',
    status: 'Active'
  }
];

const initialSubscriptions = [
  {
    id: 'SUB001',
    customerName: 'Amit Kumar',
    phone: '9123456789',
    plan: 'Silver', // Silver: 15kg/mo, Gold: 30kg/mo, Platinum: 50kg/mo
    startDate: '10-05-2026',
    endDate: '10-06-2026',
    remainingKg: 12, // Initially 15kg, used 3kg in ORD002
    renewalStatus: 'Active' // 'Active', 'Expired', 'Near Expiry'
  },
  {
    id: 'SUB002',
    customerName: 'Sneha Patel',
    phone: '9812345678',
    plan: 'Gold',
    startDate: '01-05-2026',
    endDate: '01-06-2026',
    remainingKg: 30,
    renewalStatus: 'Active'
  }
];

const initialExpenses = [
  {
    id: 'EXP001',
    date: '17-05-2026',
    type: 'Petrol', // 'Petrol', 'Detergents', 'Electricity', 'Rent', 'Salaries', 'Others'
    amount: 300,
    notes: 'Pickup rounds'
  },
  {
    id: 'EXP002',
    date: '15-05-2026',
    type: 'Detergents',
    amount: 1250,
    notes: 'Bulk buy surf excel & softener'
  }
];

export const CRMProvider = ({ children }) => {
  const [enquiries, setEnquiries] = useState(() => {
    const local = localStorage.getItem('laundry_enquiries');
    return local ? JSON.parse(local) : initialEnquiries;
  });

  const [orders, setOrders] = useState(() => {
    const local = localStorage.getItem('laundry_orders');
    return local ? JSON.parse(local) : initialOrders;
  });

  const [customers, setCustomers] = useState(() => {
    const local = localStorage.getItem('laundry_customers');
    return local ? JSON.parse(local) : initialCustomers;
  });

  const [subscriptions, setSubscriptions] = useState(() => {
    const local = localStorage.getItem('laundry_subscriptions');
    return local ? JSON.parse(local) : initialSubscriptions;
  });

  const [expenses, setExpenses] = useState(() => {
    const local = localStorage.getItem('laundry_expenses');
    return local ? JSON.parse(local) : initialExpenses;
  });

  // Sync state to LocalStorage
  useEffect(() => {
    localStorage.setItem('laundry_enquiries', JSON.stringify(enquiries));
  }, [enquiries]);

  useEffect(() => {
    localStorage.setItem('laundry_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('laundry_customers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('laundry_subscriptions', JSON.stringify(subscriptions));
  }, [subscriptions]);

  useEffect(() => {
    localStorage.setItem('laundry_expenses', JSON.stringify(expenses));
  }, [expenses]);

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
  const addEnquiry = (enquiry) => {
    const newEnq = {
      ...enquiry,
      id: `ENQ${String(enquiries.length + 1).padStart(3, '0')}`,
      date: enquiry.date || getTodayDateString()
    };
    setEnquiries(prev => [newEnq, ...prev]);
    return newEnq;
  };

  const updateEnquiry = (updatedEnq) => {
    setEnquiries(prev => prev.map(e => e.id === updatedEnq.id ? updatedEnq : e));
  };

  const deleteEnquiry = (id) => {
    setEnquiries(prev => prev.filter(e => e.id !== id));
  };

  // Mutators: Orders
  const addOrder = (order) => {
    const computedAmount = (Number(order.pricePerKg || 0) * Number(order.weight || 0)) + Number(order.deliveryChrg || 0);
    const newOrd = {
      ...order,
      id: `ORD${String(orders.length + 1).padStart(3, '0')}`,
      date: order.date || getTodayDateString(),
      amount: computedAmount
    };

    setOrders(prev => [newOrd, ...prev]);

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

  const updateOrder = (updatedOrd) => {
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
  };

  const deleteOrder = (id) => {
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
  };

  // Mutators: Customers
  const addCustomer = (customer) => {
    const newCust = {
      ...customer,
      id: `CUST${new Date().getFullYear()}${String(customers.length + 1).padStart(3, '0')}`,
      status: customer.status || 'Active'
    };
    setCustomers(prev => [...prev, newCust]);
    return newCust;
  };

  const updateCustomer = (updatedCust) => {
    setCustomers(prev => prev.map(c => c.id === updatedCust.id ? updatedCust : c));
  };

  const deleteCustomer = (id) => {
    setCustomers(prev => prev.filter(c => c.id !== id));
  };

  // Mutators: Subscriptions
  const addSubscription = (sub) => {
    const newSub = {
      ...sub,
      id: `SUB${String(subscriptions.length + 1).padStart(3, '0')}`,
      renewalStatus: sub.renewalStatus || 'Active'
    };
    setSubscriptions(prev => [newSub, ...prev]);

    // Update plan in Customer Master
    const cust = customers.find(c => c.phone === sub.phone);
    if (cust) {
      updateCustomer({ ...cust, plan: sub.plan });
    }
    return newSub;
  };

  const updateSubscription = (updatedSub) => {
    setSubscriptions(prev => prev.map(s => s.id === updatedSub.id ? updatedSub : s));
    
    // Make sure plan syncs in Customer Master
    const cust = customers.find(c => c.phone === updatedSub.phone);
    if (cust && cust.plan !== updatedSub.plan) {
      updateCustomer({ ...cust, plan: updatedSub.plan });
    }
  };

  const deleteSubscription = (id) => {
    const sub = subscriptions.find(s => s.id === id);
    if (sub) {
      const cust = customers.find(c => c.phone === sub.phone);
      if (cust) {
        updateCustomer({ ...cust, plan: 'None' });
      }
    }
    setSubscriptions(prev => prev.filter(s => s.id !== id));
  };

  // Mutators: Expenses
  const addExpense = (expense) => {
    const newExp = {
      ...expense,
      id: `EXP${String(expenses.length + 1).padStart(3, '0')}`,
      date: expense.date || getTodayDateString()
    };
    setExpenses(prev => [newExp, ...prev]);
    return newExp;
  };

  const updateExpense = (updatedExp) => {
    setExpenses(prev => prev.map(e => e.id === updatedExp.id ? updatedExp : e));
  };

  const deleteExpense = (id) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  // Enquiry Conversion flow helper
  const convertEnquiryToOrder = (enquiryId) => {
    const enq = enquiries.find(e => e.id === enquiryId);
    if (!enq) return null;

    // Check if customer exists in Customer Master
    let cust = customers.find(c => c.phone === enq.phone);
    if (!cust) {
      cust = addCustomer({
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

  // JSON State Reset / Seed Restore
  const restoreSeedData = () => {
    setEnquiries(initialEnquiries);
    setOrders(initialOrders);
    setCustomers(initialCustomers);
    setSubscriptions(initialSubscriptions);
    setExpenses(initialExpenses);
  };

  // Clear all data (Wipe database for real entries)
  const clearAllData = () => {
    setEnquiries([]);
    setOrders([]);
    setCustomers([]);
    setSubscriptions([]);
    setExpenses([]);
  };

  // Import State from JSON
  const importFullBackup = (backupObj) => {
    try {
      if (backupObj.enquiries) setEnquiries(backupObj.enquiries);
      if (backupObj.orders) setOrders(backupObj.orders);
      if (backupObj.customers) setCustomers(backupObj.customers);
      if (backupObj.subscriptions) setSubscriptions(backupObj.subscriptions);
      if (backupObj.expenses) setExpenses(backupObj.expenses);
      return { success: true };
    } catch (err) {
      console.error(err);
      return { success: false, error: err.message };
    }
  };

  // Export full backup as JSON download
  const exportFullBackup = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(
      JSON.stringify({ enquiries, orders, customers: getCustomersWithStats(), subscriptions, expenses }, null, 2)
    );
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `laundry_crm_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <CRMContext.Provider value={{
      enquiries,
      orders,
      customers: getCustomersWithStats(),
      subscriptions,
      expenses,
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
      convertEnquiryToOrder,
      restoreSeedData,
      clearAllData,
      importFullBackup,
      exportFullBackup
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
