/**
 * /subscriptions/founder-discounts — إدارة خصومات المؤسسين.
 *
 * The page the owner asked for: pick a user, set percent + duration,
 * issue grant; list existing grants with revoke-by-row.
 *
 * Model contract (DASM-Platform PR #2):
 *   • One ACTIVE grant per user — API returns 409 on conflict.
 *   • starts_at = User.created_at (server-side).
 *   • Revoke is soft — the row stays in the list.
 *   • No edit — to change percent/duration, revoke + re-issue.
 *
 * User picker is inline (search box on /api/admin/users) rather than
 * a modal: fewer clicks for the common "issue grant" flow.
 */

import Layout from "../../components/Layout";
import { apiFetch, extractErrorMessage } from "../../utils/api";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  issueGrant,
  listGrants,
  revokeGrant,
  type FounderDiscountGrant,
} from "../../lib/subscriptionsApi";

interface UserRow {
  id: number;
  name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email: string;
}

const PERCENT_PRESETS = [10, 25, 50, 75, 90, 100];
const DURATION_PRESETS = [3, 6, 12, 24];

export default function FounderDiscountsAdminPage() {
  const [grants, setGrants] = useState<FounderDiscountGrant[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterActive, setFilterActive] = useState(false);
  const [confirmRevoke, setConfirmRevoke] = useState<FounderDiscountGrant | null>(null);

  const fetchGrants = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listGrants({ active: filterActive, per_page: 100 });
      setGrants(res.data);
    } catch (e) {
      toast.error(extractErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [filterActive]);

  useEffect(() => {
    void fetchGrants();
  }, [fetchGrants]);

  async function handleRevoke(grant: FounderDiscountGrant) {
    try {
      await revokeGrant(grant.id);
      toast.success("تم إلغاء الخصم");
      setConfirmRevoke(null);
      await fetchGrants();
    } catch (e) {
      toast.error(extractErrorMessage(e));
    }
  }

  return (
    <Layout>
      <div dir="rtl" className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">خصومات المؤسسين</h1>
            <p className="text-sm text-gray-500 mt-1">
              منح يدوي بنسبة ومدة تحددها أنت. تاريخ البدء = تاريخ تسجيل المستخدم.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={filterActive}
                onChange={(e) => setFilterActive(e.target.checked)}
                className="h-4 w-4 rounded text-indigo-600"
              />
              النشطة فقط
            </label>
            <button
              onClick={fetchGrants}
              className="px-3 py-1.5 text-sm rounded-lg bg-gray-100 hover:bg-gray-200 transition"
            >
              تحديث
            </button>
          </div>
        </header>

        <IssueGrantForm onSuccess={fetchGrants} />

        <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <h2 className="text-sm font-bold text-gray-700 px-5 py-3 border-b border-gray-100">
            السجل
          </h2>

          {loading && <div className="text-center py-10 text-gray-500">جارٍ التحميل…</div>}
          {!loading && grants.length === 0 && (
            <div className="text-center py-10 text-gray-500">لا توجد خصومات.</div>
          )}

          {!loading && grants.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <Th>المستخدم</Th>
                    <Th>النسبة</Th>
                    <Th>المدة</Th>
                    <Th>من</Th>
                    <Th>إلى</Th>
                    <Th>منحها</Th>
                    <Th>الحالة</Th>
                    <Th>إجراء</Th>
                  </tr>
                </thead>
                <tbody>
                  {grants.map((g) => (
                    <GrantRow
                      key={g.id}
                      grant={g}
                      onRevokeClick={() => setConfirmRevoke(g)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {confirmRevoke && (
        <ConfirmRevokeModal
          grant={confirmRevoke}
          onCancel={() => setConfirmRevoke(null)}
          onConfirm={() => handleRevoke(confirmRevoke)}
        />
      )}
    </Layout>
  );
}

// ─────────────────────── IssueGrantForm ───────────────────────

function IssueGrantForm({ onSuccess }: { onSuccess: () => Promise<void> }) {
  const [user, setUser] = useState<UserRow | null>(null);
  const [percent, setPercent] = useState<number>(50);
  const [duration, setDuration] = useState<number>(12);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canSubmit =
    user && percent >= 0.01 && percent <= 100 && duration >= 1 && duration <= 240;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    try {
      await issueGrant({
        user_id: user.id,
        discount_percent: percent,
        duration_months: duration,
        reason: reason.trim() || undefined,
      });
      toast.success("تم منح الخصم");
      setUser(null);
      setReason("");
      await onSuccess();
    } catch (e) {
      toast.error(extractErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4"
    >
      <h2 className="text-sm font-bold text-gray-700">إصدار خصم جديد</h2>

      <UserPicker value={user} onChange={setUser} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-gray-600 mb-1">
            النسبة (%) — قابلة بين 0.01 و 100
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0.01"
              max="100"
              step="0.01"
              value={percent}
              onChange={(e) => setPercent(Number(e.target.value))}
              className="w-28 text-sm px-2 py-1.5 rounded-md border border-gray-300 bg-white tabular-nums"
            />
            <div className="flex gap-1 flex-wrap">
              {PERCENT_PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPercent(p)}
                  className={`px-2 py-1 text-xs rounded-md border ${
                    percent === p
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  {p}%
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-600 mb-1">
            المدة (بالأشهر) — بين 1 و 240
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="1"
              max="240"
              step="1"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-28 text-sm px-2 py-1.5 rounded-md border border-gray-300 bg-white tabular-nums"
            />
            <div className="flex gap-1 flex-wrap">
              {DURATION_PRESETS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDuration(d)}
                  className={`px-2 py-1 text-xs rounded-md border ${
                    duration === d
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  {d} شهر
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-xs text-gray-600 mb-1">السبب (اختياري)</label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          maxLength={1000}
          rows={2}
          placeholder="تقدير لمساهمة نشطة / تعويض عن عطل / …"
          className="w-full text-sm px-3 py-2 rounded-md border border-gray-300 bg-white"
        />
        <div className="text-[10px] text-gray-400 mt-0.5 text-left tabular-nums">
          {reason.length}/1000
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={!canSubmit || submitting}
          className="px-4 py-2 text-sm font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          {submitting ? "جارٍ المنح…" : "منح الخصم"}
        </button>
      </div>
    </form>
  );
}

// ─────────────────────── UserPicker ───────────────────────

function UserPicker({
  value,
  onChange,
}: {
  value: UserRow | null;
  onChange: (u: UserRow | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserRow[]>([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);

  // Debounce search — 300ms is enough to stop "hold-shift-to-type" spam
  // but fast enough to feel responsive on a local admin network.
  useEffect(() => {
    if (!query.trim() || value) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        // The admin users endpoint is shared across the panel; `q` is
        // handled by the backend's existing UserController@index search.
        const res = await apiFetch<{ data?: UserRow[] }>(
          "/admin/users",
          { params: { q: query, per_page: 8 } },
        );
        setResults(Array.isArray(res.data) ? res.data : []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query, value]);

  const label = useMemo(() => {
    if (!value) return "";
    const name =
      value.name ||
      [value.first_name, value.last_name].filter(Boolean).join(" ") ||
      value.email;
    return `${name} — ${value.email} — #${value.id}`;
  }, [value]);

  return (
    <div>
      <label className="block text-xs text-gray-600 mb-1">المستخدم المستفيد</label>
      {value ? (
        <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-2">
          <span className="text-sm text-indigo-900 flex-1">{label}</span>
          <button
            type="button"
            onClick={() => {
              onChange(null);
              setQuery("");
            }}
            className="text-xs text-indigo-700 hover:text-indigo-900"
          >
            تغيير
          </button>
        </div>
      ) : (
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            placeholder="ابحث بالاسم / البريد / رقم المستخدم"
            className="w-full text-sm px-3 py-2 rounded-md border border-gray-300 bg-white"
          />
          {open && (results.length > 0 || searching) && (
            <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
              {searching && (
                <div className="px-3 py-2 text-xs text-gray-500">جارٍ البحث…</div>
              )}
              {results.map((u) => (
                <button
                  type="button"
                  key={u.id}
                  onMouseDown={() => {
                    onChange(u);
                    setQuery("");
                    setOpen(false);
                  }}
                  className="w-full text-right px-3 py-2 hover:bg-gray-50 border-b last:border-b-0 border-gray-100"
                >
                  <div className="text-sm text-gray-900">
                    {u.name ||
                      [u.first_name, u.last_name].filter(Boolean).join(" ") ||
                      "—"}
                  </div>
                  <div className="text-xs text-gray-500">
                    {u.email} · #{u.id}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────── Grant row ───────────────────────

function GrantRow({
  grant,
  onRevokeClick,
}: {
  grant: FounderDiscountGrant;
  onRevokeClick: () => void;
}) {
  const isRevoked = grant.revoked_at !== null;
  const isExpired = !isRevoked && new Date(grant.expires_at) <= new Date();
  const isActive = !isRevoked && !isExpired;

  const statusLabel = isActive ? "نشط" : isRevoked ? "مُلغى" : "منتهٍ";
  const statusColor = isActive
    ? "bg-emerald-100 text-emerald-800"
    : isRevoked
      ? "bg-rose-100 text-rose-800"
      : "bg-gray-100 text-gray-700";

  return (
    <tr className="border-b last:border-b-0 border-gray-100">
      <Td>
        <div className="text-sm text-gray-900">
          {grant.user?.name ?? "—"}
        </div>
        <div className="text-xs text-gray-500" dir="ltr">
          {grant.user?.email ?? `#${grant.user_id}`}
        </div>
      </Td>
      <Td>
        <span className="tabular-nums">{grant.discount_percent}%</span>
      </Td>
      <Td>
        <span className="tabular-nums">{grant.duration_months} شهر</span>
      </Td>
      <Td>
        <span className="text-xs text-gray-600 tabular-nums">
          {formatDate(grant.starts_at)}
        </span>
      </Td>
      <Td>
        <span className="text-xs text-gray-600 tabular-nums">
          {formatDate(grant.expires_at)}
        </span>
      </Td>
      <Td>
        <span className="text-xs text-gray-700">
          {grant.granted_by?.name ?? `#${grant.granted_by_user_id}`}
        </span>
      </Td>
      <Td>
        <span className={`inline-block px-2 py-0.5 text-xs rounded-full ${statusColor}`}>
          {statusLabel}
        </span>
      </Td>
      <Td>
        {isActive ? (
          <button
            onClick={onRevokeClick}
            className="text-xs text-rose-700 hover:text-rose-900 font-semibold"
          >
            إلغاء
          </button>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        )}
      </Td>
    </tr>
  );
}

// ─────────────────────── ConfirmRevokeModal ───────────────────────

function ConfirmRevokeModal({
  grant,
  onCancel,
  onConfirm,
}: {
  grant: FounderDiscountGrant;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
        <h3 className="text-lg font-bold text-gray-900">تأكيد إلغاء الخصم</h3>
        <p className="text-sm text-gray-700">
          سيتم إلغاء خصم{" "}
          <b>{grant.discount_percent}%</b> للمستخدم{" "}
          <b>{grant.user?.name ?? `#${grant.user_id}`}</b>. السجل سيبقى محفوظًا للتدقيق، لكن الخصم لن يُطبّق على الاشتراكات الجديدة.
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 hover:bg-gray-50"
          >
            رجوع
          </button>
          <button
            onClick={onConfirm}
            className="px-3 py-1.5 text-sm font-semibold rounded-lg bg-rose-600 hover:bg-rose-700 text-white"
          >
            نعم، إلغ الخصم
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────── Cell helpers ───────────────────────

const Th = ({ children }: { children: React.ReactNode }) => (
  <th className="text-right font-semibold text-xs px-4 py-2.5">{children}</th>
);
const Td = ({ children }: { children: React.ReactNode }) => (
  <td className="px-4 py-3 align-top">{children}</td>
);

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}
