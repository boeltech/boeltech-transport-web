import { deepToCamel } from "@shared/api";
import type {
  HelpArticle,
  HelpTicketListItem,
  HelpTicketDetail,
  PaginatedTickets,
} from "../domain";

// ── Articles ─────────────────────────────────────────────

export interface ApiHelpArticleRaw {
  id: string;
  title: string;
  group: string;
  screens: string[];
  roles: string[];
  phrase: string;
  guide: string | null;
  problem: string | null;
  sort_order: number;
}

export function mapHelpArticle(raw: ApiHelpArticleRaw): HelpArticle {
  return deepToCamel(raw) as HelpArticle;
}

export function mapHelpArticleListResponse(response: {
  data: ApiHelpArticleRaw[];
}): HelpArticle[] {
  return response.data.map(mapHelpArticle);
}

export function mapHelpArticleSingleResponse(response: {
  data: ApiHelpArticleRaw;
}): HelpArticle {
  return mapHelpArticle(response.data);
}

// ── Tickets ──────────────────────────────────────────────

export interface ApiTicketListItemRaw {
  id: string;
  status: string;
  route: string;
  article_id: string | null;
  article_title: string | null;
  body_preview: string;
  has_attachment: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApiTicketListResponseRaw {
  data: ApiTicketListItemRaw[];
  pagination: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
  };
}

export interface ApiTicketAttachmentRaw {
  id: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  download_url: string;
}

export interface ApiTicketMessageRaw {
  id: string;
  author_type: string;
  body: string;
  created_at: string;
  attachments: ApiTicketAttachmentRaw[];
}

export interface ApiTicketDetailRaw {
  id: string;
  status: string;
  route: string;
  article_id: string | null;
  article_title: string | null;
  role_at_create: string;
  created_at: string;
  updated_at: string;
  messages: ApiTicketMessageRaw[];
}

export function mapTicketListItem(
  raw: ApiTicketListItemRaw,
): HelpTicketListItem {
  return deepToCamel(raw) as HelpTicketListItem;
}

export function mapTicketListResponse(
  response: ApiTicketListResponseRaw,
): PaginatedTickets {
  return {
    items: response.data.map(mapTicketListItem),
    page: response.pagination.page,
    pageSize: response.pagination.page_size,
    total: response.pagination.total,
    totalPages: response.pagination.total_pages,
  };
}

export function mapTicketDetail(raw: ApiTicketDetailRaw): HelpTicketDetail {
  return deepToCamel(raw) as HelpTicketDetail;
}

export function mapTicketDetailResponse(response: {
  data: ApiTicketDetailRaw;
}): HelpTicketDetail {
  return mapTicketDetail(response.data);
}
