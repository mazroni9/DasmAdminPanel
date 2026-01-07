import Layout from '../components/Layout';
import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../utils/api';
import { getUser, getUserDisplayName } from '../utils/authStorage';
import {
  UserGroupIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ShieldCheckIcon,
  NewspaperIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import type { ReactNode } from 'react';

type ApiDashboardResponse = {
  success: boolean;
  data: {
    total_users: number;
    active_users: number;
    pending_users: number;

    dealers_count: number;
    regular_users_count: number;

    total_auctions: number;
    active_auctions: number;
    completed_auctions: number;
    ended_auctions: number;
    pending_auctions: number;
    failed_auctions: number;

    pending_verifications: number;

    total_blogs: number;
    published_blogs: number;
    draft_blogs: number;

    total_cars: number;
    cars_in_auction: number;
    sold_cars: number;

    cached_at?: string;

    popular_blogs: Array<{ id: number; title: string; slug: string }>;

    recent_auctions: Array<{
      id: number;
      car_id: number;
      status: string;
      status_label?: string;

      auction_type?: string;

      current_bid?: string | number;
      starting_bid?: string | number;
      current_price?: string | number;

      created_at?: string;
      time_remaining?: number;

      car?: {
        id: number;
        make: string;
        model: string;
        year: number;
        auction_status?: string;
        images_list?: any[];
      };
    }>;

    recent_users: Array<{
      id: number;
      first_name: string;
      last_name: string;
      email: string;

      type?: string;
      status: string;
      is_active: boolean;

      created_at: string;
    }>;

    today?: {
      new_users_today: number;
      new_auctions_today: number;
      bids_today: number;
    };
  };
};

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [d, setD] = useState<ApiDashboardResponse['data'] | null>(null);
  const [err, setErr] = useState('');

  const user = getUser();
  const userName = useMemo(() => getUserDisplayName(user), [user]);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setErr('');
      try {
        // لو apiFetch عندك بيضيف /api تلقائيًا سيبها كده.
        // لو لا، غيّرها لـ '/api/admin/dashboard'
        const res = await apiFetch<ApiDashboardResponse>('/admin/dashboard', { method: 'GET' });

        if (!res || res.success !== true || !res.data) {
          throw new Error('Unexpected response shape from API');
        }

        setD(res.data);
      } catch (e: any) {
        setErr(e?.message || 'حدث خطأ أثناء تحميل البيانات.');
        setD(null);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  return (
    <Layout title="الرئيسية">
      <div className="space-y-6">
        {/* Header */}
        <div className="rounded-3xl bg-gradient-to-br from-indigo-50 to-white border border-gray-100 p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                أهلاً، {userName || 'مرحباً'} 👋
              </h1>
              <p className="mt-2 text-sm text-gray-600">نظرة سريعة على أهم مؤشرات المنصة</p>

              {!!d?.cached_at && (
                <p className="mt-2 text-xs text-gray-500">
                  آخر تحديث: {formatDateTime(d.cached_at)}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 rounded-2xl bg-white border border-gray-100 px-4 py-3 shadow-sm">
              <ArrowTrendingUpIcon className="h-5 w-5 text-indigo-600" />
              <span className="text-sm font-semibold text-gray-800">Dashboard</span>
            </div>
          </div>

          {err && (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {err}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <StatCard
            title="إجمالي المستخدمين"
            value={loading ? '—' : String(d?.total_users ?? 0)}
            icon={<UserGroupIcon className="h-6 w-6 text-indigo-700" />}
            accent="bg-indigo-50"
          />
          <StatCard
            title="إجمالي المزادات"
            value={loading ? '—' : String(d?.total_auctions ?? 0)}
            icon={<CurrencyDollarIcon className="h-6 w-6 text-emerald-700" />}
            accent="bg-emerald-50"
          />
          <StatCard
            title="المزادات النشطة"
            value={loading ? '—' : String(d?.active_auctions ?? 0)}
            icon={<ClockIcon className="h-6 w-6 text-violet-700" />}
            accent="bg-violet-50"
          />
        </div>

        {/* Secondary stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2 rounded-3xl border border-gray-100 bg-white p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-gray-900">مؤشرات إضافية</h2>
              <span className="text-xs text-gray-400">Overview</span>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <MiniStat label="مستخدمون نشطون" value={loading ? '—' : String(d?.active_users ?? 0)} />
              <MiniStat label="طلبات مستخدمين" value={loading ? '—' : String(d?.pending_users ?? 0)} />
              <MiniStat label="عدد التجار" value={loading ? '—' : String(d?.dealers_count ?? 0)} />
              <MiniStat label="مستخدمون عاديون" value={loading ? '—' : String(d?.regular_users_count ?? 0)} />
              <MiniStat label="مزادات مكتملة" value={loading ? '—' : String(d?.completed_auctions ?? 0)} />
              <MiniStat label="مزادات معلّقة" value={loading ? '—' : String(d?.pending_auctions ?? 0)} />
              <MiniStat
                label="توثيق قيد المراجعة"
                value={loading ? '—' : String(d?.pending_verifications ?? 0)}
                icon={<ShieldCheckIcon className="h-4 w-4" />}
              />
              <MiniStat label="إجمالي السيارات" value={loading ? '—' : String(d?.total_cars ?? 0)} />
            </div>
          </div>

          <div className="rounded-3xl border border-gray-100 bg-white p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-gray-900">المدونة</h2>
              <NewspaperIcon className="h-5 w-5 text-gray-400" />
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              <SmallPill label="الإجمالي" value={loading ? '—' : String(d?.total_blogs ?? 0)} />
              <SmallPill label="منشور" value={loading ? '—' : String(d?.published_blogs ?? 0)} />
              <SmallPill label="مسودة" value={loading ? '—' : String(d?.draft_blogs ?? 0)} />
            </div>

            <div className="mt-5">
              <div className="text-sm font-extrabold text-gray-900">الأكثر قراءة</div>
              <div className="mt-3 space-y-2">
                {(d?.popular_blogs || []).slice(0, 5).map((b) => (
                  <div key={b.id} className="rounded-2xl border border-gray-100 bg-gray-50 p-3">
                    <div className="text-sm font-bold text-gray-900 line-clamp-2">{b.title}</div>
                    <div className="mt-1 text-xs text-gray-500 truncate">{b.slug}</div>
                  </div>
                ))}
                {!loading && (!d?.popular_blogs || d.popular_blogs.length === 0) && (
                  <div className="text-sm text-gray-500">لا توجد بيانات حالياً</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Recent auctions */}
          <div className="lg:col-span-2 rounded-3xl border border-gray-100 bg-white p-6 overflow-hidden">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-gray-900">أحدث المزادات</h2>
              <a href="/auctions" className="text-sm font-semibold text-indigo-600 hover:text-indigo-500">
                عرض الكل
              </a>
            </div>

            <div className="mt-4 overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-right text-gray-500 border-b">
                    <th className="py-3 px-2">#</th>
                    <th className="py-3 px-2">السيارة</th>
                    <th className="py-3 px-2">النوع</th>
                    <th className="py-3 px-2">الحالة</th>
                    <th className="py-3 px-2">سعر البدء</th>
                    <th className="py-3 px-2">متبقي</th>
                  </tr>
                </thead>
                <tbody>
                  {(d?.recent_auctions || []).slice(0, 8).map((a) => {
                    const carName = a.car ? `${a.car.make} ${a.car.model} (${a.car.year})` : `#${a.id}`;
                    const opening = pickPrice(a.starting_bid, a.current_bid, a.current_price, 0);

                    return (
                      <tr key={a.id} className="border-b last:border-b-0">
                        <td className="py-3 px-2 font-bold text-gray-900">{a.id}</td>
                        <td className="py-3 px-2 text-gray-900">{carName}</td>
                        <td className="py-3 px-2 text-gray-600">{a.auction_type || '—'}</td>
                        <td className="py-3 px-2">
                          <span className={badgeClass(a.status)}>
                            {a.status_label || a.status || '—'}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-gray-900">{money(opening)}</td>
                        <td className="py-3 px-2 text-gray-600">{formatRemaining(a.time_remaining)}</td>
                      </tr>
                    );
                  })}

                  {!loading && (!d?.recent_auctions || d.recent_auctions.length === 0) && (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-gray-500">
                        لا توجد مزادات حديثة
                      </td>
                    </tr>
                  )}

                  {loading && (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-gray-400">
                        جاري التحميل...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent users */}
          <div className="rounded-3xl border border-gray-100 bg-white p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-gray-900">أحدث المستخدمين</h2>
              <a href="/users" className="text-sm font-semibold text-indigo-600 hover:text-indigo-500">
                عرض الكل
              </a>
            </div>

            <div className="mt-4 space-y-3">
              {(d?.recent_users || []).slice(0, 6).map((u) => (
                <div key={u.id} className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-extrabold text-gray-900 truncate">
                        {u.first_name} {u.last_name}
                      </div>
                      <div className="text-xs text-gray-500 truncate">{u.email}</div>
                      <div className="mt-2 text-xs text-gray-500">{formatDate(u.created_at)}</div>
                    </div>

                    <span
                      className={
                        u.is_active
                          ? 'text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-xl'
                          : 'text-xs font-bold text-gray-700 bg-gray-100 border border-gray-200 px-2 py-1 rounded-xl'
                      }
                      title={u.type || ''}
                    >
                      {u.status || (u.is_active ? 'active' : 'inactive')}
                    </span>
                  </div>
                </div>
              ))}

              {!loading && (!d?.recent_users || d.recent_users.length === 0) && (
                <div className="text-sm text-gray-500">لا توجد بيانات حالياً</div>
              )}

              {loading && <div className="text-sm text-gray-400">جاري التحميل...</div>}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function StatCard({
  title,
  value,
  icon,
  accent,
}: {
  title: string;
  value: string;
  icon: ReactNode;
  accent: string;
}) {
  return (
    <div className="rounded-3xl border border-gray-100 bg-white shadow-sm p-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-gray-600">{title}</div>
          <div className="mt-3 text-4xl font-extrabold text-gray-900">{value}</div>
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

function MiniStat({ label, value, icon }: { label: string; value: string; icon?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
      <div className="flex items-center justify-between">
        <div className="text-xs font-bold text-gray-500">{label}</div>
        {icon ? <div className="text-gray-400">{icon}</div> : null}
      </div>
      <div className="mt-2 text-2xl font-extrabold text-gray-900">{value}</div>
    </div>
  );
}

function SmallPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-3 text-center">
      <div className="text-xs font-bold text-gray-500">{label}</div>
      <div className="mt-1 text-lg font-extrabold text-gray-900">{value}</div>
    </div>
  );
}

function badgeClass(status?: string) {
  const s = (status || '').toLowerCase();

  if (s.includes('live') || s.includes('active')) {
    return 'inline-flex items-center rounded-xl border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700';
  }
  if (s.includes('pending') || s.includes('scheduled') || s.includes('draft')) {
    return 'inline-flex items-center rounded-xl border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-bold text-amber-700';
  }
  if (s.includes('complete') || s.includes('completed') || s.includes('finished') || s.includes('ended')) {
    return 'inline-flex items-center rounded-xl border border-gray-200 bg-gray-100 px-2 py-1 text-xs font-bold text-gray-700';
  }
  if (s.includes('fail') || s.includes('canceled') || s.includes('cancelled')) {
    return 'inline-flex items-center rounded-xl border border-red-200 bg-red-50 px-2 py-1 text-xs font-bold text-red-700';
  }

  return 'inline-flex items-center rounded-xl border border-indigo-200 bg-indigo-50 px-2 py-1 text-xs font-bold text-indigo-700';
}

function formatDate(iso: string) {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return iso;
  return new Intl.DateTimeFormat('ar-EG', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(t));
}

function formatDateTime(iso: string) {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return iso;
  return new Intl.DateTimeFormat('ar-EG', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(t));
}

function formatRemaining(sec?: number) {
  if (sec === null || sec === undefined) return '—';
  const s = Math.max(0, Math.floor(sec));
  const hh = String(Math.floor(s / 3600)).padStart(2, '0');
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

function toNumberLike(v: unknown) {
  if (v === null || v === undefined) return NaN;
  if (typeof v === 'number') return v;
  if (typeof v === 'string') return Number(v);
  return NaN;
}

function pickPrice(...vals: Array<string | number | undefined | null>) {
  for (const v of vals) {
    const n = toNumberLike(v);
    if (!Number.isNaN(n)) return String(n);
  }
  return '0';
}

function money(v: string) {
  const n = Number(v);
  if (Number.isNaN(n)) return v;
  return n.toLocaleString('ar-EG', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}
