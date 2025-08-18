import { NextApiRequest, NextApiResponse } from 'next';

interface Product {
  name: string;
  desc: string;
  price: string;
  category: string;
  condition: string;
}

interface Buyer {
  id: string;
  name: string;
  email: string;
  interests: string[];
  favorites: string[];
  previousRequests: string[];
  matchReason: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const product: Product = req.body;

    // التحقق من البيانات المطلوبة
    if (!product.name || !product.desc || !product.price || !product.category || !product.condition) {
      return res.status(400).json({ 
        error: 'جميع الحقول مطلوبة',
        missing: {
          name: !product.name,
          desc: !product.desc,
          price: !product.price,
          category: !product.category,
          condition: !product.condition
        }
      });
    }

    // محاكاة قاعدة البيانات للمشترين المؤهلين
    const mockBuyers: Buyer[] = [
      {
        id: "buyer_001",
        name: "أحمد محمد",
        email: "ahmed@example.com",
        interests: ["سيارات", "إلكترونيات"],
        favorites: ["تويوتا كامري", "آيفون"],
        previousRequests: ["تويوتا كامري 2022"],
        matchReason: "زارت نفس النوع سابقًا"
      },
      {
        id: "buyer_002",
        name: "فاطمة علي",
        email: "fatima@example.com",
        interests: ["ساعات", "ملابس"],
        favorites: ["رولكس", "ساعة فاخرة"],
        previousRequests: ["ساعة رولكس"],
        matchReason: "أضافتها للمفضلة سابقًا"
      },
      {
        id: "buyer_003",
        name: "محمد عبدالله",
        email: "mohammed@example.com",
        interests: ["تمر", "عقارات"],
        favorites: ["تمر سكري", "تمر صقعي"],
        previousRequests: ["تمر سكري 5 كيلو"],
        matchReason: "طلبته مسبقًا"
      },
      {
        id: "buyer_004",
        name: "سارة أحمد",
        email: "sara@example.com",
        interests: ["إلكترونيات", "أثاث"],
        favorites: ["آيفون", "سامسونج"],
        previousRequests: ["آيفون 15"],
        matchReason: "زارت نفس النوع سابقًا"
      }
    ];

    // خوارزمية مطابقة المشترين المؤهلين
    const qualifiedBuyers = mockBuyers.filter(buyer => {
      // مطابقة الفئة
      const categoryMatch = buyer.interests.includes(product.category);
      
      // مطابقة المنتج في المفضلة
      const favoriteMatch = buyer.favorites.some(fav => 
        product.name.toLowerCase().includes(fav.toLowerCase())
      );
      
      // مطابقة الطلبات السابقة
      const requestMatch = buyer.previousRequests.some(req => 
        product.name.toLowerCase().includes(req.toLowerCase())
      );

      return categoryMatch || favoriteMatch || requestMatch;
    });

    // إنشاء عروض للمشترين المؤهلين
    const offers = qualifiedBuyers.map(buyer => ({
      id: `offer_${Date.now()}_${buyer.id}`,
      buyerId: buyer.id,
      buyerName: buyer.name,
      buyerEmail: buyer.email,
      product: product,
      status: 'pending',
      createdAt: new Date().toISOString(),
      matchReason: buyer.matchReason
    }));

    // محاكاة إرسال الإشعارات
    const notifications = qualifiedBuyers.map(buyer => ({
      type: 'personalized_offer',
      buyerId: buyer.id,
      message: `عندك عرض مخصص: ${product.name}`,
      product: product,
      matchReason: buyer.matchReason
    }));

    // محاكاة حفظ البيانات في قاعدة البيانات
    console.log('تم إرسال العرض للمشترين المؤهلين:', {
      product,
      qualifiedBuyersCount: qualifiedBuyers.length,
      offers,
      notifications
    });

    // إرجاع النتيجة
    return res.status(200).json({
      success: true,
      message: 'تم إرسال العرض بنجاح',
      data: {
        product,
        qualifiedBuyersCount: qualifiedBuyers.length,
        buyers: qualifiedBuyers.map(b => ({ id: b.id, name: b.name, matchReason: b.matchReason })),
        offersCount: offers.length
      }
    });

  } catch (error) {
    console.error('خطأ في معالجة طلب البائع:', error);
    return res.status(500).json({ 
      error: 'خطأ في الخادم',
      details: error instanceof Error ? error.message : 'خطأ غير معروف'
    });
  }
}
