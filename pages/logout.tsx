import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { apiFetch } from '../utils/api';
import { clearSession, getToken } from '../utils/authStorage';

export default function Logout() {
  const router = useRouter();

  useEffect(() => {
    async function signOut() {
      try {
        const token = getToken();
        if (token) {
          await apiFetch('/logout', { method: 'POST' });
        }
      } catch {
        // ignore
      } finally {
        clearSession();
        router.replace('/login');
      }
    }

    signOut();
  }, [router]);

  return null;
}
