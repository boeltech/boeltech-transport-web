export interface HelpArticle {
  id: string;
  title: string;
  group: string;
  screens: string[];
  roles: string[];
  phrase: string;
  guide: string | null;
  problem: string | null;
  sortOrder: number;
}

// ── Tickets ──────────────────────────────────────────────

export interface HelpTicketListItem {
  id: string;
  status: string;
  route: string;
  articleId: string | null;
  articleTitle: string | null;
  bodyPreview: string;
  hasAttachment: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HelpTicketAttachment {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  downloadUrl: string;
}

export interface HelpTicketMessage {
  id: string;
  authorType: string;
  body: string;
  createdAt: string;
  attachments: HelpTicketAttachment[];
}

export interface HelpTicketDetail {
  id: string;
  status: string;
  route: string;
  articleId: string | null;
  articleTitle: string | null;
  roleAtCreate: string;
  createdAt: string;
  updatedAt: string;
  messages: HelpTicketMessage[];
}

export interface PaginatedTickets {
  items: HelpTicketListItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
