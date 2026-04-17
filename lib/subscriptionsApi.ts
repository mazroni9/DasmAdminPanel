/**
 * Typed API wrappers for the DASM-e subscription admin surface.
 *
 * Backend contract: DASM-Platform PR #2 (merged 2026-04-17).
 * Endpoints gated on Spatie abilities `subscription_plans.view` /
 * `subscription_plans.manage` — callers of mutating methods must hold
 * the manage ability.
 *
 * Uses the shared `apiFetch(url, options)` helper from utils/api.ts.
 * Errors propagate as axios errors. Pages show `response.data.message`
 * via the utility extractErrorMessage(err).
 */

import { apiFetch } from "../utils/api";

// ────────────────────────── Types ──────────────────────────

export type PlanCategory = "member" | "dealer";
export type StoreLevel = "none" | "basic" | "full";
export type SupportTier = "standard" | "high" | "dedicated";

export interface PlanCapacity {
  bids_per_month: number | null;
  car_auction_entries_per_month: number | null;
  free_classifieds_per_month: number;
  overage_classified_price: number;
  has_store: boolean;
  store_level: StoreLevel;
  has_bulk_upload: boolean;
  has_api_access: boolean;
  max_users: number;
  support_tier: SupportTier;
}

export interface PlanPriceRow {
  id: number;
  billing_cycle_id: number;
  cycle_key: string;
  cycle_name_ar: string;
  price: number;
  is_active?: boolean;
}

export interface SubscriptionPlan {
  id: number;
  key: string;
  category: PlanCategory;
  tier_name_ar: string;
  tier_name_en: string;
  sort_order: number;
  is_active: boolean;
  capacity: PlanCapacity | null;
  prices: PlanPriceRow[];
}

export interface UserMini {
  id: number;
  name?: string;
  email?: string;
}

export interface FounderDiscountGrant {
  id: number;
  user_id: number;
  discount_percent: string; // decimal cast — server returns as string
  duration_months: number;
  starts_at: string;
  expires_at: string;
  granted_by_user_id: number;
  reason: string | null;
  revoked_at: string | null;
  revoked_by_user_id: number | null;
  created_at: string;
  updated_at: string;
  user?: UserMini;
  granted_by?: UserMini;
  revoked_by?: UserMini;
}

// Envelope used by every controller in this repo.
interface Envelope<T> {
  status: "success" | "error";
  message?: string;
  data?: T;
  meta?: unknown;
}

// ────────────────────────── Plans ──────────────────────────

export async function listPlans(params?: {
  category?: PlanCategory;
  is_active?: boolean;
}): Promise<SubscriptionPlan[]> {
  const res = await apiFetch<Envelope<SubscriptionPlan[]>>(
    "/admin/subscription-plans",
    { params },
  );
  return res.data ?? [];
}

export async function updatePlan(
  id: number,
  body: Partial<Pick<SubscriptionPlan, "tier_name_ar" | "tier_name_en" | "sort_order" | "is_active">>,
): Promise<SubscriptionPlan> {
  const res = await apiFetch<Envelope<SubscriptionPlan>>(
    `/admin/subscription-plans/${id}`,
    { method: "PUT", body },
  );
  if (!res.data) throw new Error("empty response");
  return res.data;
}

export async function upsertPrice(
  planId: number,
  body: { billing_cycle_id: number; price: number; is_active?: boolean },
): Promise<PlanPriceRow> {
  const res = await apiFetch<Envelope<PlanPriceRow>>(
    `/admin/subscription-plans/${planId}/prices`,
    { method: "POST", body },
  );
  if (!res.data) throw new Error("empty response");
  return res.data;
}

export async function upsertCapacity(
  planId: number,
  body: Partial<PlanCapacity>,
): Promise<PlanCapacity> {
  const res = await apiFetch<Envelope<PlanCapacity>>(
    `/admin/subscription-plans/${planId}/capacity`,
    { method: "PUT", body },
  );
  if (!res.data) throw new Error("empty response");
  return res.data;
}

// ────────────────────── Founder Discounts ──────────────────────

export interface ListGrantsResponse {
  data: FounderDiscountGrant[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export async function listGrants(params?: {
  user_id?: number;
  active?: boolean;
  per_page?: number;
  page?: number;
}): Promise<ListGrantsResponse> {
  const mapped: Record<string, string | number> = {};
  if (params?.user_id) mapped.user_id = params.user_id;
  if (params?.active) mapped.active = 1;
  if (params?.per_page) mapped.per_page = params.per_page;
  if (params?.page) mapped.page = params.page;

  const res = await apiFetch<ListGrantsResponse>("/admin/founder-discounts", {
    params: mapped,
  });
  return { data: res.data ?? [], meta: res.meta as ListGrantsResponse["meta"] };
}

export async function issueGrant(body: {
  user_id: number;
  discount_percent: number;
  duration_months: number;
  reason?: string;
}): Promise<FounderDiscountGrant> {
  const res = await apiFetch<Envelope<FounderDiscountGrant>>(
    "/admin/founder-discounts",
    { method: "POST", body },
  );
  if (!res.data) throw new Error("empty response");
  return res.data;
}

export async function revokeGrant(id: number): Promise<FounderDiscountGrant> {
  const res = await apiFetch<Envelope<FounderDiscountGrant>>(
    `/admin/founder-discounts/${id}`,
    { method: "DELETE" },
  );
  if (!res.data) throw new Error("empty response");
  return res.data;
}
