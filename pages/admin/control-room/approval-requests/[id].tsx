import ApprovalRequestDetail from "@/components/approval/ApprovalRequestDetail";
import ControlRoomGate from "@/components/control-room/ControlRoomGate";
import ControlRoomShell from "@/components/control-room/ControlRoomShell";
import { useRouter } from "next/router";

export default function ApprovalRequestDetailPage() {
  const router = useRouter();
  const raw = router.query.id;
  const id = typeof raw === "string" ? Number.parseInt(raw, 10) : NaN;

  return (
    <ControlRoomGate>
      {(access) => (
        <ControlRoomShell access={access}>
          <div className="max-w-7xl">
            {!router.isReady ? (
              <p className="text-gray-500 text-sm">جاري التحميل...</p>
            ) : !Number.isFinite(id) || id < 1 ? (
              <p className="text-red-600 text-sm">معرّف الطلب غير صالح.</p>
            ) : (
              <ApprovalRequestDetail id={id} />
            )}
          </div>
        </ControlRoomShell>
      )}
    </ControlRoomGate>
  );
}
