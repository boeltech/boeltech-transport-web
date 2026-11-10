import { describe, expect, it } from "vitest";
import {
  COMPENSATION_CORRIDORS_HREF,
  COMPENSATION_CORRIDORS_PATH,
  COMPENSATION_TEMPLATES_PATH,
  compensationCorridorsCreatePath,
  compensationTemplateAssignPath,
  compensationTemplateBuildPath,
  compensationTemplateDetailPath,
  compensationTemplateOperatorsPath,
  formatAssignEmployeeIds,
  isCompensationCorridorsCreateQuery,
  isCompensationTemplateDetailPath,
  parseAssignEmployeeIds,
  resolveBatchInitialEffectiveFrom,
  resolveCompensationTemplateDetailRedirect,
  resolveLegacyAgreementsPath,
  resolveLegacyCompensationPath,
  withBatchCompleted,
  withBlockingAssignmentFocus,
  withFocusDismissed,
  withOperatorsClosed,
  withReturnToBatch,
  withSameTemplateFocus,
} from "./compensationRoutes";

describe("compensationRoutes", () => {
  it("expone rutas canónicas Tarifas (F2)", () => {
    expect(COMPENSATION_TEMPLATES_PATH).toBe(
      "/finance/operator-payments/tariffs",
    );
    expect(COMPENSATION_CORRIDORS_PATH).toBe(COMPENSATION_TEMPLATES_PATH);
    expect(COMPENSATION_CORRIDORS_HREF).toBe(
      "/finance/operator-payments/tariffs?tab=routes",
    );
    expect(compensationCorridorsCreatePath()).toBe(
      "/finance/operator-payments/tariffs?tab=routes&create=1",
    );
    expect(compensationTemplateOperatorsPath("tpl-1")).toBe(
      "/finance/operator-payments/tariffs?operators=tpl-1",
    );
    expect(compensationTemplateDetailPath("tpl-1")).toBe(
      "/finance/operator-payments/tariffs?operators=tpl-1",
    );
    expect(compensationTemplateAssignPath("tpl-1", "emp-1")).toBe(
      "/finance/operator-payments/tariffs?operators=tpl-1&assign=emp-1",
    );
    expect(compensationTemplateBuildPath("tpl-1")).toBe(
      "/finance/operator-payments/tariffs/tpl-1/build",
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
      "/finance/operator-payments/tariffs?employeeId=emp-1",
    );
  });

  it("redirige /finance/compensation/* a Tarifas", () => {
    expect(resolveLegacyCompensationPath("/finance/compensation", "")).toBe(
      COMPENSATION_TEMPLATES_PATH,
    );
    expect(
      resolveLegacyCompensationPath("/finance/compensation/templates", ""),
    ).toBe(COMPENSATION_TEMPLATES_PATH);
    expect(
      resolveLegacyCompensationPath("/finance/compensation/corridors", ""),
    ).toBe(COMPENSATION_CORRIDORS_HREF);
    expect(
      resolveLegacyCompensationPath(
        "/finance/compensation/templates/tpl-1/build",
        "",
      ),
    ).toBe("/finance/operator-payments/tariffs/tpl-1/build");
  });

  it("detecta ruta de detalle de plantilla canónica", () => {
    expect(
      isCompensationTemplateDetailPath(
        "/finance/operator-payments/tariffs/tpl-1",
      ),
    ).toBe(true);
    expect(
      isCompensationTemplateDetailPath(
        "/finance/operator-payments/tariffs/tpl-1/",
      ),
    ).toBe(true);
    expect(
      isCompensationTemplateDetailPath("/finance/operator-payments/tariffs"),
    ).toBe(false);
    expect(
      isCompensationTemplateDetailPath(
        "/finance/operator-payments/tariffs/tpl-1/edit",
      ),
    ).toBe(false);
    expect(
      isCompensationTemplateDetailPath(
        "/finance/operator-payments/tariffs/tpl-1/build",
      ),
    ).toBe(false);
  });

  it("resuelve redirect desde detalle", () => {
    expect(resolveCompensationTemplateDetailRedirect("tpl-1", "")).toBe(
      "/finance/operator-payments/tariffs?operators=tpl-1",
    );
    expect(
      resolveCompensationTemplateDetailRedirect("tpl-1", "?assign=emp-1"),
    ).toBe(
      "/finance/operator-payments/tariffs?operators=tpl-1&assign=emp-1",
    );
    expect(
      resolveCompensationTemplateDetailRedirect(
        "tpl-1",
        "?assignEmployee=emp-1",
      ),
    ).toBe(
      "/finance/operator-payments/tariffs?operators=tpl-1&assign=emp-1",
    );
    expect(
      resolveCompensationTemplateDetailRedirect("tpl-1", "?configure=true"),
    ).toBe("/finance/operator-payments/tariffs/tpl-1/build");
  });
});

