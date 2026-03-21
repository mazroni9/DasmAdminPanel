import Layout from '../components/Layout';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { createPortal } from 'react-dom';
import { apiFetch } from '../utils/api';
import { getToken } from '../utils/authStorage';
import {
  PencilIcon,
  TrashIcon,
  EyeIcon,
  TruckIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

type AuctionStatus = 'available' | 'pending' | 'in_auction' | 'sold' | 'withdrawn' | string;

type ConditionObj = { ar?: string; en?: string; color?: string } | string | null | undefined;
type TransmissionObj = { ar?: string; en?: string; icon?: string } | string | null | undefined;

type Car = {
  id: number;

  title?: string;
  description?: string;

  make?: string;
  model?: string;
  year?: number;

  image?: string;
  images?: string[];

  condition?: ConditionObj;
  auction_status?: AuctionStatus;

  min_price?: string | number;
  max_price?: string | number;
  evaluation_price?: string | number;

  vin?: string;
  odometer?: number;

  color?: string;
  engine?: string;
  transmission?: TransmissionObj;

  province?: string;

  created_at?: string;
  updated_at?: string;

  [key: string]: any;
};

type LaravelMeta = {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

type IndexResult = {
  items: Car[];
  meta: LaravelMeta | null;
};

function normStr(v: any) {
  return (v ?? '').toString().trim();
}

function formatNumber(v: any) {
  const n = Number(v);
  if (Number.isNaN(n)) return v ? String(v) : '—';
  return n.toLocaleString('ar-EG', { maximumFractionDigits: 0 });
}

/** ✅ FIX: تقبل Partial<Car> أو null أو undefined */
function formatPriceRange(car?: Partial<Car> | null) {
  if (!car) return '—';

  const nMin = Number(car.min_price);
  const nMax = Number(car.max_price);
  const nEval = Number(car.evaluation_price);

  const hasRange = !Number.isNaN(nMin) && !Number.isNaN(nMax);
  if (hasRange) return `${formatNumber(nMin)} - ${formatNumber(nMax)}`;

  if (!Number.isNaN(nEval)) return formatNumber(nEval);

  return '—';
}

function conditionToText(cond: ConditionObj) {
  if (!cond) return '—';
  if (typeof cond === 'string') return cond;
  return cond.ar || cond.en || '—';
}

function transmissionToText(t: TransmissionObj) {
  if (!t) return '—';
  if (typeof t === 'string') return t;
  const label = t.ar || t.en || '';
  const icon = t.icon ? `${t.icon} ` : '';
  return (icon + label).trim() || '—';
}

function statusLabel(status?: string) {
  const s = (status || '').toLowerCase();
  if (s === 'available') return 'متاحة';
  if (s === 'pending') return 'قيد المراجعة';
  if (s === 'in_auction') return 'في المزاد';
  if (s === 'sold') return 'مباعة';
  if (s === 'withdrawn') return 'مسحوبة';
  return status || '—';
}

function badgeClass(status?: string) {
  const s = (status || '').toLowerCase();
  if (s === 'available') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (s === 'pending') return 'bg-amber-50 text-amber-700 border-amber-200';
  if (s === 'in_auction') return 'bg-violet-50 text-violet-700 border-violet-200';
  if (s === 'sold') return 'bg-indigo-50 text-indigo-700 border-indigo-200';
  if (s === 'withdrawn') return 'bg-red-50 text-red-700 border-red-200';
  return 'bg-gray-100 text-gray-700 border-gray-200';
}

/**
 * يدعم أشكال متعددة:
 * 1) { status:'success', data: { data:[...], meta:{...}, links:{...} } }
 * 2) { status:'success', data: { data:{ data:[...] }, pagination:{...} } }
 * 3) nested data متكرر (data.data.data...)
 */
function extractIndexResult(payload: any): IndexResult {
  if (!payload) return { items: [], meta: null };

  // success wrapper
  const root = payload?.data ?? payload;

  // meta (Laravel)
  const meta: LaravelMeta | null =
    root?.meta
      ? {
          current_page: Number(root.meta.current_page ?? 1),
          last_page: Number(root.meta.last_page ?? 1),
          per_page: Number(root.meta.per_page ?? 15),
          total: Number(root.meta.total ?? 0),
        }
      : root?.pagination
      ? {
          current_page: Number(root.pagination.current_page ?? 1),
          last_page: Number(root.pagination.last_page ?? 1),
          per_page: Number(root.pagination.per_page ?? 15),
          total: Number(root.pagination.total ?? 0),
        }
      : null;

  // حاول توصل للـ array بأكثر من طريقة
  const candidates = [
    root, // ممكن يبقى array
    root?.data,
    root?.data?.data,
    root?.data?.data?.data,
    root?.data?.data?.data?.data,
  ];

  for (const c of candidates) {
    if (Array.isArray(c)) return { items: c, meta };
    if (Array.isArray(c?.data)) return { items: c.data, meta };
  }

  return { items: [], meta };
}

function BodyPortal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(children, document.body);
}

export default function CarManagement() {
  const router = useRouter();

  // list state
  const [cars, setCars] = useState<Car[]>([]);
  const [meta, setMeta] = useState<LaravelMeta | null>(null);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  // query state (backend supported)
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);

  const [search, setSearch] = useState('');
  const [auctionStatus, setAuctionStatus] = useState<'all' | AuctionStatus>('all');
  const [condition, setCondition] = useState<'all' | string>('all');

  const [sortBy, setSortBy] = useState<'created_at' | 'year' | 'evaluation_price' | 'odometer' | 'make' | 'model'>(
    'created_at'
  );
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // modal state
  const [viewId, setViewId] = useState<number | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const isModalOpen = Boolean(viewId || editId);

  const [details, setDetails] = useState<Car | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // edit form (backend allowed fields)
  const [form, setForm] = useState({
    make: '',
    model: '',
    year: new Date().getFullYear(),
    color: '',
    vin: '',
    odometer: '',
    evaluation_price: '',
    auction_status: 'pending' as AuctionStatus,
    condition: '',
    description: '',
    image: '',
    imagesText: '', // textarea: lines
  });

  // debounce search -> backend "search"
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const loadCars = async (opts?: Partial<{ page: number }>) => {
    const nextPage = opts?.page ?? page;

    setLoading(true);
    setErr('');

    try {
      const qs = new URLSearchParams();
      qs.set('page', String(nextPage));
      qs.set('per_page', String(perPage));

      if (debouncedSearch.trim()) qs.set('search', debouncedSearch.trim());
      if (auctionStatus !== 'all') qs.set('auction_status', String(auctionStatus));
      if (condition !== 'all' && condition.trim()) qs.set('condition', condition.trim());

      qs.set('sort_by', sortBy);
      qs.set('sort_dir', sortDir);

      const res = await apiFetch<any>(`/admin/cars?${qs.toString()}`, { method: 'GET' });

      if (res?.status && res.status !== 'success') {
        throw new Error(res?.message || 'Unexpected response');
      }

      const { items, meta: m } = extractIndexResult(res?.data ? res : { data: res?.data ?? res });
      setCars(items);
      setMeta(m);

      if (m?.current_page) setPage(m.current_page);
      else setPage(nextPage);
    } catch (e: any) {
      setErr(e?.message || 'حدث خطأ أثناء تحميل السيارات.');
      setCars([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  };

  // auth + initial load
  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace('/login');
      return;
    }
    loadCars({ page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // reload on query changes
  useEffect(() => {
    setPage(1);
    loadCars({ page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [perPage, debouncedSearch, auctionStatus, condition, sortBy, sortDir]);

  // lock scroll when modal open
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

  const closeModal = () => {
    setViewId(null);
    setEditId(null);
    setDetails(null);
    setFormError('');
    setDetailsLoading(false);
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

  const fetchDetails = async (id: number) => {
    setFormError('');
    setDetails(null);
    setDetailsLoading(true);

    try {
      const res = await apiFetch<any>(`/admin/cars/${id}`, { method: 'GET' });
      if (res?.status && res.status !== 'success') {
        throw new Error(res?.message || 'Unexpected response');
      }
      const obj = res?.data && typeof res.data === 'object' ? res.data : res;
      setDetails(obj);
      return obj as Car;
    } catch (e: any) {
      setFormError(e?.message || 'تعذر تحميل التفاصيل.');
      return null;
    } finally {
      setDetailsLoading(false);
    }
  };

  const openView = async (id: number) => {
    setViewId(id);
    setEditId(null);
    await fetchDetails(id);
  };

  const openEdit = async (id: number) => {
    setEditId(id);
    setViewId(null);

    const d = await fetchDetails(id);
    if (!d) return;

    const img = normStr(d.image);
    const imgs = Array.isArray(d.images) ? d.images : [];

    setForm({
      make: normStr(d.make),
      model: normStr(d.model),
      year: Number(d.year ?? new Date().getFullYear()),
      color: normStr(d.color),
      vin: normStr(d.vin),
      odometer: d.odometer !== undefined && d.odometer !== null ? String(d.odometer) : '',
      evaluation_price:
        d.evaluation_price !== undefined && d.evaluation_price !== null ? String(d.evaluation_price) : '',
      auction_status: (d.auction_status ?? 'pending') as AuctionStatus,
      condition: conditionToText(d.condition) === '—' ? '' : conditionToText(d.condition),
      description: normStr(d.description),
      image: img,
      imagesText: imgs.join('\n'),
    });
  };

  const handleDelete = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذه السيارة؟')) return;
    try {
      const res = await apiFetch<any>(`/admin/cars/${id}`, { method: 'DELETE' });
      if (res?.status && res.status !== 'success') {
        throw new Error(res?.message || 'تعذر حذف السيارة');
      }
      await loadCars({ page });
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

    const imagesArr = form.imagesText
      .split('\n')
      .map((x) => x.trim())
      .filter(Boolean);

    try {
      const body = {
        make: form.make.trim(),
        model: form.model.trim(),
        year: Number(form.year),
        vin: form.vin.trim() || undefined,
        odometer: form.odometer !== '' ? Number(form.odometer) : undefined,
        color: form.color.trim() || undefined,
        condition: form.condition.trim() || undefined,
        evaluation_price: form.evaluation_price !== '' ? Number(form.evaluation_price) : undefined,
        auction_status: form.auction_status,
        description: form.description.trim() || undefined,
        image: form.image.trim() || undefined,
        images: imagesArr.length ? imagesArr : undefined,
      };

      const res = await apiFetch<any>(`/admin/cars/${editId}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      });

      if (res?.status && res.status !== 'success') {
        throw new Error(res?.message || 'تعذر تحديث السيارة.');
      }

      await loadCars({ page });
      closeModal();
    } catch (e: any) {
      setFormError(e?.message || 'تعذر تحديث السيارة.');
    }
  };

  const handleQuickStatus = async (id: number, nextStatus: AuctionStatus) => {
    try {
      const res = await apiFetch<any>(`/admin/cars/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ auction_status: nextStatus }),
      });

      if (res?.status && res.status !== 'success') {
        throw new Error(res?.message || 'تعذر تحديث الحالة');
      }

      setCars((prev) => prev.map((c) => (c.id === id ? { ...c, auction_status: nextStatus } : c)));
      await loadCars({ page });
    } catch (e: any) {
      alert(e?.message || 'تعذر تحديث الحالة.');
    }
  };

  const canPrev = (meta?.current_page ?? page) > 1;
  const canNext = (meta?.current_page ?? page) < (meta?.last_page ?? page);

  const pageStats = useMemo(() => {
    const by = { available: 0, pending: 0, in_auction: 0, sold: 0, withdrawn: 0, other: 0 };
    for (const c of cars) {
      const s = (c.auction_status || '').toLowerCase();
      if (s === 'available') by.available++;
      else if (s === 'pending') by.pending++;
      else if (s === 'in_auction') by.in_auction++;
      else if (s === 'sold') by.sold++;
      else if (s === 'withdrawn') by.withdrawn++;
      else by.other++;
    }
    return by;
  }, [cars]);

  const effectiveTotal = meta?.total ?? cars.length;

  return (
    <Layout title="إدارة السيارات">
      <div className="space-y-6">
        {/* Header */}
        <div className="rounded-3xl bg-gradient-to-br from-indigo-50 to-white border border-gray-100 p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">إدارة السيارات</h1>
              <p className="mt-2 text-sm text-gray-600">بحث + فلترة + ترتيب + تعديل + حذف</p>

              {meta && (
                <p className="mt-2 text-xs text-gray-500">
                  الإجمالي: {meta.total} • صفحة {meta.current_page} من {meta.last_page}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => loadCars({ page })}
                className="inline-flex items-center gap-2 rounded-2xl bg-white border border-gray-100 px-4 py-3 shadow-sm hover:bg-gray-50 transition"
              >
                <ArrowPathIcon className="h-5 w-5 text-indigo-600" />
                <span className="text-sm font-semibold text-gray-800">تحديث</span>
              </button>
            </div>
          </div>

          {err && (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {err}
            </div>
          )}

          {/* Filters */}
          <div className="mt-5 grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
            <div className="lg:col-span-5 relative">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="بحث (make / model / vin / color / description...)"
                className="w-full rounded-2xl border border-gray-100 bg-white px-12 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>

            <div className="lg:col-span-2">
              <label className="block text-xs font-bold text-gray-600 mb-1">الحالة</label>
              <select
                value={auctionStatus}
                onChange={(e) => setAuctionStatus(e.target.value as any)}
                className="w-full rounded-2xl border border-gray-100 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
              >
                <option value="all">الكل</option>
                <option value="available">متاحة</option>
                <option value="pending">قيد المراجعة</option>
                <option value="in_auction">في المزاد</option>
                <option value="sold">مباعة</option>
                <option value="withdrawn">مسحوبة</option>
              </select>
            </div>

            <div className="lg:col-span-2">
              <label className="block text-xs font-bold text-gray-600 mb-1">الكونديشن</label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as any)}
                className="w-full rounded-2xl border border-gray-100 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
              >
                <option value="all">الكل</option>
                <option value="Excellent">Excellent</option>
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
              </select>
            </div>

            <div className="lg:col-span-2">
              <label className="block text-xs font-bold text-gray-600 mb-1">الترتيب</label>
              <div className="flex gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full rounded-2xl border border-gray-100 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
                >
                  <option value="created_at">الأحدث</option>
                  <option value="year">السنة</option>
                  <option value="evaluation_price">سعر التقييم</option>
                  <option value="odometer">العداد</option>
                  <option value="make">الماركة</option>
                  <option value="model">الموديل</option>
                </select>

                <select
                  value={sortDir}
                  onChange={(e) => setSortDir(e.target.value as any)}
                  className="rounded-2xl border border-gray-100 bg-white px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
                  aria-label="اتجاه الترتيب"
                >
                  <option value="desc">↓</option>
                  <option value="asc">↑</option>
                </select>
              </div>
            </div>

            <div className="lg:col-span-1">
              <label className="block text-xs font-bold text-gray-600 mb-1">لكل صفحة</label>
              <select
                value={perPage}
                onChange={(e) => setPerPage(Number(e.target.value))}
                className="w-full rounded-2xl border border-gray-100 bg-white px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
              >
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6">
          <MiniCard
            title="الإجمالي"
            value={loading ? '—' : String(effectiveTotal)}
            icon={<TruckIcon className="h-6 w-6 text-indigo-700" />}
            accent="bg-indigo-50"
          />
          <MiniCard
            title="متاحة (بالصفحة)"
            value={loading ? '—' : String(pageStats.available)}
            icon={<CheckCircleIcon className="h-6 w-6 text-emerald-700" />}
            accent="bg-emerald-50"
          />
          <MiniCard
            title="قيد المراجعة (بالصفحة)"
            value={loading ? '—' : String(pageStats.pending)}
            icon={<ExclamationTriangleIcon className="h-6 w-6 text-amber-700" />}
            accent="bg-amber-50"
          />
          <MiniCard
            title="في المزاد (بالصفحة)"
            value={loading ? '—' : String(pageStats.in_auction)}
            icon={<ClockIcon className="h-6 w-6 text-violet-700" />}
            accent="bg-violet-50"
          />
        </div>

        {/* Table */}
        <div className="rounded-3xl border border-gray-100 bg-white overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-gray-900">قائمة السيارات</h2>

            <div className="flex items-center gap-2">
              <button
                disabled={loading || !canPrev}
                onClick={() => loadCars({ page: (meta?.current_page ?? page) - 1 })}
                className={`inline-flex items-center gap-1 rounded-2xl px-3 py-2 text-sm font-bold border transition ${
                  !loading && canPrev
                    ? 'bg-white border-gray-100 hover:bg-gray-50 text-gray-900'
                    : 'bg-gray-50 border-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                <ChevronRightIcon className="h-4 w-4" />
                السابق
              </button>

              <button
                disabled={loading || !canNext}
                onClick={() => loadCars({ page: (meta?.current_page ?? page) + 1 })}
                className={`inline-flex items-center gap-1 rounded-2xl px-3 py-2 text-sm font-bold border transition ${
                  !loading && canNext
                    ? 'bg-white border-gray-100 hover:bg-gray-50 text-gray-900'
                    : 'bg-gray-50 border-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                التالي
                <ChevronLeftIcon className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-right text-gray-500 border-b border-gray-100">
                  <th className="py-4 px-4">#</th>
                  <th className="py-4 px-4">السيارة</th>
                  <th className="py-4 px-4">السنة</th>
                  <th className="py-4 px-4">العداد</th>
                  <th className="py-4 px-4">سعر (Range/تقييم)</th>
                  <th className="py-4 px-4">الحالة</th>
                  <th className="py-4 px-4">تغيير الحالة</th>
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

                {!loading && cars.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-gray-500">
                      لا توجد نتائج
                    </td>
                  </tr>
                )}

                {!loading &&
                  cars.map((car) => {
                    const title =
                      car.title ||
                      `${car.make ?? '—'} ${car.model ?? ''}`.trim() ||
                      `Car #${car.id}`;

                    return (
                      <tr key={car.id} className="border-b border-gray-50 last:border-b-0">
                        <td className="py-4 px-4 font-extrabold text-gray-900">{car.id}</td>

                        <td className="py-4 px-4 text-gray-900">
                          <div className="font-bold line-clamp-1">{title}</div>
                          <div className="text-xs text-gray-500 line-clamp-1">
                            {car.province ? `المحافظة: ${car.province}` : '—'}
                            {car.vin ? ` • VIN: ${car.vin}` : ''}
                          </div>
                        </td>

                        <td className="py-4 px-4 text-gray-600">{car.year ?? '—'}</td>
                        <td className="py-4 px-4 text-gray-600">{car.odometer ?? '—'}</td>

                        <td className="py-4 px-4 text-gray-900 font-bold">{formatPriceRange(car)}</td>

                        <td className="py-4 px-4">
                          <span
                            className={`inline-flex items-center rounded-xl border px-2 py-1 text-xs font-extrabold ${badgeClass(
                              car.auction_status
                            )}`}
                          >
                            {statusLabel(car.auction_status)}
                          </span>
                        </td>

                        <td className="py-4 px-4">
                          <select
                            value={(car.auction_status ?? 'pending') as any}
                            onChange={(e) => handleQuickStatus(car.id, e.target.value)}
                            className="rounded-2xl border border-gray-100 bg-white px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-indigo-200"
                            aria-label="تغيير حالة السيارة"
                          >
                            <option value="available">متاحة</option>
                            <option value="pending">قيد المراجعة</option>
                            <option value="in_auction">في المزاد</option>
                            <option value="sold">مباعة</option>
                            <option value="withdrawn">مسحوبة</option>
                          </select>
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
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal */}
        {isModalOpen && (
          <BodyPortal>
            <div className="fixed inset-0 z-[999999]">
              <button
                type="button"
                aria-label="إغلاق"
                onClick={closeModal}
                className="absolute inset-0 w-full h-full bg-black/45 supports-[backdrop-filter]:backdrop-blur-md"
              />

              <div className="relative w-full h-full flex items-start justify-center p-4 sm:p-6">
                <div className="w-full max-w-3xl rounded-3xl bg-white border border-gray-100 shadow-xl overflow-hidden mt-10">
                  <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                    <div>
                      <div className="text-lg font-extrabold text-gray-900">
                        {editId ? `تعديل السيارة #${editId}` : `تفاصيل السيارة #${viewId}`}
                      </div>
                      <div className="text-xs text-gray-500">{editId ? 'Edit' : 'View'}</div>
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

                    {detailsLoading && <div className="py-8 text-center text-gray-400">جاري تحميل التفاصيل...</div>}

                    {!detailsLoading && !editId && (
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                        <div className="md:col-span-5">
                          <div className="h-44 rounded-2xl bg-gray-50 border border-gray-100 overflow-hidden flex items-center justify-center">
                            {details?.image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={details.image} alt="car" className="h-full w-full object-cover" />
                            ) : (
                              <div className="text-gray-400 text-sm">لا توجد صورة</div>
                            )}
                          </div>
                        </div>

                        <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <Field label="الماركة" value={details?.make ?? '—'} />
                          <Field label="الموديل" value={details?.model ?? '—'} />
                          <Field label="السنة" value={details?.year ?? '—'} />
                          <Field label="الحالة" value={statusLabel(details?.auction_status)} />
                          <Field label="VIN" value={details?.vin ?? '—'} />
                          <Field label="العداد" value={details?.odometer ?? '—'} />
                          <Field label="اللون" value={details?.color ?? '—'} />
                          <Field label="الكونديشن" value={conditionToText(details?.condition)} />
                        </div>

                        <div className="md:col-span-12">
                          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                            <div className="text-xs font-bold text-gray-500">الوصف</div>
                            <div className="mt-2 text-sm font-semibold text-gray-900 line-clamp-3">
                              {details?.description ? details.description : '—'}
                            </div>

                            {/* ✅ FIX: مفيش (details || {}) */}
                            <div className="mt-2 text-xs text-gray-500">
                              السعر:{' '}
                              <span className="font-bold text-gray-900">
                                {formatPriceRange(details)}
                              </span>
                              {' • '}
                              التقييم:{' '}
                              <span className="font-bold text-gray-900">
                                {details?.evaluation_price ? formatNumber(details.evaluation_price) : '—'}
                              </span>
                              {' • '}
                              ناقل:{' '}
                              <span className="font-bold text-gray-900">
                                {transmissionToText(details?.transmission)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {!detailsLoading && !!editId && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="الماركة" value={form.make} onChange={(v) => setForm({ ...form, make: v })} />
                        <Input label="الموديل" value={form.model} onChange={(v) => setForm({ ...form, model: v })} />
                        <Input
                          label="السنة"
                          type="number"
                          value={String(form.year)}
                          onChange={(v) => setForm({ ...form, year: Number(v || new Date().getFullYear()) })}
                        />
                        <Input label="اللون" value={form.color} onChange={(v) => setForm({ ...form, color: v })} />

                        <Input label="VIN" value={form.vin} onChange={(v) => setForm({ ...form, vin: v })} />
                        <Input
                          label="العداد (odometer)"
                          type="number"
                          value={form.odometer}
                          onChange={(v) => setForm({ ...form, odometer: v })}
                        />

                        <Input
                          label="سعر التقييم (evaluation_price)"
                          type="number"
                          value={form.evaluation_price}
                          onChange={(v) => setForm({ ...form, evaluation_price: v })}
                        />

                        <div>
                          <label className="block text-sm font-extrabold text-gray-900 mb-2">الحالة</label>
                          <select
                            value={form.auction_status}
                            onChange={(e) => setForm({ ...form, auction_status: e.target.value })}
                            className="w-full rounded-2xl border border-gray-100 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
                          >
                            <option value="available">متاحة</option>
                            <option value="pending">قيد المراجعة</option>
                            <option value="in_auction">في المزاد</option>
                            <option value="sold">مباعة</option>
                            <option value="withdrawn">مسحوبة</option>
                          </select>
                        </div>

                        <Input
                          label="Condition (string)"
                          value={form.condition}
                          onChange={(v) => setForm({ ...form, condition: v })}
                          placeholder="Excellent / Good / Fair"
                        />

                        <Input
                          label="Image URL"
                          value={form.image}
                          onChange={(v) => setForm({ ...form, image: v })}
                          placeholder="https://..."
                        />

                        <div className="md:col-span-2">
                          <label className="block text-sm font-extrabold text-gray-900 mb-2">
                            Images (كل سطر URL)
                          </label>
                          <textarea
                            rows={3}
                            value={form.imagesText}
                            onChange={(e) => setForm({ ...form, imagesText: e.target.value })}
                            placeholder="https://...\nhttps://..."
                            className="w-full rounded-2xl border border-gray-100 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-extrabold text-gray-900 mb-2">الوصف</label>
                          <textarea
                            rows={3}
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            className="w-full rounded-2xl border border-gray-100 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
                          />
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
    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-3">
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
