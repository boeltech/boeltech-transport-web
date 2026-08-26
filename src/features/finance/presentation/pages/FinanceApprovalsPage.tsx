import { ClipboardCheck } from "lucide-react";
import { ApprovalInboxPage } from "@features/approvals";
import { FinanceSectionHeader } from "../components";
import { financeCopy } from "../copy";

export function FinanceApprovalsPage() {
  return (
    <div className="space-y-6">
      <FinanceSectionHeader
        icon={<ClipboardCheck className="h-5 w-5" />}
        title={financeCopy.page.sections.approvals.title}
        subtitle={financeCopy.page.sections.approvals.subtitle}
      />
      <ApprovalInboxPage embedded />
    </div>
  );
}
