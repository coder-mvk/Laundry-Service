import { useState } from 'react';
import { CRMProvider, useCRM } from './context/CRMContext';
import Sidebar from './components/Sidebar';
import DashboardView from './components/DashboardView';
import EnquiryView from './components/EnquiryView';
import OrdersView from './components/OrdersView';
import CustomersView from './components/CustomersView';
import SubscriptionsView from './components/SubscriptionsView';
import ExpensesView from './components/ExpensesView';
import DataPortability from './components/DataPortability';
import './App.css';

function AppContent() {
  const { isDataLoaded } = useCRM();
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Shared state to allow pre-filling forms across different tabs
  // e.g. clicking 'Convert Enquiry' inside Enquiry tracker will pre-fill the New Order form
  const [prefilledForm, setPrefilledForm] = useState(null);

  const clearPrefilledForm = () => setPrefilledForm(null);

  // Transition helper from Enquiry page
  const handleConvertEnquiry = (draftOrder) => {
    setPrefilledForm(draftOrder);
    setActiveTab('orders');
  };

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardView 
            setActiveTab={setActiveTab} 
            setPrefilledForm={setPrefilledForm} 
          />
        );
      case 'enquiries':
        return (
          <EnquiryView 
            prefilledForm={prefilledForm}
            clearPrefilledForm={clearPrefilledForm}
            onConvertEnquiry={handleConvertEnquiry}
          />
        );
      case 'orders':
        return (
          <OrdersView 
            prefilledForm={prefilledForm}
            clearPrefilledForm={clearPrefilledForm}
          />
        );
      case 'customers':
        return <CustomersView />;
      case 'subscriptions':
        return <SubscriptionsView />;
      case 'expenses':
        return (
          <ExpensesView 
            prefilledForm={prefilledForm}
            clearPrefilledForm={clearPrefilledForm}
          />
        );
      case 'portability':
        return <DataPortability />;
      default:
        return <DashboardView setActiveTab={setActiveTab} setPrefilledForm={setPrefilledForm} />;
    }
  };

  if (!isDataLoaded) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', width: '100vw', backgroundColor: 'var(--bg-body)' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ border: '4px solid rgba(0,0,0,0.1)', width: '40px', height: '40px', borderRadius: '50%', borderLeftColor: 'var(--primary)', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }}></div>
          <h3 style={{ color: 'var(--text-main)' }}>Connecting to Supabase...</h3>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Responsive Desktop/Mobile Navigation */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      {/* Main Screen Content Viewport */}
      <main className="main-content">
        {renderActiveView()}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <CRMProvider>
      <AppContent />
    </CRMProvider>
  );
}
