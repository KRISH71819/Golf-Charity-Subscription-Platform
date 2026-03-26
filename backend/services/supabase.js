import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('⚠️  Supabase credentials not set — database calls will fail. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env')
}

// Service-role client (bypasses RLS — use only server-side)
const supabase = createClient(supabaseUrl || '', supabaseServiceKey || '', {
  auth: { autoRefreshToken: false, persistSession: false },
})

export default supabase
