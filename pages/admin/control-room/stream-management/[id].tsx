import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  Radio,
  MessageSquare,
  Youtube,
  Loader2,
  Save,
  CheckCircle2,
  Pin,
  Trash2,
  Plus,
  Video,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import ControlRoomGate, { type ControlRoomAccessLevel } from "@/components/control-room/ControlRoomGate";
import ControlRoomShell from "@/components/control-room/ControlRoomShell";
import dasmBff from "@/lib/dasmBffClient";

/**
 * Session 29 — Stream management page in the Control Room.
 *
 * Lets moderators / admins:
 *  - Toggle chat_mode (youtube_only / dasm_only / both / none) live
 *  - Switch chat_layout (side / overlay / hidden)
 *  - Manage video sources (YouTube / HLS / RTMP)
 *  - Pin or delete chat messages
 *  - Send control_room_message announcements
 *
 * Backend endpoints (proxied via /api/dasm-proxy):
 *   GET /streams/{id}/config
 *   PATCH /moderator/streams/{id}/config
 *   GET /streams/{id}/video-sources
 *   POST /moderator/streams/{id}/video-sources
 *   PUT /moderator/streams/{id}/video-sources/{srcId}/activate
 *   GET /streams/{id}/chat
 *   DELETE /moderator/streams/{id}/chat/{msgId}
 *   POST /moderator/streams/{id}/chat/{msgId}/pin
 */

type ChatMode = "youtube_only" | "dasm_only" | "both" | "none";
type ChatLayout = "side" | "overlay" | "hidden";
type SourceType = "youtube" | "hls" | "rtmp_relay";

interface VideoSource {
  id: number | null;
  source_type: SourceType;
  url: string;
  priority: number;
  is_active: boolean;
  config: Record<string, unknown> | null;
}

interface StreamConfig {
  stream_id: number;
  title: string | null;
  is_live: boolean;
  chat_mode: ChatMode;
  chat_layout: ChatLayout;
  youtube_chat_enabled: boolean;
  dasm_chat_enabled: boolean;
  allow_bid_messages: boolean;
  moderation_enabled: boolean;
  youtube_chat_embed_url: string | null;
  auction_id: number | null;
  active_video_source: VideoSource | null;
}

interface ChatMessage {
  id: number;
  user_name: string | null;
  role: string;
  message_type: string;
  content: string;
  metadata: Record<string, unknown> | null;
  is_pinned: boolean;
  created_at: string;
}

const MODE_OPTIONS: { value: ChatMode; label: string; desc: string }[] = [
  { value: "dasm_only", label: "شات داسم فقط", desc: "رسائل + مزايدات نصية + حفظ في DB" },
  { value: "youtube_only", label: "شات يوتيوب فقط", desc: "تضمين iframe — لا يدعم المزايدة الرسمية" },
  { value: "both", label: "الاثنين معاً", desc: "داسم للمزايدة + يوتيوب للجمهور العام" },
  { value: "none", label: "إيقاف الشات", desc: "بث بدون شات" },
];

const LAYOUT_OPTIONS: { value: ChatLayout; label: string }[] = [
  { value: "side", label: "جانبي" },
  { value: "overlay", label: "فوق الفيديو" },
  { value: "hidden", label: "مخفي" },
];

const SOURCE_TYPE_LABEL: Record<SourceType, string> = {
  youtube: "YouTube Embed",
  hls: "HLS Playlist",
  rtmp_relay: "RTMP Relay",
};

