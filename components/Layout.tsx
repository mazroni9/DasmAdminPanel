import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { 
  HomeIcon, 
  UserGroupIcon, 
  VideoCameraIcon, 
  Cog6ToothIcon, 
  CurrencyDollarIcon, 
  ChartBarIcon,
  TruckIcon
} from '@heroicons/react/24/outline'

export default function Layout({ title, children }: any) {
  const router = useRouter()

  const navigation = [
    { name: 'الرئيسية', href: '/dashboard', icon: HomeIcon },
    { name: 'السيارات', href: '/cars', icon: TruckIcon },
    { name: 'المستخدمين', href: '/users', icon: UserGroupIcon },
    { name: 'إدارة البث', href: '/live-stream', icon: VideoCameraIcon },
    { name: 'المزادات', href: '/auctions', icon: CurrencyDollarIcon },
    { name: 'قنوات YouTube', href: '/youtube-channels', icon: VideoCameraIcon },
    { name: 'التقارير', href: '/reports', icon: ChartBarIcon },
    { name: 'الإعدادات', href: '/settings', icon: Cog6ToothIcon },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 font-sans" dir="rtl">
      <Head>
        <title>{title || 'لوحة التحكم'}</title>
        <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap" rel="stylesheet" />
      </Head>
      
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-lg">
          <div className="flex items-center justify-center h-16 border-b">
            <h1 className="text-xl font-bold text-gray-800">لوحة التحكم</h1>
          </div>
          <nav className="mt-6">
            <div className="px-4 space-y-2">
              {navigation.map((item) => {
                const isActive = router.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
                      isActive
                        ? 'bg-indigo-500 text-white'
                        : 'text-gray-600 hover:bg-indigo-50 hover:text-indigo-600'
                    }`}
                  >
                    <item.icon className="h-5 w-5 ml-3" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="bg-white shadow-sm">
            <div className="px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                <div className="flex items-center">
                  <h2 className="text-lg font-medium text-gray-900">
                    {navigation.find((item) => item.href === router.pathname)?.name || title}
                  </h2>
                </div>
                <Link 
                  href="/logout" 
                  className="px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 transition-colors duration-200"
                >
                  خروج
                </Link>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-auto bg-gray-50 p-4 sm:p-6 lg:p-8">
            <div className="bg-white rounded-lg shadow-sm">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}