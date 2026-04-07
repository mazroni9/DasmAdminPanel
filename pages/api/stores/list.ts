import type { NextApiRequest, NextApiResponse } from "next";

/**
 * GET /api/stores/list — قائمة المتاجر مع فلترة
 * يمر عبر DASM API بدل Supabase المباشر (SAMA compliance).
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();

  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ message: "يجب تسجيل الدخول" });

  const base = process.env.DASM_PLATFORM_API_URL || process.env.NEXT_PUBLIC_PLATFORM_API_URL;
  if (!base) return res.status(500).json({ message: "تكوين خادم المنصة غير مكتمل" });

  const { status, search } = req.query;
  const params = new URLSearchParams();
  if (status && status !== "all") params.set("status", status as string);
  if (search) params.set("search", search as string);

  try {
    const url = `${base.replace(/\/$/, "")}/api/admin/stores?${params.toString()}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "Authorization": auth,
      },
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
