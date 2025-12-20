import Layout from '../components/Layout';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { createPortal } from 'react-dom';
import { apiFetch } from '../utils/api';
import { getToken } from '../utils/authStorage';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  TruckIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

type CarStatus = 'active' | 'pending' | 'sold' | 'auction' | string;

type Car = {
  id: number;
  make?: string;
  model?: string;
  year?: number;
  color?: string;
  price?: number | string;
  status?: CarStatus;
  mileage?: number;
  fuel_type?: string;
  transmission?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
};

function extractCars(payload: any): Car[] {
  const p = payload;
  const a1 = p?.data;
  if (Array.isArray(a1)) return a1;
  const a2 = a1?.data;
  if (Array.isArray(a2)) return a2;
  if (Array.isArray(p)) return p;
  return [];
}

function getStatusLabel(status?: string) {
  const s = (status || '').toLowerCase();
  if (s === 'active' || s === 'approved' || s === 'live') return 'نشط';
  if (s === 'pending') return 'بانتظار';
  if (s === 'sold') return 'مباع';
  if (s === 'auction') return 'في المزاد';
  return status || '—';
}

function badgeClass(status?: string) {
  const s = (status || '').toLowerCase();
  if (s === 'active' || s === 'approved' || s === 'live') {
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  }
  if (s === 'pending') {
    return 'bg-amber-50 text-amber-700 border-amber-200';
  }
  if (s === 'sold') {
    return 'bg-indigo-50 text-indigo-700 border-indigo-200';
  }
  if (s === 'auction') {
    return 'bg-violet-50 text-violet-700 border-violet-200';
  }
  return 'bg-gray-100 text-gray-700 border-gray-200';
}

function formatCurrency(amount: any) {
  const n = Number(amount);
  if (Number.isNaN(n)) return amount ? String(amount) : '—';
  return n.toLocaleString('ar-EG', { maximumFractionDigits: 0 });
}

function BodyPortal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;
  return createPortal(children, document.body);
}

