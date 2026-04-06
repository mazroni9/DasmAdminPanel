import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { CrButton } from "@/components/ui/cr-button";
import { CrInput } from "@/components/ui/cr-input";

export default function ControlRoomLoginPage() {
  const router = useRouter();
  const { login, hydrated, isLoggedIn, isControlRoomStaff, user, initializeFromStorage } =
    useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const returnUrl =
    typeof router.query.returnUrl === "string"
      ? router.query.returnUrl
      : "/admin/control-room";

  useEffect(() => {
    if (!hydrated) return;
    void initializeFromStorage();
  }, [hydrated, initializeFromStorage]);

  useEffect(() => {
    if (!hydrated || !isLoggedIn || !user) return;
    if (isControlRoomStaff) {
      router.replace(returnUrl);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { default: dasmBff } = await import("@/lib/dasmBffClient");
        const res = await dasmBff.get("admin/approval-requests/capabilities");
        const data = res.data?.data ?? res.data;
        const ok = data?.can_access_queue === true;
        if (!cancelled && ok) router.replace(returnUrl);
      } catch {
        /* stay on login */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hydrated, isLoggedIn, user, isControlRoomStaff, returnUrl, router]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setLocalError(null);
    const r = await login(email, password);
    setBusy(false);
    if (!r.success) {
      setLocalError(r.error || "فشل تسجيل الدخول");
      return;
    }
    router.replace(returnUrl);
  };

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500 text-sm">
        جاري التحميل...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-100 rtl">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm space-y-6">
        <div className="text-center space-y-1">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <span className="text-white text-xl font-bold">D</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">الكنترول روم</h1>
          <p className="text-sm text-gray-500">داسم — لوحة المراقبة والعمليات</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-gray-500 block mb-1">البريد الإلكتروني</label>
            <CrInput
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="example@dasm.com.sa"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">كلمة المرور</label>
            <CrInput
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {localError ? (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{localError}</p>
          ) : null}
          <CrButton type="submit" className="w-full" disabled={busy}>
            {busy ? "جاري الدخول..." : "دخول"}
          </CrButton>
        </form>

        <p className="text-xs text-gray-300 text-center">
          للدعم التقني:{" "}
          <Link href="mailto:dev@dasm.com.sa" className="text-blue-400 hover:underline">
            dev@dasm.com.sa
          </Link>
        </p>
      </div>
    </div>
  );
}
