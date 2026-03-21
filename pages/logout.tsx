import { useEffect } from "react";
import { useRouter } from "next/router";
import supabase from "../utils/supabaseClient";
import { usePlatformAuthStore } from "@/store/platformAuthStore";

/**
 * ينهي جلسة Supabase (legacy) وجلسة المنصة، ثم يوجّه إلى /auth/login.
 */
export default function Logout() {
  const router = useRouter();

  useEffect(() => {
    async function signOut() {
      await supabase.auth.signOut().catch(() => undefined);
      await usePlatformAuthStore
        .getState()
        .logout({ skipRequest: false, redirectToLogin: false });
      router.replace("/auth/login");
    }
    void signOut();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center text-gray-500 text-sm bg-gray-50">
      جاري تسجيل الخروج...
    </div>
  );
}
