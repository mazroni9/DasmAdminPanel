import { useState } from 'react';
import Layout from '../components/Layout';

export default function LiveStream() {
  const [streamData, setStreamData] = useState({
    videoUrl: '',
    title: '',
    description: '',
    isLive: false,
    startDate: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // هنا سيتم إضافة منطق حفظ البيانات لاحقاً
    console.log('Stream data:', streamData);
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50/50 p-4 sm:p-6 lg:p-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-semibold text-gray-800 mb-6">إدارة البث عبر يوتيوب</h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* رابط الفيديو */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                رابط فيديو اليوتيوب أو معرف الفيديو
              </label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="أدخل رابط فيديو يوتيوب أو معرف الفيديو"
                value={streamData.videoUrl}
                onChange={(e) => setStreamData({ ...streamData, videoUrl: e.target.value })}
              />
              <p className="mt-1 text-sm text-gray-500">
                يمكنك إدخال رابط كامل مثل https://www.youtube.com/watch?v=XXXX أو معرف الفيديو فقط
              </p>
            </div>

            {/* عنوان البث */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                عنوان البث
              </label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="أدخل عنوان البث"
                value={streamData.title}
                onChange={(e) => setStreamData({ ...streamData, title: e.target.value })}
              />
            </div>

            {/* وصف البث */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                وصف البث
              </label>
              <textarea
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="أدخل وصف البث"
                value={streamData.description}
                onChange={(e) => setStreamData({ ...streamData, description: e.target.value })}
              />
            </div>

            {/* البث مباشر حالياً */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isLive"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                checked={streamData.isLive}
                onChange={(e) => setStreamData({ ...streamData, isLive: e.target.checked })}
              />
              <label htmlFor="isLive" className="mr-2 block text-sm text-gray-700">
                البث مباشر حالياً
              </label>
            </div>

            {/* موعد بدء البث */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                موعد بدء البث (اختياري)
              </label>
              <input
                type="datetime-local"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={streamData.startDate}
                onChange={(e) => setStreamData({ ...streamData, startDate: e.target.value })}
              />
            </div>

            {/* تعليمات البث */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-3">تعليمات البث عبر يوتيوب</h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-600">
                <li>قم بإنشاء بث مباشر على قناة يوتيوب الخاصة بك.</li>
                <li>انسخ معرف الفيديو من رابط يوتيوب (الجزء بعد v=? في الرابط)</li>
                <li>الصق معرف الفيديو في حقل "معرف فيديو اليوتيوب".</li>
                <li>عند بدء البث المباشر، قم بتفعيل خيار "البث مباشر حالياً".</li>
                <li>عند انتهاء البث المباشر، قم بإلغاء تفعيل خيار "البث مباشر حالياً".</li>
              </ol>
            </div>

            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              إنشاء بث جديد
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
} 