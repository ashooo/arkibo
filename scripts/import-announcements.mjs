import { readFile } from "node:fs/promises";
import { loadEnvFile } from "node:process";
import { openAnnouncementDb, saveAnnouncement } from "../src/features/notifications/store.mjs";
import { fetchCityAnnouncements, fetchPlpAnnouncements } from "./official-announcement-sources.mjs";
import { telegramNotice, telegramUpdates, fetchPublicTelegramAnnouncements } from "./telegram-announcements.mjs";
import { topics, classifyAnnouncement } from "../src/features/notifications/topics.mjs";

const sources = JSON.parse(await readFile(new URL("../src/features/notifications/sources.json", import.meta.url)));
const day = 86_400_000;

function announcement(source, post) {
  if (!post || typeof post.id !== "string" || !post.id.trim()
    || typeof post.created_time !== "string" || typeof post.permalink_url !== "string") {
    throw new Error("Post is missing its ID, publication date, or link.");
  }
  const publishedAt = new Date(post.created_time);
  const link = new URL(post.permalink_url);
  if (source === "pasig-scholars-telegram") {
    const match = link.pathname.match(/^\/(?:s\/)?pasigscholarship\/([1-9]\d*)\/?$/);
    if (!match) throw new Error("Use a direct Pasig Scholars Telegram post link.");
    post = { ...post, id: match[1] };
    link.pathname = `/pasigscholarship/${match[1]}`;
    link.search = "";
    link.hash = "";
  }
  const hosts = sources[source].websiteHost
    ? [sources[source].websiteHost]
    : ["facebook.com", "www.facebook.com", "m.facebook.com"];
  if (!Number.isFinite(+publishedAt) || link.protocol !== "https:"
    || !hosts.includes(link.hostname)
    || link.username || link.password || link.port) {
    throw new Error("Post has an invalid publication date or source link.");
  }
  const body = typeof post.message === "string" ? post.message.replaceAll("\0", "").trim() : "";
  const title = (post.title || Array.from(body.split(/\r?\n/)[0]).slice(0, 100).join("")).replaceAll("\0", "").trim();
  const content = `${title} ${body}`.normalize("NFKC");
  const categories = classifyAnnouncement(content);
  return { source, postId: post.id, publishedAt, sourceUrl: link.href, body, categories, title };
}

async function* fetchPosts(pageId, token, version, since, until) {
  const url = new URL(`https://graph.facebook.com/${version}/${pageId}/posts`);
  url.search = new URLSearchParams({
    fields: "id,message,created_time,permalink_url",
    since: String(Math.floor(+since / 1000)),
    until: String(Math.ceil(+until / 1000)),
    limit: "50",
  });
  const cursors = new Set();
  for (let page = 0; page < 100; page += 1) {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(15_000),
      redirect: "error",
    }).catch(() => { throw new Error("Meta request failed or timed out."); });
    if (!response.ok) throw new Error(`Meta returned HTTP ${response.status}.`);
    const payload = await response.json().catch(() => null);
    if (!Array.isArray(payload?.data)) throw new Error("Meta returned an invalid posts response.");
    yield* payload.data;
    if (!payload.paging?.next) return;
    const cursor = payload.paging.cursors?.after;
    if (typeof cursor !== "string" || cursors.has(cursor)) throw new Error("Meta pagination did not advance.");
    cursors.add(cursor);
    url.searchParams.set("after", cursor);
  }
  throw new Error("Meta pagination exceeded the per-run limit.");
}

