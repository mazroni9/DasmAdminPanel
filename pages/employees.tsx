import Layout from '../components/Layout';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { createPortal } from 'react-dom';
import { apiFetch } from '../utils/api';
import { getToken } from '../utils/authStorage';
import {
  UserPlusIcon,
  UserIcon,
  KeyIcon,
  TrashIcon,
  PencilIcon,
  EyeIcon,
  EyeSlashIcon,
  BuildingStorefrontIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

type EmployeeRole = 'admin' | 'employee';
type EmployeeStatus = 'active' | 'inactive' | string;

type Employee = {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  role: EmployeeRole;
  type?: string;
  permissions: string[];
  status: EmployeeStatus;
  is_active?: boolean;
  showroom?: string;
  created_at?: string;
  last_login?: string | null;
  [key: string]: any;
};

function extractEmployees(payload: any): Employee[] {
  const p = payload;
  const d1 = p?.data;
  if (Array.isArray(d1)) return d1;
  const d2 = d1?.data;
  if (Array.isArray(d2)) return d2;
  const d3 = d1?.data?.data;
  if (Array.isArray(d3)) return d3;
  if (Array.isArray(p)) return p;
  return [];
}

function getPagination(payload: any) {
  const pg = payload?.data;
  if (pg && typeof pg === 'object') {
    // Laravel paginator: data/current_page/last_page/total/per_page
    return {
      current_page: pg.current_page ?? 1,
      last_page: pg.last_page ?? 1,
      total: pg.total ?? 0,
      per_page: pg.per_page ?? 20,
    };
  }
  return { current_page: 1, last_page: 1, total: 0, per_page: 20 };
}

function formatDate(d?: string | null) {
  if (!d) return '—';
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return d;
  return x.toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' });
}

function getRoleLabel(role: EmployeeRole) {
  return role === 'admin' ? 'مدير' : 'موظف';
}

function roleBadge(role: EmployeeRole) {
  return role === 'admin'
    ? 'bg-purple-50 text-purple-800 border-purple-200'
    : 'bg-blue-50 text-blue-800 border-blue-200';
}

function isActive(emp: Employee) {
  if (typeof emp.is_active === 'boolean') return emp.is_active;
  const s = String(emp.status || '').toLowerCase();
  return s === 'active' || s === 'enabled' || s === '1' || s === 'true';
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
        <div
          className="absolute inset-0 bg-black/35 backdrop-blur-md"
          onClick={onClose}
          aria-hidden="true"
        />
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <div className="w-full max-w-3xl rounded-3xl bg-white shadow-2xl border border-gray-100 overflow-hidden">
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

            <div className="p-6">{children}</div>

            {footer && (
              <div className="p-5 border-t border-gray-100 flex items-center justify-end gap-2">
                {footer}
              </div>
            )}
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}

export default function Employees() {
  const router = useRouter();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const [q, setQ] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | EmployeeRole>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0, per_page: 20 });

  // Modals
  const [createOpen, setCreateOpen] = useState(false);
  const [editEmp, setEditEmp] = useState<Employee | null>(null);
  const [viewEmp, setViewEmp] = useState<Employee | null>(null);

  const [formError, setFormError] = useState('');

  const availablePermissions = [
    { key: 'add_cars', label: 'إضافة سيارات' },
    { key: 'edit_cars', label: 'تعديل السيارات' },
    { key: 'delete_cars', label: 'حذف السيارات' },
    { key: 'view_cars', label: 'عرض السيارات' },
    { key: 'manage_auctions', label: 'إدارة المزادات' },
    { key: 'view_reports', label: 'عرض التقارير' },
  ];

  const availableShowrooms = [
    { id: 'platform', name: 'المنصة الرئيسية' },
    { id: 'maz_brothers', name: 'معرض ماز براذرز' },
    { id: 'modern_cars', name: 'معرض السيارات الحديث' },
    { id: 'premium_cars', name: 'معرض السيارات الفاخرة' },
    { id: 'auto_center', name: 'مركز السيارات' },
  ];

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'employee' as EmployeeRole,
    password: '',
    permissions: [] as string[],
    showroom: 'المنصة الرئيسية',
  });

  const loadEmployees = async (pageToLoad = 1) => {
    setLoading(true);
    setErr('');
    try {
      const params = new URLSearchParams();
      params.set('page', String(pageToLoad));
      if (q.trim()) params.set('q', q.trim());
      params.set('per_page', String(pagination.per_page || 20));

      const res = await apiFetch<any>(`/admin/employees?${params.toString()}`, { method: 'GET' });
      const list = extractEmployees(res);
      setEmployees(list);
      setPagination(getPagination(res));
      setPage(pageToLoad);
    } catch (e: any) {
      setErr(e?.message || 'حدث خطأ أثناء تحميل الموظفين.');
      setEmployees([]);
      setPagination({ current_page: 1, last_page: 1, total: 0, per_page: 20 });
      setPage(1);
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
    loadEmployees(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredEmployees = useMemo(() => {
    const s = q.trim().toLowerCase();

    return employees.filter((emp) => {
      if (filterRole !== 'all' && emp.role !== filterRole) return false;

      const active = isActive(emp);
      if (filterStatus !== 'all') {
        if (filterStatus === 'active' && !active) return false;
        if (filterStatus === 'inactive' && active) return false;
      }

      if (!s) return true;
      const name = String(emp.name || '').toLowerCase();
      const email = String(emp.email || '').toLowerCase();
      const phone = String(emp.phone || '').toLowerCase();
      const showroom = String(emp.showroom || '').toLowerCase();
      const id = String(emp.id || '').toLowerCase();

      return (
        name.includes(s) ||
        email.includes(s) ||
        phone.includes(s) ||
        showroom.includes(s) ||
        id.includes(s)
      );
    });
  }, [employees, q, filterRole, filterStatus]);

  const stats = useMemo(() => {
    const total = employees.length;
    const active = employees.filter((e) => isActive(e)).length;
    const admins = employees.filter((e) => e.role === 'admin').length;
    const platform = employees.filter((e) => (e.showroom || '') === 'المنصة الرئيسية').length;
    return { total, active, admins, platform };
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
      role: 'employee',
      password: '',
      permissions: [],
      showroom: 'المنصة الرئيسية',
    });
  };

  const openEdit = (emp: Employee) => {
    setFormError('');
    setEditEmp(emp);
    setCreateOpen(false);
    setViewEmp(null);
    setForm({
      name: emp.name || '',
      email: emp.email || '',
      phone: emp.phone ? String(emp.phone) : '',
      role: emp.role || 'employee',
      password: '',
      permissions: Array.isArray(emp.permissions) ? emp.permissions : [],
      showroom: emp.showroom || 'المنصة الرئيسية',
    });
  };

  const openView = (emp: Employee) => {
    setViewEmp(emp);
    setEditEmp(null);
    setCreateOpen(false);
    setFormError('');
  };

  const closeModal = () => {
    setCreateOpen(false);
    setEditEmp(null);
    setViewEmp(null);
    setFormError('');
  };

  const handleCreate = async () => {
    setFormError('');

    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      setFormError('يرجى إدخال الاسم + البريد + كلمة المرور.');
      return;
    }

    try {
      await apiFetch<any>(`/admin/employees`, {
        method: 'POST',
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          role: form.role,
          password: form.password,
          permissions: form.permissions,
          // showroom: form.showroom (الـ backend الحالي بيحسبه تلقائيًا)
        }),
      });

      await loadEmployees(page);
      closeModal();
    } catch (e: any) {
      setFormError(e?.message || 'تعذر إنشاء الموظف.');
    }
  };

  const handleUpdate = async () => {
    if (!editEmp) return;
    setFormError('');

    if (!form.name.trim()) {
      setFormError('يرجى إدخال الاسم.');
      return;
    }

    try {
      const payload: any = {
        name: form.name,
        phone: form.phone,
        role: form.role,
        permissions: form.permissions,
      };
      if (form.password.trim()) payload.password = form.password;

      await apiFetch<any>(`/admin/employees/${editEmp.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      await loadEmployees(page);
      closeModal();
    } catch (e: any) {
      setFormError(e?.message || 'تعذر تحديث الموظف.');
    }
  };

  const toggleStatus = async (emp: Employee) => {
    const next = !isActive(emp);
    try {
      await apiFetch<any>(`/admin/employees/${emp.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active: next }),
      });
      await loadEmployees(page);
    } catch (e: any) {
      alert(e?.message || 'تعذر تغيير حالة الموظف.');
    }
  };

  const handleDelete = async (emp: Employee) => {
    if (!confirm(`هل أنت متأكد من حذف ${emp.name}؟`)) return;
    try {
      await apiFetch<any>(`/admin/employees/${emp.id}`, { method: 'DELETE' });
      await loadEmployees(page);
    } catch (e: any) {
      alert(e?.message || 'تعذر حذف الموظف.');
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
                إضافة وتعديل وحذف وتفعيل/تعطيل الموظفين — مربوط بالـ Backend
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
                placeholder="بحث بالاسم / البريد / الهاتف / المعرض / ID"
                className="w-full rounded-2xl border border-gray-100 bg-white px-12 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>

            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm font-semibold text-gray-600">الدور:</span>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value as any)}
                className="rounded-2xl border border-gray-100 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="all">الكل</option>
                <option value="admin">مدير</option>
                <option value="employee">موظف</option>
              </select>

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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6">
          <MiniCard
            title="إجمالي الموظفين"
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
            title="مديرين"
            value={loading ? '—' : String(stats.admins)}
            icon={<KeyIcon className="h-6 w-6 text-purple-700" />}
            accent="bg-purple-50"
          />
          <MiniCard
            title="المنصة الرئيسية"
            value={loading ? '—' : String(stats.platform)}
            icon={<BuildingStorefrontIcon className="h-6 w-6 text-indigo-700" />}
            accent="bg-indigo-50"
          />
        </div>

        {/* Table */}
        <div className="rounded-3xl border border-gray-100 bg-white overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-gray-900">قائمة الموظفين</h2>

            <div className="text-sm text-gray-600">
              الإجمالي: <span className="font-extrabold text-gray-900">{loading ? '—' : pagination.total}</span>
            </div>
          </div>

          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-right text-gray-500 border-b border-gray-100">
                  <th className="py-4 px-4">#</th>
                  <th className="py-4 px-4">الموظف</th>
                  <th className="py-4 px-4">البريد</th>
                  <th className="py-4 px-4">الدور</th>
                  <th className="py-4 px-4">المعرض</th>
                  <th className="py-4 px-4">الحالة</th>
                  <th className="py-4 px-4">آخر دخول</th>
                  <th className="py-4 px-4">إجراءات</th>
                </tr>
              </thead>

              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-gray-400">
                      جاري التحميل...
                    </td>
                  </tr>
                )}

                {!loading && filteredEmployees.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-gray-500">
                      لا توجد نتائج مطابقة
                    </td>
                  </tr>
                )}

                {!loading &&
                  filteredEmployees.map((emp) => {
                    const active = isActive(emp);
                    return (
                      <tr key={emp.id} className="border-b border-gray-50 last:border-b-0">
                        <td className="py-4 px-4 font-extrabold text-gray-900">{emp.id}</td>

                        <td className="py-4 px-4 text-gray-900">
                          <div className="font-bold">{emp.name || `User #${emp.id}`}</div>
                          <div className="text-xs text-gray-500">{emp.phone || '—'}</div>
                        </td>

                        <td className="py-4 px-4 text-gray-700">{emp.email}</td>

                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center rounded-xl border px-2 py-1 text-xs font-extrabold ${roleBadge(emp.role)}`}>
                            {getRoleLabel(emp.role)}
                          </span>
                        </td>

                        <td className="py-4 px-4">
                          <span className="inline-flex items-center rounded-xl border border-gray-200 bg-gray-50 px-2 py-1 text-xs font-bold text-gray-800">
                            {emp.showroom || '—'}
                          </span>
                        </td>

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

                        <td className="py-4 px-4 text-gray-600">{formatDate(emp.last_login)}</td>

                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openView(emp)}
                              className="inline-flex items-center gap-1 rounded-xl border border-gray-100 bg-gray-50 hover:bg-gray-100 transition px-3 py-2 text-xs font-bold text-gray-900"
                              title="عرض"
                            >
                              <KeyIcon className="h-4 w-4" />
                              صلاحيات
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
          subtitle={createOpen ? 'Create Employee' : editEmp ? `Edit #${editEmp.id}` : undefined}
          onClose={closeModal}
          footer={
            <>
              <button
                onClick={closeModal}
                className="rounded-2xl border border-gray-100 bg-gray-50 hover:bg-gray-100 transition px-4 py-3 text-sm font-bold text-gray-900"
              >
                إغلاق
              </button>
              {editEmp && (
                <button
                  onClick={handleUpdate}
                  className="rounded-2xl bg-blue-600 hover:bg-blue-700 transition px-4 py-3 text-sm font-bold text-white"
                >
                  حفظ التعديل
                </button>
              )}
              {createOpen && (
                <button
                  onClick={handleCreate}
                  className="rounded-2xl bg-blue-600 hover:bg-blue-700 transition px-4 py-3 text-sm font-bold text-white"
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
              label="الاسم"
              value={form.name}
              onChange={(v) => setForm({ ...form, name: v })}
              placeholder="اسم الموظف"
            />
            <Input
              label="البريد الإلكتروني"
              value={form.email}
              onChange={(v) => setForm({ ...form, email: v })}
              placeholder="email@example.com"
              disabled={!!editEmp} // البريد ثابت في update في الكنترولر الحالي
            />
            <Input
              label="رقم الهاتف"
              value={form.phone}
              onChange={(v) => setForm({ ...form, phone: v })}
              placeholder="0500000000"
            />

            <div>
              <label className="block text-sm font-extrabold text-gray-900 mb-2">الصلاحية</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as EmployeeRole })}
                className="w-full rounded-2xl border border-gray-100 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="employee">موظف</option>
                <option value="admin">مدير</option>
              </select>
            </div>

            <Input
              label={createOpen ? 'كلمة المرور' : 'كلمة المرور (اختياري)'}
              value={form.password}
              onChange={(v) => setForm({ ...form, password: v })}
              placeholder={createOpen ? 'كلمة المرور' : 'اتركها فارغة إذا لا تريد التغيير'}
              type="password"
            />

            <div>
              <label className="block text-sm font-extrabold text-gray-900 mb-2">المعرض (عرض فقط)</label>
              <select
                value={form.showroom}
                onChange={(e) => setForm({ ...form, showroom: e.target.value })}
                className="w-full rounded-2xl border border-gray-100 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
              >
                {availableShowrooms.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
              <div className="mt-2 text-xs text-gray-500">
                * الـ Backend الحالي بيحدد المعرض تلقائيًا حسب Organization، الحقل هنا لعرض/تنسيق الواجهة فقط.
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-extrabold text-gray-900 mb-2">الصلاحيات</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {availablePermissions.map((p) => (
                  <label key={p.key} className="flex items-center rounded-2xl border border-gray-100 bg-gray-50 px-3 py-2">
                    <input
                      type="checkbox"
                      checked={form.permissions.includes(p.key)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setForm({ ...form, permissions: [...form.permissions, p.key] });
                        } else {
                          setForm({ ...form, permissions: form.permissions.filter((x) => x !== p.key) });
                        }
                      }}
                      className="ml-2"
                    />
                    <span className="text-sm text-gray-800 font-semibold">{p.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </Modal>

        {/* View Permissions Modal */}
        <Modal
          open={!!viewEmp}
          title="صلاحيات الموظف"
          subtitle={viewEmp ? `${viewEmp.name} — #${viewEmp.id}` : undefined}
          onClose={closeModal}
          footer={
            <button
              onClick={closeModal}
              className="rounded-2xl border border-gray-100 bg-gray-50 hover:bg-gray-100 transition px-4 py-3 text-sm font-bold text-gray-900"
            >
              إغلاق
            </button>
          }
        >
          {viewEmp && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="الاسم" value={viewEmp.name} />
                <Field label="البريد" value={viewEmp.email} />
                <Field label="الهاتف" value={viewEmp.phone || '—'} />
                <Field label="الدور" value={getRoleLabel(viewEmp.role)} />
                <Field label="المعرض" value={viewEmp.showroom || '—'} />
                <Field label="الحالة" value={isActive(viewEmp) ? 'نشط' : 'غير نشط'} />
              </div>

              <div>
                <div className="text-sm font-extrabold text-gray-900 mb-2">الصلاحيات</div>
                {Array.isArray(viewEmp.permissions) && viewEmp.permissions.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {viewEmp.permissions.map((perm) => (
                      <span
                        key={perm}
                        className="inline-flex items-center rounded-2xl border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-bold text-gray-900"
                      >
                        {perm}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">لا توجد صلاحيات (أو لم يتم تفعيل Spatie بالكامل).</div>
                )}
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
