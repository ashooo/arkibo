import { load } from "cheerio";

const cityArchive = "https://pasigcity.gov.ph/news-and-releases";
const cityArticle = /^\/news-and-releases\/[a-z0-9-]+$/;
const plpFeed = "https://plpasig.edu.ph/feed/";
const historicNotices = [
  "renewal-application-para-sa-pasig-city-scholarship-program-core-academic-para-sa-ay-2026-2027-magbubukas-na-158",
  "scholarship-program-updates-timeline-for-allowance-releases-864",
  "spes-isy-2026-applications-schedule-391",
];

async function readPublicPage(url, headers) {
  const response = await fetch(url, { headers, signal: AbortSignal.timeout(15_000), redirect: "error" });
  if (!response.ok) throw new Error(`${new URL(url).hostname} returned HTTP ${response.status}.`);
  return response.text();
}

function excerpt(text) {
  const normalized = text.replaceAll("\0", "").replace(/\s+/g, " ").trim();
  const characters = Array.from(normalized);
  return characters.length > 240 ? `${characters.slice(0, 239).join("").trimEnd()}…` : normalized;
}

function cityDate(text) {
  if (!/^[A-Z][a-z]+ \d{1,2}, \d{4}$/.test(text)) return null;
  const instant = new Date(`${text} 00:00:00 GMT+0800`);
  return Number.isFinite(+instant) ? instant.toISOString() : null;
}

async function readCityNotice(url) {
  const $ = load(await readPublicPage(url));
  const heading = $("h1.mt-0").first();
  const title = heading.text().trim();
  const date = $(".news-date p").first().text().trim();
  const created_time = cityDate(date);
  if (!title || !created_time) throw new Error("Pasig City article is missing its title or publication date.");
  const description = $('meta[property="og:description"]').last().attr("content") ?? "";
  return { id: new URL(url).pathname, title, message: excerpt(description), created_time, permalink_url: url };
}

export async function* fetchCityAnnouncements(since, firstRun) {
  const seen = new Set();
  if (firstRun) {
    for (const slug of historicNotices) {
      const notice = await readCityNotice(`${cityArchive}/${slug}`);
      seen.add(notice.id);
      yield { ...notice, historical: true };
    }
  }

  for (let page = 1; page <= 60; page += 1) {
    const url = page === 1 ? cityArchive : `${cityArchive}?page=${page}`;
    const $ = load(await readPublicPage(url, page > 1 ? { "X-Requested-With": "XMLHttpRequest" } : undefined));
    const cards = $(".news-content").toArray();
    if (!cards.length) {
      if (page === 1) throw new Error("Pasig City archive contains no recognizable article cards.");
      return;
    }
    let oldest = Infinity;
    let newLinks = 0;
    for (const card of cards) {
      const item = $(card);
      const title = item.find("h4").first().text().trim();
      const created_time = cityDate(item.find(".date").first().text().trim());
      const href = item.find("a[href]").first().attr("href");
      if (!created_time || !title || !href) continue;
      const link = new URL(href, cityArchive);
      if (link.origin !== new URL(cityArchive).origin || !cityArticle.test(link.pathname)) continue;
      const published = Date.parse(created_time);
      oldest = Math.min(oldest, published);
      if (seen.has(link.pathname)) continue;
      seen.add(link.pathname);
      newLinks += 1;
      if (published < +since - 86_400_000) continue;
      const summary = item.find("p:not(.date)").first().text();
      yield { id: link.pathname, title, message: excerpt(summary), created_time, permalink_url: `${link.origin}${link.pathname}` };
    }
    if (oldest < +since - 86_400_000) return;
    if (!newLinks) throw new Error("Pasig City archive pagination did not advance.");
  }
  throw new Error("Pasig City archive exceeded the per-run page limit.");
}

export async function* fetchPlpAnnouncements() {
  const $ = load(await readPublicPage(plpFeed), { xml: true });
  if (!$("rss channel").length) throw new Error("PLP did not return a valid RSS feed.");
  for (const element of $("channel > item").toArray()) {
    const item = $(element);
    const permalink_url = item.children("link").text().trim();
    const title = item.children("title").text().trim();
    const summary = load(item.children("description").text(), {}, false).text();
    yield {
      id: permalink_url,
      title,
      message: excerpt(summary),
      created_time: item.children("pubDate").text().trim(),
      permalink_url,
    };
  }
}