async function syncSource(db, source, config, version) {
  const isTelegram = source === "pasig-scholars-telegram";
  const telegramToken = process.env.TELEGRAM_PASIG_BOT_TOKEN;
  if (isTelegram && telegramToken && !/^\d+:[\w-]+$/.test(telegramToken)) throw new Error("Invalid Telegram bot token format.");
  const pageId = process.env[`${config.envPrefix}_PAGE_ID`];
  const token = process.env[`${config.envPrefix}_ACCESS_TOKEN`];
  if (config.envPrefix && !pageId && !token) return;
  if (config.envPrefix && (!/^\d+$/.test(pageId ?? "") || !token || !/^v\d+\.\d+$/.test(version ?? ""))) {
    throw new Error("Set the API version, numeric Page ID and authorized access token.");
  }

  const client = await db.connect();
  try {
    const lock = await client.query(
      "SELECT pg_try_advisory_lock(hashtext($1)) AS locked", [`scholarready:announcements:${source}`]
    );
    if (!lock.rows[0].locked) {
      console.log(`${source}: another import is running.`);
      return;
    }
    const until = new Date();
    const { rows } = await client.query("SELECT synced_at FROM announcement_sync WHERE source = $1", [source]);
    // Recheck one day around the previous checkpoint for delayed posts.
    const since = new Date(rows.length ? +rows[0].synced_at - day : +until - 30 * day);
    const posts = [];
    let skipped = 0;
    const updates = isTelegram && telegramToken ? await telegramUpdates(telegramToken) : [];
    const entries = isTelegram ? (telegramToken ? updates.map(telegramNotice).filter(Boolean) : fetchPublicTelegramAnnouncements(since))
      : source === "pasig-city-news" ? fetchCityAnnouncements(since, !rows.length)
      : source === "plp-news" ? fetchPlpAnnouncements()
      : fetchPosts(pageId, token, version, since, until);
    for await (const raw of entries) {
      try {
        const post = announcement(source, raw);
        if (post.categories.length && (isTelegram || raw.historical || post.publishedAt >= since) && post.publishedAt <= until) {
          posts.push(post);
        } else {
          skipped += 1;
        }
      } catch {
        skipped += 1;
      }
    }

    await client.query("BEGIN");
    try {
      let imported = 0;
      for (const post of posts) imported += await saveAnnouncement(client, post);
      await client.query(
        `INSERT INTO announcement_sync (source, synced_at) VALUES ($1, $2)
         ON CONFLICT (source) DO UPDATE SET synced_at = EXCLUDED.synced_at`,
        [source, until]
      );
      await client.query("COMMIT");
      console.log(`${until.toISOString()} ${source}: imported ${imported}, duplicates ${posts.length - imported}, skipped ${skipped}.`);
      if (!rows.length) console.log(`${source}: completed initial import of available announcements.`);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
    if (updates.length) {
      // Confirm only the batch already saved. Any updates returned here remain pending.
      await telegramUpdates(telegramToken, Math.max(...updates.map((update) => update.update_id)) + 1);
    }
  } finally {
    // Discard the session so PostgreSQL releases the advisory lock.
    client.release(true);
  }
}

async function main() {
  for (const file of [".env.local", ".env"]) {
    try { loadEnvFile(file); } catch (error) { if (error.code !== "ENOENT") throw error; }
  }
  const [mode, file, ...extra] = process.argv.slice(2);
  if (mode && (mode !== "--manual" || !file || extra.length)) {
    throw new Error("Usage: npm run notifications:import [-- --manual post.json]");
  }
  const db = openAnnouncementDb();
  try {
    if (mode === "--manual") {
      const raw = JSON.parse(await readFile(file, "utf8"));
      if (!Object.hasOwn(sources, raw.source)) throw new Error("Choose a configured announcement source.");
      const post = announcement(raw.source, raw);
      if (!post.body || typeof raw.title !== "string" || !raw.title.trim()
        || !Array.isArray(raw.categories) || !raw.categories.length
        || raw.categories.some((value) => !Object.hasOwn(topics, value))) {
        throw new Error("A verified post needs a title, message and valid categories.");
      }
      const count = await saveAnnouncement(db, {
        ...post, title: raw.title.trim(), categories: [...new Set(raw.categories)],
      });
      console.log(count ? "Verified post added." : "Post already exists.");
      return;
    }
    for (const [source, config] of Object.entries(sources)) {
      try {
        await syncSource(db, source, config, process.env.META_GRAPH_VERSION);
      } catch (error) {
        const message = typeof error.code === "string" ? `Operation failed (${error.code}).` : error.message;
        console.error(`${new Date().toISOString()} ${source}: ${message}`);
        process.exitCode = 1;
      }
    }
  } finally {
    await db.end();
  }
}

main().catch((error) => {
  console.error(error.code ? "Import failed while accessing the database or input file." : error.message);
  process.exitCode = 1;
});
