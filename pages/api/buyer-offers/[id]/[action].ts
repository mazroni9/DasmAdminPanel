import { NextApiRequest, NextApiResponse } from 'next';

interface OfferAction {
  offerId: string;
  action: 'accept' | 'reject' | 'negotiate';
  buyerId: string;
  timestamp: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id: offerId, action } = req.query;
    
    if (!offerId || !action) {
      return res.status(400).json({ 
        error: 'معرف العرض والإجراء مطلوبان',
        missing: {
          offerId: !offerId,
          action: !action
        }
      });
    }

    // التحقق من صحة الإجراء
    const validActions = ['accept', 'reject', 'negotiate'];
    if (!validActions.includes(action as string)) {
      return res.status(400).json({ 
        error: 'إجراء غير صحيح',
        validActions
      });
    }

    // محاكاة قاعدة البيانات للعروض
    const mockOffers = [
      {
        id: "1",
        seller: "معرض السيارات الحديث",
        productName: "تويوتا كامري 2022",
        status: 'pending',
        buyerId: "buyer_001"
      },
      {
        id: "2",
        seller: "محل الساعات الفاخرة",
        productName: "ساعة رولكس سوبمارينر",
        status: 'accepted',
        buyerId: "buyer_002"
      },
      {
        id: "3",
        seller: "مزرعة التمور الطازجة",
        productName: "تمر سكري 5 كيلو",
        status: 'negotiating',
        buyerId: "buyer_003"
      },
      {
        id: "4",
        seller: "معرض الإلكترونيات",
        productName: "آيفون 15 برو ماكس",
        status: 'rejected',
        buyerId: "buyer_004"
      }
    ];

    // البحث عن العرض
    const offer = mockOffers.find(o => o.id === offerId);
    
    if (!offer) {
      return res.status(404).json({ 
        error: 'العرض غير موجود',
        offerId
      });
    }

    // التحقق من أن العرض في حالة الانتظار
    if (offer.status !== 'pending') {
      return res.status(400).json({ 
        error: 'لا يمكن تغيير حالة العرض',
        currentStatus: offer.status,
        message: 'يمكن فقط تغيير حالة العروض في الانتظار'
      });
    }

    // تحديث حالة العرض
    const newStatus = action as 'accepted' | 'rejected' | 'negotiating';
    offer.status = newStatus;

    // إنشاء سجل الإجراء
    const actionRecord: OfferAction = {
      offerId: offerId as string,
      action: action as 'accept' | 'reject' | 'negotiate',
      buyerId: offer.buyerId,
      timestamp: new Date().toISOString()
    };

    // محاكاة إرسال إشعار للبائع
    const sellerNotification = {
      type: 'buyer_action',
      sellerId: offer.seller,
      offerId: offerId,
      action: action,
      productName: offer.productName,
      buyerId: offer.buyerId,
      message: getActionMessage(action as string, offer.productName)
    };

    // محاكاة حفظ البيانات
    console.log('تم تحديث حالة العرض:', {
      offerId,
      action,
      newStatus,
      actionRecord,
      sellerNotification
    });

    // إرجاع النتيجة
    return res.status(200).json({
      success: true,
      message: getActionMessage(action as string, offer.productName),
      data: {
        offerId,
        action,
        newStatus,
        timestamp: actionRecord.timestamp,
        sellerNotification
      }
    });

  } catch (error) {
    console.error('خطأ في معالجة إجراء المشتري:', error);
    return res.status(500).json({ 
      error: 'خطأ في الخادم',
      details: error instanceof Error ? error.message : 'خطأ غير معروف'
    });
  }
}

function getActionMessage(action: string, productName: string): string {
  switch (action) {
    case 'accept':
      return `تم قبول عرض "${productName}" بنجاح`;
    case 'reject':
      return `تم رفض عرض "${productName}"`;
    case 'negotiate':
      return `تم إرسال طلب تفاوض لعرض "${productName}"`;
    default:
      return `تم تحديث حالة عرض "${productName}"`;
  }
}
