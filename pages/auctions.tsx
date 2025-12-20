import React, { useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout";
import { apiFetch, extractErrorMessage } from "../utils/api";
import {
  FunnelIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  CheckBadgeIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";

type AuctionApi = any;

type Row = {
  id: number;
  carLabel: string;
  statusRaw: string;
  statusLabel: "جاري" | "منتهي" | "قادم";
  currentPrice: number;
  startAt?: string | null;
  endAt?: string | null;
  raw: AuctionApi;
};

function statusToArabic(s: string | null | undefined): Row["statusLabel"] {
  const v = (s || "").toLowerCase();
  if (["live", "active", "running", "in_progress", "ongoing", "جاري"].includes(v)) return "جاري";
  if (["ended", "finished", "completed", "closed", "منتهي"].includes(v)) return "منتهي";
  return "قادم";
}

function pickCarLabel(a: AuctionApi): string {
  const car = a?.car;
  if (typeof car === "string" && car.trim()) return car;

  const make = a?.car?.make ?? a?.make ?? "";
  const model = a?.car?.model ?? a?.model ?? "";
  const year = a?.car?.year ?? a?.year ?? "";
  const vin = a?.car?.vin ?? a?.vin ?? "";
  const title = [make, model, year].filter(Boolean).join(" ");
  return (title || vin || `مزاد #${a?.id ?? ""}`).trim();
}

function pickPrice(a: AuctionApi): number {
  const n =
    a?.current_bid ??
    a?.currentPrice ??
    a?.current_price ??
    a?.highest_bid ??
    a?.opening_price ??
    0;
  const x = Number(n);
  return Number.isFinite(x) ? x : 0;
}

function toRow(a: AuctionApi): Row {
  const id = Number(a?.id);
  const statusRaw = String(a?.status ?? a?.state ?? a?.status_label ?? "");
  return {
    id,
    carLabel: pickCarLabel(a),
    statusRaw,
    statusLabel: statusToArabic(statusRaw),
    currentPrice: pickPrice(a),
    startAt: a?.start_time ?? a?.starts_at ?? a?.start_at ?? null,
    endAt: a?.end_time ?? a?.ends_at ?? a?.end_at ?? null,
    raw: a,
  };
}

function Badge({ label }: { label: Row["statusLabel"] }) {
  const cls =
    label === "جاري"
      ? "bg-green-100 text-green-800"
      : label === "منتهي"
      ? "bg-red-100 text-red-800"
      : "bg-yellow-100 text-yellow-800";

  return <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${cls}`}>{label}</span>;
}

export default function Auctions() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  const [filterStatus, setFilterStatus] = useState<string>("جميع المزادات");
  const [search, setSearch] = useState("");

  const [rows, setRows] = useState<Row[]>([]);

  const statusOptions = ["جميع المزادات", "جاري", "منتهي", "قادم"];

  async function load(isRefresh = false) {
    setError(null);
    setOkMsg(null);
    isRefresh ? setRefreshing(true) : setLoading(true);

    try {
      const res: any = await apiFetch("/admin/auctions");
      const list = res?.data ?? res;

      const arr: AuctionApi[] = Array.isArray(list)
        ? list
        : Array.isArray(list?.data)
        ? list.data
        : Array.isArray(list?.data?.data)
        ? list.data.data
        : [];

      setRows(arr.map(toRow));
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      isRefresh ? setRefreshing(false) : setLoading(false);
    }
  }

  useEffect(() => {
    load(false);
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      const okStatus = filterStatus === "جميع المزادات" ? true : r.statusLabel === filterStatus;
      const okSearch = !q ? true : r.carLabel.toLowerCase().includes(q) || String(r.id).includes(q);
      return okStatus && okSearch;
    });
  }, [rows, filterStatus, search]);

  async function approve(id: number) {
    setError(null);
    setOkMsg(null);
    try {
      await apiFetch(`/admin/auctions/${id}/approve`, { method: "POST" });
      setOkMsg("تمت الموافقة على المزاد ✅");
      await load(true);
    } catch (e) {
      setError(extractErrorMessage(e));
    }
  }

  async function reject(id: number) {
    setError(null);
    setOkMsg(null);
    try {
      await apiFetch(`/admin/auctions/${id}/reject`, { method: "POST" });
      setOkMsg("تم رفض المزاد ✅");
      await load(true);
    } catch (e) {
      setError(extractErrorMessage(e));
    }
  }

  async function changeStatus(id: number, status: string) {
    setError(null);
    setOkMsg(null);
    try {
      await apiFetch(`/admin/auctions/${id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      });
      setOkMsg("تم تحديث حالة المزاد ✅");
      await load(true);
    } catch (e) {
      setError(extractErrorMessage(e));
    }
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50/50 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-6xl space-y-6">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-sm p-6 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">إدارة المزادات</h1>
              <p className="text-sm text-gray-600 mt-1">
                عرض + فلترة + بحث + إجراءات مباشرة (Approve/Reject/Status).
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border bg-white hover:bg-gray-50 text-sm disabled:opacity-60"
                onClick={() => load(true)}
                disabled={refreshing}
              >
                <ArrowPathIcon className="h-5 w-5" />
                تحديث
              </button>

              <button
                className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 text-sm"
                onClick={() => alert("لو عندك صفحة إنشاء مزاد ابعتها وأنا أربطها فورًا.")}
              >
                إنشاء مزاد جديد
              </button>
            </div>
          </div>

          {/* Alerts */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-2xl p-4 text-sm">
              {error}
            </div>
          )}
          {okMsg && (
            <div className="bg-green-50 border border-green-200 text-green-800 rounded-2xl p-4 text-sm">
              {okMsg}
            </div>
          )}

          {/* Filters */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <FunnelIcon className="h-5 w-5 text-gray-500" />
                <span className="text-gray-700 text-sm">فلترة حسب الحالة:</span>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-white border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {statusOptions.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative w-full md:w-96">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute right-3 top-3" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="بحث باسم السيارة أو رقم المزاد..."
                  className="w-full border border-gray-300 rounded-xl py-2.5 pr-10 pl-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Table */}
            {loading ? (
              <div className="text-gray-500">جاري التحميل...</div>
            ) : filtered.length ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">
                        المزاد
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">
                        السيارة
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">
                        السعر الحالي
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">
                        الحالة
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">
                        بداية / نهاية
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">
                        إجراءات
                      </th>
                    </tr>
                  </thead>

                  <tbody className="bg-white divide-y divide-gray-200">
                    {filtered.map((r) => (
                      <tr key={r.id} className="hover:bg-gray-50/60">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                          #{r.id}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {r.carLabel}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {r.currentPrice.toLocaleString("ar-SA")} ريال
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge label={r.statusLabel} />
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          <div>{r.startAt ? new Date(r.startAt).toLocaleString("ar-SA") : "-"}</div>
                          <div className="text-xs text-gray-500">
                            {r.endAt ? new Date(r.endAt).toLocaleString("ar-SA") : "-"}
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => approve(r.id)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 text-xs"
                            >
                              <CheckBadgeIcon className="h-4 w-4" />
                              موافقة
                            </button>

                            <button
                              onClick={() => reject(r.id)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 text-xs"
                            >
                              <XCircleIcon className="h-4 w-4" />
                              رفض
                            </button>

                            <select
                              className="border rounded-lg px-2 py-1.5 text-xs"
                              defaultValue=""
                              onChange={(e) => {
                                if (!e.target.value) return;
                                changeStatus(r.id, e.target.value);
                                e.currentTarget.value = "";
                              }}
                            >
                              <option value="">تغيير الحالة...</option>
                              <option value="active">Active</option>
                              <option value="live">Live</option>
                              <option value="ended">Ended</option>
                              <option value="pending">Pending</option>
                            </select>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-14">
                <div className="text-sm font-semibold text-gray-900">لا توجد مزادات</div>
                <div className="text-sm text-gray-500 mt-1">جرّب تغيير الفلتر أو البحث.</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
