import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // في التطبيق الحقيقي، ستأتي هذه البيانات من قاعدة البيانات
    const showroomData = {
      showroom_id: "MAZ001",
      showroom_name: "معرض محمد الزهراني للسيارات",
      owner_name: "محمد أحمد الزهراني",
      contact: {
        phone: "0500000000",
        email: "maz@mazbrothers.com"
      },
      wallet_balance: 125000.00,
      subscription_plan: {
        plan_id: "SUB3000",
        title: "باقة معارض الشركاء",
        price: 3000,
        renewal_date: "2025-09-01"
      },
      stats: {
        listed_cars: 58,
        sold_cars: 27,
        live_auctions: 4,
        pending_approvals: 2,
        views_last_30_days: 13427
      },
      rating: {
        average: 4.6,
        total_reviews: 127,
        distribution: {
          '5': 89,
          '4': 25,
          '3': 8,
          '2': 3,
          '1': 2
        }
      },
      reviews: [
        {
          id: "REV001",
          user_name: "أحمد محمد",
          rating: 5,
          comment: "معرض ممتاز وسيارات بجودة عالية، أنصح الجميع بالتسوق منه",
          date: "2025-07-30T14:30:00+03:00",
          car_id: "CAR-00123"
        },
        {
          id: "REV002",
          user_name: "سارة أحمد",
          rating: 4,
          comment: "خدمة جيدة وأسعار معقولة، لكن يمكن تحسين التواصل",
          date: "2025-07-28T10:15:00+03:00"
        },
        {
          id: "REV003",
          user_name: "علي حسن",
          rating: 5,
          comment: "اشتريت سيارة من هذا المعرض وكانت تجربة رائعة، سأعود بالتأكيد",
          date: "2025-07-25T16:45:00+03:00",
          car_id: "CAR-00157"
        },
        {
          id: "REV004",
          user_name: "فاطمة علي",
          rating: 4,
          comment: "المعرض نظيف والموظفين متعاونين، أنصح بالزيارة",
          date: "2025-07-22T11:20:00+03:00"
        },
        {
          id: "REV005",
          user_name: "محمد عبدالله",
          rating: 5,
          comment: "أفضل معرض سيارات في المنطقة، أسعار منافسة وجودة عالية",
          date: "2025-07-20T09:30:00+03:00"
        }
      ],
      cars: [
        {
          car_id: "CAR-00123",
          title: "تويوتا كامري 2022 فل كامل",
          price: 88500,
          status: "في المزاد المباشر",
          last_bid: 91500,
          auction_type: "live",
          auction_start: "2025-08-07T16:00:00+03:00",
          is_featured: true,
          ai_valuation: 90000,
          image_url: "https://cdn.dasm-e.com/cars/CAR-00123.jpg"
        },
        {
          car_id: "CAR-00157",
          title: "هونداي النترا 2021",
          price: 66500,
          status: "بانتظار الموافقة",
          last_bid: null,
          auction_type: null,
          auction_start: null,
          is_featured: false,
          ai_valuation: 64000,
          image_url: "https://cdn.dasm-e.com/cars/CAR-00157.jpg"
        }
      ],
      transactions: [
        {
          txn_id: "TXN987654",
          type: "إيداع رصيد",
          amount: 20000,
          method: "تحويل بنكي",
          date: "2025-07-28T11:30:00+03:00"
        },
        {
          txn_id: "TXN987659",
          type: "رسوم عمولة مزاد",
          amount: -700,
          car_id: "CAR-00123",
          date: "2025-07-30T17:45:00+03:00"
        }
      ],
      actions: {
        upload_new_car: "/api/showroom/MAZ001/cars/upload",
        edit_car: "/api/showroom/MAZ001/cars/{car_id}/edit",
        withdraw_balance: "/api/showroom/MAZ001/wallet/withdraw",
        renew_subscription: "/api/showroom/MAZ001/subscription/renew",
        view_reports: "/admin/showrooms/MAZ001/reports"
      }
    }

    res.status(200).json({
      success: true,
      data: showroomData
    })
  } catch (error) {
    console.error('Error fetching showroom data:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch showroom data'
    })
  }
} 