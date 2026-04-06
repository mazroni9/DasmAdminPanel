import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_SERVICES_URL!,
  process.env.SUPABASE_SERVICES_SERVICE_KEY!
);

// POST /api/stores/action — { storeId, action: "suspend" | "activate" | "approve" }
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const { storeId, action } = req.body as { storeId: number; action: string };
  if (!storeId || !action) return res.status(400).json({ message: "storeId و action مطلوبان" });

  const statusMap: Record<string, string> = {
    suspend: "suspended",
    activate: "active",
    approve: "active",
  };

  const newStatus = statusMap[action];
  if (!newStatus) return res.status(400).json({ message: "action غير صالح" });

  const { error } = await supabase
    .from("stores")
    .update({ status: newStatus })
    .eq("id", storeId);

  if (error) return res.status(500).json({ success: false, message: error.message });

  return res.status(200).json({ success: true, status: newStatus });
}
