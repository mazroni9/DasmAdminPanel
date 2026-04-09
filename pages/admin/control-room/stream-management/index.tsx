import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Radio,
  Loader2,
  RefreshCw,
  AlertCircle,
  Video,
  ChevronLeft,
  Search,
} from "lucide-react";
import ControlRoomGate, { type ControlRoomAccessLevel } from "@/components/control-room/ControlRoomGate";
import ControlRoomShell from "@/components/control-room/ControlRoomShell";
import dasmBff from "@/lib/dasmBffClient";

/**
 * Session 30 — Stream Management Index
 *
 * Lists all broadcasts (live / scheduled / completed) and links to the
 * per-broadcast configuration page at /admin/control-room/stream-management/[id].
 *
 * Backend endpoint (proxied via /api/dasm-proxy):
 *   GET /admin/all-broadcasts?status=&q=&pageSize=
 */

type StatusFilter = "all" | "live" | "scheduled" | "completed";

interface Broadcast {
  id: number;
  title: string | null;
  is_live: boolean;
  start_time: string | null;
  end_time: string | null;
  scheduled_start_time: string | null;
  chat_mode?: string | null;
  chat_layout?: string | null;
  auction_id: number | null;
  created_at: string;
  auction?: {
    id: number;
    car?: {
      id: number;
      make: string | null;
      model: string | null;
      year: number | null;
    } | null;
  } | null;
}

interface PaginatedResponse {
  status: string;
  data: {
    data: Broadcast[];
    current_page: number;
    last_page: number;
    total: number;
  };
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("ar-SA", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function statusBadge(b: Broadcast) {
  if (b.is_live) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-600">
        <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
        مباشر الآن
      </span>
    );
  }
  if (b.end_time) {
    return (
      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
        انتهى
      </span>
    );
  }
  if (b.scheduled_start_time) {
    return (
      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
        مجدول
      </span>
    );
  }
  return (
    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
      غير معروف
    </span>
  );
}

function StreamManagementIndexInner({ access }: { access: ControlRoomAccessLevel }) {
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [total, setTotal] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = { pageSize: "50" };
      if (statusFilter !== "all") params.status = statusFilter;
      if (search.trim()) params.q = search.trim();
      const res = await dasmBff.get<PaginatedResponse>("admin/all-broadcasts", { params });
      const payload = res.data?.data;
      if (payload && Array.isArray(payload.data)) {
        setBroadcasts(payload.data);
        setTotal(payload.total ?? payload.data.length);
      } else {
        setBroadcasts([]);
        setTotal(0);
      }
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "فشل تحميل قائمة البث";
      setError(msg);
      setBroadcasts([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <ControlRoomShell access={access}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-900">إدارة البث المباشر</h1>
            {total > 0 && (
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                {total}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            تحديث
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-1">
            {(["all", "live", "scheduled", "completed"] as StatusFilter[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition ${
                  statusFilter === s
                    ? "bg-white text-blue-700 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {s === "all"
                  ? "الكل"
                  : s === "live"
                  ? "مباشر"
                  : s === "scheduled"
                  ? "مجدول"
                  : "منتهٍ"}
              </button>
            ))}
          </div>
          <div className="flex-1 min-w-[200px] relative">
            <Search className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث بعنوان البث…"
              className="w-full pr-9 pl-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-700 rounded-2xl p-4 mb-4 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="text-sm">{error}</div>
          </div>
        )}

        {/* Loading */}
        {loading && broadcasts.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
          </div>
        )}

        {/* Empty */}
        {!loading && broadcasts.length === 0 && !error && (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <Video className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">لا توجد جلسات بث مطابقة للفلتر الحالي</p>
          </div>
        )}

        {/* List */}
        {broadcasts.length > 0 && (
          <div className="space-y-2">
            {broadcasts.map((b) => {
              const carLabel = b.auction?.car
                ? `${b.auction.car.make ?? ""} ${b.auction.car.model ?? ""} ${b.auction.car.year ?? ""}`.trim()
                : null;
              return (
                <Link
                  key={b.id}
                  href={`/admin/control-room/stream-management/${b.id}`}
                  className="block bg-white rounded-2xl border border-gray-100 hover:border-blue-200 hover:shadow-sm p-4 transition"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {statusBadge(b)}
                        <span className="text-xs text-gray-400">#{b.id}</span>
                      </div>
                      <h3 className="font-semibold text-gray-900 truncate">
                        {b.title || "بث بدون عنوان"}
                      </h3>
                      {carLabel && (
                        <p className="text-xs text-gray-500 mt-0.5">{carLabel}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
                        {b.is_live && b.start_time && (
                          <span>بدأ: {formatDate(b.start_time)}</span>
                        )}
                        {!b.is_live && b.scheduled_start_time && (
                          <span>موعد: {formatDate(b.scheduled_start_time)}</span>
                        )}
                        {b.end_time && <span>انتهى: {formatDate(b.end_time)}</span>}
                        {b.chat_mode && (
                          <span className="px-1.5 py-0.5 bg-gray-50 rounded text-gray-600">
                            chat: {b.chat_mode}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronLeft className="w-5 h-5 text-gray-300 shrink-0 mt-1" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </ControlRoomShell>
  );
}

export default function StreamManagementIndexPage() {
  return (
    <ControlRoomGate>
      {(access) => <StreamManagementIndexInner access={access} />}
    </ControlRoomGate>
  );
}
