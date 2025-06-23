import Layout from '../components/Layout'
import { useEffect, useState } from 'react'
import { supabase } from '../utils/supabaseClient'

export default function Users() {
  const [users, setUsers] = useState<any[]>([])

  useEffect(() => {
    async function fetchUsers() {
      const { data, error } = await supabase.from('users').select('*')
      if (error) {
        console.error('خطأ في جلب المستخدمين:', error.message)
      } else {
        setUsers(data || [])
      }
    }

    fetchUsers()
  }, [])

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-4">المستخدمون</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map((user) => (
          <div
            key={user.id}
            className="border rounded p-4 shadow hover:shadow-lg transition"
          >
            <h2 className="text-lg font-semibold">{user.name || user.email}</h2>
            <p>البريد الإلكتروني: {user.email}</p>
            <p>الدور: {user.role || 'غير محدد'}</p>
          </div>
        ))}
      </div>
    </Layout>
  )
}
