import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// // ── Guard: catch misconfigured .env before attempting connection ──
// if (!supabaseUrl || !supabaseKey) {
//   console.error(
//     '❌ Supabase config missing!\n' +
//     'Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file.'
//   )
// }

// if (supabaseKey && !supabaseKey.startsWith('eyJ')) {
//   console.error(
//     '❌ Invalid VITE_SUPABASE_ANON_KEY detected!\n' +
//     'Your anon key must be a JWT token starting with "eyJ...".\n' +
//     'Go to: Supabase Dashboard → Project Settings → API → anon / public key'
//   )
// }

export const supabase = createClient(
  supabaseUrl  || 'https://placeholder.supabase.co',
  supabaseKey  || 'placeholder'
)