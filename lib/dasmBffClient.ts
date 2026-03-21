import axios, { type InternalAxiosRequestConfig } from "axios";

/**
 * عميل يستدعي DASM عبر مسار Next.js فقط (/api/dasm-proxy/...).
 * لا يضع عنوان DASM في المتصفح — التوجيه من الخادم.
 */
const PROXY_PREFIX = "/api/dasm-proxy";

function toHeaderRecord(
  h: InternalAxiosRequestConfig["headers"]
): Record<string, string> {
  const out: Record<string, string> = {};
  if (!h) return out;
  if (typeof h === "object" && !Array.isArray(h) && !(h instanceof Headers)) {
    for (const [k, v] of Object.entries(h)) {
      if (v === undefined) continue;
      if (Array.isArray(v)) out[k] = v.join(", ");
      else out[k] = String(v);
    }
    return out;
  }
  return out;
}

const dasmBff = axios.create({
  headers: { Accept: "application/json" },
});

dasmBff.interceptors.request.use((config) => {
  const raw = config.url || "";
  const path = raw.startsWith("/") ? raw.slice(1) : raw;
  config.url = `${PROXY_PREFIX}/${path}`;
  config.baseURL = "";

  const headers = toHeaderRecord(config.headers);
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (token && headers.Authorization === undefined) {
    headers.Authorization = `Bearer ${token}`;
  }
  config.headers = headers as InternalAxiosRequestConfig["headers"];
  return config;
});

export default dasmBff;
