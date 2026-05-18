// Quick Supabase connection test — run with: node test_supabase.mjs
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL     = 'https://ypdrdksrbfmhcbqxgqot.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_aaoiC0OeOQjh-bU9JudBFw_Iio5tqEi';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const TABLES = ['enquiries', 'orders', 'customers', 'subscriptions', 'expenses'];

const TEST_INSERTS = {
  enquiries:     { name:'__diag__', phone:'0000000000', source:'Direct', converted:'Follow-up Pending', followUp:'Tomorrow', date:'01-01-2025' },
  orders:        { customerPhone:'0000000000', customerName:'__diag__', service:'Wash+Iron', weight:1, pricePerKg:70, deliveryChrg:0, amount:70, payment:'Unpaid', pickup:'No', delivery:'Pending', status:'Pending', priority:'Normal', date:'01-01-2025' },
  customers:     { name:'__diag__', phone:'0000000000', area:'Test', address:'N/A', customerType:'Residential', plan:'None', status:'Active' },
  subscriptions: { customerName:'__diag__', phone:'0000000000', plan:'Silver', startDate:'01-01-2025', endDate:'01-02-2025', remainingKg:15, renewalStatus:'Active' },
  expenses:      { type:'Petrol', amount:1, notes:'__diag__', date:'01-01-2025' },
};

const GREEN = '\x1b[32m', RED = '\x1b[31m', YELLOW = '\x1b[33m', RESET = '\x1b[0m', BOLD = '\x1b[1m';

let allPassed = true;

console.log(`\n${BOLD}=== Supabase Live Diagnostic ===${RESET}`);
console.log(`URL: ${SUPABASE_URL}`);
console.log(`Key: ${SUPABASE_ANON_KEY.substring(0,25)}...`);
console.log('');

for (const table of TABLES) {
  console.log(`${BOLD}📋 ${table.toUpperCase()}${RESET}`);

  // SELECT
  const { data: selData, error: selErr } = await supabase.from(table).select('id').limit(1);
  if (selErr) {
    console.log(`  SELECT:  ${RED}❌ FAILED — ${selErr.message} (code: ${selErr.code})${RESET}`);
    console.log(`  INSERT:  ${YELLOW}⏭  skipped${RESET}`);
    console.log(`  CLEANUP: ${YELLOW}⏭  skipped${RESET}`);
    allPassed = false;
    console.log('');
    continue;
  }
  console.log(`  SELECT:  ${GREEN}✅ OK — ${selData?.length ?? 0} rows readable${RESET}`);

  // INSERT
  const { data: insData, error: insErr } = await supabase.from(table).insert([TEST_INSERTS[table]]).select('id');
  if (insErr) {
    console.log(`  INSERT:  ${RED}❌ FAILED — ${insErr.message} (code: ${insErr.code})${RESET}`);
    if (insErr.details) console.log(`           Details: ${insErr.details}`);
    if (insErr.hint)    console.log(`           Hint:    ${insErr.hint}`);
    console.log(`  CLEANUP: ${YELLOW}⏭  skipped${RESET}`);
    allPassed = false;
    console.log('');
    continue;
  }
  const insertedId = insData?.[0]?.id;
  console.log(`  INSERT:  ${GREEN}✅ OK — id: ${insertedId}${RESET}`);

  // CLEANUP
  const { error: delErr } = await supabase.from(table).delete().eq('id', insertedId);
  if (delErr) {
    console.log(`  CLEANUP: ${RED}❌ FAILED — ${delErr.message}${RESET}`);
    allPassed = false;
  } else {
    console.log(`  CLEANUP: ${GREEN}✅ Cleaned up${RESET}`);
  }
  console.log('');
}

console.log(`${BOLD}=== Result: ${allPassed ? `${GREEN}ALL TESTS PASSED ✅` : `${RED}ERRORS FOUND ❌`}${RESET} ===${RESET}\n`);
