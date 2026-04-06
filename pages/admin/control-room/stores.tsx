import { useCallback, useEffect, useState } from "react";
import {
  Store, Package, ShoppingCart, TrendingUp, Search,
  RefreshCw, CheckCircle, XCircle, Clock, AlertTriangle,
  Eye, Ban, BarChart2,
} from "lucide-react";
import ControlRoomGate, { type ControlRoomAccessLevel } from "@/components/control-room/ControlRoomGate";
import ControlRoomShell from "@/components/control-room/ControlRoomShell";

type StoreRow = {
  id: number;
  name: string;
  name_ar?: string;
  slug: string;
  category: string;
  status: "active" | "suspended" | "pending" | "closed";
  is_verified: boolean;
  owner_id: number;
  owner_type: string;
  products_count: number;
  orders_count: number;
  created_at: string;
};

type Stats = {
  total_stores: number;
  active_stores: number;
  pending_stores: number;
  suspended_stores: number;
  orders_today: number;
  revenue_today: number;
};

const STATUS_MAP: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
  active:    { label: "نشط",           color: "bg-green-100 text-green-700",  icon: CheckCircle },
  pending:   { label: "قيد المراجعة", color: "bg-amber-100 text-amber-700",  icon: Clock },
  suspended: { label: "موقوف",         color: "bg-red-100 text-red-700",      icon: Ban },
  closed:    { label: "مغلق",          color: "bg-gray-100 text-gray-600",    icon: XCircle },
};

const OWNER_TYPE_MAP: Record<string, string> = {
  venue_owner: "معرض",
  dealer:      "تاجر",
  user:        "مستخدم",
};

const CATEGORY_MAP: Record<string, string> = {
  cars:        "سيارات",
  electronics: "إلكترونيات",
  fashion:     "أزياء",
  general:     "عام",
};

