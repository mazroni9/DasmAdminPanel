import Layout from '../components/Layout'
import { useEffect, useState } from 'react'
import supabase from '../utils/supabaseClient'

export default function Funding() {
  const [requests, setRequests] = useState<any[]>([])

  useEffect(() => {
    supabase.from('funding_requests').select('*').then(({ data }) => {
      if (data) setRequests(data)
    })
  }, [])

  return (
    <Layout title="طلبات التمويل">
      <h2 className="text-lg font-bold mb-4">الطلبات</h2>
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100 text-right">
            <th className="p-2">المستخدم</th><th className="p-2">المبلغ</th><th className="p-2">الحالة</th><th className="p-2">التاريخ</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((r, i) => (
            <tr key={i} className="border-t">
              <td className="p-2">{r.user_id}</td>
              <td className="p-2">{r.amount_requested}</td>
              <td className="p-2">{r.status}</td>
              <td className="p-2">{r.submitted_at}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Layout>
  )
}