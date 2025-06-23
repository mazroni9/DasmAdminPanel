import { useState } from 'react';
import Layout from '../components/Layout';
import { FunnelIcon } from '@heroicons/react/24/outline';

interface Auction {
  id: string;
  car: string;
  currentPrice: number;
  status: 'جاري' | 'منتهي' | 'قادم';
  startTime: string;
  endTime: string;
}

export default function Auctions() {
  const [filterStatus, setFilterStatus] = useState<string>('جميع المزادات');
  const [auctions, setAuctions] = useState<Auction[]>([]);

  const statusOptions = ['جميع المزادات', 'جاري', 'منتهي', 'قادم'];

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50/50 p-4 sm:p-6 lg:p-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          {/* رأس الصفحة */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold text-gray-800">إدارة المزادات</h1>
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              onClick={() => {/* سيتم إضافة منطق إنشاء مزاد جديد */}}
            >
              إنشاء مزاد جديد
            </button>
          </div>

          {/* شريط الفلترة */}
          <div className="flex justify-between items-center mb-6 bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center space-x-4">
              <FunnelIcon className="h-5 w-5 text-gray-500" />
              <span className="text-gray-600 ml-2">فلترة حسب الحالة:</span>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-white border border-gray-300 rounded-md px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>

          {/* جدول المزادات */}
          {auctions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      السيارة
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      السعر الحالي
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الحالة
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      وقت البداية
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      وقت النهاية
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الإجراءات
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {auctions.map((auction) => (
                    <tr key={auction.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {auction.car}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {auction.currentPrice} ريال
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          auction.status === 'جاري' ? 'bg-green-100 text-green-800' :
                          auction.status === 'منتهي' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {auction.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(auction.startTime).toLocaleString('ar-SA')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(auction.endTime).toLocaleString('ar-SA')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <button
                          onClick={() => {/* سيتم إضافة منطق تعديل المزاد */}}
                          className="text-blue-600 hover:text-blue-900 ml-4"
                        >
                          تعديل
                        </button>
                        <button
                          onClick={() => {/* سيتم إضافة منطق حذف المزاد */}}
                          className="text-red-600 hover:text-red-900"
                        >
                          حذف
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  vectorEffect="non-scaling-stroke"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">لا توجد مزادات متاحة</h3>
              <p className="mt-1 text-sm text-gray-500">ابدأ بإنشاء مزاد جديد.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
} 