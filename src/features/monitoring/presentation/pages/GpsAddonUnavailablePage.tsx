/**
 * Estado unavailable — kill-switch (DC7 · X9). Sin mencionar API/entorno.
 */

import { Radio } from "lucide-react";
import { EmptyState } from "@shared/ui/feedback-states";
import { monitoringCopy } from "../copy/monitoringCopy";

export function GpsAddonUnavailablePage() {
  const copy = monitoringCopy.unavailable;

  return (
    <div
      className="mx-auto flex w-full max-w-lg flex-col px-4 py-16 sm:px-6"
      data-testid="gps-addon-unavailable"
    >
      <EmptyState
        icon={<Radio className="h-8 w-8" />}
        title={copy.title}
        description={copy.body}
      />
    </div>
  );
}
