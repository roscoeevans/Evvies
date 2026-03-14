import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://occrohxrtggrgwysqpkm.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jY3JvaHhydGdncmd3eXNxcGttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1MTA0NTQsImV4cCI6MjA4OTA4NjQ1NH0.ar332kI8ctQLeYgeaNm8Er1p3zH5r5SFl0y2WI6YhD0'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
