import Layout from '../components/Layout'
import { useEffect, useState } from 'react'
import supabase from '../utils/supabaseClient'
import { UserIcon, ClockIcon, CalendarIcon } from '@heroicons/react/24/outline'

interface User {
  id: string
  email: string
  full_name: string
  created_at: string
  last_sign_in: string
  avatar_url?: string
}

interface DatabaseStatus {
  tablesError: any;
  authUsersAttempt: {
    success: boolean;
    error?: any;
  };
  profilesAttempt: {
    success: boolean;
    error?: any;
  };
}

export default function Users() {
  const [loading, setLoading] = useState(true)
  const [dbStatus, setDbStatus] = useState<DatabaseStatus | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [stats, setStats] = useState({
    total: 0,
    activeToday: 0,
    newThisWeek: 0
  })

  const checkDatabaseConnection = async () => {
    setLoading(true)
    try {
      // فحص جداول قاعدة البيانات
      const { data: tablesData, error: tablesError } = await supabase
        .from('profiles')
        .select('count')
      
      // فحص جدول المستخدمين المصادق عليهم
      const { data: authData, error: authError } = await supabase.auth.getSession()
      
      // فحص جدول الملفات الشخصية
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('count')
      
      setDbStatus({
        tablesError: tablesError,
        authUsersAttempt: {
          success: !authError,
          error: authError
        },
        profilesAttempt: {
          success: !profilesError,
          error: profilesError
        }
      })

      // إذا نجح الاتصال، نقوم بجلب المستخدمين
      if (!tablesError && !authError && !profilesError) {
        await fetchUsers()
      }
    } catch (error) {
      console.error('خطأ في فحص قاعدة البيانات:', error)
      setDbStatus({
        tablesError: error,
        authUsersAttempt: {
          success: false,
          error: error
        },
        profilesAttempt: {
          success: false,
          error: error
        }
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      // جلب المستخدمين مع ملفاتهم الشخصية
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const weekAgo = new Date(now.setDate(now.getDate() - 7))

      const usersWithStats = profiles || []
      setUsers(usersWithStats)
      
      // حساب الإحصائيات
      setStats({
        total: usersWithStats.length,
        activeToday: usersWithStats.filter(user => 
          user.last_sign_in && new Date(user.last_sign_in) >= today
        ).length,
        newThisWeek: usersWithStats.filter(user => 
          new Date(user.created_at) >= weekAgo
        ).length
      })

    } catch (error) {
      console.error('خطأ في جلب المستخدمين:', error)
    }
  }

  useEffect(() => {
    checkDatabaseConnection()
  }, [])

  const getStatusColor = (success: boolean) => {
    return success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
  }

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري فحص الاتصال بقاعدة البيانات...</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50/50 p-4 sm:p-6 lg:p-8">
        {/* إحصائيات المستخدمين */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <UserIcon className="h-10 w-10 text-blue-500" />
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">إجمالي المستخدمين</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <ClockIcon className="h-10 w-10 text-green-500" />
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">نشط اليوم</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.activeToday}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <CalendarIcon className="h-10 w-10 text-purple-500" />
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">مستخدمين جدد هذا الأسبوع</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.newThisWeek}</p>
              </div>
            </div>
          </div>
        </div>

        {/* حالة قاعدة البيانات */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">حالة الاتصال</h1>
            <button
              onClick={() => checkDatabaseConnection()}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              disabled={loading}
            >
              {loading ? 'جاري الفحص...' : 'إعادة الفحص'}
            </button>
          </div>

          <div className="space-y-4">
            {dbStatus && (
              <>
                <div className={`rounded-md p-3 ${getStatusColor(!dbStatus.tablesError)}`}>
                  <h3 className="font-medium">حالة الجداول</h3>
                  <p>{dbStatus.tablesError ? 'خطأ في الاتصال بالجداول' : 'متصل'}</p>
                </div>
                <div className={`rounded-md p-3 ${getStatusColor(dbStatus.authUsersAttempt.success)}`}>
                  <h3 className="font-medium">حالة المصادقة</h3>
                  <p>{dbStatus.authUsersAttempt.success ? 'متصل' : 'خطأ في المصادقة'}</p>
                </div>
                <div className={`rounded-md p-3 ${getStatusColor(dbStatus.profilesAttempt.success)}`}>
                  <h3 className="font-medium">حالة الملفات الشخصية</h3>
                  <p>{dbStatus.profilesAttempt.success ? 'متصل' : 'خطأ في الملفات الشخصية'}</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* قائمة المستخدمين */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">قائمة المستخدمين</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    المستخدم
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    البريد الإلكتروني
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    تاريخ التسجيل
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    آخر دخول
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          {user.avatar_url ? (
                            <img className="h-10 w-10 rounded-full" src={user.avatar_url} alt="" />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <UserIcon className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="mr-4">
                          <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString('ar-SA')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.last_sign_in ? new Date(user.last_sign_in).toLocaleDateString('ar-SA') : 'لم يسجل دخول بعد'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  )
}
