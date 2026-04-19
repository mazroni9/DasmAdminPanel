import { useEffect, useState, useCallback } from "react";
import Head from "next/head";
import Link from "next/link";
import platformApi from "@/lib/platformApi";
import {
  Activity,
  Eye,
  Flame,
  Gavel,
  RefreshCw,
  Radio,
  ChevronLeft,
  AlertCircle,
} from "lucide-react";

/**
 * DASM Stream Phase 3 — Control Room Heat Grid.
 *
 * Consumes the Heat Engine endpoints from DASM-Platform#593:
 *   GET /api/admin/control-room/heat-grid
 *   GET /api/admin/control-room/broadcast/{id}
 *
 * Auto-refreshes every 10s. Sorted by heat descending. Rows with
 * heat ≥ 80 are flagged "hot" with a flame icon + amber background.
 */

interface HeatItem {
  id: number;
  title: string;
  heat_score: number;
  is_hot: boolean;
  started_at: string | null;
  minutes_live: number;
  viewers_now: number;
  bids_last_5min: number;
  bids_last_hour: number;
  last_bid_at: string | null;
  auction: {
    id: number;
    title: string | null;
    current_bid: number | null;
    total_bids: number;
  } | null;
  creator: {
    id: number;
    email: string;
    organization: string | null;
  } | null;
  stream_provider: string | null;
  has_active_source: boolean;
}

interface HeatGridResponse {
  broadcasts: HeatItem[];
  totals: {
    live_count: number;
    hot_count: number;
    total_viewers: number;
    total_bids_5min: number;
  };
  generated_at: string;
}

const REFRESH_MS = 10_000;

