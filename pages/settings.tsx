import Layout from '../components/Layout'
import { useState } from 'react'
import supabase from '../utils/supabaseClient'

interface SystemSettings {
  systemName: string
  notificationsEnabled: boolean
  darkMode: boolean
  language: 'ar' | 'en'
  currency: string
  timezone: string
}

export default function Settings() {
  const [settings, setSettings] = useState<SystemSettings>({
    systemName: 'نظام إدارة السيارات',
    notificationsEnabled: true,
    darkMode: false,
    language: 'ar',
    currency: 'SAR',
    timezone: 'Asia/Riyadh'
  })

  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      // هنا يمكن إضافة كود حفظ الإعدادات في Supabase
      await new Promise(resolve => setTimeout(resolve, 1000)) // محاكاة عملية الحفظ
      alert('تم حفظ الإعدادات بنجاح')
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('حدث خطأ أثناء حفظ الإعدادات')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout title="الإعدادات">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">إعدادات النظام</h1>
          <button
            onClick={() => handleSubmit}
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 transition-colors duration-200"
          >
            {loading ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
          </button>
        </div>

        <div className="bg-white rounded-lg shadow divide-y divide-gray-200">
          {/* إعدادات عامة */}
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">إعدادات عامة</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="systemName" className="block text-sm font-medium text-gray-700 mb-1">
                  اسم النظام
                </label>
                <input
                  id="systemName"
                  type="text"
                  value={settings.systemName}
                  onChange={(e) => setSettings({ ...settings, systemName: e.target.value })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="أدخل اسم النظام"
                  aria-label="اسم النظام"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <label htmlFor="notifications" className="text-sm font-medium text-gray-700 ml-3">
                    تفعيل الإشعارات
                  </label>
                  <input
                    id="notifications"
                    type="checkbox"
                    checked={settings.notificationsEnabled}
                    onChange={(e) => setSettings({ ...settings, notificationsEnabled: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    aria-label="تفعيل الإشعارات"
                  />
                </div>

                <div className="flex items-center">
                  <label htmlFor="darkMode" className="text-sm font-medium text-gray-700 ml-3">
                    الوضع الداكن
                  </label>
                  <input
                    id="darkMode"
                    type="checkbox"
                    checked={settings.darkMode}
                    onChange={(e) => setSettings({ ...settings, darkMode: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    aria-label="تفعيل الوضع الداكن"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* إعدادات المنطقة */}
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">إعدادات المنطقة</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-1">
                  اللغة
                </label>
                <select
                  id="language"
                  value={settings.language}
                  onChange={(e) => setSettings({ ...settings, language: e.target.value as 'ar' | 'en' })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  aria-label="اختر اللغة"
                >
                  <option value="ar">العربية</option>
                  <option value="en">English</option>
                </select>
              </div>

              <div>
                <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-1">
                  العملة
                </label>
                <select
                  id="currency"
                  value={settings.currency}
                  onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  aria-label="اختر العملة"
                >
                  <option value="SAR">ريال سعودي (SAR)</option>
                  <option value="USD">دولار أمريكي (USD)</option>
                  <option value="EUR">يورو (EUR)</option>
                </select>
              </div>

              <div>
                <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 mb-1">
                  المنطقة الزمنية
                </label>
                <select
                  id="timezone"
                  value={settings.timezone}
                  onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  aria-label="اختر المنطقة الزمنية"
                >
                  <option value="Asia/Riyadh">الرياض (GMT+3)</option>
                  <option value="Asia/Dubai">دبي (GMT+4)</option>
                  <option value="Asia/Kuwait">الكويت (GMT+3)</option>
                </select>
              </div>
            </div>
          </div>

          {/* إعدادات الأمان */}
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">إعدادات الأمان</h2>
            <div className="space-y-4">
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                تغيير كلمة المرور
              </button>

              <button
                type="button"
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                تفعيل المصادقة الثنائية
              </button>
            </div>
          </div>

          {/* النسخ الاحتياطي */}
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">النسخ الاحتياطي</h2>
            <div className="space-y-4">
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                إنشاء نسخة احتياطية
              </button>

              <button
                type="button"
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                استعادة من نسخة احتياطية
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
