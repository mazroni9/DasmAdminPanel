import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/hooks/useAuth";
import dasmBff from "@/lib/dasmBffClient";

type ReviewerGateState =
  | "loading_caps"
  | "allowed"
  | "forbidden"
  | "error"
  | "redirect_login";

export default function ControlRoomGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { hydrated, token, isAdmin, isModerator, isProgrammer } = useAuth();
  const isStaff = isAdmin || isModerator || isProgrammer;

  const [reviewerState, setReviewerState] =
    useState<ReviewerGateState>("loading_caps");
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!hydrated) return;

    if (isStaff) {
      setReviewerState("allowed");
      return;
    }

    if (!token) {
      setReviewerState("redirect_login");
      router.replace(
        "/auth/login?returnUrl=" + encodeURIComponent("/admin/control-room")
      );
      return;
    }

    let cancelled = false;
    setReviewerState("loading_caps");

    (async () => {
      try {
        const res = await dasmBff.get("admin/approval-requests/capabilities");
        const data = res.data?.data ?? res.data;
        const ok = data?.can_access_queue === true;
        if (cancelled) return;
        setReviewerState(ok ? "allowed" : "forbidden");
      } catch (e: unknown) {
        if (cancelled) return;
        const status = (e as { response?: { status?: number } })?.response
          ?.status;
        if (status === 401) {
          setReviewerState("redirect_login");
          router.replace(
            "/auth/login?returnUrl=" +
              encodeURIComponent("/admin/control-room")
          );
          return;
        }
        setReviewerState("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [hydrated, isStaff, token, router, retryKey]);

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500 text-sm rtl p-6">
        جاري تهيئة الجلسة...
      </div>
    );
  }

  if (isStaff) {
    return <>{children}</>;
  }

  if (reviewerState === "redirect_login") {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500 text-sm rtl p-6">
        جاري التوجيه لتسجيل الدخول...
      </div>
    );
  }

  if (reviewerState === "loading_caps") {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500 text-sm rtl p-6">
        جاري التحقق من صلاحيات الموافقات من DASM...
      </div>
    );
  }

  if (reviewerState === "error") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 rtl p-6 text-center max-w-md mx-auto">
        <p className="text-red-800 font-medium">
          تعذر التحقق من الصلاحيات. تحقق من الاتصال أو حاول لاحقاً.
        </p>
        <button
          type="button"
          className="px-4 py-2 rounded-xl border border-gray-300 text-sm hover:bg-gray-50"
          onClick={() => setRetryKey((k) => k + 1)}
        >
          إعادة المحاولة
        </button>
      </div>
    );
  }

  if (reviewerState === "forbidden") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 rtl p-6 text-center max-w-lg mx-auto">
        <p className="text-lg font-semibold text-amber-900">غير مصرّح</p>
        <p className="text-amber-800 text-sm leading-relaxed">
          لا تملك صلاحية الدخول إلى غرفة المعالجة. يجب أن يمنحك DASM صلاحية
          الطابور (
          <code className="text-xs bg-amber-100 px-1 rounded">
            can_access_queue
          </code>
          )، مثلاً عبر عضوية مجموعة الموافقات.
        </p>
        <button
          type="button"
          className="mt-2 text-sm text-indigo-600 underline"
          onClick={() =>
            router.replace(
              "/auth/login?returnUrl=" +
                encodeURIComponent("/admin/control-room")
            )
          }
        >
          العودة لتسجيل الدخول بحساب آخر
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