function StoresBody({ access }: { access: ControlRoomAccessLevel }) {
  const [stores, setStores]       = useState<StoreRow[]>([]);
  const [stats, setStats]         = useState<Stats | null>(null);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [statusFilter, setFilter] = useState("all");
  const [actionBusy, setBusy]     = useState<number | null>(null);
  const [tab, setTab]             = useState<"all" | "pending">("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sRes, stRes] = await Promise.allSettled([
        fetch(`/api/stores/list?status=${statusFilter}&search=${encodeURIComponent(search)}`).then(r => r.json()),
        fetch("/api/stores/stats").then(r => r.json()),
      ]);
      if (sRes.status === "fulfilled" && sRes.value.success)  setStores(sRes.value.data ?? []);
      if (stRes.status === "fulfilled" && stRes.value.success) setStats(stRes.value.data);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => { void load(); }, [load]);

  const doAction = async (id: number, action: "suspend" | "activate" | "approve") => {
    if (action === "suspend" && !confirm("تعليق المتجر؟")) return;
    setBusy(id);
    try {
      await fetch("/api/stores/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId: id, action }),
      });
      void load();
    } finally {
      setBusy(null);
    }
  };

  const displayed = stores.filter(s =>
    tab === "pending" ? s.status === "pending" : true
  );

  return (
    <div className="space-y-6 max-w-7xl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Store className="w-5 h-5 text-emerald-600" />
            متاجر داسم
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">مراقبة وإدارة كل المتاجر من الكنترول روم</p>
        </div>
        <button onClick={load} disabled={loading}
          className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition">
          <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
          تحديث
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {[
            { label: "إجمالي المتاجر",   value: stats.total_stores,     icon: Store,        color: "text-gray-600   bg-gray-100"   },
            { label: "نشطة",             value: stats.active_stores,    icon: CheckCircle,  color: "text-green-600  bg-green-50"   },
            { label: "قيد المراجعة",     value: stats.pending_stores,   icon: Clock,        color: "text-amber-600  bg-amber-50"   },
            { label: "موقوفة",           value: stats.suspended_stores, icon: Ban,          color: "text-red-600    bg-red-50"     },
            { label: "طلبات اليوم",      value: stats.orders_today,     icon: ShoppingCart, color: "text-blue-600   bg-blue-50"    },
            { label: "إيرادات اليوم",    value: `${(stats.revenue_today/1000).toFixed(1)}k ر.س`, icon: TrendingUp, color: "text-purple-600 bg-purple-50" },
          ].map(c => (
            <div key={c.label} className="bg-white rounded-2xl border border-gray-100 p-4 space-y-2">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${c.color}`}>
                <c.icon className="w-4 h-4" />
              </div>
              <p className="text-xl font-bold text-gray-900">{c.value}</p>
              <p className="text-xs text-gray-500">{c.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Pending Alert */}
      {stats && stats.pending_stores > 0 && (
        <div
          role="button"
          onClick={() => setTab("pending")}
          className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 cursor-pointer hover:bg-amber-100 transition"
        >
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-800 font-medium">
            {stats.pending_stores} متجر بانتظار المراجعة والقبول — اضغط للعرض
          </p>
        </div>
      )}

      {/* Tabs + Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {(["all", "pending"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                tab === t ? "bg-gray-900 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}>
              {t === "all" ? "الكل" : "قيد المراجعة"}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="search" placeholder="بحث..." value={search}
              onChange={e => setSearch(e.target.value)}
              className="pr-9 pl-3 py-2 rounded-xl border border-gray-200 text-sm w-52 focus:outline-none focus:ring-2 focus:ring-emerald-300" />
          </div>
          <select value={statusFilter} onChange={e => setFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none">
            <option value="all">كل الحالات</option>
            <option value="active">نشط</option>
            <option value="pending">قيد المراجعة</option>
            <option value="suspended">موقوف</option>
          </select>
          <span className="text-xs text-gray-400">{displayed.length} متجر</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw className="w-6 h-6 animate-spin text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">جاري تحميل المتاجر...</p>
          </div>
        ) : displayed.length === 0 ? (
          <div className="p-12 text-center">
            <Store className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">
              {stores.length === 0 ? "لا توجد متاجر بعد" : "لا توجد نتائج"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500">
                  <th className="px-4 py-3 text-right font-medium">المتجر</th>
                  <th className="px-4 py-3 text-right font-medium">نوع المالك</th>
                  <th className="px-4 py-3 text-right font-medium">الفئة</th>
                  <th className="px-4 py-3 text-right font-medium">الحالة</th>
                  <th className="px-4 py-3 text-right font-medium">المنتجات</th>
                  <th className="px-4 py-3 text-right font-medium">الطلبات</th>
                  <th className="px-4 py-3 text-right font-medium">تاريخ الإنشاء</th>
                  {access === "full" && <th className="px-4 py-3 text-right font-medium">إجراءات</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {displayed.map(store => {
                  const s = STATUS_MAP[store.status] ?? STATUS_MAP.closed;
                  const Icon = s.icon;
                  return (
                    <tr key={store.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xs shrink-0">
                            {store.name[0]}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{store.name}</p>
                            <p className="text-xs text-gray-400">/{store.slug}</p>
                          </div>
                          {store.is_verified && (
                            <CheckCircle className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {OWNER_TYPE_MAP[store.owner_type] ?? store.owner_type}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {CATEGORY_MAP[store.category] ?? store.category}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${s.color}`}>
                          <Icon className="w-3 h-3" />
                          {s.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        <span className="flex items-center gap-1">
                          <Package className="w-3.5 h-3.5 text-gray-400" />
                          {store.products_count}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        <span className="flex items-center gap-1">
                          <ShoppingCart className="w-3.5 h-3.5 text-gray-400" />
                          {store.orders_count}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {new Date(store.created_at).toLocaleDateString("ar-SA")}
                      </td>
                      {access === "full" && (
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            {store.status === "pending" && (
                              <button onClick={() => doAction(store.id, "approve")}
                                disabled={actionBusy === store.id}
                                className="text-xs px-2 py-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition disabled:opacity-50">
                                قبول
                              </button>
                            )}
                            {store.status === "active" && (
                              <button onClick={() => doAction(store.id, "suspend")}
                                disabled={actionBusy === store.id}
                                className="text-xs px-2 py-1 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition disabled:opacity-50">
                                تعليق
                              </button>
                            )}
                            {store.status === "suspended" && (
                              <button onClick={() => doAction(store.id, "activate")}
                                disabled={actionBusy === store.id}
                                className="text-xs px-2 py-1 rounded-lg border border-green-200 text-green-600 hover:bg-green-50 transition disabled:opacity-50">
                                تفعيل
                              </button>
                            )}
                            <button className="text-xs px-2 py-1 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition flex items-center gap-1">
                              <Eye className="w-3 h-3" />
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

export default function StoresPage() {
  return (
    <ControlRoomGate>
      {(access) => (
        <ControlRoomShell access={access}>
          <StoresBody access={access} />
        </ControlRoomShell>
      )}
    </ControlRoomGate>
  );
}
