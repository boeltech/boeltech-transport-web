import { describe, expect, it } from "vitest";
import {
  COMPENSATION_CORRIDORS_PATH,
  COMPENSATION_TEMPLATES_PATH,
  compensationCorridorsCreatePath,
  compensationTemplateAssignPath,
  compensationTemplateBuildPath,
  compensationTemplateDetailPath,
  compensationTemplateOperatorsPath,
  isCompensationCorridorsCreateQuery,
  isCompensationHubPath,
  isCompensationTemplateDetailPath,
  resolveCompensationHubTab,
  resolveCompensationTemplateDetailRedirect,
  resolveLegacyAgreementsPath,
} from "./compensationRoutes";

describe("compensationRoutes", () => {
  it("expone rutas canónicas del hub", () => {
    expect(COMPENSATION_TEMPLATES_PATH).toBe("/finance/compensation/templates");
    expect(COMPENSATION_CORRIDORS_PATH).toBe("/finance/compensation/corridors");
    expect(compensationCorridorsCreatePath()).toBe(
      "/finance/compensation/corridors?create=1",
    );
    expect(compensationTemplateOperatorsPath("tpl-1")).toBe(
      "/finance/compensation/templates?operators=tpl-1",
    );
    expect(compensationTemplateDetailPath("tpl-1")).toBe(
      "/finance/compensation/templates?operators=tpl-1",
    );
    expect(compensationTemplateAssignPath("tpl-1", "emp-1")).toBe(
      "/finance/compensation/templates?operators=tpl-1&assign=emp-1",
    );
    expect(compensationTemplateBuildPath("tpl-1")).toBe(
      "/finance/compensation/templates/tpl-1/build",
    );
  });

  it("detecta query create de corredores", () => {
    expect(isCompensationCorridorsCreateQuery("1")).toBe(true);
    expect(isCompensationCorridorsCreateQuery("true")).toBe(true);
    expect(isCompensationCorridorsCreateQuery("TRUE")).toBe(true);
    expect(isCompensationCorridorsCreateQuery("0")).toBe(false);
    expect(isCompensationCorridorsCreateQuery(null)).toBe(false);
  });

  it("resuelve redirect legacy agreements", () => {
    expect(resolveLegacyAgreementsPath("")).toBe(COMPENSATION_TEMPLATES_PATH);
    expect(resolveLegacyAgreementsPath("?employeeId=emp-1")).toBe(
      "/finance/compensation/templates?employeeId=emp-1",
    );
  });

  it("detecta tab activo del hub", () => {
    expect(resolveCompensationHubTab("/finance/compensation/templates")).toBe("templates");
    expect(resolveCompensationHubTab("/finance/compensation/corridors")).toBe("corridors");
    expect(isCompensationHubPath("/finance/compensation/templates/tpl-1")).toBe(true);
  });

  it("detecta ruta legacy de detalle de plantilla", () => {
    expect(isCompensationTemplateDetailPath("/finance/compensation/templates/tpl-1")).toBe(true);
    expect(isCompensationTemplateDetailPath("/finance/compensation/templates/tpl-1/")).toBe(true);
    expect(isCompensationTemplateDetailPath("/finance/compensation/templates")).toBe(false);
    expect(isCompensationTemplateDetailPath("/finance/compensation/corridors")).toBe(false);
    expect(isCompensationTemplateDetailPath("/finance/compensation/templates/tpl-1/edit")).toBe(
      false,
    );
    expect(isCompensationTemplateDetailPath("/finance/compensation/templates/tpl-1/build")).toBe(
      false,
    );
  });

  it("resuelve redirect desde detalle legacy", () => {
    expect(resolveCompensationTemplateDetailRedirect("tpl-1", "")).toBe(
      "/finance/compensation/templates?operators=tpl-1",
    );
    expect(
      resolveCompensationTemplateDetailRedirect("tpl-1", "?assign=emp-1"),
    ).toBe("/finance/compensation/templates?operators=tpl-1&assign=emp-1");
    expect(
      resolveCompensationTemplateDetailRedirect("tpl-1", "?assignEmployee=emp-1"),
    ).toBe("/finance/compensation/templates?operators=tpl-1&assign=emp-1");
    expect(resolveCompensationTemplateDetailRedirect("tpl-1", "?configure=true")).toBe(
      "/finance/compensation/templates/tpl-1/build",
    );
  });
});
