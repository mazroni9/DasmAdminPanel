import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import platformApi from "@/lib/platformApi";
import {
  ChevronLeft,
  Loader2,
  AlertCircle,
  Radio,
  Gavel,
  User,
  Clock,
  Activity,
  Eye,
} from "lucide-react";

interface BroadcastDetail {
  broadcast: {
    id: number;
    title: string;
    description: string | null;
    status: string | null;
    is_live: boolean;
    stream_provider: string | null;
    started_at: string | null;
    ended_at: string | null;
    viewers_now: number;
    subscription_tier: string | null;
  };
  auction: {
    id: number;
    title: string | null;
    current_bid: number | null;
    starting_price: number | null;
    created_at: string | null;
  } | null;
  bid_stats: {
    total_bids: number;
    first_bid_at: string | null;
    last_bid_at: string | null;
  } | null;
  creator: {
    id: number;
    email: string;
    first_name: string | null;
    last_name: string | null;
    organization: string | null;
  } | null;
  active_video_source: {
    source_type: string;
    url: string;
  } | null;
}

export default function BroadcastDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const broadcastId = typeof id === "string" ? parseInt(id, 10) : null;

  const [data, setData] = useState<BroadcastDetail | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!broadcastId) return;
    setStatus("loading");
    platformApi
      .get<BroadcastDetail>(`/api/admin/control-room/broadcast/${broadcastId}`)
      .then((res) => {
        setData(res.data);
        setStatus("ready");
      })
      .catch((e: unknown) => {
        const err = e as { response?: { data?: { message?: string } } };
        setErrorMsg(err.response?.data?.message ?? "تعذّر جلب التفاصيل.");
        setStatus("error");
      });
  }, [broadcastId]);

  return (
    <>
      <Head>
        <title>تفاصيل البث — غرفة التحكّم</title>
      </Head>
      <main className="min-h-screen bg-gray-50 p-6" dir="rtl">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/admin/control-room/heat-grid"
            className="text-sm text-gray-500 hover:text-gray-700 inline-flex items-center gap-1 mb-4"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>العودة لشبكة الحرارة</span>
          </Link>

          {status === "loading" && (
            <div className="p-10 bg-white rounded-lg border flex items-center justify-center text-gray-500">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              <span>جاري التحميل…</span>
            </div>
          )}

          {status === "error" && (
            <div className="p-6 bg-red-50 border border-red-200 rounded text-red-700 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {status === "ready" && data && (
            <div className="space-y-4">
              <header className="bg-white rounded-lg border p-5">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h1 className="text-2xl font-bold">{data.broadcast.title}</h1>
                  {data.broadcast.is_live && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-600 text-white rounded text-sm font-semibold">
                      <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                      <span>LIVE</span>
                    </span>
                  )}
                </div>
                {data.broadcast.description && (
                  <p className="text-gray-600 text-sm">
                    {data.broadcast.description}
                  </p>
                )}
              </header>

              <Section title="البث" icon={<Radio className="w-5 h-5" />}>
                <Row label="الحالة" value={data.broadcast.status ?? "—"} />
                <Row
                  label="مزوّد البث"
                  value={data.broadcast.stream_provider ?? "—"}
                />
                <Row
                  label="مصدر الفيديو النشط"
                  value={
                    data.active_video_source
                      ? `${data.active_video_source.source_type} — ${data.active_video_source.url.substring(0, 60)}…`
                      : "—"
                  }
                />
                <Row
                  label="مشاهدون الآن"
                  value={data.broadcast.viewers_now.toLocaleString("ar-SA")}
                  icon={<Eye className="w-4 h-4 text-gray-400" />}
                />
                <Row
                  label="بدأ"
                  value={
                    data.broadcast.started_at
                      ? new Date(data.broadcast.started_at).toLocaleString(
                          "ar-SA",
                          { dateStyle: "medium", timeStyle: "short" },
                        )
                      : "—"
                  }
                  icon={<Clock className="w-4 h-4 text-gray-400" />}
                />
                {data.broadcast.subscription_tier && (
                  <Row
                    label="خطة المعرض"
                    value={data.broadcast.subscription_tier}
                  />
                )}
              </Section>

              {data.creator && (
                <Section
                  title="المُذيع / المعرض"
                  icon={<User className="w-5 h-5" />}
                >
                  <Row
                    label="الاسم"
                    value={
                      `${data.creator.first_name ?? ""} ${data.creator.last_name ?? ""}`.trim() ||
                      "—"
                    }
                  />
                  <Row label="البريد" value={data.creator.email} mono />
                  {data.creator.organization && (
                    <Row label="المنظمة" value={data.creator.organization} />
                  )}
                  <Row
                    label="ID"
                    value={String(data.creator.id)}
                    mono
                  />
                </Section>
              )}

              {data.auction && (
                <Section
                  title="المزاد المرتبط"
                  icon={<Gavel className="w-5 h-5" />}
                >
                  <Row label="عنوان المزاد" value={data.auction.title ?? "—"} />
                  <Row
                    label="السعر الحالي"
                    value={
                      data.auction.current_bid
                        ? `${Number(data.auction.current_bid).toLocaleString("ar-SA")} ر.س`
                        : "—"
                    }
                  />
                  <Row
                    label="السعر الأولي"
                    value={
                      data.auction.starting_price
                        ? `${Number(data.auction.starting_price).toLocaleString("ar-SA")} ر.س`
                        : "—"
                    }
                  />
                </Section>
              )}

              {data.bid_stats && (
                <Section
                  title="إحصاءات المزايدة"
                  icon={<Activity className="w-5 h-5" />}
                >
                  <Row
                    label="إجمالي المزايدات"
                    value={data.bid_stats.total_bids.toLocaleString("ar-SA")}
                  />
                  <Row
                    label="أول مزايدة"
                    value={
                      data.bid_stats.first_bid_at
                        ? new Date(
                            data.bid_stats.first_bid_at,
                          ).toLocaleString("ar-SA", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })
                        : "—"
                    }
                  />
                  <Row
                    label="آخر مزايدة"
                    value={
                      data.bid_stats.last_bid_at
                        ? new Date(data.bid_stats.last_bid_at).toLocaleString(
                            "ar-SA",
                            { dateStyle: "short", timeStyle: "short" },
                          )
                        : "—"
                    }
                  />
                </Section>
              )}
            </div>
          )}
        </div>
      </main>
    </>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white rounded-lg border p-5">
      <h2 className="font-semibold mb-3 flex items-center gap-2 text-gray-800">
        {icon}
        <span>{title}</span>
      </h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function Row({
  label,
  value,
  mono,
  icon,
}: {
  label: string;
  value: string;
  mono?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="text-gray-500 min-w-[120px]">{label}</span>
      <span
        className={`font-medium text-left break-all flex items-center gap-1.5 ${mono ? "font-mono text-xs" : ""}`}
      >
        {icon}
        <span>{value}</span>
      </span>
    </div>
  );
}
