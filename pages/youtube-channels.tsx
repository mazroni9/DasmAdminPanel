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
  subscriber_count?: number;
  video_count?: number;
  last_video_date?: string | null;
  is_active?: boolean;
};

function formatDate(d?: string | null) {
  if (!d) return "-";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return "-";
  return dt.toLocaleDateString("ar-SA");
}

function ytChannelUrl(channelId: string) {
  return `https://www.youtube.com/channel/${channelId}`;
}

function normalizeChannelId(input: string): string {
  const raw = (input || "").trim();
  if (!raw) return "";

  // لو المستخدم حط ID مباشر
  if (!raw.includes("http")) return raw;

  try {
    const url = new URL(raw);

    // youtube.com/channel/UCxxxx
    const parts = url.pathname.split("/").filter(Boolean);
    const channelIndex = parts.findIndex((p) => p === "channel");
    if (channelIndex >= 0 && parts[channelIndex + 1]) return parts[channelIndex + 1];

    // لو الرابط مختلف (مثلاً /c/ أو /@) هنرجّع النص كما هو
    return raw;
  } catch {
    return raw;
  }
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={
        "px-2.5 py-1 text-xs font-semibold rounded-full " +
        (active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700")
      }
    >
      {active ? "مفعّلة" : "غير مفعّلة"}
    </span>
  );
}

function Switch({
  checked,
  disabled,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={[
        "inline-flex h-7 w-12 items-center rounded-full p-1 transition",
        checked ? "bg-green-600 justify-end" : "bg-gray-300 justify-start",
        disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer",
        "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
      ].join(" ")}
    >
      <span className="h-5 w-5 rounded-full bg-white shadow" />
    </button>
  );
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

      // تطبيع قيم ناقصة
      const normalized = arr.map((c) => ({
        ...c,
        subscriber_count: Number(c.subscriber_count ?? 0),
        video_count: Number(c.video_count ?? 0),
        last_video_date: c.last_video_date ?? null,
        is_active: typeof c.is_active === "boolean" ? c.is_active : true,
      }));

      setChannels(normalized);
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
    return channels.filter((c) => {
      const name = String(c.name || "").toLowerCase();
      const cid = String(c.channel_id || "").toLowerCase();
      return name.includes(q) || cid.includes(q) || String(c.id).includes(q);
    });
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
    setForm({ name: c.name || "", channel_id: c.channel_id || "" });
    setModalOpen(true);
    setError(null);
    setOkMsg(null);
  }

  async function save(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    setOkMsg(null);
    setSaving(true);

    try {
      const payload = {
        name: (form.name || "").trim(),
        channel_id: normalizeChannelId(form.channel_id),
      };

      if (editing) {
        await apiFetch(`/admin/youtube-channels/${editing.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        setOkMsg("تم تحديث القناة ✅");
      } else {
        await apiFetch(`/admin/youtube-channels`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setOkMsg("تم إضافة القناة ✅");
      }

      setModalOpen(false);
      await load(true);
    } catch (e2) {
      setError(extractErrorMessage(e2));
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
      setOkMsg("تم تحديث بيانات القناة ✅");
      await load(true);
    } catch (e) {
      setError(extractErrorMessage(e));
    }
  }

  async function toggleActive(c: Channel) {
    setError(null);
    setOkMsg(null);

    try {
      await apiFetch(`/admin/youtube-channels/${c.id}`, {
        method: "PUT",
        body: JSON.stringify({ is_active: !Boolean(c.is_active) }),
      });

      setOkMsg(Boolean(c.is_active) ? "تم إيقاف القناة ✅" : "تم تفعيل القناة ✅");
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
              <p className="text-sm text-gray-600 mt-1">إضافة وتعديل وإدارة القنوات.</p>
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

          {/* Search + Table */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="relative w-full md:w-96">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute right-3 top-3" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="بحث باسم القناة أو Channel ID..."
                  className="w-full border border-gray-300 rounded-xl py-2.5 pr-10 pl-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

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
                          الحالة
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
                      {filtered.map((c) => {
                        const active = Boolean(c.is_active);
                        return (
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

                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <StatusBadge active={active} />
                                <Switch checked={active} onChange={() => toggleActive(c)} />
                              </div>
                            </td>

                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {Number(c.subscriber_count || 0).toLocaleString("ar-SA")}
                            </td>

                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {Number(c.video_count || 0).toLocaleString("ar-SA")}
                            </td>

                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                              {formatDate(c.last_video_date ?? null)}
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
                                  تحديث
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
                        );
                      })}
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
                    <p className="text-sm text-gray-600 mt-1">أدخل اسم القناة و Channel ID.</p>
                  </div>

                  <button
                    className="text-gray-500 hover:text-gray-700"
                    onClick={() => !saving && setModalOpen(false)}
                    aria-label="إغلاق"
                    title="إغلاق"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={save} className="mt-5 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">اسم القناة</label>
                    <input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="مثال: DASM Official"
                      disabled={saving}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Channel ID</label>
                    <input
                      value={form.channel_id}
                      onChange={(e) => setForm({ ...form, channel_id: e.target.value })}
                      className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="مثال: UCxxxxxxx أو رابط القناة"
                      disabled={saving}
                    />
                    <p className="text-xs text-gray-500 mt-2">تقدر تلزّق الـ ID أو رابط القناة.</p>
                  </div>

                  <div className="mt-6 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      className="px-5 py-2.5 rounded-xl border bg-white hover:bg-gray-50 text-gray-700"
                      onClick={() => !saving && setModalOpen(false)}
                      disabled={saving}
                    >
                      إلغاء
                    </button>

                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                      disabled={saving}
                    >
                      {saving ? "جاري الحفظ..." : "حفظ"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
