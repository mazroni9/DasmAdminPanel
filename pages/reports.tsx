import { useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout";
import {
  ArrowDownTrayIcon,
  ChartBarIcon,
  DocumentTextIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { apiFetch, extractErrorMessage } from "../utils/api";

type ReportType = "users" | "auctions" | "revenue" | "all";

interface ReportFilter {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  type: ReportType;
}

type AnyObj = Record<string, any>;

type ReportSaved = {
  id: string;
  name: string;
  type: ReportType;
  createdAt: string; // ISO
  filter: ReportFilter;
  summary: AnyObj;
  rowsPreview?: AnyObj[];
};

const STORAGE_KEY = "dasm_admin_reports_v1";

function yyyyMmDd(d: Date) {
  return d.toISOString().split("T")[0];
}

function toStartOfDay(dateStr: string) {
  return new Date(`${dateStr}T00:00:00`);
}
function toEndOfDay(dateStr: string) {
  return new Date(`${dateStr}T23:59:59`);
}

function normalizeListResponse(res: any): AnyObj[] {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.data?.data)) return res.data.data;
  if (Array.isArray(res?.items)) return res.items;
  return [];
}

function tryGetDate(obj: AnyObj): Date | null {
  const candidates = [
    "created_at",
    "createdAt",
    "start_time",
    "startTime",
    "date",
    "paid_at",
    "paidAt",
    "updated_at",
    "updatedAt",
    "ended_at",
    "endedAt",
  ];

  for (const k of candidates) {
    const v = obj?.[k];
    if (!v) continue;
    const d = new Date(v);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return null;
}

function toNumber(v: any): number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const cleaned = v.replace(/[^\d.-]/g, "");
    if (!cleaned) return null;
    const n = Number(cleaned);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function downloadTextFile(filename: string, content: string, mime = "text/plain") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** ✅ FIX: explicit reduce generic so TS knows it's Set<string> */
function toCsv(rows: AnyObj[]) {
  if (!Array.isArray(rows) || rows.length === 0) return "No data";

  const headersSet = rows.reduce<Set<string>>((acc, row) => {
    if (row && typeof row === "object") {
      Object.keys(row).forEach((k) => acc.add(k));
    }
    return acc;
  }, new Set<string>());

  const headers = Array.from(headersSet);

  const esc = (val: any) => {
    const s = val === null || val === undefined ? "" : String(val);
    const needs = /[",\n]/.test(s);
    const safe = s.replace(/"/g, '""');
    return needs ? `"${safe}"` : safe;
  };

  const lines = [
    headers.map(esc).join(","),
    ...rows.map((r) => headers.map((h) => esc((r as AnyObj)?.[h])).join(",")),
  ];
  return lines.join("\n");
}

export default function Reports() {
  const today = useMemo(() => new Date(), []);
  const [filter, setFilter] = useState<ReportFilter>({
    startDate: yyyyMmDd(today),
    endDate: yyyyMmDd(today),
    type: "all",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [summary, setSummary] = useState<AnyObj | null>(null);
  const [rows, setRows] = useState<AnyObj[]>([]);
  const [activeView, setActiveView] = useState<"summary" | "rows">("summary");

  const [saved, setSaved] = useState<ReportSaved[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) setSaved(parsed);
    } catch {
      // ignore
    }
  }, []);

  function persistSaved(next: ReportSaved[]) {
    setSaved(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  }

  function presetRange(preset: "today" | "7d" | "30d" | "month") {
    const now = new Date();
    if (preset === "today") {
      setFilter((f) => ({ ...f, startDate: yyyyMmDd(now), endDate: yyyyMmDd(now) }));
      return;
    }
    if (preset === "7d") {
      const start = new Date(now);
      start.setDate(start.getDate() - 6);
      setFilter((f) => ({ ...f, startDate: yyyyMmDd(start), endDate: yyyyMmDd(now) }));
      return;
    }
    if (preset === "30d") {
      const start = new Date(now);
      start.setDate(start.getDate() - 29);
      setFilter((f) => ({ ...f, startDate: yyyyMmDd(start), endDate: yyyyMmDd(now) }));
      return;
    }
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    setFilter((f) => ({ ...f, startDate: yyyyMmDd(start), endDate: yyyyMmDd(now) }));
  }

  const dateRangeOk = useMemo(() => {
    const s = toStartOfDay(filter.startDate).getTime();
    const e = toEndOfDay(filter.endDate).getTime();
    return s <= e;
  }, [filter.startDate, filter.endDate]);

  async function fetchUsers(): Promise<AnyObj[]> {
    const res = await apiFetch<any>("/admin/users", { method: "GET" });
    return normalizeListResponse(res);
  }

  async function fetchAuctions(): Promise<AnyObj[]> {
    try {
      const res = await apiFetch<any>("/admin/auctions", { method: "GET" });
      const list = normalizeListResponse(res);
      return list;
    } catch {
      const res2 = await apiFetch<any>("/auctions", { method: "GET" });
      return normalizeListResponse(res2);
    }
  }

  async function fetchRevenueRows(): Promise<AnyObj[]> {
    try {
      const res = await apiFetch<any>("/admin/transactions", { method: "GET" });
      const list = normalizeListResponse(res);
      if (list.length) return list;
    } catch {
      // ignore
    }
    try {
      const res2 = await apiFetch<any>("/admin/settlements", { method: "GET" });
      return normalizeListResponse(res2);
    } catch {
      return [];
    }
  }

  function filterByDateRange(list: AnyObj[]): AnyObj[] {
    const start = toStartOfDay(filter.startDate).getTime();
    const end = toEndOfDay(filter.endDate).getTime();
    return list.filter((x) => {
      const d = tryGetDate(x);
      if (!d) return true;
      const t = d.getTime();
      return t >= start && t <= end;
    });
  }

  function buildUsersSummary(list: AnyObj[]) {
    const total = list.length;

    const activeCount = list.filter((u) => {
      const v = u?.is_active ?? u?.active ?? u?.status;
      if (typeof v === "boolean") return v;
      if (typeof v === "string") return v.toLowerCase() === "active";
      if (typeof v === "number") return v === 1;
      return false;
    }).length;

    const roles = list.reduce((acc: Record<string, number>, u) => {
      const r = String(u?.type ?? u?.role ?? "unknown");
      acc[r] = (acc[r] || 0) + 1;
      return acc;
    }, {});

    return { totalUsers: total, activeUsers: activeCount, roles };
  }

  function buildAuctionsSummary(list: AnyObj[]) {
    const total = list.length;

    const statusCounts = list.reduce((acc: Record<string, number>, a) => {
      const s = String(a?.status ?? a?.state ?? a?.auction_status ?? "unknown");
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    }, {});

    const prices = list
      .map((a) => toNumber(a?.current_price ?? a?.currentPrice ?? a?.open_price ?? a?.start_price))
      .filter((n): n is number => typeof n === "number");

    const avgPrice = prices.length ? prices.reduce((s, x) => s + x, 0) / prices.length : 0;

    return { totalAuctions: total, statusCounts, avgPrice: Math.round(avgPrice * 100) / 100 };
  }

  function buildRevenueSummary(list: AnyObj[]) {
    const amounts = list
      .map((t) =>
        toNumber(
          t?.amount ??
            t?.total ??
            t?.value ??
            t?.paid_amount ??
            t?.commission ??
            t?.net_amount ??
            t?.gross_amount
        )
      )
      .filter((n): n is number => typeof n === "number");

    const sum = amounts.reduce((s, x) => s + x, 0);

    return {
      transactions: list.length,
      totalAmount: Math.round(sum * 100) / 100,
      currency: "SAR",
    };
  }

  async function handleGenerateReport() {
    if (!dateRangeOk) {
      setError("مدى التاريخ غير صحيح — تأكد أن تاريخ البداية <= تاريخ النهاية");
      return;
    }

    setLoading(true);
    setError(null);
    setSummary(null);
    setRows([]);
    setActiveView("summary");

    try {
      let localSummary: AnyObj | null = null;
      let localRows: AnyObj[] = [];

      if (filter.type === "users") {
        const u = filterByDateRange(await fetchUsers());
        localSummary = buildUsersSummary(u);
        localRows = u.slice(0, 200);
      } else if (filter.type === "auctions") {
        const a = filterByDateRange(await fetchAuctions());
        localSummary = buildAuctionsSummary(a);
        localRows = a.slice(0, 200);
      } else if (filter.type === "revenue") {
        const r = filterByDateRange(await fetchRevenueRows());
        localSummary = buildRevenueSummary(r);
        localRows = r.slice(0, 200);
      } else {
        const [u0, a0, r0] = await Promise.all([fetchUsers(), fetchAuctions(), fetchRevenueRows()]);
        const u = filterByDateRange(u0);
        const a = filterByDateRange(a0);
        const r = filterByDateRange(r0);

        localSummary = {
          users: buildUsersSummary(u),
          auctions: buildAuctionsSummary(a),
          revenue: buildRevenueSummary(r),
        };

        localRows = [
          ...u.slice(0, 60).map((x) => ({ __type: "user", ...x })),
          ...a.slice(0, 60).map((x) => ({ __type: "auction", ...x })),
          ...r.slice(0, 60).map((x) => ({ __type: "revenue", ...x })),
        ];
      }

      setSummary(localSummary);
      setRows(localRows);
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  function saveCurrentToHistory() {
    if (!summary) return;

    const now = new Date();
    const item: ReportSaved = {
      id: `${now.getTime()}_${Math.random().toString(16).slice(2)}`,
      name: `تقرير ${filter.type} (${filter.startDate} → ${filter.endDate})`,
      type: filter.type,
      createdAt: now.toISOString(),
      filter: { ...filter },
      summary,
      rowsPreview: rows.slice(0, 30),
    };

    const next = [item, ...saved].slice(0, 30);
    persistSaved(next);
  }

  function deleteSaved(id: string) {
    persistSaved(saved.filter((x) => x.id !== id));
  }

  function loadSaved(r: ReportSaved) {
    setFilter(r.filter);
    setSummary(r.summary);
    setRows(r.rowsPreview || []);
    setActiveView("summary");
    setError(null);
  }

  function exportJson() {
    if (!summary) return;
    const payload = {
      filter,
      generatedAt: new Date().toISOString(),
      summary,
      previewRows: rows,
    };
    downloadTextFile(
      `report_${filter.type}_${filter.startDate}_to_${filter.endDate}.json`,
      JSON.stringify(payload, null, 2),
      "application/json"
    );
  }

  function exportCsv() {
    const safeRows = rows.length ? rows : [];
    downloadTextFile(
      `report_${filter.type}_${filter.startDate}_to_${filter.endDate}.csv`,
      toCsv(safeRows),
      "text/csv"
    );
  }

  const summaryCards = useMemo(() => {
    if (!summary) return [];
    const cards: { title: string; value: string; hint?: string }[] = [];

    if (filter.type === "users") {
      cards.push({ title: "إجمالي المستخدمين", value: String(summary.totalUsers ?? 0) });
      cards.push({ title: "مستخدمين نشطين", value: String(summary.activeUsers ?? 0) });
    } else if (filter.type === "auctions") {
      cards.push({ title: "إجمالي المزادات", value: String(summary.totalAuctions ?? 0) });
      cards.push({ title: "متوسط السعر", value: `${summary.avgPrice ?? 0} SAR` });
    } else if (filter.type === "revenue") {
      cards.push({ title: "عدد المعاملات", value: String(summary.transactions ?? 0) });
      cards.push({ title: "الإجمالي", value: `${summary.totalAmount ?? 0} ${summary.currency ?? "SAR"}` });
    } else {
      cards.push({ title: "إجمالي المستخدمين", value: String(summary?.users?.totalUsers ?? 0) });
      cards.push({ title: "إجمالي المزادات", value: String(summary?.auctions?.totalAuctions ?? 0) });
      cards.push({ title: "إجمالي الإيراد", value: `${summary?.revenue?.totalAmount ?? 0} ${summary?.revenue?.currency ?? "SAR"}` });
    }

    return cards;
  }, [summary, filter.type]);

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50/50 p-4 sm:p-6 lg:p-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          {/* Header */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <ChartBarIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">التقارير</h1>
                <p className="text-sm text-gray-500 mt-1">
                  توليد تقارير مع تصدير CSV/JSON وحفظ تاريخ التقارير.
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleGenerateReport}
                disabled={loading || !dateRangeOk}
                className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <ArrowDownTrayIcon className="h-5 w-5 ml-2" />
                {loading ? "جارِ توليد التقرير..." : "توليد التقرير"}
              </button>

              <button
                onClick={saveCurrentToHistory}
                disabled={!summary}
                className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
                title="حفظ التقرير الحالي في التقارير السابقة"
              >
                <DocumentTextIcon className="h-5 w-5 ml-2" />
                حفظ
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 mb-6">
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">من تاريخ</label>
                  <input
                    type="date"
                    value={filter.startDate}
                    onChange={(e) => setFilter({ ...filter, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">إلى تاريخ</label>
                  <input
                    type="date"
                    value={filter.endDate}
                    onChange={(e) => setFilter({ ...filter, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">نوع التقرير</label>
                  <select
                    value={filter.type}
                    onChange={(e) => setFilter({ ...filter, type: e.target.value as ReportType })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    <option value="all">الكل</option>
                    <option value="users">المستخدمين</option>
                    <option value="auctions">المزادات</option>
                    <option value="revenue">الإيرادات</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 items-center justify-between">
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => presetRange("today")}
                    className="px-3 py-1.5 text-sm rounded-xl bg-white border border-gray-200 hover:bg-gray-50"
                  >
                    اليوم
                  </button>
                  <button
                    onClick={() => presetRange("7d")}
                    className="px-3 py-1.5 text-sm rounded-xl bg-white border border-gray-200 hover:bg-gray-50"
                  >
                    آخر 7 أيام
                  </button>
                  <button
                    onClick={() => presetRange("30d")}
                    className="px-3 py-1.5 text-sm rounded-xl bg-white border border-gray-200 hover:bg-gray-50"
                  >
                    آخر 30 يوم
                  </button>
                  <button
                    onClick={() => presetRange("month")}
                    className="px-3 py-1.5 text-sm rounded-xl bg-white border border-gray-200 hover:bg-gray-50"
                  >
                    هذا الشهر
                  </button>
                </div>

                {!dateRangeOk && <span className="text-sm text-red-600">مدى التاريخ غير صحيح</span>}
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-2xl border border-red-200 bg-red-50 text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Result */}
          <div className="mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
              <h2 className="text-lg font-semibold text-gray-900">نتائج التقرير</h2>

              <div className="flex gap-2">
                <button
                  onClick={() => setActiveView("summary")}
                  className={`px-3 py-2 rounded-xl text-sm border ${
                    activeView === "summary"
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  ملخص
                </button>
                <button
                  onClick={() => setActiveView("rows")}
                  className={`px-3 py-2 rounded-xl text-sm border ${
                    activeView === "rows"
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                  }`}
                  disabled={!rows.length}
                >
                  بيانات (Preview)
                </button>

                <button
                  onClick={exportCsv}
                  disabled={!rows.length}
                  className="px-3 py-2 rounded-xl text-sm border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  CSV
                </button>
                <button
                  onClick={exportJson}
                  disabled={!summary}
                  className="px-3 py-2 rounded-xl text-sm border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  JSON
                </button>
              </div>
            </div>

            {!summary && !loading && (
              <div className="p-10 text-center rounded-2xl border border-dashed border-gray-200 bg-white">
                <div className="mx-auto h-12 w-12 rounded-2xl bg-gray-50 flex items-center justify-center">
                  <ChartBarIcon className="h-6 w-6 text-gray-400" />
                </div>
                <p className="mt-3 text-sm text-gray-600">
                  اختر الفلاتر واضغط <span className="font-medium">توليد التقرير</span>.
                </p>
              </div>
            )}

            {loading && (
              <div className="p-6 rounded-2xl border border-gray-100 bg-white">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-gray-100 rounded w-1/3" />
                  <div className="h-10 bg-gray-100 rounded" />
                  <div className="h-10 bg-gray-100 rounded" />
                </div>
              </div>
            )}

            {!!summary && !loading && activeView === "summary" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {summaryCards.map((c) => (
                  <div key={c.title} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                    <p className="text-sm text-gray-500">{c.title}</p>
                    <p className="mt-2 text-2xl font-semibold text-gray-900">{c.value}</p>
                  </div>
                ))}

                <div className="md:col-span-3 rounded-2xl border border-gray-100 bg-white p-5">
                  <p className="text-sm font-medium text-gray-900 mb-2">تفاصيل (Raw)</p>
                  <pre className="text-xs bg-gray-50 border border-gray-100 rounded-xl p-4 overflow-auto max-h-72">
{JSON.stringify(summary, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {!!rows.length && !loading && activeView === "rows" && (
              <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    عرض أول <span className="font-medium">{rows.length}</span> صف (Preview)
                  </p>
                  <p className="text-xs text-gray-400">للتصدير استخدم CSV/JSON</p>
                </div>

                <div className="overflow-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-white sticky top-0">
                      <tr className="text-right text-xs text-gray-500 border-b border-gray-100">
                        {Object.keys(rows[0] || {}).slice(0, 10).map((k) => (
                          <th key={k} className="px-4 py-3 font-medium whitespace-nowrap">
                            {k}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {rows.slice(0, 60).map((r, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/70">
                          {Object.keys(rows[0] || {}).slice(0, 10).map((k) => (
                            <td key={k} className="px-4 py-3 text-gray-700 whitespace-nowrap">
                              {r?.[k] === null || r?.[k] === undefined
                                ? "-"
                                : typeof r?.[k] === "object"
                                ? JSON.stringify(r?.[k])
                                : String(r?.[k])}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-500">
                  ملاحظة: الأعمدة المعروضة محدودة لتفادي كسر الواجهة.
                </div>
              </div>
            )}
          </div>

          {/* Saved Reports */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-900">التقارير السابقة</h2>
              <span className="text-sm text-gray-500">{saved.length} تقرير</span>
            </div>

            {saved.length === 0 ? (
              <div className="p-10 text-center rounded-2xl border border-dashed border-gray-200 bg-white">
                <p className="text-sm text-gray-600">لا توجد تقارير محفوظة بعد.</p>
              </div>
            ) : (
              <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
                <div className="overflow-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr className="text-right text-xs text-gray-500">
                        <th className="px-4 py-3 font-medium">اسم التقرير</th>
                        <th className="px-4 py-3 font-medium">النوع</th>
                        <th className="px-4 py-3 font-medium">تاريخ الإنشاء</th>
                        <th className="px-4 py-3 font-medium">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {saved.map((r) => (
                        <tr key={r.id} className="hover:bg-gray-50/70">
                          <td className="px-4 py-3 text-gray-900">{r.name}</td>
                          <td className="px-4 py-3 text-gray-700">{r.type}</td>
                          <td className="px-4 py-3 text-gray-700">
                            {new Date(r.createdAt).toLocaleString("ar-SA")}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => loadSaved(r)}
                                className="px-3 py-1.5 rounded-xl text-sm bg-blue-50 text-blue-700 hover:bg-blue-100"
                              >
                                فتح
                              </button>
                              <button
                                onClick={() => deleteSaved(r.id)}
                                className="px-3 py-1.5 rounded-xl text-sm bg-red-50 text-red-700 hover:bg-red-100 inline-flex items-center"
                              >
                                <TrashIcon className="h-4 w-4 ml-1" />
                                حذف
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-500">
                  حفظ التقارير يتم محليًا على المتصفح (localStorage).
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
