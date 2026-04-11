import { NextApiRequest, NextApiResponse } from 'next'
import supabase from '../../utils/supabaseClient'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({ status: 'ok', note: 'Direct Supabase connections are disabled. Use DASM API.' })
} 