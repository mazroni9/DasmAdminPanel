import { useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout";
import {
  ArrowPathIcon,
  PauseIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";
import { apiFetch, extractErrorMessage } from "../utils/api";

type AnyObj = Record<string, any>;

interface SystemSettings {
  appSettings: {
    appName: string;
    appUrl: string;
    frontendUrl: string;
    appLocale: "ar" | "en";
    debugMode: boolean;
    maintenanceMode: boolean;
  };
  databaseSettings: {
    connectionType: string;
    maxConnections: number;
    backupEnabled: boolean;
    backupFrequency: "daily" | "weekly" | "monthly";
  };
  mailSettings: {
    provider: string;
    fromName: string;
    fromAddress: string;
    encryptionType: string;
    notificationTypes: {
      userRegistration: boolean;
      auctionStart: boolean;
      bidPlaced: boolean;
      auctionEnd: boolean;
      paymentReceived: boolean;
    };
  };
  mediaSettings: {
    provider: "local" | "cloudinary" | "s3";
    maxFileSize: number;
    allowedFileTypes: string[];
    imageQuality: number;
    storageQuota: number;
  };
  securitySettings: {
    sessionLifetime: number;
    sessionEncryption: boolean;
    passwordMinLength: number;
    requireTwoFactor: boolean;
    loginAttempts: number;
    ipBlocking: boolean;
  };
  businessSettings: {
    currency: string;
    timezone: string;
    vatRate: number;
    commissionRate: number;
    minBidIncrement: number;
    autoExtendTime: number;
    paymentMethods: string[];
  };
  integrationSettings: {
    smsEnabled: boolean;
    smsProvider: string;
    paymentGateways: string[];
    analyticsEnabled: boolean;
    analyticsProvider: string;
  };
  auditSettings: {
    logRetentionDays: number;
    detailedLogging: boolean;
    activityTracking: boolean;
    errorReporting: boolean;
    performanceMonitoring: boolean;
  };
}

function defaultSettings(): SystemSettings {
  return {
    appSettings: {
      appName: "DASM Platform",
      appUrl: (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000").replace(/\/$/, ""),
      frontendUrl: typeof window !== "undefined" ? window.location.origin : "",
      appLocale: "ar",
      debugMode: false,
      maintenanceMode: false,
    },
    databaseSettings: {
      connectionType: "pgsql",
      maxConnections: 100,
      backupEnabled: true,
      backupFrequency: "daily",
    },
    mailSettings: {
      provider: "smtp",
      fromName: "DASM Platform",
      fromAddress: "notifications@dasm-platform.com",
      encryptionType: "tls",
      notificationTypes: {
        userRegistration: true,
        auctionStart: true,
        bidPlaced: true,
        auctionEnd: true,
        paymentReceived: true,
      },
    },
    mediaSettings: {
      provider: "cloudinary",
      maxFileSize: 10,
      allowedFileTypes: ["jpg", "jpeg", "png", "pdf"],
      imageQuality: 80,
      storageQuota: 1000,
    },
    securitySettings: {
      sessionLifetime: 120,
      sessionEncryption: true,
      passwordMinLength: 8,
      requireTwoFactor: false,
      loginAttempts: 5,
      ipBlocking: true,
    },
    businessSettings: {
      currency: "SAR",
      timezone: "Asia/Riyadh",
      vatRate: 15,
      commissionRate: 2.5,
      minBidIncrement: 100,
      autoExtendTime: 5,
      paymentMethods: ["bank_transfer", "credit_card", "mada"],
    },
    integrationSettings: {
      smsEnabled: true,
      smsProvider: "twilio",
      paymentGateways: ["stripe", "paypal"],
      analyticsEnabled: true,
      analyticsProvider: "google_analytics",
    },
    auditSettings: {
      logRetentionDays: 90,
      detailedLogging: true,
      activityTracking: true,
      errorReporting: true,
      performanceMonitoring: true,
    },
  };
}

function isPlainObject(v: any): v is AnyObj {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function normalizeSettingsResponse(res: any): AnyObj {
  // possibilities:
  // 1) { settings: {...} }
  // 2) direct object {...}
  // 3) array [{key, value}] or [{name, value}]
  // 4) { data: ... }
  if (!res) return {};
  if (isPlainObject(res?.settings)) return res.settings;
  if (isPlainObject(res?.data?.settings)) return res.data.settings;
  if (isPlainObject(res?.data) && !Array.isArray(res.data)) return res.data;
  if (isPlainObject(res) && !Array.isArray(res)) return res;

  if (Array.isArray(res?.data)) {
    // array of kv
    const out: AnyObj = {};
    for (const item of res.data) {
      const k = item?.key ?? item?.name;
      if (k) out[String(k)] = item?.value;
    }
    return out;
  }

  if (Array.isArray(res)) {
    const out: AnyObj = {};
    for (const item of res) {
      const k = item?.key ?? item?.name;
      if (k) out[String(k)] = item?.value;
    }
    return out;
  }

  return {};
}

function mergeDefaultsWithServer(defaults: SystemSettings, serverObj: AnyObj): SystemSettings {
  // إذا السيرفر بيبعت نفس الهيكل nested: نستخدمه مباشرة مع fallback defaults
  if (isPlainObject(serverObj?.appSettings) || isPlainObject(serverObj?.mailSettings)) {
    return {
      ...defaults,
      ...serverObj,
      appSettings: { ...defaults.appSettings, ...(serverObj.appSettings || {}) },
      databaseSettings: { ...defaults.databaseSettings, ...(serverObj.databaseSettings || {}) },
      mailSettings: {
        ...defaults.mailSettings,
        ...(serverObj.mailSettings || {}),
        notificationTypes: {
          ...defaults.mailSettings.notificationTypes,
          ...((serverObj.mailSettings || {}).notificationTypes || {}),
        },
      },
      mediaSettings: { ...defaults.mediaSettings, ...(serverObj.mediaSettings || {}) },
      securitySettings: { ...defaults.securitySettings, ...(serverObj.securitySettings || {}) },
      businessSettings: { ...defaults.businessSettings, ...(serverObj.businessSettings || {}) },
      integrationSettings: { ...defaults.integrationSettings, ...(serverObj.integrationSettings || {}) },
      auditSettings: { ...defaults.auditSettings, ...(serverObj.auditSettings || {}) },
    };
  }

  // لو السيرفر بيرجع flat keys: نعمل mapping بسيط (لو موجود)
  const s = serverObj || {};
  const mapped: SystemSettings = {
    ...defaults,
    appSettings: {
      ...defaults.appSettings,
      appName: s.app_name ?? s.appName ?? defaults.appSettings.appName,
      appUrl: s.app_url ?? s.appUrl ?? defaults.appSettings.appUrl,
      frontendUrl: s.frontend_url ?? s.frontendUrl ?? defaults.appSettings.frontendUrl,
      appLocale: (s.app_locale ?? s.appLocale ?? defaults.appSettings.appLocale) as "ar" | "en",
      debugMode: Boolean(s.debug_mode ?? s.debugMode ?? defaults.appSettings.debugMode),
      maintenanceMode: Boolean(s.maintenance_mode ?? s.maintenanceMode ?? defaults.appSettings.maintenanceMode),
    },
    businessSettings: {
      ...defaults.businessSettings,
      currency: s.currency ?? defaults.businessSettings.currency,
      timezone: s.timezone ?? defaults.businessSettings.timezone,
      vatRate: Number(s.vat_rate ?? defaults.businessSettings.vatRate),
      commissionRate: Number(s.commission_rate ?? defaults.businessSettings.commissionRate),
      minBidIncrement: Number(s.min_bid_increment ?? defaults.businessSettings.minBidIncrement),
      autoExtendTime: Number(s.auto_extend_time ?? defaults.businessSettings.autoExtendTime),
      paymentMethods: Array.isArray(s.payment_methods) ? s.payment_methods : defaults.businessSettings.paymentMethods,
    },
  };

  // باقي الأقسام: لو لقيت object بنفس الاسم نخليه
  if (isPlainObject(s.mailSettings)) mapped.mailSettings = mergeDefaultsWithServer(defaults, { mailSettings: s.mailSettings }).mailSettings;
  if (isPlainObject(s.securitySettings)) mapped.securitySettings = mergeDefaultsWithServer(defaults, { securitySettings: s.securitySettings }).securitySettings;
  if (isPlainObject(s.integrationSettings)) mapped.integrationSettings = mergeDefaultsWithServer(defaults, { integrationSettings: s.integrationSettings }).integrationSettings;
  if (isPlainObject(s.databaseSettings)) mapped.databaseSettings = mergeDefaultsWithServer(defaults, { databaseSettings: s.databaseSettings }).databaseSettings;
  if (isPlainObject(s.mediaSettings)) mapped.mediaSettings = mergeDefaultsWithServer(defaults, { mediaSettings: s.mediaSettings }).mediaSettings;
  if (isPlainObject(s.auditSettings)) mapped.auditSettings = mergeDefaultsWithServer(defaults, { auditSettings: s.auditSettings }).auditSettings;

  return mapped;
}

function deepEqual(a: any, b: any): boolean {
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
}

export default function Settings() {
  const [settings, setSettings] = useState<SystemSettings>(() => defaultSettings());
  const [serverRaw, setServerRaw] = useState<AnyObj>({});
  const [rawJson, setRawJson] = useState<string>("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [activeTab, setActiveTab] = useState<
    "app" | "mail" | "security" | "business" | "integrations" | "advanced"
  >("app");

  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // advanced actions
  const [diagToken, setDiagToken] = useState<string>("");

  const defaults = useMemo(() => defaultSettings(), []);

  const dirty = useMemo(() => {
    // Compare with last loaded server shape mapped into SystemSettings
    const serverMapped = mergeDefaultsWithServer(defaults, serverRaw);
    return !deepEqual(settings, serverMapped);
  }, [settings, serverRaw, defaults]);

  async function loadFromServer() {
    setLoading(true);
    setToast(null);
    try {
      const res = await apiFetch<any>("/admin/settings", { method: "GET" });
      const normalized = normalizeSettingsResponse(res);
      setServerRaw(normalized);

      const merged = mergeDefaultsWithServer(defaults, normalized);
      setSettings(merged);
      setRawJson(JSON.stringify(normalized, null, 2));
    } catch (e) {
      setToast({ type: "error", msg: extractErrorMessage(e) });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFromServer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // keep rawJson in sync (but don’t override user typing while advanced tab open)
  useEffect(() => {
    if (activeTab !== "advanced") {
      try {
        setRawJson(JSON.stringify(serverRaw, null, 2));
      } catch {
        // ignore
      }
    }
  }, [serverRaw, activeTab]);

  async function saveToServer() {
    setSaving(true);
    setToast(null);

    try {
      // payload الأكثر أمانًا: { settings: <nested settings> }
      // ومعاه كمان raw (لو السيرفر بيرجع flat) — لكن بدون تعديل باك اند:
      // هنرسل nested داخل settings.
      const payload1 = { settings };

      try {
        await apiFetch("/admin/settings", { method: "PUT", body: payload1 });
      } catch (e1) {
        // fallback: send direct (بعض المشاريع متوقعة body = settings مباشرة)
        await apiFetch("/admin/settings", { method: "PUT", body: settings });
      }

      setToast({ type: "success", msg: "تم حفظ الإعدادات بنجاح" });
      await loadFromServer();
    } catch (e) {
      setToast({ type: "error", msg: extractErrorMessage(e) });
    } finally {
      setSaving(false);
    }
  }

  async function applyRawJson() {
    try {
      const parsed = JSON.parse(rawJson);
      setServerRaw(parsed);

      const merged = mergeDefaultsWithServer(defaults, parsed);
      setSettings(merged);

      setToast({ type: "success", msg: "تم تطبيق الـ Raw JSON على الواجهة" });
    } catch {
      setToast({ type: "error", msg: "JSON غير صالح — راجع الصيغة" });
    }
  }

  async function runDiagReload() {
    if (!diagToken) {
      setToast({ type: "error", msg: "أدخل DIAG_TOKEN أولاً لتنفيذ إعادة تحميل الكاش" });
      return;
    }
    try {
      await apiFetch("/diag-reload", {
        method: "POST",
        headers: {
          "X-Diag-Token": diagToken,
        },
      });
      setToast({ type: "success", msg: "تم تنظيف config/cache/routes بنجاح" });
    } catch (e) {
      setToast({ type: "error", msg: extractErrorMessage(e) });
    }
  }

  const SectionCard = ({ title, desc, children }: { title: string; desc?: string; children: any }) => (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="mb-5">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {desc && <p className="text-sm text-gray-500 mt-1">{desc}</p>}
      </div>
      {children}
    </div>
  );

  if (loading) {
    return (
      <Layout title="إعدادات النظام">
        <div className="min-h-screen bg-gray-50/50 p-4 sm:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-pulse space-y-4">
              <div className="h-6 bg-gray-100 rounded w-1/3" />
              <div className="h-10 bg-gray-100 rounded" />
              <div className="h-10 bg-gray-100 rounded" />
              <div className="h-10 bg-gray-100 rounded" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="إعدادات النظام">
      <div className="min-h-screen bg-gray-50/50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Toast */}
          {toast && (
            <div
              className={`rounded-2xl border p-4 text-sm flex items-start gap-3 ${
                toast.type === "success"
                  ? "border-green-200 bg-green-50 text-green-800"
                  : "border-red-200 bg-red-50 text-red-800"
              }`}
            >
              {toast.type === "success" ? (
                <CheckCircleIcon className="h-5 w-5 mt-0.5" />
              ) : (
                <ExclamationTriangleIcon className="h-5 w-5 mt-0.5" />
              )}
              <div className="flex-1">{toast.msg}</div>
              <button
                onClick={() => setToast(null)}
                className="text-xs px-2 py-1 rounded-lg hover:bg-black/5"
              >
                إغلاق
              </button>
            </div>
          )}

          {/* Header */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                  <Cog6ToothIcon className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">إعدادات النظام</h1>
                  <p className="text-sm text-gray-500 mt-1">
                    تعديل إعدادات المنصة وربطها مباشرة بالباك اند (Laravel).
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 justify-end">
                <button
                  onClick={loadFromServer}
                  className="px-4 py-2 rounded-xl text-sm font-medium bg-white border border-gray-200 hover:bg-gray-50"
                >
                  تحديث من السيرفر
                </button>

                <button
                  onClick={saveToServer}
                  disabled={saving || !dirty}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600"
                >
                  {saving ? "جارِ الحفظ..." : dirty ? "حفظ التغييرات" : "محفوظ"}
                </button>
              </div>
            </div>

            {dirty && (
              <div className="mt-4 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3">
                يوجد تغييرات غير محفوظة.
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="border-b border-gray-100 bg-gray-50">
              <nav className="flex flex-wrap">
                {[
                  { id: "app", label: "النظام" },
                  { id: "mail", label: "البريد" },
                  { id: "security", label: "الأمان" },
                  { id: "business", label: "الأعمال" },
                  { id: "integrations", label: "التكامل" },
                  { id: "advanced", label: "متقدم" },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id as any)}
                    className={`px-5 py-4 text-sm font-medium border-b-2 transition ${
                      activeTab === (t.id as any)
                        ? "border-indigo-600 text-indigo-700 bg-white"
                        : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-white/60"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-6">
              {activeTab === "app" && (
                <SectionCard title="إعدادات النظام الأساسية" desc="إعدادات عامة تؤثر على تجربة التطبيق.">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">اسم التطبيق</label>
                      <input
                        type="text"
                        value={settings.appSettings.appName}
                        onChange={(e) =>
                          setSettings((s) => ({
                            ...s,
                            appSettings: { ...s.appSettings, appName: e.target.value },
                          }))
                        }
                        className="mt-2 w-full rounded-xl border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">رابط السيرفر</label>
                      <input
                        type="url"
                        value={settings.appSettings.appUrl}
                        onChange={(e) =>
                          setSettings((s) => ({
                            ...s,
                            appSettings: { ...s.appSettings, appUrl: e.target.value },
                          }))
                        }
                        className="mt-2 w-full rounded-xl border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">رابط الواجهة</label>
                      <input
                        type="url"
                        value={settings.appSettings.frontendUrl}
                        onChange={(e) =>
                          setSettings((s) => ({
                            ...s,
                            appSettings: { ...s.appSettings, frontendUrl: e.target.value },
                          }))
                        }
                        className="mt-2 w-full rounded-xl border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">اللغة</label>
                      <select
                        value={settings.appSettings.appLocale}
                        onChange={(e) =>
                          setSettings((s) => ({
                            ...s,
                            appSettings: { ...s.appSettings, appLocale: e.target.value as "ar" | "en" },
                          }))
                        }
                        className="mt-2 w-full rounded-xl border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="ar">العربية</option>
                        <option value="en">English</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={settings.appSettings.debugMode}
                        onChange={(e) =>
                          setSettings((s) => ({
                            ...s,
                            appSettings: { ...s.appSettings, debugMode: e.target.checked },
                          }))
                        }
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900">وضع التطوير</p>
                        <p className="text-xs text-gray-500">يفضل إيقافه في الإنتاج.</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={settings.appSettings.maintenanceMode}
                        onChange={(e) =>
                          setSettings((s) => ({
                            ...s,
                            appSettings: { ...s.appSettings, maintenanceMode: e.target.checked },
                          }))
                        }
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900">وضع الصيانة</p>
                        <p className="text-xs text-gray-500">إظهار صفحة صيانة للمستخدمين.</p>
                      </div>
                    </div>
                  </div>
                </SectionCard>
              )}

              {activeTab === "mail" && (
                <SectionCard title="إعدادات البريد الإلكتروني" desc="إدارة المرسل والإشعارات المرتبطة بالبريد.">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">مزود البريد</label>
                      <select
                        value={settings.mailSettings.provider}
                        onChange={(e) =>
                          setSettings((s) => ({
                            ...s,
                            mailSettings: { ...s.mailSettings, provider: e.target.value },
                          }))
                        }
                        className="mt-2 w-full rounded-xl border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="smtp">SMTP</option>
                        <option value="mailgun">Mailgun</option>
                        <option value="ses">Amazon SES</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Encryption</label>
                      <select
                        value={settings.mailSettings.encryptionType}
                        onChange={(e) =>
                          setSettings((s) => ({
                            ...s,
                            mailSettings: { ...s.mailSettings, encryptionType: e.target.value },
                          }))
                        }
                        className="mt-2 w-full rounded-xl border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="tls">TLS</option>
                        <option value="ssl">SSL</option>
                        <option value="none">None</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">اسم المرسل</label>
                      <input
                        type="text"
                        value={settings.mailSettings.fromName}
                        onChange={(e) =>
                          setSettings((s) => ({
                            ...s,
                            mailSettings: { ...s.mailSettings, fromName: e.target.value },
                          }))
                        }
                        className="mt-2 w-full rounded-xl border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">بريد المرسل</label>
                      <input
                        type="email"
                        value={settings.mailSettings.fromAddress}
                        onChange={(e) =>
                          setSettings((s) => ({
                            ...s,
                            mailSettings: { ...s.mailSettings, fromAddress: e.target.value },
                          }))
                        }
                        className="mt-2 w-full rounded-xl border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <p className="text-sm font-medium text-gray-900 mb-2">إشعارات البريد</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {(
                          Object.entries(settings.mailSettings.notificationTypes) as Array<
                            [keyof SystemSettings["mailSettings"]["notificationTypes"], boolean]
                          >
                        ).map(([key, value]) => (
                          <label
                            key={String(key)}
                            className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 hover:bg-gray-50"
                          >
                            <input
                              type="checkbox"
                              checked={value}
                              onChange={(e) =>
                                setSettings((s) => ({
                                  ...s,
                                  mailSettings: {
                                    ...s.mailSettings,
                                    notificationTypes: {
                                      ...s.mailSettings.notificationTypes,
                                      [key]: e.target.checked,
                                    },
                                  },
                                }))
                              }
                              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="text-sm text-gray-800">
                              {key === "userRegistration" && "تسجيل مستخدم جديد"}
                              {key === "auctionStart" && "بدء مزاد"}
                              {key === "bidPlaced" && "تقديم عرض"}
                              {key === "auctionEnd" && "انتهاء مزاد"}
                              {key === "paymentReceived" && "استلام دفعة"}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </SectionCard>
              )}

              {activeTab === "security" && (
                <SectionCard title="إعدادات الأمان" desc="تحكم في سياسات الجلسات ومحاولات الدخول.">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">مدة الجلسة (دقائق)</label>
                      <input
                        type="number"
                        value={settings.securitySettings.sessionLifetime}
                        onChange={(e) =>
                          setSettings((s) => ({
                            ...s,
                            securitySettings: { ...s.securitySettings, sessionLifetime: Number(e.target.value) },
                          }))
                        }
                        className="mt-2 w-full rounded-xl border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">عدد محاولات الدخول</label>
                      <input
                        type="number"
                        value={settings.securitySettings.loginAttempts}
                        onChange={(e) =>
                          setSettings((s) => ({
                            ...s,
                            securitySettings: { ...s.securitySettings, loginAttempts: Number(e.target.value) },
                          }))
                        }
                        className="mt-2 w-full rounded-xl border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">أقل طول لكلمة المرور</label>
                      <input
                        type="number"
                        value={settings.securitySettings.passwordMinLength}
                        onChange={(e) =>
                          setSettings((s) => ({
                            ...s,
                            securitySettings: { ...s.securitySettings, passwordMinLength: Number(e.target.value) },
                          }))
                        }
                        className="mt-2 w-full rounded-xl border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={settings.securitySettings.requireTwoFactor}
                        onChange={(e) =>
                          setSettings((s) => ({
                            ...s,
                            securitySettings: { ...s.securitySettings, requireTwoFactor: e.target.checked },
                          }))
                        }
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900">المصادقة الثنائية</p>
                        <p className="text-xs text-gray-500">مناسبة للحسابات الحساسة.</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={settings.securitySettings.ipBlocking}
                        onChange={(e) =>
                          setSettings((s) => ({
                            ...s,
                            securitySettings: { ...s.securitySettings, ipBlocking: e.target.checked },
                          }))
                        }
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900">حظر IP المشبوه</p>
                        <p className="text-xs text-gray-500">يقلل هجمات brute-force.</p>
                      </div>
                    </div>
                  </div>
                </SectionCard>
              )}

              {activeTab === "business" && (
                <SectionCard title="إعدادات الأعمال" desc="العملة والضرائب والعمولات وسياسة المزايدة.">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">العملة</label>
                      <input
                        type="text"
                        value={settings.businessSettings.currency}
                        onChange={(e) =>
                          setSettings((s) => ({
                            ...s,
                            businessSettings: { ...s.businessSettings, currency: e.target.value },
                          }))
                        }
                        className="mt-2 w-full rounded-xl border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">المنطقة الزمنية</label>
                      <input
                        type="text"
                        value={settings.businessSettings.timezone}
                        onChange={(e) =>
                          setSettings((s) => ({
                            ...s,
                            businessSettings: { ...s.businessSettings, timezone: e.target.value },
                          }))
                        }
                        className="mt-2 w-full rounded-xl border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">ضريبة القيمة المضافة (%)</label>
                      <input
                        type="number"
                        value={settings.businessSettings.vatRate}
                        onChange={(e) =>
                          setSettings((s) => ({
                            ...s,
                            businessSettings: { ...s.businessSettings, vatRate: Number(e.target.value) },
                          }))
                        }
                        className="mt-2 w-full rounded-xl border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">العمولة (%)</label>
                      <input
                        type="number"
                        value={settings.businessSettings.commissionRate}
                        onChange={(e) =>
                          setSettings((s) => ({
                            ...s,
                            businessSettings: { ...s.businessSettings, commissionRate: Number(e.target.value) },
                          }))
                        }
                        className="mt-2 w-full rounded-xl border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">أقل زيادة للمزايدة</label>
                      <input
                        type="number"
                        value={settings.businessSettings.minBidIncrement}
                        onChange={(e) =>
                          setSettings((s) => ({
                            ...s,
                            businessSettings: { ...s.businessSettings, minBidIncrement: Number(e.target.value) },
                          }))
                        }
                        className="mt-2 w-full rounded-xl border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Auto Extend (دقائق)</label>
                      <input
                        type="number"
                        value={settings.businessSettings.autoExtendTime}
                        onChange={(e) =>
                          setSettings((s) => ({
                            ...s,
                            businessSettings: { ...s.businessSettings, autoExtendTime: Number(e.target.value) },
                          }))
                        }
                        className="mt-2 w-full rounded-xl border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">طرق الدفع</label>
                      <select
                        multiple
                        value={settings.businessSettings.paymentMethods}
                        onChange={(e) => {
                          const values = Array.from(e.target.selectedOptions, (o) => o.value);
                          setSettings((s) => ({
                            ...s,
                            businessSettings: { ...s.businessSettings, paymentMethods: values },
                          }));
                        }}
                        className="mt-2 w-full rounded-xl border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 min-h-[120px]"
                      >
                        <option value="bank_transfer">تحويل بنكي</option>
                        <option value="credit_card">بطاقة ائتمان</option>
                        <option value="mada">مدى</option>
                        <option value="stc_pay">STC Pay</option>
                        <option value="apple_pay">Apple Pay</option>
                      </select>
                      <p className="text-xs text-gray-500 mt-2">
                        Tip: اضغط Ctrl/⌘ لاختيار أكثر من طريقة.
                      </p>
                    </div>
                  </div>
                </SectionCard>
              )}

              {activeTab === "integrations" && (
                <SectionCard title="التكامل" desc="SMS, Payment gateways, Analytics.">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <label className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={settings.integrationSettings.smsEnabled}
                        onChange={(e) =>
                          setSettings((s) => ({
                            ...s,
                            integrationSettings: { ...s.integrationSettings, smsEnabled: e.target.checked },
                          }))
                        }
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900">تفعيل SMS</p>
                        <p className="text-xs text-gray-500">رسائل التحقق والتنبيهات.</p>
                      </div>
                    </label>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">مزود SMS</label>
                      <select
                        value={settings.integrationSettings.smsProvider}
                        onChange={(e) =>
                          setSettings((s) => ({
                            ...s,
                            integrationSettings: { ...s.integrationSettings, smsProvider: e.target.value },
                          }))
                        }
                        className="mt-2 w-full rounded-xl border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="twilio">Twilio</option>
                        <option value="messagebird">MessageBird</option>
                        <option value="unifonic">Unifonic</option>
                      </select>
                    </div>

                    <label className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={settings.integrationSettings.analyticsEnabled}
                        onChange={(e) =>
                          setSettings((s) => ({
                            ...s,
                            integrationSettings: { ...s.integrationSettings, analyticsEnabled: e.target.checked },
                          }))
                        }
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Analytics</p>
                        <p className="text-xs text-gray-500">تتبع استخدام المنصة.</p>
                      </div>
                    </label>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">مزود Analytics</label>
                      <input
                        type="text"
                        value={settings.integrationSettings.analyticsProvider}
                        onChange={(e) =>
                          setSettings((s) => ({
                            ...s,
                            integrationSettings: { ...s.integrationSettings, analyticsProvider: e.target.value },
                          }))
                        }
                        className="mt-2 w-full rounded-xl border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </SectionCard>
              )}

              {activeTab === "advanced" && (
                <div className="space-y-6">
                  <SectionCard
                    title="Raw Settings JSON"
                    desc="لو الـ backend بيرجع شكل مختلف، تقدر تعدله هنا وتطبقه على الواجهة."
                  >
                    <textarea
                      value={rawJson}
                      onChange={(e) => setRawJson(e.target.value)}
                      className="w-full min-h-[260px] font-mono text-xs rounded-2xl border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <div className="mt-4 flex flex-wrap gap-2 justify-end">
                      <button
                        onClick={applyRawJson}
                        className="px-4 py-2 rounded-xl text-sm font-medium bg-gray-100 hover:bg-gray-200"
                      >
                        تطبيق على الواجهة
                      </button>
                      <button
                        onClick={() => {
                          try {
                            setRawJson(JSON.stringify(serverRaw, null, 2));
                            setToast({ type: "success", msg: "تم إعادة ضبط الـ Raw JSON من آخر بيانات السيرفر" });
                          } catch {
                            // ignore
                          }
                        }}
                        className="px-4 py-2 rounded-xl text-sm font-medium bg-white border border-gray-200 hover:bg-gray-50"
                      >
                        إعادة ضبط
                      </button>
                    </div>
                  </SectionCard>

                  <SectionCard
                    title="إجراءات متقدمة"
                    desc="بدون تعديل الباك اند: الإجراءات المتاحة حسب الروتات الموجودة."
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <button
                        onClick={() => window.open("/api/health", "_blank")}
                        className="inline-flex items-center justify-center px-4 py-3 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50"
                      >
                        فتح Health
                      </button>

                      <button
                        onClick={() => window.open("/api/diag-lite", "_blank")}
                        className="inline-flex items-center justify-center px-4 py-3 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50"
                      >
                        فتح Diag Lite
                      </button>

                      <div className="md:col-span-2 rounded-2xl border border-gray-200 bg-gray-50 p-4">
                        <p className="text-sm font-medium text-gray-900">Clear config/cache/routes</p>
                        <p className="text-xs text-gray-500 mt-1">
                          يتطلب DIAG_TOKEN (لو مش موجود عندك، سيبها فاضي).
                        </p>
                        <div className="mt-3 flex flex-col md:flex-row gap-2">
                          <input
                            type="password"
                            value={diagToken}
                            onChange={(e) => setDiagToken(e.target.value)}
                            placeholder="DIAG_TOKEN"
                            className="flex-1 rounded-xl border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                          <button
                            onClick={runDiagReload}
                            className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                          >
                            تنفيذ
                          </button>
                        </div>
                      </div>

                      <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-3">
                        <button
                          onClick={() => {
                            // UI only (no backend endpoint provided)
                            setToast({
                              type: "error",
                              msg: "لا يوجد Endpoint مباشر لتشغيل الصيانة/الباك أب من الباك اند الحالي — استخدم حفظ الإعدادات لتغيير maintenanceMode.",
                            });
                          }}
                          className="inline-flex items-center justify-center px-4 py-3 rounded-2xl border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                        >
                          <PauseIcon className="h-5 w-5 ml-2" />
                          تفعيل الصيانة
                        </button>

                        <button
                          onClick={() => {
                            setToast({
                              type: "error",
                              msg: "لا يوجد Endpoint لتنظيف الكاش داخل admin routes — استخدم Diag Reload إن توفر token.",
                            });
                          }}
                          className="inline-flex items-center justify-center px-4 py-3 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50"
                        >
                          تنظيف الكاش
                        </button>

                        <button
                          onClick={() => window.open("/project-usage", "_blank")}
                          className="inline-flex items-center justify-center px-4 py-3 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50"
                        >
                          <ChartBarIcon className="h-5 w-5 ml-2" />
                          إحصائيات المشروع
                        </button>
                      </div>

                      <div className="md:col-span-2 rounded-2xl border border-gray-100 bg-white p-4 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">إعادة تحميل من السيرفر</p>
                          <p className="text-xs text-gray-500">
                            في حال تم تعديل الإعدادات من مكان آخر.
                          </p>
                        </div>
                        <button
                          onClick={loadFromServer}
                          className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-medium bg-white border border-gray-200 hover:bg-gray-50"
                        >
                          <ArrowPathIcon className="h-5 w-5 ml-2" />
                          تحديث
                        </button>
                      </div>
                    </div>
                  </SectionCard>

                  <SectionCard
                    title="ملاحظة مهمة"
                    desc="هذا الملف لا يعدّل أي باك اند. يعتمد على الروتات الموجودة فقط."
                  >
                    <ul className="list-disc list-inside text-sm text-gray-700 space-y-2">
                      <li>
                        القراءة/الحفظ يعتمد على <span className="font-medium">/api/admin/settings</span>.
                      </li>
                      <li>
                        تنظيف الكاش يعتمد على <span className="font-medium">/api/diag-reload</span> ويتطلب DIAG_TOKEN.
                      </li>
                      <li>
                        لو الـ SettingsController عندك بيستخدم Keys مختلفة، استخدم Raw JSON ثم احفظ.
                      </li>
                    </ul>
                  </SectionCard>
                </div>
              )}
            </div>
          </div>

          {/* Footer quick actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">حالة التغييرات</p>
              <p className="mt-2 text-xl font-semibold text-gray-900">{dirty ? "غير محفوظ" : "محفوظ"}</p>
              <p className="text-xs text-gray-500 mt-1">تأكد من حفظ الإعدادات بعد أي تعديل.</p>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">مصدر البيانات</p>
              <p className="mt-2 text-xl font-semibold text-gray-900">Laravel Admin Settings</p>
              <p className="text-xs text-gray-500 mt-1">GET/PUT /api/admin/settings</p>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">أمان الجلسة</p>
              <p className="mt-2 text-xl font-semibold text-gray-900">Sanctum Cookies</p>
              <p className="text-xs text-gray-500 mt-1">مع withCredentials في api.ts</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
