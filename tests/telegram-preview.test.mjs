import assert from "node:assert/strict";
import test from "node:test";
import { parseTelegramPreview, fetchPublicTelegramAnnouncements } from "../scripts/telegram-announcements.mjs";
import { classifyAnnouncement } from "../src/features/notifications/topics.mjs";

function message(id, text, date = "2026-11-12T04:02:16Z", channel = "pasigscholarship") {
  return `<div class="tgme_widget_message" data-post="${channel}/${id}"><div class="tgme_widget_message_text">${text}</div><a class="tgme_widget_message_date"><time datetime="${date}"></time></a></div>`;
}

test("public Telegram parser preserves text, dates and canonical source links", () => {
  const { posts } = parseTelegramPreview(message(663, "Scholarship update<br>Renewal &amp; allowance details."));
  assert.deepEqual(posts, [{ id: "663", message: "Scholarship update\nRenewal & allowance details.", created_time: "2026-11-12T04:02:16.000Z", permalink_url: "https://t.me/pasigscholarship/663" }]);
  assert.deepEqual(classifyAnnouncement(posts[0].message), ["allowance", "scholarship"]);
  assert.deepEqual(classifyAnnouncement("Unrelated university sports event"), []);
});

test("parser rejects unavailable pages and ignores media-only, invalid-date and foreign-channel entries", () => {
  assert.throws(() => parseTelegramPreview("<html>Sign in</html>"), /recognizable/);
  assert.throws(() => parseTelegramPreview(message(10, "Scholarship", undefined, "otherchannel")), /configured/);
  const result = parseTelegramPreview(message(100, "") + message(101, "Scholarship", "not-a-date") + message(102, "Real notice"));
  assert.equal(result.oldestId, 100);
  assert.equal(result.posts.length, 1);
  assert.equal(result.posts[0].id, "102");
});

test("pagination deduplicates overlapping posts and stops when it reaches older notices", async (t) => {
  const original = globalThis.fetch;
  t.after(() => { globalThis.fetch = original; });
  const urls = [];
  globalThis.fetch = async (url) => {
    urls.push(String(url));
    return new Response(urls.length === 1 ? message(200, "Scholarship") + message(201, "Allowance") : message(200, "Scholarship") + message(199, "Older scholarship", "2026-01-01T00:00:00Z"));
  };
  const posts = [];
  for await (const post of fetchPublicTelegramAnnouncements(new Date("2026-11-01T00:00:00Z"))) posts.push(post);
  assert.deepEqual(posts.map((post) => post.id), ["200", "201"]);
  assert.equal(urls.length, 2);
  assert.equal(new URL(urls[1]).searchParams.get("before"), "200");
});

test("pagination fails honestly when Telegram repeats the same page", async (t) => {
  const original = globalThis.fetch;
  t.after(() => { globalThis.fetch = original; });
  globalThis.fetch = async () => new Response(message(200, "Scholarship"));
  await assert.rejects(async () => {
    for await (const post of fetchPublicTelegramAnnouncements(new Date("2026-11-01T00:00:00Z"))) assert.ok(post.id);
  }, /did not advance/);
});
