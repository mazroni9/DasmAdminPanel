import { useEffect, useState } from "react";
import Head from "next/head";
import platformApi from "@/lib/platformApi";
import {
  Activity,
  AlertTriangle,
  Eye,
  Radio,
  TrendingUp,
  Users,
  RefreshCw,
  ExternalLink,
} from "lucide-react";

/**
 * Admin monitoring dashboard.
 *
 * Consumes the DASM-backend PostHog proxy introduced in
 * DASM-Platform#578:
 *   GET /api/admin/analytics/summary
 *   GET /api/admin/analytics/top-pages
 *   GET /api/admin/analytics/live-broadcasts
 *
 * When POSTHOG_PERSONAL_API_KEY isn't set on Render, PostHog-derived
 * KPIs show 0 but the page still works — the banner explains why.
 */

interface Summary {
  range_hours: number;
  posthog_configured: boolean;
  kpis: {
    active_broadcasts: number;
    active_exhibitor_channels: number;
    unique_visitors: number;
    errors: number;
    logins_completed: number;
    onboarding_completed: number;
  };
}

interface TopPagesRow {
  path: string;
  views: number;
}

interface LiveBroadcast {
  id: number;
  title: string;
  auction_id?: number | null;
  provider?: string;
  started_at?: string;
  creator?: { id: number; name: string } | null;
}

