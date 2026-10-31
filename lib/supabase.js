import { createClient } from '@supabase/supabase-js'

// These two values are public by design (protected by the database locks).
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gfsxqbuyjluagbrnurlm.supabase.co'
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_HL18M6IGUFZ62M5EtadC5w_99KHUUpN'

export const supabase = createClient(url, key)
