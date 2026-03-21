import { useEffect } from 'react';
import { useRouter } from 'next/router';
import supabase from '../utils/supabaseClient';
import { apiFetch } from '../utils/api';
import { clearSession, getToken } from '../utils/authStorage';
import { usePlatformAuthStore } from '@/store/platformAuthStore';

export default function Logout() {
  const router = useRouter();

  useEffect(() => {
    async function signOut() {
      await supabase.auth.signOut().catch(() => undefined);
      try {
        const token = getToken();
        if (token) {
          await apiFetch('/logout', { method: 'POST' });
        }
      } catch {
        // ignore
      }
      clearSession();
      await usePlatformAuthStore.getState().logout({ skipRequest: true, redirectToLogin: false });
      router.replace('/auth/login');
    }
    void signOut();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center text-gray-500 text-sm bg-gray-50">
      جاري تسجيل الخروج...
    </div>
  );
}
