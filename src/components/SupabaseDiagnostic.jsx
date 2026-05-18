import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

/**
 * SupabaseDiagnostic — rendered temporarily inside App to show
 * exactly which tables exist, which have RLS issues, and whether
 * INSERT works. Remove this component once everything is confirmed working.
 */
export default function SupabaseDiagnostic({ onClose }) {
  const [results, setResults] = useState({});
  const [running, setRunning] = useState(true);

  const TABLES = ['enquiries', 'orders', 'customers', 'subscriptions', 'expenses'];

  // Minimal test-insert payloads for each table
  const TEST_INSERTS = {
    enquiries: {
      name: '__diag_test__',
      phone: '0000000000',
      source: 'Direct',
      converted: 'Follow-up Pending',
      followUp: 'Tomorrow',
      date: '01-01-2025',
    },
    orders: {
      customerPhone: '0000000000',
      customerName: '__diag_test__',
      service: 'Wash+Iron',
      weight: 1,
      pricePerKg: 70,
      deliveryChrg: 0,
      amount: 70,
      payment: 'Unpaid',
      pickup: 'No',
      delivery: 'Pending',
      status: 'Pending',
      priority: 'Normal',
      date: '01-01-2025',
    },
    customers: {
      name: '__diag_test__',
      phone: '0000000000',
      area: 'Test',
      address: 'N/A',
      customerType: 'Residential',
      plan: 'None',
      status: 'Active',
    },
    subscriptions: {
      customerName: '__diag_test__',
      phone: '0000000000',
      plan: 'Silver',
      startDate: '01-01-2025',
      endDate: '01-02-2025',
      remainingKg: 15,
      renewalStatus: 'Active',
    },
    expenses: {
      type: 'Petrol',
      amount: 1,
      notes: '__diag_test__',
      date: '01-01-2025',
    },
  };

  useEffect(() => {
    const run = async () => {
      const out = {};
      for (const table of TABLES) {
        out[table] = { select: null, insert: null, insertedId: null, cleanup: null };

        // 1) SELECT
        const { data: selData, error: selErr } = await supabase
          .from(table)
          .select('id')
          .limit(1);
        out[table].select = selErr ? `❌ ${selErr.message} (code: ${selErr.code})` : `✅ OK (${selData?.length ?? 0} rows sampled)`;

        // 2) INSERT
        const { data: insData, error: insErr } = await supabase
          .from(table)
          .insert([TEST_INSERTS[table]])
          .select('id');
        if (insErr) {
          out[table].insert = `❌ ${insErr.message} (code: ${insErr.code})`;
        } else {
          out[table].insert = `✅ OK — inserted id: ${insData?.[0]?.id}`;
          out[table].insertedId = insData?.[0]?.id;

          // 3) CLEANUP — delete the test row
          if (out[table].insertedId) {
            const { error: delErr } = await supabase
              .from(table)
              .delete()
              .eq('id', out[table].insertedId);
            out[table].cleanup = delErr ? `❌ Cleanup failed: ${delErr.message}` : '✅ Cleaned up';
          }
        }

        setResults({ ...out });
      }
      setRunning(false);
    };
    run();
  }, []);

  const statusColor = (msg) => {
    if (!msg) return '#94a3b8';
    if (msg.startsWith('✅')) return '#16a34a';
    if (msg.startsWith('❌')) return '#dc2626';
    return '#d97706';
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1.5rem'
    }}>
      <div style={{
        background: '#0f172a', borderRadius: '16px', padding: '2rem',
        width: '100%', maxWidth: '720px', maxHeight: '90vh', overflowY: 'auto',
        border: '1px solid #334155', color: '#e2e8f0', fontFamily: 'monospace'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ color: '#818cf8', fontFamily: 'inherit', margin: 0, fontSize: '1.2rem' }}>
              🔬 Supabase Live Diagnostics
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.75rem', margin: '0.25rem 0 0' }}>
              Testing SELECT + INSERT + DELETE on each table
            </p>
          </div>
          {!running && (
            <button onClick={onClose} style={{
              background: '#1e293b', border: '1px solid #475569', color: '#94a3b8',
              borderRadius: '8px', padding: '0.4rem 1rem', cursor: 'pointer', fontSize: '0.8rem'
            }}>
              Close
            </button>
          )}
        </div>

        <div style={{ marginBottom: '1rem', fontSize: '0.75rem', color: '#64748b' }}>
          <strong style={{ color: '#94a3b8' }}>Project URL:</strong>{' '}
          {import.meta.env.VITE_SUPABASE_URL || '⚠️ NOT SET'}
        </div>
        <div style={{ marginBottom: '1.5rem', fontSize: '0.75rem', color: '#64748b' }}>
          <strong style={{ color: '#94a3b8' }}>Anon Key:</strong>{' '}
          {import.meta.env.VITE_SUPABASE_ANON_KEY
            ? `${import.meta.env.VITE_SUPABASE_ANON_KEY.substring(0, 20)}...`
            : '⚠️ NOT SET'}
        </div>

        {running && (
          <div style={{ color: '#fbbf24', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
            ⏳ Running diagnostics…
          </div>
        )}

        {TABLES.map(table => (
          <div key={table} style={{
            background: '#1e293b', border: '1px solid #334155', borderRadius: '10px',
            padding: '1rem 1.25rem', marginBottom: '0.75rem'
          }}>
            <div style={{ fontWeight: 700, color: '#a5b4fc', marginBottom: '0.5rem', textTransform: 'uppercase', fontSize: '0.8rem' }}>
              📋 {table}
            </div>
            {['select', 'insert', 'cleanup'].map(op => (
              <div key={op} style={{ display: 'flex', gap: '1rem', fontSize: '0.78rem', marginBottom: '0.2rem' }}>
                <span style={{ color: '#475569', width: '60px' }}>{op}:</span>
                <span style={{ color: statusColor(results[table]?.[op]) }}>
                  {results[table]?.[op] ?? (running ? '⏳ testing…' : '—')}
                </span>
              </div>
            ))}
          </div>
        ))}

        {!running && (
          <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#172554', borderRadius: '10px', fontSize: '0.78rem', color: '#93c5fd' }}>
            <strong>💡 How to interpret:</strong><br />
            • <span style={{ color: '#4ade80' }}>✅ SELECT OK</span> = table exists and RLS allows reading<br />
            • <span style={{ color: '#f87171' }}>❌ SELECT error</span> = table doesn&apos;t exist OR RLS is blocking reads<br />
            • <span style={{ color: '#4ade80' }}>✅ INSERT OK</span> = inserts work — your forms will save data<br />
            • <span style={{ color: '#f87171' }}>❌ INSERT error</span> = wrong column names OR RLS blocking inserts<br />
            <br />
            Common fix: Run <code style={{ color: '#fbbf24' }}>supabase_schema.sql</code> in Supabase SQL Editor.
          </div>
        )}
      </div>
    </div>
  );
}
