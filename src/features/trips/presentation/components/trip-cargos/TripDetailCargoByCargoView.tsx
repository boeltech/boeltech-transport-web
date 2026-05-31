import type { CargoStatusType, TripCargo, TripStop } from "@features/trips/domain";

import { TripDetailCargoItemCard } from "./TripDetailCargoItemCard";

export interface TripDetailCargoByCargoViewProps {
  cargos: TripCargo[];
  orderedStops: TripStop[];
  formatCurrency: (amount: number) => string;
  getCargoStatusVariant: (
    status: CargoStatusType,
  ) => "default" | "secondary" | "destructive" | "outline";
  canDeliverCargo: boolean;
  isDeliverPending: boolean;
  onDeliverCargo: (cargoId: string) => void;
}

export function TripDetailCargoByCargoView({
  cargos,
  orderedStops,
  formatCurrency,
  getCargoStatusVariant,
  canDeliverCargo,
  isDeliverPending,
  onDeliverCargo,
}: TripDetailCargoByCargoViewProps) {
  return (
    <div className="space-y-2">
      {cargos.map((cargo) => (
        <TripDetailCargoItemCard
          key={cargo.id}
          cargo={cargo}
          orderedStops={orderedStops}
          formatCurrency={formatCurrency}
          getCargoStatusVariant={getCargoStatusVariant}
          canDeliverCargo={canDeliverCargo}
          isDeliverPending={isDeliverPending}
          onDeliverCargo={onDeliverCargo}
          showClient
          emphasizeDeclaredValue
        />
      ))}
    </div>
  );
}
