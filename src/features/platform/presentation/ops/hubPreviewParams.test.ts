import { describe, expect, it } from "vitest";
import {
  buildHubModulePreviewHref,
  buildHubPlanPreviewHref,
  clearHubPreviewParams,
  readHubPreviewModuleCode,
  readHubPreviewPlanCode,
} from "./hubPreviewParams";

describe("hubPreviewParams", () => {
  it("builds plan and module deep links", () => {
    expect(buildHubPlanPreviewHref("t1", "operacion_crecimiento")).toBe(
      "/platform/tenants/t1?tab=suscripcion&previewPlan=operacion_crecimiento",
    );
    expect(buildHubModulePreviewHref("t1", "liquidaciones")).toBe(
      "/platform/tenants/t1?tab=suscripcion&previewModule=liquidaciones",
    );
  });

  it("reads and clears preview params", () => {
    const params = new URLSearchParams(
      "tab=suscripcion&previewPlan=operacion_crecimiento&previewModule=x",
    );
    expect(readHubPreviewPlanCode(params)).toBe("operacion_crecimiento");
    expect(readHubPreviewModuleCode(params)).toBe("x");
    const cleared = clearHubPreviewParams(params);
    expect(readHubPreviewPlanCode(cleared)).toBeNull();
    expect(readHubPreviewModuleCode(cleared)).toBeNull();
    expect(cleared.get("tab")).toBe("suscripcion");
  });
});
