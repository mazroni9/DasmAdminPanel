import Layout from '../components/Layout'
import { useState } from 'react'
import supabase from '../utils/supabaseClient'

interface AuctionSettings {
  platformName: string
  minBidIncrement: number
  auctionDuration: number
  autoExtendTime: number
  defaultReservePrice: number
  bidderVerification: boolean
  automaticApprovals: boolean
  notificationsEnabled: boolean
  defaultCurrency: string
  timezone: string
  commissionRate: number
}

export default function Settings() {
  const [settings, setSettings] = useState<AuctionSettings>({
    platformName: 'منصة المزادات',
    minBidIncrement: 100,
    auctionDuration: 24,
    autoExtendTime: 5,
    defaultReservePrice: 1000,
    bidderVerification: true,
    automaticApprovals: false,
    notificationsEnabled: true,
    defaultCurrency: 'SAR',
    timezone: 'Asia/Riyadh',
    commissionRate: 2.5
  })

  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      // هنا سيتم إضافة كود حفظ الإعدادات في Supabase
      await new Promise(resolve => setTimeout(resolve, 1000))
      alert('تم حفظ إعدادات المنصة بنجاح')
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('حدث خطأ أثناء حفظ الإعدادات')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout title="إعدادات المنصة">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">إعدادات منصة المزادات</h1>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 transition-colors duration-200"
          >
            {loading ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
          </button>
        </div>

        <div className="bg-white rounded-lg shadow divide-y divide-gray-200">
          {/* إعدادات المزادات الأساسية */}
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">إعدادات المزادات الأساسية</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="platformName" className="block text-sm font-medium text-gray-700 mb-1">
                  اسم المنصة
                </label>
                <input
                  id="platformName"
                  type="text"
                  value={settings.platformName}
                  onChange={(e) => setSettings({ ...settings, platformName: e.target.value })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="minBidIncrement" className="block text-sm font-medium text-gray-700 mb-1">
                  الحد الأدنى للمزايدة (ريال)
                </label>
                <input
                  id="minBidIncrement"
                  type="number"
                  value={settings.minBidIncrement}
                  onChange={(e) => setSettings({ ...settings, minBidIncrement: Number(e.target.value) })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="auctionDuration" className="block text-sm font-medium text-gray-700 mb-1">
                  المدة الافتراضية للمزاد (ساعة)
                </label>
                <input
                  id="auctionDuration"
                  type="number"
                  value={settings.auctionDuration}
                  onChange={(e) => setSettings({ ...settings, auctionDuration: Number(e.target.value) })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="autoExtendTime" className="block text-sm font-medium text-gray-700 mb-1">
                  وقت التمديد التلقائي (دقائق)
                </label>
                <input
                  id="autoExtendTime"
                  type="number"
                  value={settings.autoExtendTime}
                  onChange={(e) => setSettings({ ...settings, autoExtendTime: Number(e.target.value) })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="defaultReservePrice" className="block text-sm font-medium text-gray-700 mb-1">
                  السعر الاحتياطي الافتراضي (ريال)
                </label>
                <input
                  id="defaultReservePrice"
                  type="number"
                  value={settings.defaultReservePrice}
                  onChange={(e) => setSettings({ ...settings, defaultReservePrice: Number(e.target.value) })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="commissionRate" className="block text-sm font-medium text-gray-700 mb-1">
                  نسبة عمولة المنصة (%)
                </label>
                <input
                  id="commissionRate"
                  type="number"
                  step="0.1"
                  value={settings.commissionRate}
                  onChange={(e) => setSettings({ ...settings, commissionRate: Number(e.target.value) })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            </div>
          </div>

          {/* إعدادات التحكم والموافقات */}
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">إعدادات التحكم والموافقات</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <label htmlFor="bidderVerification" className="text-sm font-medium text-gray-700 ml-3">
                    التحقق من المزايدين قبل المشاركة
                  </label>
                  <input
                    id="bidderVerification"
                    type="checkbox"
                    checked={settings.bidderVerification}
                    onChange={(e) => setSettings({ ...settings, bidderVerification: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center">
                  <label htmlFor="automaticApprovals" className="text-sm font-medium text-gray-700 ml-3">
                    الموافقة التلقائية على المزادات الجديدة
                  </label>
                  <input
                    id="automaticApprovals"
                    type="checkbox"
                    checked={settings.automaticApprovals}
                    onChange={(e) => setSettings({ ...settings, automaticApprovals: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* إعدادات الإشعارات */}
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">إعدادات الإشعارات والتنبيهات</h2>
            <div className="space-y-4">
              <div className="flex items-center">
                <label htmlFor="notificationsEnabled" className="text-sm font-medium text-gray-700 ml-3">
                  تفعيل الإشعارات التلقائية
                </label>
                <input
                  id="notificationsEnabled"
                  type="checkbox"
                  checked={settings.notificationsEnabled}
                  onChange={(e) => setSettings({ ...settings, notificationsEnabled: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
              </div>
              <p className="text-sm text-gray-500">
                يشمل: إشعارات بداية ونهاية المزادات، تنبيهات المزايدات الجديدة، إشعارات الفوز بالمزاد
              </p>
            </div>
          </div>

          {/* إعدادات المنطقة */}
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">إعدادات المنطقة</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="defaultCurrency" className="block text-sm font-medium text-gray-700 mb-1">
                  العملة الافتراضية
                </label>
                <select
                  id="defaultCurrency"
                  value={settings.defaultCurrency}
                  onChange={(e) => setSettings({ ...settings, defaultCurrency: e.target.value })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
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
                >
                  <option value="Asia/Riyadh">الرياض (GMT+3)</option>
                  <option value="Asia/Dubai">دبي (GMT+4)</option>
                  <option value="Asia/Kuwait">الكويت (GMT+3)</option>
                </select>
              </div>
            </div>
          </div>

          {/* إجراءات متقدمة */}
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">إجراءات متقدمة</h2>
            <div className="space-y-4">
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                إيقاف جميع المزادات النشطة
              </button>

              <button
                type="button"
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                تصدير سجل المزادات
              </button>

              <button
                type="button"
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                إنشاء نسخة احتياطية من قاعدة البيانات
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
