import axios, {
  type AxiosError,
  type InternalAxiosRequestConfig,
} from "axios";

const baseURL = process.env.NEXT_PUBLIC_PLATFORM_API_URL || "";

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
  if (h instanceof Headers) {
    h.forEach((value, key) => {
      out[key] = value;
    });
    return out;
  }
  if (Array.isArray(h)) {
    for (const [k, v] of h) {
      if (v != null) out[k] = String(v);
    }
  }
  return out;
}

function isAuthEndpoint(url: string) {
  return (
    url.includes("/api/login") ||
    url.includes("/api/refresh") ||
    url.includes("/api/logout")
  );
}

const platformApi = axios.create({
  baseURL: baseURL || undefined,
  withCredentials: true,
  headers: { Accept: "application/json" },
});

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

platformApi.interceptors.request.use((config) => {
  const headers = toHeaderRecord(config.headers);
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const existingAuth = headers.Authorization;
  if (existingAuth === undefined && token) {
    headers.Authorization = `Bearer ${token}`;
  }
  config.headers = headers as InternalAxiosRequestConfig["headers"];
  return config;
});

platformApi.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = (error.config ?? {}) as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (originalRequest._retry) {
      return Promise.reject(error);
    }

    const url = originalRequest.url || "";
    if (url && isAuthEndpoint(url)) {
      return Promise.reject(error);
    }

    if (error.response?.status !== 401) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const reqHeaders = toHeaderRecord(originalRequest.headers);
    const reqAuth = reqHeaders.Authorization ?? "";
    const hadBearer =
      typeof reqAuth === "string" && reqAuth.startsWith("Bearer ");

    if (!token || !hadBearer) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        if (!refreshPromise) return reject(error);
        refreshPromise
          .then((ok) => {
            if (!ok) return reject(error);
            const next = localStorage.getItem("token");
            const h = toHeaderRecord(originalRequest.headers);
            if (next) h.Authorization = `Bearer ${next}`;
            originalRequest.headers = h as InternalAxiosRequestConfig["headers"];
            resolve(platformApi(originalRequest));
          })
          .catch(reject);
      });
    }

    isRefreshing = true;
    refreshPromise = (async () => {
      try {
        const res = await platformApi.post(
          `/api/refresh`,
          {},
          {
            withCredentials: true,
            headers: { Authorization: "" },
          }
        );
        const access_token = res.data?.access_token;
        if (!access_token) return false;
        if (typeof window !== "undefined") {
          localStorage.setItem("token", access_token);
        }
        const { usePlatformAuthStore } = await import(
          "@/store/platformAuthStore"
        );
        usePlatformAuthStore.getState().applyRefreshedToken(access_token);
        return true;
      } catch {
        return false;
      } finally {
        isRefreshing = false;
        refreshPromise = null;
      }
    })();

    const success = await refreshPromise;
    if (success) {
      const next = localStorage.getItem("token");
      const h = toHeaderRecord(originalRequest.headers);
      if (next) h.Authorization = `Bearer ${next}`;
      originalRequest.headers = h as InternalAxiosRequestConfig["headers"];
      return platformApi(originalRequest);
    }

    const { usePlatformAuthStore } = await import(
      "@/store/platformAuthStore"
    );
    await usePlatformAuthStore
      .getState()
      .logout({ skipRequest: true, redirectToLogin: true });

    return Promise.reject(error);
  }
);

export default platformApi;
