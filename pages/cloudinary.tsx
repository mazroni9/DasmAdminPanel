import { useEffect, useState } from 'react';
import Image from 'next/image';
import axios from 'axios';

interface CloudinaryImage {
  public_id: string;
  secure_url: string;
}

export default function CloudinaryGallery() {
  const [images, setImages] = useState<CloudinaryImage[]>([]);

  useEffect(() => {
    async function fetchImages() {
      const res = await axios.get('/api/cloudinary');
      setImages(res.data);
    }
    fetchImages();
  }, []);

  const handleDelete = async (public_id: string) => {
    if (confirm('هل أنت متأكد من حذف الصورة؟')) {
      await axios.post('/api/cloudinary/delete', { public_id });
      setImages(images.filter((img) => img.public_id !== public_id));
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">صور Cloudinary</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {images.map((img) => (
          <div key={img.public_id} className="relative">
            <Image src={img.secure_url} alt="cloudinary" width={300} height={200} />
            <button onClick={() => handleDelete(img.public_id)} className="absolute top-1 right-1 bg-red-500 text-white px-2 py-1 rounded">X</button>
          </div>
        ))}
      </div>
    </div>
  );
} 
