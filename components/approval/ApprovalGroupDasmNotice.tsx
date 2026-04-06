import Link from "next/link";
import { useApprovalCapabilities } from "@/hooks/useApprovalCapabilities";

/**
 * لا يوجد أي fetch لـ approval-group من هنا.
 * can_manage_group = true → إشعار + رابط إدارة في DASM فقط.
 * can_manage_group = false → معلومات فقط، بدون روابط إدارة وبدون قائمة أعضاء.
 */
export default function ApprovalGroupDasmNotice() {
  const { caps, loading, error, refresh } = useApprovalCapabilities();

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
        جاري التحقق من الصلاحيات...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-800 space-y-3 rtl">
        <p>{error}</p>
        <button
          type="button"
          className="text-indigo-600 underline"
          onClick={() => void refresh()}
        >
          إعادة المحاولة
        </button>
      </div>
    );
  }

  const canManage = caps?.can_manage_group === true;

  return (
    <div className="space-y-4 rtl max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900">مجموعة الموافقات</h1>

      <p className="text-gray-600 leading-relaxed">
        إدارة أعضاء مجموعة الموافقات، صلاحيات المراجعة، والإشعارات (بما فيها
        البريد) تتم بالكامل داخل <strong>منصة DASM</strong> — لا يوجد تكرار لهذا
        المنطق في لوحة الإدارة هذه.
      </p>

      <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-700">
        <p className="font-semibold mb-2">للتشغيل اليومي</p>
        <p>
          استخدم{" "}
          <Link
            href="/admin/control-room/approval-requests"
            className="text-indigo-600 font-medium underline"
          >
            طابور الموافقات
          </Link>{" "}
          لمراجعة الطلبات والقرار وفق صلاحياتك في DASM.
        </p>
      </div>

      {canManage ? (
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50/90 p-4 text-sm text-indigo-950 space-y-2">
          <p className="font-semibold">صلاحية إدارة المجموعة</p>
          <p className="text-indigo-900">
            تملك صلاحية إدارة العضوية وإعدادات المجموعة — تواصل مع مدير النظام لتعديل الأعضاء.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-600 space-y-2">
          <p className="font-semibold text-gray-800">معلومات فقط</p>
          <p>
            لا تملك حالياً صلاحية إدارة مجموعة الموافقات (
            <code className="text-xs bg-gray-100 px-1 rounded">
              can_manage_group
            </code>
            ). لا تُعرض هنا قائمة الأعضاء ولا أي إجراءات تعديل — ذلك يتم في DASM
            فقط عند من يملك الصلاحية.
          </p>
        </div>
      )}
    </div>
  );
}
