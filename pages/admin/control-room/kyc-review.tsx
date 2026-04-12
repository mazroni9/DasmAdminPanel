import { useCallback, useEffect, useState } from "react";
import {
  ShieldCheck, Search, RefreshCw, CheckCircle, XCircle,
  AlertTriangle, Clock, User, FileText, Eye, X, ChevronRight,
} from "lucide-react";
import ControlRoomGate from "@/components/control-room/ControlRoomGate";
import ControlRoomShell from "@/components/control-room/ControlRoomShell";
import dasmBff from "@/lib/dasmBffClient";

/* ===== Types ===== */
type KycEntry = {
  user_id: number;
  name: string;
  email: string;
  phone: string;
  role: "dealer" | "venue_owner";
  profile_type: "individual" | "business";
  kyc_status: string;
  submitted_at: string;
  documents: Record<string, string>;
  national_id?: string | null;
  cr_number?: string | null;
  rejection_reason?: string | null;
};

const ROLE_LABEL: Record<string, string> = {
  dealer: "تاجر",
  venue_owner: "صاحب معرض",
};

const DOC_LABEL: Record<string, string> = {
  tax_id_document: "وثيقة الضريبة",
  real_estate_license: "رخصة عقارية",
  certification_document: "شهادة التصنيف",
  farm_license: "رخصة مزرعة",
  driving_license: "رخصة قيادة",
  national_id: "الهوية الوطنية",
};

/* ===== Reject Modal ===== */
function RejectModal({
  entry,
  onConfirm,
  onClose,
}: {
  entry: KycEntry;
  onConfirm: (reason: string) => void;
  onClose: () => void;
}) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (reason.trim().length < 5) return;
    setLoading(true);
    await onConfirm(reason.trim());
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900 text-lg">رفض طلب KYC</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-sm text-gray-600 mb-1">
          المستخدم: <span className="font-semibold text-gray-900">{entry.name}</span>
        </p>
        <p className="text-sm text-gray-500 mb-4">{entry.email}</p>
        <label className="block text-sm font-medium text-gray-700 mb-1">سبب الرفض</label>
        <textarea
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="اذكر سبباً واضحاً يساعد المستخدم على التصحيح…"
          className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
        />
        <p className="text-xs text-gray-400 mt-1 mb-4">{reason.trim().length} / 500 حرف</p>
        <div className="flex gap-3">
          <button
            onClick={handleSubmit}
            disabled={reason.trim().length < 5 || loading}
            className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold disabled:opacity-50 transition"
          >
            {loading ? "جارٍ الرفض…" : "تأكيد الرفض"}
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}

