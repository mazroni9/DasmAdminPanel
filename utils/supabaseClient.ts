import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://uhdopxhxmrxwystnbmmp.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVoZG9weGh4bXJ4d3lzdG5ibW1wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDg5NTQ4NzcsImV4cCI6MjAyNDUzMDg3N30.vJ-k9tCRmNO9KjrYeNjgUs8t8SsWKvzJYQGQB5-Qj_4'

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// إضافة دالة للتحقق من حالة الاتصال
export async function checkSupabaseConnection() {
  try {
    const { data, error } = await supabase
      .from('admins')
      .select('count')
    
    if (error) {
      console.error('Supabase connection error:', error)
      return false
    }
    
    return true
  } catch (error) {
    console.error('Supabase connection error:', error)
    return false
  }
}

export default supabase

