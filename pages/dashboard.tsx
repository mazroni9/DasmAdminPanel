import Layout from '../components/Layout'
import { useEffect, useState } from 'react'
import { supabase } from '../utils/supabaseClient'

export default function Dashboard() {
  const [stats, setStats] = useState({ cars: 0, users: 0, wallets: 0 })

  useEffect(() => {
    const fetchStats = async () => {
      const [{ count: cars = 0 }, { count: users = 0 }, { count: wallets = 0 }] = await Promise.all([
        supabase.from('cars').select('*', { count: 'exact', head: true }),
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('wallets').select('*', { count: 'exact', head: true })
      ])
      setStats({ cars, users, wallets })
    }

    fetchStats()
  }, [])

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold">Total Cars</h2>
          <p className="text-2xl">{stats.cars}</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold">Total Users</h2>
          <p className="text-2xl">{stats.users}</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold">Total Wallets</h2>
          <p className="text-2xl">{stats.wallets}</p>
        </div>
      </div>
    </Layout>
  )
}
