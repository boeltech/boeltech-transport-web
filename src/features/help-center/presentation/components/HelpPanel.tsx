import { memo, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AlertCircle, BookOpen, Mail, Search, Ticket, TicketPlus } from "lucide-react";
import { useDebounce } from "@shared/hooks";
import { Button } from "@shared/ui/button";
import { BRAND } from "@shared/ui/brand";
import { DetailAlertCard } from "@shared/ui/data-display";
import { EmptyState } from "@shared/ui/feedback-states";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@shared/ui/sheet";
import { useAuth } from "@/shared/hooks/useAuth";
import config from "@shared/config/env";
import { buildSupportMailto } from "@widgets/header/lib/buildSupportMailto";
import {
  useHelpArticle,
  useHelpArticles,
  useOpenTicketCount,
} from "../../application";
import { trackHelpSearchPerformed } from "../../application/trackHelpEvent";
import type { HelpArticle } from "../../domain";
import { helpCenterCopy } from "../copy/helpCenterCopy";
import { ArticleCard } from "./ArticleCard";
import { ArticleSearch } from "./ArticleSearch";
import { CreateTicketSheet } from "./CreateTicketSheet";

const copy = helpCenterCopy.panel;
const indexCopy = helpCenterCopy.index;
const pausedCopy = helpCenterCopy.ticketsPaused;

interface HelpPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Deep-link: expand this article when the panel opens (empty / ⌘K). */
  expandArticleId?: string | null;
}

