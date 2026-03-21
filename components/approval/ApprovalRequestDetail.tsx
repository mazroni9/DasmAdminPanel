import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import dasmBff from "@/lib/dasmBffClient";
import { CrButton } from "@/components/ui/cr-button";
import { CrInput } from "@/components/ui/cr-input";
import { toast } from "react-hot-toast";
import {
  useApprovalCapabilities,
  resolveApprovalDecisionCaps,
} from "@/hooks/useApprovalCapabilities";

type TargetUser = {
  id: number;
  first_name?: string;
  last_name?: string;
  email?: string;
  type?: string;
};

type LogRow = {
  id: number;
  event_type: string;
  channel?: string | null;
  notes?: string | null;
  meta?: Record<string, unknown> | null;
  created_at: string;
  actor?: { first_name?: string; last_name?: string; email?: string } | null;
  recipient?: { first_name?: string; last_name?: string; email?: string } | null;
};

type ApprovalDetail = {
  id: number;
  request_type: string;
  status: string;
  payload?: Record<string, unknown> | null;
  notes?: string | null;
  created_at: string;
  reviewed_at?: string | null;
  resolution_seconds?: number | null;
  resolution_duration_human?: string | null;
  target_user?: TargetUser | null;
  reviewed_by?: { first_name?: string; last_name?: string; email?: string } | null;
  logs?: LogRow[];
};

const EVENT_LABELS: Record<string, string> = {
  request_created: "إنشاء الطلب",
  notification_email_sent: "إشعار بريد (من الخادم)",
  notification_database_sent: "إشعار قاعدة البيانات",
  notification_fcm_sent: "إشعار FCM",
  request_opened: "أول فتح للتفاصيل",
  request_viewed: "عرض التفاصيل",
  request_approved: "موافقة",
  request_rejected: "رفض",
};

