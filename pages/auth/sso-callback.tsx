import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { usePlatformAuthStore } from "@/store/platformAuthStore";
import platformApi from "@/lib/platformApi";

type State = "verifying" | "success" | "error" | "invalid";

export default function SsoCallbackPage() {
  const router = useRouter();
  const { applyRefreshedToken } = usePlatformAuthStore();
  const [state, setState] = useState<State>("verifying");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!router.isReady) return;

    const token = (router.query.sso_token ?? router.query.token) as string | undefined;
    const returnUrl =
      typeof router.query.returnUrl === "string"
        ? router.query.returnUrl
        : "/admin/control-room";

    if (!token) {
      setState("invalid");
      return;
    }

    (async () => {
      try {
        // نتحقق من التوكن مع DASM backend
        const res = await platformApi.post("/api/sso/verify", {
          sso_token: token,
          platform: "control-room",
        });

        const data = res.data?.data ?? res.data;
        const accessToken = data?.access_token ?? data?.token;

        if (!accessToken) {
          setState("error");
          setErrorMsg("لم يُرجع الخادم توكن دخول صالح.");
          return;
        }

        // حفظ التوكن وتوجيه للوحة
        applyRefreshedToken(accessToken);
        setState("success");

        // جلب البروفايل ثم التوجيه
        try {
          await usePlatformAuthStore.getState().fetchProfile({ force: true, silent: true });
        } catch {
          // لا نوقف التدفق لو فشل جلب البروفايل
        }

        router.replace(returnUrl);
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 401) {
          setState("error");
          setErrorMsg("انتهت صلاحية رابط الدخول. حاول مجدداً.");
        } else {
          setState("error");
          setErrorMsg("تعذر التحقق من رابط الدخول. تحقق من الاتصال.");
        }
      }
    })();
  }, [router.isReady, router.query, applyRefreshedToken, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 rtl p-6">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 max-w-sm w-full text-center space-y-4">
        {state === "verifying" && (
          <>
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-gray-700 font-medium">جاري التحقق من هويتك...</p>
            <p className="text-sm text-gray-400">يُرجى الانتظار لحظة</p>
          </>
        )}
        {state === "success" && (
          <>
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto text-xl">✓</div>
            <p className="text-green-800 font-semibold">تم التحقق بنجاح</p>
            <p className="text-sm text-gray-400">جاري التوجيه...</p>
          </>
        )}
        {state === "error" && (
          <>
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mx-auto text-xl">✗</div>
            <p className="text-red-800 font-semibold">فشل التحقق</p>
            <p className="text-sm text-red-600">{errorMsg}</p>
            <button
              type="button"
              onClick={() => router.push("/auth/login")}
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm hover:bg-blue-700 transition"
            >
              العودة لتسجيل الدخول
            </button>
          </>
        )}
        {state === "invalid" && (
          <>
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center mx-auto text-xl">⚠</div>
            <p className="text-amber-800 font-semibold">رابط غير صالح</p>
            <p className="text-sm text-amber-600">لا يوجد توكن في الرابط.</p>
            <button
              type="button"
              onClick={() => router.push("/auth/login")}
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm hover:bg-blue-700 transition"
            >
              تسجيل الدخول
            </button>
          </>
        )}
      </div>
    </div>
  );
}
