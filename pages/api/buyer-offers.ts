import { NextApiRequest, NextApiResponse } from 'next';

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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // محاكاة جلب العروض من قاعدة البيانات
    const mockOffers: Offer[] = [
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
      },
      {
        id: "5",
        seller: "معرض الأثاث الفاخر",
        productName: "كنبة جلد طبيعي 3 مقاعد",
        description: "كنبة فاخرة، جلد طبيعي، لون بني، مريحة جداً",
        price: 3500,
        category: "أثاث",
        condition: "جديد",
        date: "2024-01-11T11:00:00",
        status: 'pending',
        matchReason: "زارت نفس النوع سابقًا"
      },
      {
        id: "6",
        seller: "محل الملابس الأنيقة",
        productName: "عباية كلاسيكية سوداء",
        description: "عباية أنيقة، قماش ممتاز، تصميم كلاسيكي",
        price: 450,
        category: "ملابس",
        condition: "جديد",
        date: "2024-01-10T16:30:00",
        status: 'pending',
        matchReason: "أضافتها للمفضلة سابقًا"
      }
    ];

    // ترتيب العروض حسب التاريخ (الأحدث أولاً)
    const sortedOffers = mockOffers.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return res.status(200).json({
      success: true,
      offers: sortedOffers,
      total: sortedOffers.length,
      pending: sortedOffers.filter(o => o.status === 'pending').length,
      accepted: sortedOffers.filter(o => o.status === 'accepted').length,
      rejected: sortedOffers.filter(o => o.status === 'rejected').length,
      negotiating: sortedOffers.filter(o => o.status === 'negotiating').length
    });

  } catch (error) {
    console.error('خطأ في جلب عروض المشتري:', error);
    return res.status(500).json({ 
      error: 'خطأ في الخادم',
      details: error instanceof Error ? error.message : 'خطأ غير معروف'
    });
  }
}
