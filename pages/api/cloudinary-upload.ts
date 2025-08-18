
import type { NextApiRequest, NextApiResponse } from 'next';
import cloudinary from '../../utils/cloudinary';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { file } = req.body;
  try {
    const uploaded = await cloudinary.uploader.upload(file, {
      folder: 'adminpanel',
    });
    res.status(200).json(uploaded);
  } catch (err) {
    res.status(500).json({ error: 'فشل في الرفع' });
  }
}