export default function ApprovalRequestDetail({ id }: { id: number }) {
  const { caps, loading: capsLoading } = useApprovalCapabilities();
  const [row, setRow] = useState<ApprovalDetail | null>(null);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [rejectNotes, setRejectNotes] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setLogsLoading(true);
    setErr(null);
    try {
      const [dRes, lRes] = await Promise.allSettled([
        dasmBff.get(`admin/approval-requests/${id}`),
        dasmBff.get(`admin/approval-requests/${id}/logs`),
      ]);

      if (dRes.status === "fulfilled") {
        const ax = dRes.value;
        const payload = ax.data?.data ?? ax.data;
        setRow(payload as ApprovalDetail);
      } else {
        setErr("تعذر تحميل الطلب");
        setRow(null);
      }

      if (lRes.status === "fulfilled") {
        const ax = lRes.value;
        const list = ax.data?.data ?? ax.data;
        setLogs(Array.isArray(list) ? list : []);
      } else if (dRes.status === "fulfilled") {
        const ax = dRes.value;
        const payload = ax.data?.data ?? ax.data;
        const embedded = (payload as ApprovalDetail)?.logs;
        setLogs(Array.isArray(embedded) ? embedded : []);
      } else {
        setLogs([]);
      }
    } catch {
      setErr("تعذر تحميل الطلب");
      setRow(null);
      setLogs([]);
    } finally {
      setLoading(false);
      setLogsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const decision = resolveApprovalDecisionCaps(caps);

  const canAct = () => {
    if (!caps?.can_access_queue || !row) return false;
    if (row.status !== "pending") return false;
    if (row.request_type === "business_account")
      return decision.canApproveBusiness;
    if (row.request_type === "council_permission")
      return decision.canApproveCouncil;
    return false;
  };

  const act = async (action: "approve" | "reject") => {
    try {
      if (action === "reject") {
        await dasmBff.post(`admin/approval-requests/${id}/reject`, {
          notes: rejectNotes.trim() || undefined,
        });
      } else {
        await dasmBff.post(`admin/approval-requests/${id}/approve`);
      }
      toast.success(action === "approve" ? "تمت الموافقة" : "تم الرفض");
      setRejectNotes("");
      await load();
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "تعذر تنفيذ الإجراء";
      toast.error(msg);
    }
  };

  if (capsLoading) {
    return (
      <p className="text-gray-500 text-sm rtl">جاري التحقق من الصلاحيات...</p>
    );
  }

  if (caps && !caps.can_access_queue) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900 rtl space-y-2">
        <p className="font-semibold">غير مصرّح</p>
        <p className="text-sm">
          لا يمكنك الوصول إلى طلبات الموافقات. صلاحية{" "}
          <code className="text-xs bg-amber-100 px-1 rounded">
            can_access_queue
          </code>{" "}
          غير مفعّلة في المنصة.
        </p>
      </div>
    );
  }

  if (loading) {
    return <p className="text-gray-500 text-sm rtl">جاري تحميل الطلب...</p>;
  }

  if (err || !row) {
    const isForbidden = err?.includes("لا تملك صلاحية");
    return (
      <div
        className={`rounded-2xl p-6 rtl space-y-3 ${
          isForbidden
            ? "border border-amber-200 bg-amber-50 text-amber-900"
            : "border border-red-200 bg-red-50 text-red-800"
        }`}
      >
        <p className="font-medium">{err || "تعذر تحميل الطلب"}</p>
        <Link
          href="/admin/control-room/approval-requests"
          className="text-indigo-600 underline text-sm inline-block"
        >
          العودة للطابور
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 rtl max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href="/admin/control-room/approval-requests"
            className="text-sm text-indigo-600 hover:underline mb-2 inline-block"
          >
            ← العودة لطابور الموافقات
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            طلب #{row.id} — {row.request_type}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            الحالة:{" "}
            <span className="font-semibold text-gray-800">{row.status}</span>
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-gray-900">بيانات الطلب</h2>
        {row.target_user ? (
          <div className="text-sm space-y-1">
            <p>
              <span className="text-gray-500">المستخدم المستهدف:</span>{" "}
              {[row.target_user.first_name, row.target_user.last_name]
                .filter(Boolean)
                .join(" ")}{" "}
              — {row.target_user.email}
            </p>
            <p className="text-gray-500 text-xs">{row.target_user.type}</p>
          </div>
        ) : null}
        {row.payload ? (
          <pre className="text-xs bg-gray-50 border border-gray-100 rounded-xl p-4 overflow-x-auto max-h-64">
            {JSON.stringify(row.payload, null, 2)}
          </pre>
        ) : null}
        {row.notes ? (
          <p className="text-sm text-gray-700">
            <span className="font-semibold">ملاحظات:</span> {row.notes}
          </p>
        ) : null}
        <div className="text-xs text-gray-500 grid gap-1 sm:grid-cols-2">
          <span>أُنشئ: {new Date(row.created_at).toLocaleString("ar-SA")}</span>
          {row.reviewed_at ? (
            <span>
              رُاجع: {new Date(row.reviewed_at).toLocaleString("ar-SA")}
            </span>
          ) : null}
          {row.reviewed_by ? (
            <span>
              المراجع:{" "}
              {[row.reviewed_by.first_name, row.reviewed_by.last_name]
                .filter(Boolean)
                .join(" ")}
            </span>
          ) : null}
          {row.resolution_duration_human ? (
            <span>المدة: {row.resolution_duration_human}</span>
          ) : null}
        </div>
      </div>

      {row.status === "pending" && canAct() ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-gray-900">قرار</h2>
          <CrInput
            placeholder="ملاحظات الرفض (اختياري)"
            value={rejectNotes}
            onChange={(e) => setRejectNotes(e.target.value)}
          />
          <div className="flex flex-wrap gap-3">
            <CrButton type="button" onClick={() => act("approve")}>
              موافقة
            </CrButton>
            <CrButton
              type="button"
              variant="destructive"
              onClick={() => act("reject")}
            >
              رفض
            </CrButton>
          </div>
        </div>
      ) : row.status === "pending" ? (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-4">
          لا تملك صلاحية قرار على هذا النوع من الطلبات حسب إعدادات المنصة.
        </p>
      ) : null}

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-3">
        <h2 className="text-lg font-bold text-gray-900">السجل التشغيلي</h2>
        <p className="text-xs text-gray-500">
          السجلات والبريد يُداران في DASM — العرض للمراجعة فقط.
        </p>
        {logsLoading ? (
          <p className="text-gray-500 text-sm">جاري تحميل السجل...</p>
        ) : logs.length === 0 ? (
          <p className="text-gray-500 text-sm">لا توجد أحداث مسجّلة.</p>
        ) : (
          <ul className="space-y-3 max-h-[480px] overflow-y-auto text-sm">
            {logs.map((log) => (
              <li
                key={log.id}
                className="border-b border-gray-100 pb-3 last:border-0"
              >
                <span className="font-semibold text-indigo-800">
                  {EVENT_LABELS[log.event_type] || log.event_type}
                </span>
                {log.channel ? (
                  <span className="text-gray-500 ms-2">({log.channel})</span>
                ) : null}
                <span className="text-gray-400 ms-2 text-xs">
                  {log.created_at
                    ? new Date(log.created_at).toLocaleString("ar-SA")
                    : ""}
                </span>
                {log.actor ? (
                  <div className="text-gray-600 mt-1 text-xs">
                    بواسطة:{" "}
                    {[log.actor.first_name, log.actor.last_name]
                      .filter(Boolean)
                      .join(" ")}{" "}
                    {log.actor.email ? `— ${log.actor.email}` : ""}
                  </div>
                ) : null}
                {log.notes ? (
                  <div className="text-gray-600 mt-1 text-xs">{log.notes}</div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
