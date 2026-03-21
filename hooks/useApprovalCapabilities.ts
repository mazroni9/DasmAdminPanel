import { useCallback, useEffect, useState } from "react";
import dasmBff from "@/lib/dasmBffClient";

/**
 * عقد DASM النهائي + حقول legacy للتوافق المؤقت.
 */
export type ApprovalCapabilities = {
  can_access_queue: boolean;
  can_manage_group?: boolean;
  /** عقد DASM الجديد */
  can_approve_business_accounts?: boolean;
  can_approve_council_requests?: boolean;
  /** legacy — fallback */
  can_approve_business?: boolean;
  can_approve_council?: boolean;
};

/**
 * قراءة موحّدة لصلاحيات القرار (تجاري / مجلس) مع fallback للحقول القديمة.
 */
export function resolveApprovalDecisionCaps(
  c: ApprovalCapabilities | null
): {
  canApproveBusiness: boolean;
  canApproveCouncil: boolean;
} {
  if (!c) {
    return { canApproveBusiness: false, canApproveCouncil: false };
  }
  const biz =
    c.can_approve_business_accounts ?? c.can_approve_business ?? false;
  const council =
    c.can_approve_council_requests ?? c.can_approve_council ?? false;
  return {
    canApproveBusiness: Boolean(biz),
    canApproveCouncil: Boolean(council),
  };
}

export function useApprovalCapabilities() {
  const [caps, setCaps] = useState<ApprovalCapabilities | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await dasmBff.get("admin/approval-requests/capabilities");
      setCaps((res.data?.data ?? res.data) as ApprovalCapabilities);
    } catch {
      setCaps(null);
      setError("تعذر التحقق من صلاحيات الموافقات");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { caps, loading, error, refresh };
}
