/** TEC Ola A §5 — eventos de producto help. */

export type HelpViewSurface = "panel" | "page";
export type HelpSearchSurface = "panel" | "index" | "command";

export type HelpSpotlightUnavailableReason =
  | "not_in_dom"
  | "not_visible"
  | "wrong_screen";

export type HelpProductEvent =
  | {
      eventName: "help_article_viewed";
      articleId: string;
      route?: string;
      payload: { surface: HelpViewSurface };
    }
  | {
      eventName: "help_article_feedback";
      articleId: string;
      route?: string;
      payload: { helpful: boolean };
    }
  | {
      eventName: "help_search_performed";
      articleId?: string;
      route?: string;
      payload: {
        qHash: string;
        qLen: number;
        surface: HelpSearchSurface;
      };
    }
  | {
      eventName: "help_ticket_created_after_article";
      articleId: string;
      route?: string;
      payload: { ticketId: string };
    }
  | {
      eventName: "help_spotlight_shown";
      articleId: string;
      route?: string;
      payload: { anchorId: string };
    }
  | {
      eventName: "help_spotlight_unavailable";
      articleId: string;
      route?: string;
      payload: {
        anchorId: string;
        reason: HelpSpotlightUnavailableReason;
      };
    };
