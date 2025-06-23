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

      // جلب المستخدمين من جدول user_profiles
      const { data, error: fetchError } = await supabase
        .from('user_profiles')
        .select(`
          id,
          email,
          created_at,
          role,
          is_active,
          full_name,
          phone,
          last_sign_in
        `)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      setUsers(data || [])
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
        case 'deactivate':
          const { error: updateError } = await supabase
            .from('user_profiles')
            .update({ 
              is_active: action === 'activate',
              updated_at: new Date().toISOString()
            })
            .eq('id', userId)
          
          if (updateError) throw updateError
          break

        case 'delete':
          const { error: deleteError } = await supabase
            .from('user_profiles')
            .delete()
            .eq('id', userId)
          
          if (deleteError) throw deleteError
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
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold ml-2">خطأ!</strong>
          <span className="block sm:inline">{error}</span>
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
                      {user.full_name ? (
                        user.full_name.charAt(0).toUpperCase()
                      ) : (
                        user.email.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold">
                        {user.full_name || 'مستخدم جديد'}
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
                  {user.phone && (
                    <p>
                      <span className="font-medium">الهاتف:</span> {user.phone}
                    </p>
                  )}
                  <p>
                    <span className="font-medium">تاريخ التسجيل:</span>{' '}
                    {new Date(user.created_at).toLocaleDateString('ar-SA')}
                  </p>
                  {user.last_sign_in && (
                    <p>
                      <span className="font-medium">آخر تسجيل دخول:</span>{' '}
                      {new Date(user.last_sign_in).toLocaleDateString('ar-SA')}
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
