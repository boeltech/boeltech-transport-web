import { describe, expect, it } from "vitest";
import {
  mapHelpArticle,
  mapHelpArticleListResponse,
  mapHelpArticleSingleResponse,
  mapTicketListItem,
  mapTicketListResponse,
  mapTicketDetail,
  type ApiHelpArticleRaw,
  type ApiTicketListItemRaw,
  type ApiTicketListResponseRaw,
  type ApiTicketDetailRaw,
} from "./mappers";

const RAW_ARTICLE: ApiHelpArticleRaw = {
  id: "facturar-viaje",
  title: "Facturar un viaje",
  group: "facturacion",
  screens: ["/finance/invoiceable", "/invoices/:id"],
  roles: ["admin", "manager", "accountant"],
  phrase: "Timbra el CFDI de flete con Carta Porte…",
  guide: "1. Abre **Facturación → Por facturar**…",
  problem: "**Síntoma:** El botón Facturar…",
  sort_order: 10,
};

const RAW_TICKET_LIST_ITEM: ApiTicketListItemRaw = {
  id: "ticket-uuid-1",
  status: "open",
  route: "/trips/abc-123",
  article_id: "facturar-viaje",
  article_title: "Facturar un viaje",
  body_preview: "El botón Facturar no…",
  has_attachment: true,
  created_at: "2026-10-03T16:00:00.000Z",
  updated_at: "2026-10-03T16:00:00.000Z",
};

const RAW_TICKET_DETAIL: ApiTicketDetailRaw = {
  id: "ticket-uuid-1",
  status: "open",
  route: "/trips/abc-123",
  article_id: "facturar-viaje",
  article_title: "Facturar un viaje",
  role_at_create: "accountant",
  created_at: "2026-10-03T16:00:00.000Z",
  updated_at: "2026-10-03T16:00:00.000Z",
  messages: [
    {
      id: "uuid-msg",
      author_type: "tenant",
      body: "El botón Facturar no aparece…",
      created_at: "2026-10-03T16:00:00.000Z",
      attachments: [
        {
          id: "uuid-att",
          file_name: "captura.png",
          file_size: 245760,
          mime_type: "image/png",
          download_url: "/api/v1/help/tickets/ticket-uuid-1/attachments/uuid-att",
        },
      ],
    },
  ],
};

describe("help-center mappers", () => {
  describe("mapHelpArticle", () => {
    it("maps sort_order → sortOrder", () => {
      const result = mapHelpArticle(RAW_ARTICLE);
      expect(result.sortOrder).toBe(10);
      expect(result.id).toBe("facturar-viaje");
      expect(result.title).toBe("Facturar un viaje");
      expect(result.group).toBe("facturacion");
      expect(result.screens).toEqual(["/finance/invoiceable", "/invoices/:id"]);
      expect(result.roles).toEqual(["admin", "manager", "accountant"]);
      expect(result.phrase).toBe("Timbra el CFDI de flete con Carta Porte…");
      expect(result.guide).toBe("1. Abre **Facturación → Por facturar**…");
      expect(result.problem).toBe("**Síntoma:** El botón Facturar…");
    });

    it("handles guide: null and problem: null", () => {
      const raw: ApiHelpArticleRaw = {
        ...RAW_ARTICLE,
        guide: null,
        problem: null,
      };
      const result = mapHelpArticle(raw);
      expect(result.guide).toBeNull();
      expect(result.problem).toBeNull();
    });
  });

  describe("mapHelpArticleListResponse", () => {
    it("returns array of HelpArticle", () => {
      const result = mapHelpArticleListResponse({
        data: [RAW_ARTICLE, { ...RAW_ARTICLE, id: "enviar-factura", sort_order: 20 }],
      });
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("facturar-viaje");
      expect(result[0].sortOrder).toBe(10);
      expect(result[1].id).toBe("enviar-factura");
      expect(result[1].sortOrder).toBe(20);
    });

    it("returns empty array when data is empty", () => {
      const result = mapHelpArticleListResponse({ data: [] });
      expect(result).toEqual([]);
    });
  });

  describe("mapHelpArticleSingleResponse", () => {
    it("unwraps data envelope", () => {
      const result = mapHelpArticleSingleResponse({ data: RAW_ARTICLE });
      expect(result.id).toBe("facturar-viaje");
      expect(result.sortOrder).toBe(10);
    });
  });

  describe("mapTicketListItem", () => {
    it("maps body_preview → bodyPreview and has_attachment → hasAttachment", () => {
      const result = mapTicketListItem(RAW_TICKET_LIST_ITEM);
      expect(result.bodyPreview).toBe("El botón Facturar no…");
      expect(result.hasAttachment).toBe(true);
      expect(result.articleId).toBe("facturar-viaje");
      expect(result.articleTitle).toBe("Facturar un viaje");
      expect(result.status).toBe("open");
      expect(result.route).toBe("/trips/abc-123");
    });
  });

  describe("mapTicketListResponse", () => {
    it("returns PaginatedTickets with correct pagination", () => {
      const raw: ApiTicketListResponseRaw = {
        data: [RAW_TICKET_LIST_ITEM],
        pagination: {
          page: 1,
          page_size: 20,
          total: 3,
          total_pages: 1,
        },
      };
      const result = mapTicketListResponse(raw);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].bodyPreview).toBe("El botón Facturar no…");
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(20);
      expect(result.total).toBe(3);
      expect(result.totalPages).toBe(1);
    });
  });

  describe("mapTicketDetail", () => {
    it("maps role_at_create → roleAtCreate and attachments download_url → downloadUrl", () => {
      const result = mapTicketDetail(RAW_TICKET_DETAIL);
      expect(result.roleAtCreate).toBe("accountant");
      expect(result.messages).toHaveLength(1);
      expect(result.messages[0].authorType).toBe("tenant");
      expect(result.messages[0].body).toBe("El botón Facturar no aparece…");
      expect(result.messages[0].attachments).toHaveLength(1);
      expect(result.messages[0].attachments[0].fileName).toBe("captura.png");
      expect(result.messages[0].attachments[0].fileSize).toBe(245760);
      expect(result.messages[0].attachments[0].mimeType).toBe("image/png");
      expect(result.messages[0].attachments[0].downloadUrl).toBe(
        "/api/v1/help/tickets/ticket-uuid-1/attachments/uuid-att",
      );
    });
  });
});
