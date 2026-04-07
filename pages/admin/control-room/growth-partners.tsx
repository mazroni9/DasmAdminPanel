import { useCallback, useEffect, useState } from "react";
import {
  Users, TrendingUp, Search, RefreshCw, CheckCircle, XCircle,
  DollarSign, UserPlus, ExternalLink, Handshake, Plus, Edit3,
  FileText, Send, Eye, X, Save, AlertTriangle, Banknote,
} from "lucide-react";
import ControlRoomGate, { type ControlRoomAccessLevel } from "@/components/control-room/ControlRoomGate";
import ControlRoomShell from "@/components/control-room/ControlRoomShell";
import dasmBff from "@/lib/dasmBffClient";

/* ===== Types ===== */
type Partner = {
  id: number;
  name: string;
  contact_name?: string;
  email: string;
  phone: string;
  referral_code: string;
  partner_code: string;
  commission_percentage: string;
  is_active: boolean;
  status: string;
  bank_iban?: string;
  bank_name?: string;
  notes?: string;
  total_referrals: number;
  total_settled_deals: number;
  total_commission_earned: string;
  total_paid_amount: string;
  created_at: string;
};

type Summary = {
  total_partners: number;
  active_partners: number;
  total_referrals: number;
  total_commission_earned: number;
};

type PartnerReport = {
  partner: Partner;
  users: { total: number; active: number; recent: any[] };
  financials: { total_deals: number; total_partner_earned: number; avg_deal_commission: number };
  recent_deals: any[];
};

/* ===== Helpers ===== */
function fmt(n: number | string | undefined): string {
  if (n == null) return "—";
  const num = typeof n === "string" ? parseFloat(n) : n;
  return isNaN(num) ? "—" : num.toLocaleString("ar-SA");
}

/* ===== Tab type ===== */
type Tab = "list" | "add" | "report" | "payout";

