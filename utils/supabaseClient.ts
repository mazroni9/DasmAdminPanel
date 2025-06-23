import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please check your .env.local file and Vercel environment variables.')
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    fetch: fetch.bind(globalThis)
  }
})

// إضافة دالة للتحقق من حالة الاتصال
export const checkSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase.from('profiles').select('count')
    if (error) {
      console.error('Supabase connection error:', error)
      return {
        success: false,
        error: error
      }
    }
    return {
      success: true,
      data: data
    }
  } catch (error) {
    console.error('Supabase connection error:', error)
    return {
      success: false,
      error: error
    }
  }
}

export default supabase

