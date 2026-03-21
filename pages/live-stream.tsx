import React, { useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout";
import { apiFetch, extractErrorMessage } from "../utils/api";
import {
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  LinkIcon,
  TrashIcon,
  PlayIcon,
  PauseIcon,
} from "@heroicons/react/24/outline";

/** يقبل: ID / watch / youtu.be / embed / live */
function normalizeYouTubeId(input: string): string | null {
  const raw = (input || "").trim();
  if (!raw) return null;

  // If user pasted just ID
  if (/^[a-zA-Z0-9_-]{8,20}$/.test(raw) && !raw.includes("http")) return raw;

  try {
    const url = new URL(raw);
    const v = url.searchParams.get("v");
    if (v) return v;

    if (url.hostname.includes("youtu.be")) {
      const id = url.pathname.replace("/", "").trim();
      return id || null;
    }

    const parts = url.pathname.split("/").filter(Boolean);

    // /embed/{id}
    const embedIndex = parts.findIndex((p) => p === "embed");
    if (embedIndex >= 0 && parts[embedIndex + 1]) return parts[embedIndex + 1];

    // /live/{id}
    const liveIndex = parts.findIndex((p) => p === "live");
    if (liveIndex >= 0 && parts[liveIndex + 1]) return parts[liveIndex + 1];

    return null;
  } catch {
    return null;
  }
}

function toDatetimeLocal(value?: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

function fromDatetimeLocal(value?: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

type AuctionLite = {
  id: number;
  status?: string;
  car?: any;
  [key: string]: any;
};

function extractAuctions(payload: any): AuctionLite[] {
  const d1 = payload?.data;
  if (Array.isArray(d1)) return d1;
  const d2 = d1?.data;
  if (Array.isArray(d2)) return d2;
  const d3 = d1?.data?.data;
  if (Array.isArray(d3)) return d3;
  if (Array.isArray(payload)) return payload;
  return [];
}

function auctionLabel(a: any): string {
  const id = a?.id ?? "—";
  const car = a?.car;
  const carName = car
    ? [car?.make, car?.brand, car?.model, car?.year].filter(Boolean).join(" ")
    : "";
  return carName ? `#${id} — ${carName}` : `#${id}`;
}

/** ✅ سويتش مضبوط (مش بيطلع برّه) */
function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label
      className={`relative inline-flex items-center select-none ${
        disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
      }`}
    >
      <input
        type="checkbox"
        className="sr-only peer"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />

      {/* Track */}
      <span className="block w-12 h-7 rounded-full bg-gray-300 peer-checked:bg-emerald-500 transition-colors" />

      {/* Thumb (مُثبت من اليمين ويتحرك للداخل) */}
      <span className="absolute top-0.5 right-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform peer-checked:-translate-x-5" />
    </label>
  );
}

type BroadcastState = {
  id: number | null;

  auctionId: string;
  title: string;
  description: string;

  youtubeInput: string;

  youtubeChatUrl: string;
  streamUrl: string;

  isLive: boolean;
  scheduledStart: string; // datetime-local
};

export default function LiveStream() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  const [auctions, setAuctions] = useState<AuctionLite[]>([]);
  const [auctionsLoading, setAuctionsLoading] = useState(false);
  const [auctionSearch, setAuctionSearch] = useState("");

  const [state, setState] = useState<BroadcastState>({
    id: null,
    auctionId: "",
    title: "",
    description: "",
    youtubeInput: "",
    youtubeChatUrl: "",
    streamUrl: "",
    isLive: false,
    scheduledStart: "",
  });

  const videoId = useMemo(() => normalizeYouTubeId(state.youtubeInput), [state.youtubeInput]);
  const embedUrl = useMemo(
    () => (videoId ? `https://www.youtube.com/embed/${videoId}` : ""),
    [videoId]
  );
  const watchUrl = useMemo(
    () => (videoId ? `https://www.youtube.com/watch?v=${videoId}` : ""),
    [videoId]
  );

  const filteredAuctions = useMemo(() => {
    const s = auctionSearch.trim().toLowerCase();
    if (!s) return auctions;
    return auctions.filter((a) => {
      const id = String(a?.id ?? "").toLowerCase();
      const label = auctionLabel(a).toLowerCase();
      return id.includes(s) || label.includes(s);
    });
  }, [auctions, auctionSearch]);

  async function loadAuctions() {
    setAuctionsLoading(true);
    try {
      const res: any = await apiFetch(`/admin/auctions?per_page=100`, { method: "GET" });
      setAuctions(extractAuctions(res));
    } catch {
      setAuctions([]);
    } finally {
      setAuctionsLoading(false);
    }
  }

  async function loadBroadcast() {
    setError(null);
    setOkMsg(null);
    setLoading(true);

    try {
      const res: any = await apiFetch("/admin/broadcast", { method: "GET" });
      const data = res?.data ?? null;

      if (!data) {
        setState({
          id: null,
          auctionId: "",
          title: "",
          description: "",
          youtubeInput: "",
          youtubeChatUrl: "",
          streamUrl: "",
          isLive: false,
          scheduledStart: "",
        });
        return;
      }

      setState({
        id: data?.id ? Number(data.id) : null,
        auctionId: data?.auction_id ? String(data.auction_id) : "",
        title: data?.title ?? "",
        description: data?.description ?? "",
        youtubeInput: data?.youtube_embed_url ?? data?.stream_url ?? "",
        youtubeChatUrl: data?.youtube_chat_embed_url ?? "",
        streamUrl: data?.stream_url ?? "",
        isLive: Boolean(data?.is_live ?? false),
        scheduledStart: toDatetimeLocal(data?.scheduled_start_time ?? null),
      });
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAuctions();
    loadBroadcast();
  }, []);

  function buildPayload(withId: boolean) {
    const vid = normalizeYouTubeId(state.youtubeInput);

    const youtube_embed_url = vid
      ? `https://www.youtube.com/embed/${vid}`
      : state.youtubeInput.trim()
      ? state.youtubeInput.trim()
      : null;

    const payload: any = {
      title: state.title.trim(),
      auction_id: state.auctionId ? Number(state.auctionId) : null,
      description: state.description?.trim() || null,
      stream_url: state.streamUrl?.trim() || null,
      youtube_embed_url,
      youtube_chat_embed_url: state.youtubeChatUrl?.trim() || null,
      scheduled_start_time: fromDatetimeLocal(state.scheduledStart),
      is_live: Boolean(state.isLive),
    };

    if (withId && state.id) payload.id = state.id;

    return payload;
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOkMsg(null);

    if (!state.title.trim()) {
      setError("من فضلك اكتب عنوان للبث.");
      return;
    }
    if (!state.auctionId.trim()) {
      setError("من فضلك اختر المزاد المرتبط بالبث.");
      return;
    }

    if (state.youtubeInput.trim() && !normalizeYouTubeId(state.youtubeInput)) {
      try {
        new URL(state.youtubeInput.trim());
      } catch {
        setError("رابط/معرف اليوتيوب غير صحيح.");
        return;
      }
    }

    setSaving(true);
    try {
      if (state.id) {
        await apiFetch(`/admin/broadcast`, {
          method: "PUT",
          body: JSON.stringify(buildPayload(true)),
        });
        setOkMsg("تم حفظ التعديلات بنجاح ✅");
      } else {
        const created: any = await apiFetch(`/admin/broadcast`, {
          method: "POST",
          body: JSON.stringify(buildPayload(false)),
        });
        const newId = created?.data?.id ?? null;
        if (newId) setState((s) => ({ ...s, id: Number(newId) }));
        setOkMsg("تم إنشاء البث بنجاح ✅");
      }

      await loadBroadcast();
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  async function toggleLive() {
    if (!state.id) {
      setError("لازم تحفظ البث الأول قبل تشغيله.");
      return;
    }

    setError(null);
    setOkMsg(null);
    setToggling(true);

    try {
      const next = !state.isLive;

      await apiFetch(`/admin/broadcast/status`, {
        method: "PUT",
        body: JSON.stringify({ id: state.id, is_live: next }),
      });

      setState((s) => ({ ...s, isLive: next }));
      setOkMsg(next ? "تم تشغيل البث ✅" : "تم إيقاف البث ✅");
      await loadBroadcast();
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setToggling(false);
    }
  }

  async function removeBroadcast() {
    if (!state.id) return;

    const ok = confirm("هل تريد حذف البث؟");
    if (!ok) return;

    setDeleting(true);
    setError(null);
    setOkMsg(null);

    try {
      await apiFetch(`/admin/broadcast/${state.id}`, { method: "DELETE" });

      setOkMsg("تم حذف البث بنجاح ✅");
      setState({
        id: null,
        auctionId: "",
        title: "",
        description: "",
        youtubeInput: "",
        youtubeChatUrl: "",
        streamUrl: "",
        isLive: false,
        scheduledStart: "",
      });
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setDeleting(false);
    }
  }

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setOkMsg("تم النسخ ✅");
      setTimeout(() => setOkMsg(null), 1200);
    } catch {
      setError("تعذر النسخ، انسخ يدويًا.");
    }
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50/60 p-4 sm:p-6 lg:p-8" dir="rtl">
        <div className="mx-auto max-w-6xl space-y-6">
          {/* Header */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900">إدارة البث</h1>
              <p className="text-sm text-gray-600 mt-1">إعداد بث واحد + معاينة + تشغيل/إيقاف.</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  loadAuctions();
                  loadBroadcast();
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 text-sm font-bold disabled:opacity-60"
                disabled={loading}
              >
                <ArrowPathIcon className="h-5 w-5" />
                تحديث
              </button>

              <button
                onClick={toggleLive}
                disabled={!state.id || toggling}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold disabled:opacity-60 ${
                  state.isLive
                    ? "bg-rose-600 hover:bg-rose-700 text-white"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white"
                }`}
                title="تشغيل/إيقاف"
              >
                {state.isLive ? <PauseIcon className="h-5 w-5" /> : <PlayIcon className="h-5 w-5" />}
                {toggling ? "..." : state.isLive ? "إيقاف" : "تشغيل"}
              </button>

              <button
                onClick={removeBroadcast}
                disabled={!state.id || deleting}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-gray-200 bg-white hover:bg-red-50 text-sm font-bold text-red-700 disabled:opacity-60"
                title="حذف"
              >
                <TrashIcon className="h-5 w-5" />
                حذف
              </button>
            </div>
          </div>

          {/* Alerts */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-2xl p-4 flex items-start gap-3">
              <ExclamationTriangleIcon className="h-6 w-6 mt-0.5" />
              <div className="text-sm font-semibold">{error}</div>
            </div>
          )}
          {okMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl p-4 flex items-start gap-3">
              <CheckCircleIcon className="h-6 w-6 mt-0.5" />
              <div className="text-sm font-semibold">{okMsg}</div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Form */}
            <div className="lg:col-span-3 bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
              {loading ? (
                <div className="text-gray-500">جاري التحميل...</div>
              ) : (
                <form onSubmit={save} className="space-y-5">
                  {/* Auction */}
                  <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div>
                        <div className="text-sm font-extrabold text-gray-900">المزاد</div>
                        <div className="text-xs text-gray-600 mt-1">اختر المزاد المرتبط بالبث.</div>
                      </div>

                      <button
                        type="button"
                        onClick={loadAuctions}
                        className="px-3 py-2 rounded-xl border bg-white hover:bg-gray-50 text-xs font-bold disabled:opacity-60"
                        disabled={auctionsLoading}
                      >
                        {auctionsLoading ? "جاري..." : "تحديث القائمة"}
                      </button>
                    </div>

                    {auctions.length > 0 ? (
                      <div className="mt-3 space-y-2">
                        <input
                          value={auctionSearch}
                          onChange={(e) => setAuctionSearch(e.target.value)}
                          placeholder="بحث سريع..."
                          className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 bg-white text-sm outline-none focus:ring-2 focus:ring-blue-200"
                        />

                        <select
                          value={state.auctionId}
                          onChange={(e) => setState({ ...state, auctionId: e.target.value })}
                          className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-white text-sm outline-none focus:ring-2 focus:ring-blue-200"
                        >
                          <option value="">— اختر —</option>
                          {filteredAuctions.map((a) => (
                            <option key={a.id} value={String(a.id)}>
                              {auctionLabel(a)}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className="mt-3">
                        <input
                          value={state.auctionId}
                          onChange={(e) => setState({ ...state, auctionId: e.target.value })}
                          placeholder="اكتب رقم المزاد"
                          className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-white text-sm outline-none focus:ring-2 focus:ring-blue-200"
                        />
                      </div>
                    )}
                  </div>

                  {/* YouTube */}
                  <div>
                    <label className="block text-sm font-extrabold text-gray-900 mb-2">
                      رابط/معرف اليوتيوب (اختياري)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        className="w-full pl-4 pr-11 py-3 border border-gray-200 rounded-2xl bg-white outline-none focus:ring-2 focus:ring-blue-200"
                        placeholder="رابط الفيديو أو المعرف"
                        value={state.youtubeInput}
                        onChange={(e) => setState({ ...state, youtubeInput: e.target.value })}
                      />
                      <LinkIcon className="h-5 w-5 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2" />
                    </div>

                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="px-3 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-bold disabled:opacity-60"
                        disabled={!watchUrl}
                        onClick={() => copy(watchUrl)}
                      >
                        نسخ رابط المشاهدة
                      </button>
                      <button
                        type="button"
                        className="px-3 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-bold disabled:opacity-60"
                        disabled={!embedUrl}
                        onClick={() => copy(embedUrl)}
                      >
                        نسخ رابط المعاينة
                      </button>
                    </div>
                  </div>

                  {/* Title + Scheduled */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-extrabold text-gray-900 mb-2">العنوان</label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 border border-gray-200 rounded-2xl bg-white outline-none focus:ring-2 focus:ring-blue-200"
                        placeholder="عنوان واضح ومختصر"
                        value={state.title}
                        onChange={(e) => setState({ ...state, title: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-extrabold text-gray-900 mb-2">
                        موعد البدء (اختياري)
                      </label>
                      <input
                        type="datetime-local"
                        className="w-full px-4 py-3 border border-gray-200 rounded-2xl bg-white outline-none focus:ring-2 focus:ring-blue-200"
                        value={state.scheduledStart}
                        onChange={(e) => setState({ ...state, scheduledStart: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-extrabold text-gray-900 mb-2">الوصف</label>
                    <textarea
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-200 rounded-2xl bg-white outline-none focus:ring-2 focus:ring-blue-200"
                      placeholder="وصف مختصر"
                      value={state.description}
                      onChange={(e) => setState({ ...state, description: e.target.value })}
                    />
                  </div>

                  {/* Optional URLs */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-extrabold text-gray-900 mb-2">
                        رابط المحادثة (اختياري)
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 border border-gray-200 rounded-2xl bg-white outline-none focus:ring-2 focus:ring-blue-200"
                        placeholder="اختياري"
                        value={state.youtubeChatUrl}
                        onChange={(e) => setState({ ...state, youtubeChatUrl: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-extrabold text-gray-900 mb-2">
                        رابط البث (اختياري)
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 border border-gray-200 rounded-2xl bg-white outline-none focus:ring-2 focus:ring-blue-200"
                        placeholder="اختياري"
                        value={state.streamUrl}
                        onChange={(e) => setState({ ...state, streamUrl: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Live Switch (✅ تم إصلاحه) */}
                  <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                    <div>
                      <div className="text-sm font-extrabold text-gray-900">البث مباشر الآن</div>
                      <div className="text-xs text-gray-600 mt-1">فعّلها عند بدء البث وأوقفها عند الانتهاء.</div>
                    </div>

                    <Toggle
                      checked={state.isLive}
                      onChange={(v) => setState({ ...state, isLive: v })}
                      disabled={saving}
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <button
                      type="submit"
                      className="bg-blue-600 text-white px-6 py-3 rounded-2xl hover:bg-blue-700 disabled:opacity-60 text-sm font-extrabold"
                      disabled={saving}
                    >
                      {saving ? "جاري الحفظ..." : state.id ? "حفظ" : "إنشاء"}
                    </button>

                    <button
                      type="button"
                      className="px-6 py-3 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-900 text-sm font-extrabold disabled:opacity-60"
                      onClick={() =>
                        setState((s) => ({
                          ...s,
                          title: "",
                          description: "",
                          youtubeInput: "",
                          youtubeChatUrl: "",
                          streamUrl: "",
                          isLive: false,
                          scheduledStart: "",
                        }))
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
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-gray-900">معاينة</h3>
                  {state.isLive ? (
                    <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                      مباشر
                    </span>
                  ) : (
                    <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-gray-50 text-gray-700 border border-gray-200">
                      غير مباشر
                    </span>
                  )}
                </div>

                <div className="mt-3">
                  {videoId ? (
                    <div className="aspect-video rounded-2xl overflow-hidden border border-gray-100 bg-black">
                      <iframe
                        className="w-full h-full"
                        src={`https://www.youtube.com/embed/${videoId}`}
                        title="YouTube preview"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  ) : (
                    <div className="text-sm text-gray-600 bg-gray-50 border border-gray-100 rounded-2xl p-4">
                      أدخل رابط/معرف صحيح لعرض المعاينة.
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-sm font-extrabold text-gray-900 mb-3">خطوات سريعة</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                  <li>اختَر المزاد.</li>
                  <li>أضف رابط اليوتيوب (اختياري).</li>
                  <li>اكتب العنوان والوصف.</li>
                  <li>احفظ، ثم شغّل/أوقف حسب الحاجة.</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
