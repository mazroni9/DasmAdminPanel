import Layout from '../components/Layout'
import { useEffect, useState } from 'react'
import supabase from '../utils/supabaseClient'

interface Car {
  id: number
  model: string
  color: string
  price: number
}

export default function Cars() {
  const [cars, setCars] = useState<Car[]>([])

  useEffect(() => {
    async function fetchCars() {
      const { data, error } = await supabase.from('cars').select('*')
      if (error) {
        console.error('خطأ في جلب البيانات:', error.message)
      } else {
        setCars(data || [])
      }
    }

    fetchCars()
  }, [])

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-4">قائمة السيارات</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cars.map((car) => (
          <div
            key={car.id}
            className="border rounded p-4 shadow hover:shadow-lg transition"
          >
            <h2 className="text-lg font-semibold">{car.model}</h2>
            <p>اللون: {car.color}</p>
            <p>السعر: {car.price} ريال</p>
          </div>
        ))}
      </div>
    </Layout>
  )
} 