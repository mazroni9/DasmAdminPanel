import type { NextApiRequest, NextApiResponse } from "next";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "2mb",
    },
  },
};

function baseUrl(): string | null {
  const b =
    process.env.DASM_PLATFORM_API_URL || process.env.NEXT_PUBLIC_PLATFORM_API_URL;
  return b?.replace(/\/$/, "") || null;
}

/**
 * السماح فقط بمسارات الموافقات عبر الـ proxy (تقليل سطح الهجوم).
 * approval-group: قراءة فقط (GET) — الإدارة تبقى في DASM.
 */
function isPathAllowed(subPath: string, method: string): boolean {
  if (subPath.startsWith("admin/approval-requests")) {
    return true;
  }
  if (subPath.startsWith("admin/approval-group")) {
    return method === "GET";
  }
  return false;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const segments = req.query.path;
  if (!segments || !Array.isArray(segments)) {
    return res.status(400).json({ message: "مسار غير صالح" });
  }

  const auth = req.headers.authorization;
  if (!auth || typeof auth !== "string" || !auth.startsWith("Bearer ")) {
    return res.status(401).json({ message: "يجب تسجيل الدخول" });
  }

  const base = baseUrl();
  if (!base) {
    return res.status(500).json({ message: "تكوين خادم المنصة غير مكتمل" });
  }

  const subPath = segments.join("/");
  if (!isPathAllowed(subPath, req.method || "GET")) {
    return res.status(403).json({ message: "المسار غير مسموح عبر الوكيل" });
  }

  const urlObj = new URL(req.url || "", "http://localhost");
  const search = urlObj.search || "";
  const targetUrl = `${base}/api/${subPath}${search}`;

  const headers: Record<string, string> = {
    Authorization: auth,
    Accept: "application/json",
  };

  /** يُمرَّر مع approve/reject لتمييز مصدر القرار في DASM (audit) */
  const isApprovalDecisionPost =
    req.method === "POST" &&
    (subPath.endsWith("/approve") || subPath.endsWith("/reject"));
  if (isApprovalDecisionPost) {
    headers["X-Decision-Source"] = "bff_admin_panel";
  }

  const ct = req.headers["content-type"];
  if (
    ct &&
    req.method !== "GET" &&
    req.method !== "HEAD"
  ) {
    headers["Content-Type"] = Array.isArray(ct) ? ct[0] : ct;
  }

  const init: RequestInit = {
    method: req.method,
    headers,
  };

  if (req.method !== "GET" && req.method !== "HEAD") {
    if (req.body === undefined || req.body === null) {
      init.body = "{}";
    } else if (typeof req.body === "string") {
      init.body = req.body;
    } else {
      init.body = JSON.stringify(req.body);
    }
  }

  try {
    const upstream = await fetch(targetUrl, init);
    const text = await upstream.text();
    const upstreamCt = upstream.headers.get("content-type") || "";

    res.status(upstream.status);

    if (upstreamCt.includes("application/json")) {
      try {
        return res.json(JSON.parse(text));
      } catch {
        return res.send(text);
      }
    }
    return res.send(text);
  } catch (e) {
    console.error("[dasm-proxy]", e);
    return res.status(502).json({ message: "تعذر الاتصال بخدمة المنصة" });
  }
}
