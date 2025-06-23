'use client';

import { useRouter } from 'next/router';
import { useState } from 'react';
import supabase from '../utils/supabaseClient'; // ✅ تعديل المسار هنا
import Layout from '../components/Layout';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      setErrorMsg('فشل الدخول. تحقق من البيانات.');
      return;
    }

    // تحقق من وجود المستخدم في جدول admins
    const { data: adminData, error: adminError } = await supabase
      .from('admins')
      .select('*')
      .eq('email', email)
      .single();

    if (adminError || !adminData) {
      setErrorMsg('ليست لديك صلاحية الدخول كمشرف.');
      return;
    }

    // تخزين بيانات الدخول في localStorage أو context (اختياري)
    router.push('/dashboard');
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <form
        onSubmit={handleLogin}
        className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm text-center"
      >
        <h2 className="text-2xl font-bold mb-6">دخول المشرفين</h2>

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