export default function CarManagement() {
  const router = useRouter();

  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const [filter, setFilter] = useState<'all' | 'active' | 'pending' | 'sold' | 'auction'>('all');
  const [q, setQ] = useState('');

  const [viewId, setViewId] = useState<number | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const isModalOpen = Boolean(viewId || editId || createOpen);

  const [details, setDetails] = useState<Car | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const [form, setForm] = useState({
    make: '',
    model: '',
    year: new Date().getFullYear(),
    price: '',
    color: '',
    status: 'pending' as CarStatus,
    mileage: '',
    fuel_type: '',
    transmission: '',
  });

  const filteredCars = useMemo(() => {
    const s = q.trim().toLowerCase();
    return cars.filter((c) => {
      const st = (c.status || '').toString().toLowerCase();
      if (filter !== 'all' && st !== filter) return false;

      if (!s) return true;
      const make = (c.make ?? '').toString().toLowerCase();
      const model = (c.model ?? '').toString().toLowerCase();
      const year = (c.year ?? '').toString().toLowerCase();
      const id = (c.id ?? '').toString().toLowerCase();
      return make.includes(s) || model.includes(s) || year.includes(s) || id.includes(s);
    });
  }, [cars, filter, q]);

  const stats = useMemo(() => {
    const total = cars.length;
    const active = cars.filter((c) => (c.status || '').toString().toLowerCase() === 'active').length;
    const pending = cars.filter((c) => (c.status || '').toString().toLowerCase() === 'pending').length;
    const auction = cars.filter((c) => (c.status || '').toString().toLowerCase() === 'auction').length;
    return { total, active, pending, auction };
  }, [cars]);

  const loadCars = async () => {
    setLoading(true);
    setErr('');
    try {
      const res = await apiFetch<any>('/admin/cars', { method: 'GET' });
      setCars(extractCars(res));
    } catch (e: any) {
      setErr(e?.message || 'حدث خطأ أثناء تحميل السيارات.');
      setCars([]);
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
    loadCars();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isModalOpen) return;

    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = prevBody;
      document.documentElement.style.overflow = prevHtml;
    };
  }, [isModalOpen]);

  const openView = async (id: number) => {
    setViewId(id);
    setEditId(null);
    setCreateOpen(false);
    setFormError('');
    setDetails(null);
    setDetailsLoading(true);

    try {
      const res = await apiFetch<any>(`/admin/cars/${id}`, { method: 'GET' });
      const obj = res?.data && typeof res.data === 'object' ? res.data : res;
      setDetails(obj);
    } catch (e: any) {
      setFormError(e?.message || 'تعذر تحميل التفاصيل.');
    } finally {
      setDetailsLoading(false);
    }
  };

  const openEdit = async (id: number) => {
    await openView(id);
    setEditId(id);
    setFormError('');
  };

  useEffect(() => {
    if (editId && details) {
      setForm({
        make: details.make ?? '',
        model: details.model ?? '',
        year: Number(details.year ?? new Date().getFullYear()),
        price: details.price ? String(details.price) : '',
        color: details.color ?? '',
        status: (details.status ?? 'pending') as CarStatus,
        mileage: details.mileage ? String(details.mileage) : '',
        fuel_type: details.fuel_type ?? '',
        transmission: details.transmission ?? '',
      });
    }
  }, [details, editId]);

  const closeModal = () => {
    setViewId(null);
    setEditId(null);
    setCreateOpen(false);
    setDetails(null);
    setFormError('');
  };

  useEffect(() => {
    if (!isModalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isModalOpen]);

  const handleDelete = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذه السيارة؟')) return;
    try {
      await apiFetch<any>(`/admin/cars/${id}`, { method: 'DELETE' });
      await loadCars();
    } catch (e: any) {
      alert(e?.message || 'تعذر حذف السيارة.');
    }
  };

  const handleUpdate = async () => {
    if (!editId) return;
    setFormError('');

    if (!form.make.trim() || !form.model.trim()) {
      setFormError('يرجى إدخال الماركة والموديل.');
      return;
    }

    try {
      await apiFetch<any>(`/admin/cars/${editId}`, {
        method: 'PUT',
        body: JSON.stringify({
          make: form.make,
          model: form.model,
          year: form.year,
          price: form.price,
          color: form.color,
          status: form.status,
          mileage: form.mileage,
          fuel_type: form.fuel_type,
          transmission: form.transmission,
        }),
      });
      await loadCars();
      closeModal();
    } catch (e: any) {
      setFormError(e?.message || 'تعذر تحديث السيارة.');
    }
  };

  const handleCreate = async () => {
    setFormError('');

    if (!form.make.trim() || !form.model.trim()) {
      setFormError('يرجى إدخال الماركة والموديل.');
      return;
    }

    try {
      await apiFetch<any>(`/admin/cars`, {
        method: 'POST',
        body: JSON.stringify({
          make: form.make,
          model: form.model,
          year: form.year,
          price: form.price,
          color: form.color,
          status: form.status,
          mileage: form.mileage,
          fuel_type: form.fuel_type,
          transmission: form.transmission,
        }),
      });

      await loadCars();
      closeModal();
    } catch (e: any) {
      setFormError(e?.message || 'تعذر إنشاء السيارة (قد لا يكون Endpoint الإضافة متاحًا).');
    }
  };

  return (
    <Layout title="إدارة السيارات">
      <div className="space-y-6">
        <div className="rounded-3xl bg-gradient-to-br from-indigo-50 to-white border border-gray-100 p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">إدارة السيارات</h1>
              <p className="mt-2 text-sm text-gray-600">عرض وتصفية وتعديل وحذف السيارات عبر الباك اند</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={loadCars}
                className="inline-flex items-center gap-2 rounded-2xl bg-white border border-gray-100 px-4 py-3 shadow-sm hover:bg-gray-50 transition"
              >
                <ArrowPathIcon className="h-5 w-5 text-indigo-600" />
                <span className="text-sm font-semibold text-gray-800">تحديث</span>
              </button>

              <button
                onClick={() => {
                  setCreateOpen(true);
                  setViewId(null);
                  setEditId(null);
                  setDetails(null);
                  setFormError('');
                  setForm({
                    make: '',
                    model: '',
                    year: new Date().getFullYear(),
                    price: '',
                    color: '',
                    status: 'pending',
                    mileage: '',
                    fuel_type: '',
                    transmission: '',
                  });
                }}
                className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 text-white px-4 py-3 shadow-sm hover:bg-indigo-700 transition"
              >
                <PlusIcon className="h-5 w-5" />
                <span className="text-sm font-semibold">إضافة</span>
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
                placeholder="بحث بالماركة / الموديل / السنة / ID"
                className="w-full rounded-2xl border border-gray-100 bg-white px-12 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>

            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm font-semibold text-gray-600">الحالة:</span>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="rounded-2xl border border-gray-100 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
                aria-label="فلتر حالة السيارة"
              >
                <option value="all">الكل</option>
                <option value="active">نشط</option>
                <option value="pending">بانتظار</option>
                <option value="sold">مباع</option>
                <option value="auction">في المزاد</option>
              </select>

              <div className="text-sm text-gray-600">
                النتائج: <span className="font-extrabold text-gray-900">{loading ? '—' : filteredCars.length}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6">
          <MiniCard title="إجمالي" value={loading ? '—' : String(stats.total)} icon={<TruckIcon className="h-6 w-6 text-indigo-700" />} accent="bg-indigo-50" />
          <MiniCard title="نشط" value={loading ? '—' : String(stats.active)} icon={<CheckCircleIcon className="h-6 w-6 text-emerald-700" />} accent="bg-emerald-50" />
          <MiniCard title="بانتظار" value={loading ? '—' : String(stats.pending)} icon={<ExclamationTriangleIcon className="h-6 w-6 text-amber-700" />} accent="bg-amber-50" />
          <MiniCard title="في المزاد" value={loading ? '—' : String(stats.auction)} icon={<ClockIcon className="h-6 w-6 text-violet-700" />} accent="bg-violet-50" />
        </div>

        <div className="rounded-3xl border border-gray-100 bg-white overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-gray-900">قائمة السيارات</h2>
            <span className="text-xs text-gray-400">Cars</span>
          </div>

          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-right text-gray-500 border-b border-gray-100">
                  <th className="py-4 px-4">#</th>
                  <th className="py-4 px-4">الماركة / الموديل</th>
                  <th className="py-4 px-4">السنة</th>
                  <th className="py-4 px-4">اللون</th>
                  <th className="py-4 px-4">السعر</th>
                  <th className="py-4 px-4">الحالة</th>
                  <th className="py-4 px-4">إجراءات</th>
                </tr>
              </thead>

              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-gray-400">
                      جاري التحميل...
                    </td>
                  </tr>
                )}

                {!loading && filteredCars.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-gray-500">
                      لا توجد سيارات مطابقة
                    </td>
                  </tr>
                )}

                {!loading &&
                  filteredCars.map((car) => (
                    <tr key={car.id} className="border-b border-gray-50 last:border-b-0">
                      <td className="py-4 px-4 font-extrabold text-gray-900">{car.id}</td>
                      <td className="py-4 px-4 text-gray-900">
                        <div className="font-bold">{car.make ?? '—'}</div>
                        <div className="text-xs text-gray-500">{car.model ?? ''}</div>
                      </td>
                      <td className="py-4 px-4 text-gray-600">{car.year ?? '—'}</td>
                      <td className="py-4 px-4 text-gray-600">{car.color ?? '—'}</td>
                      <td className="py-4 px-4 text-gray-900 font-bold">{formatCurrency(car.price)}</td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center rounded-xl border px-2 py-1 text-xs font-extrabold ${badgeClass(car.status)}`}>
                          {getStatusLabel(car.status)}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openView(car.id)}
                            className="inline-flex items-center gap-1 rounded-xl border border-gray-100 bg-gray-50 hover:bg-gray-100 transition px-3 py-2 text-xs font-bold text-gray-900"
                            title="عرض"
                          >
                            <EyeIcon className="h-4 w-4" />
                            عرض
                          </button>

                          <button
                            onClick={() => openEdit(car.id)}
                            className="inline-flex items-center gap-1 rounded-xl border border-gray-100 bg-amber-50 hover:bg-amber-100 transition px-3 py-2 text-xs font-bold text-amber-800"
                            title="تعديل"
                          >
                            <PencilIcon className="h-4 w-4" />
                            تعديل
                          </button>

                          <button
                            onClick={() => handleDelete(car.id)}
                            className="inline-flex items-center gap-1 rounded-xl border border-gray-100 bg-red-50 hover:bg-red-100 transition px-3 py-2 text-xs font-bold text-red-700"
                            title="حذف"
                          >
                            <TrashIcon className="h-4 w-4" />
                            حذف
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {isModalOpen && (
          <BodyPortal>
            <div className="fixed inset-0 z-[999999]">
              <button
                type="button"
                aria-label="إغلاق"
                onClick={closeModal}
                className="absolute inset-0 w-full h-full bg-black/45 supports-[backdrop-filter]:backdrop-blur-md"
              />

              <div className="relative w-full h-full flex items-start justify-center p-4 sm:p-6 overflow-auto">
                <div className="w-full max-w-3xl rounded-3xl bg-white border border-gray-100 shadow-xl overflow-hidden my-10">
                  <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                    <div>
                      <div className="text-lg font-extrabold text-gray-900">
                        {createOpen ? 'إضافة سيارة' : editId ? 'تعديل السيارة' : 'تفاصيل السيارة'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {createOpen ? 'Create' : editId ? `Edit #${editId}` : `View #${viewId}`}
                      </div>
                    </div>
                    <button
                      onClick={closeModal}
                      className="rounded-2xl border border-gray-100 bg-gray-50 hover:bg-gray-100 transition p-2"
                      aria-label="إغلاق"
                    >
                      <XMarkIcon className="h-5 w-5 text-gray-700" />
                    </button>
                  </div>

                  <div className="p-6">
                    {formError && (
                      <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {formError}
                      </div>
                    )}

                    {!createOpen && detailsLoading && (
                      <div className="py-10 text-center text-gray-400">جاري تحميل التفاصيل...</div>
                    )}

                    {!createOpen && !detailsLoading && !editId && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field label="الماركة" value={details?.make ?? '—'} />
                        <Field label="الموديل" value={details?.model ?? '—'} />
                        <Field label="السنة" value={details?.year ?? '—'} />
                        <Field label="اللون" value={details?.color ?? '—'} />
                        <Field label="السعر" value={formatCurrency(details?.price)} />
                        <Field label="الحالة" value={getStatusLabel(details?.status)} />
                        <Field label="كم" value={details?.mileage ?? '—'} />
                        <Field label="وقود" value={details?.fuel_type ?? '—'} />
                        <Field label="ناقل" value={details?.transmission ?? '—'} />
                      </div>
                    )}

                    {(createOpen || editId) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="الماركة" value={form.make} onChange={(v) => setForm({ ...form, make: v })} placeholder="مثال: تويوتا" />
                        <Input label="الموديل" value={form.model} onChange={(v) => setForm({ ...form, model: v })} placeholder="مثال: كامري" />
                        <Input label="السنة" value={String(form.year)} onChange={(v) => setForm({ ...form, year: Number(v || new Date().getFullYear()) })} type="number" />
                        <Input label="اللون" value={form.color} onChange={(v) => setForm({ ...form, color: v })} placeholder="مثال: أبيض" />
                        <Input label="السعر" value={form.price} onChange={(v) => setForm({ ...form, price: v })} type="number" placeholder="0" />
                        <Input label="المسافة المقطوعة" value={form.mileage} onChange={(v) => setForm({ ...form, mileage: v })} type="number" placeholder="0" />
                        <Input label="نوع الوقود" value={form.fuel_type} onChange={(v) => setForm({ ...form, fuel_type: v })} placeholder="بنزين / ديزل ..." />
                        <Input label="ناقل الحركة" value={form.transmission} onChange={(v) => setForm({ ...form, transmission: v })} placeholder="أوتوماتيك / يدوي ..." />

                        <div className="md:col-span-2">
                          <label className="block text-sm font-extrabold text-gray-900 mb-2">الحالة</label>
                          <select
                            value={form.status}
                            onChange={(e) => setForm({ ...form, status: e.target.value })}
                            className="w-full rounded-2xl border border-gray-100 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
                            aria-label="حالة السيارة"
                          >
                            <option value="pending">بانتظار</option>
                            <option value="active">نشط</option>
                            <option value="sold">مباع</option>
                            <option value="auction">في المزاد</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-5 border-t border-gray-100 flex items-center justify-end gap-2">
                    <button
                      onClick={closeModal}
                      className="rounded-2xl border border-gray-100 bg-gray-50 hover:bg-gray-100 transition px-4 py-3 text-sm font-bold text-gray-900"
                    >
                      إغلاق
                    </button>

                    {editId && (
                      <button
                        onClick={handleUpdate}
                        className="rounded-2xl bg-indigo-600 hover:bg-indigo-700 transition px-4 py-3 text-sm font-bold text-white"
                      >
                        حفظ التعديل
                      </button>
                    )}

                    {createOpen && (
                      <button
                        onClick={handleCreate}
                        className="rounded-2xl bg-indigo-600 hover:bg-indigo-700 transition px-4 py-3 text-sm font-bold text-white"
                      >
                        إنشاء
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </BodyPortal>
        )}
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
        <div className="h-full w-2/3 bg-indigo-200" />
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
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-extrabold text-gray-900 mb-2">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-gray-100 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
      />
    </div>
  );
}
