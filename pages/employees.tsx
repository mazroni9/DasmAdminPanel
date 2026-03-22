import Layout from '../components/Layout';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { createPortal } from 'react-dom';
import { apiFetch } from '../utils/api';
import { getToken } from '../utils/authStorage';
import {
  UserPlusIcon,
  UserIcon,
  TrashIcon,
  PencilIcon,
  EyeIcon,
  EyeSlashIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  XMarkIcon,
  ClipboardDocumentIcon,
} from '@heroicons/react/24/outline';

type EmployeeApi = {
  id: number;
  first_name?: string | null;
  last_name?: string | null;
  name?: string | null; // legacy
  email: string;
  phone?: string | null;
  type?: string | null;
  role?: string | null;
  status?: string | null;
  is_active?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
  email_verified_at?: string | null;
  [key: string]: any;
};

type Paginator<T> = {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

type ApiResponse<T> =
  | { status: 'success'; data: T }
  | { ok: true; data: T }
  | any;

function extractEmployees(payload: any): EmployeeApi[] {
  const list = payload?.data?.data;
  if (Array.isArray(list)) return list as EmployeeApi[];
  const list2 = payload?.data;
  if (Array.isArray(list2)) return list2 as EmployeeApi[];
  if (Array.isArray(payload)) return payload as EmployeeApi[];
  return [];
}

function extractPaginator(payload: any): Paginator<EmployeeApi> | null {
  const pg = payload?.data;
  if (pg && typeof pg === 'object' && Array.isArray(pg.data)) {
    return {
      data: pg.data,
      current_page: Number(pg.current_page ?? 1),
      last_page: Number(pg.last_page ?? 1),
      per_page: Number(pg.per_page ?? 15),
      total: Number(pg.total ?? pg.data.length ?? 0),
    };
  }
  return null;
}

function employeeDisplayName(u: EmployeeApi) {
  const full = `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim();
  if (full) return full;
  if (u.name && String(u.name).trim()) return String(u.name).trim();
  return u.email ? u.email.split('@')[0] : `User #${u.id}`;
}

function isActive(u: EmployeeApi) {
  if (typeof u.is_active === 'boolean') return u.is_active;
  const s = String(u.status ?? '').toLowerCase();
  return s === 'active' || s === 'enabled' || s === '1' || s === 'true';
}

function fmtDateTime(v?: string | null) {
  if (!v) return '—';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('ar-SA', { dateStyle: 'medium', timeStyle: 'short' });
}

function statusBadge(active: boolean) {
  return active
    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
    : 'bg-rose-50 text-rose-800 border-rose-200';
}

function ModalPortal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(children, document.body);
}

function Modal({
  open,
  title,
  subtitle,
  onClose,
  children,
  footer,
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);

    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[9999]">
        <div className="absolute inset-0 bg-black/35 backdrop-blur-md" onClick={onClose} aria-hidden="true" />
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl max-h-[88vh] rounded-3xl bg-white shadow-2xl border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <div className="text-lg font-extrabold text-gray-900">{title}</div>
                {subtitle && <div className="text-xs text-gray-500 mt-1">{subtitle}</div>}
              </div>
              <button
                onClick={onClose}
                className="rounded-2xl border border-gray-100 bg-gray-50 hover:bg-gray-100 transition p-2"
                aria-label="إغلاق"
              >
                <XMarkIcon className="h-5 w-5 text-gray-700" />
              </button>
            </div>

            {/* مهم: نخلي المحتوى “مضغوط” وما يعملش سكرول مزعج */}
            <div className="p-6 overflow-auto max-h-[62vh]">{children}</div>

            {footer && (
              <div className="p-5 border-t border-gray-100 flex items-center justify-end gap-2">{footer}</div>
            )}
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}

