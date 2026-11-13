// Read-only preview by default. --apply requires approval to write announcement records.
import { loadEnvFile } from "node:process";
import { fetchPublicTelegramAnnouncements } from "./telegram-announcements.mjs";
import { classifyAnnouncement } from "../src/features/notifications/topics.mjs";
import { openAnnouncementDb, saveAnnouncement } from "../src/features/notifications/store.mjs";

for (const file of [".env.local", ".env"]) {
  try { loadEnvFile(file); } catch (error) { if (error.code !== "ENOENT") throw error; }
}
const args = process.argv.slice(2);
if (args.some((arg) => arg !== "--apply")) throw new Error("Usage: node --use-system-ca scripts/import-public-telegram.mjs [--apply]");
const until = new Date();
const since = new Date(+until - 90 * 86400000);
const posts = [];
for await (const raw of fetchPublicTelegramAnnouncements(since)) {
  if (Date.parse(raw.created_time) > +until) continue;
  const categories = classifyAnnouncement(raw.message);
  if (!categories.length) continue;
  posts.push({ source: "pasig-scholars-telegram", postId: raw.id, title: Array.from(raw.message.split("\n").find((line) => line.trim()) ?? raw.message).slice(0, 100).join(""), body: raw.message, categories, sourceUrl: raw.permalink_url, publishedAt: new Date(raw.created_time) });
}
if (!posts.length) throw new Error("No matching public Telegram notices found; nothing will be written.");
console.log(JSON.stringify({ mode: args.includes("--apply") ? "apply" : "read-only preview", source: "https://t.me/s/pasigscholarship", count: posts.length, oldest: new Date(Math.min(...posts.map((post) => +post.publishedAt))).toISOString(), newest: new Date(Math.max(...posts.map((post) => +post.publishedAt))).toISOString(), categories: [...new Set(posts.flatMap((post) => post.categories))] }, null, 2));
if (args.includes("--apply")) {
  const db = openAnnouncementDb();
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", ["scholarready:announcements:pasig-scholars-telegram"]);
    let imported = 0;
    for (const post of posts) imported += await saveAnnouncement(client, post);
    await client.query("INSERT INTO announcement_sync (source,synced_at) VALUES ($1,$2) ON CONFLICT (source) DO UPDATE SET synced_at=greatest(announcement_sync.synced_at,excluded.synced_at)", ["pasig-scholars-telegram", until]);
    await client.query("COMMIT");
    console.log(`Imported ${imported} notices; ${posts.length - imported} duplicates skipped. Existing records preserved.`);
  } catch (error) { await client.query("ROLLBACK"); throw error; }
  finally { client.release(); await db.end(); }
}
