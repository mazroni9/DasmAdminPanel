/**
 * صفحة إدارة شركاء النمو (Mr.20%)
 * POST   /api/admin/growth-partners         → إنشاء شريك
 * GET    /api/admin/growth-partners         → قائمة الشركاء
 * GET    /api/admin/growth-partners/{id}    → تفاصيل
 * PUT    /api/admin/growth-partners/{id}    → تعديل
 * DELETE /api/admin/growth-partners/{id}    → تعطيل / حذف
 * POST   /api/admin/growth-partners/{id}/record-payout → تسجيل دفعة
 * GET    /api/admin/growth-partners/options → بيانات مساعدة (مستخدمون + مناطق)
 */

import Layout from '../components/Layout';
import GrowthPartnerContract from '../components/GrowthPartnerContract';
import { apiFetch } from '../utils/api';
import { useRouter } from 'next/router';
import { useEffect, useState, useMemo, useRef } from 'react';
import toast from 'react-hot-toast';

// ── أنواع ──────────────────────────────────────────────────────────────────

interface GrowthPartner {
  id: number;
  name: string;
  contact_name: string | null;
  email: string;
  phone: string | null;
  referral_code: string;
  partner_code: string | null;
  commission_percentage: number;
  is_active: boolean;
  status: string;
  total_referrals: number;
  total_settled_deals: number;
  total_commission_earned: number;
  total_paid_amount: number;
  linked_user_id: number | null;
  area_id: number | null;
  bank_iban: string | null;
  bank_name: string | null;
  legal_undertaking_accepted_at: string | null;
  notes: string | null;
  created_at: string;
  referred_users_count?: number;
}

interface OptionsUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  type: string;
}

interface OptionsData {
  all_users: OptionsUser[];
  areas: { id: number; name: string }[];
}

interface SummaryData {
  total_partners: number;
  active_partners: number;
  total_referrals: number;
  total_commission_earned: number;
}

// ── مساعدات ────────────────────────────────────────────────────────────────

