import Layout from '../components/Layout';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { apiFetch } from '../utils/api';
import { getToken } from '../utils/authStorage';
import {
  MagnifyingGlassIcon,
  ArrowPathIcon,
  TruckIcon,
} from '@heroicons/react/24/outline';

type Car = {
  id: number;
  make?: string;
  model?: string;
  year?: number;
  color?: string;
  price?: number | string;
  status?: string;
  image?: string;
  image_url?: string;
  thumbnail?: string;
  [key: string]: any;
};

function extractCars(payload: any): Car[] {
  // يدعم: {status, data:[...]} أو {status, data:{data:[...]}} أو {data:[...]} أو [...]
  const p = payload;
  const a1 = p?.data;
  if (Array.isArray(a1)) return a1;
  const a2 = a1?.data;
  if (Array.isArray(a2)) return a2;
  if (Array.isArray(p)) return p;
  return [];
}

function toTextPrice(v: any) {
  const n = Number(v);
  if (Number.isNaN(n)) return v ? String(v) : '—';
  return n.toLocaleString('ar-EG', { maximumFractionDigits: 0 });
}

export default function CarsPage() {
  const router = useRouter();
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return cars;

    return cars.filter((c) => {
      const make = (c.make ?? '').toString().toLowerCase();
      const model = (c.model ?? '').toString().toLowerCase();
      const year = (c.year ?? '').toString().toLowerCase();
      const id = (c.id ?? '').toString().toLowerCase();
      return (
        make.includes(s) ||
        model.includes(s) ||
        year.includes(s) ||
        id.includes(s)
      );
    });
  }, [cars, q]);

  const load = async () => {
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
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Layout title="السيارات">
      <div className="space-y-6">
        {/* Header */}
        <div className="rounded-3xl bg-gradient-to-br from-indigo-50 to-white border border-gray-100 p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                السيارات
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                استعراض سريع لقائمة السيارات من الباك اند
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={load}
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
                placeholder="بحث بالماركة / الموديل / السنة / ID"
                className="w-full rounded-2xl border border-gray-100 bg-white px-12 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>

            <div className="text-sm text-gray-600">
              الإجمالي: <span className="font-extrabold text-gray-900">{loading ? '—' : filtered.length}</span>
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {loading &&
            Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm animate-pulse"
              >
                <div className="h-40 rounded-2xl bg-gray-100" />
                <div className="mt-4 h-4 w-2/3 bg-gray-100 rounded" />
                <div className="mt-2 h-4 w-1/2 bg-gray-100 rounded" />
                <div className="mt-6 h-10 w-full bg-gray-100 rounded-2xl" />
              </div>
            ))}

          {!loading &&
            filtered.map((car) => {
              const title = `${car.make ?? '—'} ${car.model ?? ''}`.trim();
              const img =
                car.image_url || car.thumbnail || car.image || '';

              return (
                <div
                  key={car.id}
                  className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-md transition"
                >
                  <div className="h-44 rounded-2xl bg-gray-50 border border-gray-100 overflow-hidden flex items-center justify-center">
                    {img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={img}
                        alt={title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="text-gray-400 text-sm">لا توجد صورة</div>
                    )}
                  </div>

                  <div className="mt-4">
                    <div className="text-lg font-extrabold text-gray-900 line-clamp-1">
                      {title || `Car #${car.id}`}
                    </div>
                    <div className="mt-1 text-sm text-gray-600">
                      {car.year ? `سنة: ${car.year}` : 'سنة: —'} • {car.color ? `لون: ${car.color}` : 'لون: —'}
                    </div>
                    <div className="mt-3 text-sm text-gray-600">
                      السعر: <span className="font-extrabold text-gray-900">{toTextPrice(car.price)}</span>
                    </div>
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
