import Layout from '../components/Layout'
import { useEffect, useState } from 'react'
import supabase from '../utils/supabaseClient'
import { getCurrentAdmin } from '../utils/adminAuth'
import type { Admin } from '../utils/adminAuth'

interface DashboardStats {
  cars: number
  users: number
  wallets: number
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({ cars: 0, users: 0, wallets: 0 })
  const [loading, setLoading] = useState(true)
  const [admin, setAdmin] = useState<Admin | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // استخدام بيانات محاكاة بدلاً من Supabase
        setStats({
          cars: 25,
          users: 150,
          wallets: 45
        })
      } catch (error) {
        console.error('Error fetching stats:', error)
        // في حالة الخطأ، نستخدم بيانات افتراضية
        setStats({
          cars: 0,
          users: 0,
          wallets: 0
        })
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  useEffect(() => {
    async function loadAdminData() {
      try {
        const currentAdmin = await getCurrentAdmin()
        setAdmin(currentAdmin)
      } catch (error) {
        console.error('Error loading admin data:', error)
        // في حالة الخطأ، نستخدم بيانات افتراضية
        setAdmin({
          id: '1',
          full_name: 'مشرف النظام',
          email: 'admin@dasm-e.com',
          role: 'admin'
        })
      }
    }
    loadAdminData()
  }, [])

  return (
    <Layout title="لوحة التحكم">
      <div className="min-h-screen bg-gray-50/50">
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                {loading ? (
                  <div className="animate-pulse h-8 w-96 bg-gray-200 rounded"></div>
                ) : (
                  <h1 className="text-2xl font-semibold text-gray-800">
                    مرحباً بك يا {admin?.full_name || 'مشرف'} في غرفة الكنترول روم للإشراف على منصة DASM-e
                  </h1>
                )}
                <p className="mt-1 text-sm text-gray-500">
                  يمكنك من هنا إدارة ومراقبة جميع عمليات المنصة
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* إحصائيات السيارات */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">إجمالي السيارات</p>
                  <p className="mt-2 text-4xl font-semibold">
                    {loading ? '...' : stats.cars}
                  </p>
                </div>
                <div className="bg-blue-400 bg-opacity-30 rounded-full p-3">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* إحصائيات المستخدمين */}
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">إجمالي المستخدمين</p>
                  <p className="mt-2 text-4xl font-semibold">
                    {loading ? '...' : stats.users}
                  </p>
                </div>
                <div className="bg-green-400 bg-opacity-30 rounded-full p-3">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* إحصائيات المحافظ */}
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">إجمالي المحافظ</p>
                  <p className="mt-2 text-4xl font-semibold">
                    {loading ? '...' : stats.wallets}
                  </p>
                </div>
                <div className="bg-purple-400 bg-opacity-30 rounded-full p-3">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
