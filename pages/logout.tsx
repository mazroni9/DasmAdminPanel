import { useEffect } from 'react'
import { useRouter } from 'next/router'
import supabase from '../utils/supabaseClient'

export default function Logout() {
  const router = useRouter()

  useEffect(() => {
    async function signOut() {
      await supabase.auth.signOut()
      router.push('/login')
    }
    signOut()
  }, [router])

  return null
}