export default function HeatGridPage() {
  const [data, setData] = useState<HeatGridResponse | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  const reload = useCallback(async () => {
    setErrorMsg(null);
    try {
      const res = await platformApi.get<HeatGridResponse>(
        "/api/admin/control-room/heat-grid",
      );
      setData(res.data);
      setLastFetched(new Date());
      setStatus("ready");
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setErrorMsg(err.response?.data?.message ?? "تعذّر جلب شبكة الحرارة.");
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(reload, REFRESH_MS);
    return () => clearInterval(id);
  }, [autoRefresh, reload]);

  return (
    <>
      <Head>
        <title>غرفة التحكّم — شبكة الحرارة</title>
      </Head>
      <main className="min-h-screen bg-gray-50 p-6" dir="rtl">
        <div className="max-w-7xl mx-auto">
          <header className="mb-6">
            <Link
              href="/admin/control-room"
              className="text-sm text-gray-500 hover:text-gray-700 inline-flex items-center gap-1 mb-2"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>غرفة التحكّم</span>
            </Link>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold mb-1 flex items-center gap-2">
                  <Flame className="w-7 h-7 text-orange-500" />
                  <span>شبكة حرارة المزادات الحيّة</span>
                </h1>
                <p className="text-gray-600 text-sm">
                  ترتيب البثوث الحيّة حسب درجة الحرارة (المزايدات الأخيرة +
                  المشاهدون). تحدّث تلقائي كل {REFRESH_MS / 1000} ثانية.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                    className="rounded"
                  />
                  <span>تحديث تلقائي</span>
                </label>
                <button
                  onClick={reload}
                  disabled={status === "loading"}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 border rounded text-sm hover:bg-white disabled:opacity-50"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${status === "loading" ? "animate-spin" : ""}`}
                  />
                  <span>تحديث</span>
                </button>
              </div>
            </div>
            {lastFetched && (
              <p className="text-xs text-gray-400 mt-2">
                آخر تحديث:{" "}
                {lastFetched.toLocaleTimeString("ar-SA", { hour12: false })}
              </p>
            )}
          </header>

          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {status === "loading" && !data && (
            <div className="p-10 bg-white rounded-lg border flex items-center justify-center text-gray-500">
              <RefreshCw className="w-5 h-5 animate-spin mr-2" />
              <span>جاري التحميل…</span>
            </div>
          )}

          {data && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <KpiCard
                  label="بثوث حيّة"
                  value={data.totals.live_count}
                  icon={<Radio className="w-5 h-5 text-blue-600" />}
                />
                <KpiCard
                  label="حارّة (≥80)"
                  value={data.totals.hot_count}
                  icon={<Flame className="w-5 h-5 text-orange-500" />}
                  highlight={data.totals.hot_count > 0}
                />
                <KpiCard
                  label="إجمالي المشاهدين"
                  value={data.totals.total_viewers}
                  icon={<Eye className="w-5 h-5 text-gray-600" />}
                />
                <KpiCard
                  label="مزايدات آخر 5د"
                  value={data.totals.total_bids_5min}
                  icon={<Activity className="w-5 h-5 text-green-600" />}
                />
              </div>

              {data.broadcasts.length === 0 ? (
                <div className="p-10 bg-white rounded-lg border text-center text-gray-500">
                  <Radio className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>لا توجد بثوث حيّة حالياً.</p>
                </div>
              ) : (
                <div className="bg-white rounded-lg border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-600 text-right">
                      <tr>
                        <th className="px-4 py-3 font-medium w-16">حرارة</th>
                        <th className="px-4 py-3 font-medium">العنوان</th>
                        <th className="px-4 py-3 font-medium">المعرض</th>
                        <th className="px-4 py-3 font-medium text-center">
                          مشاهدون
                        </th>
                        <th className="px-4 py-3 font-medium text-center">
                          5د / ساعة
                        </th>
                        <th className="px-4 py-3 font-medium text-center">
                          المزاد
                        </th>
                        <th className="px-4 py-3 font-medium text-center">
                          مدّة البث
                        </th>
                        <th className="px-4 py-3 font-medium"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {data.broadcasts.map((b) => (
                        <BroadcastRow key={b.id} item={b} />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </>
  );
}

function BroadcastRow({ item }: { item: HeatItem }) {
  return (
    <tr className={item.is_hot ? "bg-amber-50" : "hover:bg-gray-50"}>
      <td className="px-4 py-3 font-bold text-center">
        <div
          className={`inline-flex items-center gap-1 px-2 py-1 rounded ${heatPillClass(item.heat_score)}`}
        >
          {item.is_hot && <Flame className="w-3.5 h-3.5" />}
          <span>{item.heat_score}</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <p className="font-medium">{item.title}</p>
        {item.auction?.title && (
          <p className="text-xs text-gray-500 truncate max-w-xs">
            {item.auction.title}
          </p>
        )}
      </td>
      <td className="px-4 py-3 text-gray-600 text-xs">
        {item.creator?.organization ?? item.creator?.email ?? "—"}
      </td>
      <td className="px-4 py-3 text-center">
        <span className="inline-flex items-center gap-1">
          <Eye className="w-3.5 h-3.5 text-gray-400" />
          <span>{item.viewers_now.toLocaleString("ar-SA")}</span>
        </span>
      </td>
      <td className="px-4 py-3 text-center">
        <span className="inline-flex items-center gap-1 text-xs">
          <Activity className="w-3.5 h-3.5 text-gray-400" />
          <span className="font-semibold">{item.bids_last_5min}</span>
          <span className="text-gray-400">/</span>
          <span>{item.bids_last_hour}</span>
        </span>
      </td>
      <td className="px-4 py-3 text-center">
        {item.auction ? (
          <span className="inline-flex items-center gap-1 text-xs">
            <Gavel className="w-3.5 h-3.5 text-gray-400" />
            <span>
              {item.auction.current_bid
                ? `${Number(item.auction.current_bid).toLocaleString("ar-SA")} ر.س`
                : "—"}
            </span>
          </span>
        ) : (
          <span className="text-gray-400">—</span>
        )}
      </td>
      <td className="px-4 py-3 text-center text-gray-500 text-xs">
        {formatLiveDuration(item.minutes_live)}
      </td>
      <td className="px-4 py-3 text-left">
        <Link
          href={`/admin/control-room/heat-grid/broadcast/${item.id}`}
          className="text-blue-600 hover:underline text-xs"
        >
          تفاصيل ←
        </Link>
      </td>
    </tr>
  );
}

function KpiCard({
  label,
  value,
  icon,
  highlight,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div
      className={`bg-white border rounded-lg p-4 ${highlight ? "border-orange-300 ring-1 ring-orange-200" : ""}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-500">{label}</span>
        {icon}
      </div>
      <p className="text-2xl font-bold text-gray-900">
        {value.toLocaleString("ar-SA")}
      </p>
    </div>
  );
}

function heatPillClass(score: number): string {
  if (score >= 80) return "bg-orange-500 text-white";
  if (score >= 60) return "bg-orange-100 text-orange-700";
  if (score >= 40) return "bg-yellow-100 text-yellow-700";
  if (score >= 20) return "bg-blue-100 text-blue-700";
  return "bg-gray-100 text-gray-600";
}

function formatLiveDuration(minutes: number): string {
  if (minutes < 1) return "بدأ الآن";
  if (minutes < 60) return `${minutes} د`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h} س ${m} د` : `${h} س`;
}
