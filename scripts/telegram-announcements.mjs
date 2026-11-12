const channel = "pasigscholarship";

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
