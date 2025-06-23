import Layout from '../components/Layout'
import { useEffect, useState } from 'react'
import supabase from '../utils/supabaseClient'

interface User {
  id: string
  email: string
  created_at: string
  role: string
  is_active: boolean
  full_name?: string
  phone?: string
  last_sign_in?: string
}

export default function Users() {
  const [debug, setDebug] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkDatabase()
  }, [])

  async function checkDatabase() {
    try {
      setLoading(true)
      setError(null)
      const debugInfo: any = {}

      // 1. التحقق من الجداول الموجودة
      console.log('فحص الجداول المتاحة...')
      const { data: tables, error: tablesError } = await supabase
        .from('pg_tables')
        .select('*')
        .eq('schemaname', 'public')
      
      if (tablesError) {
        console.error('خطأ في جلب الجداول:', tablesError)
        debugInfo.tablesError = tablesError
      } else {
        console.log('الجداول المتاحة:', tables)
        debugInfo.tables = tables
      }

      // 2. محاولة قراءة جدول المستخدمين
      console.log('محاولة قراءة auth.users...')
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
      debugInfo.authUsersAttempt = {
        success: !authError,
        error: authError
      }

      // 3. محاولة قراءة جدول user_profiles
      console.log('محاولة قراءة user_profiles...')
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('*')
      debugInfo.profilesAttempt = {
        success: !profilesError,
        error: profilesError,
        data: profiles
      }

      // 4. محاولة قراءة جدول users
      console.log('محاولة قراءة جدول users...')
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*')
      debugInfo.usersAttempt = {
        success: !usersError,
        error: usersError,
        data: users
      }

      setDebug(debugInfo)
    } catch (err) {
      console.error('خطأ في فحص قاعدة البيانات:', err)
      setError(err instanceof Error ? err.message : 'حدث خطأ في فحص قاعدة البيانات')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">فحص قاعدة البيانات</h1>
          <button
            onClick={checkDatabase}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            إعادة الفحص
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold ml-2">خطأ!</strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <div className="bg-white shadow rounded-lg">
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">نتائج الفحص</h2>
            <pre className="bg-gray-50 p-4 rounded-lg overflow-auto max-h-96 text-sm">
              {JSON.stringify(debug, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </Layout>
  )
}
