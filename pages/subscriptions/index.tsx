/**
 * /subscriptions — الباقات والأسعار.
 *
 * Consumes the admin subscription-plans endpoints from DASM-Platform
 * PR #2. Each plan row is expanded into two inline editors:
 *   1. Prices (one row per billing cycle)
 *   2. Capacity (one row per plan — bids / classifieds / store / …)
 *
 * Mutations gate on `subscription_plans.manage`; read-only viewers
 * (view-only ability) still see the tables but every action button
 * surfaces a 403 toast on click. We don't hide buttons client-side
 * because the source of truth for permissions is the API.
 */

import Layout from "../../components/Layout";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  listPlans,
  updatePlan,
  upsertCapacity,
  upsertPrice,
  type PlanCapacity,
  type PlanCategory,
  type SubscriptionPlan,
} from "../../lib/subscriptionsApi";
import { extractErrorMessage } from "../../utils/api";

const CATEGORY_LABELS: Record<PlanCategory, string> = {
  member: "للأعضاء",
  dealer: "للتجار",
};

const CYCLE_ORDER = ["monthly", "quarterly", "semi_annual", "annual"] as const;
type CycleKey = (typeof CYCLE_ORDER)[number];

function sortPricesByCycle(plan: SubscriptionPlan): SubscriptionPlan {
  return {
    ...plan,
    prices: [...plan.prices].sort(
      (a, b) =>
        CYCLE_ORDER.indexOf(a.cycle_key as CycleKey) -
        CYCLE_ORDER.indexOf(b.cycle_key as CycleKey),
    ),
  };
}

