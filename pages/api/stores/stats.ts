import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_SERVICES_URL!,
  process.env.SUPABASE_SERVICES_SERVICE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();

  try {
    const today = new Date().toISOString().split("T")[0];

    const [totalRes, activeRes, pendingRes, suspendedRes, ordersRes] =
      await Promise.all([
        supabase.from("stores").select("id", { count: "exact", head: true }),
        supabase.from("stores").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("stores").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("stores").select("id", { count: "exact", head: true }).eq("status", "suspended"),
        supabase.from("store_orders").select("id, total_amount", { count: "exact" }).gte("created_at", today),
      ]);

    const ordersToday = ordersRes.data ?? [];
    const revenueToday = ordersToday.reduce(
      (sum: number, o: any) => sum + Number(o.total_amount ?? 0),
      0
    );

    return res.status(200).json({
      success: true,
      data: {
        total_stores: totalRes.count ?? 0,
        active_stores: activeRes.count ?? 0,
        pending_stores: pendingRes.count ?? 0,
        suspended_stores: suspendedRes.count ?? 0,
        orders_today: ordersRes.count ?? 0,
        revenue_today: revenueToday,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
