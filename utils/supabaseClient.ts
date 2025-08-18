import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key'

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'https://your-project.supabase.co' || supabaseAnonKey === 'your-anon-key') {
  console.warn('Supabase environment variables not configured. Using mock data.')
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'Content-Type': 'application/json',
    },
  }
})

// إضافة دالة للتحقق من حالة الاتصال
export const checkSupabaseConnection = async () => {
  try {
    // إذا كانت متغيرات البيئة غير موجودة، نعيد بيانات محاكاة
    if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'https://your-project.supabase.co' || supabaseAnonKey === 'your-anon-key') {
      return {
        success: true,
        data: [{ id: 1, name: 'Mock User' }],
        message: 'Using mock data - Supabase not configured'
      }
    }

    // اختبار الاتصال بطريقة أبسط
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1)
    
    if (error) {
      console.error('Supabase connection error:', error)
      return {
        success: false,
        error: {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        }
      }
    }
    
    return {
      success: true,
      data: data,
      message: 'Connection successful'
    }
  } catch (error: any) {
    console.error('Supabase connection error:', error)
    return {
      success: false,
      error: {
        message: error.message || 'Unknown error',
        details: error.stack || '',
        hint: 'Check your internet connection and Supabase configuration',
        code: 'NETWORK_ERROR'
      }
    }
  }
}

export default supabase

