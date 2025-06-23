import { useEffect } from 'react'
import { useRouter } from 'next/router'
import supabase from '../lib/supabase'

export default function Logout() {
  const router = useRouter()
  useEffect(() => {
    supabase.auth.signOut().then(() => router.push('/login'))
  }, [])
  return null
}