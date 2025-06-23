import Layout from '../components/Layout'
import { useState } from 'react'
import supabase from '../utils/supabaseClient'

interface SystemSettings {
  // إعدادات النظام الأساسية
  appSettings: {
    appName: string
    appUrl: string
    frontendUrl: string
    appLocale: 'ar' | 'en'
    debugMode: boolean
    maintenanceMode: boolean
  }
  // إعدادات قاعدة البيانات
  databaseSettings: {
    connectionType: string
    maxConnections: number
    backupEnabled: boolean
    backupFrequency: 'daily' | 'weekly' | 'monthly'
  }
  // إعدادات البريد الإلكتروني
  mailSettings: {
    provider: string
    fromName: string
    fromAddress: string
    encryptionType: string
    notificationTypes: {
      userRegistration: boolean
      auctionStart: boolean
      bidPlaced: boolean
      auctionEnd: boolean
      paymentReceived: boolean
    }
  }
  // إعدادات الوسائط والملفات
  mediaSettings: {
    provider: 'local' | 'cloudinary' | 's3'
    maxFileSize: number
    allowedFileTypes: string[]
    imageQuality: number
    storageQuota: number
  }
  // إعدادات الأمان
  securitySettings: {
    sessionLifetime: number
    sessionEncryption: boolean
    passwordMinLength: number
    requireTwoFactor: boolean
    loginAttempts: number
    ipBlocking: boolean
  }
  // إعدادات المزادات والمالية
  businessSettings: {
    currency: string
    timezone: string
    vatRate: number
    commissionRate: number
    minBidIncrement: number
    autoExtendTime: number
    paymentMethods: string[]
  }
  // إعدادات التكامل
  integrationSettings: {
    smsEnabled: boolean
    smsProvider: string
    paymentGateways: string[]
    analyticsEnabled: boolean
    analyticsProvider: string
  }
  // إعدادات التدقيق والمراقبة
  auditSettings: {
    logRetentionDays: number
    detailedLogging: boolean
    activityTracking: boolean
    errorReporting: boolean
    performanceMonitoring: boolean
  }
}

