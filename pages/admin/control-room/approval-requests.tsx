import ApprovalRequestsQueue from "@/components/admin/ApprovalRequestsQueue";
import ControlRoomGate from "@/components/control-room/ControlRoomGate";
import ControlRoomShell from "@/components/control-room/ControlRoomShell";

export default function ControlRoomApprovalRequestsPage() {
  return (
    <ControlRoomGate>
      <ControlRoomShell>
        <div className="container mx-auto p-4 md:p-6 rtl max-w-7xl">
          <ApprovalRequestsQueue />
        </div>
      </ControlRoomShell>
    </ControlRoomGate>
  );
}
