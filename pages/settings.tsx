import Layout from '../components/Layout'
import { useEffect, useState } from 'react'
import { supabase } from '../utils/supabaseClient'

export default function Settings() {
  const [title, setTitle] = useState('')

  useEffect(() => {
    async function fetchSettings() {
      const { data, error } = await supabase
        .from('settings')
        .select('title')
        .single()

      if (error) {
        console.error('خطأ في جلب الإعدادات:', error.message)
      } else {
        setTitle(data?.title || '')
      }
    }

    fetchSettings()
  }, [])

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-4">الإعدادات</h1>
      <div className="p-4 border rounded shadow">
        <p className="text-lg font-semibold">عنوان النظام:</p>
        <p>{title}</p>
      </div>
    </Layout>
  )
}
