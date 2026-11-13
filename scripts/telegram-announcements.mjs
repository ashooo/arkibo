import { load } from "cheerio";

const channel = "pasigscholarship";

/** Parse only public posts belonging to the configured channel. Never execute embeds. */
export function parseTelegramPreview(html) {
  const $ = load(html);
  const messages = $(".tgme_widget_message[data-post]").toArray();
  if (!messages.length) throw new Error("Telegram did not return a recognizable public channel preview.");
  const posts = [];
  const ids = [];
  for (const element of messages) {
    const node = $(element);
    const match = new RegExp(`^${channel}/([1-9]\\d*)$`).exec(node.attr("data-post") ?? "");
    if (!match || !Number.isSafeInteger(Number(match[1]))) continue;
    ids.push(Number(match[1]));
    const created = node.find("a.tgme_widget_message_date time[datetime]").first().attr("datetime");
    if (!created || !Number.isFinite(Date.parse(created))) continue;
    const content = node.find(".tgme_widget_message_text").first().clone();
    content.find("br").replaceWith("\n");
    const message = content.text().replaceAll("\0", "").replaceAll("\u00a0", " ").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
    // Media-only notices have no trustworthy text to index; keep their IDs for pagination.
    if (!message) continue;
    posts.push({ id: match[1], message, created_time: new Date(created).toISOString(), permalink_url: `https://t.me/${channel}/${match[1]}` });
  }
  if (!ids.length) throw new Error("Public preview contained no posts from the configured Telegram channel.");
  return { posts, oldestId: Math.min(...ids) };
}

export async function* fetchPublicTelegramAnnouncements(since, { maxPages = 5 } = {}) {
  const seen = new Set();
  let before;
  for (let page = 0; page < maxPages; page++) {
    const url = new URL(`https://t.me/s/${channel}`);
    if (before) url.searchParams.set("before", String(before));
    const response = await fetch(url, { redirect: "error", signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error(`Telegram public preview returned HTTP ${response.status}.`);
    const parsed = parseTelegramPreview(await response.text());
    if (before && parsed.oldestId >= before) throw new Error("Telegram pagination did not advance.");
    let oldest = Infinity;
    for (const post of parsed.posts) {
      oldest = Math.min(oldest, Date.parse(post.created_time));
      if (seen.has(post.id)) continue;
      seen.add(post.id);
      if (Date.parse(post.created_time) >= +since) yield post;
    }
    if (oldest < +since || parsed.oldestId <= 1) return;
    before = parsed.oldestId;
  }
}

export async function telegramUpdates(token, offset) {
  let response;
  try {
    response = await fetch(`https://api.telegram.org/bot${token}/getUpdates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ allowed_updates: ["channel_post"], offset }),
      redirect: "error",
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    throw new Error("Telegram request failed or timed out.");
  }
  if (!response.ok) throw new Error(`Telegram returned HTTP ${response.status}.`);
  const payload = await response.json();
  if (!payload.ok || !Array.isArray(payload.result)) throw new Error("Invalid Telegram response.");
  return payload.result;
}

export function telegramNotice(update) {
  const post = update.channel_post;
  if (post?.chat?.username?.toLowerCase() !== channel || post.has_protected_content
    || !Number.isSafeInteger(post.message_id) || post.message_id < 1
    || !Number.isSafeInteger(post.date) || post.date <= 0) return null;
  const text = post.text ?? post.caption;
  if (!text?.trim()) return null;
  return {
    id: String(post.message_id),
    message: text,
    created_time: new Date(post.date * 1000).toISOString(),
    permalink_url: `https://t.me/${channel}/${post.message_id}`,
  };
}