export default function AdminMonitoringPage() {
  const [hours, setHours] = useState(24);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [topPages, setTopPages] = useState<TopPagesRow[]>([]);
  const [broadcasts, setBroadcasts] = useState<LiveBroadcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, p, b] = await Promise.all([
        platformApi.get<Summary>("/api/admin/analytics/summary", {
          params: { hours },
        }),
        platformApi.get<{
          range_hours: number;
          posthog_configured: boolean;
          pages: { rows: Array<[string, number]>; columns: string[] };
        }>("/api/admin/analytics/top-pages", { params: { hours, limit: 10 } }),
        platformApi.get<{ broadcasts: LiveBroadcast[] }>(
          "/api/admin/analytics/live-broadcasts",
        ),
      ]);

      setSummary(s.data);
      setTopPages(
        (p.data.pages.rows ?? []).map(
          ([path, views]) => ({ path, views }) as TopPagesRow,
        ),
      );
      setBroadcasts(b.data.broadcasts ?? []);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? "فشل التحميل");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hours]);

  return (
    <>
      <Head>
        <title>مراقبة المنصّة — DASM Admin</title>
      </Head>

      <div className="p-6 max-w-7xl mx-auto" dir="rtl">
        <header className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">مراقبة المنصّة</h1>
            <p className="text-sm text-gray-500 mt-1">
              نظرة لحظية على ترافيك داسم (PostHog) + البثوث الحيّة من قاعدة
              البيانات.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={hours}
              onChange={(e) => setHours(Number(e.target.value))}
              className="px-3 py-2 border rounded-md text-sm bg-white"
            >
              <option value={1}>آخر ساعة</option>
              <option value={24}>آخر 24 ساعة</option>
              <option value={72}>آخر 3 أيام</option>
              <option value={168}>آخر 7 أيام</option>
            </select>
            <button
              onClick={load}
              disabled={loading}
              className="px-3 py-2 bg-gray-900 text-white rounded-md text-sm flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />
              <span>تحديث</span>
            </button>
          </div>
        </header>

        {summary && !summary.posthog_configured && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
            ⚠️ لم يُفعَّل ربط PostHog بعد (ناقص{" "}
            <code className="bg-amber-100 px-1 rounded">
              POSTHOG_PERSONAL_API_KEY
            </code>{" "}
            على Render). أرقام الترافيك والأخطاء تظهر صفراً، لكن البثوث الحيّة
            والقنوات تعمل من DB.
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        {/* KPI strip */}
        <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          <Kpi
            icon={<Radio className="w-5 h-5" />}
            label="بثوث حيّة الآن"
            value={summary?.kpis.active_broadcasts ?? 0}
            tone="live"
            loading={loading}
          />
          <Kpi
            icon={<Activity className="w-5 h-5" />}
            label="قنوات معارض مفعّلة"
            value={summary?.kpis.active_exhibitor_channels ?? 0}
            loading={loading}
          />
          <Kpi
            icon={<Users className="w-5 h-5" />}
            label="زوار فريدون"
            value={summary?.kpis.unique_visitors ?? 0}
            loading={loading}
            dim={!summary?.posthog_configured}
          />
          <Kpi
            icon={<AlertTriangle className="w-5 h-5" />}
            label="أخطاء"
            value={summary?.kpis.errors ?? 0}
            tone={
              (summary?.kpis.errors ?? 0) > 0 ? "warn" : "ok"
            }
            loading={loading}
            dim={!summary?.posthog_configured}
          />
          <Kpi
            icon={<TrendingUp className="w-5 h-5" />}
            label="تسجيلات دخول"
            value={summary?.kpis.logins_completed ?? 0}
            loading={loading}
            dim={!summary?.posthog_configured}
          />
          <Kpi
            icon={<Eye className="w-5 h-5" />}
            label="تفعيل معارض جدد"
            value={summary?.kpis.onboarding_completed ?? 0}
            loading={loading}
            dim={!summary?.posthog_configured}
          />
        </section>

        {/* Two columns: top pages + live broadcasts */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Panel title="أكثر الصفحات زيارة" empty="لا توجد زيارات بعد.">
            {topPages.length === 0 && summary?.posthog_configured === false ? (
              <p className="text-sm text-gray-500 p-4">
                بحاجة لتفعيل PostHog أولاً.
              </p>
            ) : (
              <ul className="divide-y">
                {topPages.map((row) => (
                  <li
                    key={row.path}
                    className="flex items-center justify-between py-2.5 px-4 text-sm"
                  >
                    <code className="font-mono text-gray-700 truncate ml-3">
                      {row.path || "/"}
                    </code>
                    <span className="font-semibold tabular-nums">
                      {row.views.toLocaleString("ar-SA")}
                    </span>
                  </li>
                ))}
                {topPages.length === 0 && (
                  <li className="p-4 text-sm text-gray-500">لا توجد بيانات.</li>
                )}
              </ul>
            )}
          </Panel>

          <Panel title="البثوث الحيّة الآن">
            {broadcasts.length === 0 ? (
              <p className="text-sm text-gray-500 p-4">لا توجد بثوث نشطة.</p>
            ) : (
              <ul className="divide-y">
                {broadcasts.map((b) => (
                  <li key={b.id} className="p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{b.title}</span>
                      <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-bold">
                        LIVE
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1 flex gap-3">
                      {b.provider && <span>#{b.provider}</span>}
                      {b.creator && <span>{b.creator.name}</span>}
                      {b.auction_id && <span>مزاد #{b.auction_id}</span>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </section>

        <footer className="mt-8 text-xs text-gray-400 flex items-center gap-2">
          <span>
            للتفاصيل العميقة (funnels، recordings، A/B):
          </span>
          <a
            href="https://us.posthog.com/project/387336"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline flex items-center gap-1"
          >
            افتح PostHog <ExternalLink className="w-3 h-3" />
          </a>
        </footer>
      </div>
    </>
  );
}

function Kpi({
  icon,
  label,
  value,
  tone = "default",
  loading,
  dim,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone?: "default" | "live" | "ok" | "warn";
  loading?: boolean;
  dim?: boolean;
}) {
  const color =
    tone === "live"
      ? "text-red-600"
      : tone === "warn"
        ? "text-amber-600"
        : tone === "ok"
          ? "text-green-600"
          : "text-gray-900";

  return (
    <div
      className={`p-4 bg-white rounded-lg border ${dim ? "opacity-50" : ""}`}
    >
      <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
        {icon}
        <span>{label}</span>
      </div>
      <div className={`text-2xl font-bold ${color} tabular-nums`}>
        {loading ? (
          <span className="inline-block w-16 h-6 bg-gray-100 rounded animate-pulse" />
        ) : (
          value.toLocaleString("ar-SA")
        )}
      </div>
    </div>
  );
}

function Panel({
  title,
  children,
  empty,
}: {
  title: string;
  children: React.ReactNode;
  empty?: string;
}) {
  return (
    <div className="bg-white rounded-lg border">
      <header className="px-4 py-3 border-b">
        <h2 className="font-semibold text-sm">{title}</h2>
      </header>
      <div>{children}</div>
    </div>
  );
}