export default function SubscriptionsAdminPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<"all" | PlanCategory>("all");

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listPlans();
      setPlans(data.map(sortPricesByCycle));
    } catch (e) {
      toast.error(extractErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchPlans();
  }, [fetchPlans]);

  const visiblePlans = useMemo(
    () =>
      filterCategory === "all"
        ? plans
        : plans.filter((p) => p.category === filterCategory),
    [plans, filterCategory],
  );

  async function togglePlanActive(plan: SubscriptionPlan) {
    try {
      const updated = await updatePlan(plan.id, { is_active: !plan.is_active });
      setPlans((prev) =>
        prev.map((p) => (p.id === plan.id ? sortPricesByCycle({ ...p, ...updated }) : p)),
      );
      toast.success(updated.is_active ? "تم تفعيل الباقة" : "تم تعطيل الباقة");
    } catch (e) {
      toast.error(extractErrorMessage(e));
    }
  }

  async function savePrice(
    planId: number,
    billingCycleId: number,
    price: number,
  ) {
    try {
      await upsertPrice(planId, { billing_cycle_id: billingCycleId, price });
      await fetchPlans();
      toast.success("تم حفظ السعر");
    } catch (e) {
      toast.error(extractErrorMessage(e));
    }
  }

  async function saveCapacity(planId: number, body: Partial<PlanCapacity>) {
    try {
      await upsertCapacity(planId, body);
      await fetchPlans();
      toast.success("تم حفظ سعة الباقة");
    } catch (e) {
      toast.error(extractErrorMessage(e));
    }
  }

  return (
    <Layout>
      <div dir="rtl" className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">الباقات والأسعار</h1>
            <p className="text-sm text-gray-500 mt-1">
              المصدر الرسمي: <code>SUBSCRIPTION_PLAN.md</code> — أي تعديل هنا يجب مزامنته مع xlsx + السيّدر.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">الفئة:</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value as "all" | PlanCategory)}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm bg-white"
            >
              <option value="all">الكل</option>
              <option value="member">للأعضاء</option>
              <option value="dealer">للتجار</option>
            </select>
            <button
              onClick={fetchPlans}
              className="px-3 py-1.5 text-sm rounded-lg bg-gray-100 hover:bg-gray-200 transition"
            >
              تحديث
            </button>
          </div>
        </div>

        {loading && <div className="text-center py-12 text-gray-500">جارٍ التحميل…</div>}

        {!loading && visiblePlans.length === 0 && (
          <div className="text-center py-12 text-gray-500">لا توجد باقات.</div>
        )}

        {!loading && visiblePlans.length > 0 && (
          <div className="space-y-5">
            {visiblePlans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                onToggleActive={() => togglePlanActive(plan)}
                onSavePrice={savePrice}
                onSaveCapacity={saveCapacity}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

// ─────────────────────────── PlanCard ───────────────────────────

function PlanCard({
  plan,
  onToggleActive,
  onSavePrice,
  onSaveCapacity,
}: {
  plan: SubscriptionPlan;
  onToggleActive: () => void;
  onSavePrice: (planId: number, cycleId: number, price: number) => Promise<void>;
  onSaveCapacity: (planId: number, body: Partial<PlanCapacity>) => Promise<void>;
}) {
  return (
    <section
      className={`rounded-2xl border bg-white shadow-sm overflow-hidden ${
        plan.is_active ? "border-gray-200" : "border-amber-300 bg-amber-50/30"
      }`}
    >
      <header className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <span
            className={`inline-block w-2.5 h-2.5 rounded-full ${
              plan.is_active ? "bg-emerald-500" : "bg-amber-500"
            }`}
          />
          <h2 className="text-lg font-bold text-gray-900">
            {plan.tier_name_ar}
            <span className="text-sm font-normal text-gray-500 mr-2">
              ({CATEGORY_LABELS[plan.category]})
            </span>
          </h2>
          <code className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded">{plan.key}</code>
        </div>
        <button
          onClick={onToggleActive}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
            plan.is_active
              ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
              : "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
          }`}
        >
          {plan.is_active ? "تعطيل" : "تفعيل"}
        </button>
      </header>

      {/* Prices */}
      <div className="px-5 py-4">
        <h3 className="text-sm font-bold text-gray-700 mb-3">الأسعار</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {plan.prices.map((p) => (
            <PriceEditor
              key={p.id}
              label={p.cycle_name_ar}
              price={p.price}
              onSave={(newPrice) => onSavePrice(plan.id, p.billing_cycle_id, newPrice)}
            />
          ))}
        </div>
      </div>

      {/* Capacity */}
      <div className="px-5 py-4 border-t border-gray-100 bg-gray-50/60">
        <h3 className="text-sm font-bold text-gray-700 mb-3">السعات والصلاحيات</h3>
        {plan.capacity ? (
          <CapacityEditor
            capacity={plan.capacity}
            onSave={(patch) => onSaveCapacity(plan.id, patch)}
          />
        ) : (
          <button
            onClick={() =>
              onSaveCapacity(plan.id, {
                free_classifieds_per_month: 0,
                overage_classified_price: 15,
                has_store: false,
                store_level: "none",
                has_bulk_upload: false,
                has_api_access: false,
                max_users: 1,
                support_tier: "standard",
              })
            }
            className="px-3 py-1.5 text-xs rounded-lg bg-gray-100 hover:bg-gray-200"
          >
            إنشاء سعات افتراضية
          </button>
        )}
      </div>
    </section>
  );
}

// ─────────────────────────── PriceEditor ───────────────────────────

function PriceEditor({
  label,
  price,
  onSave,
}: {
  label: string;
  price: number;
  onSave: (price: number) => Promise<void>;
}) {
  const [value, setValue] = useState<string>(String(price));
  const [saving, setSaving] = useState(false);
  const dirty = Number(value) !== price;

  useEffect(() => {
    setValue(String(price));
  }, [price]);

  async function handleSave() {
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0) {
      toast.error("قيمة غير صالحة");
      return;
    }
    setSaving(true);
    try {
      await onSave(n);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl bg-gray-50 border border-gray-200 px-3 py-2.5">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="flex items-center gap-1.5">
        <input
          type="number"
          min="0"
          step="0.01"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="flex-1 w-0 text-sm px-2 py-1 rounded-md border border-gray-300 bg-white tabular-nums"
        />
        <span className="text-xs text-gray-500">ر.س</span>
        <button
          onClick={handleSave}
          disabled={!dirty || saving}
          className="px-2.5 py-1 text-xs font-semibold rounded-md bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          {saving ? "…" : "حفظ"}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────── CapacityEditor ───────────────────────────

function CapacityEditor({
  capacity,
  onSave,
}: {
  capacity: PlanCapacity;
  onSave: (patch: Partial<PlanCapacity>) => Promise<void>;
}) {
  const [draft, setDraft] = useState<PlanCapacity>(capacity);
  const [saving, setSaving] = useState(false);
  const dirty = JSON.stringify(draft) !== JSON.stringify(capacity);

  useEffect(() => setDraft(capacity), [capacity]);

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(draft);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <NullableNumberField
          label="المزايدات شهريًا"
          value={draft.bids_per_month}
          onChange={(v) => setDraft({ ...draft, bids_per_month: v })}
          hint="فارغ = غير محدود"
        />
        <NullableNumberField
          label="إدخال سيارات في المزاد (شهريًا)"
          value={draft.car_auction_entries_per_month}
          onChange={(v) => setDraft({ ...draft, car_auction_entries_per_month: v })}
          hint="فارغ = غير محدود"
        />
        <NumberField
          label="الإعلانات المبوبة المجانية (شهريًا)"
          value={draft.free_classifieds_per_month}
          min={0}
          onChange={(v) => setDraft({ ...draft, free_classifieds_per_month: v })}
        />
        <NumberField
          label="سعر الإعلان الإضافي (ر.س)"
          value={draft.overage_classified_price}
          min={0}
          step={0.01}
          onChange={(v) => setDraft({ ...draft, overage_classified_price: v })}
        />
        <SelectField
          label="مستوى المتجر"
          value={draft.store_level}
          options={[
            { v: "none", l: "بدون" },
            { v: "basic", l: "أساسي" },
            { v: "full", l: "كامل" },
          ]}
          onChange={(v) =>
            setDraft({
              ...draft,
              store_level: v as PlanCapacity["store_level"],
              has_store: v !== "none",
            })
          }
        />
        <SelectField
          label="أولوية الدعم"
          value={draft.support_tier}
          options={[
            { v: "standard", l: "قياسية" },
            { v: "high", l: "مرتفعة" },
            { v: "dedicated", l: "مخصّصة" },
          ]}
          onChange={(v) =>
            setDraft({ ...draft, support_tier: v as PlanCapacity["support_tier"] })
          }
        />
        <NumberField
          label="عدد المستخدمين"
          value={draft.max_users}
          min={1}
          onChange={(v) => setDraft({ ...draft, max_users: v })}
        />
        <BooleanField
          label="رفع بالجملة (CSV)"
          value={draft.has_bulk_upload}
          onChange={(v) => setDraft({ ...draft, has_bulk_upload: v })}
        />
        <BooleanField
          label="API للتكامل"
          value={draft.has_api_access}
          onChange={(v) => setDraft({ ...draft, has_api_access: v })}
        />
      </div>

      <div className="flex justify-start">
        <button
          onClick={handleSave}
          disabled={!dirty || saving}
          className="px-4 py-1.5 text-sm font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          {saving ? "جارٍ الحفظ…" : "حفظ السعات"}
        </button>
      </div>
    </div>
  );
}

// Small leaf inputs — kept inline to avoid premature abstraction.

function NumberField({
  label,
  value,
  onChange,
  min,
  step,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  step?: number;
}) {
  return (
    <label className="block">
      <span className="text-xs text-gray-600 block mb-1">{label}</span>
      <input
        type="number"
        value={value}
        min={min}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full text-sm px-2.5 py-1.5 rounded-md border border-gray-300 bg-white tabular-nums"
      />
    </label>
  );
}

function NullableNumberField({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs text-gray-600 block mb-1">{label}</span>
      <input
        type="number"
        value={value === null ? "" : value}
        min={0}
        onChange={(e) => {
          const raw = e.target.value;
          onChange(raw === "" ? null : Number(raw));
        }}
        className="w-full text-sm px-2.5 py-1.5 rounded-md border border-gray-300 bg-white tabular-nums"
      />
      {hint && <span className="text-[10px] text-gray-400 mt-0.5 block">{hint}</span>}
    </label>
  );
}

function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { v: T; l: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs text-gray-600 block mb-1">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="w-full text-sm px-2.5 py-1.5 rounded-md border border-gray-300 bg-white"
      >
        {options.map((o) => (
          <option key={o.v} value={o.v}>
            {o.l}
          </option>
        ))}
      </select>
    </label>
  );
}

function BooleanField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="inline-flex items-center gap-2 cursor-pointer select-none">
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-gray-300 text-indigo-600"
      />
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  );
}
