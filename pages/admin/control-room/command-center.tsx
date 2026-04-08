import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { ControlRoomShell } from "@/components/control-room/ControlRoomShell";
import { ControlRoomGate } from "@/components/control-room/ControlRoomGate";
import { PLATFORMS, INTERNAL_LINKS, type Platform } from "@/lib/platforms";
import dasmBff from "@/lib/dasmBffClient";

/* ─────────── Types ─────────── */

interface PlatformHealth {
  id: string;
  status: "online" | "degraded" | "offline";
  latency?: number;
  lastCheck: string;
}

interface DashboardStats {
  totalUsers: number;
  activeAuctions: number;
  totalStores: number;
  activeStores: number;
  pendingOrders: number;
  totalShipments: number;
  pendingInspections: number;
  todayRevenue: number;
}

/* ─────────── Component ─────────── */

export default function CommandCenterPage() {
  const [health, setHealth] = useState<PlatformHealth[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  useEffect(() => {
    loadAll();
    const interval = setInterval(loadAll, 60_000); // تحديث كل دقيقة
    return () => clearInterval(interval);
  }, []);

  const loadAll = async () => {
    setLoading(true);
    await Promise.allSettled([checkHealth(), loadStats()]);
    setLastRefresh(new Date());
    setLoading(false);
  };

  const checkHealth = async () => {
    const results: PlatformHealth[] = [];
    for (const p of PLATFORMS) {
      const start = Date.now();
      try {
        const endpoint =
          p.id === "dasm" || p.id === "stores" || p.id === "shipping" || p.id === "inspection"
            ? `${p.apiUrl}/api/health`
            : `${p.url}`;
        const resp = await fetch(endpoint, { signal: AbortSignal.timeout(8000) });
        results.push({
          id: p.id,
          status: resp.ok ? "online" : "degraded",
          latency: Date.now() - start,
          lastCheck: new Date().toISOString(),
        });
      } catch {
        results.push({
          id: p.id,
          status: "offline",
          latency: Date.now() - start,
          lastCheck: new Date().toISOString(),
        });
      }
    }
    setHealth(results);
  };

  const loadStats = async () => {
    try {
      const [storesRes, monitorRes] = await Promise.allSettled([
        dasmBff.get("/stores/public/explore?per_page=1"),
        dasmBff.get("/admin/monitoring/summary"),
      ]);

      setStats({
        totalUsers: 0,
        activeAuctions: 0,
        totalStores: 0,
        activeStores: 0,
        pendingOrders: 0,
        totalShipments: 0,
        pendingInspections: 0,
        todayRevenue: 0,
        ...(monitorRes.status === "fulfilled" ? monitorRes.value.data : {}),
      });
    } catch {
      /* skip */
    }
  };

  const getHealth = (id: string) => health.find((h) => h.id === id);

  const statusColor = (s?: string) => {
    if (s === "online") return "bg-green-500";
    if (s === "degraded") return "bg-yellow-500";
    return "bg-red-500";
  };

  const statusLabel = (s?: string) => {
    if (s === "online") return "يعمل";
    if (s === "degraded") return "بطيء";
    return "متوقف";
  };

  return (
    <ControlRoomGate>
      {(access) => (
      <ControlRoomShell access={access}>
        <Head>
          <title>مركز القيادة — الكنترول روم</title>
        </Head>

        <div className="space-y-6 rtl">
          {/* ═══ Header ═══ */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">🛡️ مركز القيادة المركزي</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                مراقبة جميع منصات داسم — مصدر الحقيقة الوحيد
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400">
                آخر تحديث: {lastRefresh.toLocaleTimeString("ar-SA")}
              </span>
              <button
                onClick={loadAll}
                disabled={loading}
                className="px-3 py-1.5 bg-slate-800 text-white text-xs rounded-lg hover:bg-slate-700 disabled:opacity-50"
              >
                {loading ? "جاري..." : "🔄 تحديث"}
              </button>
            </div>
          </div>

          {/* ═══ حالة المنصات ═══ */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {PLATFORMS.map((p) => {
              const h = getHealth(p.id);
              return (
                <a
                  key={p.id}
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{p.icon}</span>
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${statusColor(h?.status)} ${h?.status === "online" ? "animate-pulse" : ""}`} />
                      <span className="text-[10px] text-gray-500">{statusLabel(h?.status)}</span>
                    </div>
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 group-hover:text-blue-600">{p.name}</h3>
                  <p className="text-[11px] text-gray-400 mt-0.5">{p.description}</p>
                  {h?.latency && (
                    <span className="text-[10px] text-gray-300 mt-1 block">{h.latency}ms</span>
                  )}
                </a>
              );
            })}
          </div>

          {/* ═══ روابط سريعة — لوحات المراقبة ═══ */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-bold text-gray-900 mb-4">⚡ روابط سريعة — لوحات المراقبة</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "لوحة أدمن داسم", href: INTERNAL_LINKS.dasmAdmin, icon: "🏛️", color: "bg-blue-50 text-blue-700 hover:bg-blue-100" },
                { label: "غرفة التحكم (داسم)", href: INTERNAL_LINKS.dasmControlRoom, icon: "🎛️", color: "bg-slate-50 text-slate-700 hover:bg-slate-100" },
                { label: "مركز الأمان", href: INTERNAL_LINKS.dasmSecurityCenter, icon: "🔒", color: "bg-red-50 text-red-700 hover:bg-red-100" },
                { label: "المراقبة الحية", href: INTERNAL_LINKS.dasmMonitoring, icon: "📡", color: "bg-green-50 text-green-700 hover:bg-green-100" },
                { label: "متاجر داسم", href: INTERNAL_LINKS.storesExplore, icon: "🏪", color: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" },
                { label: "لوحة الشحن", href: INTERNAL_LINKS.shippingDashboard, icon: "🚚", color: "bg-purple-50 text-purple-700 hover:bg-purple-100" },
                { label: "لوحة الفحص", href: INTERNAL_LINKS.inspectionDashboard, icon: "🔍", color: "bg-orange-50 text-orange-700 hover:bg-orange-100" },
                { label: "GitHub", href: INTERNAL_LINKS.github, icon: "🐙", color: "bg-gray-50 text-gray-700 hover:bg-gray-100" },
                { label: "Vercel", href: INTERNAL_LINKS.vercel, icon: "▲", color: "bg-gray-50 text-gray-700 hover:bg-gray-100" },
                { label: "Render", href: INTERNAL_LINKS.render, icon: "🖥️", color: "bg-gray-50 text-gray-700 hover:bg-gray-100" },
                { label: "Supabase", href: INTERNAL_LINKS.supabase, icon: "⚡", color: "bg-green-50 text-green-700 hover:bg-green-100" },
                { label: "Cloudflare", href: INTERNAL_LINKS.cloudflare, icon: "☁️", color: "bg-orange-50 text-orange-700 hover:bg-orange-100" },
              ].map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium transition ${link.color}`}
                >
                  <span className="text-base">{link.icon}</span>
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          {/* ═══ المنصات التفصيلية ═══ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* داسم الرئيسية */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">🏛️</span>
                <h3 className="text-sm font-bold text-gray-900">داسم الرئيسية</h3>
                <span className={`w-2 h-2 rounded-full ${statusColor(getHealth("dasm")?.status)}`} />
              </div>
              <div className="space-y-2 text-xs">
                <a href="/admin/control-room/monitoring" className="flex items-center justify-between py-1.5 px-2 bg-gray-50 rounded-lg hover:bg-gray-100">
                  <span>📡 المراقبة الحية</span><span className="text-gray-400">→</span>
                </a>
                <a href="/admin/control-room/approval-requests" className="flex items-center justify-between py-1.5 px-2 bg-gray-50 rounded-lg hover:bg-gray-100">
                  <span>✅ طابور الموافقات</span><span className="text-gray-400">→</span>
                </a>
                <a href="/admin/control-room/activities" className="flex items-center justify-between py-1.5 px-2 bg-gray-50 rounded-lg hover:bg-gray-100">
                  <span>📋 سجل العمليات</span><span className="text-gray-400">→</span>
                </a>
                <a href="/admin/control-room/smart-alerts" className="flex items-center justify-between py-1.5 px-2 bg-gray-50 rounded-lg hover:bg-gray-100">
                  <span>🤖 التنبيهات الذكية</span><span className="text-gray-400">→</span>
                </a>
                <a href="/auctions" className="flex items-center justify-between py-1.5 px-2 bg-gray-50 rounded-lg hover:bg-gray-100">
                  <span>🔨 المزادات</span><span className="text-gray-400">→</span>
                </a>
                <a href="/live-stream" className="flex items-center justify-between py-1.5 px-2 bg-gray-50 rounded-lg hover:bg-gray-100">
                  <span>📺 البث المباشر</span><span className="text-gray-400">→</span>
                </a>
              </div>
            </div>

            {/* متاجر داسم */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">🏪</span>
                <h3 className="text-sm font-bold text-gray-900">متاجر داسم</h3>
                <span className={`w-2 h-2 rounded-full ${statusColor(getHealth("stores")?.status)}`} />
              </div>
              <div className="space-y-2 text-xs">
                <a href="/admin/control-room/stores" className="flex items-center justify-between py-1.5 px-2 bg-gray-50 rounded-lg hover:bg-gray-100">
                  <span>🏪 إدارة المتاجر</span><span className="text-gray-400">→</span>
                </a>
                <a href="/admin/control-room/ecommerce" className="flex items-center justify-between py-1.5 px-2 bg-gray-50 rounded-lg hover:bg-gray-100">
                  <span>📊 إحصائيات التجارة</span><span className="text-gray-400">→</span>
                </a>
                <a href={INTERNAL_LINKS.storesExplore} target="_blank" rel="noopener" className="flex items-center justify-between py-1.5 px-2 bg-emerald-50 rounded-lg hover:bg-emerald-100 text-emerald-700">
                  <span>🌐 تصفح المتاجر (خارجي)</span><span>↗</span>
                </a>
              </div>
            </div>

            {/* الشحن */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">🚚</span>
                <h3 className="text-sm font-bold text-gray-900">شحن داسم</h3>
                <span className={`w-2 h-2 rounded-full ${statusColor(getHealth("shipping")?.status)}`} />
              </div>
              <div className="space-y-2 text-xs">
                <a href={INTERNAL_LINKS.shippingDashboard} target="_blank" rel="noopener" className="flex items-center justify-between py-1.5 px-2 bg-purple-50 rounded-lg hover:bg-purple-100 text-purple-700">
                  <span>📦 لوحة الشحن</span><span>↗</span>
                </a>
              </div>
            </div>

            {/* الفحص */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">🔍</span>
                <h3 className="text-sm font-bold text-gray-900">فحص داسم</h3>
                <span className={`w-2 h-2 rounded-full ${statusColor(getHealth("inspection")?.status)}`} />
              </div>
              <div className="space-y-2 text-xs">
                <a href={INTERNAL_LINKS.inspectionDashboard} target="_blank" rel="noopener" className="flex items-center justify-between py-1.5 px-2 bg-orange-50 rounded-lg hover:bg-orange-100 text-orange-700">
                  <span>🔧 لوحة الفحص</span><span>↗</span>
                </a>
              </div>
            </div>
          </div>

          {/* ═══ بنية المنظومة ═══ */}
          <div className="bg-slate-900 rounded-xl p-6 text-white">
            <h2 className="text-sm font-bold mb-3">🏗️ بنية منظومة داسم</h2>
            <div className="font-mono text-[11px] text-slate-300 leading-relaxed whitespace-pre">{`
┌─────────────────────────────────────────────────────┐
│           🛡️  الكنترول روم (أنت هنا)               │
│         control.dasm.com.sa — مركز القيادة          │
├──────────┬──────────┬──────────┬──────────┬─────────┤
│ 🏛️ داسم  │ 🏪 متاجر │ 🚚 شحن  │ 🔍 فحص  │ 📺 بث  │
│ dasm.com │ store.   │ shipping │ inspect  │ stream  │
│ .sa      │ dasm.com │ .dasm.   │ ion.dasm │ .dasm.  │
│          │ .sa      │ com.sa   │ .com.sa  │ com.sa  │
├──────────┴──────────┴──────────┴──────────┴─────────┤
│              🔌 API Layer (api.dasm.com.sa)          │
│           Laravel 12 + Sanctum + Platform Keys      │
├─────────────────────────────────────────────────────┤
│          ⚡ Supabase PostgreSQL (مشتركة)             │
│        Render (Backend) + Vercel (Frontends)        │
└─────────────────────────────────────────────────────┘`}</div>
          </div>
        </div>
      </ControlRoomShell>
      )}
    </ControlRoomGate>
  );
}