export default function Settings() {
  const [settings, setSettings] = useState<SystemSettings>({
    appSettings: {
      appName: 'DASM Platform',
      appUrl: 'https://dasm-laravel.onrender.com',
      frontendUrl: 'https://dasm-platform.vercel.app',
      appLocale: 'ar',
      debugMode: false,
      maintenanceMode: false
    },
    databaseSettings: {
      connectionType: 'pgsql',
      maxConnections: 100,
      backupEnabled: true,
      backupFrequency: 'daily'
    },
    mailSettings: {
      provider: 'smtp',
      fromName: 'DASM Platform',
      fromAddress: 'notifications@dasm-platform.com',
      encryptionType: 'tls',
      notificationTypes: {
        userRegistration: true,
        auctionStart: true,
        bidPlaced: true,
        auctionEnd: true,
        paymentReceived: true
      }
    },
    mediaSettings: {
      provider: 'cloudinary',
      maxFileSize: 10,
      allowedFileTypes: ['jpg', 'jpeg', 'png', 'pdf'],
      imageQuality: 80,
      storageQuota: 1000
    },
    securitySettings: {
      sessionLifetime: 120,
      sessionEncryption: true,
      passwordMinLength: 8,
      requireTwoFactor: false,
      loginAttempts: 5,
      ipBlocking: true
    },
    businessSettings: {
      currency: 'SAR',
      timezone: 'Asia/Riyadh',
      vatRate: 15,
      commissionRate: 2.5,
      minBidIncrement: 100,
      autoExtendTime: 5,
      paymentMethods: ['bank_transfer', 'credit_card', 'mada']
    },
    integrationSettings: {
      smsEnabled: true,
      smsProvider: 'twilio',
      paymentGateways: ['stripe', 'paypal'],
      analyticsEnabled: true,
      analyticsProvider: 'google_analytics'
    },
    auditSettings: {
      logRetentionDays: 90,
      detailedLogging: true,
      activityTracking: true,
      errorReporting: true,
      performanceMonitoring: true
    }
  })

  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('app')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      await supabase.from('system_settings').upsert({
        settings: settings,
        updated_at: new Date().toISOString(),
        updated_by: 'admin' // يمكن تحديثها لاحقاً مع هوية المستخدم الفعلي
      })
      alert('تم حفظ الإعدادات بنجاح')
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('حدث خطأ أثناء حفظ الإعدادات')
    } finally {
      setLoading(false)
    }
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'app':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">إعدادات النظام الأساسية</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="appName" className="block text-sm font-medium text-gray-700">
                  اسم التطبيق
                </label>
                <input
                  type="text"
                  id="appName"
                  value={settings.appSettings.appName}
                  onChange={(e) => setSettings({
                    ...settings,
                    appSettings: {
                      ...settings.appSettings,
                      appName: e.target.value
                    }
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="appUrl" className="block text-sm font-medium text-gray-700">
                  رابط التطبيق
                </label>
                <input
                  type="url"
                  id="appUrl"
                  value={settings.appSettings.appUrl}
                  onChange={(e) => setSettings({
                    ...settings,
                    appSettings: {
                      ...settings.appSettings,
                      appUrl: e.target.value
                    }
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div className="flex items-center">
                <label htmlFor="debugMode" className="text-sm font-medium text-gray-700 ml-3">
                  وضع التطوير
                </label>
                <input
                  type="checkbox"
                  id="debugMode"
                  checked={settings.appSettings.debugMode}
                  onChange={(e) => setSettings({
                    ...settings,
                    appSettings: {
                      ...settings.appSettings,
                      debugMode: e.target.checked
                    }
                  })}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
              </div>
              <div className="flex items-center">
                <label htmlFor="maintenanceMode" className="text-sm font-medium text-gray-700 ml-3">
                  وضع الصيانة
                </label>
                <input
                  type="checkbox"
                  id="maintenanceMode"
                  checked={settings.appSettings.maintenanceMode}
                  onChange={(e) => setSettings({
                    ...settings,
                    appSettings: {
                      ...settings.appSettings,
                      maintenanceMode: e.target.checked
                    }
                  })}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>
        )
      
      case 'mail':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">إعدادات البريد الإلكتروني</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="mailProvider" className="block text-sm font-medium text-gray-700">
                  مزود خدمة البريد
                </label>
                <select
                  id="mailProvider"
                  value={settings.mailSettings.provider}
                  onChange={(e) => setSettings({
                    ...settings,
                    mailSettings: {
                      ...settings.mailSettings,
                      provider: e.target.value
                    }
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="smtp">SMTP</option>
                  <option value="mailgun">Mailgun</option>
                  <option value="ses">Amazon SES</option>
                </select>
              </div>
              <div>
                <label htmlFor="fromName" className="block text-sm font-medium text-gray-700">
                  اسم المرسل
                </label>
                <input
                  type="text"
                  id="fromName"
                  value={settings.mailSettings.fromName}
                  onChange={(e) => setSettings({
                    ...settings,
                    mailSettings: {
                      ...settings.mailSettings,
                      fromName: e.target.value
                    }
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div className="col-span-2">
                <h4 className="text-sm font-medium text-gray-700 mb-2">إشعارات البريد الإلكتروني</h4>
                <div className="space-y-2">
                  {Object.entries(settings.mailSettings.notificationTypes).map(([key, value]) => (
                    <div key={key} className="flex items-center">
                      <input
                        type="checkbox"
                        id={key}
                        checked={value}
                        onChange={(e) => setSettings({
                          ...settings,
                          mailSettings: {
                            ...settings.mailSettings,
                            notificationTypes: {
                              ...settings.mailSettings.notificationTypes,
                              [key]: e.target.checked
                            }
                          }
                        })}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <label htmlFor={key} className="mr-2 text-sm text-gray-700">
                        {key === 'userRegistration' && 'تسجيل المستخدمين'}
                        {key === 'auctionStart' && 'بدء المزاد'}
                        {key === 'bidPlaced' && 'تقديم عرض جديد'}
                        {key === 'auctionEnd' && 'انتهاء المزاد'}
                        {key === 'paymentReceived' && 'استلام الدفع'}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )

      case 'security':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">إعدادات الأمان</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="sessionLifetime" className="block text-sm font-medium text-gray-700">
                  مدة الجلسة (دقائق)
                </label>
                <input
                  type="number"
                  id="sessionLifetime"
                  value={settings.securitySettings.sessionLifetime}
                  onChange={(e) => setSettings({
                    ...settings,
                    securitySettings: {
                      ...settings.securitySettings,
                      sessionLifetime: Number(e.target.value)
                    }
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="loginAttempts" className="block text-sm font-medium text-gray-700">
                  عدد محاولات تسجيل الدخول
                </label>
                <input
                  type="number"
                  id="loginAttempts"
                  value={settings.securitySettings.loginAttempts}
                  onChange={(e) => setSettings({
                    ...settings,
                    securitySettings: {
                      ...settings.securitySettings,
                      loginAttempts: Number(e.target.value)
                    }
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div className="flex items-center">
                <label htmlFor="requireTwoFactor" className="text-sm font-medium text-gray-700 ml-3">
                  تفعيل المصادقة الثنائية
                </label>
                <input
                  type="checkbox"
                  id="requireTwoFactor"
                  checked={settings.securitySettings.requireTwoFactor}
                  onChange={(e) => setSettings({
                    ...settings,
                    securitySettings: {
                      ...settings.securitySettings,
                      requireTwoFactor: e.target.checked
                    }
                  })}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
              </div>
              <div className="flex items-center">
                <label htmlFor="ipBlocking" className="text-sm font-medium text-gray-700 ml-3">
                  حظر عناوين IP المشبوهة
                </label>
                <input
                  type="checkbox"
                  id="ipBlocking"
                  checked={settings.securitySettings.ipBlocking}
                  onChange={(e) => setSettings({
                    ...settings,
                    securitySettings: {
                      ...settings.securitySettings,
                      ipBlocking: e.target.checked
                    }
                  })}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>
        )

      case 'business':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">إعدادات الأعمال</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="vatRate" className="block text-sm font-medium text-gray-700">
                  نسبة ضريبة القيمة المضافة (%)
                </label>
                <input
                  type="number"
                  id="vatRate"
                  value={settings.businessSettings.vatRate}
                  onChange={(e) => setSettings({
                    ...settings,
                    businessSettings: {
                      ...settings.businessSettings,
                      vatRate: Number(e.target.value)
                    }
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="paymentMethods" className="block text-sm font-medium text-gray-700">
                  طرق الدفع المتاحة
                </label>
                <select
                  id="paymentMethods"
                  multiple
                  value={settings.businessSettings.paymentMethods}
                  onChange={(e) => {
                    const values = Array.from(e.target.selectedOptions, option => option.value)
                    setSettings({
                      ...settings,
                      businessSettings: {
                        ...settings.businessSettings,
                        paymentMethods: values
                      }
                    })
                  }}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="bank_transfer">تحويل بنكي</option>
                  <option value="credit_card">بطاقة ائتمان</option>
                  <option value="mada">مدى</option>
                  <option value="stc_pay">STC Pay</option>
                </select>
              </div>
            </div>
          </div>
        )

      case 'integrations':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">إعدادات التكامل</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center">
                <label htmlFor="smsEnabled" className="text-sm font-medium text-gray-700 ml-3">
                  تفعيل خدمة الرسائل النصية
                </label>
                <input
                  type="checkbox"
                  id="smsEnabled"
                  checked={settings.integrationSettings.smsEnabled}
                  onChange={(e) => setSettings({
                    ...settings,
                    integrationSettings: {
                      ...settings.integrationSettings,
                      smsEnabled: e.target.checked
                    }
                  })}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label htmlFor="smsProvider" className="block text-sm font-medium text-gray-700">
                  مزود خدمة الرسائل
                </label>
                <select
                  id="smsProvider"
                  value={settings.integrationSettings.smsProvider}
                  onChange={(e) => setSettings({
                    ...settings,
                    integrationSettings: {
                      ...settings.integrationSettings,
                      smsProvider: e.target.value
                    }
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="twilio">Twilio</option>
                  <option value="messagebird">MessageBird</option>
                  <option value="unifonic">Unifonic</option>
                </select>
              </div>
            </div>
          </div>
        )

      default:
        return null
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

        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('app')}
                className={`${
                  activeTab === 'app'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
              >
                النظام
              </button>
              <button
                onClick={() => setActiveTab('mail')}
                className={`${
                  activeTab === 'mail'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
              >
                البريد
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`${
                  activeTab === 'security'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
              >
                الأمان
              </button>
              <button
                onClick={() => setActiveTab('business')}
                className={`${
                  activeTab === 'business'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
              >
                الأعمال
              </button>
              <button
                onClick={() => setActiveTab('integrations')}
                className={`${
                  activeTab === 'integrations'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
              >
                التكامل
              </button>
            </nav>
          </div>

          <div className="p-6">
            {renderTabContent()}
          </div>
        </div>

        {/* إجراءات متقدمة */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">إجراءات متقدمة</h2>
          <div className="space-y-4">
            <button
              type="button"
              className="inline-flex items-center px-4 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              تفعيل وضع الصيانة
            </button>

            <button
              type="button"
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              تنظيف ذاكرة التخزين المؤقت
            </button>

            <button
              type="button"
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              إنشاء نسخة احتياطية
            </button>
          </div>
        </div>
      </div>
    </Layout>
  )
}
