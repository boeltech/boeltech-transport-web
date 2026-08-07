import {

  AlertTriangle,

  Flag,

  MapPin,

  Navigation,

} from "lucide-react";



import {

  StopType,

  type TripStatusType,

  type TripStop,

} from "@features/trips/domain";

import { Badge } from "@shared/ui/badge";

import { cn } from "@shared/lib/utils/cn";

import {

  getStopTypeBadgeClasses,

  getStopTypeConfig,

} from "@features/trips/presentation/uiHelpers";



import { TripDetailRouteStopAddress } from "../TripStopAddressLines";

import { tripDetailCopy } from "../../copy";

import { tripFiscalCopy } from "../../copy/tripFiscalCopy";

import {

  formatDistanceSourceLabel,

  getRouteStopCategory,

  getStopOperationalVisitLabel,

  getStopOperationalVisitState,

  getStopTimeDisplayRows,

  routeStopCardBorderClass,

  type RouteStopCategory,

  type TripScheduleTimes,

} from "./tripRouteDetailHelpers";



const copy = tripDetailCopy.route;



export interface TripDetailRouteStopCardProps {

  stop: TripStop;

  displayOrder: number;

  tripStatus: TripStatusType;

  tripTimes?: TripScheduleTimes;

  fiscalWarning?: {

    show: boolean;

    label: string;

    onFix: () => void;

  };

  fiscalCorrection?: {

    show: boolean;

    onFix: () => void;

  };

}



function StopCategoryIcon({

  category,

  className,

}: {

  category: RouteStopCategory;

  className?: string;

}) {

  if (category === "origin") {

    return <Navigation className={cn("h-5 w-5 text-success", className)} />;

  }

  if (category === "destination") {

    return <Flag className={cn("h-5 w-5 text-destructive", className)} />;

  }

  return <MapPin className={cn("h-5 w-5 text-muted-foreground", className)} />;

}



export function TripDetailRouteStopCard({

  stop,

  displayOrder,

  tripTimes,

  fiscalWarning,

  fiscalCorrection,

}: TripDetailRouteStopCardProps) {

  const category = getRouteStopCategory(stop);

  const visitState = getStopOperationalVisitState(stop, category, tripTimes);

  const visitLabel = getStopOperationalVisitLabel(visitState, category);

  const timeRows = getStopTimeDisplayRows(stop, category, tripTimes);

  const stopTypes = Array.isArray(stop.stopType) ? stop.stopType : [stop.stopType];

  const distanceSource = formatDistanceSourceLabel(stop.distanceSource);

  const needsAddress =

    !stop.rfcRemitenteDestinatario &&

    (stopTypes.includes(StopType.ORIGIN) ||

      stopTypes.includes(StopType.DESTINATION) ||

      stopTypes.includes(StopType.PICKUP) ||

      stopTypes.includes(StopType.DELIVERY));



  return (

    <div

      className={cn(

        "flex items-start gap-3 rounded-lg border p-4 transition-colors",

        routeStopCardBorderClass(category),

      )}

    >

      <div className="flex flex-col items-center gap-1 pt-0.5">

        <span className="w-5 text-center text-xs font-semibold text-muted-foreground">

          {copy.format.stopOrderHash(displayOrder)}

        </span>

      </div>



      <StopCategoryIcon category={category} className="mt-0.5 shrink-0" />



      <div className="min-w-0 flex-1 space-y-1.5">

        <div className="flex flex-wrap items-start justify-between gap-2">

          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">

            {stopTypes.map((type) => {

              const config = getStopTypeConfig(type);

              return (

                <span

                  key={type}

                  className={cn(

                    "rounded px-2 py-0.5 text-xs font-medium",

                    getStopTypeBadgeClasses(type),

                  )}

                >

                  {config.label}

                </span>

              );

            })}

            <Badge

              variant={visitState === "visited" ? "default" : "secondary"}

              className="font-normal"

            >

              {visitLabel}

            </Badge>

            {stop.sequenceOrder > 0 && stop.distanceFromPreviousKm != null ? (

              <Badge variant="outline" className="text-xs font-normal">

                {copy.format.distanceSegment(

                  distanceSource ?? copy.label.distanceFallback,

                  stop.distanceFromPreviousKm.toLocaleString("es-MX"),

                )}

              </Badge>

            ) : null}

            {fiscalWarning?.show ? (

              <Badge

                variant="warning"

                tone="soft"

                className="cursor-pointer text-xs"

                onClick={fiscalWarning.onFix}

              >

                <AlertTriangle className="mr-1 h-3 w-3" />

                {fiscalWarning.label}

              </Badge>

            ) : null}

            {fiscalCorrection?.show ? (

              <Badge

                variant="outline"

                className="cursor-pointer text-xs"

                onClick={fiscalCorrection.onFix}

              >

                {tripFiscalCopy.chip.correctFiscal}

              </Badge>

            ) : null}

          </div>

        </div>



        <TripDetailRouteStopAddress stop={stop} />



        {timeRows.length > 0 ? (

          <p className="text-xs text-muted-foreground">

            {timeRows

              .map((row) => `${row.label}: ${row.value}`)

              .join(" · ")}

          </p>

        ) : null}



        {stop.contactName ? (

          <p className="text-xs text-muted-foreground">

            {copy.label.contactPrefix} {stop.contactName}

            {stop.contactPhone ? ` · ${stop.contactPhone}` : ""}

          </p>

        ) : null}



        {stop.rfcRemitenteDestinatario ? (

          <p className="truncate text-xs text-muted-foreground">

            {stop.rfcRemitenteDestinatario}

            {stop.nombreRemitenteDestinatario

              ? ` — ${stop.nombreRemitenteDestinatario}`

              : ""}

          </p>

        ) : null}



        {stop.notes ? (

          <p className="text-xs italic text-muted-foreground">

            {copy.label.notePrefix} {stop.notes}

          </p>

        ) : null}



        {needsAddress ? (

          <p className="text-xs text-warning-soft-foreground">

            {copy.hint.pendingAddress}

          </p>

        ) : null}

      </div>

    </div>

  );

}


