import ApprovalGroupDasmNotice from "@/components/approval/ApprovalGroupDasmNotice";
import ControlRoomGate from "@/components/control-room/ControlRoomGate";
import ControlRoomShell from "@/components/control-room/ControlRoomShell";

export default function ControlRoomApprovalGroupPage() {
  return (
    <ControlRoomGate>
      {(access) => (
        <ControlRoomShell access={access}>
          <div className="max-w-7xl">
            <ApprovalGroupDasmNotice />
          </div>
        </ControlRoomShell>
      )}
    </ControlRoomGate>
  );
}
