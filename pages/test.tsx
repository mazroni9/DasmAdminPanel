import Layout from '../components/Layout'
import { useEffect, useState } from 'react'
import supabase from '../utils/supabaseClient'

export default function TestPage() {
  const [cars, setCars] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const { data, error } = await supabase.from('cars').select('*') // غيّر اسم الجدول إذا مختلف
      if (error) {
        console.error('خطأ في جلب البيانات:', error.message)
      } else {
        setCars(data || [])
      }
      setLoading(false)
    }

    fetchData()
  }, [])

  return (
    <div style={{ padding: 20 }}>
      <h1>🚗 بيانات السيارات</h1>
      {loading ? (
        <p>جاري التحميل...</p>
      ) : (
        <ul>
          {cars.map((car, index) => (
            <li key={index}>
              {JSON.stringify(car)}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