/* ===== Main Content ===== */
function GrowthPartnersContent({ access }: { access: ControlRoomAccessLevel }) {
  const isFull = access === "full";
  const [partners, setPartners] = useState<Partner[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<Tab>("list");
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [report, setReport] = useState<PartnerReport | null>(null);
  const [reportLoading, setReportLoading] = useState(false);

  // نموذج إضافة/تعديل شريك
  const [form, setForm] = useState({ name: "", email: "", phone: "", commission_percentage: "20", bank_iban: "", bank_name: "", notes: "" });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formMsg, setFormMsg] = useState("");

  // نموذج الدفعة
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutMsg, setPayoutMsg] = useState("");

  /* ---- تحميل البيانات ---- */
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [listRes, summaryRes] = await Promise.allSettled([
        dasmBff.get("admin/growth-partners"),
        dasmBff.get("admin/growth-partners/summary"),
      ]);
      if (listRes.status === "fulfilled") {
        const d = listRes.value.data;
        setPartners(d?.data?.data ?? d?.data ?? []);
        if (d?.summary) setSummary(d.summary);
      }
      if (summaryRes.status === "fulfilled") {
        const d = summaryRes.value.data;
        setSummary(d?.totals ?? d?.data ?? d);
      }
    } catch { /* skip */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  /* ---- تقرير شريك ---- */
  const openReport = async (p: Partner) => {
    setSelectedPartner(p);
    setTab("report");
    setReportLoading(true);
    try {
      const res = await dasmBff.get(`admin/growth-partners/${p.id}/report`);
      setReport(res.data?.data ?? res.data ?? null);
    } catch { setReport(null); }
    finally { setReportLoading(false); }
  };

  /* ---- فتح نموذج التعديل ---- */
  const openEdit = (p: Partner) => {
    setEditingId(p.id);
    setForm({
      name: p.name,
      email: p.email,
      phone: p.phone || "",
      commission_percentage: p.commission_percentage,
      bank_iban: p.bank_iban || "",
      bank_name: p.bank_name || "",
      notes: p.notes || "",
    });
    setFormMsg("");
    setTab("add");
  };

  /* ---- فتح نموذج إضافة ---- */
  const openAdd = () => {
    setEditingId(null);
    setForm({ name: "", email: "", phone: "", commission_percentage: "20", bank_iban: "", bank_name: "", notes: "" });
    setFormMsg("");
    setTab("add");
  };

  /* ---- حفظ (إضافة / تعديل) ---- */
  const savePartner = async () => {
    if (!form.name || !form.email) { setFormMsg("الاسم والإيميل مطلوبين"); return; }
    setFormLoading(true);
    setFormMsg("");
    try {
      if (editingId) {
        await dasmBff.put(`admin/growth-partners/${editingId}`, form);
        setFormMsg("تم تحديث الشريك بنجاح ✅");
      } else {
        await dasmBff.post("admin/growth-partners", { ...form, status: "approved", is_active: true });
        setFormMsg("تم إضافة الشريك بنجاح ✅");
      }
      await load();
      setTimeout(() => setTab("list"), 1000);
    } catch (e: any) {
      setFormMsg("خطأ: " + (e?.response?.data?.message || "فشل الحفظ"));
    } finally { setFormLoading(false); }
  };

  /* ---- فتح نموذج الدفع ---- */
  const openPayout = (p: Partner) => {
    setSelectedPartner(p);
    setPayoutAmount("");
    setPayoutMsg("");
    setTab("payout");
  };

  /* ---- تنفيذ الدفع ---- */
  const executePayout = async () => {
    if (!selectedPartner || !payoutAmount) return;
    const amount = parseFloat(payoutAmount);
    if (isNaN(amount) || amount <= 0) { setPayoutMsg("المبلغ غير صالح"); return; }

    const pending = parseFloat(selectedPartner.total_commission_earned) - parseFloat(selectedPartner.total_paid_amount);
    if (amount > pending) { setPayoutMsg(`المبلغ أكبر من المستحق المعلّق (${fmt(pending)} ر.س)`); return; }

    setPayoutLoading(true);
    setPayoutMsg("");
    try {
      await dasmBff.post(`admin/growth-partners/${selectedPartner.id}/record-payout`, { amount });
      setPayoutMsg("تم تسجيل الدفعة بنجاح ✅ — سيظهر في الليدجر");
      await load();
    } catch (e: any) {
      setPayoutMsg("خطأ: " + (e?.response?.data?.message || "فشل تسجيل الدفعة"));
    } finally { setPayoutLoading(false); }
  };

  const filtered = search
    ? partners.filter((p) =>
        p.name.includes(search) || p.email.includes(search) ||
        p.referral_code.includes(search) || p.partner_code.includes(search))
    : partners;

  return (
    <ControlRoomShell access={access}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Handshake className="w-6 h-6 text-emerald-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">شركاء النمو</h1>
              <p className="text-sm text-gray-500">إدارة ومراقبة شبكة شركاء النمو</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {isFull && (
              <button onClick={openAdd} className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition">
                <Plus className="w-4 h-4" /> إضافة شريك
              </button>
            )}
            <button onClick={() => { setTab("list"); load(); }} disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-600 text-sm rounded-lg hover:bg-gray-200 transition disabled:opacity-50">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> تحديث
            </button>
            <a href="https://partner.dasm.com.sa" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-100 text-emerald-700 text-sm rounded-lg hover:bg-emerald-200 transition">
              <ExternalLink className="w-4 h-4" /> بوابة الشركاء
            </a>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "إجمالي الشركاء", value: summary?.total_partners ?? partners.length, icon: Handshake, color: "bg-emerald-50 text-emerald-700" },
            { label: "نشط", value: summary?.active_partners ?? partners.filter((p) => p.is_active).length, icon: CheckCircle, color: "bg-green-50 text-green-700" },
            { label: "إجمالي الإحالات", value: summary?.total_referrals ?? 0, icon: UserPlus, color: "bg-blue-50 text-blue-700" },
            { label: "إجمالي العمولات", value: `${fmt(summary?.total_commission_earned ?? 0)} ر.س`, icon: DollarSign, color: "bg-amber-50 text-amber-700" },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className={`rounded-xl p-4 ${stat.color}`}>
                <div className="flex items-center gap-2 mb-1"><Icon className="w-4 h-4" /><span className="text-xs font-medium">{stat.label}</span></div>
                <div className="text-2xl font-bold">{loading ? "..." : stat.value}</div>
              </div>
            );
          })}
        </div>

        {/* ========== تاب: قائمة الشركاء ========== */}
        {tab === "list" && (
          <>
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="بحث بالاسم أو الإيميل أو كود الإحالة..." value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pr-10 pl-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-900">كل الشركاء</h3>
                <span className="text-xs text-gray-400">{filtered.length} شريك</span>
              </div>

              {loading ? (
                <div className="text-center py-12 text-gray-400 text-sm">جاري التحميل...</div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-12">
                  <Handshake className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                  <p className="text-sm text-gray-400">لا يوجد شركاء بعد</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-right">
                        <th className="px-4 py-2.5 text-xs font-semibold text-gray-500">الشريك</th>
                        <th className="px-4 py-2.5 text-xs font-semibold text-gray-500">كود الإحالة</th>
                        <th className="px-4 py-2.5 text-xs font-semibold text-gray-500">العمولة</th>
                        <th className="px-4 py-2.5 text-xs font-semibold text-gray-500">الإحالات</th>
                        <th className="px-4 py-2.5 text-xs font-semibold text-gray-500">الصفقات</th>
                        <th className="px-4 py-2.5 text-xs font-semibold text-gray-500">المكتسب</th>
                        <th className="px-4 py-2.5 text-xs font-semibold text-gray-500">المدفوع</th>
                        <th className="px-4 py-2.5 text-xs font-semibold text-gray-500">المعلّق</th>
                        <th className="px-4 py-2.5 text-xs font-semibold text-gray-500">الحالة</th>
                        {isFull && <th className="px-4 py-2.5 text-xs font-semibold text-gray-500">إجراءات</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filtered.map((p) => {
                        const pending = parseFloat(p.total_commission_earned) - parseFloat(p.total_paid_amount);
                        return (
                          <tr key={p.id} className="hover:bg-gray-50/50 transition">
                            <td className="px-4 py-3">
                              <div className="font-semibold text-gray-900">{p.name}</div>
                              <div className="text-xs text-gray-400">{p.email}</div>
                            </td>
                            <td className="px-4 py-3">
                              <span className="font-mono text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">{p.referral_code}</span>
                            </td>
                            <td className="px-4 py-3 font-bold text-emerald-600">{p.commission_percentage}%</td>
                            <td className="px-4 py-3 text-gray-600">{p.total_referrals}</td>
                            <td className="px-4 py-3 text-gray-600">{p.total_settled_deals}</td>
                            <td className="px-4 py-3 font-semibold text-gray-900">{fmt(p.total_commission_earned)}</td>
                            <td className="px-4 py-3 text-green-600">{fmt(p.total_paid_amount)}</td>
                            <td className="px-4 py-3 font-bold text-amber-600">{fmt(pending)}</td>
                            <td className="px-4 py-3">
                              {p.is_active && p.status === "approved" ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                  <CheckCircle className="w-3 h-3" /> نشط
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">{p.status}</span>
                              )}
                            </td>
                            {isFull && (
                              <td className="px-4 py-3">
                                <div className="flex gap-1">
                                  <button onClick={() => openReport(p)} title="تقرير" className="p-1.5 rounded hover:bg-blue-50 text-blue-600"><FileText className="w-4 h-4" /></button>
                                  <button onClick={() => openEdit(p)} title="تعديل" className="p-1.5 rounded hover:bg-amber-50 text-amber-600"><Edit3 className="w-4 h-4" /></button>
                                  <button onClick={() => openPayout(p)} title="تحويل مبلغ" className="p-1.5 rounded hover:bg-green-50 text-green-600"><Banknote className="w-4 h-4" /></button>
                                </div>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* ========== تاب: إضافة / تعديل شريك ========== */}
        {tab === "add" && isFull && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold">{editingId ? "تعديل شريك" : "إضافة شريك نمو جديد"}</h2>
              <button onClick={() => setTab("list")} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الاسم الكامل *</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني *</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الجوال</label>
                <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">نسبة العمولة %</label>
                <input type="number" min="1" max="50" value={form.commission_percentage}
                  onChange={(e) => setForm({ ...form, commission_percentage: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">IBAN البنك</label>
                <input type="text" value={form.bank_iban} onChange={(e) => setForm({ ...form, bank_iban: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono" placeholder="SA..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">اسم البنك</label>
                <input type="text" value={form.bank_name} onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>
            </div>
            {formMsg && <p className={`mt-4 text-sm ${formMsg.includes("✅") ? "text-green-600" : "text-red-600"}`}>{formMsg}</p>}
            <div className="flex gap-3 mt-6">
              <button onClick={savePartner} disabled={formLoading}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 disabled:opacity-50">
                <Save className="w-4 h-4" /> {formLoading ? "جاري الحفظ..." : editingId ? "حفظ التعديلات" : "إضافة الشريك"}
              </button>
              <button onClick={() => setTab("list")} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200">إلغاء</button>
            </div>
          </div>
        )}

        {/* ========== تاب: التقرير التفصيلي ========== */}
        {tab === "report" && selectedPartner && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">تقرير: {selectedPartner.name}</h2>
              <button onClick={() => setTab("list")} className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-600 text-sm rounded-lg hover:bg-gray-200">
                <X className="w-4 h-4" /> رجوع
              </button>
            </div>

            {reportLoading ? (
              <div className="text-center py-12 text-gray-400">جاري تحميل التقرير...</div>
            ) : !report ? (
              <div className="text-center py-12 text-gray-400">لا توجد بيانات للتقرير</div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 text-blue-700 rounded-xl p-4">
                    <p className="text-xs font-medium mb-1">إجمالي المُحالين</p>
                    <p className="text-2xl font-bold">{report.users?.total ?? 0}</p>
                  </div>
                  <div className="bg-green-50 text-green-700 rounded-xl p-4">
                    <p className="text-xs font-medium mb-1">نشط منهم</p>
                    <p className="text-2xl font-bold">{report.users?.active ?? 0}</p>
                  </div>
                  <div className="bg-amber-50 text-amber-700 rounded-xl p-4">
                    <p className="text-xs font-medium mb-1">الصفقات</p>
                    <p className="text-2xl font-bold">{report.financials?.total_deals ?? 0}</p>
                  </div>
                  <div className="bg-emerald-50 text-emerald-700 rounded-xl p-4">
                    <p className="text-xs font-medium mb-1">إجمالي المكتسب</p>
                    <p className="text-2xl font-bold">{fmt(report.financials?.total_partner_earned)} ر.س</p>
                  </div>
                </div>

                {/* آخر المُحالين */}
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <h3 className="text-sm font-bold mb-3">آخر العملاء المُحالين</h3>
                  {!report.users?.recent?.length ? (
                    <p className="text-sm text-gray-400">لا يوجد مُحالين بعد</p>
                  ) : (
                    <div className="space-y-2">
                      {report.users.recent.slice(0, 10).map((u: any) => (
                        <div key={u.id} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                          <div>
                            <span className="text-sm font-medium">{u.first_name} {u.last_name}</span>
                            <span className="text-xs text-gray-400 mr-2">{u.email}</span>
                          </div>
                          <span className="text-xs text-gray-400">{new Date(u.created_at).toLocaleDateString("ar-SA")}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* آخر الصفقات */}
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <h3 className="text-sm font-bold mb-3">آخر الصفقات</h3>
                  {!report.recent_deals?.length ? (
                    <p className="text-sm text-gray-400">لا توجد صفقات بعد</p>
                  ) : (
                    <div className="space-y-2">
                      {report.recent_deals.slice(0, 10).map((d: any) => (
                        <div key={d.id} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                          <span className="text-sm">صفقة #{d.settlement_id ?? d.id}</span>
                          <span className="text-sm font-bold text-emerald-600">+{fmt(d.growth_partner_commission)} ر.س</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* ========== تاب: تحويل مبلغ (دفعة يدوية) ========== */}
        {tab === "payout" && selectedPartner && isFull && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Banknote className="w-5 h-5 text-green-600" />
                تحويل مبلغ لشريك
              </h2>
              <button onClick={() => setTab("list")} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5 text-gray-400" /></button>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-amber-800">تحويل يدوي — استخدم في حالة تعطّل نظام السبلت في البنك</p>
                  <p className="text-xs text-amber-600 mt-1">المبلغ يُسجّل في الليدجر كدفعة مكتملة. تأكد من التحويل البنكي الفعلي قبل التسجيل.</p>
                </div>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">الشريك</span>
                <span className="text-sm font-bold">{selectedPartner.name}</span>
              </div>
              <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">إجمالي المكتسب</span>
                <span className="text-sm font-bold">{fmt(selectedPartner.total_commission_earned)} ر.س</span>
              </div>
              <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">المدفوع سابقاً</span>
                <span className="text-sm font-bold text-green-600">{fmt(selectedPartner.total_paid_amount)} ر.س</span>
              </div>
              <div className="flex justify-between p-3 bg-amber-50 rounded-lg border border-amber-200">
                <span className="text-sm font-bold text-amber-700">المعلّق (المستحق)</span>
                <span className="text-sm font-bold text-amber-700">
                  {fmt(parseFloat(selectedPartner.total_commission_earned) - parseFloat(selectedPartner.total_paid_amount))} ر.س
                </span>
              </div>
              {selectedPartner.bank_iban && (
                <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">IBAN</span>
                  <span className="text-sm font-mono">{selectedPartner.bank_iban}</span>
                </div>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">المبلغ المراد تحويله (ر.س)</label>
              <input type="number" min="1" value={payoutAmount} onChange={(e) => setPayoutAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-3 border border-gray-200 rounded-lg text-lg font-bold text-center focus:ring-2 focus:ring-green-500/20 focus:border-green-500" />
            </div>

            {payoutMsg && <p className={`mb-4 text-sm ${payoutMsg.includes("✅") ? "text-green-600" : "text-red-600"}`}>{payoutMsg}</p>}

            <div className="flex gap-3">
              <button onClick={executePayout} disabled={payoutLoading || !payoutAmount}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 disabled:opacity-50">
                <Send className="w-4 h-4" /> {payoutLoading ? "جاري التسجيل..." : "تأكيد وتسجيل الدفعة"}
              </button>
              <button onClick={() => setTab("list")} className="px-4 py-3 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200">إلغاء</button>
            </div>
          </div>
        )}
      </div>
    </ControlRoomShell>
  );
}

export default function GrowthPartnersPage() {
  return (
    <ControlRoomGate>
      {(access) => <GrowthPartnersContent access={access} />}
    </ControlRoomGate>
  );
}
