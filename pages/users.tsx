import Layout from '../components/Layout'
import { useEffect, useState } from 'react'
import { UserIcon, ClockIcon, CalendarIcon } from '@heroicons/react/24/outline'

interface User {
  id: string
  email: string
  created_at: string
  last_sign_in_at: string | null
}

export default function Users() {
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<User[]>([])
  const [stats, setStats] = useState({
    total: 0,
    activeToday: 0,
    newThisWeek: 0
  })

  const fetchUsers = async () => {
    try {
      // بيانات محاكاة للمستخدمين
      const mockUsers: User[] = [
        {
          id: '1',
          email: 'ahmed@example.com',
          created_at: '2024-01-15T10:30:00Z',
          last_sign_in_at: '2024-01-20T14:20:00Z'
        },
        {
          id: '2',
          email: 'sara@example.com',
          created_at: '2024-01-18T09:15:00Z',
          last_sign_in_at: '2024-01-21T16:45:00Z'
        },
        {
          id: '3',
          email: 'mohammed@example.com',
          created_at: '2024-01-10T11:00:00Z',
          last_sign_in_at: '2024-01-19T12:30:00Z'
        },
        {
          id: '4',
          email: 'fatima@example.com',
          created_at: '2024-01-22T08:45:00Z',
          last_sign_in_at: '2024-01-22T08:45:00Z'
        },
        {
          id: '5',
          email: 'ali@example.com',
          created_at: '2024-01-12T13:20:00Z',
          last_sign_in_at: '2024-01-20T10:15:00Z'
        }
      ]

      setUsers(mockUsers)

      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

      setStats({
        total: mockUsers.length,
        activeToday: mockUsers.filter((u: User) => u.last_sign_in_at && new Date(u.last_sign_in_at) >= today).length,
        newThisWeek: mockUsers.filter((u: User) => new Date(u.created_at) >= weekAgo).length
      })

    } catch (error) {
      console.error('خطأ في جلب المستخدمين:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري تحميل بيانات المستخدمين...</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50/50 p-4 sm:p-6 lg:p-8">
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

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">قائمة المستخدمين</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">البريد الإلكتروني</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">تاريخ التسجيل</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">آخر تسجيل دخول</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(user.created_at).toLocaleDateString('ar-SA')}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString('ar-SA') : 'لا يوجد'}</td>
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
