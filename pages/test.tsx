import Layout from '../components/Layout'
import { useEffect, useState } from 'react'
import supabase from '../utils/supabaseClient'
import { AuthError, PostgrestError } from '@supabase/supabase-js'

type TestStatus = 'success' | 'error';
type TestResult = {
  status: TestStatus;
  message: string;
  details?: any;
};

type TestResults = {
  env: TestResult;
  auth: TestResult;
  profiles: TestResult;
  users: TestResult;
};

export default function TestPage() {
  const [testResults, setTestResults] = useState<{
    status: 'testing' | 'done';
    results: TestResults;
  }>({
    status: 'testing',
    results: {
      env: { status: 'success', message: 'جاري الفحص...' },
      auth: { status: 'success', message: 'جاري الفحص...' },
      profiles: { status: 'success', message: 'جاري الفحص...' },
      users: { status: 'success', message: 'جاري الفحص...' }
    }
  });

  useEffect(() => {
    async function runTests() {
      const results: TestResults = {
        env: { status: 'success', message: '' },
        auth: { status: 'success', message: '' },
        profiles: { status: 'success', message: '' },
        users: { status: 'success', message: '' }
      };

      // فحص متغيرات البيئة
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        results.env = {
          status: 'error' as TestStatus,
          message: 'متغيرات البيئة غير مكتملة'
        };
      } else {
        results.env = {
          status: 'success',
          message: 'متغيرات البيئة موجودة'
        };
      }

      try {
        // فحص المصادقة
        const { data: authData, error: authError } = await supabase.auth.getSession();
        if (authError) {
          results.auth = {
            status: 'error' as TestStatus,
            message: 'خطأ في المصادقة',
            details: authError
          };
        } else {
          results.auth = {
            status: 'success',
            message: 'تم الاتصال بنظام المصادقة',
            details: authData
          };
        }

        // فحص جدول الملفات الشخصية
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('count');
        
        if (profilesError) {
          results.profiles = {
            status: 'error' as TestStatus,
            message: 'خطأ في الوصول لجدول الملفات الشخصية',
            details: profilesError
          };
        } else {
          results.profiles = {
            status: 'success',
            message: 'تم الوصول لجدول الملفات الشخصية',
            details: profilesData
          };
        }

        // فحص جدول المستخدمين
        const { data: usersData, error: usersError } = await supabase
          .from('auth.users')
          .select('count');

        if (usersError) {
          results.users = {
            status: 'error' as TestStatus,
            message: 'خطأ في الوصول لجدول المستخدمين',
            details: usersError
          };
        } else {
          results.users = {
            status: 'success',
            message: 'تم الوصول لجدول المستخدمين',
            details: usersData
          };
        }

      } catch (error: any) {
        console.error('خطأ في الاختبارات:', error);
      }

      setTestResults({
        status: 'done',
        results
      });
    }

    runTests();
  }, []);

  const getStatusColor = (status: TestStatus) => {
    return status === 'success' ? 'bg-green-100' : 'bg-red-100';
  };

  return (
    <Layout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">فحص نظام المستخدمين</h1>
        
        {testResults.status === 'testing' ? (
          <div className="text-center p-4">
            <p className="text-lg">جاري إجراء الاختبارات...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* متغيرات البيئة */}
            <div className={`p-4 rounded-lg ${getStatusColor(testResults.results.env.status)}`}>
              <h2 className="font-bold">متغيرات البيئة</h2>
              <p>{testResults.results.env.message}</p>
            </div>

            {/* المصادقة */}
            <div className={`p-4 rounded-lg ${getStatusColor(testResults.results.auth.status)}`}>
              <h2 className="font-bold">نظام المصادقة</h2>
              <p>{testResults.results.auth.message}</p>
              {testResults.results.auth.details && (
                <pre className="mt-2 text-sm bg-white p-2 rounded">
                  {JSON.stringify(testResults.results.auth.details, null, 2)}
                </pre>
              )}
            </div>

            {/* الملفات الشخصية */}
            <div className={`p-4 rounded-lg ${getStatusColor(testResults.results.profiles.status)}`}>
              <h2 className="font-bold">جدول الملفات الشخصية</h2>
              <p>{testResults.results.profiles.message}</p>
              {testResults.results.profiles.details && (
                <pre className="mt-2 text-sm bg-white p-2 rounded">
                  {JSON.stringify(testResults.results.profiles.details, null, 2)}
                </pre>
              )}
            </div>

            {/* المستخدمين */}
            <div className={`p-4 rounded-lg ${getStatusColor(testResults.results.users.status)}`}>
              <h2 className="font-bold">جدول المستخدمين</h2>
              <p>{testResults.results.users.message}</p>
              {testResults.results.users.details && (
                <pre className="mt-2 text-sm bg-white p-2 rounded">
                  {JSON.stringify(testResults.results.users.details, null, 2)}
                </pre>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
