import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import platformApi from "@/lib/platformApi";
import { CrButton } from "@/components/ui/cr-button";
import { useAuth } from "@/hooks/useAuth";
import { Car, ClipboardList, UserCog } from "lucide-react";
import ControlRoomGate from "@/components/control-room/ControlRoomGate";
import ControlRoomShell from "@/components/control-room/ControlRoomShell";

const CAR_TYPES = [
  { value: "luxury", label: "سيارة فارهة" },
  { value: "classic", label: "كلاسيكية" },
  { value: "caravan", label: "كرافان" },
  { value: "truck", label: "شاحنة" },
  { value: "company", label: "سيارة شركة" },
  { value: "government", label: "حكومية" },
  { value: "individual", label: "فردية" },
];

type CarRow = {
  id: number;
  owner_name: string;
  model: string;
  status: string;
  images: string[];
  reports: string[];
  market?: string;
  type?: string;
};

function ControlRoomHomeBody() {
  const { isAdmin, isModerator, isProgrammer, isSuperAdmin } = useAuth();
  const isStaff = isAdmin || isModerator || isProgrammer;

  const [cars, setCars] = useState<CarRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCars, setSelectedCars] = useState<number[]>([]);
  const [carTypes, setCarTypes] = useState<{ [id: number]: string }>({});

  const fetchPendingCars = useCallback(async () => {
    setLoading(true);
    try {
      const res = await platformApi.get("/api/admin/cars/pending");
      setCars(res.data);
    } catch {
      setCars([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isStaff) return;
    void fetchPendingCars();
  }, [isStaff, fetchPendingCars]);

  const handleApprove = async (carId: number) => {
    const type = carTypes[carId] || "luxury";
    await platformApi.post("/api/admin/cars/approve", {
      id: carId,
      type,
      market: "instant",
    });
    fetchPendingCars();
  };

  const handleMoveToLiveMarket = async () => {
    if (selectedCars.length === 0) return;
    await platformApi.post("/api/admin/cars/move-to-live-market", {
      carIds: selectedCars,
    });
    fetchPendingCars();
    setSelectedCars([]);
  };

  const handleSelectCar = (carId: number, checked: boolean) => {
    setSelectedCars((prev) =>
      checked ? [...prev, carId] : prev.filter((id) => id !== carId)
    );
  };

  const handleTypeChange = (carId: number, value: string) => {
    setCarTypes((prev) => ({ ...prev, [carId]: value }));
  };

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-8 rtl max-w-6xl">
      <section>
        <h2 className="text-lg font-bold mb-3 text-gray-900">
          العمليات التشغيلية — الموافقات
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/admin/control-room/approval-requests"
            className="flex items-start gap-3 p-5 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 transition shadow-sm"
          >
            <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-gray-900">طابور الموافقات</p>
              <p className="text-sm text-gray-500 mt-1">
                حسابات تجارية (تاجر / مالك معرض / مستثمر) وطلبات صلاحيات مجلس السوق، مع سجل
                التدقيق.
              </p>
            </div>
          </Link>
          {isSuperAdmin ? (
            <Link
              href="/admin/control-room/approval-group"
              className="flex items-start gap-3 p-5 rounded-2xl border border-blue-200 bg-blue-50 hover:bg-blue-100 transition"
            >
              <div className="p-2 rounded-xl bg-blue-100 text-blue-800">
                <UserCog className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold text-gray-900">مجموعة الموافقات التشغيلية</p>
                <p className="text-sm text-gray-500 mt-1">
                  إدارة الأعضاء والقدرات (مدير النظام الرئيسي فقط).
                </p>
              </div>
            </Link>
          ) : (
            <div className="flex items-start gap-3 p-5 rounded-2xl border border-dashed border-gray-200 bg-gray-50 text-gray-500">
              <UserCog className="w-6 h-6 shrink-0 mt-0.5" />
              <p className="text-sm">
                إدارة مجموعة الموافقات متاحة لمدير النظام الرئيسي فقط.
              </p>
            </div>
          )}
        </div>
      </section>

      {isStaff ? (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Car className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-gray-900">معالجة السيارات الجديدة</h2>
          </div>
          {loading && (
            <div className="text-sm text-gray-500">جاري التحميل...</div>
          )}
          <CrButton
            disabled={selectedCars.length === 0}
            onClick={handleMoveToLiveMarket}
            className="mb-4"
          >
            عرض السيارات المحددة في الحراج المباشر (Live Market)
          </CrButton>
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full border-collapse text-sm min-w-[720px]">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-200">
                  <th className="p-2 text-right">اختيار</th>
                  <th className="p-2 text-right">المالك</th>
                  <th className="p-2 text-right">الموديل</th>
                  <th className="p-2 text-right">الصور</th>
                  <th className="p-2 text-right">التقارير</th>
                  <th className="p-2 text-right">التصنيف</th>
                  <th className="p-2 text-right">الإجراءات</th>
                  <th className="p-2 text-right">السوق الحالي</th>
                </tr>
              </thead>
              <tbody>
                {cars.map((car) => (
                  <tr key={car.id} className="border-b border-gray-100">
                    <td className="p-2">
                      <input
                        type="checkbox"
                        checked={selectedCars.includes(car.id)}
                        onChange={(e) => handleSelectCar(car.id, e.target.checked)}
                        title={`اختيار السيارة ${car.model}`}
                        aria-label={`اختيار السيارة ${car.model}`}
                      />
                    </td>
                    <td className="p-2">{car.owner_name}</td>
                    <td className="p-2">{car.model}</td>
                    <td className="p-2">
                      {car.images?.map((img, i) => (
                        <img
                          key={i}
                          src={img}
                          alt="car"
                          className="w-16 h-16 inline-block object-cover rounded"
                        />
                      ))}
                    </td>
                    <td className="p-2">
                      {car.reports?.map((rep, i) => (
                        <a
                          key={i}
                          href={rep}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 block"
                        >
                          تقرير {i + 1}
                        </a>
                      ))}
                    </td>
                    <td className="p-2">
                      <select
                        value={carTypes[car.id] || ""}
                        onChange={(e) => handleTypeChange(car.id, e.target.value)}
                        title="اختر تصنيف السيارة"
                        aria-label="اختر تصنيف السيارة"
                        className="border border-gray-200 rounded px-2 py-1 bg-white"
                      >
                        <option value="">اختر التصنيف</option>
                        {CAR_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-2">
                      <CrButton
                        variant="success"
                        onClick={() => handleApprove(car.id)}
                        disabled={!carTypes[car.id]}
                        size="sm"
                      >
                        اعتماد (للمزاد الفوري)
                      </CrButton>
                    </td>
                    <td className="p-2 text-xs text-gray-600">
                      {car.market === "instant" && "المزاد الفوري"}
                      {car.market === "live-market" && "الحراج المباشر"}
                      {!car.market && "بانتظار التصنيف"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}

export default function ControlRoomIndexPage() {
  return (
    <ControlRoomGate>
      <ControlRoomShell>
        <ControlRoomHomeBody />
      </ControlRoomShell>
    </ControlRoomGate>
  );
}
