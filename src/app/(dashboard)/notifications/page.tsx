import Link from "next/link";
import sources from "@/features/notifications/sources.json";
import { listAnnouncements, openAnnouncementDb } from "@/features/notifications/store.mjs";
import styles from "./notifications.module.css";

export const dynamic = "force-dynamic";

const categories = { allowance: "Allowance", spes: "SPES", scholarship: "Scholarship" };
const localDay = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Manila" });
const displayDate = new Intl.DateTimeFormat("en-PH", {
  dateStyle: "medium",
  timeZone: "Asia/Manila",
});

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

  return (
    <section className="card">
      <h1>Announcements</h1>
      <form action="/notifications" method="get" className={styles.filters}>
        <label>Search<input type="search" name="q" maxLength={100} defaultValue={query} /></label>
        <label>Category
          <select name="category" defaultValue={category}>
            <option value="">All categories</option>
            {Object.entries(categories).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </select>
        </label>
        <label>From<input type="date" name="from" defaultValue={from} /></label>
        <label>To<input type="date" name="to" defaultValue={to} /></label>
        <div className={styles.actions}>
          <button type="submit">Apply filters</button>
          <Link href="/notifications">Clear filters</Link>
        </div>
      </form>
      {invalidRange && <p role="alert">Choose a From date on or before the To date.</p>}
      {!invalidRange && !results && <p role="alert">Announcements are temporarily unavailable. Please try again later.</p>}
      {!invalidRange && results?.length === 0 && (
        <p className="muted">{category || from || to || query
          ? "No announcements match these filters."
          : "No announcements have been added yet."}</p>
      )}
      {!invalidRange && !!results?.length && (
        <ul className={styles.results}>
          {results.map((post) => (
            <li key={`${post.source}:${post.postId}`}>
              <div className={styles.meta}>
                {post.categories.map((value) => <span className={styles.badge} key={value}>{categories[value]}</span>)}
                <time dateTime={post.publishedAt.toISOString()}>{displayDate.format(post.publishedAt)}</time>
              </div>
              <h2>{post.title}</h2>
              {post.body !== post.title && <p>{post.body.length > 320 ? `${post.body.slice(0, 320).trimEnd()}…` : post.body}</p>}
              <a href={post.sourceUrl}>View original post from {sources[post.source as keyof typeof sources]?.name ?? post.source}</a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
