import { useSearchParams } from "react-router-dom";
import { SettlementCreatePage } from "./SettlementCreatePage";
import { SettlementReimbursementCreatePage } from "./SettlementReimbursementCreatePage";

/** `/finance/settlements/new`: `?kind=reimbursements` abre el pago de reembolsos (E11-F3). */
export function SettlementCreateEntryPage() {
  const [searchParams] = useSearchParams();
  if (searchParams.get("kind") === "reimbursements") {
    return <SettlementReimbursementCreatePage key={searchParams.get("employeeId") ?? ""} />;
  }
  return <SettlementCreatePage />;
}
