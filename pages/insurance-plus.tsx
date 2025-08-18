import Layout from '../components/Layout'
import { useState } from 'react'
import { 
  UserIcon,
  DocumentTextIcon,
  CreditCardIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  EyeIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline'

interface InsuranceQuote {
  id: string
  agentCode: string
  chassisNumber: string
  insuranceType: string
  duration: string
  price: number
  status: 'pending' | 'approved' | 'rejected' | 'completed'
  createdAt: string
  customerName?: string
  customerPhone?: string
}

export default function InsurancePlus() {
  const [agentCode, setAgentCode] = useState('')
  const [chassisNumber, setChassisNumber] = useState('')
  const [insuranceType, setInsuranceType] = useState('third_party')
  const [duration, setDuration] = useState('1_year')
  const [activeTab, setActiveTab] = useState('submit-quote')
  const [quotes, setQuotes] = useState<InsuranceQuote[]>([
    {
      id: 'QUOTE001',
      agentCode: 'INS1234',
      chassisNumber: 'ABC123456789',
      insuranceType: 'third_party',
      duration: '1_year',
      price: 850,
      status: 'completed',
      createdAt: '2025-01-20T10:30:00Z',
      customerName: 'أحمد محمد',
      customerPhone: '0501234567'
    },
    {
      id: 'QUOTE002',
      agentCode: 'INS1234',
      chassisNumber: 'XYZ987654321',
      insuranceType: 'comprehensive',
      duration: '2_years',
      price: 2200,
      status: 'pending',
      createdAt: '2025-01-21T14:20:00Z',
      customerName: 'سارة أحمد',
      customerPhone: '0509876543'
    }
  ])

  const handleSubmitQuote = () => {
    if (!agentCode || !chassisNumber) {
      alert('يرجى ملء جميع الحقول المطلوبة')
      return
    }

    const newQuote: InsuranceQuote = {
      id: `QUOTE${Date.now()}`,
      agentCode,
      chassisNumber,
      insuranceType,
      duration,
      price: insuranceType === 'comprehensive' ? 2200 : 850,
      status: 'pending',
      createdAt: new Date().toISOString()
    }

    setQuotes([newQuote, ...quotes])
    setAgentCode('')
    setChassisNumber('')
    alert('تم إرسال عرض السعر بنجاح')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'approved':
        return 'bg-blue-100 text-blue-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'مكتمل'
      case 'approved':
        return 'موافق عليه'
      case 'pending':
        return 'بانتظار المراجعة'
      case 'rejected':
        return 'مرفوض'
      default:
        return 'غير محدد'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Layout title="تأمين بلس - لوحة مندوبي التأمين">
      <div className="min-h-screen bg-gray-50/50">
        <div className="p-4 sm:p-6 lg:p-8">
          {/* رأس الصفحة */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">تأمين بلس</h1>
              <p className="text-gray-600">لوحة مندوبي التأمين</p>
            </div>
          </div>

          {/* التبويبات */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 space-x-reverse px-6">
                <button
                  onClick={() => setActiveTab('submit-quote')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'submit-quote'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  تقديم تأمين لعميل
                </button>
                <button
                  onClick={() => setActiveTab('my-orders')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'my-orders'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  مبيعاتي
                </button>
              </nav>
            </div>

            <div className="p-6">
              {activeTab === 'submit-quote' && (
                <div className="max-w-2xl mx-auto">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        كود المندوب
                      </label>
                      <input
                        type="text"
                        value={agentCode}
                        onChange={(e) => setAgentCode(e.target.value)}
                        placeholder="مثال: INS1234"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        رقم الهيكل / اللوحة
                      </label>
                      <input
                        type="text"
                        value={chassisNumber}
                        onChange={(e) => setChassisNumber(e.target.value)}
                        placeholder="اكتب رقم الهيكل أو اللوحة هنا"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        نوع التأمين
                      </label>
                      <select
                        value={insuranceType}
                        onChange={(e) => setInsuranceType(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        aria-label="نوع التأمين"
                      >
                        <option value="third_party">تأمين طرف ثالث</option>
                        <option value="comprehensive">تأمين شامل</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        مدة التأمين
                      </label>
                      <select
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        aria-label="مدة التأمين"
                      >
                        <option value="1_year">سنة واحدة</option>
                        <option value="2_years">سنتان</option>
                      </select>
                    </div>

                    <button
                      onClick={handleSubmitQuote}
                      className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center"
                    >
                      <PlusIcon className="w-5 h-5 ml-2" />
                      إصدار عرض سعر
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'my-orders' && (
                <div>
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">سجل مبيعاتي</h2>
                    
                    {/* إحصائيات سريعة */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <div className="flex items-center">
                          <DocumentTextIcon className="w-8 h-8 text-blue-600" />
                          <div className="mr-3">
                            <p className="text-sm text-blue-600">إجمالي العروض</p>
                            <p className="text-2xl font-bold text-gray-900">{quotes.length}</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-green-50 rounded-lg p-4">
                        <div className="flex items-center">
                          <CheckCircleIcon className="w-8 h-8 text-green-600" />
                          <div className="mr-3">
                            <p className="text-sm text-green-600">مكتملة</p>
                            <p className="text-2xl font-bold text-gray-900">
                              {quotes.filter(q => q.status === 'completed').length}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-yellow-50 rounded-lg p-4">
                        <div className="flex items-center">
                          <ClockIcon className="w-8 h-8 text-yellow-600" />
                          <div className="mr-3">
                            <p className="text-sm text-yellow-600">بانتظار المراجعة</p>
                            <p className="text-2xl font-bold text-gray-900">
                              {quotes.filter(q => q.status === 'pending').length}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-purple-50 rounded-lg p-4">
                        <div className="flex items-center">
                          <CreditCardIcon className="w-8 h-8 text-purple-600" />
                          <div className="mr-3">
                            <p className="text-sm text-purple-600">إجمالي المبيعات</p>
                            <p className="text-2xl font-bold text-gray-900">
                              {formatCurrency(quotes.reduce((sum, q) => sum + q.price, 0))}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* جدول العروض */}
                    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-right">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                رقم العرض
                              </th>
                              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                رقم الهيكل
                              </th>
                              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                نوع التأمين
                              </th>
                              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                السعر
                              </th>
                              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                الحالة
                              </th>
                              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                التاريخ
                              </th>
                              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                الإجراءات
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {quotes.map((quote) => (
                              <tr key={quote.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {quote.id}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {quote.chassisNumber}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {quote.insuranceType === 'comprehensive' ? 'تأمين شامل' : 'تأمين طرف ثالث'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                  {formatCurrency(quote.price)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(quote.status)}`}>
                                    {getStatusLabel(quote.status)}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {formatDate(quote.createdAt)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                  <div className="flex space-x-2 space-x-reverse">
                                    <button
                                      onClick={() => alert(`تفاصيل العرض: ${quote.id}`)}
                                      className="text-blue-600 hover:text-blue-900"
                                      title="عرض التفاصيل"
                                    >
                                      <EyeIcon className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => alert(`تحميل الوثيقة: ${quote.id}`)}
                                      className="text-green-600 hover:text-green-900"
                                      title="تحميل الوثيقة"
                                    >
                                      <ArrowDownTrayIcon className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
} 