export default function Employees() {
  const router = useRouter();

  const [employees, setEmployees] = useState<EmployeeApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const [q, setQ] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0, per_page: 15 });

  // Modals
  const [createOpen, setCreateOpen] = useState(false);
  const [editEmp, setEditEmp] = useState<EmployeeApi | null>(null);
  const [viewEmp, setViewEmp] = useState<EmployeeApi | null>(null);

  // After create: show the password backend returned
  const [createdCreds, setCreatedCreds] = useState<{ open: boolean; email: string; password: string } | null>(null);

  const [formError, setFormError] = useState('');

  // Backend EmployeeController fields
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    is_active: true,
  });

  const loadEmployees = async (pageToLoad = 1, overridePerPage?: number) => {
    setLoading(true);
    setErr('');
    try {
      const params = new URLSearchParams();
      params.set('page', String(pageToLoad));
      params.set('per_page', String(overridePerPage ?? perPage));
      if (q.trim()) params.set('q', q.trim());

      const res = await apiFetch<ApiResponse<Paginator<EmployeeApi>>>(`/admin/employees?${params.toString()}`, {
        method: 'GET',
      });

      const pg = extractPaginator(res);
      const list = pg ? pg.data : extractEmployees(res);

      setEmployees(list);
      if (pg) {
        setPagination({
          current_page: pg.current_page,
          last_page: pg.last_page,
          total: pg.total,
          per_page: pg.per_page,
        });
        setPerPage(pg.per_page);
      } else {
        setPagination({ current_page: pageToLoad, last_page: 1, total: list.length, per_page: overridePerPage ?? perPage });
      }

      setPage(pageToLoad);
    } catch (e: any) {
      setErr(e?.message || 'حدث خطأ أثناء تحميل الموظفين.');
      setEmployees([]);
      setPagination({ current_page: 1, last_page: 1, total: 0, per_page: perPage });
      setPage(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace(
        `/auth/login?returnUrl=${encodeURIComponent(router.asPath)}`
      );
      return;
    }
    loadEmployees(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredEmployees = useMemo(() => {
    const s = q.trim().toLowerCase();

    return employees.filter((emp) => {
      const active = isActive(emp);

      if (filterStatus !== 'all') {
        if (filterStatus === 'active' && !active) return false;
        if (filterStatus === 'inactive' && active) return false;
      }

      // حتى لو السيرفر بيعمل search، نخلي العميل كمان robust
      if (!s) return true;
      const name = employeeDisplayName(emp).toLowerCase();
      const email = String(emp.email || '').toLowerCase();
      const phone = String(emp.phone || '').toLowerCase();
      const id = String(emp.id || '').toLowerCase();
      return name.includes(s) || email.includes(s) || phone.includes(s) || id.includes(s);
    });
  }, [employees, q, filterStatus]);

  const stats = useMemo(() => {
    const total = employees.length;
    const active = employees.filter((e) => isActive(e)).length;
    const inactive = total - active;
    return { total, active, inactive };
  }, [employees]);

  const openCreate = () => {
    setFormError('');
    setCreateOpen(true);
    setEditEmp(null);
    setViewEmp(null);
    setForm({
      name: '',
      email: '',
      phone: '',
      password: '',
      is_active: true,
    });
  };

  const openEdit = (emp: EmployeeApi) => {
    setFormError('');
    setEditEmp(emp);
    setCreateOpen(false);
    setViewEmp(null);
    setForm({
      name: employeeDisplayName(emp),
      email: emp.email || '',
      phone: emp.phone ? String(emp.phone) : '',
      password: '',
      is_active: isActive(emp),
    });
  };

  const openView = async (emp: EmployeeApi) => {
    setFormError('');
    setEditEmp(null);
    setCreateOpen(false);

    // الأفضل: نقرأ من show endpoint عشان يبقى أحدث
    try {
      const res = await apiFetch<any>(`/admin/employees/${emp.id}`, { method: 'GET' });
      const data = res?.data && typeof res.data === 'object' ? (res.data as EmployeeApi) : (emp as EmployeeApi);
      setViewEmp(data);
    } catch {
      setViewEmp(emp);
    }
  };

  const closeAll = () => {
    setCreateOpen(false);
    setEditEmp(null);
    setViewEmp(null);
    setFormError('');
  };

  const handleCreate = async () => {
    setFormError('');

    if (!form.email.trim()) {
      setFormError('يرجى إدخال البريد الإلكتروني.');
      return;
    }

    try {
      const payload: any = {
        email: form.email.trim(),
        phone: form.phone?.trim() ? form.phone.trim() : null,
        is_active: !!form.is_active,
      };

      // اسم واحد (الـ backend بيعمل split لو first_name مش متبعت)
      if (form.name.trim()) payload.name = form.name.trim();

      // كلمة المرور اختيارية في الـ backend (لو فاضية هيولّد ويرجع plain_password)
      if (form.password.trim()) payload.password = form.password.trim();

      const res = await apiFetch<any>(`/admin/employees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      // ريفرش اللست
      await loadEmployees(page);

      // اقفل المودال واظهر الباسورد اللي رجع من السيرفر
      setCreateOpen(false);

      const pw = String(res?.plain_password ?? '').trim();
      if (pw) {
        setCreatedCreds({ open: true, email: payload.email, password: pw });
      }
    } catch (e: any) {
      setFormError(e?.message || 'تعذر إنشاء الموظف.');
    }
  };

  const handleUpdate = async () => {
    if (!editEmp) return;
    setFormError('');

    if (!form.email.trim()) {
      setFormError('البريد الإلكتروني مطلوب.');
      return;
    }

    try {
      const payload: any = {
        email: form.email.trim(),
        phone: form.phone?.trim() ? form.phone.trim() : null,
        is_active: !!form.is_active,
      };

      if (form.name.trim()) payload.name = form.name.trim();
      if (form.password.trim()) payload.password = form.password.trim();

      await apiFetch<any>(`/admin/employees/${editEmp.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      await loadEmployees(page);
      closeAll();
    } catch (e: any) {
      setFormError(e?.message || 'تعذر تحديث الموظف.');
    }
  };

  const toggleStatus = async (emp: EmployeeApi) => {
    const next = !isActive(emp);
    try {
      await apiFetch<any>(`/admin/employees/${emp.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: next }),
      });
      await loadEmployees(page);
    } catch (e: any) {
      alert(e?.message || 'تعذر تغيير حالة الموظف.');
    }
  };

  const handleDelete = async (emp: EmployeeApi) => {
    const name = employeeDisplayName(emp);
    if (!confirm(`هل أنت متأكد من حذف الموظف "${name}"؟`)) return;
    try {
      await apiFetch<any>(`/admin/employees/${emp.id}`, { method: 'DELETE' });
      // لو الصفحة فضيت بعد الحذف، ارجع صفحة
      const willBeEmpty = filteredEmployees.length === 1 && page > 1;
      await loadEmployees(willBeEmpty ? page - 1 : page);
    } catch (e: any) {
      alert(e?.message || 'تعذر حذف الموظف.');
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // fallback بسيط
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
  };

  return (
    <Layout title="إدارة الموظفين">
      <div className="space-y-6">
        {/* Header */}
        <div className="rounded-3xl bg-gradient-to-br from-blue-50 to-white border border-gray-100 p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">إدارة الموظفين</h1>
              <p className="mt-2 text-sm text-gray-600">
                CRUD كامل + تفعيل/تعطيل — مربوط بـ Admin EmployeeController
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => loadEmployees(page)}
                className="inline-flex items-center gap-2 rounded-2xl bg-white border border-gray-100 px-4 py-3 shadow-sm hover:bg-gray-50 transition"
              >
                <ArrowPathIcon className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-semibold text-gray-800">تحديث</span>
              </button>

              <button
                onClick={openCreate}
                className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 text-white px-4 py-3 shadow-sm hover:bg-blue-700 transition"
              >
                <UserPlusIcon className="h-5 w-5" />
                <span className="text-sm font-semibold">إضافة موظف</span>
              </button>
            </div>
          </div>

          {err && (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {err}
            </div>
          )}

          {/* Search + Filters */}
          <div className="mt-5 flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-lg">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') loadEmployees(1);
                }}
                placeholder="بحث بالاسم / البريد / الهاتف / ID"
                className="w-full rounded-2xl border border-gray-100 bg-white px-12 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>

            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm font-semibold text-gray-600">الحالة:</span>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="rounded-2xl border border-gray-100 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="all">الكل</option>
                <option value="active">نشط</option>
                <option value="inactive">غير نشط</option>
              </select>

              <span className="text-sm font-semibold text-gray-600">عدد/صفحة:</span>
              <select
                value={perPage}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  setPerPage(n);
                  loadEmployees(1, n);
                }}
                className="rounded-2xl border border-gray-100 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>

              <button
                onClick={() => loadEmployees(1)}
                className="rounded-2xl bg-gray-900 text-white px-4 py-3 text-sm font-bold hover:bg-black transition"
              >
                تطبيق (سيرفر)
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <MiniCard
            title="إجمالي (في الصفحة الحالية)"
            value={loading ? '—' : String(stats.total)}
            icon={<UserIcon className="h-6 w-6 text-blue-700" />}
            accent="bg-blue-50"
          />
          <MiniCard
            title="نشط"
            value={loading ? '—' : String(stats.active)}
            icon={<EyeIcon className="h-6 w-6 text-emerald-700" />}
            accent="bg-emerald-50"
          />
          <MiniCard
            title="غير نشط"
            value={loading ? '—' : String(stats.inactive)}
            icon={<EyeSlashIcon className="h-6 w-6 text-rose-700" />}
            accent="bg-rose-50"
          />
        </div>

        {/* Table */}
        <div className="rounded-3xl border border-gray-100 bg-white overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-gray-900">قائمة الموظفين</h2>

            <div className="text-sm text-gray-600">
              الإجمالي (سيرفر):{' '}
              <span className="font-extrabold text-gray-900">{loading ? '—' : pagination.total}</span>
            </div>
          </div>

          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-right text-gray-500 border-b border-gray-100">
                  <th className="py-4 px-4">#</th>
                  <th className="py-4 px-4">الموظف</th>
                  <th className="py-4 px-4">البريد</th>
                  <th className="py-4 px-4">الحالة</th>
                  <th className="py-4 px-4">تاريخ الإنشاء</th>
                  <th className="py-4 px-4">إجراءات</th>
                </tr>
              </thead>

              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-gray-400">
                      جاري التحميل...
                    </td>
                  </tr>
                )}

                {!loading && filteredEmployees.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-gray-500">
                      لا توجد نتائج مطابقة
                    </td>
                  </tr>
                )}

                {!loading &&
                  filteredEmployees.map((emp) => {
                    const active = isActive(emp);
                    const name = employeeDisplayName(emp);

                    return (
                      <tr key={emp.id} className="border-b border-gray-50 last:border-b-0">
                        <td className="py-4 px-4 font-extrabold text-gray-900">{emp.id}</td>

                        <td className="py-4 px-4 text-gray-900">
                          <div className="font-bold">{name}</div>
                          <div className="text-xs text-gray-500">{emp.phone || '—'}</div>
                        </td>

                        <td className="py-4 px-4 text-gray-700">{emp.email}</td>

                        <td className="py-4 px-4">
                          <button
                            onClick={() => toggleStatus(emp)}
                            className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-extrabold transition ${statusBadge(active)}`}
                            title="تغيير الحالة"
                          >
                            {active ? <EyeIcon className="h-4 w-4" /> : <EyeSlashIcon className="h-4 w-4" />}
                            {active ? 'نشط' : 'غير نشط'}
                          </button>
                        </td>

                        <td className="py-4 px-4 text-gray-600">{fmtDateTime(emp.created_at)}</td>

                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openView(emp)}
                              className="inline-flex items-center gap-1 rounded-xl border border-gray-100 bg-gray-50 hover:bg-gray-100 transition px-3 py-2 text-xs font-bold text-gray-900"
                              title="عرض"
                            >
                              <EyeIcon className="h-4 w-4" />
                              عرض
                            </button>

                            <button
                              onClick={() => openEdit(emp)}
                              className="inline-flex items-center gap-1 rounded-xl border border-gray-100 bg-amber-50 hover:bg-amber-100 transition px-3 py-2 text-xs font-bold text-amber-800"
                              title="تعديل"
                            >
                              <PencilIcon className="h-4 w-4" />
                              تعديل
                            </button>

                            <button
                              onClick={() => handleDelete(emp)}
                              className="inline-flex items-center gap-1 rounded-xl border border-gray-100 bg-red-50 hover:bg-red-100 transition px-3 py-2 text-xs font-bold text-red-700"
                              title="حذف"
                            >
                              <TrashIcon className="h-4 w-4" />
                              حذف
                            </button>
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
            <div className="text-xs text-gray-500">
              صفحة {pagination.current_page} من {pagination.last_page}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => loadEmployees(Math.max(1, page - 1))}
                disabled={loading || page <= 1}
                className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-2 text-sm font-bold text-gray-900 disabled:opacity-50 hover:bg-gray-100 transition"
              >
                السابق
              </button>
              <button
                onClick={() => loadEmployees(Math.min(pagination.last_page, page + 1))}
                disabled={loading || page >= pagination.last_page}
                className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-2 text-sm font-bold text-gray-900 disabled:opacity-50 hover:bg-gray-100 transition"
              >
                التالي
              </button>
            </div>
          </div>
        </div>

        {/* Create/Edit Modal */}
        <Modal
          open={createOpen || !!editEmp}
          title={createOpen ? 'إضافة موظف جديد' : 'تعديل موظف'}
          subtitle={createOpen ? 'POST /admin/employees' : editEmp ? `PUT /admin/employees/${editEmp.id}` : undefined}
          onClose={closeAll}
          footer={
            <>
              <button
                onClick={closeAll}
                className="rounded-2xl border border-gray-100 bg-gray-50 hover:bg-gray-100 transition px-4 py-3 text-sm font-bold text-gray-900"
              >
                إغلاق
              </button>
              {editEmp && (
                <button
                  onClick={handleUpdate}
                  disabled={loading}
                  className="rounded-2xl bg-blue-600 hover:bg-blue-700 transition px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
                >
                  حفظ التعديل
                </button>
              )}
              {createOpen && (
                <button
                  onClick={handleCreate}
                  disabled={loading}
                  className="rounded-2xl bg-blue-600 hover:bg-blue-700 transition px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
                >
                  إنشاء
                </button>
              )}
            </>
          }
        >
          {formError && (
            <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="الاسم (اختياري)"
              value={form.name}
              onChange={(v) => setForm({ ...form, name: v })}
              placeholder="مثال: Ahmed Ali"
            />

            <Input
              label="البريد الإلكتروني"
              value={form.email}
              onChange={(v) => setForm({ ...form, email: v })}
              placeholder="email@example.com"
            />

            <Input
              label="رقم الهاتف (اختياري)"
              value={form.phone}
              onChange={(v) => setForm({ ...form, phone: v })}
              placeholder="0500000000"
            />

            <Input
              label={createOpen ? 'كلمة المرور (اختياري)' : 'كلمة المرور (اختياري للتغيير)'}
              value={form.password}
              onChange={(v) => setForm({ ...form, password: v })}
              placeholder={createOpen ? 'اتركها فارغة لتوليد كلمة مرور' : 'اتركها فارغة إذا لا تريد تغييرها'}
              type="password"
            />

            <div className="md:col-span-2 flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
              <div>
                <div className="text-sm font-extrabold text-gray-900">حالة الموظف</div>
                <div className="text-xs text-gray-500 mt-1">دي بتتبعت كـ is_active للـ Backend</div>
              </div>

              <button
                type="button"
                onClick={() => setForm({ ...form, is_active: !form.is_active })}
                className={`inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-xs font-extrabold transition ${
                  form.is_active
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                    : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                }`}
              >
                {form.is_active ? <EyeIcon className="h-4 w-4" /> : <EyeSlashIcon className="h-4 w-4" />}
                {form.is_active ? 'نشط' : 'غير نشط'}
              </button>
            </div>

            <div className="md:col-span-2 text-xs text-gray-500">
              * ملاحظة: الـ Backend بيجبر role/type = employee، ومفيش permissions/showroom في الكنترولر ده حالياً.
            </div>
          </div>
        </Modal>

        {/* View Modal */}
        <Modal
          open={!!viewEmp}
          title="تفاصيل الموظف"
          subtitle={viewEmp ? `GET /admin/employees/${viewEmp.id}` : undefined}
          onClose={closeAll}
          footer={
            <button
              onClick={closeAll}
              className="rounded-2xl border border-gray-100 bg-gray-50 hover:bg-gray-100 transition px-4 py-3 text-sm font-bold text-gray-900"
            >
              إغلاق
            </button>
          }
        >
          {viewEmp && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="ID" value={viewEmp.id} />
              <Field label="الاسم" value={employeeDisplayName(viewEmp)} />
              <Field label="البريد" value={viewEmp.email} />
              <Field label="الهاتف" value={viewEmp.phone || '—'} />
              <Field label="الحالة" value={isActive(viewEmp) ? 'نشط' : 'غير نشط'} />
              <Field label="تاريخ الإنشاء" value={fmtDateTime(viewEmp.created_at)} />
              <Field label="آخر تحديث" value={fmtDateTime(viewEmp.updated_at)} />
              <Field label="Email Verified" value={viewEmp.email_verified_at ? 'Yes' : 'No'} />
            </div>
          )}
        </Modal>

        {/* Created Password Modal */}
        <Modal
          open={!!createdCreds?.open}
          title="تم إنشاء الموظف"
          subtitle={createdCreds ? createdCreds.email : undefined}
          onClose={() => setCreatedCreds(null)}
          footer={
            <button
              onClick={() => setCreatedCreds(null)}
              className="rounded-2xl bg-blue-600 hover:bg-blue-700 transition px-4 py-3 text-sm font-bold text-white"
            >
              تمام
            </button>
          }
        >
          {createdCreds && (
            <div className="space-y-3">
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                احتفظ بكلمة المرور دي — السيرفر رجّعها كـ <b>plain_password</b>.
              </div>

              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs font-bold text-gray-500">Password</div>
                  <div className="mt-1 font-extrabold text-gray-900 break-all">{createdCreds.password}</div>
                </div>

                <button
                  onClick={() => copyToClipboard(createdCreds.password)}
                  className="shrink-0 inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-3 py-2 text-xs font-extrabold text-gray-900 hover:bg-gray-50"
                >
                  <ClipboardDocumentIcon className="h-4 w-4" />
                  نسخ
                </button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </Layout>
  );
}

function MiniCard({
  title,
  value,
  icon,
  accent,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <div className="rounded-3xl border border-gray-100 bg-white shadow-sm p-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-gray-600">{title}</div>
          <div className="mt-3 text-3xl font-extrabold text-gray-900">{value}</div>
        </div>
        <div className={`h-12 w-12 rounded-2xl ${accent} flex items-center justify-center border border-gray-100`}>
          {icon}
        </div>
      </div>
      <div className="mt-5 h-2 rounded-full bg-gray-100 overflow-hidden">
        <div className="h-full w-2/3 bg-blue-200" />
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
      <div className="text-xs font-bold text-gray-500">{label}</div>
      <div className="mt-2 text-sm font-extrabold text-gray-900 break-words">
        {value === null || value === undefined || value === '' ? '—' : String(value)}
      </div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-extrabold text-gray-900 mb-2">{label}</label>
      <input
        type={type}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-gray-100 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-gray-50 disabled:text-gray-500"
      />
    </div>
  );
}
