import Layout from '../components/Layout';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { apiFetch } from '../utils/api';
import { getToken } from '../utils/authStorage';
import {
  UserIcon,
  ClockIcon,
  CalendarIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  PencilSquareIcon,
  CheckBadgeIcon,
  PowerIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

type ApiUsersMeta = {
  current_page?: number;
  last_page?: number;
  per_page?: number;
  total?: number;
  data?: any[];
};

type ApiUsersResponse = {
  ok?: boolean;
  status?: string;
  data?: ApiUsersMeta | any;
  message?: string;
};

type UserRow = {
  id: number;
  first_name?: string;
  last_name?: string;
  name?: string; // legacy
  email: string;
  phone?: string;
  type?: string;
  kyc_status?: 'pending' | 'verified' | 'rejected' | string;
  is_active?: boolean;
  active?: boolean;
  status?: string;
  created_at?: string;
  updated_at?: string;
  email_verified_at?: string | null;
  [key: string]: any;
};

function extractUsers(payload: any): UserRow[] {
  const list = payload?.data?.data;
  if (Array.isArray(list)) return list as UserRow[];
  const list2 = payload?.data;
  if (Array.isArray(list2)) return list2 as UserRow[];
  if (Array.isArray(payload)) return payload as UserRow[];
  return [];
}

function pickMeta(payload: any): ApiUsersMeta | null {
  const meta = payload?.data;
  if (meta && typeof meta === 'object') return meta as ApiUsersMeta;
  return null;
}

function fmtDate(v?: string | null) {
  if (!v) return '—';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('ar-SA', { dateStyle: 'medium', timeStyle: 'short' });
}

function displayName(u: UserRow) {
  const n = `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim();
  if (n) return n;
  if (u.name) return u.name;
  return '—';
}

function isActive(u: UserRow) {
  if (typeof u.is_active === 'boolean') return u.is_active;
  if (typeof u.active === 'boolean') return u.active;
  return (u.status ?? '').toLowerCase() === 'active';
}

function badgeStatus(u: UserRow) {
  const active = isActive(u);
  return (
    <span
      className={`inline-flex items-center rounded-xl border px-2 py-1 text-xs font-extrabold ${
        active
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
          : 'bg-gray-100 text-gray-700 border-gray-200'
      }`}
    >
      {active ? 'active' : 'inactive'}
    </span>
  );
}

function badgeKyc(kyc?: string) {
  const s = (kyc ?? '').toLowerCase();
  const base = 'inline-flex items-center rounded-xl border px-2 py-1 text-xs font-extrabold';
  if (s === 'verified')
    return <span className={`${base} bg-emerald-50 text-emerald-700 border-emerald-200`}>verified</span>;
  if (s === 'rejected')
    return <span className={`${base} bg-red-50 text-red-700 border-red-200`}>rejected</span>;
  if (s === 'pending')
    return <span className={`${base} bg-amber-50 text-amber-700 border-amber-200`}>pending</span>;
  return <span className={`${base} bg-gray-100 text-gray-700 border-gray-200`}>{kyc ?? '—'}</span>;
}

export default function Users() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [users, setUsers] = useState<UserRow[]>([]);
  const [meta, setMeta] = useState<ApiUsersMeta | null>(null);

  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);

  // modal
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<UserRow | null>(null);

  // edit form
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [type, setType] = useState('');

  const searchTimer = useRef<number | null>(null);

  const lastPage = meta?.last_page ?? 1;

  const loadUsers = async (p = 1, query = q, pp = perPage) => {
    setLoading(true);
    setErr('');
    try {
      const qs = new URLSearchParams();
      qs.set('page', String(p));
      qs.set('per_page', String(pp));
      if (query.trim()) qs.set('q', query.trim());

      // ✅ AdminPanel endpoint
      const res = await apiFetch<ApiUsersResponse>(`/admin-panel/users?${qs.toString()}`, { method: 'GET' });

      setUsers(extractUsers(res));
      setMeta(pickMeta(res));
      setPage(p);
    } catch (e: any) {
      setErr(e?.message || 'حدث خطأ أثناء تحميل المستخدمين.');
      setUsers([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace('/login');
      return;
    }
    loadUsers(1, '', perPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced server-side search
  useEffect(() => {
    if (searchTimer.current) window.clearTimeout(searchTimer.current);
    searchTimer.current = window.setTimeout(() => {
      loadUsers(1, q, perPage);
    }, 450);

    return () => {
      if (searchTimer.current) window.clearTimeout(searchTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  // Lock scroll when modal open + Esc to close
  useEffect(() => {
    if (!open) return;

    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
    };
    window.addEventListener('keydown', onKey);

    return () => {
      document.body.style.overflow = prevBody;
      document.documentElement.style.overflow = prevHtml;
      window.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const stats = useMemo(() => {
    const total = meta?.total ?? users.length;
    const activeCount = users.filter((u) => isActive(u)).length;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const activeToday = users.filter((u) => {
      if (!u.updated_at) return false;
      const t = new Date(u.updated_at).getTime();
      return !Number.isNaN(t) && t >= today;
    }).length;

    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).getTime();
    const newThisWeek = users.filter((u) => {
      if (!u.created_at) return false;
      const t = new Date(u.created_at).getTime();
      return !Number.isNaN(t) && t >= weekAgo;
    }).length;

    return { total, activeCount, activeToday, newThisWeek };
  }, [users, meta]);

  // ========= Helpers =========

  const closeModal = () => {
    setOpen(false);
    setEditing(null);
  };

  const openEdit = async (u: UserRow) => {
    // open fast with row data
    setEditing(u);
    setFirstName(u.first_name ?? '');
    setLastName(u.last_name ?? '');
    setEmail(u.email ?? '');
    setPhone(u.phone ?? '');
    setType(u.type ?? '');
    setOpen(true);

    // then refresh details from backend (optional but better)
    try {
      const res = await apiFetch<ApiUsersResponse>(`/admin-panel/users/${u.id}`, { method: 'GET' });
      const full = res?.data && typeof res.data === 'object' ? (res.data as UserRow) : null;
      if (full && typeof full.id === 'number') {
        setEditing(full);
        setFirstName(full.first_name ?? '');
        setLastName(full.last_name ?? '');
        setEmail(full.email ?? '');
        setPhone(full.phone ?? '');
        setType(full.type ?? '');
      }
    } catch {
      // ignore show errors; keep row data
    }
  };

  const buildPartialPayload = (base: UserRow) => {
    const payload: any = {};

    const fn = firstName.trim();
    const ln = lastName.trim();
    const em = email.trim();
    const ph = phone.trim();
    const tp = type.trim();

    if (fn !== (base.first_name ?? '')) payload.first_name = fn;
    if (ln !== (base.last_name ?? '')) payload.last_name = ln;
    if (em !== (base.email ?? '')) payload.email = em;
    if (ph !== (base.phone ?? '')) payload.phone = ph || null;
    if (tp !== (base.type ?? '')) payload.type = tp;

    return payload;
  };

  const tryUpdate = async (userId: number, payloadCandidates: any[]) => {
    let lastError: any = null;

    for (const payload of payloadCandidates) {
      try {
        await apiFetch(`/admin-panel/users/${userId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        return;
      } catch (e: any) {
        lastError = e;
      }
    }

    throw lastError ?? new Error('Update failed');
  };

  // ========= Actions =========

  const saveEdit = async () => {
    if (!editing) return;

    const payload = buildPartialPayload(editing);

    // no changes
    if (Object.keys(payload).length === 0) {
      closeModal();
      return;
    }

    setLoading(true);
    setErr('');
    try {
      await apiFetch(`/admin-panel/users/${editing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      closeModal();
      await loadUsers(page, q, perPage);
    } catch (e: any) {
      setErr(e?.message || 'فشل تعديل المستخدم.');
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (u: UserRow) => {
    const next = !isActive(u);

    setLoading(true);
    setErr('');
    try {
      // ✅ robust: try different fields depending on DB schema
      await tryUpdate(u.id, [
        { is_active: next },
        { active: next },
        { status: next ? 'active' : 'inactive' },
      ]);

      await loadUsers(page, q, perPage);
    } catch (e: any) {
      setErr(e?.message || 'فشل تحديث حالة المستخدم.');
    } finally {
      setLoading(false);
    }
  };

  const setKycUser = async (u: UserRow, next: 'pending' | 'verified' | 'rejected') => {
    // ✅ ملاحظة: AdminPanel\UserController الحالي لا يدعم kyc_status
    // فهنعتمد على legacy admin endpoints (approve/reject). pending هنسيبه كعرض فقط.
    if (next === 'pending') return;

    setLoading(true);
    setErr('');
    try {
      if (next === 'verified') {
        await apiFetch(`/admin/dealers/${u.id}/approve-verification`, { method: 'POST' });
      } else {
        await apiFetch(`/admin/dealers/${u.id}/reject-verification`, { method: 'POST' });
      }
      await loadUsers(page, q, perPage);
    } catch (e: any) {
      setErr(e?.message || 'فشل تحديث حالة التوثيق (KYC).');
    } finally {
      setLoading(false);
    }
  };

  const onPerPageChange = async (v: number) => {
    setPerPage(v);
    await loadUsers(1, q, v);
  };

  return (
    <Layout title="المستخدمين">
      <div className="min-h-screen bg-gray-50/50">
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Header */}
          <div className="rounded-3xl bg-white border border-gray-100 shadow-sm p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">المستخدمين</h1>
                <p className="mt-2 text-sm text-gray-600">
                  مربوط على <span className="font-extrabold">/admin-panel/users</span> (بحث + Pagination + تعديل)
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => loadUsers(page, q, perPage)}
                  className="inline-flex items-center gap-2 rounded-2xl bg-white border border-gray-100 px-4 py-3 shadow-sm hover:bg-gray-50 transition"
                  disabled={loading}
                >
                  <ArrowPathIcon className="h-5 w-5 text-indigo-600" />
                  <span className="text-sm font-bold text-gray-800">تحديث</span>
                </button>
              </div>
            </div>

            {err && (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {err}
              </div>
            )}

            <div className="mt-5 flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
              <div className="relative w-full lg:max-w-lg">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="بحث بالاسم / البريد / النوع / ID / الهاتف"
                  className="w-full rounded-2xl border border-gray-100 bg-white px-12 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="text-sm text-gray-600">
                  الإجمالي:{' '}
                  <span className="font-extrabold text-gray-900">{loading ? '—' : stats.total}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-600">per page</span>
                  <select
                    value={perPage}
                    onChange={(e) => onPerPageChange(Number(e.target.value))}
                    className="rounded-2xl border border-gray-100 bg-white px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-200"
                    disabled={loading}
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6">
            <MiniCard title="إجمالي المستخدمين" value={loading ? '—' : String(stats.total)} icon={<UserIcon className="h-6 w-6 text-indigo-700" />} />
            <MiniCard title="نشط" value={loading ? '—' : String(stats.activeCount)} icon={<UserIcon className="h-6 w-6 text-emerald-700" />} />
            <MiniCard title="نشط اليوم (حسب updated_at)" value={loading ? '—' : String(stats.activeToday)} icon={<ClockIcon className="h-6 w-6 text-amber-700" />} />
            <MiniCard title="جدد هذا الأسبوع" value={loading ? '—' : String(stats.newThisWeek)} icon={<CalendarIcon className="h-6 w-6 text-violet-700" />} />
          </div>

          {/* Table */}
          <div className="rounded-3xl border border-gray-100 bg-white overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-gray-900">قائمة المستخدمين</h2>
              <div className="text-xs text-gray-400">
                Page {page} / {lastPage}
              </div>
            </div>

            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-right text-gray-500 border-b border-gray-100">
                    <th className="py-4 px-4">ID</th>
                    <th className="py-4 px-4">الاسم</th>
                    <th className="py-4 px-4">البريد</th>
                    <th className="py-4 px-4">النوع</th>
                    <th className="py-4 px-4">KYC</th>
                    <th className="py-4 px-4">الحالة</th>
                    <th className="py-4 px-4">تاريخ الإنشاء</th>
                    <th className="py-4 px-4">آخر تحديث</th>
                    <th className="py-4 px-4">إجراءات</th>
                  </tr>
                </thead>

                <tbody>
                  {loading && (
                    <tr>
                      <td colSpan={9} className="py-10 text-center text-gray-400">
                        جاري التحميل...
                      </td>
                    </tr>
                  )}

                  {!loading && users.length === 0 && (
                    <tr>
                      <td colSpan={9} className="py-10 text-center text-gray-500">
                        لا توجد نتائج
                      </td>
                    </tr>
                  )}

                  {!loading &&
                    users.map((u) => {
                      const active = isActive(u);

                      return (
                        <tr key={u.id} className="border-b border-gray-50 last:border-b-0">
                          <td className="py-4 px-4 font-extrabold text-gray-900">{u.id}</td>

                          <td className="py-4 px-4 text-gray-900">
                            <div className="font-bold">{displayName(u)}</div>
                            <div className="text-xs text-gray-500">{u.phone ?? ''}</div>
                          </td>

                          <td className="py-4 px-4 text-gray-700">{u.email}</td>
                          <td className="py-4 px-4 text-gray-600">{u.type ?? '—'}</td>
                          <td className="py-4 px-4">{badgeKyc(u.kyc_status)}</td>
                          <td className="py-4 px-4">{badgeStatus(u)}</td>
                          <td className="py-4 px-4 text-gray-600">{fmtDate(u.created_at)}</td>
                          <td className="py-4 px-4 text-gray-600">{fmtDate(u.updated_at)}</td>

                          <td className="py-3 px-4">
                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                onClick={() => openEdit(u)}
                                className="inline-flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-extrabold text-gray-800 hover:bg-gray-50"
                              >
                                <PencilSquareIcon className="h-4 w-4" />
                                تعديل
                              </button>

                              <button
                                onClick={() => toggleActive(u)}
                                disabled={loading}
                                className={`inline-flex items-center gap-1 rounded-xl border px-3 py-2 text-xs font-extrabold disabled:opacity-50 ${
                                  active
                                    ? 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100'
                                    : 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                                }`}
                              >
                                <PowerIcon className="h-4 w-4" />
                                {active ? 'تعطيل' : 'تفعيل'}
                              </button>

                              {/* KYC (legacy approve/reject only) */}
                              <select
                                value={((u.kyc_status ?? 'pending') as any)}
                                onChange={(e) => setKycUser(u, e.target.value as any)}
                                className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-extrabold text-gray-800"
                                disabled={loading}
                                title="KYC يتم عبر legacy admin dealers approve/reject"
                              >
                                <option value="pending">KYC: pending</option>
                                <option value="verified">KYC: verified</option>
                                <option value="rejected">KYC: rejected</option>
                              </select>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="p-4 border-t border-gray-100 flex items-center justify-between">
              <button
                disabled={loading || page <= 1}
                onClick={() => loadUsers(page - 1, q, perPage)}
                className="rounded-2xl border border-gray-100 bg-gray-50 hover:bg-gray-100 transition px-4 py-2 text-sm font-bold disabled:opacity-40"
              >
                السابق
              </button>

              <div className="text-sm text-gray-600">
                صفحة <span className="font-extrabold text-gray-900">{page}</span> من{' '}
                <span className="font-extrabold text-gray-900">{lastPage}</span>
              </div>

              <button
                disabled={loading || page >= lastPage}
                onClick={() => loadUsers(page + 1, q, perPage)}
                className="rounded-2xl border border-gray-100 bg-gray-50 hover:bg-gray-100 transition px-4 py-2 text-sm font-bold disabled:opacity-40"
              >
                التالي
              </button>
            </div>
          </div>

          {/* Edit Modal (قصير ومش مزعج) */}
          {open && (
            <div className="fixed inset-0 z-50">
              <button
                className="absolute inset-0 bg-black/45 supports-[backdrop-filter]:backdrop-blur-sm"
                aria-label="إغلاق"
                onClick={closeModal}
              />
              <div className="relative w-full h-full flex items-start justify-center p-4 sm:p-6">
                <div className="w-full max-w-2xl rounded-3xl bg-white border border-gray-100 shadow-xl overflow-hidden mt-10">
                  <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                    <div>
                      <div className="text-lg font-extrabold text-gray-900">تعديل المستخدم #{editing?.id}</div>
                      <div className="text-xs text-gray-500">Admin Panel</div>
                    </div>
                    <button
                      onClick={closeModal}
                      className="rounded-2xl border border-gray-100 bg-gray-50 hover:bg-gray-100 transition p-2"
                      aria-label="إغلاق"
                    >
                      <XMarkIcon className="h-5 w-5 text-gray-700" />
                    </button>
                  </div>

                  <div className="p-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <label className="text-sm font-bold text-gray-700">
                        الاسم الأول
                        <input
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className="mt-2 w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
                        />
                      </label>

                      <label className="text-sm font-bold text-gray-700">
                        الاسم الأخير
                        <input
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className="mt-2 w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
                        />
                      </label>

                      <label className="text-sm font-bold text-gray-700 sm:col-span-2">
                        البريد
                        <input
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="mt-2 w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
                        />
                      </label>

                      <label className="text-sm font-bold text-gray-700">
                        الهاتف
                        <input
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="mt-2 w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
                        />
                      </label>

                      <label className="text-sm font-bold text-gray-700">
                        النوع (type)
                        <input
                          value={type}
                          onChange={(e) => setType(e.target.value)}
                          placeholder="dealer / user / admin ..."
                          className="mt-2 w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
                        />
                      </label>
                    </div>

                    <div className="mt-4 text-xs text-gray-500 flex flex-wrap gap-3">
                      <span>Created: <span className="font-bold">{fmtDate(editing?.created_at ?? null)}</span></span>
                      <span>Updated: <span className="font-bold">{fmtDate(editing?.updated_at ?? null)}</span></span>
                      <span>Email verified: <span className="font-bold">{editing?.email_verified_at ? 'Yes' : 'No'}</span></span>
                    </div>
                  </div>

                  <div className="p-5 border-t border-gray-100 flex items-center justify-end gap-2">
                    <button
                      onClick={closeModal}
                      className="rounded-2xl border border-gray-100 bg-gray-50 hover:bg-gray-100 transition px-4 py-3 text-sm font-bold text-gray-900"
                      disabled={loading}
                    >
                      إلغاء
                    </button>

                    <button
                      onClick={saveEdit}
                      disabled={loading || !editing}
                      className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 text-white px-5 py-3 text-sm font-extrabold hover:bg-indigo-700 disabled:opacity-40"
                    >
                      <CheckBadgeIcon className="h-5 w-5" />
                      حفظ
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

function MiniCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-gray-100 bg-white shadow-sm p-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-gray-600">{title}</div>
          <div className="mt-3 text-3xl font-extrabold text-gray-900">{value}</div>
        </div>
        <div className="h-12 w-12 rounded-2xl bg-gray-50 flex items-center justify-center border border-gray-100">
          {icon}
        </div>
      </div>
      <div className="mt-5 h-2 rounded-full bg-gray-100 overflow-hidden">
        <div className="h-full w-2/3 bg-indigo-200" />
      </div>
    </div>
  );
}
