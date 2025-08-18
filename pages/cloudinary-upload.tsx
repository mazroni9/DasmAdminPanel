
import { useState } from 'react';
import axios from 'axios';

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result;
      await axios.post('/api/cloudinary-upload', { file: base64 });
      alert('تم رفع الصورة!');
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">رفع صورة</h1>
      <input type="file" onChange={handleChange} />
      {preview && <img src={preview} alt="preview" className="my-4 w-64" />}
      <button onClick={handleUpload} className="bg-blue-600 text-white px-4 py-2 rounded">رفع</button>
    </div>
  );
}
