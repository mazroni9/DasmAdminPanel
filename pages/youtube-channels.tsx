import React, { useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout";
import { apiFetch, extractErrorMessage } from "../utils/api";
import {
  VideoCameraIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  TrashIcon,
  PencilSquareIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";

type Channel = {
  id: number;
  name: string;
  channel_id: string;
  subscriber_count: number;
  video_count: number;
  last_video_date: string | null;
  is_active: boolean;
};

function formatDate(d: string | null) {
  if (!d) return "-";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return "-";
  return dt.toLocaleDateString("ar-SA");
}

function ytChannelUrl(channelId: string) {
  return `https://www.youtube.com/channel/${channelId}`;
}

export default function YouTubeChannels() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [channels, setChannels] = useState<Channel[]>([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Channel | null>(null);

  const [form, setForm] = useState({
    name: "",
    channel_id: "",
  });

  async function load(isRefresh = false) {
    setError(null);
    setOkMsg(null);
    isRefresh ? setRefreshing(true) : setLoading(true);

    try {
      const res: any = await apiFetch("/admin/youtube-channels");
      const list = res?.data ?? res;
      const arr: Channel[] = Array.isArray(list)
        ? list
        : Array.isArray(list?.data)
        ? list.data
        : Array.isArray(list?.data?.data)
        ? list.data.data
        : [];

      setChannels(arr);
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      isRefresh ? setRefreshing(false) : setLoading(false);
    }
  }

  useEffect(() => {
    load(false);
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return channels;
    return channels.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.channel_id.toLowerCase().includes(q) ||
        String(c.id).includes(q)
    );
  }, [channels, search]);

  function openCreate() {
    setEditing(null);
    setForm({ name: "", channel_id: "" });
    setModalOpen(true);
    setError(null);
    setOkMsg(null);
  }

  function openEdit(c: Channel) {
    setEditing(c);
    setForm({ name: c.name, channel_id: c.channel_id });
    setModalOpen(true);
    setError(null);
    setOkMsg(null);
  }

  async function save() {
    setError(null);
    setOkMsg(null);
    setSaving(true);
    try {
      if (editing) {
        await apiFetch(`/admin/youtube-channels/${editing.id}`, {
          method: "PUT",
          body: JSON.stringify(form),
        });
        setOkMsg("تم تحديث القناة ✅");
      } else {
        await apiFetch(`/admin/youtube-channels`, {
          method: "POST",
          body: JSON.stringify(form),
        });
        setOkMsg("تم إضافة القناة ✅");
      }
      setModalOpen(false);
      await load(true);
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number) {
    if (!confirm("هل أنت متأكد من حذف القناة؟")) return;
    setError(null);
    setOkMsg(null);
    try {
      await apiFetch(`/admin/youtube-channels/${id}`, { method: "DELETE" });
      setOkMsg("تم حذف القناة ✅");
      await load(true);
    } catch (e) {
      setError(extractErrorMessage(e));
    }
  }

  async function sync(id: number) {
    setError(null);
    setOkMsg(null);
    try {
      await apiFetch(`/admin/youtube-channels/${id}/sync`, { method: "POST" });
      setOkMsg("تم تحديث بيانات القناة من يوتيوب ✅");
      await load(true);
    } catch (e) {
      setError(extractErrorMessage(e));
    }
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50/50 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-6xl space-y-6">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-sm p-6 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">قنوات YouTube</h1>
              <p className="text-sm text-gray-600 mt-1">
                إدارة القنوات + (اختياري) مزامنة الأرقام من YouTube API.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border bg-white hover:bg-gray-50 text-sm disabled:opacity-60"
                onClick={() => load(true)}
                disabled={refreshing}
              >
                <ArrowPathIcon className="h-5 w-5" />
                تحديث
              </button>

              <button
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                onClick={openCreate}
              >
                <PlusIcon className="h-5 w-5" />
                إضافة قناة
              </button>
            </div>
          </div>

          {/* Alerts */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-2xl p-4 text-sm">
              {error}
            </div>
          )}
          {okMsg && (
            <div className="bg-green-50 border border-green-200 text-green-800 rounded-2xl p-4 text-sm">
              {okMsg}
            </div>
          )}

          {/* Search */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="relative w-full md:w-96">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute right-3 top-3" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="بحث باسم القناة أو Channel ID..."
                className="w-full border border-gray-300 rounded-xl py-2.5 pr-10 pl-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Table */}
            <div className="mt-6">
              {loading ? (
                <div className="text-gray-500">جاري التحميل...</div>
              ) : filtered.length ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">
                          القناة
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">
                          المشتركين
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">
                          الفيديوهات
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">
                          آخر فيديو
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">
                          إجراءات
                        </th>
                      </tr>
                    </thead>

                    <tbody className="bg-white divide-y divide-gray-200">
                      {filtered.map((c) => (
                        <tr key={c.id} className="hover:bg-gray-50/60">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0">
                                <VideoCameraIcon className="h-6 w-6 text-gray-400" />
                              </div>
                              <div className="mr-4">
                                <div className="text-sm font-semibold text-gray-900">{c.name}</div>
                                <div className="text-xs text-gray-500">{c.channel_id}</div>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {Number(c.subscriber_count || 0).toLocaleString("ar-SA")}
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {Number(c.video_count || 0).toLocaleString("ar-SA")}
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {formatDate(c.last_video_date)}
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex items-center gap-2">
                              <a
                                href={ytChannelUrl(c.channel_id)}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border bg-white hover:bg-gray-50 text-xs"
                              >
                                <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                                فتح
                              </a>

                              <button
                                onClick={() => sync(c.id)}
                                className="px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-xs"
                              >
                                Sync
                              </button>

                              <button
                                onClick={() => openEdit(c)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border bg-white hover:bg-gray-50 text-xs"
                              >
                                <PencilSquareIcon className="h-4 w-4" />
                                تعديل
                              </button>

                              <button
                                onClick={() => remove(c.id)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 text-xs"
                              >
                                <TrashIcon className="h-4 w-4" />
                                حذف
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-14">
                  <VideoCameraIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-semibold text-gray-900">لا توجد قنوات</h3>
                  <p className="mt-1 text-sm text-gray-500">ابدأ بإضافة قناة جديدة.</p>
                </div>
              )}
            </div>
          </div>

          {/* Modal */}
          {modalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div
                className="absolute inset-0 bg-black/30"
                onClick={() => !saving && setModalOpen(false)}
              />
              <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-xl p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {editing ? "تعديل قناة" : "إضافة قناة جديدة"}
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      أدخل اسم القناة و Channel ID.
                    </p>
                  </div>

                  <button
                    className="text-gray-500 hover:text-gray-700"
                    onClick={() => !saving && setModalOpen(false)}
                  >
                    ✕
                  </button>
                </div>

                <div className="mt-5 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">اسم القناة</label>
                    <input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="مثال: DASM Official"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Channel ID</label>
                    <input
                      value={form.channel_id}
                      onChange={(e) => setForm({ ...form, channel_id: e.target.value })}
                      className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="مثال: UCxxxxxxx"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      هتلاقيه في رابط القناة: youtube.com/channel/...
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-end gap-2">
                  <button
                    className="px-5 py-2.5 rounded-xl border bg-white hover:bg-gray-50 text-gray-700"
                    onClick={() => !saving && setModalOpen(false)}
                  >
                    إلغاء
                  </button>

                  <button
                    className="px-5 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                    onClick={save}
                    disabled={saving}
                  >
                    {saving ? "جاري الحفظ..." : "حفظ"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