export const HelpPanel = memo(function HelpPanel({
  open,
  onOpenChange,
  expandArticleId = null,
}: HelpPanelProps) {
  const location = useLocation();
  const { user } = useAuth();
  const currentPath = location.pathname;
  const ticketsEnabled = config.help.ticketsEnabled;

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [ticketSheetOpen, setTicketSheetOpen] = useState(false);
  const [ticketArticle, setTicketArticle] = useState<{
    id: string;
    title: string;
  } | null>(null);

  const isSearching = debouncedSearch.length >= 2;

  useEffect(() => {
    if (!open || !isSearching) return;
    trackHelpSearchPerformed(debouncedSearch, "panel", currentPath);
  }, [open, isSearching, debouncedSearch, currentPath]);

  const handlePanelOpenChange = (next: boolean) => {
    if (!next) setSearch("");
    onOpenChange(next);
  };

  const screenFilters = useMemo(
    () => ({ screen: currentPath }),
    [currentPath],
  );
  const searchFilters = useMemo(
    () => (isSearching ? { q: debouncedSearch } : {}),
    [isSearching, debouncedSearch],
  );

  const screenQuery = useHelpArticles(screenFilters, {
    enabled: open && !isSearching,
  });
  const allQuery = useHelpArticles({}, { enabled: open && !isSearching });
  const searchQuery = useHelpArticles(searchFilters, {
    enabled: open && isSearching,
  });
  const pinnedQuery = useHelpArticle(expandArticleId ?? "", {
    enabled: open && Boolean(expandArticleId) && !isSearching,
  });
  const { data: openTicketCount = 0 } = useOpenTicketCount({
    enabled: open && ticketsEnabled,
  });

  const screenArticles = screenQuery.data;
  const allArticles = allQuery.data;
  const searchResults = searchQuery.data;
  const pinnedArticle = pinnedQuery.data;

  const frequentArticles = useMemo(() => {
    if (!allArticles || !screenArticles) return [];
    const screenIds = new Set(screenArticles.map((a) => a.id));
    if (expandArticleId) screenIds.add(expandArticleId);
    return allArticles.filter((a) => !screenIds.has(a.id)).slice(0, 5);
  }, [allArticles, screenArticles, expandArticleId]);

  const pinnedInScreen = useMemo(() => {
    if (!expandArticleId || !screenArticles) return false;
    return screenArticles.some((a) => a.id === expandArticleId);
  }, [expandArticleId, screenArticles]);

  const isLoading = isSearching
    ? searchQuery.isLoading
    : screenQuery.isLoading ||
      allQuery.isLoading ||
      (Boolean(expandArticleId) &&
        pinnedQuery.isLoading &&
        !pinnedInScreen);

  const showLoadError =
    !isLoading &&
    (isSearching
      ? searchQuery.isError
      : screenQuery.isError ||
        allQuery.isError ||
        (Boolean(expandArticleId) &&
          pinnedQuery.isError &&
          !pinnedInScreen));

  const handleRetry = () => {
    if (isSearching) {
      void searchQuery.refetch();
      return;
    }
    void screenQuery.refetch();
    void allQuery.refetch();
    if (expandArticleId) void pinnedQuery.refetch();
  };

  const mailtoHref = buildSupportMailto({
    supportEmail: config.support.email,
    productName: config.app.name || BRAND.productName,
    tenantName: user?.tenant?.name,
    userEmail: user?.email,
    currentPath: `${location.pathname}${location.search}`,
    environment: config.observability.environment,
    release: config.observability.release,
  });

  const closePanel = () => handlePanelOpenChange(false);

  const openTicketSheet = (article?: HelpArticle) => {
    if (!ticketsEnabled) return;
    setTicketArticle(
      article ? { id: article.id, title: article.title } : null,
    );
    closePanel();
    setTicketSheetOpen(true);
  };

  const onOpenTicket = ticketsEnabled ? openTicketSheet : undefined;

  return (
    <>
    <Sheet open={open} onOpenChange={handlePanelOpenChange}>
      <SheetContent
        side="right"
        data-help-panel=""
        className="flex w-full flex-col gap-0 overflow-hidden sm:max-w-md transition-transform duration-200 data-[help-spotlight]:pointer-events-none data-[help-spotlight]:translate-x-full data-[help-spotlight]:opacity-0"
      >
        <SheetHeader className="shrink-0 px-0">
          <SheetTitle>{copy.title}</SheetTitle>
          <SheetDescription className="sr-only">
            {copy.title}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 shrink-0">
          <ArticleSearch value={search} onChange={setSearch} />
        </div>

        <div className="mt-4 flex-1 space-y-5 overflow-y-auto pb-4">
          {isLoading && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-16 animate-pulse rounded-lg bg-muted"
                />
              ))}
            </div>
          )}

          {showLoadError ? (
            <DetailAlertCard
              severity="critical"
              icon={<AlertCircle className="h-5 w-5" aria-hidden />}
              title={indexCopy.loadErrorTitle}
              action={
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRetry}
                >
                  {indexCopy.loadErrorRetry}
                </Button>
              }
            >
              <p>{indexCopy.loadErrorDescription}</p>
            </DetailAlertCard>
          ) : null}

          {!isLoading && !showLoadError && isSearching && (
            <ArticleSection
              articles={searchResults ?? []}
              emptyMessage={copy.noResults}
              onNavigate={closePanel}
              onOpenTicket={onOpenTicket}
              expandArticleId={expandArticleId}
            />
          )}

          {!isLoading && !showLoadError && !isSearching && (
            <>
              {expandArticleId && pinnedArticle && !pinnedInScreen ? (
                <section>
                  <ArticleList
                    articles={[pinnedArticle]}
                    onNavigate={closePanel}
                    onOpenTicket={onOpenTicket}
                    expandArticleId={expandArticleId}
                  />
                </section>
              ) : null}

              {(screenArticles?.length ?? 0) > 0 && (
                <section>
                  <SectionHeading>{copy.forThisScreen}</SectionHeading>
                  <ArticleList
                    articles={screenArticles!}
                    onNavigate={closePanel}
                    onOpenTicket={onOpenTicket}
                    expandArticleId={expandArticleId}
                  />
                </section>
              )}

              <section>
                <SectionHeading>{copy.frequentArticles}</SectionHeading>
                {frequentArticles.length > 0 ? (
                  <ArticleList
                    articles={frequentArticles}
                    onNavigate={closePanel}
                    onOpenTicket={onOpenTicket}
                    expandArticleId={expandArticleId}
                  />
                ) : (
                  <EmptyState
                    size="sm"
                    icon={<BookOpen />}
                    title={copy.noResults}
                  />
                )}
              </section>
            </>
          )}

          <nav className="flex flex-col gap-2 border-t pt-4">
            {ticketsEnabled ? (
              <Link
                to="/ayuda/tickets"
                onClick={closePanel}
                className="inline-flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary"
              >
                <Ticket className="h-4 w-4" />
                {copy.myTickets(openTicketCount)}
              </Link>
            ) : null}
            <Link
              to="/ayuda"
              onClick={closePanel}
              className="inline-flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary"
            >
              <BookOpen className="h-4 w-4" />
              {copy.viewAllArticles}
            </Link>
          </nav>
        </div>

        <div className="shrink-0 space-y-2 border-t pt-4">
          {ticketsEnabled ? (
            <>
              <p className="text-xs font-medium text-muted-foreground">
                {copy.notFoundAnswer}
              </p>
              <Button
                variant="default"
                size="sm"
                className="w-full"
                onClick={() => openTicketSheet()}
              >
                <TicketPlus className="mr-2 h-4 w-4" />
                {copy.sendTicket}
              </Button>
              <Button variant="outline" size="sm" className="w-full" asChild>
                <a href={mailtoHref}>
                  <Mail className="mr-2 h-4 w-4" />
                  {copy.contactByEmail}
                </a>
              </Button>
            </>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">
                {pausedCopy.panelHint}
              </p>
              <Button variant="default" size="sm" className="w-full" asChild>
                <a href={mailtoHref}>
                  <Mail className="mr-2 h-4 w-4" />
                  {copy.contactByEmail}
                </a>
              </Button>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
    {ticketsEnabled ? (
      <CreateTicketSheet
        open={ticketSheetOpen}
        onOpenChange={(next) => {
          setTicketSheetOpen(next);
          if (!next) setTicketArticle(null);
        }}
        articleId={ticketArticle?.id}
        articleTitle={ticketArticle?.title}
        route={currentPath}
        tenantName={user?.tenant?.name}
      />
    ) : null}
    </>
  );
});

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </h3>
  );
}

function ArticleList({
  articles,
  onNavigate,
  onOpenTicket,
  expandArticleId,
}: {
  articles: HelpArticle[];
  onNavigate: () => void;
  onOpenTicket?: (article: HelpArticle) => void;
  expandArticleId?: string | null;
}) {
  return (
    <div className="space-y-2">
      {articles.map((article) => (
        <ArticleCard
          key={article.id}
          article={article}
          onNavigate={onNavigate}
          onOpenTicket={onOpenTicket}
          defaultExpanded={expandArticleId === article.id}
        />
      ))}
    </div>
  );
}

function ArticleSection({
  articles,
  emptyMessage,
  onNavigate,
  onOpenTicket,
  expandArticleId,
}: {
  articles: HelpArticle[];
  emptyMessage: string;
  onNavigate: () => void;
  onOpenTicket?: (article: HelpArticle) => void;
  expandArticleId?: string | null;
}) {
  if (articles.length === 0) {
    return (
      <EmptyState
        size="sm"
        icon={<Search />}
        title={emptyMessage}
      />
    );
  }
  return (
    <ArticleList
      articles={articles}
      onNavigate={onNavigate}
      onOpenTicket={onOpenTicket}
      expandArticleId={expandArticleId}
    />
  );
}
