import { useCallback, useEffect, useState } from "react";
import { ShoppingBag, Store, Package, TrendingUp, Search, RefreshCw, ExternalLink } from "lucide-react";
import dasmBff from "@/lib/dasmBffClient";
import ControlRoomGate, { type ControlRoomAccessLevel } from "@/components/control-room/ControlRoomGate";
import ControlRoomShell from "@/components/control-room/ControlRoomShell";

type EcommerceStore = {
  id: number;
  name: string;
  owner_name: string;
  status: "active" | "suspended" | "pending";
  products_count: number;
  orders_today: number;
  revenue_total: number;
  created_at: string;
  category?: string;
};

type EcommerceStats = {
  total_stores: number;
  active_stores: number;
  orders_today: number;
  revenue_today: number;
  pending_stores: number;
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  active: { label: "نشط", color: "bg-green-100 text-green-700" },
  suspended: { label: "موقوف", color: "bg-red-100 text-red-700" },
  pending: { label: "قيد المراجعة", color: "bg-amber-100 text-amber-700" },
};

function EcommerceBody({ access }: { access: ControlRoomAccessLevel }) {
  const [stores, setStores] = useState<EcommerceStore[]>([]);
  const [stats, setStats] = useState<EcommerceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [storesRes, statsRes] = await Promise.allSettled([
        dasmBff.get("admin/stores"),
        dasmBff.get("admin/ecommerce/stats"),
      ]);

      if (storesRes.status === "fulfilled") {
        const d = storesRes.value.data?.data ?? storesRes.value.data ?? [];
        setStores(Array.isArray(d) ? d : d.stores ?? []);
      }
      if (statsRes.status === "fulfilled") {
        const d = statsRes.value.data?.data ?? statsRes.value.data ?? {};
        setStats(d);
      }
    } catch {
      // keep existing state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchData(); }, [fetchData]);

  const filtered = stores.filter((s) => {
    const matchSearch =
      !search ||
      s.name.includes(search) ||
      s.owner_name.includes(search);
    const matchStatus = statusFilter === "all" || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleSuspend = async (storeId: number) => {
    if (!confirm("هل تريد تعليق هذا المتجر؟")) return;
    try {
      await dasmBff.post(`admin/stores/${storeId}/suspend`, {});
      void fetchData();
    } catch {
      alert("فشل تعليق المتجر");
    }
  };

  const handleActivate = async (storeId: number) => {
    try {
      await dasmBff.post(`admin/stores/${storeId}/activate`, {});
      void fetchData();
    } catch {
      alert("فشل تفعيل المتجر");
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-indigo-600" />
          <h1 className="text-lg font-bold text-gray-900">المتاجر الإلكترونية</h1>
        </div>
        <button
          type="button"
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
          تحديث
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "إجمالي المتاجر", value: stats.total_stores, icon: Store, color: "text-gray-600 bg-gray-100" },
            { label: "متاجر نشطة", value: stats.active_stores, icon: Store, color: "text-green-600 bg-green-50" },
            { label: "بانتظار المراجعة", value: stats.pending_stores, icon: Package, color: "text-amber-600 bg-amber-50" },
            { label: "طلبات اليوم", value: stats.orders_today, icon: ShoppingBag, color: "text-blue-600 bg-blue-50" },
            { label: "إيرادات اليوم", value: `${(stats.revenue_today / 1000).toFixed(1)}k`, icon: TrendingUp, color: "text-purple-600 bg-purple-50" },
          ].map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="bg-white rounded-2xl border border-gray-200 p-4">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-2 ${card.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <p className="text-xl font-bold text-gray-900">{card.value}</p>
                <p className="text-xs text-gray-500">{card.label}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            placeholder="بحث باسم المتجر أو المالك..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-9 pl-3 py-2 rounded-xl border border-gray-200 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none"
          aria-label="فلتر الحالة"
        >
          <option value="all">كل الحالات</option>
          <option value="active">نشط</option>
          <option value="pending">قيد المراجعة</option>
          <option value="suspended">موقوف</option>
        </select>
        <span className="text-xs text-gray-400">{filtered.length} متجر</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-400">جاري تحميل المتاجر...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-400">
            {stores.length === 0 ? "لا توجد متاجر مسجّلة بعد" : "لا توجد نتائج للبحث"}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500">
                  <th className="px-4 py-3 text-right font-medium">المتجر</th>
                  <th className="px-4 py-3 text-right font-medium">المالك</th>
                  <th className="px-4 py-3 text-right font-medium">الفئة</th>
                  <th className="px-4 py-3 text-right font-medium">الحالة</th>
                  <th className="px-4 py-3 text-right font-medium">المنتجات</th>
                  <th className="px-4 py-3 text-right font-medium">طلبات اليوم</th>
                  <th className="px-4 py-3 text-right font-medium">إجمالي الإيرادات</th>
                  {access === "full" && <th className="px-4 py-3 text-right font-medium">إجراءات</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map((store) => {
                  const statusInfo = STATUS_LABELS[store.status] ?? { label: store.status, color: "bg-gray-100 text-gray-600" };
                  return (
                    <tr key={store.id} className="border-b border-gray-100 hover:bg-gray-50 text-sm">
                      <td className="px-4 py-3 font-semibold text-gray-900">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs shrink-0">
                            {store.name[0]}
                          </div>
                          {store.name}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{store.owner_name}</td>
                      <td className="px-4 py-3 text-gray-500">{store.category ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{store.products_count.toLocaleString("ar-SA")}</td>
                      <td className="px-4 py-3 text-gray-700">{store.orders_today.toLocaleString("ar-SA")}</td>
                      <td className="px-4 py-3 font-medium text-blue-700">
                        {store.revenue_total.toLocaleString("ar-SA")} ر.س
                      </td>
                      {access === "full" && (
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {store.status === "active" ? (
                              <button
                                type="button"
                                onClick={() => handleSuspend(store.id)}
                                className="text-xs px-2 py-1 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition"
                              >
                                تعليق
                              </button>
                            ) : store.status === "suspended" ? (
                              <button
                                type="button"
                                onClick={() => handleActivate(store.id)}
                                className="text-xs px-2 py-1 rounded-lg border border-green-200 text-green-600 hover:bg-green-50 transition"
                              >
                                تفعيل
                              </button>
                            ) : null}
                            <button
                              type="button"
                              className="text-xs px-2 py-1 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition flex items-center gap-1"
                            >
                              <ExternalLink className="w-3 h-3" />
                              عرض
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function EcommercePage() {
  return (
    <ControlRoomGate>
      {(access) => (
        <ControlRoomShell access={access}>
          <EcommerceBody access={access} />
        </ControlRoomShell>
      )}
    </ControlRoomGate>
  );
}
