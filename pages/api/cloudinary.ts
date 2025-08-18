
import type { NextApiRequest, NextApiResponse } from 'next';
import cloudinary from '../../utils/cloudinary';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { resources } = await cloudinary.search
    .expression('folder:adminpanel')
    .sort_by('created_at', 'desc')
    .max_results(30)
    .execute();
  res.status(200).json(resources);
}
