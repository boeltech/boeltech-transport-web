import type { Employee } from "../../domain/entities";
import { formatMxCurrencyNullable } from "@shared/utils/formatMxCurrency";

export function formatEmployeeStreetLine(emp: Employee): string | null {
  const pa = emp.personalAddress;
  if (pa) {
    const line = [pa.street, pa.exteriorNumber].filter(Boolean).join(" ").trim();
    const int = pa.interiorNumber ? ` Int. ${pa.interiorNumber}` : "";
    const full = `${line}${int}`.trim();
    return full || null;
  }
  if (!emp.street) return null;
  return `${emp.street} ${emp.exteriorNumber ?? ""}${emp.interiorNumber ? ` Int. ${emp.interiorNumber}` : ""}`.trim();
}

export function formatEmployeeCityStateLine(emp: Employee): string | null {
  const pa = emp.personalAddress;
  if (pa) {
    const legacy = [pa.city, pa.state].filter(Boolean).join(", ");
    if (legacy) return legacy;
    const codes = [pa.satMunicipalityCode, pa.satStateCode]
      .filter(Boolean)
      .join(" · ");
    return codes || null;
  }
  return [emp.city, emp.state].filter(Boolean).join(", ") || null;
}

export const formatMxCurrency = formatMxCurrencyNullable;