/* ===== Documents Preview ===== */
function DocumentsList({ docs }: { docs: Record<string, string> }) {
  if (!docs || Object.keys(docs).length === 0) {
    return <span className="text-xs text-gray-400">لا توجد وثائق مرفوعة</span>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {Object.entries(docs).map(([key, path]) => (
        <a
          key={key}
          href={`${process.env.NEXT_PUBLIC_API_URL}/storage/${path}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium border border-blue-200 hover:bg-blue-100 transition"
        >
          <Eye className="w-3 h-3" />
          {DOC_LABEL[key] ?? key}
        </a>
      ))}
    </div>
  );
}

/* ===== KYC Row ===== */
function KycRow({
  entry,
  onApprove,
  onReject,
  processing,
}: {
  entry: KycEntry;
  onApprove: () => void;
  onReject: () => void;
  processing: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
            <User className="w-5 h-5 text-gray-500" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">{entry.name}</p>
            <p className="text-xs text-gray-500">{entry.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
            {ROLE_LABEL[entry.role] ?? entry.role}
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 inline-flex items-center gap-1">
            <Clock className="w-3 h-3" /> قيد المراجعة
          </span>
        </div>
      </div>

      {/* Info row */}
      <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-500">
        {entry.phone && <span>📱 {entry.phone}</span>}
        {entry.national_id && <span>🪪 الهوية: {entry.national_id}</span>}
        {entry.cr_number && <span>🏢 السجل التجاري: {entry.cr_number}</span>}
        {entry.submitted_at && (
          <span>
            🗓 {new Date(entry.submitted_at).toLocaleDateString("ar-SA", {
              year: "numeric", month: "short", day: "numeric",
            })}
          </span>
        )}
      </div>

      {/* Documents */}
      <div>
        <p className="text-xs font-medium text-gray-500 mb-1.5">الوثائق المرفوعة</p>
        <DocumentsList docs={entry.documents} />
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={onApprove}
          disabled={processing}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold disabled:opacity-50 transition"
        >
          <CheckCircle className="w-4 h-4" />
          موافقة
        </button>
        <button
          onClick={onReject}
          disabled={processing}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-red-300 text-red-600 hover:bg-red-50 text-sm font-semibold disabled:opacity-50 transition"
        >
          <XCircle className="w-4 h-4" />
          رفض
        </button>
      </div>
    </div>
  );
}

/* ===== Main Page ===== */
function KycReviewPage() {
  const [entries, setEntries] = useState<KycEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [processing, setProcessing] = useState<number | null>(null);
  const [rejectTarget, setRejectTarget] = useState<KycEntry | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchPending = useCallback(async () => {
    setLoading(true);
    try {
      const res = await dasmBff.get("admin/kyc/pending?per_page=50");
      setEntries(res.data?.data ?? []);
    } catch {
      showToast("تعذر تحميل البيانات", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchPending(); }, [fetchPending]);

  const handleApprove = async (userId: number) => {
    setProcessing(userId);
    try {
      await dasmBff.post(`admin/kyc/${userId}/approve`);
      setEntries((p) => p.filter((e) => e.user_id !== userId));
      showToast("تمت الموافقة على KYC بنجاح ✓");
    } catch (e: any) {
      showToast(e?.response?.data?.message ?? "فشل الموافقة", "error");
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (reason: string) => {
    if (!rejectTarget) return;
    const userId = rejectTarget.user_id;
    setProcessing(userId);
    try {
      await dasmBff.post(`admin/kyc/${userId}/reject`, { reason });
      setEntries((p) => p.filter((e) => e.user_id !== userId));
      setRejectTarget(null);
      showToast("تم رفض الطلب وإشعار المستخدم");
    } catch (e: any) {
      showToast(e?.response?.data?.message ?? "فشل الرفض", "error");
    } finally {
      setProcessing(null);
    }
  };

  const filtered = entries.filter((e) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      e.name.toLowerCase().includes(q) ||
      e.email.toLowerCase().includes(q) ||
      (e.phone ?? "").includes(q)
    );
  });

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-4xl mx-auto">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-xl text-white text-sm font-medium transition-all
          ${toast.type === "success" ? "bg-emerald-600" : "bg-red-600"}`}>
          {toast.msg}
        </div>
      )}

      {/* Reject Modal */}
      {rejectTarget && (
        <RejectModal
          entry={rejectTarget}
          onConfirm={handleReject}
          onClose={() => setRejectTarget(null)}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-900">مراجعة KYC</h1>
          </div>
          <p className="text-sm text-gray-500">طلبات التحقق المعلّقة — التجار وأصحاب المعارض</p>
        </div>
        <button
          onClick={fetchPending}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-gray-600 text-sm hover:bg-gray-50 transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          تحديث
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "إجمالي المعلّقة", value: entries.length, color: "text-amber-600 bg-amber-50 border-amber-200" },
          { label: "تاجر", value: entries.filter((e) => e.role === "dealer").length, color: "text-blue-600 bg-blue-50 border-blue-200" },
          { label: "صاحب معرض", value: entries.filter((e) => e.role === "venue_owner").length, color: "text-purple-600 bg-purple-50 border-purple-200" },
        ].map((s) => (
          <div key={s.label} className={`rounded-2xl border p-3 text-center ${s.color}`}>
            <p className="text-2xl font-bold">{loading ? "—" : s.value}</p>
            <p className="text-xs mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="بحث بالاسم أو البريد أو الجوال…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pr-9 pl-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <ShieldCheck className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">
            {search ? "لا توجد نتائج للبحث" : "لا توجد طلبات KYC معلّقة 🎉"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((entry) => (
            <KycRow
              key={entry.user_id}
              entry={entry}
              processing={processing === entry.user_id}
              onApprove={() => handleApprove(entry.user_id)}
              onReject={() => setRejectTarget(entry)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ===== Page Export ===== */
export default function KycReviewPageWrapper() {
  return (
    <ControlRoomGate>
      {(access) => (
        <ControlRoomShell access={access}>
          <KycReviewPage />
        </ControlRoomShell>
      )}
    </ControlRoomGate>
  );
}
