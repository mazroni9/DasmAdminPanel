import { useCallback, useEffect, useState } from "react";
import { Radio, Users, Gavel, TrendingUp, RefreshCw, Circle } from "lucide-react";
import dasmBff from "@/lib/dasmBffClient";
import ControlRoomGate, { type ControlRoomAccessLevel } from "@/components/control-room/ControlRoomGate";
import ControlRoomShell from "@/components/control-room/ControlRoomShell";

type Auction = {
  id: number;
  title: string;
  status: "live" | "scheduled" | "ended";
  current_bid?: number;
  bids_count?: number;
  viewers?: number;
  ends_at?: string;
  seller_name?: string;
};

type MonitoringData = {
  live_auctions: Auction[];
  scheduled_auctions: Auction[];
  stats: {
    total_active_users?: number;
    total_bids_today?: number;
    revenue_today?: number;
    live_count?: number;
  };
};

function AuctionRow({ auction }: { auction: Auction }) {
  const statusColors = {
    live: "bg-green-100 text-green-700",
    scheduled: "bg-blue-100 text-blue-700",
    ended: "bg-gray-100 text-gray-500",
  };

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50 text-sm">
      <td className="px-4 py-3">
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[auction.status]}`}>
          {auction.status === "live" ? "حي الآن" : auction.status === "scheduled" ? "مجدول" : "منتهي"}
        </span>
      </td>
      <td className="px-4 py-3 font-medium text-gray-900">{auction.title}</td>
      <td className="px-4 py-3 text-gray-600">{auction.seller_name ?? "—"}</td>
      <td className="px-4 py-3 font-bold text-blue-700">
        {auction.current_bid ? `${auction.current_bid.toLocaleString("ar-SA")} ر.س` : "—"}
      </td>
      <td className="px-4 py-3 text-gray-500">{auction.bids_count ?? 0} مزايدة</td>
      <td className="px-4 py-3">
        <span className="flex items-center gap-1 text-gray-500">
          <Users className="w-3 h-3" />
          {auction.viewers ?? 0}
        </span>
      </td>
      <td className="px-4 py-3 text-xs text-gray-400">
        {auction.ends_at ? new Date(auction.ends_at).toLocaleString("ar-SA") : "—"}
      </td>
    </tr>
  );
}

function MonitoringBody({ access }: { access: ControlRoomAccessLevel }) {
  const [data, setData] = useState<MonitoringData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await dasmBff.get("admin/live-auctions");
      const raw = res.data?.data ?? res.data ?? {};
      setData({
        live_auctions: raw.live_auctions ?? [],
        scheduled_auctions: raw.scheduled_auctions ?? [],
        stats: raw.stats ?? {},
      });
      setLastRefresh(new Date());
    } catch {
      setData({ live_auctions: [], scheduled_auctions: [], stats: {} });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
    // تحديث تلقائي كل 30 ثانية
    const interval = setInterval(() => void fetchData(), 30_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const stats = data?.stats ?? {};

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radio className="w-5 h-5 text-green-600" />
          <h1 className="text-lg font-bold text-gray-900">المراقبة الحية</h1>
          {data && !loading && (
            <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
              <Circle className="w-2 h-2 fill-green-500" />
              مباشر
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">
            آخر تحديث: {lastRefresh.toLocaleTimeString("ar-SA")}
          </span>
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
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "مزادات حية", value: data?.live_auctions?.length ?? 0, icon: Radio, color: "text-green-600 bg-green-50" },
          { label: "مستخدمون نشطون", value: stats.total_active_users ?? 0, icon: Users, color: "text-blue-600 bg-blue-50" },
          { label: "مزايدات اليوم", value: stats.total_bids_today ?? 0, icon: Gavel, color: "text-amber-600 bg-amber-50" },
          { label: "إيرادات اليوم", value: stats.revenue_today ? `${(stats.revenue_today / 1000).toFixed(1)}k` : "0", icon: TrendingUp, color: "text-purple-600 bg-purple-50" },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white rounded-2xl border border-gray-200 p-4">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-2 ${card.color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <p className="text-xl font-bold text-gray-900">{loading ? "—" : card.value}</p>
              <p className="text-xs text-gray-500">{card.label}</p>
            </div>
          );
        })}
      </div>

      {/* Live Auctions Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <h2 className="font-semibold text-gray-900 text-sm">المزادات الحية الآن</h2>
          <span className="text-xs text-gray-400">({data?.live_auctions?.length ?? 0})</span>
        </div>
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-400">جاري تحميل البيانات...</div>
        ) : !data?.live_auctions?.length ? (
          <div className="p-8 text-center text-sm text-gray-400">لا توجد مزادات حية الآن</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-500">
                  <th className="px-4 py-2 text-right font-medium">الحالة</th>
                  <th className="px-4 py-2 text-right font-medium">العنوان</th>
                  <th className="px-4 py-2 text-right font-medium">البائع</th>
                  <th className="px-4 py-2 text-right font-medium">أعلى مزايدة</th>
                  <th className="px-4 py-2 text-right font-medium">المزايدات</th>
                  <th className="px-4 py-2 text-right font-medium">المشاهدون</th>
                  <th className="px-4 py-2 text-right font-medium">ينتهي</th>
                </tr>
              </thead>
              <tbody>
                {data.live_auctions.map((a) => <AuctionRow key={a.id} auction={a} />)}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Scheduled Auctions */}
      {access === "full" && (data?.scheduled_auctions?.length ?? 0) > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 text-sm">المزادات المجدولة القادمة</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-500">
                  <th className="px-4 py-2 text-right font-medium">الحالة</th>
                  <th className="px-4 py-2 text-right font-medium">العنوان</th>
                  <th className="px-4 py-2 text-right font-medium">البائع</th>
                  <th className="px-4 py-2 text-right font-medium">أعلى مزايدة</th>
                  <th className="px-4 py-2 text-right font-medium">المزايدات</th>
                  <th className="px-4 py-2 text-right font-medium">المشاهدون</th>
                  <th className="px-4 py-2 text-right font-medium">ينتهي</th>
                </tr>
              </thead>
              <tbody>
                {data?.scheduled_auctions.map((a) => <AuctionRow key={a.id} auction={a} />)}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MonitoringPage() {
  return (
    <ControlRoomGate>
      {(access) => (
        <ControlRoomShell access={access}>
          <MonitoringBody access={access} />
        </ControlRoomShell>
      )}
    </ControlRoomGate>
  );
}
