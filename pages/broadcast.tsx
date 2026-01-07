"use client";

import { useState } from "react";
import Layout from '../components/Layout';
import { 
  MegaphoneIcon,
  TruckIcon,
  CurrencyDollarIcon,
  EyeIcon,
  PaperAirplaneIcon
} from '@heroicons/react/24/outline';

export default function BroadcastPage() {
  const [form, setForm] = useState({ car: "", model: "", price: "" });
  const [offers, setOffers] = useState([
    { id: 1, price: 125000, seller: "معرض السيارات الحديث", condition: "حالة جيدة" },
    { id: 2, price: 131000, seller: "موبيل 201", condition: "مكيف 60 كوم" },
    { id: 3, price: 130000, seller: "موديل 20200", condition: "حالة ممتازة" },
    { id: 4, price: 138000, seller: "موديل 2022", condition: "منتقشة 40 كوم" },
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.car && form.model && form.price) {
      alert('تم إرسال طلب الشراء بنجاح!');
      setForm({ car: "", model: "", price: "" });
    } else {
      alert('يرجى ملء جميع الحقول المطلوبة');
    }
  };

  return (
    <Layout title="البث المباشر">
      <div className="min-h-screen bg-gray-50/50">
        <div className="p-4 sm:p-6 lg:p-8">
          {/* رأس الصفحة */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-center">
              <div className="text-center">
                                 <div className="flex items-center justify-center mb-4">
                   <MegaphoneIcon className="w-8 h-8 text-blue-600 ml-2" />
                   <div className="text-center">
                     <h2 className="text-2xl font-bold text-blue-600 mb-2">نظام رش البائعين حسب طلبات المشترين</h2>
                     <h1 className="text-3xl font-bold text-gray-800">Buyer-to-Seller Broadcast Matching System</h1>
                   </div>
                 </div>
                                 <p className="text-gray-600">
                   Send purchase requests and get the best offers from sellers
                 </p>
              </div>
            </div>
          </div>

          {/* نموذج طلب الشراء */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center mb-4">
              <TruckIcon className="w-6 h-6 text-blue-600 ml-2" />
                             <h2 className="text-xl font-semibold text-gray-900">طلب الشراء</h2>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                                     <label className="block text-sm font-medium text-gray-700 mb-2">نوع السيارة</label>
                  <input 
                    type="text"
                                         placeholder="مثال: تويوتا كامري"
                    value={form.car}
                    onChange={(e) => setForm({ ...form, car: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                         aria-label="نوع السيارة"
                  />
                </div>
                
                <div>
                                     <label className="block text-sm font-medium text-gray-700 mb-2">الموديلات</label>
                  <input 
                    type="text"
                                         placeholder="مثال: 2020-2022"
                    value={form.model}
                    onChange={(e) => setForm({ ...form, model: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                         aria-label="الموديلات"
                  />
                </div>
                
                <div>
                                     <label className="block text-sm font-medium text-gray-700 mb-2">السعر المستهدف</label>
                  <div className="relative">
                    <CurrencyDollarIcon className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                    <input 
                      type="number"
                                             placeholder="مثال: 120000"
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: e.target.value })}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                             aria-label="السعر المستهدف"
                    />
                  </div>
                </div>
              </div>
              
              <button 
                type="submit" 
                className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg text-sm font-medium flex items-center justify-center hover:bg-blue-700 transition-colors"
              >
                <PaperAirplaneIcon className="w-4 h-4 ml-2" />
                                 إرسال الطلب
              </button>
            </form>
          </div>

          {/* العروض */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <EyeIcon className="w-6 h-6 text-green-600 ml-2" />
                                 <h2 className="text-xl font-semibold text-gray-900">العروض المتاحة</h2>
              </div>
                             <span className="text-sm text-gray-500">{offers.length} عرض متاح</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {offers.map((offer) => (
                <div key={offer.id} className="bg-gray-50 rounded-lg p-6 border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <CurrencyDollarIcon className="w-5 h-5 text-green-600 ml-1" />
                      <span className="text-2xl font-bold text-gray-800">
                        {offer.price.toLocaleString()} ريال
                      </span>
                    </div>
                                                              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                        متاح
                      </span>
                  </div>
                  
                  <div className="space-y-2">
                                                              <div>
                        <p className="text-sm text-gray-600">البائع:</p>
                        <p className="font-medium text-gray-900">{offer.seller}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-600">الحالة:</p>
                        <p className="text-sm text-gray-700">{offer.condition}</p>
                      </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-200">
                                                              <button className="w-full text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center justify-center hover:underline">
                        <EyeIcon className="w-4 h-4 ml-1" />
                        عرض التفاصيل
                      </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
