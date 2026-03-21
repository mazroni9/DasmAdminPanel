"use client";

import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import supabase from "../utils/supabaseClient";

/**
 * دخول Supabase القديم — غير رسمي.
 * بدون ?legacy=1 يتم التوجيه إلى /auth/login.
 * مع ?legacy=1 تبقى النموذج للطوارئ/التشغيل اليدوي.
 */
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const legacy = router.query.legacy === "1";

  useEffect(() => {
    if (!router.isReady) return;
    if (!legacy) {
      router.replace("/auth/login");
    }
  }, [router, legacy]);

  if (!router.isReady || !legacy) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100 text-gray-500 text-sm px-6 text-center">
        جاري التوجيه إلى بوابة الدخول الرسمية (/auth/login)...
      </div>
    );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      setErrorMsg("فشل الدخول. تحقق من البيانات.");
      return;
    }

    const { data: adminData, error: adminError } = await supabase
      .from("admins")
      .select("*")
      .eq("email", email)
      .single();

    if (adminError || !adminData) {
      setErrorMsg("ليست لديك صلاحية الدخول كمشرف.");
      return;
    }

    router.push("/dashboard");
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <form
        onSubmit={handleLogin}
        className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm text-center"
      >
        <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-md p-2 mb-4">
          وضع legacy (?legacy=1) — للطوارئ فقط. استخدم{" "}
          <a href="/auth/login" className="underline font-medium">
            /auth/login
          </a>{" "}
          كمسار رسمي.
        </p>
        <h2 className="text-2xl font-bold mb-6">دخول المشرفين (Supabase)</h2>

        {errorMsg && <p className="text-red-500 mb-4">{errorMsg}</p>}

        <input
          type="email"
          placeholder="الإيميل"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-4 p-2 border rounded"
          required
        />

        <input
          type="password"
          placeholder="كلمة المرور"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-6 p-2 border rounded"
          required
        />

        <button
          type="submit"
          className="bg-blue-600 text-white w-full py-2 rounded hover:bg-blue-700 transition"
        >
          دخول
        </button>
      </form>
    </div>
  );
}
