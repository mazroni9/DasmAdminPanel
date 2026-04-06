import ApprovalRequestsQueue from "@/components/admin/ApprovalRequestsQueue";
import ControlRoomGate from "@/components/control-room/ControlRoomGate";
import ControlRoomShell from "@/components/control-room/ControlRoomShell";

export default function ControlRoomApprovalRequestsPage() {
  return (
    <ControlRoomGate>
      {(access) => (
        <ControlRoomShell access={access}>
          <div className="max-w-7xl">
            <ApprovalRequestsQueue />
          </div>
        </ControlRoomShell>
      )}
    </ControlRoomGate>
  );
}
