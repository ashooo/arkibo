import { load } from "cheerio";

const officialHosts = new Set(["t.me", "pasigcity.gov.ph", "plpasig.edu.ph", "www.facebook.com", "facebook.com", "m.facebook.com"]);

export async function announcementPreview(sourceUrl: string): Promise<string | null> {
  try {
    const url = new URL(sourceUrl);
    if (url.protocol !== "https:" || url.port || url.username || url.password || !officialHosts.has(url.hostname)) return null;
    let telegramPost: string | undefined;
    if (url.hostname === "t.me") {
      if (!/^\/pasigscholarship\/\d+$/.test(url.pathname)) return null;
      telegramPost = url.pathname.slice(1);
      url.pathname = "/s" + url.pathname;
      url.search = "";
    }

    const response = await fetch(url, {
      redirect: "error",
      signal: AbortSignal.timeout(5000),
      next: { revalidate: 3600 },
    });
    if (!response.ok) return null;

    const $ = load(await response.text());
    let image = $('meta[property="og:image"], meta[name="twitter:image"]').first().attr("content");
    if (telegramPost) {
      const posts = $(".tgme_widget_message[data-post]");
      const post = posts.filter((_, element) => $(element).attr("data-post") === telegramPost).first();
      const timestamp = post.find("time").first().attr("datetime");
      // Telegram can publish the album and its caption as consecutive entries.
      const preceding = posts.eq(posts.index(post) - 1);
      const album = timestamp && posts.index(post) > 0 && preceding.find("time").first().attr("datetime") === timestamp
        ? preceding.find(".tgme_widget_message_photo_wrap").first()
        : $();
      const photo = post.find(".tgme_widget_message_photo_wrap").first();
      image = (photo.length ? photo : album).attr("style")?.match(/url\(['"]?([^'")]+)['"]?\)/)?.[1];
    }
    if (!image) return null;

    const preview = new URL(image, url);
    return preview.protocol === "https:" && !preview.username && !preview.password ? preview.href : null;
  } catch {
    return null;
  }
}
