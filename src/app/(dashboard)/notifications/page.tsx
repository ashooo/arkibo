import Link from "next/link";
import { ArrowUpRight, Briefcase, CalendarDays, ChevronLeft, ChevronRight, GraduationCap, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import sources from "@/features/notifications/sources.json";
import { listAnnouncements, openAnnouncementDb } from "@/features/notifications/store.mjs";
import styles from "./notifications.module.css";

export const dynamic = "force-dynamic";
const pageSize = 5;

const categories = { allowance: "Allowance", spes: "SPES", scholarship: "Scholarship" };
const categoryStyle = {
  scholarship: { Icon: GraduationCap, variant: "primary" },
  allowance: { Icon: Wallet, variant: "success" },
  spes: { Icon: Briefcase, variant: "warning" },
} as const;
const localDay = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Manila" });
const displayDate = new Intl.DateTimeFormat("en-PH", {
  dateStyle: "medium",
  timeZone: "Asia/Manila",
});
// Dates and audiences checked against the linked original notices.
const verifiedDetails: Record<string, { audience: string; action: string; closesOn?: string }> = {
  "https://t.me/pasigscholarship/656": { audience: "Elementary renewal scholars", action: "Online applications · November 10–13, 2026", closesOn: "2026-11-13" },
  "https://t.me/pasigscholarship/663": { audience: "Junior high renewal scholars", action: "Online applications · November 12–20, 2026", closesOn: "2026-11-20" },
  "https://t.me/pasigscholarship/649": { audience: "Approved Landbank cash card applicants", action: "Card claiming · October 24, 2026" },
  "https://t.me/pasigscholarship/642": { audience: "Senior high and college renewal scholars", action: "Appeal deadline · October 19, 2026", closesOn: "2026-10-19" },
};

async function loadAnnouncements() {
  let db: ReturnType<typeof openAnnouncementDb> | undefined;
  try {
    db = openAnnouncementDb();
    return await listAnnouncements(db);
  } catch {
    return null;
  } finally {
    await db?.end();
  }
}

export default async function NotificationsPage({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const category = typeof params.category === "string" && Object.hasOwn(categories, params.category)
    ? params.category : "";
  const from = typeof params.from === "string" && /^\d{4}-\d{2}-\d{2}$/.test(params.from) ? params.from : "";
  const to = typeof params.to === "string" && /^\d{4}-\d{2}-\d{2}$/.test(params.to) ? params.to : "";
  const query = typeof params.q === "string" ? params.q.trim().slice(0, 100) : "";
  const invalidRange = from && to && from > to;
  const announcements = await loadAnnouncements();
  const results = announcements?.filter((post) => {
    const day = localDay.format(post.publishedAt);
    return (!category || post.categories.some((value) => value === category))
      && (!from || day >= from)
      && (!to || day <= to)
      && (!query || `${post.title} ${post.body}`.toLowerCase().includes(query.toLowerCase()));
  });
  const total = results?.length ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const requestedPage = typeof params.page === "string" && /^\d+$/.test(params.page) ? Number(params.page) : 1;
  const page = Math.min(pageCount, Math.max(1, requestedPage));
  const start = (page - 1) * pageSize;
  const visibleNotices = results?.slice(start, start + pageSize) ?? [];

  const pageNumbers = [...new Set([1, page - 1, page, page + 1, pageCount])]
    .filter((number) => number >= 1 && number <= pageCount).sort((a, b) => a - b);
  const today = localDay.format(new Date());

  function pageHref(target: number, selectedCategory = category) {
    const filters = new URLSearchParams();
    for (const [key, value] of Object.entries({ q: query, category: selectedCategory, from, to })) {
      if (value) filters.set(key, value);
    }
    filters.set("page", String(target));
    return `/notifications?${filters}`;
  }

  return (
    <section className="flex flex-col gap-6 pb-8 text-on-surface dark:text-slate-100">
      <header className="workspace-banner">
        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Announcements</h1>
          <p className="text-sm text-on-surface-variant dark:text-slate-400">
            Scholarship, allowance, and SPES updates from official sources.
          </p>
        </div>
      </header>
      <form action="/notifications" method="get" className={styles.filters}>
        <nav aria-label="Announcement categories" className="col-span-full min-w-0">
          <div className="flex flex-wrap gap-2">
            {Object.entries({ "": "All", scholarship: "Scholarship", allowance: "Allowance", spes: "SPES" }).map(([value, label]) => (
              <Link className={styles.pageLink} aria-current={category === value ? "page" : undefined} href={pageHref(1, value)} key={value}>{label}</Link>
            ))}
          </div>
        </nav>
        <input type="hidden" name="category" value={category} />
        <label className="sm:col-span-2 lg:col-span-1">Search<input type="search" name="q" placeholder="Try renewal or Landbank" maxLength={100} defaultValue={query} /></label>
        <label>From<input type="date" name="from" defaultValue={from} /></label>
        <label>To<input type="date" name="to" defaultValue={to} /></label>
        <div className={styles.actions}>
          <Button className="min-h-11" type="submit">Apply filters</Button>
          <Link className={styles.link} href="/notifications">Clear filters</Link>
        </div>
      </form>
      {invalidRange && <p className={styles.status} role="alert">Choose a From date on or before the To date.</p>}
      {!invalidRange && !results && <p className={styles.status} role="alert">Announcements are temporarily unavailable. Please try again later.</p>}
      {!invalidRange && results?.length === 0 && (
        <p className={styles.status}>{category || from || to || query
          ? "No announcements match these filters."
          : "No announcements have been added yet."}</p>
      )}
      {!invalidRange && !!results?.length && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-xl font-bold">Notices</h2>
            <p className="text-sm text-on-surface-variant dark:text-slate-300">Showing {start + 1}–{start + visibleNotices.length} of {total} · Newest first</p>
          </div>
          <ul className="space-y-4">
          {visibleNotices.map((post) => {
            const source = sources[post.source as keyof typeof sources]?.name ?? post.source;
            const details = verifiedDetails[post.sourceUrl];
            return (
            <li className={styles.notice} key={`${post.source}:${post.postId}`}>
              <div className="min-w-0 space-y-3">
              <h3 className="break-words text-lg font-bold leading-snug">{post.title}</h3>
              <div className={styles.meta}>
                {post.categories.map((value) => {
                  const { Icon, variant } = categoryStyle[value];
                  return <Badge variant={variant} size="sm" key={value}><Icon aria-hidden="true" size={13} className="mr-1" />{categories[value]}</Badge>;
                })}
                <time dateTime={post.publishedAt.toISOString()}>{displayDate.format(post.publishedAt)}</time>
              </div>
              {post.body && post.body !== post.title && <p className="max-w-prose break-words text-sm leading-relaxed text-on-surface-variant dark:text-slate-300">{post.body.length > 320 ? `${post.body.slice(0, 320).trimEnd()}…` : post.body}</p>}
              {details && (
                <div className="rounded-md bg-surface-low p-3 text-sm dark:bg-dark-surface">
                  <p className="font-semibold">{details.audience}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-2"><CalendarDays size={16} aria-hidden="true" />{details.action}
                    {details.closesOn && today > details.closesOn && <Badge size="sm">Closed</Badge>}
                  </p>
                </div>
              )}
              <div className="flex flex-wrap items-center justify-between gap-x-5 border-t border-slate-border pt-2 dark:border-dark-border">
                <span className="text-sm text-on-surface-variant dark:text-slate-300">{source}</span>
                <a className={styles.link} href={post.sourceUrl} aria-label={`View original notice: ${post.title}`}>View original notice <ArrowUpRight aria-hidden="true" size={16} /></a>
              </div>
              </div>
            </li>
            );
          })}
          </ul>
          {pageCount > 1 && (
            <nav aria-label="Announcement pages" className="flex flex-wrap items-center justify-between gap-2 pt-3">
              {page > 1 ? (
                <a className={styles.pageLink} href={pageHref(page - 1)}><ChevronLeft size={16} aria-hidden="true" /> Previous</a>
              ) : <span className={styles.pageDisabled}><ChevronLeft size={16} aria-hidden="true" /> Previous</span>}
              <span className="text-sm tabular-nums sm:hidden">Page {page} of {pageCount}</span>
              <div className="hidden items-center gap-1 sm:flex">
                {pageNumbers.map((number, index) => (
                  <span className="flex items-center gap-1" key={number}>
                    {index > 0 && number - pageNumbers[index - 1] > 1 && <span aria-hidden="true">…</span>}
                    <a className={styles.pageLink} href={pageHref(number)} aria-label={`Page ${number}`} aria-current={number === page ? "page" : undefined}>{number}</a>
                  </span>
                ))}
              </div>
              {page < pageCount ? (
                <a className={styles.pageLink} href={pageHref(page + 1)}>Next <ChevronRight size={16} aria-hidden="true" /></a>
              ) : <span className={styles.pageDisabled}>Next <ChevronRight size={16} aria-hidden="true" /></span>}
            </nav>
          )}
        </div>
      )}
    </section>
  );
}
