import Head from 'next/head'
import Link from 'next/link'

export default function Layout({ title, children }: any) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>{title}</title>
      </Head>
      <header className="bg-white shadow p-4 mb-6">
        <nav className="flex justify-between">
          <div className="font-bold text-lg">{title}</div>
          <div className="space-x-4 space-x-reverse">
            <Link href="/dashboard">الرئيسية</Link>
            <Link href="/cars">السيارات</Link>
            <Link href="/users">المستخدمين</Link>
            <Link href="/settings">الإعدادات</Link>
            <Link href="/logout">خروج</Link>
          </div>
        </nav>
      </header>
      <main className="p-4">{children}</main>
    </div>
  )
}