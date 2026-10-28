/** Deep-link query params Hub ← Catálogo «Usar en empresa…». */

export const HUB_PREVIEW_PLAN_PARAM = "previewPlan";
export const HUB_PREVIEW_MODULE_PARAM = "previewModule";

export function buildHubPlanPreviewHref(
  tenantId: string,
  planCode: string,
): string {
  const params = new URLSearchParams({
    tab: "suscripcion",
    [HUB_PREVIEW_PLAN_PARAM]: planCode,
  });
  return `/platform/tenants/${tenantId}?${params.toString()}`;
}

export function buildHubModulePreviewHref(
  tenantId: string,
  moduleCode: string,
): string {
  const params = new URLSearchParams({
    tab: "suscripcion",
    [HUB_PREVIEW_MODULE_PARAM]: moduleCode,
  });
  return `/platform/tenants/${tenantId}?${params.toString()}`;
}

export function readHubPreviewPlanCode(
  searchParams: URLSearchParams,
): string | null {
  const value = searchParams.get(HUB_PREVIEW_PLAN_PARAM)?.trim();
  return value || null;
}

export function readHubPreviewModuleCode(
  searchParams: URLSearchParams,
): string | null {
  const value = searchParams.get(HUB_PREVIEW_MODULE_PARAM)?.trim();
  return value || null;
}

export function clearHubPreviewParams(
  searchParams: URLSearchParams,
): URLSearchParams {
  const next = new URLSearchParams(searchParams);
  next.delete(HUB_PREVIEW_PLAN_PARAM);
  next.delete(HUB_PREVIEW_MODULE_PARAM);
  return next;
}
