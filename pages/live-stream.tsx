import React, { useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout";
import { apiFetch, extractErrorMessage } from "../utils/api";
import {
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  LinkIcon,
} from "@heroicons/react/24/outline";

function normalizeYouTubeId(input: string): string | null {
  const raw = (input || "").trim();
  if (!raw) return null;

  // If user pasted just ID
  if (/^[a-zA-Z0-9_-]{6,}$/.test(raw) && !raw.includes("http")) return raw;

  try {
    const url = new URL(raw);
    const v = url.searchParams.get("v");
    if (v) return v;

    if (url.hostname.includes("youtu.be")) {
      const id = url.pathname.replace("/", "").trim();
      return id || null;
    }

    const parts = url.pathname.split("/").filter(Boolean);
    const embedIndex = parts.findIndex((p) => p === "embed");
    if (embedIndex >= 0 && parts[embedIndex + 1]) return parts[embedIndex + 1];

    return null;
  } catch {
    return null;
  }
}

type BroadcastState = {
  id: number | null;
  videoUrl: string;
  title: string;
  description: string;
  isLive: boolean;
  startDate: string; // datetime-local
};

export default function LiveStream() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  const [state, setState] = useState<BroadcastState>({
    id: null,
    videoUrl: "",
    title: "",
    description: "",
    isLive: false,
    startDate: "",
  });

  const videoId = useMemo(() => normalizeYouTubeId(state.videoUrl), [state.videoUrl]);

  async function load() {
    setError(null);
    setOkMsg(null);
    setLoading(true);
    try {
      // موجود في routes عندك: /api/admin/broadcast
      const res: any = await apiFetch("/admin/broadcast");

      const data = res?.data ?? res;

      const id = data?.id ?? data?.data?.id ?? null;

      const videoUrl =
        data?.video_url ??
        data?.youtube_url ??
        data?.videoUrl ??
        data?.data?.video_url ??
        data?.data?.youtube_url ??
        "";

      const start =
        data?.start_date ??
        data?.startDate ??
        data?.data?.start_date ??
        "";

      // تحويل ISO → datetime-local لو جاي من الباك
      let startLocal = "";
      if (typeof start === "string" && start) {
        // إذا كان ISO
        const d = new Date(start);
        if (!isNaN(d.getTime())) {
          const pad = (n: number) => String(n).padStart(2, "0");
          startLocal = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
            d.getHours()
          )}:${pad(d.getMinutes())}`;
        }
      }

      setState({
        id: id ? Number(id) : null,
        videoUrl: videoUrl || "",
        title: data?.title ?? data?.data?.title ?? "",
        description: data?.description ?? data?.data?.description ?? "",
        isLive: Boolean(data?.is_live ?? data?.isLive ?? data?.data?.is_live ?? false),
        startDate: startLocal,
      });
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOkMsg(null);
    setSaving(true);

    try {
      const payload: any = {
        // نرسل الاتنين لتغطية اختلاف أسماء الحقول
        video_url: state.videoUrl,
        youtube_url: state.videoUrl,
        title: state.title,
        description: state.description,
        is_live: state.isLive,
        start_date: state.startDate ? new Date(state.startDate).toISOString() : null,
      };

      if (state.id) {
        await apiFetch(`/admin/broadcast/${state.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        const created: any = await apiFetch(`/admin/broadcast`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
        const newId = created?.data?.id ?? created?.id ?? null;
        if (newId) {
          setState((s) => ({ ...s, id: Number(newId) }));
        }
      }

      // موجود عندك: PUT /api/admin/broadcast/status
      try {
        await apiFetch("/admin/broadcast/status", {
          method: "PUT",
          body: JSON.stringify({ is_live: state.isLive }),
        });
      } catch {
        // لو الباك مش محتاجه، نتجاهل
      }

      setOkMsg("تم حفظ إعدادات البث بنجاح ✅");
      await load();
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setOkMsg("تم النسخ ✅");
      setTimeout(() => setOkMsg(null), 1500);
    } catch {
      setError("تعذر النسخ، انسخ يدويًا.");
    }
  }

  const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}` : "";
  const watchUrl = videoId ? `https://www.youtube.com/watch?v=${videoId}` : "";

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50/50 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-6xl space-y-6">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-sm p-6 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">إدارة البث عبر يوتيوب</h1>
              <p className="text-sm text-gray-600 mt-1">
                إعداد بث واحد “Current Broadcast” + معاينة مباشرة + تبديل حالة Live.
              </p>
            </div>

            <button
              onClick={load}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border bg-white hover:bg-gray-50 text-sm disabled:opacity-60"
              disabled={loading}
            >
              <ArrowPathIcon className="h-5 w-5" />
              تحديث
            </button>
          </div>

          {/* Alerts */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-2xl p-4 flex items-start gap-3">
              <ExclamationTriangleIcon className="h-6 w-6 mt-0.5" />
              <div className="text-sm">{error}</div>
            </div>
          )}
          {okMsg && (
            <div className="bg-green-50 border border-green-200 text-green-800 rounded-2xl p-4 flex items-start gap-3">
              <CheckCircleIcon className="h-6 w-6 mt-0.5" />
              <div className="text-sm">{okMsg}</div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Form */}
            <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm p-6">
              {loading ? (
                <div className="text-gray-500">جاري التحميل...</div>
              ) : (
                <form onSubmit={save} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      رابط فيديو اليوتيوب أو معرف الفيديو
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        className="w-full pl-4 pr-10 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="https://www.youtube.com/watch?v=XXXX أو XXXX"
                        value={state.videoUrl}
                        onChange={(e) => setState({ ...state, videoUrl: e.target.value })}
                      />
                      <LinkIcon className="h-5 w-5 text-gray-400 absolute right-3 top-3" />
                    </div>

                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="px-3 py-1.5 rounded-lg border bg-white hover:bg-gray-50 text-xs"
                        disabled={!watchUrl}
                        onClick={() => copy(watchUrl)}
                      >
                        نسخ رابط المشاهدة
                      </button>
                      <button
                        type="button"
                        className="px-3 py-1.5 rounded-lg border bg-white hover:bg-gray-50 text-xs"
                        disabled={!embedUrl}
                        onClick={() => copy(embedUrl)}
                      >
                        نسخ رابط Embed
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        عنوان البث
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="عنوان واضح ومختصر"
                        value={state.title}
                        onChange={(e) => setState({ ...state, title: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        موعد بدء البث (اختياري)
                      </label>
                      <input
                        type="datetime-local"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={state.startDate}
                        onChange={(e) => setState({ ...state, startDate: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      وصف البث
                    </label>
                    <textarea
                      rows={4}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="وصف مختصر"
                      value={state.description}
                      onChange={(e) => setState({ ...state, description: e.target.value })}
                    />
                  </div>

                  <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-gray-50 border">
                    <div>
                      <div className="text-sm font-semibold text-gray-900">البث مباشر الآن</div>
                      <div className="text-xs text-gray-600">
                        فعّلها عند بدء البث وأوقفها عند الانتهاء.
                      </div>
                    </div>

                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={state.isLive}
                        onChange={(e) => setState({ ...state, isLive: e.target.checked })}
                      />
                      <span
                        className={`w-12 h-7 flex items-center rounded-full p-1 transition ${
                          state.isLive ? "bg-green-500" : "bg-gray-300"
                        }`}
                      >
                        <span
                          className={`bg-white w-5 h-5 rounded-full shadow transform transition ${
                            state.isLive ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </span>
                    </label>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="submit"
                      className="bg-blue-600 text-white px-6 py-2.5 rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60"
                      disabled={saving}
                    >
                      {saving ? "جاري الحفظ..." : state.id ? "حفظ التعديلات" : "إنشاء بث جديد"}
                    </button>

                    <button
                      type="button"
                      className="px-6 py-2.5 rounded-xl border bg-white hover:bg-gray-50 text-gray-700"
                      onClick={() =>
                        setState({
                          id: null,
                          videoUrl: "",
                          title: "",
                          description: "",
                          isLive: false,
                          startDate: "",
                        })
                      }
                      disabled={saving}
                    >
                      مسح
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Preview */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h3 className="text-sm font-semibold text-gray-900">معاينة</h3>
                <div className="mt-3">
                  {videoId ? (
                    <div className="aspect-video rounded-2xl overflow-hidden border">
                      <iframe
                        className="w-full h-full"
                        src={`https://www.youtube.com/embed/${videoId}`}
                        title="YouTube preview"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  ) : (
                    <div className="text-sm text-gray-600 bg-gray-50 border rounded-2xl p-4">
                      أدخل رابط/ID صحيح لعرض المعاينة.
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">تعليمات سريعة</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                  <li>أنشئ بث مباشر على يوتيوب.</li>
                  <li>انسخ رابط الفيديو أو الـ ID.</li>
                  <li>الصقه هنا واضغط حفظ.</li>
                  <li>فعّل “البث مباشر” عند بدء البث.</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
