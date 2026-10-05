import { describe, expect, it } from "vitest";
import { helpCenterCopy } from "./helpCenterCopy";

describe("helpCenterCopy.panel.myTickets", () => {
  it("omits count when N is 0 or omitted", () => {
    expect(helpCenterCopy.panel.myTickets()).toBe("Mis tickets");
    expect(helpCenterCopy.panel.myTickets(0)).toBe("Mis tickets");
  });

  it("includes count when N > 0", () => {
    expect(helpCenterCopy.panel.myTickets(1)).toBe("Mis tickets (1)");
    expect(helpCenterCopy.panel.myTickets(4)).toBe("Mis tickets (4)");
  });
});

describe("helpCenterCopy.feedback", () => {
  it("exposes PRD §F feedback strings", () => {
    expect(helpCenterCopy.feedback.question).toBe(
      "¿Te sirvió este artículo?",
    );
    expect(helpCenterCopy.feedback.yes).toBe("Sí");
    expect(helpCenterCopy.feedback.no).toBe("No");
    expect(helpCenterCopy.feedback.thanks).toBe("Gracias");
    expect(helpCenterCopy.feedback.sendTicketAboutThis).toBe(
      "Enviar un ticket sobre esto",
    );
  });
});

describe("helpCenterCopy.surfaces", () => {
  it("exposes PRD §F A2 strings for empty and ⌘K", () => {
    expect(helpCenterCopy.surfaces.viewHelp).toBe("Ver ayuda");
    expect(helpCenterCopy.surfaces.commandGroup).toBe("Ayuda");
  });
});

describe("helpCenterCopy.spotlight", () => {
  it("exposes PRD §F A1 spotlight strings", () => {
    expect(helpCenterCopy.spotlight.cta).toBe("Muéstrame dónde");
    expect(helpCenterCopy.spotlight.done).toBe("Listo");
    expect(helpCenterCopy.spotlight.unavailable).toBe(
      "No está disponible en esta vista",
    );
  });
});

describe("helpCenterCopy product labels (PRD D1–D5)", () => {
  it("uses operative group/index copy without «Concepto fiscal» / «plataforma»", () => {
    expect(helpCenterCopy.groups.concepto_fiscal).toBe("Conceptos de factura");
    expect(helpCenterCopy.index.description).toBe(
      "Guías y artículos para operar día a día",
    );
  });

  it("exposes ticket detail and create-ticket error strings", () => {
    expect(helpCenterCopy.ticketDetail.title).toBe("Detalle del ticket");
    expect(helpCenterCopy.ticketDetail.downloadError).toBe(
      "No se pudo descargar el archivo. Intenta de nuevo.",
    );
    expect(helpCenterCopy.createTicket.errorCreate).toBe(
      "Error al crear el ticket",
    );
  });
});
