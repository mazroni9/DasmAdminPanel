import Layout from '../components/Layout'
import { useState } from 'react'

const ShowroomDashboard = () => {
  const [activeSection, setActiveSection] = useState('overview')

  const sections = [
    { id: 'overview', title: 'نظرة عامة', icon: '🏗️' },
    { id: 'stores', title: 'إدارة المتاجر', icon: '🏪' },
    { id: 'payment', title: 'نظام الدفع', icon: '💳' },
    { id: 'shipping', title: 'نظام الشحن', icon: '🚚' },
    { id: 'control', title: 'الكنترول روم', icon: '🎛️' },
    { id: 'timeline', title: 'خارطة التنفيذ', icon: '📅' }
  ]

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">
              نظام إدارة المتاجر الإلكترونية
            </h1>
            <p className="text-xl text-gray-600">
              البنية الأساسية والتحكم المركزي للمتاجر الستة
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                  activeSection === section.id
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-blue-50 border border-gray-200'
                }`}
              >
                <span className="mr-2">{section.icon}</span>
                {section.title}
              </button>
            ))}
          </div>

          {/* Content Sections */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            {activeSection === 'overview' && <OverviewSection />}
            {activeSection === 'stores' && <StoresSection />}
            {activeSection === 'payment' && <PaymentSection />}
            {activeSection === 'shipping' && <ShippingSection />}
            {activeSection === 'control' && <ControlSection />}
            {activeSection === 'timeline' && <TimelineSection />}
          </div>
        </div>
      </div>
    </Layout>
  )
}

const OverviewSection = () => (
  <div className="space-y-8">
    <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">البنية الأساسية</h2>
    
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl">
        <div className="text-3xl mb-3">🖥️</div>
        <h3 className="font-bold text-lg mb-2">استضافة VPS/Cloud</h3>
        <p className="text-blue-100">بنية تحتية قوية وقابلة للتوسع</p>
      </div>
      
      <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl">
        <div className="text-3xl mb-3">🌐</div>
        <h3 className="font-bold text-lg mb-2">WordPress Multisite + RTL</h3>
        <p className="text-green-100">دعم كامل للغة العربية</p>
      </div>
      
      <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl">
        <div className="text-3xl mb-3">🛒</div>
        <h3 className="font-bold text-lg mb-2">WooCommerce + HPOS</h3>
        <p className="text-purple-100">نظام تجارة إلكترونية متقدم</p>
      </div>
      
      <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-xl">
        <div className="text-3xl mb-3">🔧</div>
        <h3 className="font-bold text-lg mb-2">إضافات أساسية</h3>
        <p className="text-orange-100">WCFM، ATUM، Domain Mapping</p>
      </div>
    </div>
  </div>
)

const StoresSection = () => (
  <div className="space-y-8">
    <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">إدارة المتاجر الستة</h2>
    
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="space-y-6">
        <div className="bg-blue-50 p-6 rounded-xl border-l-4 border-blue-500">
          <h3 className="font-bold text-lg text-blue-800 mb-3">🏪 إنشاء المواقع الفرعية</h3>
          <ul className="space-y-2 text-blue-700">
            <li>• 5 مواقع فرعية داخل Multisite</li>
            <li>• ربط كل موقع بدومين مستقل</li>
            <li>• إدارة مركزية من لوحة Super Admin</li>
          </ul>
        </div>
        
        <div className="bg-green-50 p-6 rounded-xl border-l-4 border-green-500">
          <h3 className="font-bold text-lg text-green-800 mb-3">🔄 عرض المنتجات المتعدد</h3>
          <p className="text-green-700">إمكانية عرض المنتج في أكثر من متجر مع إدارة مركزية للمخزون</p>
        </div>
      </div>
      
      <div className="space-y-6">
        <div className="bg-purple-50 p-6 rounded-xl border-l-4 border-purple-500">
          <h3 className="font-bold text-lg text-purple-800 mb-3">🏢 المتاجر الأرضية</h3>
          <ul className="space-y-2 text-purple-700">
            <li>• حساب Vendor لكل متجر أرضي</li>
            <li>• إدارة المنتجات والمخزون</li>
            <li>• استقبال الطلبات وتقارير الأداء</li>
            <li>• ربط المخزون الأرضي يدويًا أو عبر POS API</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
)

const PaymentSection = () => (
  <div className="space-y-8">
    <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">نظام الدفع: ماي فاتورة</h2>
    
    <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-8 rounded-xl">
      <div className="text-center mb-6">
        <div className="text-4xl mb-3">💳</div>
        <h3 className="text-2xl font-bold">ربط WooCommerce مع ماي فاتورة</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/20 p-4 rounded-lg">
          <h4 className="font-bold mb-2">💰 توزيع المدفوعات</h4>
          <ul className="text-sm space-y-1">
            <li>• المنتج → Vendor</li>
            <li>• الشحن → شركة الشحن</li>
            <li>• الفرق → المنصة</li>
          </ul>
        </div>
        
        <div className="bg-white/20 p-4 rounded-lg">
          <h4 className="font-bold mb-2">🔀 Split Payments</h4>
          <p className="text-sm">توزيع تلقائي للمبالغ حسب النسب المتفق عليها</p>
        </div>
        
        <div className="bg-white/20 p-4 rounded-lg">
          <h4 className="font-bold mb-2">📊 التقارير المالية</h4>
          <p className="text-sm">تقارير مفصلة لكل طرف في العملية</p>
        </div>
      </div>
    </div>
  </div>
)

const ShippingSection = () => (
  <div className="space-y-8">
    <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">نظام الشحن</h2>
    
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="space-y-6">
        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl">
          <div className="text-3xl mb-3">🚚</div>
          <h3 className="font-bold text-lg mb-2">Vendor لشركة الشحن</h3>
          <p>إدارة مركزية لشركات الشحن كبائعين في النظام</p>
        </div>
        
        <div className="bg-blue-50 p-6 rounded-xl border-l-4 border-blue-500">
          <h3 className="font-bold text-lg text-blue-800 mb-3">🗺️ قواعد الشحن</h3>
          <ul className="space-y-2 text-blue-700">
            <li>• حسب المدينة</li>
            <li>• حسب الحي</li>
            <li>• أسعار مختلفة حسب المنطقة</li>
          </ul>
        </div>
      </div>
      
      <div className="bg-gradient-to-br from-orange-500 to-red-500 text-white p-6 rounded-xl">
        <h3 className="font-bold text-lg mb-4">🔗 ربط API لشركات الشحن</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/20 p-3 rounded-lg text-center">
            <div className="text-2xl mb-2">📦</div>
            <p className="text-sm">Aramex</p>
          </div>
          <div className="bg-white/20 p-3 rounded-lg text-center">
            <div className="text-2xl mb-2">🚛</div>
            <p className="text-sm">SPL</p>
          </div>
          <div className="bg-white/20 p-3 rounded-lg text-center">
            <div className="text-2xl mb-2">📮</div>
            <p className="text-sm">SMSA</p>
          </div>
          <div className="bg-white/20 p-3 rounded-lg text-center">
            <div className="text-2xl mb-2">🌍</div>
            <p className="text-sm">Easyship</p>
          </div>
        </div>
      </div>
    </div>
  </div>
)

const ControlSection = () => (
  <div className="space-y-8">
    <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">الكنترول روم</h2>
    
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl">
        <div className="text-3xl mb-3">📋</div>
        <h3 className="font-bold text-lg mb-2">عرض الطلبات</h3>
        <p className="text-purple-100">حسب المصدر والمتجر</p>
      </div>
      
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl">
        <div className="text-3xl mb-3">📊</div>
        <h3 className="font-bold text-lg mb-2">حالة الطلب</h3>
        <p className="text-blue-100">تجهيز/شحن/تسليم</p>
      </div>
      
      <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl">
        <div className="text-3xl mb-3">💰</div>
        <h3 className="font-bold text-lg mb-2">توزيع المبالغ</h3>
        <p className="text-green-100">لكل طرف في العملية</p>
      </div>
      
      <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-xl">
        <div className="text-3xl mb-3">📈</div>
        <h3 className="font-bold text-lg mb-2">مؤشرات الأداء</h3>
        <p className="text-orange-100">حسب المدينة والمتجر</p>
      </div>
      
      <div className="bg-gradient-to-br from-red-500 to-red-600 text-white p-6 rounded-xl">
        <div className="text-3xl mb-3">🏦</div>
        <h3 className="font-bold text-lg mb-2">تسويات مالية</h3>
        <p className="text-red-100">يومية مع تقارير مفصلة</p>
      </div>
      
      <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white p-6 rounded-xl">
        <div className="text-3xl mb-3">🎯</div>
        <h3 className="font-bold text-lg mb-2">تحديد أقرب متجر</h3>
        <p className="text-indigo-100">تلقائيًا حسب الموقع</p>
      </div>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
      <div className="bg-gray-50 p-6 rounded-xl border-l-4 border-gray-500">
        <h3 className="font-bold text-lg text-gray-800 mb-3">🔗 Webhooks لربط POS</h3>
        <p className="text-gray-700">ربط مباشر مع أنظمة نقاط البيع</p>
      </div>
      
      <div className="bg-gray-50 p-6 rounded-xl border-l-4 border-gray-500">
        <h3 className="font-bold text-lg text-gray-800 mb-3">📄 تصدير CSV</h3>
        <p className="text-gray-700">للتحويل البنكي والتسويات</p>
      </div>
    </div>
  </div>
)

const TimelineSection = () => (
  <div className="space-y-8">
    <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">خارطة التنفيذ</h2>
    
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-xl">
        <div className="flex items-center mb-4">
          <div className="text-3xl mr-4">📅</div>
          <h3 className="text-2xl font-bold">الأسبوع الأول</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white/20 p-3 rounded-lg text-center">
            <div className="text-2xl mb-2">⚙️</div>
            <p className="text-sm">تنصيب وإعداد النظام</p>
          </div>
          <div className="bg-white/20 p-3 rounded-lg text-center">
            <div className="text-2xl mb-2">🏪</div>
            <p className="text-sm">2 متجر أرضي</p>
          </div>
          <div className="bg-white/20 p-3 rounded-lg text-center">
            <div className="text-2xl mb-2">🏭</div>
            <p className="text-sm">مستودع مركزي</p>
          </div>
          <div className="bg-white/20 p-3 rounded-lg text-center">
            <div className="text-2xl mb-2">🚚</div>
            <p className="text-sm">شركة شحن</p>
          </div>
        </div>
      </div>
      
      <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-xl">
        <div className="flex items-center mb-4">
          <div className="text-3xl mr-4">🚀</div>
          <h3 className="text-2xl font-bold">الأسبوع الثاني</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white/20 p-3 rounded-lg text-center">
            <div className="text-2xl mb-2">🎛️</div>
            <p className="text-sm">بناء الكنترول روم</p>
          </div>
          <div className="bg-white/20 p-3 rounded-lg text-center">
            <div className="text-2xl mb-2">🧪</div>
            <p className="text-sm">اختبار الطلبات</p>
          </div>
          <div className="bg-white/20 p-3 rounded-lg text-center">
            <div className="text-2xl mb-2">💳</div>
            <p className="text-sm">تفعيل الدفع</p>
          </div>
          <div className="bg-white/20 p-3 rounded-lg text-center">
            <div className="text-2xl mb-2">🏙️</div>
            <p className="text-sm">تجربة مدينة واحدة</p>
          </div>
        </div>
      </div>
    </div>
  </div>
)

export default ShowroomDashboard 