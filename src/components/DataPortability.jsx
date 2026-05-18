import { useState } from 'react';
import { 
  Download, 
  Upload, 
  FileSpreadsheet, 
  Database,
  CheckCircle,
  AlertTriangle,
  CloudLightning
} from 'lucide-react';
import { useCRM } from '../context/CRMContext';
import { supabase } from '../lib/supabase';

export default function DataPortability() {
  const { 
    enquiries, 
    orders, 
    customers, 
    subscriptions, 
    expenses
  } = useCRM();

  const [importStatus, setImportStatus] = useState(null);

  // Helper: Convert array of objects to CSV string
  const convertToCSV = (data, headers) => {
    if (!data || data.length === 0) return '';
    
    const csvRows = [];
    csvRows.push(headers.join(',')); // Add headers

    for (const row of data) {
      const values = headers.map(header => {
        // Find property mapping (lower camelCase in JS vs Header)
        const key = header.toLowerCase().replace(/\s+([a-z])/g, (g) => g[1].toUpperCase()).replace(/\?/g, '').replace(/\(kg\)/g, 'weight');
        let val = row[key];
        
        // Custom key map adjustments
        if (header === 'Customer Phone' && row.customerPhone) val = row.customerPhone;
        if (header === 'Customer Name' && row.customerName) val = row.customerName;
        if (header === 'Price per Kg' && row.pricePerKg) val = row.pricePerKg;
        if (header === 'Weight(Kg)' && row.weight) val = row.weight;
        if (header === 'Delivery Chrg' && row.deliveryChrg) val = row.deliveryChrg;
        if (header === 'Converted?' && row.converted) val = row.converted;
        if (header === 'Follow-up' && row.followUp) val = row.followUp;
        if (header === 'Remaining KG' && row.remainingKg) val = row.remainingKg;
        if (header === 'Renewal Status' && row.renewalStatus) val = row.renewalStatus;
        if (header === 'Customer ID' && row.id) val = row.id;
        if (header === 'Order ID' && row.id) val = row.id;

        if (val === undefined || val === null) val = '';
        
        // Escape commas and double quotes
        const escaped = ('' + val).replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
  };

  // Helper: Trigger direct download of CSV file
  const downloadCSV = (csvContent, fileName) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export handlers
  const handleExportCSV = (sheetType) => {
    const exportMap = {
      enquiries: {
        csv: convertToCSV(enquiries, ['Date', 'Name', 'Phone', 'Source', 'Converted?', 'Follow-up']),
        fileName: 'Enquiry_Customers.csv'
      },
      orders: {
        csv: convertToCSV(orders, ['Order ID', 'Date', 'Customer Phone', 'Customer Name', 'Service', 'Price per Kg', 'Weight(Kg)', 'Delivery Chrg', 'Amount', 'Payment', 'Pickup', 'Delivery', 'Status', 'Order Priority']),
        fileName: 'Daily_Orders.csv'
      },
      customers: {
        csv: convertToCSV(customers, ['Customer ID', 'Name', 'Phone', 'Area', 'Address', 'Customer Type', 'Plan', 'Total Orders', 'Total Revenue', 'Last Order Date', 'Status']),
        fileName: 'Customer_Master.csv'
      },
      subscriptions: {
        csv: convertToCSV(subscriptions, ['CustomerName', 'Phone', 'Plan', 'Start Date', 'End Date', 'Remaining KG', 'Renewal Status']),
        fileName: 'Subscription_Customers.csv'
      },
      expenses: {
        csv: convertToCSV(expenses, ['Date', 'Type', 'Amount', 'Notes']),
        fileName: 'Expenses.csv'
      }
    };
    const exportPayload = exportMap[sheetType];
    if (!exportPayload) return;
    downloadCSV(exportPayload.csv, `laundry_crm_${exportPayload.fileName}`);
  };

  const exportFullBackup = () => {
    const backupData = {
      enquiries,
      orders,
      customers,
      subscriptions,
      expenses,
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `laundry_crm_full_backup_${new Date().toISOString().split('T')[0]}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const inferTableType = (items) => {
    if (!Array.isArray(items) || items.length === 0) return null;
    const sample = items[0];
    if (!sample || typeof sample !== 'object') return null;

    if ('customerPhone' in sample || 'pricePerKg' in sample || 'deliveryChrg' in sample) return 'orders';
    if ('remainingKg' in sample || 'renewalStatus' in sample) return 'subscriptions';
    if ('converted' in sample || 'followUp' in sample) return 'enquiries';
    if ('area' in sample || 'plan' in sample || 'status' in sample) return 'customers';
    if ('type' in sample && 'amount' in sample) return 'expenses';

    return null;
  };

  const normalizeImportedJSON = (parsedData) => {
    if (!parsedData || typeof parsedData !== 'object') return null;

    if (Array.isArray(parsedData)) {
      const table = inferTableType(parsedData);
      return table ? { [table]: parsedData } : null;
    }

    const payload = {};
    ['enquiries', 'orders', 'customers', 'subscriptions', 'expenses'].forEach((table) => {
      if (Array.isArray(parsedData[table])) payload[table] = parsedData[table];
    });

    if (Object.keys(payload).length > 0) return payload;
    if (parsedData.data && typeof parsedData.data === 'object') return normalizeImportedJSON(parsedData.data);
    if (parsedData.backup && typeof parsedData.backup === 'object') return normalizeImportedJSON(parsedData.backup);

    return null;
  };

  // JSON File upload handler
  const handleJSONUpload = async (e) => {
    const fileInput = e.target;
    const file = fileInput?.files?.[0];
    if (!file) return;
    fileInput.value = '';

    setImportStatus({ type: 'success', message: 'Reading file... Please wait.' });

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const rawData = JSON.parse(event.target.result);
        const data = normalizeImportedJSON(rawData);

        if (!data) {
          throw new Error('Unsupported JSON structure');
        }

        setImportStatus({ type: 'success', message: 'Uploading backup to Supabase...' });

        if (data.enquiries?.length) await supabase.from('enquiries').upsert(data.enquiries);
        if (data.orders?.length) await supabase.from('orders').upsert(data.orders);
        if (data.customers?.length) await supabase.from('customers').upsert(data.customers);
        if (data.subscriptions?.length) await supabase.from('subscriptions').upsert(data.subscriptions);
        if (data.expenses?.length) await supabase.from('expenses').upsert(data.expenses);

        setImportStatus({ type: 'success', message: 'Workspace fully loaded from backup! Reloading...' });
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } catch (err) {
        console.error(err);
        setImportStatus({ type: 'error', message: 'Invalid backup file structure! Please upload a valid JSON backup.' });
      }
    };
    reader.readAsText(file);
  };

  // Migrate LocalStorage to Supabase
  const handleMigrateToSupabase = async () => {
    if (!window.confirm("Are you sure you want to migrate LocalStorage data to Supabase? This will upload your local data to the cloud.")) return;
    
    setImportStatus({ type: 'success', message: 'Starting migration... Please wait.' });
    try {
      const enq = JSON.parse(localStorage.getItem('laundry_enquiries') || '[]');
      const ord = JSON.parse(localStorage.getItem('laundry_orders') || '[]');
      const cust = JSON.parse(localStorage.getItem('laundry_customers') || '[]');
      const sub = JSON.parse(localStorage.getItem('laundry_subscriptions') || '[]');
      const exp = JSON.parse(localStorage.getItem('laundry_expenses') || '[]');

      if (enq.length) await supabase.from('enquiries').upsert(enq);
      if (ord.length) await supabase.from('orders').upsert(ord);
      if (cust.length) await supabase.from('customers').upsert(cust);
      if (sub.length) await supabase.from('subscriptions').upsert(sub);
      if (exp.length) await supabase.from('expenses').upsert(exp);

      setImportStatus({ type: 'success', message: 'Migration to Supabase completed successfully! Reloading...' });
      setTimeout(() => window.location.reload(), 2000);
    } catch (err) {
      setImportStatus({ type: 'error', message: `Migration failed: ${err.message}` });
    }
  };

  return (
    <div className="fade-in">
      <div className="margin-bottom-md">
        <h1 className="page-title">Excel Sync & Portability</h1>
        <p className="page-subtitle">Export data directly as spreadsheet CSVs, backup entire workspaces, or restore snapshots</p>
      </div>

      {importStatus && (
        <div className={`alert-card margin-bottom-md ${importStatus.type === 'success' ? 'success-alert' : 'danger-alert'}`}>
          {importStatus.type === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
          <div>
            <h4 className="font-bold">{importStatus.type === 'success' ? 'Task Completed' : 'Import Interrupted'}</h4>
            <p className="text-sm">{importStatus.message}</p>
          </div>
        </div>
      )}

      <div className="grid-cols-2">
        {/* CSV Spreadsheet Export Panel */}
        <div className="glass-card">
          <div className="flex items-center gap-2 margin-bottom-md">
            <FileSpreadsheet className="text-indigo" size={24} />
            <h3 className="chart-title" style={{ margin: 0 }}>Spreadsheet CSV Exports</h3>
          </div>
          <p className="text-slate-600 text-sm margin-bottom-md">
            Download your CRM sheets as Excel-compatible CSV files. Ideal for editing offline, pivot tables, or custom manual bookkeeping.
          </p>

          <div className="csv-export-grid">
            <div className="csv-export-item flex-row-between">
              <div className="csv-meta">
                <span className="csv-title">Enquiry Customers</span>
                <span className="csv-subtitle">{enquiries.length} rows tracked</span>
              </div>
              <button onClick={() => handleExportCSV('enquiries')} className="btn btn-sm btn-secondary text-indigo">
                <Download size={14} /> Export CSV
              </button>
            </div>

            <div className="csv-export-item flex-row-between">
              <div className="csv-meta">
                <span className="csv-title">Daily Orders</span>
                <span className="csv-subtitle">{orders.length} rows tracked</span>
              </div>
              <button onClick={() => handleExportCSV('orders')} className="btn btn-sm btn-secondary text-indigo">
                <Download size={14} /> Export CSV
              </button>
            </div>

            <div className="csv-export-item flex-row-between">
              <div className="csv-meta">
                <span className="csv-title">Customer Master</span>
                <span className="csv-subtitle">{customers.length} rows tracked</span>
              </div>
              <button onClick={() => handleExportCSV('customers')} className="btn btn-sm btn-secondary text-indigo">
                <Download size={14} /> Export CSV
              </button>
            </div>

            <div className="csv-export-item flex-row-between">
              <div className="csv-meta">
                <span className="csv-title">Subscription Customers</span>
                <span className="csv-subtitle">{subscriptions.length} rows tracked</span>
              </div>
              <button onClick={() => handleExportCSV('subscriptions')} className="btn btn-sm btn-secondary text-indigo">
                <Download size={14} /> Export CSV
              </button>
            </div>

            <div className="csv-export-item flex-row-between">
              <div className="csv-meta">
                <span className="csv-title">Expenses Log</span>
                <span className="csv-subtitle">{expenses.length} rows tracked</span>
              </div>
              <button onClick={() => handleExportCSV('expenses')} className="btn btn-sm btn-secondary text-indigo">
                <Download size={14} /> Export CSV
              </button>
            </div>
          </div>
        </div>

        {/* Global JSON Backup & Restoration */}
        <div className="glass-card flex flex-col">
          <div className="flex items-center gap-2 margin-bottom-md">
            <Database className="text-secondary" size={24} />
            <h3 className="chart-title" style={{ margin: 0 }}>Full Database Snapshots</h3>
          </div>
          <p className="text-slate-600 text-sm margin-bottom-md">
            Backup and restore the entire CRM state (all sheets, preferences, and details) in one consolidated snapshot file.
          </p>

          <div className="backup-actions margin-top-sm flex flex-col gap-4 flex-1 justify-center">
            {/* Export full backup */}
            <button onClick={exportFullBackup} className="btn btn-primary w-full py-3 flex items-center justify-center gap-2">
              <Download size={18} />
              <span>Download Workspace Backup (.JSON)</span>
            </button>

            <div className="backup-divider">
              <span>OR RESTORE SNAPSHOT</span>
            </div>

            {/* Import snapshot zone */}
            <div className="drag-upload-container">
              <Upload size={28} className="text-muted margin-bottom-xs" />
              <span className="upload-title">Click to upload snapshot</span>
              <span className="upload-subtitle">Files ending with .json are supported</span>
              <input 
                type="file" 
                accept=".json"
                onChange={handleJSONUpload}
                className="hidden-file-input"
              />
            </div>

            <div className="backup-divider margin-top-lg">
              <span>CLOUD MIGRATION</span>
            </div>

            <button onClick={handleMigrateToSupabase} className="btn w-full py-3 flex items-center justify-center gap-2" style={{ backgroundColor: 'var(--accent)', color: 'white' }}>
              <CloudLightning size={18} />
              <span>Migrate LocalStorage to Supabase</span>
            </button>
          </div>
        </div>
      </div>

      <style>{`
        /* Local layout styles for Excel sync and data portability */
        .csv-export-grid {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .csv-export-item {
          padding: 0.85rem 1.25rem;
          background-color: var(--bg-main);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          transition: transform var(--transition-fast);
        }

        .csv-export-item:hover {
          transform: translateY(-1px);
        }

        .csv-meta {
          display: flex;
          flex-direction: column;
        }

        .csv-title {
          font-weight: 700;
          font-size: 0.95rem;
          color: var(--text-main);
        }

        .csv-subtitle {
          font-size: 0.75rem;
          color: var(--text-muted);
          font-weight: 500;
        }

        .success-alert {
          background-color: #ecfdf5;
          border: 1px solid #a7f3d0;
          color: #065f46;
        }

        .danger-alert {
          background-color: #fff5f5;
          border: 1px solid #fca5a5;
          color: #991b1b;
        }

        .backup-divider {
          display: flex;
          align-items: center;
          text-align: center;
          font-size: 0.7rem;
          font-weight: 700;
          color: var(--text-muted);
          letter-spacing: 0.05em;
          margin: 0.5rem 0;
        }

        .backup-divider::before, .backup-divider::after {
          content: '';
          flex: 1;
          border-bottom: 1px solid var(--border);
        }

        .backup-divider:not(:empty)::before {
          margin-right: .5em;
        }

        .backup-divider:not(:empty)::after {
          margin-left: .5em;
        }

        .drag-upload-container {
          border: 2px dashed var(--border);
          border-radius: var(--radius-lg);
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          cursor: pointer;
          position: relative;
          transition: all var(--transition-fast);
        }

        .drag-upload-container:hover {
          border-color: var(--primary);
          background-color: rgba(79, 70, 229, 0.02);
        }

        .upload-title {
          font-weight: 700;
          font-size: 0.9rem;
          color: var(--text-main);
        }

        .upload-subtitle {
          font-size: 0.7rem;
          color: var(--text-muted);
        }

        .hidden-file-input {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          opacity: 0;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
