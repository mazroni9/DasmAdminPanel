import Layout from '../components/Layout'
import { useEffect, useState } from 'react'
import supabase from '../utils/supabaseClient'
import { User as SupabaseUser } from '@supabase/supabase-js'

interface User extends Omit<SupabaseUser, 'role'> {
  role?: string
  is_active?: boolean
}

export default function Users() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  async function fetchUsers() {
    try {
      setLoading(true)
      setError(null)

      // جلب المستخدمين من جدول auth.users
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
      
      if (authError) throw authError

      // جلب الأدوار والمعلومات الإضافية من جدول user_profiles إذا كان موجوداً
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('*')

      if (profilesError) {
        console.warn('خطأ في جلب الملفات الشخصية:', profilesError.message)
      }

      // دمج بيانات المستخدمين مع ملفاتهم الشخصية
      const enrichedUsers = authUsers.users.map(user => ({
        ...user,
        role: profiles?.find(p => p.user_id === user.id)?.role || 'مستخدم',
        is_active: Boolean(user.email_confirmed_at) && !user.banned_until
      }))

      setUsers(enrichedUsers)
    } catch (err) {
      console.error('Error fetching users:', err)
      setError(err instanceof Error ? err.message : 'حدث خطأ في جلب المستخدمين')
    } finally {
      setLoading(false)
    }
  }

  async function handleUserAction(userId: string, action: 'activate' | 'deactivate' | 'delete') {
    try {
      switch (action) {
        case 'activate':
          await supabase.auth.admin.updateUserById(userId, { user_metadata: { status: 'active' } })
          break
        case 'deactivate':
          await supabase.auth.admin.updateUserById(userId, { user_metadata: { status: 'inactive' } })
          break
        case 'delete':
          await supabase.auth.admin.deleteUser(userId)
          break
      }
      await fetchUsers() // إعادة تحميل القائمة
    } catch (err) {
      console.error(`Error ${action} user:`, err)
      setError(`حدث خطأ أثناء ${action === 'delete' ? 'حذف' : 'تحديث'} المستخدم`)
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

  if (error) {
    return (
      <Layout>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">المستخدمون ({users.length})</h1>
          <button
            onClick={() => fetchUsers()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            تحديث
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map((user) => (
            <div
              key={user.id}
              className="bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                      {user.user_metadata?.name ? (
                        user.user_metadata.name.charAt(0).toUpperCase()
                      ) : (
                        user.email.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold">
                        {user.user_metadata?.name || 'مستخدم جديد'}
                      </h2>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      user.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {user.is_active ? 'نشط' : 'غير نشط'}
                  </span>
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  <p>
                    <span className="font-medium">الدور:</span> {user.role}
                  </p>
                  <p>
                    <span className="font-medium">تاريخ التسجيل:</span>{' '}
                    {new Date(user.created_at).toLocaleDateString('ar-SA')}
                  </p>
                  {user.last_sign_in_at && (
                    <p>
                      <span className="font-medium">آخر تسجيل دخول:</span>{' '}
                      {new Date(user.last_sign_in_at).toLocaleDateString('ar-SA')}
                    </p>
                  )}
                </div>

                <div className="mt-4 flex justify-end space-x-2 space-x-reverse">
                  <button
                    onClick={() => handleUserAction(user.id, user.is_active ? 'deactivate' : 'activate')}
                    className={`px-3 py-1 text-sm rounded-md ${
                      user.is_active
                        ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {user.is_active ? 'إيقاف' : 'تفعيل'}
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
                        handleUserAction(user.id, 'delete')
                      }
                    }}
                    className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200"
                  >
                    حذف
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {users.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500">لا يوجد مستخدمين حالياً</p>
          </div>
        )}
      </div>
    </Layout>
  )
}