function fmt(n: number | null | undefined) {
  if (n == null) return '—';
  return n.toLocaleString('ar-SA', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function statusBadge(status: string, isActive: boolean) {
  if (!isActive)
    return <span className="px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700">معطّل</span>;
  const map: Record<string, string> = {
    approved: 'bg-green-100 text-green-700',
    pending:  'bg-yellow-100 text-yellow-700',
    suspended:'bg-red-100 text-red-700',
  };
  const labels: Record<string, string> = {
    approved: 'نشط',
    pending:  'معلّق',
    suspended:'موقوف',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {labels[status] ?? status}
    </span>
  );
}

// ── المكوّن الرئيسي ────────────────────────────────────────────────────────

export default function GrowthPartnersPage() {
  const router = useRouter();

  // ── بيانات ──
  const [partners, setPartners] = useState<GrowthPartner[]>([]);
  const [summary, setSummary]   = useState<SummaryData | null>(null);
  const [options, setOptions]   = useState<OptionsData | null>(null);
  const [loading, setLoading]   = useState(true);
  const [page, setPage]         = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [q, setQ]               = useState('');
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── modal إنشاء ──
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating]     = useState(false);
  const emptyForm = {
    name: '', contact_name: '', email: '', phone: '',
    commission_percentage: '20', linked_user_id: '',
    area_id: '', bank_iban: '', bank_name: '', notes: '',
    status: 'approved',
  };
  const [form, setForm] = useState({ ...emptyForm });

  // ── modal تعديل ──
  const [editing, setEditing]   = useState<GrowthPartner | null>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [editForm, setEditForm] = useState({
    name: '', contact_name: '', email: '', phone: '',
    commission_percentage: '20', is_active: true,
    status: 'approved', bank_iban: '', bank_name: '', notes: '',
    linked_user_id: '',
  });

  // ── modal دفعة ──
  const [showPayout, setShowPayout]       = useState(false);
  const [payoutPartner, setPayoutPartner] = useState<GrowthPartner | null>(null);
  const [payoutAmount, setPayoutAmount]   = useState('');
  const [payingOut, setPayingOut]         = useState(false);

  // ── modal تقرير ──
  const [showReport, setShowReport]     = useState(false);
  const [reportPartner, setReportPartner] = useState<GrowthPartner | null>(null);
  const [report, setReport]             = useState<any>(null);
  const [reportLoading, setReportLoading] = useState(false);

  // ── modal عرض العقد ──
  const [showContract, setShowContract]         = useState(false);
  const [contractPartner, setContractPartner]   = useState<GrowthPartner | null>(null);

  // ── جلب البيانات ──────────────────────────────────────────────────────

  const load = async (p = 1, query = q) => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ page: String(p), per_page: '20' });
      if (query.trim()) qs.set('q', query.trim());

      const res: any = await apiFetch(`/admin/growth-partners?${qs}`);
      const list: GrowthPartner[] = res?.data?.data?.data ?? res?.data?.data ?? res?.data ?? [];
      const pg   = res?.data?.data?.pagination ?? res?.data?.pagination ?? null;
      const sum  = res?.data?.summary ?? res?.summary ?? null;

      setPartners(Array.isArray(list) ? list : []);
      if (pg) { setLastPage(pg.last_page ?? 1); setPage(pg.current_page ?? p); }
      if (sum) setSummary(sum);
    } catch (e: any) {
      toast.error(e?.message ?? 'خطأ في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const loadOptions = async () => {
    try {
      const res: any = await apiFetch('/admin/growth-partners/options');
      setOptions(res?.data?.data ?? res?.data ?? null);
    } catch {}
  };

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) { router.replace('/auth/login?returnUrl=/growth-partners'); return; }
    load(1);
    loadOptions();
  }, []);

  const handleSearch = (val: string) => {
    setQ(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => load(1, val), 400);
  };

  // ── إنشاء شريك جديد ────────────────────────────────────────────────────

  const handleCreate = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      toast.error('الاسم والإيميل مطلوبان');
      return;
    }
    setCreating(true);
    try {
      const payload: any = {
        name: form.name,
        email: form.email,
        commission_percentage: Number(form.commission_percentage) || 20,
        status: form.status,
      };
      if (form.contact_name) payload.contact_name = form.contact_name;
      if (form.phone)         payload.phone        = form.phone;
      if (form.linked_user_id) payload.linked_user_id = Number(form.linked_user_id);
      if (form.area_id)       payload.area_id      = Number(form.area_id);
      if (form.bank_iban)     payload.bank_iban    = form.bank_iban;
      if (form.bank_name)     payload.bank_name    = form.bank_name;
      if (form.notes)         payload.notes        = form.notes;

      await apiFetch('/admin/growth-partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      toast.success('تم إنشاء شريك النمو بنجاح');
      setShowCreate(false);
      setForm({ ...emptyForm });
      load(1, q);
    } catch (e: any) {
      toast.error(e?.message ?? 'فشل الإنشاء');
    } finally {
      setCreating(false);
    }
  };

  // ── فتح modal التعديل ─────────────────────────────────────────────────

  const openEdit = (p: GrowthPartner) => {
    setEditing(p);
    setEditForm({
      name:                  p.name,
      contact_name:          p.contact_name ?? '',
      email:                 p.email,
      phone:                 p.phone ?? '',
      commission_percentage: String(p.commission_percentage),
      is_active:             p.is_active,
      status:                p.status,
      bank_iban:             p.bank_iban ?? '',
      bank_name:             p.bank_name ?? '',
      notes:                 p.notes ?? '',
      linked_user_id:        p.linked_user_id ? String(p.linked_user_id) : '',
    });
    setShowEdit(true);
  };

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const payload: any = {
        name:                  editForm.name,
        email:                 editForm.email,
        commission_percentage: Number(editForm.commission_percentage),
        is_active:             editForm.is_active,
        status:                editForm.status,
      };
      if (editForm.contact_name) payload.contact_name = editForm.contact_name;
      if (editForm.phone)        payload.phone        = editForm.phone;
      if (editForm.bank_iban)    payload.bank_iban    = editForm.bank_iban;
      if (editForm.bank_name)    payload.bank_name    = editForm.bank_name;
      if (editForm.notes)        payload.notes        = editForm.notes;
      if (editForm.linked_user_id) payload.linked_user_id = Number(editForm.linked_user_id);

      await apiFetch(`/admin/growth-partners/${editing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      toast.success('تم تحديث بيانات الشريك');
      setShowEdit(false);
      load(page, q);
    } catch (e: any) {
      toast.error(e?.message ?? 'فشل الحفظ');
    } finally {
      setSaving(false);
    }
  };

  // ── تعطيل / حذف ──────────────────────────────────────────────────────

  const handleDelete = async (p: GrowthPartner) => {
    const msg = p.total_settled_deals > 0
      ? `هل تريد تعطيل "${p.name}"؟ (له صفقات مسجّلة، سيتم التعطيل فقط)`
      : `هل تريد حذف "${p.name}" نهائياً؟`;
    if (!confirm(msg)) return;
    try {
      await apiFetch(`/admin/growth-partners/${p.id}`, { method: 'DELETE' });
      toast.success(p.total_settled_deals > 0 ? 'تم تعطيل الشريك' : 'تم حذف الشريك');
      load(page, q);
    } catch (e: any) {
      toast.error(e?.message ?? 'فشلت العملية');
    }
  };

  // ── تسجيل دفعة ────────────────────────────────────────────────────────

  const openPayout = (p: GrowthPartner) => {
    setPayoutPartner(p);
    setPayoutAmount('');
    setShowPayout(true);
  };

  const handlePayout = async () => {
    if (!payoutPartner || !payoutAmount) return;
    setPayingOut(true);
    try {
      await apiFetch(`/admin/growth-partners/${payoutPartner.id}/record-payout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Number(payoutAmount) }),
      });
      toast.success(`تم تسجيل دفعة ${Number(payoutAmount).toLocaleString('ar-SA')} ر.س للشريك`);
      setShowPayout(false);
      load(page, q);
    } catch (e: any) {
      toast.error(e?.message ?? 'فشل تسجيل الدفعة');
    } finally {
      setPayingOut(false);
    }
  };

  // ── تقرير الشريك ─────────────────────────────────────────────────────

  const openReport = async (p: GrowthPartner) => {
    setReportPartner(p);
    setReport(null);
    setShowReport(true);
    setReportLoading(true);
    try {
      const res: any = await apiFetch(`/admin/growth-partners/${p.id}/report`);
      setReport(res?.data?.data ?? res?.data ?? null);
    } catch {
      toast.error('تعذّر تحميل التقرير');
    } finally {
      setReportLoading(false);
    }
  };

  // ── عرض ──────────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    if (!q.trim()) return partners;
    const qLower = q.toLowerCase();
    return partners.filter(
      (p) =>
        p.name.toLowerCase().includes(qLower) ||
        p.email.toLowerCase().includes(qLower) ||
        p.referral_code.toLowerCase().includes(qLower)
    );
  }, [partners, q]);

  return (
    <Layout title="شركاء النمو">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">شركاء النمو — Mr.20%</h1>
          <p className="text-sm text-gray-500 mt-0.5">إدارة شبكة الشركاء وتتبع العمولات</p>
        </div>
        <button
          onClick={() => { setForm({ ...emptyForm }); setShowCreate(true); }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <span className="text-lg leading-none">+</span>
          إضافة شريك جديد
        </button>
      </div>

      {/* ── بطاقات الإحصائيات ── */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'إجمالي الشركاء',    value: fmt(summary.total_partners),          color: 'bg-indigo-50 text-indigo-700' },
            { label: 'شركاء نشطون',       value: fmt(summary.active_partners),          color: 'bg-green-50 text-green-700'  },
            { label: 'إجمالي الإحالات',   value: fmt(summary.total_referrals),          color: 'bg-blue-50 text-blue-700'    },
            { label: 'إجمالي العمولات',   value: `${fmt(summary.total_commission_earned)} ر.س`, color: 'bg-amber-50 text-amber-700' },
          ].map((c) => (
            <div key={c.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <p className="text-xs text-gray-500 mb-1">{c.label}</p>
              <p className={`text-xl font-bold ${c.color.split(' ')[1]}`}>{c.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── البحث ── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-4">
        <input
          type="search"
          placeholder="بحث بالاسم أو الإيميل أو كود الإحالة..."
          value={q}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
      </div>

      {/* ── الجدول ── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-4xl mb-3">🤝</p>
            <p>لا يوجد شركاء بعد — أضف أول شريك نمو!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['الشريك', 'كود الإحالة', 'العمولة %', 'الإحالات', 'الصفقات', 'المكتسب', 'الحالة', 'إجراءات'].map((h) => (
                    <th key={h} className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-sm shrink-0">
                          {p.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{p.name}</p>
                          <p className="text-xs text-gray-400">{p.email}</p>
                          {p.phone && <p className="text-xs text-gray-400">{p.phone}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded text-gray-700">
                        {p.referral_code}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold text-indigo-600">{p.commission_percentage}%</td>
                    <td className="px-4 py-3 text-gray-700">{fmt(p.total_referrals)}</td>
                    <td className="px-4 py-3 text-gray-700">{fmt(p.total_settled_deals)}</td>
                    <td className="px-4 py-3 font-semibold text-green-700">{fmt(p.total_commission_earned)} ر.س</td>
                    <td className="px-4 py-3">{statusBadge(p.status, p.is_active)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 flex-wrap">
                        <button
                          onClick={() => openEdit(p)}
                          className="px-2 py-1 text-xs bg-indigo-50 text-indigo-700 rounded hover:bg-indigo-100 transition-colors"
                        >
                          تعديل
                        </button>
                        <button
                          onClick={() => { setContractPartner(p); setShowContract(true); }}
                          className="px-2 py-1 text-xs bg-purple-50 text-purple-700 rounded hover:bg-purple-100 transition-colors"
                        >
                          العقد
                        </button>
                        <button
                          onClick={() => openReport(p)}
                          className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors"
                        >
                          تقرير
                        </button>
                        <button
                          onClick={() => openPayout(p)}
                          className="px-2 py-1 text-xs bg-green-50 text-green-700 rounded hover:bg-green-100 transition-colors"
                        >
                          دفعة
                        </button>
                        <button
                          onClick={() => handleDelete(p)}
                          className="px-2 py-1 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
                        >
                          {p.total_settled_deals > 0 ? 'تعطيل' : 'حذف'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {lastPage > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <span className="text-xs text-gray-500">صفحة {page} من {lastPage}</span>
            <div className="flex gap-2">
              <button
                onClick={() => { setPage(p => p - 1); load(page - 1, q); }}
                disabled={page <= 1}
                className="px-3 py-1 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
              >
                السابق
              </button>
              <button
                onClick={() => { setPage(p => p + 1); load(page + 1, q); }}
                disabled={page >= lastPage}
                className="px-3 py-1 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
              >
                التالي
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          Modal: إنشاء شريك جديد
      ═══════════════════════════════════════════════════════════════════ */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" dir="rtl">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-lg font-bold text-gray-900">إضافة شريك نمو جديد</h2>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
            </div>

            <div className="p-6 space-y-5">
              {/* الاسم */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">اسم الشريك / الجهة <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    placeholder="اسم شركة أو شخص"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">اسم جهة التواصل</label>
                  <input
                    type="text"
                    value={form.contact_name}
                    onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    placeholder="الاسم الشخصي"
                  />
                </div>
              </div>

              {/* الإيميل والجوال */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">البريد الإلكتروني <span className="text-red-500">*</span></label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    placeholder="partner@example.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">رقم الجوال</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    placeholder="05xxxxxxxx"
                  />
                </div>
              </div>

              {/* نسبة العمولة والحالة */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">نسبة العمولة %</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={form.commission_percentage}
                    onChange={(e) => setForm({ ...form, commission_percentage: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">حالة الشريك</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  >
                    <option value="approved">نشط (approved)</option>
                    <option value="pending">معلّق (pending)</option>
                    <option value="suspended">موقوف (suspended)</option>
                  </select>
                </div>
              </div>

              {/* ربط بمستخدم موجود */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">ربط بحساب مستخدم (لتفعيل SSO)</label>
                <select
                  value={form.linked_user_id}
                  onChange={(e) => setForm({ ...form, linked_user_id: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                >
                  <option value="">— بدون ربط (سيُضاف لاحقاً) —</option>
                  {options?.all_users?.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.first_name} {u.last_name} — {u.email}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  ⚡ لكي يتمكن الشريك من الدخول على partner.dasm.com.sa يجب ربط حسابه هنا
                </p>
              </div>

              {/* المنطقة */}
              {options?.areas && options.areas.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">المنطقة الجغرافية</label>
                  <select
                    value={form.area_id}
                    onChange={(e) => setForm({ ...form, area_id: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  >
                    <option value="">— اختر المنطقة —</option>
                    {options.areas.map((a) => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* بيانات بنكية */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">IBAN</label>
                  <input
                    type="text"
                    value={form.bank_iban}
                    onChange={(e) => setForm({ ...form, bank_iban: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    placeholder="SAxx xxxx xxxx..."
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">اسم البنك</label>
                  <input
                    type="text"
                    value={form.bank_name}
                    onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    placeholder="البنك الأهلي..."
                  />
                </div>
              </div>

              {/* ملاحظات */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">ملاحظات داخلية</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  placeholder="ملاحظات للأدمن فقط..."
                />
              </div>

              {/* أزرار */}
              <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
                  إلغاء
                </button>
                <button
                  onClick={handleCreate}
                  disabled={creating}
                  className="px-6 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium"
                >
                  {creating ? 'جاري الإنشاء...' : 'إنشاء الشريك'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          Modal: تعديل الشريك
      ═══════════════════════════════════════════════════════════════════ */}
      {showEdit && editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" dir="rtl">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <div>
                <h2 className="text-lg font-bold text-gray-900">تعديل: {editing.name}</h2>
                <p className="text-xs text-gray-400 font-mono">{editing.referral_code}</p>
              </div>
              <button onClick={() => setShowEdit(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">الاسم</label>
                  <input type="text" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">جهة التواصل</label>
                  <input type="text" value={editForm.contact_name} onChange={(e) => setEditForm({ ...editForm, contact_name: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">الإيميل</label>
                  <input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" dir="ltr" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">الجوال</label>
                  <input type="tel" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">العمولة %</label>
                  <input type="number" min="1" max="100" value={editForm.commission_percentage}
                    onChange={(e) => setEditForm({ ...editForm, commission_percentage: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">الحالة</label>
                  <select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
                    <option value="approved">نشط</option>
                    <option value="pending">معلّق</option>
                    <option value="suspended">موقوف</option>
                  </select>
                </div>
                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={editForm.is_active}
                      onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                      className="w-4 h-4 rounded accent-indigo-600" />
                    <span className="text-sm text-gray-700">مفعّل</span>
                  </label>
                </div>
              </div>

              {/* ربط بمستخدم */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  ربط بحساب مستخدم
                  {editing.linked_user_id && <span className="text-green-600 mr-2">✓ مرتبط حالياً (ID: {editing.linked_user_id})</span>}
                </label>
                <select value={editForm.linked_user_id}
                  onChange={(e) => setEditForm({ ...editForm, linked_user_id: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
                  <option value="">— بدون ربط —</option>
                  {editing.linked_user_id && (
                    <option value={String(editing.linked_user_id)}>المستخدم الحالي (ID: {editing.linked_user_id})</option>
                  )}
                  {options?.all_users?.map((u) => (
                    <option key={u.id} value={u.id}>{u.first_name} {u.last_name} — {u.email}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">IBAN</label>
                  <input type="text" value={editForm.bank_iban} onChange={(e) => setEditForm({ ...editForm, bank_iban: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" dir="ltr" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">اسم البنك</label>
                  <input type="text" value={editForm.bank_name} onChange={(e) => setEditForm({ ...editForm, bank_name: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">ملاحظات</label>
                <textarea value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} rows={2}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                <button onClick={() => setShowEdit(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
                  إلغاء
                </button>
                <button onClick={handleSave} disabled={saving}
                  className="px-6 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium">
                  {saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          Modal: تسجيل دفعة
      ═══════════════════════════════════════════════════════════════════ */}
      {showPayout && payoutPartner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" dir="rtl">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold">تسجيل دفعة — {payoutPartner.name}</h2>
              <button onClick={() => setShowPayout(false)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-green-50 rounded-lg p-3 text-sm">
                <p className="text-green-700 font-medium">المستحق للشريك</p>
                <p className="text-2xl font-bold text-green-800 mt-1">
                  {fmt(payoutPartner.total_commission_earned - (payoutPartner.total_paid_amount ?? 0))} ر.س
                </p>
                <p className="text-xs text-green-600 mt-1">
                  إجمالي مكتسب: {fmt(payoutPartner.total_commission_earned)} | مدفوع: {fmt(payoutPartner.total_paid_amount)} ر.س
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">المبلغ المدفوع (ر.س) <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 text-center text-lg font-bold"
                  placeholder="0.00"
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowPayout(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
                  إلغاء
                </button>
                <button onClick={handlePayout} disabled={payingOut || !payoutAmount}
                  className="px-6 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium">
                  {payingOut ? 'جاري التسجيل...' : 'تأكيد الدفعة'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          Modal: تقرير الشريك
      ═══════════════════════════════════════════════════════════════════ */}
      {showReport && reportPartner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" dir="rtl">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <div>
                <h2 className="text-lg font-bold text-gray-900">تقرير: {reportPartner.name}</h2>
                <p className="text-xs text-gray-400 font-mono">{reportPartner.referral_code} · {reportPartner.commission_percentage}% عمولة</p>
              </div>
              <button onClick={() => setShowReport(false)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
            </div>

            <div className="p-6">
              {reportLoading ? (
                <div className="flex justify-center py-12">
                  <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                </div>
              ) : report ? (
                <div className="space-y-6">
                  {/* إحصائيات مالية */}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'صفقات مكتملة',     value: fmt(report.financials?.total_deals)           },
                      { label: 'حجم التداول',       value: `${fmt(report.financials?.total_volume)} ر.س` },
                      { label: 'عمولة المنصة',     value: `${fmt(report.financials?.total_net_platform)} ر.س` },
                      { label: 'حصة الشريك',       value: `${fmt(report.financials?.total_partner_earned)} ر.س` },
                      { label: 'متوسط عمولة/صفقة', value: `${fmt(report.financials?.avg_deal_commission)} ر.س` },
                      { label: 'نسبة العمولة',      value: report.financials?.commission_rate ?? '—' },
                    ].map((s) => (
                      <div key={s.label} className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500">{s.label}</p>
                        <p className="text-base font-bold text-gray-900 mt-0.5">{s.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* المستخدمون */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">
                      المستخدمون المُحالون ({report.users?.total ?? 0} إجمالي · {report.users?.active ?? 0} نشط)
                    </h3>
                    {report.users?.recent?.length > 0 ? (
                      <div className="space-y-2">
                        {report.users.recent.map((u: any) => (
                          <div key={u.id} className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-2">
                            <span>{u.first_name} {u.last_name} <span className="text-gray-400 text-xs">— {u.email}</span></span>
                            <span className="text-xs text-gray-400">{new Date(u.created_at).toLocaleDateString('ar-SA')}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400">لا يوجد إحالات بعد</p>
                    )}
                  </div>

                  {/* آخر الصفقات */}
                  {report.recent_deals?.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">آخر الصفقات</h3>
                      <div className="space-y-2">
                        {report.recent_deals.map((d: any) => (
                          <div key={d.id} className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-2">
                            <div>
                              <span className="font-medium">صفقة #{d.id}</span>
                              <span className="text-gray-400 text-xs mr-2">{new Date(d.created_at).toLocaleDateString('ar-SA')}</span>
                            </div>
                            <span className="font-bold text-green-700">+{fmt(d.growth_partner_commission)} ر.س</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-center text-gray-400 py-8">تعذّر تحميل التقرير</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          Modal: عرض العقد (للقراءة فقط — نفس ما يراه الشريك قبل التوقيع)
      ═══════════════════════════════════════════════════════════════════ */}
      {showContract && contractPartner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" dir="rtl">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[92vh]">
            {/* رأس المودال */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl shrink-0">
              <div>
                <h2 className="text-lg font-bold text-gray-900">عقد شراكة النمو</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  معاينة العقد الذي وقّعه / سيوقّعه:{' '}
                  <span className="font-semibold text-gray-700">{contractPartner.name}</span>
                  {contractPartner.referral_code && (
                    <span className="font-mono mr-2 text-indigo-600">[{contractPartner.referral_code}]</span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {contractPartner.legal_undertaking_accepted_at ? (
                  <span className="px-3 py-1 text-xs bg-green-50 text-green-700 rounded-full font-medium border border-green-200">
                    ✓ موقّع في {new Date(contractPartner.legal_undertaking_accepted_at).toLocaleDateString('ar-SA')}
                  </span>
                ) : (
                  <span className="px-3 py-1 text-xs bg-amber-50 text-amber-700 rounded-full font-medium border border-amber-200">
                    لم يوقّع بعد
                  </span>
                )}
                <button
                  onClick={() => setShowContract(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                >
                  ×
                </button>
              </div>
            </div>

            {/* نص العقد */}
            <div className="overflow-y-auto flex-1 px-6 sm:px-8 py-6">
              <GrowthPartnerContract
                partnerName={contractPartner.contact_name ?? contractPartner.name}
                commissionPercent={contractPartner.commission_percentage}
                referralCode={contractPartner.referral_code}
                contractDate={
                  contractPartner.legal_undertaking_accepted_at
                    ? new Date(contractPartner.legal_undertaking_accepted_at).toLocaleDateString('ar-SA', {
                        year: 'numeric', month: 'long', day: 'numeric',
                      })
                    : undefined
                }
              />
            </div>

            {/* الذيل */}
            <div className="border-t border-gray-100 px-6 py-4 flex items-center justify-between shrink-0 bg-gray-50 rounded-b-2xl">
              <p className="text-xs text-gray-400">
                هذه معاينة للعقد — القبول يتم من بوابة الشريك فقط
              </p>
              <button
                onClick={() => setShowContract(false)}
                className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
