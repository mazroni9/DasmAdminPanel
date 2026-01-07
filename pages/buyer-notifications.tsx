"use client";

import { useState, useEffect } from "react";
import Layout from '../components/Layout';
import { 
  BellIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChatBubbleLeftRightIcon,
  EyeIcon,
  CurrencyDollarIcon,
  ClockIcon,
  UserIcon
} from '@heroicons/react/24/outline';

interface Offer {
  id: string;
  seller: string;
  productName: string;
  description: string;
  price: number;
  category: string;
  condition: string;
  date: string;
  status: 'pending' | 'accepted' | 'rejected' | 'negotiating';
  matchReason: string;
}

export default function BuyerNotificationsPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected' | 'negotiating'>('all');

  useEffect(() => {
    // محاكاة جلب العروض من الخادم
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      const response = await fetch('/api/buyer-offers');
      if (response.ok) {
        const data = await response.json();
        setOffers(data.offers);
      } else {
        // بيانات تجريبية في حالة فشل الاتصال
        setOffers([
          {
            id: "1",
            seller: "معرض السيارات الحديث",
            productName: "تويوتا كامري 2022",
            description: "سيارة ممتازة، فل كامل، مكيف، مسجل، حالة ممتازة",
            price: 125000,
            category: "سيارات",
            condition: "مستعمل - ممتاز",
            date: "2024-01-15T10:30:00",
            status: 'pending',
            matchReason: "زارت نفس النوع سابقًا"
          },
          {
            id: "2",
            seller: "محل الساعات الفاخرة",
            productName: "ساعة رولكس سوبمارينر",
            description: "ساعة أصلية، حالة ممتازة، مع الضمان",
            price: 45000,
            category: "ساعات",
            condition: "مستعمل - ممتاز",
            date: "2024-01-14T15:20:00",
            status: 'accepted',
            matchReason: "أضافتها للمفضلة سابقًا"
          },
          {
            id: "3",
            seller: "مزرعة التمور الطازجة",
            productName: "تمر سكري 5 كيلو",
            description: "تمر طازج، حلو المذاق، خالي من المواد الحافظة",
            price: 180,
            category: "تمر",
            condition: "جديد",
            date: "2024-01-13T09:15:00",
            status: 'negotiating',
            matchReason: "طلبته مسبقًا"
          },
          {
            id: "4",
            seller: "معرض الإلكترونيات",
            productName: "آيفون 15 برو ماكس",
            description: "هاتف جديد، 256 جيجا، اللون الطبيعي",
            price: 8500,
            category: "إلكترونيات",
            condition: "جديد",
            date: "2024-01-12T14:45:00",
            status: 'rejected',
            matchReason: "زارت نفس النوع سابقًا"
          }
        ]);
      }
    } catch (error) {
      console.error('خطأ في جلب العروض:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOfferAction = async (offerId: string, action: 'accept' | 'reject' | 'negotiate') => {
    try {
      const response = await fetch(`/api/buyer-offers/${offerId}/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setOffers(prevOffers => 
          prevOffers.map(offer => 
            offer.id === offerId 
              ? { ...offer, status: action === 'accept' ? 'accepted' : action === 'reject' ? 'rejected' : 'negotiating' }
              : offer
          )
        );
      }
    } catch (error) {
      console.error('خطأ في تحديث حالة العرض:', error);
    }
  };

  const filteredOffers = offers.filter(offer => {
    if (filter === 'all') return true;
    return offer.status === filter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'negotiating': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'في الانتظار';
      case 'accepted': return 'مقبول';
      case 'rejected': return 'مرفوض';
      case 'negotiating': return 'قيد التفاوض';
      default: return 'غير محدد';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <ClockIcon className="w-4 h-4" />;
      case 'accepted': return <CheckCircleIcon className="w-4 h-4" />;
      case 'rejected': return <XCircleIcon className="w-4 h-4" />;
      case 'negotiating': return <ChatBubbleLeftRightIcon className="w-4 h-4" />;
      default: return <EyeIcon className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <Layout title="الإشعارات">
        <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">جاري تحميل العروض...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="الإشعارات">
      <div className="min-h-screen bg-gray-50/50">
        <div className="p-4 sm:p-6 lg:p-8">
          {/* رأس الصفحة */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-center">
              <div className="text-center">
                <div className="flex items-center justify-center mb-4">
                  <BellIcon className="w-8 h-8 text-blue-600 ml-2" />
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-blue-600 mb-2">عروض مخصصة لك</h2>
                    <h1 className="text-3xl font-bold text-gray-800">Personalized Offers</h1>
                  </div>
                </div>
                <p className="text-gray-600">
                  عروض مخصصة بناءً على اهتماماتك السابقة
                </p>
              </div>
            </div>
          </div>

          {/* فلتر العروض */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'all', label: 'جميع العروض' },
                { key: 'pending', label: 'في الانتظار' },
                { key: 'accepted', label: 'مقبول' },
                { key: 'rejected', label: 'مرفوض' },
                { key: 'negotiating', label: 'قيد التفاوض' }
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key as any)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === key
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* قائمة العروض */}
          <div className="space-y-4">
            {filteredOffers.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <BellIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">لا توجد عروض</h3>
                <p className="text-gray-500">لا توجد عروض مخصصة لك في الوقت الحالي</p>
              </div>
            ) : (
              filteredOffers.map((offer) => (
                <div key={offer.id} className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <UserIcon className="w-5 h-5 text-gray-400" />
                        <span className="text-sm text-gray-600">{offer.seller}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(offer.status)}`}>
                          {getStatusIcon(offer.status)}
                          {getStatusText(offer.status)}
                        </span>
                      </div>
                      
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{offer.productName}</h3>
                      <p className="text-gray-600 mb-3">{offer.description}</p>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                        <span className="flex items-center gap-1">
                          <CurrencyDollarIcon className="w-4 h-4" />
                          {offer.price.toLocaleString()} ريال
                        </span>
                        <span>•</span>
                        <span>{offer.category}</span>
                        <span>•</span>
                        <span>{offer.condition}</span>
                      </div>
                      
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <p className="text-sm text-blue-700">
                          <strong>سبب التطابق:</strong> {offer.matchReason}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {offer.status === 'pending' && (
                    <div className="flex gap-2 pt-4 border-t border-gray-200">
                      <button
                        onClick={() => handleOfferAction(offer.id, 'accept')}
                        className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <CheckCircleIcon className="w-4 h-4" />
                        قبول العرض
                      </button>
                      <button
                        onClick={() => handleOfferAction(offer.id, 'negotiate')}
                        className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <ChatBubbleLeftRightIcon className="w-4 h-4" />
                        طلب تفاوض
                      </button>
                      <button
                        onClick={() => handleOfferAction(offer.id, 'reject')}
                        className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <XCircleIcon className="w-4 h-4" />
                        رفض العرض
                      </button>
                    </div>
                  )}
                  
                  {offer.status === 'negotiating' && (
                    <div className="pt-4 border-t border-gray-200">
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <p className="text-sm text-blue-700">
                          تم إرسال طلب التفاوض للبائع. سيتم التواصل معك قريبًا.
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {offer.status === 'accepted' && (
                    <div className="pt-4 border-t border-gray-200">
                      <div className="bg-green-50 p-3 rounded-lg">
                        <p className="text-sm text-green-700">
                          تم قبول العرض بنجاح! سيتم التواصل معك لإتمام الصفقة.
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {offer.status === 'rejected' && (
                    <div className="pt-4 border-t border-gray-200">
                      <div className="bg-red-50 p-3 rounded-lg">
                        <p className="text-sm text-red-700">
                          تم رفض هذا العرض.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
