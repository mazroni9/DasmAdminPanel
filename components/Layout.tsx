import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { HomeIcon, CarIcon, UsersIcon, VideoCameraIcon, CogIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline'

export default function Layout({ title, children }: any) {
  const router = useRouter()

  const navigation = [
    { name: 'الرئيسية', href: '/dashboard', icon: HomeIcon },
    { name: 'السيارات', href: '/cars', icon: CarIcon },
    { name: 'المستخدمين', href: '/users', icon: UsersIcon },
    { name: 'إدارة البث', href: '/live-stream', icon: VideoCameraIcon },
    { name: 'المزادات', href: '/auctions', icon: CurrencyDollarIcon },
    { name: 'الإعدادات', href: '/settings', icon: CogIcon },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 font-sans" dir="rtl">
      <Head>
        <title>{title || 'لوحة التحكم'}</title>
        <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap" rel="stylesheet" />
      </Head>
      
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-gray-800">لوحة التحكم</h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-8 space-x-reverse">
              <Link 
                href="/dashboard" 
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                  router.pathname === '/dashboard' 
                    ? 'bg-indigo-500 text-white' 
                    : 'text-gray-600 hover:bg-indigo-50 hover:text-indigo-600'
                }`}
              >
                الرئيسية
              </Link>
              
              <Link 
                href="/cars" 
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                  router.pathname === '/cars' 
                    ? 'bg-indigo-500 text-white' 
                    : 'text-gray-600 hover:bg-indigo-50 hover:text-indigo-600'
                }`}
              >
                السيارات
              </Link>
              
              <Link 
                href="/users" 
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                  router.pathname === '/users' 
                    ? 'bg-indigo-500 text-white' 
                    : 'text-gray-600 hover:bg-indigo-50 hover:text-indigo-600'
                }`}
              >
                المستخدمين
              </Link>
              
              <Link 
                href="/settings" 
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                  router.pathname === '/settings' 
                    ? 'bg-indigo-500 text-white' 
                    : 'text-gray-600 hover:bg-indigo-50 hover:text-indigo-600'
                }`}
              >
                الإعدادات
              </Link>
              
              <Link 
                href="/logout" 
                className="px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 transition-colors duration-200"
              >
                خروج
              </Link>
            </div>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          {children}
        </div>
      </main>
    </div>
  )
}