describe("compensationRoutes — lote y enlace a la asignación que bloquea (api#63 C13)", () => {
  const ids = (n: number) => Array.from({ length: n }, (_, i) => `emp-${i + 1}`);

  function entries(params: URLSearchParams) {
    return Object.fromEntries(params.entries());
  }

  describe("lista de operadores en `assign`", () => {
    it("separa por comas, quita vacíos y duplicados y conserva el orden", () => {
      expect(parseAssignEmployeeIds(" emp-2,emp-1,,emp-2 , emp-3,")).toEqual([
        "emp-2",
        "emp-1",
        "emp-3",
      ]);
      expect(parseAssignEmployeeIds("emp-1")).toEqual(["emp-1"]);
      expect(parseAssignEmployeeIds(null)).toEqual([]);
      expect(parseAssignEmployeeIds("")).toEqual([]);
      expect(formatAssignEmployeeIds(["emp-1", "emp-2", "emp-1"])).toBe("emp-1,emp-2");
    });

    it("101 ids → 100 (tope del lote)", () => {
      const parsed = parseAssignEmployeeIds(ids(101).join(","));
      expect(parsed).toHaveLength(100);
      expect(parsed.at(-1)).toBe("emp-100");
      expect(formatAssignEmployeeIds(ids(101)).split(",")).toHaveLength(100);
    });

    it("el tope cuenta ids únicos, no repetidos", () => {
      const withDuplicates = ["emp-1", "emp-1", ...ids(100)];
      expect(parseAssignEmployeeIds(withDuplicates.join(","))).toEqual(ids(100));
    });

    it("compensationTemplateAssignPath acepta varios operadores y fecha inicial", () => {
      const path = compensationTemplateAssignPath("tpl-1", ["emp-1", "emp-2", "emp-1"], {
        effectiveFrom: "2026-10-07",
      });
      const search = new URLSearchParams(path.split("?")[1]);
      expect(path.startsWith(`${COMPENSATION_TEMPLATES_PATH}?`)).toBe(true);
      expect(entries(search)).toEqual({
        operators: "tpl-1",
        assign: "emp-1,emp-2",
        assignFrom: "2026-10-07",
      });
    });
  });

  describe("«Vigente desde» inicial", () => {
    it.each([
      [{ assignFrom: "2026-10-07", periodStart: "2026-09-01" }, "2026-10-07"],
      [{ assignFrom: null, periodStart: "2026-09-01" }, "2026-09-01"],
      [{ assignFrom: "no-es-fecha", periodStart: "2026-09-01" }, "2026-09-01"],
      [{}, "2026-10-08"],
    ])("%o → %s", (input, expected) => {
      expect(resolveBatchInitialEffectiveFrom({ ...input, today: "2026-10-08" })).toBe(expected);
    });
  });

  const fromPayables = new URLSearchParams({
    employeeId: "emp-9",
    periodStart: "2026-09-01",
    periodEnd: "2026-09-15",
    status: "active",
  });

  function batchOpenOn(templateId: string) {
    const params = new URLSearchParams(fromPayables);
    params.set("operators", templateId);
    params.set("assign", "emp-1,emp-2");
    params.set("assignFrom", "2026-09-01");
    return params;
  }

  it("ir: cambia de plantilla, resalta y guarda el regreso; conserva Por pagar", () => {
    const next = withBlockingAssignmentFocus(batchOpenOn("tpl-v2"), {
      targetTemplateId: "tpl-v1",
      assignmentId: "asg-fernando",
      returnTemplateId: "tpl-v2",
      returnEmployeeIds: ["emp-1", "emp-2"],
      returnEffectiveFrom: "2026-09-01",
    });

    expect(entries(next)).toEqual({
      employeeId: "emp-9",
      periodStart: "2026-09-01",
      periodEnd: "2026-09-15",
      status: "active",
      operators: "tpl-v1",
      focus: "asg-fernando",
      returnTo: "tpl-v2",
      returnAssign: "emp-1,emp-2",
      returnFrom: "2026-09-01",
    });
  });

  it("volver: reabre la plantilla de origen con operadores y fecha; quita foco y regreso", () => {
    const there = withBlockingAssignmentFocus(batchOpenOn("tpl-v2"), {
      targetTemplateId: "tpl-v1",
      assignmentId: "asg-fernando",
      returnTemplateId: "tpl-v2",
      returnEmployeeIds: ["emp-1", "emp-2"],
      returnEffectiveFrom: "2026-09-01",
    });

    expect(entries(withReturnToBatch(there))).toEqual(entries(batchOpenOn("tpl-v2")));
  });

  it("volver sin `returnTo` solo quita foco y regreso", () => {
    const params = new URLSearchParams({ operators: "tpl-v1", focus: "asg-1", returnAssign: "emp-1" });
    expect(entries(withReturnToBatch(params))).toEqual({ operators: "tpl-v1" });
  });

  it("D5 «Ver su asignación»: misma plantilla, solo foco, cierra el lote", () => {
    expect(entries(withSameTemplateFocus(batchOpenOn("tpl-v2"), "asg-7"))).toEqual({
      ...entries(fromPayables),
      operators: "tpl-v2",
      focus: "asg-7",
    });
  });

  it("cerrar operadores limpia lote, foco y regreso; conserva Por pagar y filtros", () => {
    const there = withBlockingAssignmentFocus(batchOpenOn("tpl-v2"), {
      targetTemplateId: "tpl-v1",
      assignmentId: "asg-fernando",
      returnTemplateId: "tpl-v2",
      returnEmployeeIds: ["emp-1"],
      returnEffectiveFrom: "2026-09-01",
    });

    expect(entries(withOperatorsClosed(there))).toEqual(entries(fromPayables));
    expect(entries(withOperatorsClosed(batchOpenOn("tpl-v2")))).toEqual(entries(fromPayables));
  });

  it("«Listo»: quita foco y regreso; deja abierto el sheet destino y Por pagar", () => {
    const there = withBlockingAssignmentFocus(batchOpenOn("tpl-v2"), {
      targetTemplateId: "tpl-v1",
      assignmentId: "asg-fernando",
      returnTemplateId: "tpl-v2",
      returnEmployeeIds: ["emp-1"],
      returnEffectiveFrom: "2026-09-01",
    });

    expect(entries(withFocusDismissed(there))).toEqual({
      ...entries(fromPayables),
      operators: "tpl-v1",
    });
  });

  it("lote completo con éxito: además quita el contexto de Por pagar", () => {
    const params = batchOpenOn("tpl-v2");
    params.set("focus", "asg-1");
    params.set("returnTo", "tpl-v1");
    expect(entries(withBatchCompleted(params))).toEqual({ status: "active" });
  });

  it("no muta los parámetros de entrada", () => {
    const params = batchOpenOn("tpl-v2");
    const before = params.toString();
    withOperatorsClosed(params);
    withBatchCompleted(params);
    withSameTemplateFocus(params, "asg-1");
    withReturnToBatch(params);
    withFocusDismissed(params);
    expect(params.toString()).toBe(before);
  });
});
