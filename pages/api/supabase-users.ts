import { createClient } from '@supabase/supabase-js'
import type { NextApiRequest, NextApiResponse } from 'next'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!  // المفتاح الإداري، ضروري
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { data, error } = await supabase.auth.admin.listUsers()
  if (error) return res.status(500).json({ error: error.message })
  res.status(200).json(data.users)
}
