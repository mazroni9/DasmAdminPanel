import Layout from '../components/Layout'
import { useState } from 'react'
import supabase from '../utils/supabaseClient'

interface SystemSettings {
  // إعدادات المزادات
  auctionSettings: {
    minBidIncrement: number
    auctionDuration: number
    autoExtendTime: number
    defaultReservePrice: number
    commissionRate: number
  }
  // إعدادات المالية
  financialSettings: {
    defaultCurrency: string
    minWalletBalance: number
    maxTransactionLimit: number
    withdrawalFee: number
    shariah_compliant: boolean
  }
  // إعدادات الاشتراكات
  subscriptionSettings: {
    defaultPlanDuration: number
    trialPeriodDays: number
    autoRenewal: boolean
  }
  // إعدادات التمويل
  fundingSettings: {
    maxFundingAmount: number
    repaymentPeriodMonths: number
    profitMarginPercent: number
    requireGuarantor: boolean
  }
  // إعدادات النظام
  systemSettings: {
    timezone: string
    notificationsEnabled: boolean
    automaticApprovals: boolean
    auditLogRetention: number
  }
}

export default function Settings() {
  const [settings, setSettings] = useState<SystemSettings>({
    auctionSettings: {
      minBidIncrement: 100,
      auctionDuration: 24,
      autoExtendTime: 5,
      defaultReservePrice: 1000,
      commissionRate: 2.5
    },
    financialSettings: {
      defaultCurrency: 'SAR',
      minWalletBalance: 0,
      maxTransactionLimit: 100000,
      withdrawalFee: 10,
      shariah_compliant: true
    },
    subscriptionSettings: {
      defaultPlanDuration: 30,
      trialPeriodDays: 14,
      autoRenewal: true
    },
    fundingSettings: {
      maxFundingAmount: 500000,
      repaymentPeriodMonths: 12,
      profitMarginPercent: 5,
      requireGuarantor: true
    },
    systemSettings: {
      timezone: 'Asia/Riyadh',
      notificationsEnabled: true,
      automaticApprovals: false,
      auditLogRetention: 90
    }
  })

  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      await supabase.from('system_settings').upsert({
        settings: settings,
        updated_at: new Date().toISOString()
      })
      alert('تم حفظ الإعدادات بنجاح')
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('حدث خطأ أثناء حفظ الإعدادات')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout title="إعدادات النظام">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">إعدادات النظام</h1>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 transition-colors duration-200"
          >
            {loading ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
          </button>
        </div>

        <div className="bg-white rounded-lg shadow divide-y divide-gray-200">
          {/* إعدادات المزادات */}
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">إعدادات المزادات</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="minBidIncrement" className="block text-sm font-medium text-gray-700 mb-1">
                  الحد الأدنى للمزايدة (ريال)
                </label>
                <input
                  id="minBidIncrement"
                  type="number"
                  value={settings.auctionSettings.minBidIncrement}
                  onChange={(e) => setSettings({
                    ...settings,
                    auctionSettings: {
                      ...settings.auctionSettings,
                      minBidIncrement: Number(e.target.value)
                    }
                  })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="commissionRate" className="block text-sm font-medium text-gray-700 mb-1">
                  نسبة العمولة (%)
                </label>
                <input
                  id="commissionRate"
                  type="number"
                  step="0.1"
                  value={settings.auctionSettings.commissionRate}
                  onChange={(e) => setSettings({
                    ...settings,
                    auctionSettings: {
                      ...settings.auctionSettings,
                      commissionRate: Number(e.target.value)
                    }
                  })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            </div>
          </div>

          {/* إعدادات المالية */}
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">الإعدادات المالية</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="maxTransactionLimit" className="block text-sm font-medium text-gray-700 mb-1">
                  الحد الأقصى للتحويل (ريال)
                </label>
                <input
                  id="maxTransactionLimit"
                  type="number"
                  value={settings.financialSettings.maxTransactionLimit}
                  onChange={(e) => setSettings({
                    ...settings,
                    financialSettings: {
                      ...settings.financialSettings,
                      maxTransactionLimit: Number(e.target.value)
                    }
                  })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="withdrawalFee" className="block text-sm font-medium text-gray-700 mb-1">
                  رسوم السحب (ريال)
                </label>
                <input
                  id="withdrawalFee"
                  type="number"
                  value={settings.financialSettings.withdrawalFee}
                  onChange={(e) => setSettings({
                    ...settings,
                    financialSettings: {
                      ...settings.financialSettings,
                      withdrawalFee: Number(e.target.value)
                    }
                  })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              <div className="flex items-center">
                <label htmlFor="shariahCompliant" className="text-sm font-medium text-gray-700 ml-3">
                  متوافق مع الشريعة
                </label>
                <input
                  id="shariahCompliant"
                  type="checkbox"
                  checked={settings.financialSettings.shariah_compliant}
                  onChange={(e) => setSettings({
                    ...settings,
                    financialSettings: {
                      ...settings.financialSettings,
                      shariah_compliant: e.target.checked
                    }
                  })}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* إعدادات التمويل */}
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">إعدادات التمويل</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="maxFundingAmount" className="block text-sm font-medium text-gray-700 mb-1">
                  الحد الأقصى للتمويل (ريال)
                </label>
                <input
                  id="maxFundingAmount"
                  type="number"
                  value={settings.fundingSettings.maxFundingAmount}
                  onChange={(e) => setSettings({
                    ...settings,
                    fundingSettings: {
                      ...settings.fundingSettings,
                      maxFundingAmount: Number(e.target.value)
                    }
                  })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="repaymentPeriodMonths" className="block text-sm font-medium text-gray-700 mb-1">
                  مدة السداد (شهور)
                </label>
                <input
                  id="repaymentPeriodMonths"
                  type="number"
                  value={settings.fundingSettings.repaymentPeriodMonths}
                  onChange={(e) => setSettings({
                    ...settings,
                    fundingSettings: {
                      ...settings.fundingSettings,
                      repaymentPeriodMonths: Number(e.target.value)
                    }
                  })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="profitMarginPercent" className="block text-sm font-medium text-gray-700 mb-1">
                  نسبة هامش الربح (%)
                </label>
                <input
                  id="profitMarginPercent"
                  type="number"
                  step="0.1"
                  value={settings.fundingSettings.profitMarginPercent}
                  onChange={(e) => setSettings({
                    ...settings,
                    fundingSettings: {
                      ...settings.fundingSettings,
                      profitMarginPercent: Number(e.target.value)
                    }
                  })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              <div className="flex items-center">
                <label htmlFor="requireGuarantor" className="text-sm font-medium text-gray-700 ml-3">
                  طلب ضامن
                </label>
                <input
                  id="requireGuarantor"
                  type="checkbox"
                  checked={settings.fundingSettings.requireGuarantor}
                  onChange={(e) => setSettings({
                    ...settings,
                    fundingSettings: {
                      ...settings.fundingSettings,
                      requireGuarantor: e.target.checked
                    }
                  })}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* إعدادات الاشتراكات */}
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">إعدادات الاشتراكات</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="defaultPlanDuration" className="block text-sm font-medium text-gray-700 mb-1">
                  مدة الاشتراك الافتراضية (يوم)
                </label>
                <input
                  id="defaultPlanDuration"
                  type="number"
                  value={settings.subscriptionSettings.defaultPlanDuration}
                  onChange={(e) => setSettings({
                    ...settings,
                    subscriptionSettings: {
                      ...settings.subscriptionSettings,
                      defaultPlanDuration: Number(e.target.value)
                    }
                  })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="trialPeriodDays" className="block text-sm font-medium text-gray-700 mb-1">
                  فترة التجربة (يوم)
                </label>
                <input
                  id="trialPeriodDays"
                  type="number"
                  value={settings.subscriptionSettings.trialPeriodDays}
                  onChange={(e) => setSettings({
                    ...settings,
                    subscriptionSettings: {
                      ...settings.subscriptionSettings,
                      trialPeriodDays: Number(e.target.value)
                    }
                  })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              <div className="flex items-center">
                <label htmlFor="autoRenewal" className="text-sm font-medium text-gray-700 ml-3">
                  تجديد تلقائي
                </label>
                <input
                  id="autoRenewal"
                  type="checkbox"
                  checked={settings.subscriptionSettings.autoRenewal}
                  onChange={(e) => setSettings({
                    ...settings,
                    subscriptionSettings: {
                      ...settings.subscriptionSettings,
                      autoRenewal: e.target.checked
                    }
                  })}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* إعدادات النظام */}
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">إعدادات النظام</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 mb-1">
                  المنطقة الزمنية
                </label>
                <select
                  id="timezone"
                  value={settings.systemSettings.timezone}
                  onChange={(e) => setSettings({
                    ...settings,
                    systemSettings: {
                      ...settings.systemSettings,
                      timezone: e.target.value
                    }
                  })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="Asia/Riyadh">الرياض (GMT+3)</option>
                  <option value="Asia/Dubai">دبي (GMT+4)</option>
                  <option value="Asia/Kuwait">الكويت (GMT+3)</option>
                </select>
              </div>

              <div>
                <label htmlFor="auditLogRetention" className="block text-sm font-medium text-gray-700 mb-1">
                  مدة الاحتفاظ بسجلات التدقيق (يوم)
                </label>
                <input
                  id="auditLogRetention"
                  type="number"
                  value={settings.systemSettings.auditLogRetention}
                  onChange={(e) => setSettings({
                    ...settings,
                    systemSettings: {
                      ...settings.systemSettings,
                      auditLogRetention: Number(e.target.value)
                    }
                  })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              <div className="flex items-center">
                <label htmlFor="notificationsEnabled" className="text-sm font-medium text-gray-700 ml-3">
                  تفعيل الإشعارات
                </label>
                <input
                  id="notificationsEnabled"
                  type="checkbox"
                  checked={settings.systemSettings.notificationsEnabled}
                  onChange={(e) => setSettings({
                    ...settings,
                    systemSettings: {
                      ...settings.systemSettings,
                      notificationsEnabled: e.target.checked
                    }
                  })}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center">
                <label htmlFor="automaticApprovals" className="text-sm font-medium text-gray-700 ml-3">
                  موافقات تلقائية
                </label>
                <input
                  id="automaticApprovals"
                  type="checkbox"
                  checked={settings.systemSettings.automaticApprovals}
                  onChange={(e) => setSettings({
                    ...settings,
                    systemSettings: {
                      ...settings.systemSettings,
                      automaticApprovals: e.target.checked
                    }
                  })}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
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
                إيقاف جميع المعاملات النشطة
              </button>

              <button
                type="button"
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                تصدير سجلات التدقيق
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
