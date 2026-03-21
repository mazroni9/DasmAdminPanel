import Link from "next/link";
import {
  LayoutGrid,
  ClipboardList,
  UserCog,
  Building2,
  BarChart2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const mainFrontendBase =
  (typeof process !== "undefined" &&
    process.env.NEXT_PUBLIC_MAIN_FRONTEND_URL?.replace(/\/$/, "")) ||
  "https://www.dasm.com.sa";

export default function ControlRoomShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isSuperAdmin, isAdmin, isModerator, isProgrammer, logout } =
    useAuth();
  const isStaff = isAdmin || isModerator || isProgrammer;

  const handleLogout = async () => {
    await logout({ redirectToLogin: true });
  };

  return (
    <div className="space-y-6 rtl min-h-screen bg-gray-50 p-4 md:p-6">
      <header className="rounded-2xl border border-gray-200 bg-white p-4 flex flex-wrap items-center gap-3 justify-between shadow-sm">
        <div className="flex items-center gap-2 min-w-0">
          <Building2 className="w-6 h-6 text-blue-600 shrink-0" />
          <div>
            <p className="font-bold text-lg text-gray-900">
              غرفة المعالجة التشغيلية
            </p>
            <p className="text-xs text-gray-500">
              السيارات الجديدة وطابور الموافقات التشغيلية
            </p>
          </div>
        </div>
        <nav className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/control-room"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm border border-gray-200 hover:bg-gray-100 transition"
          >
            <LayoutGrid className="w-4 h-4" />
            الرئيسية
          </Link>
          <Link
            href="/admin/control-room/approval-requests"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm border border-gray-200 hover:bg-gray-100 transition"
          >
            <ClipboardList className="w-4 h-4" />
            طابور الموافقات
          </Link>
          {isSuperAdmin ? (
            <Link
              href="/admin/control-room/approval-group"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm border border-blue-200 bg-blue-50 hover:bg-blue-100 transition text-blue-900"
            >
              <UserCog className="w-4 h-4" />
              مجموعة الموافقات
            </Link>
          ) : null}
          {isStaff ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm border border-gray-200 hover:bg-gray-100 transition"
            >
              <BarChart2 className="w-4 h-4" />
              لوحة المؤشرات
            </Link>
          ) : null}
          {isStaff ? (
            <a
              href={`${mainFrontendBase}/admin`}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm border border-gray-200 hover:bg-gray-100 transition"
            >
              لوحة الإدارة
            </a>
          ) : null}
          <button
            type="button"
            onClick={handleLogout}
            className="px-3 py-2 rounded-xl text-sm text-red-600 border border-red-200 hover:bg-red-50"
          >
            خروج
          </button>
        </nav>
      </header>
      {children}
    </div>
  );
}