function StreamMgmtBody({ streamId }: { streamId: number; access: ControlRoomAccessLevel }) {
  const [config, setConfig] = useState<StreamConfig | null>(null);
  const [sources, setSources] = useState<VideoSource[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New video source form
  const [newSourceType, setNewSourceType] = useState<SourceType>("youtube");
  const [newSourceUrl, setNewSourceUrl] = useState("");
  const [newSourcePriority, setNewSourcePriority] = useState(1);
  const [addingSource, setAddingSource] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [cfgRes, srcRes, chatRes] = await Promise.allSettled([
        dasmBff.get(`streams/${streamId}/config`),
        dasmBff.get(`streams/${streamId}/video-sources`),
        dasmBff.get(`streams/${streamId}/chat`),
      ]);
      if (cfgRes.status === "fulfilled") setConfig(cfgRes.value.data?.data ?? null);
      if (srcRes.status === "fulfilled") setSources(srcRes.value.data?.data ?? []);
      if (chatRes.status === "fulfilled") setMessages(chatRes.value.data?.data ?? []);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "تعذر تحميل البيانات");
    } finally {
      setLoading(false);
    }
  }, [streamId]);

  useEffect(() => {
    if (streamId) void loadAll();
  }, [streamId, loadAll]);

  const updateConfigField = (patch: Partial<StreamConfig>) => {
    setConfig((prev) => (prev ? { ...prev, ...patch } : prev));
  };

  const saveConfig = async () => {
    if (!config) return;
    setSaving(true);
    try {
      const res = await dasmBff.patch(`moderator/streams/${streamId}/config`, {
        chat_mode: config.chat_mode,
        chat_layout: config.chat_layout,
        allow_bid_messages: config.allow_bid_messages,
        moderation_enabled: config.moderation_enabled,
        youtube_chat_embed_url: config.youtube_chat_embed_url,
      });
      if (res.data?.data) setConfig(res.data.data);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2500);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "تعذر الحفظ");
    } finally {
      setSaving(false);
    }
  };

  const addSource = async () => {
    if (!newSourceUrl.trim()) return;
    setAddingSource(true);
    try {
      await dasmBff.post(`moderator/streams/${streamId}/video-sources`, {
        source_type: newSourceType,
        url: newSourceUrl.trim(),
        priority: newSourcePriority,
        is_active: true,
      });
      setNewSourceUrl("");
      void loadAll();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "تعذر إضافة المصدر");
    } finally {
      setAddingSource(false);
    }
  };

  const activateSource = async (sourceId: number) => {
    try {
      await dasmBff.put(`moderator/streams/${streamId}/video-sources/${sourceId}/activate`, {});
      void loadAll();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "تعذر التفعيل");
    }
  };

  const togglePin = async (msgId: number) => {
    try {
      await dasmBff.post(`moderator/streams/${streamId}/chat/${msgId}/pin`, {});
      void loadAll();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "تعذر التثبيت");
    }
  };

  const deleteMessage = async (msgId: number) => {
    if (!confirm("حذف الرسالة؟")) return;
    try {
      await dasmBff.delete(`moderator/streams/${streamId}/chat/${msgId}`);
      setMessages((prev) => prev.filter((m) => m.id !== msgId));
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "تعذر الحذف");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  if (!config) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center text-gray-500">
        لا يوجد بث بهذا المعرف
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Radio className="w-5 h-5 text-orange-600" />
            إدارة البث #{streamId}
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">{config.title ?? "بدون عنوان"}</p>
        </div>
        <div className="flex items-center gap-2">
          {config.is_live && (
            <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full px-3 py-1">
              <Radio className="w-3 h-3 animate-pulse" />
              مباشر
            </span>
          )}
          <button
            onClick={loadAll}
            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
          >
            <RefreshCw className="w-3 h-3" />
            تحديث
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2 text-sm text-red-700">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Chat Config Card ──────────────────────────────────────── */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">إعدادات الشات</h3>
              <p className="text-xs text-gray-500">قابلة للتبديل أثناء البث بدون deploy</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">وضع الشات</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {MODE_OPTIONS.map((opt) => {
                  const active = config.chat_mode === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => updateConfigField({ chat_mode: opt.value })}
                      className={`text-right px-3 py-2 rounded-xl border-2 transition-all ${
                        active
                          ? "bg-orange-50 border-orange-500 ring-2 ring-orange-200"
                          : "bg-gray-50 border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="font-semibold text-xs text-gray-900 mb-0.5">{opt.label}</div>
                      <p className="text-[10px] text-gray-500">{opt.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">تخطيط الشات</label>
              <div className="flex gap-2">
                {LAYOUT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => updateConfigField({ chat_layout: opt.value })}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-semibold ${
                      config.chat_layout === opt.value
                        ? "bg-orange-500 text-white border-orange-500"
                        : "bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {(config.chat_mode === "youtube_only" || config.chat_mode === "both") && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                  <Youtube className="w-4 h-4 text-red-500" />
                  رابط شات يوتيوب
                </label>
                <input
                  type="url"
                  value={config.youtube_chat_embed_url ?? ""}
                  onChange={(e) => updateConfigField({ youtube_chat_embed_url: e.target.value })}
                  placeholder="https://www.youtube.com/live_chat?v=VIDEO_ID&embed_domain=stream.dasm.com.sa"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-orange-500"
                />
              </div>
            )}

            <div className="space-y-2 border-t border-gray-100 pt-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.allow_bid_messages}
                  onChange={(e) => updateConfigField({ allow_bid_messages: e.target.checked })}
                  className="w-4 h-4 accent-orange-500"
                />
                <span className="text-xs text-gray-700">السماح بالمزايدة عبر الشات (داسم فقط)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.moderation_enabled}
                  onChange={(e) => updateConfigField({ moderation_enabled: e.target.checked })}
                  className="w-4 h-4 accent-orange-500"
                />
                <span className="text-xs text-gray-700">تفعيل أدوات الإشراف</span>
              </label>
            </div>

            <button
              onClick={saveConfig}
              disabled={saving}
              className="w-full bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 text-white text-sm font-semibold rounded-xl py-2.5 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : savedFlash ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  تم الحفظ
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  حفظ
                </>
              )}
            </button>
          </div>
        </div>

        {/* ── Video Sources Card ─────────────────────────────────────── */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <Video className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">مصادر الفيديو</h3>
              <p className="text-xs text-gray-500">YouTube / HLS / RTMP — قابلة للتبديل لايف</p>
            </div>
          </div>

          <div className="space-y-2 mb-4">
            {sources.length === 0 && (
              <div className="text-center text-xs text-gray-400 py-4 border border-dashed border-gray-200 rounded-lg">
                لا توجد مصادر فيديو مسجلة
              </div>
            )}
            {sources.map((s) => (
              <div
                key={s.id ?? s.url}
                className={`flex items-center justify-between gap-2 p-3 rounded-lg border ${
                  s.is_active ? "bg-emerald-50 border-emerald-300" : "bg-gray-50 border-gray-200"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-gray-900 flex items-center gap-1">
                    {SOURCE_TYPE_LABEL[s.source_type]}
                    <span className="text-[10px] text-gray-500">priority {s.priority}</span>
                    {s.is_active && (
                      <span className="text-[10px] bg-emerald-500 text-white px-1.5 rounded-full">نشط</span>
                    )}
                  </div>
                  <div className="text-[10px] text-gray-500 truncate" title={s.url}>
                    {s.url}
                  </div>
                </div>
                {!s.is_active && s.id && (
                  <button
                    onClick={() => activateSource(s.id!)}
                    className="text-[10px] px-2 py-1 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                  >
                    تفعيل
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="border-t border-gray-100 pt-4 space-y-2">
            <div className="text-xs font-semibold text-gray-700 flex items-center gap-1">
              <Plus className="w-3 h-3" /> إضافة مصدر جديد
            </div>
            <div className="flex gap-2">
              <select
                value={newSourceType}
                onChange={(e) => setNewSourceType(e.target.value as SourceType)}
                className="text-xs bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5"
              >
                <option value="youtube">YouTube</option>
                <option value="hls">HLS</option>
                <option value="rtmp_relay">RTMP Relay</option>
              </select>
              <input
                type="number"
                value={newSourcePriority}
                onChange={(e) => setNewSourcePriority(parseInt(e.target.value, 10) || 1)}
                min={1}
                max={100}
                className="w-16 text-xs bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5"
                title="الأولوية"
              />
            </div>
            <input
              type="url"
              value={newSourceUrl}
              onChange={(e) => setNewSourceUrl(e.target.value)}
              placeholder="رابط المصدر (https://...)"
              className="w-full text-xs bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500"
            />
            <button
              onClick={addSource}
              disabled={addingSource || !newSourceUrl.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg py-2 flex items-center justify-center gap-1 disabled:opacity-50"
            >
              {addingSource ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
              إضافة
            </button>
          </div>
        </div>
      </div>

      {/* ── Recent Chat Messages ──────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-orange-600" />
            <h3 className="text-lg font-bold text-gray-900">آخر رسائل الشات</h3>
          </div>
          <span className="text-xs text-gray-500">{messages.length} رسالة</span>
        </div>

        {messages.length === 0 ? (
          <div className="text-center text-xs text-gray-400 py-6">لا توجد رسائل بعد</div>
        ) : (
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {messages.slice().reverse().map((m) => (
              <div
                key={m.id}
                className={`flex items-start gap-2 p-2 rounded-lg ${
                  m.is_pinned ? "bg-orange-50 border border-orange-200" : "hover:bg-gray-50"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-semibold text-gray-900">{m.user_name ?? "زائر"}</span>
                    <span className="text-gray-400">·</span>
                    <span className="text-[10px] text-gray-500">{m.role}</span>
                    {m.message_type === "bid_message" && (
                      <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 rounded">مزايدة</span>
                    )}
                    <span className="text-[10px] text-gray-400 mr-auto">
                      {new Date(m.created_at).toLocaleTimeString("ar-SA", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className="text-sm text-gray-800 break-words">{m.content}</div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => togglePin(m.id)}
                    className={`p-1 rounded ${m.is_pinned ? "text-orange-600" : "text-gray-400 hover:text-orange-600"}`}
                    title={m.is_pinned ? "إلغاء التثبيت" : "تثبيت"}
                  >
                    <Pin className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => deleteMessage(m.id)}
                    className="p-1 rounded text-gray-400 hover:text-red-600"
                    title="حذف"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function StreamManagementPage() {
  const router = useRouter();
  const { id } = router.query;
  const streamId = id ? parseInt(String(id), 10) : null;

  return (
    <ControlRoomGate>
      {(access) => (
        <ControlRoomShell access={access}>
          {streamId ? (
            <StreamMgmtBody streamId={streamId} access={access} />
          ) : (
            <div className="text-center text-gray-500 py-20">معرف بث غير صالح</div>
          )}
        </ControlRoomShell>
      )}
    </ControlRoomGate>
  );
}
