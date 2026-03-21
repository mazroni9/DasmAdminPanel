import ApprovalRequestDetail from "@/components/approval/ApprovalRequestDetail";
import ControlRoomGate from "@/components/control-room/ControlRoomGate";
import ControlRoomShell from "@/components/control-room/ControlRoomShell";
import { useRouter } from "next/router";

export default function ApprovalRequestDetailPage() {
  const router = useRouter();
  const raw = router.query.id;
  const id = typeof raw === "string" ? Number.parseInt(raw, 10) : NaN;

  if (!router.isReady) {
    return (
      <ControlRoomGate>
        <ControlRoomShell>
          <div className="container mx-auto p-4 md:p-6 rtl max-w-7xl">
            <p className="text-gray-500 text-sm">جاري التحميل...</p>
          </div>
        </ControlRoomShell>
      </ControlRoomGate>
    );
  }

  if (!Number.isFinite(id) || id < 1) {
    return (
      <ControlRoomGate>
        <ControlRoomShell>
          <div className="container mx-auto p-4 md:p-6 rtl max-w-7xl">
            <p className="text-red-600 text-sm">معرّف الطلب غير صالح.</p>
          </div>
        </ControlRoomShell>
      </ControlRoomGate>
    );
  }

  return (
    <ControlRoomGate>
      <ControlRoomShell>
        <div className="container mx-auto p-4 md:p-6 rtl max-w-7xl">
          <ApprovalRequestDetail id={id} />
        </div>
      </ControlRoomShell>
    </ControlRoomGate>
  );
}
