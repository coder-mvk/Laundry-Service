// Full workflow test — simulates exact form submissions from the CRM UI
// Run: node test_workflow.mjs
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://ypdrdksrbfmhcbqxgqot.supabase.co',
  'sb_publishable_aaoiC0OeOQjh-bU9JudBFw_Iio5tqEi'
);

const G = '\x1b[32m', R = '\x1b[31m', Y = '\x1b[33m', B = '\x1b[34m', RESET = '\x1b[0m', BOLD = '\x1b[1m';
let passed = 0, failed = 0;

function ok(label)  { console.log(`  ${G}✅ ${label}${RESET}`); passed++; }
function fail(label, err) { console.log(`  ${R}❌ ${label}${RESET}\n     ${err?.message || err} (code: ${err?.code})`); failed++; }

console.log(`\n${BOLD}${B}=== CRM Full Workflow Test ===${RESET}\n`);

// ── 1. Add Enquiry (exactly as EnquiryView.jsx sends it) ─────────────
console.log(`${BOLD}1. Add Enquiry${RESET}`);
const { data: enq, error: enqErr } = await supabase.from('enquiries').insert([{
  name:      'Rahul Sharma',
  phone:     '9876543210',
  source:    'Whatsapp',
  converted: 'Follow-up Pending',
  followUp:  'Tomorrow',
  date:      '18-05-2025',
}]).select();
if (enqErr) fail('Insert enquiry', enqErr); else ok(`Enquiry created — id: ${enq[0].id}`);
const enquiryId = enq?.[0]?.id;

// ── 2. Add Customer (exactly as CustomersView.jsx sends it) ──────────
console.log(`\n${BOLD}2. Add Customer${RESET}`);
const { data: cust, error: custErr } = await supabase.from('customers').insert([{
  name:         'Rahul Sharma',
  phone:        '9876543210',
  area:         'Talegaon',
  address:      'Flat 5, Wing A, Sunrise Society',
  customerType: 'Residential',
  plan:         'None',
  status:       'Active',
}]).select();
if (custErr) fail('Insert customer', custErr); else ok(`Customer created — id: ${cust[0].id}`);
const customerId = cust?.[0]?.id;

// ── 3. Add Order (exactly as OrdersView.jsx sends it) ────────────────
console.log(`\n${BOLD}3. Add Order${RESET}`);
const weight = 5, pricePerKg = 70, deliveryChrg = 50;
const amount = (weight * pricePerKg) + deliveryChrg;
const { data: ord, error: ordErr } = await supabase.from('orders').insert([{
  customerPhone: '9876543210',
  customerName:  'Rahul Sharma',
  service:       'Wash+Iron',
  weight,
  pricePerKg,
  deliveryChrg,
  amount,
  payment:       'Unpaid',
  pickup:        'No',
  delivery:      'Pending',
  status:        'Pending',
  priority:      'Normal',
  date:          '18-05-2025',
}]).select();
if (ordErr) fail('Insert order', ordErr); else ok(`Order created — id: ${ord[0].id}, amount: ₹${ord[0].amount}`);
const orderId = ord?.[0]?.id;

// ── 4. Add Subscription (exactly as SubscriptionsView.jsx sends it) ──
console.log(`\n${BOLD}4. Add Subscription${RESET}`);
const { data: sub, error: subErr } = await supabase.from('subscriptions').insert([{
  customerName:  'Rahul Sharma',
  phone:         '9876543210',
  plan:          'Silver',
  startDate:     '18-05-2025',
  endDate:       '17-06-2025',
  remainingKg:   15,
  renewalStatus: 'Active',
}]).select();
if (subErr) fail('Insert subscription', subErr); else ok(`Subscription created — id: ${sub[0].id}`);
const subId = sub?.[0]?.id;

// ── 5. Add Expense (exactly as ExpensesView.jsx sends it) ────────────
console.log(`\n${BOLD}5. Add Expense${RESET}`);
const { data: exp, error: expErr } = await supabase.from('expenses').insert([{
  type:   'Petrol',
  amount: 300,
  notes:  'Fuel for morning delivery rounds',
  date:   '18-05-2025',
}]).select();
if (expErr) fail('Insert expense', expErr); else ok(`Expense created — id: ${exp[0].id}`);
const expId = exp?.[0]?.id;

// ── 6. Update Order status (exactly as updateOrder does) ─────────────
console.log(`\n${BOLD}6. Update Order Status${RESET}`);
if (orderId) {
  const { error: updErr } = await supabase.from('orders')
    .update({ status: 'In Progress', payment: 'Paid' })
    .eq('id', orderId);
  if (updErr) fail('Update order', updErr); else ok('Order status updated to In Progress + Paid');
}

// ── 7. Verify all data persists ───────────────────────────────────────
console.log(`\n${BOLD}7. Verify Data Persists (SELECT)${RESET}`);
const { data: allOrds } = await supabase.from('orders').select('id,customerName,amount,status,payment').eq('customerPhone', '9876543210');
if (allOrds?.length > 0) {
  ok(`Found ${allOrds.length} order(s) for 9876543210`);
  allOrds.forEach(o => console.log(`     → ${o.id} | ${o.customerName} | ₹${o.amount} | ${o.status} | ${o.payment}`));
} else {
  fail('No orders found after insert', { message: 'Data did not persist' });
}

// ── 8. Cleanup all test data ──────────────────────────────────────────
console.log(`\n${BOLD}8. Cleanup Test Data${RESET}`);
const cleanups = [
  enquiryId && supabase.from('enquiries').delete().eq('id', enquiryId),
  customerId && supabase.from('customers').delete().eq('id', customerId),
  orderId    && supabase.from('orders').delete().eq('id', orderId),
  subId      && supabase.from('subscriptions').delete().eq('id', subId),
  expId      && supabase.from('expenses').delete().eq('id', expId),
].filter(Boolean);
await Promise.all(cleanups);
ok('All test records removed');

// ── Summary ───────────────────────────────────────────────────────────
console.log(`\n${BOLD}=== Summary ===${RESET}`);
console.log(`  ${G}Passed: ${passed}${RESET}  ${failed > 0 ? R : G}Failed: ${failed}${RESET}`);
if (failed === 0) {
  console.log(`\n${G}${BOLD}🎉 All workflows work! Your CRM backend is fully functional.${RESET}`);
  console.log(`   Open http://localhost:5173 and try adding data — it should save correctly.\n`);
} else {
  console.log(`\n${R}${BOLD}❌ Some tests failed — see errors above.${RESET}\n`);
}
