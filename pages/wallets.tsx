import Layout from '../components/Layout'
import { useEffect, useState } from 'react'
import supabase from '../lib/supabase'

export default function Wallets() {
  const [wallets, setWallets] = useState<any[]>([])

  useEffect(() => {
    supabase.from('wallets').select('id, user_id, balance, currency, status').then(({ data }) => {
      if (data) setWallets(data)
    })
  }, [])

  return (
    <Layout title="المحافظ المالية">
      <h2 className="text-lg font-bold mb-4">قائمة المحافظ</h2>
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100 text-right">
            <th className="p-2">ID</th><th className="p-2">المستخدم</th><th className="p-2">الرصيد</th><th className="p-2">العملة</th><th className="p-2">الحالة</th>
          </tr>
        </thead>
        <tbody>
          {wallets.map(w => (
            <tr key={w.id} className="border-t">
              <td className="p-2">{w.id}</td>
              <td className="p-2">{w.user_id}</td>
              <td className="p-2">{w.balance}</td>
              <td className="p-2">{w.currency}</td>
              <td className="p-2">{w.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Layout>
  )
}