import { useCallback, useEffect, useState } from "react";
import {
  Users, TrendingUp, Search, RefreshCw, CheckCircle,
  DollarSign, UserPlus, Copy, ExternalLink, Handshake,
} from "lucide-react";
import ControlRoomGate, { type ControlRoomAccessLevel } from "@/components/control-room/ControlRoomGate";
import ControlRoomShell from "@/components/control-room/ControlRoomShell";
import dasmBff from "@/lib/dasmBffClient";

type Partner = {
  id: number;
  name: string;
  email: string;
  phone: string;
  referral_code: string;
  partner_code: string;
  commission_percentage: string;
  is_active: boolean;
  status: string;
  total_referrals: number;
  total_settled_deals: number;
  total_commission_earned: string;
  total_paid_amount: string;
  referred_users_count?: number;
  created_at: string;
};

type Summary = {
  total_partners: number;
  active_partners: number;
  total_referrals: number;
  total_commission_earned: number;
};

function fmt(n: number | string | undefined): string {
  if (n == null) return "—";
  const num = typeof n === "string" ? parseFloat(n) : n;
  return num.toLocaleString("ar-SA");
}

function GrowthPartnersContent({ access }: { access: ControlRoomAccessLevel }) {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [listRes, summaryRes] = await Promise.allSettled([
        dasmBff.get("admin/growth-partners"),
        dasmBff.get("admin/growth-partners/summary"),
      ]);

      if (listRes.status === "fulfilled") {
        const d = listRes.value.data;
        setPartners(d?.data?.data ?? d?.data ?? []);
        // summary might come from list endpoint too
        if (d?.summary) {
          setSummary(d.summary);
        }
      }

      if (summaryRes.status === "fulfilled") {
        const d = summaryRes.value.data;
        setSummary(d?.totals ?? d?.data ?? d);
      }
    } catch {
      // skip
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = search
    ? partners.filter(
        (p) =>
          p.name.includes(search) ||
          p.email.includes(search) ||
          p.referral_code.includes(search) ||
          p.partner_code.includes(search)
      )
    : partners;

  return (
    <ControlRoomShell access={access}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Handshake className="w-6 h-6 text-emerald-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">شركاء النمو</h1>
              <p className="text-sm text-gray-500">مراقبة وإدارة شبكة شركاء النمو</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={load}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-600 text-sm rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              تحديث
            </button>
            <a
              href="https://partner.dasm.com.sa"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-100 text-emerald-700 text-sm rounded-lg hover:bg-emerald-200 transition"
            >
              <ExternalLink className="w-4 h-4" />
              بوابة الشركاء
            </a>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "إجمالي الشركاء", value: summary?.total_partners ?? partners.length, icon: Handshake, color: "bg-emerald-50 text-emerald-700" },
            { label: "نشط", value: summary?.active_partners ?? partners.filter((p) => p.is_active).length, icon: CheckCircle, color: "bg-green-50 text-green-700" },
            { label: "إجمالي الإحالات", value: summary?.total_referrals ?? 0, icon: UserPlus, color: "bg-blue-50 text-blue-700" },
            { label: "إجمالي العمولات", value: `${fmt(summary?.total_commission_earned ?? 0)} ر.س`, icon: DollarSign, color: "bg-amber-50 text-amber-700" },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className={`rounded-xl p-4 ${stat.color}`}>
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="w-4 h-4" />
                  <span className="text-xs font-medium">{stat.label}</span>
                </div>
                <div className="text-2xl font-bold">{loading ? "..." : stat.value}</div>
              </div>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="بحث بالاسم أو الإيميل أو كود الإحالة..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pr-10 pl-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900">كل الشركاء</h3>
            <span className="text-xs text-gray-400">{filtered.length} شريك</span>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-400 text-sm">جاري التحميل...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <Handshake className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400">لا يوجد شركاء بعد</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-right">
                    <th className="px-4 py-2.5 text-xs font-semibold text-gray-500">الشريك</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-gray-500">كود الإحالة</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-gray-500">العمولة</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-gray-500">الإحالات</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-gray-500">الصفقات</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-gray-500">العمولات المكتسبة</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-gray-500">المدفوع</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-gray-500">الحالة</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-gray-500">التسجيل</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50/50 transition">
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-semibold text-gray-900">{p.name}</div>
                          <div className="text-xs text-gray-400">{p.email}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                          {p.referral_code}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-bold text-emerald-600">{p.commission_percentage}%</td>
                      <td className="px-4 py-3 text-gray-600">{p.total_referrals}</td>
                      <td className="px-4 py-3 text-gray-600">{p.total_settled_deals}</td>
                      <td className="px-4 py-3 font-semibold text-gray-900">{fmt(p.total_commission_earned)} ر.س</td>
                      <td className="px-4 py-3 text-gray-500">{fmt(p.total_paid_amount)} ر.س</td>
                      <td className="px-4 py-3">
                        {p.is_active && p.status === "approved" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            <CheckCircle className="w-3 h-3" /> نشط
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                            {p.status}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">
                        {new Date(p.created_at).toLocaleDateString("ar-SA")}
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

export default function GrowthPartnersPage() {
  return (
    <ControlRoomGate>
      {(access) => <GrowthPartnersContent access={access} />}
    </ControlRoomGate>
  );
}
