import { Link } from "react-router-dom";
import { usePermissions } from "@shared/permissions";
import { vehiclesCopy } from "../copy";

type VehicleBillingPolicyKind = "create" | "remove";

interface VehicleBillingPolicyNoteProps {
  kind: VehicleBillingPolicyKind;
  className?: string;
}

/**
 * Frase de política + link a suscripción solo con `billing.read`.
 * Sin montos. Sin hooks de `@features/billing`.
 */
export function VehicleBillingPolicyNote({
  kind,
  className,
}: VehicleBillingPolicyNoteProps) {
  const { hasPermission } = usePermissions();
  const copy = vehiclesCopy.billingPolicy;
  const text = kind === "create" ? copy.create : copy.remove;
  const showLink = hasPermission("billing", "read");

  return (
    <span className={className}>
      {text}
      {showLink ? (
        <>
          {" "}
          <Link
            to={copy.subscriptionHref}
            className="font-medium underline underline-offset-2"
          >
            {copy.link}
          </Link>
        </>
      ) : null}
    </span>
  );
}
