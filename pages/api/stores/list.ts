import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_SERVICES_URL!,
  process.env.SUPABASE_SERVICES_SERVICE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();

  const { status, search } = req.query;

  try {
    let query = supabase
      .from("stores")
      .select(`
        id, name, name_ar, slug, category, status, is_verified,
        owner_id, owner_type, created_at,
        store_products(count),
        store_orders(count)
      `)
      .order("created_at", { ascending: false });

    if (status && status !== "all") {
      query = query.eq("status", status as string);
    }

    if (search) {
      query = query.ilike("name", `%${search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;

    // نعدّ المنتجات والطلبات لكل متجر
    const stores = (data ?? []).map((s: any) => ({
      id: s.id,
      name: s.name,
      name_ar: s.name_ar,
      slug: s.slug,
      category: s.category,
      status: s.status,
      is_verified: s.is_verified,
      owner_id: s.owner_id,
      owner_type: s.owner_type,
      created_at: s.created_at,
      products_count: s.store_products?.[0]?.count ?? 0,
      orders_count: s.store_orders?.[0]?.count ?? 0,
    }));

    return res.status(200).json({ success: true, data: stores });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
