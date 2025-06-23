import { useState } from 'react';
import Layout from '../components/Layout';
import { VideoCameraIcon, PlusIcon } from '@heroicons/react/24/outline';

interface YouTubeChannel {
  id: string;
  name: string;
  channelId: string;
  subscriberCount: number;
  videoCount: number;
  lastVideoDate: string;
}

export default function YouTubeChannels() {
  const [channels, setChannels] = useState<YouTubeChannel[]>([]);

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50/50 p-4 sm:p-6 lg:p-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          {/* رأس الصفحة */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">قنوات YouTube</h1>
            <button
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PlusIcon className="h-5 w-5 ml-2" />
              إضافة قناة جديدة
            </button>
          </div>

          {/* قائمة القنوات */}
          {channels.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      اسم القناة
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      عدد المشتركين
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      عدد الفيديوهات
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      آخر فيديو
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الإجراءات
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {channels.map((channel) => (
                    <tr key={channel.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <VideoCameraIcon className="h-6 w-6 text-gray-400" />
                          </div>
                          <div className="mr-4">
                            <div className="text-sm font-medium text-gray-900">{channel.name}</div>
                            <div className="text-sm text-gray-500">{channel.channelId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {channel.subscriberCount.toLocaleString('ar-SA')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {channel.videoCount.toLocaleString('ar-SA')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(channel.lastVideoDate).toLocaleDateString('ar-SA')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button className="text-blue-600 hover:text-blue-900 ml-4">تعديل</button>
                        <button className="text-red-600 hover:text-red-900">حذف</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <VideoCameraIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">لا توجد قنوات</h3>
              <p className="mt-1 text-sm text-gray-500">ابدأ بإضافة قناة جديدة.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
} 