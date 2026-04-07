import { useCallback, useEffect, useState } from "react";
import {
  DollarSign, RefreshCw, Calculator, Layers, CheckCircle, XCircle, TrendingUp,
} from "lucide-react";
import ControlRoomGate, { type ControlRoomAccessLevel } from "@/components/control-room/ControlRoomGate";
import ControlRoomShell from "@/components/control-room/ControlRoomShell";
import dasmBff from "@/lib/dasmBffClient";

type Tier = {
  id: number;
  name: string;
  minPrice: number;
  maxPrice: number | null;
  commissionAmount: number;
  isProgressive: boolean;
  isActive: boolean;
};

type CalcResult = {
  price: number;
  commission: number;
  tier: Tier | null;
};

function fmt(n: number | null | undefined): string {
  if (n == null) return "—";
  return n.toLocaleString("ar-SA");
}

function CommissionTiersContent({ access }: { access: ControlRoomAccessLevel }) {
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [loading, setLoading] = useState(true);

  // حاسبة سريعة
  const [calcPrice, setCalcPrice] = useState("");
  const [calcResult, setCalcResult] = useState<CalcResult | null>(null);
  const [calcLoading, setCalcLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await dasmBff.get("admin/commission-tiers");
      setTiers(Array.isArray(res.data) ? res.data : res.data?.data ?? []);
    } catch { /* skip */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const calculate = async () => {
    const price = parseFloat(calcPrice);
    if (isNaN(price) || price <= 0) return;
    setCalcLoading(true);
    try {
      const res = await dasmBff.post("admin/commission-tiers/calculate", { price });
      setCalcResult(res.data);
    } catch { setCalcResult(null); }
    finally { setCalcLoading(false); }
  };

  const activeTiers = tiers.filter((t) => t.isActive);
  const inactiveTiers = tiers.filter((t) => !t.isActive);

  return (
    <ControlRoomShell access={access}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Layers className="w-6 h-6 text-blue-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">شرائح العمولات</h1>
              <p className="text-sm text-gray-500">الشرائح المعتمدة من لوحة الأدمن — مصدر الحقيقة</p>
            </div>
          </div>
          <button onClick={load} disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-600 text-sm rounded-lg hover:bg-gray-200 transition disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> تحديث
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 text-blue-700 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1"><Layers className="w-4 h-4" /><span className="text-xs font-medium">إجمالي الشرائح</span></div>
            <div className="text-2xl font-bold">{tiers.length}</div>
          </div>
          <div className="bg-green-50 text-green-700 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1"><CheckCircle className="w-4 h-4" /><span className="text-xs font-medium">مفعّلة</span></div>
            <div className="text-2xl font-bold">{activeTiers.length}</div>
          </div>
          <div className="bg-gray-50 text-gray-700 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1"><XCircle className="w-4 h-4" /><span className="text-xs font-medium">معطّلة</span></div>
            <div className="text-2xl font-bold">{inactiveTiers.length}</div>
          </div>
        </div>

        {/* حاسبة سريعة */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calculator className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold">حاسبة سريعة — احسب العمولة من المصدر</h2>
          </div>
          <div className="flex gap-3 items-end flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm text-gray-600 block mb-1">سعر السيارة (ر.س)</label>
              <input
                type="number"
                value={calcPrice}
                onChange={(e) => setCalcPrice(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && calculate()}
                placeholder="مثلاً: 80000"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <button onClick={calculate} disabled={calcLoading || !calcPrice}
              className="px-5 py-2.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition">
              {calcLoading ? "..." : "احسب"}
            </button>
          </div>

          {calcResult && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-xs text-blue-600 mb-1">السعر</p>
                <p className="text-lg font-bold text-blue-800">{fmt(calcResult.price)} ر.س</p>
              </div>
              <div className="bg-green-50 rounded-lg p-3">
                <p className="text-xs text-green-600 mb-1">رسوم المنصة (C)</p>
                <p className="text-lg font-bold text-green-800">{fmt(calcResult.commission)} ر.س</p>
              </div>
              <div className="bg-amber-50 rounded-lg p-3">
                <p className="text-xs text-amber-600 mb-1">الشريحة المطبّقة</p>
                <p className="text-lg font-bold text-amber-800">{calcResult.tier?.name ?? "—"}</p>
                {calcResult.tier && (
                  <p className="text-xs text-amber-600 mt-1">
                    {fmt(calcResult.tier.minPrice)} — {calcResult.tier.maxPrice ? fmt(calcResult.tier.maxPrice) : "∞"} ر.س
                    {calcResult.tier.isProgressive ? " (تدريجية)" : " (ثابتة)"}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* جدول الشرائح */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-900">جميع الشرائح</h3>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-400 text-sm">جاري التحميل...</div>
          ) : tiers.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">لا توجد شرائح — أضف شرائح من لوحة الأدمن أولاً</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-right">
                    <th className="px-4 py-2.5 text-xs font-semibold text-gray-500">اسم الشريحة</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-gray-500">من سعر</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-gray-500">إلى سعر</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-gray-500">العمولة</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-gray-500">النوع</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-gray-500">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {tiers.map((tier) => (
                    <tr key={tier.id} className="hover:bg-gray-50/50 transition">
                      <td className="px-4 py-3 font-semibold text-gray-900">{tier.name}</td>
                      <td className="px-4 py-3 text-gray-600">{fmt(tier.minPrice)} ر.س</td>
                      <td className="px-4 py-3 text-gray-600">{tier.maxPrice ? `${fmt(tier.maxPrice)} ر.س` : "∞"}</td>
                      <td className="px-4 py-3 font-bold text-blue-600">
                        {tier.isProgressive ? `${tier.commissionAmount}%` : `${fmt(tier.commissionAmount)} ر.س`}
                      </td>
                      <td className="px-4 py-3">
                        {tier.isProgressive ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                            <TrendingUp className="w-3 h-3" /> تدريجية
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                            <DollarSign className="w-3 h-3" /> ثابتة
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {tier.isActive ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            <CheckCircle className="w-3 h-3" /> مفعّلة
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                            <XCircle className="w-3 h-3" /> معطّلة
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </ControlRoomShell>
  );
}

export default function CommissionTiersPage() {
  return (
    <ControlRoomGate>
      {(access) => <CommissionTiersContent access={access} />}
    </ControlRoomGate>
  );
}
