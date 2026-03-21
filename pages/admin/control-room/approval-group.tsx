import ApprovalGroupDasmNotice from "@/components/approval/ApprovalGroupDasmNotice";
import ControlRoomGate from "@/components/control-room/ControlRoomGate";
import ControlRoomShell from "@/components/control-room/ControlRoomShell";

export default function ControlRoomApprovalGroupPage() {
  return (
    <ControlRoomGate>
      <ControlRoomShell>
        <div className="container mx-auto p-4 md:p-6 rtl max-w-7xl">
          <ApprovalGroupDasmNotice />
        </div>
      </ControlRoomShell>
    </ControlRoomGate>
  );
}
