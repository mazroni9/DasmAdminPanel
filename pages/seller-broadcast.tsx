"use client";

import { useState } from "react";
import Layout from '../components/Layout';
import { 
  MegaphoneIcon,
  TruckIcon,
  CurrencyDollarIcon,
  PaperAirplaneIcon,
  CheckCircleIcon,
  EyeIcon,
  UserGroupIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

interface Product {
  name: string;
  desc: string;
  price: string;
  category: string;
  condition: string;
}

interface BroadcastStats {
  totalViews: number;
  responses: number;
  accepted: number;
  pending: number;
}

export default function SellerBroadcastPage() {
  const [product, setProduct] = useState<Product>({ 
    name: "", 
    desc: "", 
    price: "", 
    category: "",
    condition: ""
  });
  const [sent, setSent] = useState(false);
  const [stats, setStats] = useState<BroadcastStats>({
    totalViews: 0,
    responses: 0,
    accepted: 0,
    pending: 0
  });

  const categories = [
    "سيارات",
    "تمر",
    "ساعات",
    "إلكترونيات",
    "عقارات",
    "أثاث",
    "ملابس",
    "أخرى"
  ];

  const conditions = [
    "جديد",
    "مستعمل - ممتاز",
    "مستعمل - جيد",
    "مستعمل - مقبول"
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!product.name || !product.desc || !product.price || !product.category || !product.condition) {
      alert('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    try {
      // محاكاة إرسال البيانات للخادم
      const response = await fetch('/api/seller-broadcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(product),
      });

      if (response.ok) {
        setSent(true);
        // محاكاة إحصائيات
        setTimeout(() => {
          setStats({
            totalViews: Math.floor(Math.random() * 50) + 10,
            responses: Math.floor(Math.random() * 15) + 3,
            accepted: Math.floor(Math.random() * 8) + 1,
            pending: Math.floor(Math.random() * 7) + 2
          });
        }, 2000);
      }
    } catch (error) {
      console.error('خطأ في إرسال العرض:', error);
      alert('حدث خطأ في إرسال العرض. يرجى المحاولة مرة أخرى.');
    }
  };

  const resetForm = () => {
    setProduct({ name: "", desc: "", price: "", category: "", condition: "" });
    setSent(false);
    setStats({ totalViews: 0, responses: 0, accepted: 0, pending: 0 });
  };

  return (
    <Layout title="عروض البائعين">
      <div className="min-h-screen bg-gray-50/50">
        <div className="p-4 sm:p-6 lg:p-8">
          {/* رأس الصفحة */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-center">
              <div className="text-center">
                <div className="flex items-center justify-center mb-4">
                  <MegaphoneIcon className="w-8 h-8 text-green-600 ml-2" />
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-green-600 mb-2">نظام رش المشترين حسب عروض البائعين</h2>
                    <h1 className="text-3xl font-bold text-gray-800">Seller-to-Buyer Broadcast Matching System</h1>
                  </div>
                </div>
                <p className="text-gray-600">
                  أدخل عرضك، وسيتم توجيهه تلقائيًا للمشترين المهتمين
                </p>
              </div>
            </div>
          </div>

          {!sent ? (
            /* نموذج إرسال العرض */
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="flex items-center mb-4">
                <TruckIcon className="w-6 h-6 text-green-600 ml-2" />
                <h2 className="text-xl font-semibold text-gray-900">إرسال عرض جديد</h2>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">اسم المنتج</label>
                    <input 
                      type="text"
                      placeholder="مثال: تويوتا كامري 2022"
                      value={product.name}
                      onChange={(e) => setProduct({ ...product, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      aria-label="اسم المنتج"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">الفئة</label>
                    <select 
                      value={product.category}
                      onChange={(e) => setProduct({ ...product, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      aria-label="فئة المنتج"
                    >
                      <option value="">اختر الفئة</option>
                      {categories.map((category) => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">السعر المقترح (ريال)</label>
                    <div className="relative">
                      <CurrencyDollarIcon className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                      <input 
                        type="number"
                        placeholder="مثال: 120000"
                        value={product.price}
                        onChange={(e) => setProduct({ ...product, price: e.target.value })}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        aria-label="السعر المقترح"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">الحالة</label>
                    <select 
                      value={product.condition}
                      onChange={(e) => setProduct({ ...product, condition: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      aria-label="حالة المنتج"
                    >
                      <option value="">اختر الحالة</option>
                      {conditions.map((condition) => (
                        <option key={condition} value={condition}>{condition}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">وصف المنتج</label>
                  <textarea 
                    rows={4}
                    placeholder="اكتب وصفًا تفصيليًا للمنتج..."
                    value={product.desc}
                    onChange={(e) => setProduct({ ...product, desc: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    aria-label="وصف المنتج"
                  />
                </div>
                
                <button 
                  type="submit" 
                  className="w-full bg-green-600 text-white px-4 py-3 rounded-lg text-sm font-medium flex items-center justify-center hover:bg-green-700 transition-colors"
                >
                  <PaperAirplaneIcon className="w-4 h-4 ml-2" />
                  إرسال العرض للمشترين
                </button>
              </form>
            </div>
          ) : (
            /* صفحة النجاح والإحصائيات */
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg shadow-sm text-center">
                <div className="flex items-center justify-center mb-4">
                  <CheckCircleIcon className="w-12 h-12 text-green-600 ml-2" />
                  <h2 className="text-2xl font-bold text-green-700">تم إرسال عرضك بنجاح!</h2>
                </div>
                <p className="text-gray-600 mb-4">
                  تم توجيه العرض تلقائيًا إلى المشترين الذين أبدوا اهتمامًا مشابهًا
                </p>
                <button 
                  onClick={resetForm}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  إرسال عرض جديد
                </button>
              </div>

              {/* إحصائيات العرض */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center mb-4">
                  <ChartBarIcon className="w-6 h-6 text-blue-600 ml-2" />
                  <h3 className="text-lg font-semibold text-gray-900">إحصائيات العرض</h3>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg text-center">
                    <EyeIcon className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-blue-600">{stats.totalViews}</p>
                    <p className="text-sm text-gray-600">مشاهدات</p>
                  </div>
                  
                  <div className="bg-yellow-50 p-4 rounded-lg text-center">
                    <UserGroupIcon className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-yellow-600">{stats.responses}</p>
                    <p className="text-sm text-gray-600">ردود</p>
                  </div>
                  
                  <div className="bg-green-50 p-4 rounded-lg text-center">
                    <CheckCircleIcon className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-green-600">{stats.accepted}</p>
                    <p className="text-sm text-gray-600">موافقات</p>
                  </div>
                  
                  <div className="bg-orange-50 p-4 rounded-lg text-center">
                    <MegaphoneIcon className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
                    <p className="text-sm text-gray-600">في الانتظار</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
