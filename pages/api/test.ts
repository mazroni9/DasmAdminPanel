import { NextApiRequest, NextApiResponse } from 'next'
import { checkSupabaseConnection } from '../../utils/supabaseClient'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const connectionTest = await checkSupabaseConnection()
    res.status(200).json(connectionTest)
  } catch (error) {
    res.status(500).json({ error: 'Failed to connect to Supabase', details: error })
  }
} 