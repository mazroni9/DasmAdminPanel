
import type { NextApiRequest, NextApiResponse } from 'next';
import cloudinary from '../../../utils/cloudinary';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { public_id } = req.body;
  try {
    await cloudinary.uploader.destroy(public_id);
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'فشل في الحذف' });
  }
}
