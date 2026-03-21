import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import platformApi from "@/lib/platformApi";

interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  type: string;
  phone?: string;
  name?: string;
  permissions?: string[];
  [key: string]: unknown;
}

interface PlatformAuthState {
  user: User | null;
  token: string | null;
  isLoggedIn: boolean;
  loading: boolean;
  error: string | null;
  initialized: boolean;
  lastProfileFetch: number;
  hydrated: boolean;
  setHydrated: (v: boolean) => void;
  applyRefreshedToken: (access_token: string) => void;
  initializeFromStorage: () => Promise<boolean>;
  fetchProfile: (opts?: { force?: boolean; silent?: boolean }) => Promise<boolean>;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: (opts?: {
    skipRequest?: boolean;
    redirectToLogin?: boolean;
  }) => Promise<void>;
}

const PROFILE_CACHE_DURATION = 5 * 60 * 1000;
const isBrowser = () => typeof window !== "undefined";

const extractUser = (respOrObj: unknown): User | null => {
  const root = (respOrObj as { data?: unknown })?.data ?? respOrObj;
  if (!root || typeof root !== "object") return null;
  const r = root as Record<string, unknown>;
  if (r.user && typeof r.user === "object") return r.user as User;
  if (r.data && typeof r.data === "object") return r.data as User;
  if (r.success && r.data && typeof r.data === "object") return r.data as User;
  if (typeof r.id === "number" && typeof r.email === "string") return r as User;
  return null;
};

export const usePlatformAuthStore = create<PlatformAuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoggedIn: false,
      loading: false,
      error: null,
      initialized: false,
      lastProfileFetch: 0,
      hydrated: false,
      setHydrated: (v) => set({ hydrated: v }),

      applyRefreshedToken: (access_token) => {
        if (isBrowser()) localStorage.setItem("token", access_token);
        platformApi.defaults.headers.common.Authorization = `Bearer ${access_token}`;
        set({ token: access_token, isLoggedIn: true });
      },

      initializeFromStorage: async () => {
        if (get().initialized) return true;
        set({ loading: true });

        const token =
          get().token || (isBrowser() ? localStorage.getItem("token") : null);

        if (!token) {
          if (isBrowser()) localStorage.removeItem("token");
          delete platformApi.defaults.headers.common.Authorization;
          set({
            user: null,
            token: null,
            isLoggedIn: false,
            loading: false,
            initialized: true,
          });
          return false;
        }

        platformApi.defaults.headers.common.Authorization = `Bearer ${token}`;
        set({ token, isLoggedIn: true });

        try {
          await get().fetchProfile({ force: true, silent: true });
          return true;
        } finally {
          set({ loading: false, initialized: true });
        }
      },

      fetchProfile: async (opts) => {
        const force = opts?.force ?? false;
        const silent = opts?.silent ?? false;
        const token =
          get().token || (isBrowser() ? localStorage.getItem("token") : null);
        if (!token) return false;

        try {
          const state = get();
          const now = Date.now();
          const cacheValid =
            !force &&
            state.user &&
            state.lastProfileFetch &&
            now - state.lastProfileFetch < PROFILE_CACHE_DURATION;
          if (cacheValid) return true;
          if (!silent) set({ loading: true });

          const resp = await platformApi.get("/api/user/profile");
          const userData = extractUser(resp);
          if (!userData) {
            set({ loading: false, error: "لم يتم العثور على بيانات المستخدم" });
            return false;
          }

          set((s) => ({
            user: { ...(s.user ?? {}), ...userData } as User,
            isLoggedIn: true,
            lastProfileFetch: now,
            loading: false,
            error: null,
          }));
          return true;
        } catch (error: unknown) {
          const status = (error as { response?: { status?: number } })?.response
            ?.status;
          if (status === 401) {
            if (isBrowser()) localStorage.removeItem("token");
            delete platformApi.defaults.headers.common.Authorization;
            set({
              user: null,
              token: null,
              isLoggedIn: false,
              lastProfileFetch: 0,
              loading: false,
              error: "غير مصرح",
            });
            return false;
          }
          set({
            loading: false,
            error: "فشل في جلب البيانات",
          });
          return false;
        }
      },

      login: async (email, password) => {
        set({ loading: true, error: null });
        try {
          const response = await platformApi.post(`/api/login`, {
            email,
            password,
          });
          const data = response.data as {
            status?: string;
            message?: string;
            access_token?: string;
          };

          if (data.status === "error" && data.message === "Email not verified") {
            set({ loading: false });
            return { success: false, error: "البريد غير مُفعّل" };
          }

          const token = data.access_token;
          if (isBrowser() && token) localStorage.setItem("token", token);
          if (token) {
            platformApi.defaults.headers.common.Authorization = `Bearer ${token}`;
          }

          const loginUser = extractUser(data);
          if (loginUser) {
            set((s) => ({
              user: { ...(s.user ?? {}), ...loginUser } as User,
              token: token ?? null,
              isLoggedIn: true,
              lastProfileFetch: 0,
            }));
          } else {
            set({
              token: token ?? null,
              isLoggedIn: true,
              lastProfileFetch: 0,
            });
          }

          await get().fetchProfile({ force: true, silent: true });
          set({ loading: false });
          return { success: true };
        } catch (err: unknown) {
          const e = err as {
            response?: { data?: { message?: string; error?: string } };
          };
          const msg =
            e.response?.data?.message ||
            e.response?.data?.error ||
            "فشل تسجيل الدخول";
          set({ loading: false, error: msg });
          return { success: false, error: msg };
        }
      },

      logout: async (opts) => {
        const skipRequest = opts?.skipRequest ?? false;
        const redirectToLogin = opts?.redirectToLogin ?? true;
        try {
          if (!skipRequest) {
            await platformApi.post(`/api/logout`).catch(() => undefined);
          }
        } finally {
          if (isBrowser()) {
            localStorage.removeItem("token");
            localStorage.removeItem("dasm-platform-auth");
          }
          delete platformApi.defaults.headers.common.Authorization;
          set({
            user: null,
            token: null,
            isLoggedIn: false,
            loading: false,
            error: null,
            lastProfileFetch: 0,
            initialized: true,
          });
          if (redirectToLogin && isBrowser()) {
            window.location.replace("/auth/login");
          }
        }
      },
    }),
    {
      name: "dasm-platform-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isLoggedIn: state.isLoggedIn,
        lastProfileFetch: state.lastProfileFetch,
      }),
    }
  )
);
