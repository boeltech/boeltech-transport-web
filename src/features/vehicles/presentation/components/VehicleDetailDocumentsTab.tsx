import { Shield } from "lucide-react";
import { Card, CardContent } from "@shared/ui/card";
import { Separator } from "@shared/ui/separator";
import { DetailSection, DocumentRow, InfoRow } from "@shared/ui/data-display";
import type { Vehicle } from "../../domain";
import { vehiclesCopy } from "../copy";

const copy = vehiclesCopy.detail;

interface VehicleDetailDocumentsTabProps {
  vehicle: Vehicle;
}

export function VehicleDetailDocumentsTab({
  vehicle,
}: VehicleDetailDocumentsTabProps) {
  const { documentation, cartaPorte } = vehicle;

  return (
    <DetailSection
      icon={<Shield className="h-4 w-4" />}
      title={copy.section.documents.title}
      description={copy.section.documents.description}
    >
      <Card>
        <CardContent className="space-y-6 pt-6">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {copy.section.documents.groupRc}
            </p>
            <InfoRow
              variant="inline"
              label={copy.label.insuranceCompany}
              value={
                cartaPorte.insuranceCompany?.trim()
                  ? cartaPorte.insuranceCompany
                  : copy.hint.empty
              }
            />
            <DocumentRow
              label={copy.label.insurancePolicy}
              documentNumber={documentation.insurancePolicy}
              expirationDate={documentation.insuranceExpiry}
            />
          </div>

          <Separator />

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {copy.section.documents.groupSct}
            </p>
            <DocumentRow
              label={copy.label.sctPermitNumber}
              documentNumber={documentation.sctPermitNumber}
              expirationDate={documentation.sctPermitExpiry}
            />
          </div>
        </CardContent>
      </Card>
    </DetailSection>
  );
}
