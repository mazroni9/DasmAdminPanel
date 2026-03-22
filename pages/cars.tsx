import Layout from '../components/Layout';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { apiFetch } from '../utils/api';
import { getToken } from '../utils/authStorage';
import {
  MagnifyingGlassIcon,
  ArrowPathIcon,
  TruckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

type Pagination = {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

type Car = {
  id: number;
  title?: string;
  description?: string;

  make?: string;
  model?: string;
  year?: number;

  image?: string;
  images?: string[];

  color?: string;
  province?: string;

  auction_status?: string;

  min_price?: string | number;
  max_price?: string | number;
  evaluation_price?: string | number;

  created_at?: string;

  [key: string]: any;
};

type ApiCarsResponse = {
  status?: string; // "success"
  data?: {
    data?: any; // nested wrapper
    pagination?: Pagination;
  };
  message?: string;
};

function extractCarsAndPagination(payload: any): { cars: Car[]; pagination?: Pagination } {
  if (!payload) return { cars: [] };

  // لو الـ API رجّع Array مباشر
  if (Array.isArray(payload)) return { cars: payload };

  const pagination: Pagination | undefined =
    payload?.data?.pagination || payload?.pagination;

  // أشهر شكل عندك: payload.data.data.data = []
  const maybe =
    payload?.data?.data?.data || // <— ده الأساسي في الـ response اللي بعته
    payload?.data?.data ||       // fallback
    payload?.data ||             // fallback
    payload?.items;              // fallback

  if (Array.isArray(maybe)) return { cars: maybe, pagination };

  // أحياناً بتبقى: { data: { data: { data: [...] } } }
  if (Array.isArray(maybe?.data)) return { cars: maybe.data, pagination };

  return { cars: [], pagination };
}

function toTextNumber(v: any) {
  const n = Number(v);
  if (Number.isNaN(n)) return v ? String(v) : '—';
  return n.toLocaleString('ar-EG', { maximumFractionDigits: 0 });
}

function priceLabel(car: Car) {
  const min = car.min_price;
  const max = car.max_price;
  const evalP = car.evaluation_price;

  const nMin = Number(min);
  const nMax = Number(max);
  const nEval = Number(evalP);

  const hasRange = !Number.isNaN(nMin) && !Number.isNaN(nMax);
  if (hasRange) return `${toTextNumber(nMin)} - ${toTextNumber(nMax)}`;

  if (!Number.isNaN(nEval)) return toTextNumber(nEval);

  // fallback لأي field غلط/قديم
  if (car.price !== undefined) return toTextNumber(car.price);

  return '—';
}

function statusBadge(status?: string) {
  const s = (status || '').toLowerCase();

  if (s.includes('available') || s.includes('active') || s.includes('live')) {
    return 'inline-flex items-center rounded-xl border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700';
  }
  if (s.includes('pending') || s.includes('scheduled')) {
    return 'inline-flex items-center rounded-xl border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-bold text-amber-700';
  }
  if (s.includes('sold') || s.includes('ended') || s.includes('completed')) {
    return 'inline-flex items-center rounded-xl border border-gray-200 bg-gray-100 px-2 py-1 text-xs font-bold text-gray-700';
  }
  return 'inline-flex items-center rounded-xl border border-indigo-200 bg-indigo-50 px-2 py-1 text-xs font-bold text-indigo-700';
}

export default function CarsPage() {
  const router = useRouter();

  const [cars, setCars] = useState<Car[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [q, setQ] = useState('');

  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return cars;

    return cars.filter((c) => {
      const make = (c.make ?? '').toString().toLowerCase();
      const model = (c.model ?? '').toString().toLowerCase();
      const year = (c.year ?? '').toString().toLowerCase();
      const id = (c.id ?? '').toString().toLowerCase();
      const title = (c.title ?? '').toString().toLowerCase();
      const vin = (c.vin ?? '').toString().toLowerCase();

      return (
        make.includes(s) ||
        model.includes(s) ||
        year.includes(s) ||
        id.includes(s) ||
        title.includes(s) ||
        vin.includes(s)
      );
    });
  }, [cars, q]);

  const load = async (nextPage = page) => {
    setLoading(true);
    setErr('');
    try {
      // لو endpoint عندك بيدعم pagination:
      const res = await apiFetch<ApiCarsResponse>(`/admin/cars?page=${nextPage}`, { method: 'GET' });

      if (!res || (res.status && res.status !== 'success')) {
        throw new Error(res?.message || 'Unexpected response');
      }

      const { cars: list, pagination: pg } = extractCarsAndPagination(res);
      setCars(list);
      setPagination(pg || null);

      // لو السيرفر رجّع current_page فعلي
      if (pg?.current_page) setPage(pg.current_page);
      else setPage(nextPage);
    } catch (e: any) {
      setErr(e?.message || 'حدث خطأ أثناء تحميل السيارات.');
      setCars([]);
      setPagination(null);
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
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canPrev = !loading && (pagination?.current_page ?? page) > 1;
  const canNext = !loading && (pagination?.current_page ?? page) < (pagination?.last_page ?? page);

  return (
    <Layout title="السيارات">
      <div className="space-y-6">
        {/* Header */}
        <div className="rounded-3xl bg-gradient-to-br from-indigo-50 to-white border border-gray-100 p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">السيارات</h1>
              <p className="mt-2 text-sm text-gray-600">استعراض سريع لقائمة السيارات من الباك اند</p>

              {pagination && (
                <p className="mt-2 text-xs text-gray-500">
                  صفحة {pagination.current_page} من {pagination.last_page} • الإجمالي بالسيرفر: {pagination.total}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => load(page)}
                className="inline-flex items-center gap-2 rounded-2xl bg-white border border-gray-100 px-4 py-3 shadow-sm hover:bg-gray-50 transition"
              >
                <ArrowPathIcon className="h-5 w-5 text-indigo-600" />
                <span className="text-sm font-semibold text-gray-800">تحديث</span>
              </button>

              <a
                href="/car-management"
                className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 text-white px-4 py-3 shadow-sm hover:bg-indigo-700 transition"
              >
                <TruckIcon className="h-5 w-5" />
                <span className="text-sm font-semibold">إدارة السيارات</span>
              </a>
            </div>
          </div>

          {err && (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {err}
            </div>
          )}

          <div className="mt-5 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-md">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="بحث بالماركة / الموديل / السنة / ID / العنوان / VIN"
                className="w-full rounded-2xl border border-gray-100 bg-white px-12 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>

            <div className="flex items-center gap-2">
              <div className="text-sm text-gray-600">
                المعروض: <span className="font-extrabold text-gray-900">{loading ? '—' : filtered.length}</span>
              </div>

              {(pagination?.last_page ?? 1) > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    disabled={!canPrev}
                    onClick={() => load((pagination?.current_page ?? page) - 1)}
                    className={`inline-flex items-center gap-1 rounded-2xl px-3 py-2 text-sm font-bold border transition ${
                      canPrev
                        ? 'bg-white border-gray-100 hover:bg-gray-50 text-gray-900'
                        : 'bg-gray-50 border-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <ChevronRightIcon className="h-4 w-4" />
                    السابق
                  </button>

                  <button
                    disabled={!canNext}
                    onClick={() => load((pagination?.current_page ?? page) + 1)}
                    className={`inline-flex items-center gap-1 rounded-2xl px-3 py-2 text-sm font-bold border transition ${
                      canNext
                        ? 'bg-white border-gray-100 hover:bg-gray-50 text-gray-900'
                        : 'bg-gray-50 border-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    التالي
                    <ChevronLeftIcon className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {loading &&
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm animate-pulse">
                <div className="h-40 rounded-2xl bg-gray-100" />
                <div className="mt-4 h-4 w-2/3 bg-gray-100 rounded" />
                <div className="mt-2 h-4 w-1/2 bg-gray-100 rounded" />
                <div className="mt-6 h-10 w-full bg-gray-100 rounded-2xl" />
              </div>
            ))}

          {!loading &&
            filtered.map((car) => {
              const title =
                car.title ||
                `${car.make ?? '—'} ${car.model ?? ''}`.trim() ||
                `Car #${car.id}`;

              const img = car.image || car.image_url || car.thumbnail || (Array.isArray(car.images) ? car.images[0] : '');

              return (
                <div
                  key={car.id}
                  className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-lg font-extrabold text-gray-900 line-clamp-1">{title}</div>
                      <div className="mt-1 text-sm text-gray-600">
                        {car.year ? `سنة: ${car.year}` : 'سنة: —'} • {car.color ? `لون: ${car.color}` : 'لون: —'}
                      </div>
                    </div>
                    <span className={statusBadge(car.auction_status)}>{car.auction_status || '—'}</span>
                  </div>

                  <div className="mt-4 h-44 rounded-2xl bg-gray-50 border border-gray-100 overflow-hidden flex items-center justify-center">
                    {img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={img} alt={title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="text-gray-400 text-sm">لا توجد صورة</div>
                    )}
                  </div>

                  <div className="mt-4">
                    <div className="text-sm text-gray-600">
                      السعر: <span className="font-extrabold text-gray-900">{priceLabel(car)}</span>
                    </div>

                    {car.province && (
                      <div className="mt-1 text-sm text-gray-600">
                        المحافظة: <span className="font-bold text-gray-900">{car.province}</span>
                      </div>
                    )}

                    {car.created_at && (
                      <div className="mt-1 text-xs text-gray-500">تاريخ الإضافة: {car.created_at}</div>
                    )}
                  </div>

                  <a
                    href="/car-management"
                    className="mt-5 block text-center rounded-2xl border border-gray-100 bg-gray-50 hover:bg-gray-100 transition px-4 py-3 text-sm font-bold text-gray-900"
                  >
                    إدارة / تعديل
                  </a>
                </div>
              );
            })}

          {!loading && filtered.length === 0 && (
            <div className="col-span-full rounded-3xl border border-gray-100 bg-white p-10 text-center text-gray-600">
              لا توجد سيارات مطابقة للبحث.
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
