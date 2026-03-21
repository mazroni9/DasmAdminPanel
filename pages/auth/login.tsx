import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { CrButton } from "@/components/ui/cr-button";
import { CrInput } from "@/components/ui/cr-input";

export default function ControlRoomLoginPage() {
  const router = useRouter();
  const { login, hydrated, isLoggedIn, user, initializeFromStorage } =
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

  const staffish =
    user?.type === "admin" ||
    user?.type === "super_admin" ||
    user?.type === "moderator" ||
    user?.type === "programmer";

  useEffect(() => {
    if (!hydrated || !isLoggedIn || !user) return;
    if (staffish) {
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
  }, [hydrated, isLoggedIn, user, staffish, returnUrl, router]);

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
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
        <h1 className="text-xl font-bold text-gray-900">تسجيل الدخول — غرفة المعالجة</h1>
        <p className="text-sm text-gray-500">
          تستخدم نفس بيانات المنصة. الطلبات تُرسل إلى واجهة الـ API الحالية دون تغيير العقود.
        </p>
        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="text-xs text-gray-500 block mb-1">البريد</label>
            <CrInput
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
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
            <p className="text-sm text-red-600">{localError}</p>
          ) : null}
          <CrButton type="submit" className="w-full" disabled={busy}>
            {busy ? "جاري الدخول..." : "دخول"}
          </CrButton>
        </form>
        <p className="text-xs text-gray-400 text-center">
          <Link href="/admin/control-room" className="text-blue-600 hover:underline">
            العودة لغرفة المعالجة
          </Link>
        </p>
      </div>
    </div>
  );
}
