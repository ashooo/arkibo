import pg from "pg";

export function openAnnouncementDb() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is missing.");
  return new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    max: 2,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 5000,
    allowExitOnIdle: true,
  });
}

export async function listAnnouncements(db) {
  const { rows } = await db.query(
    `SELECT source, post_id AS "postId", title, body, categories,
            original_url AS "sourceUrl", published_at AS "publishedAt"
     FROM announcements ORDER BY published_at DESC, source, post_id`
  );
  return rows;
}

export async function saveAnnouncement(db, post) {
  const result = await db.query(
    `INSERT INTO announcements (source, post_id, title, body, categories, original_url, published_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT DO NOTHING`,
    [post.source, post.postId, post.title, post.body, post.categories, post.sourceUrl, post.publishedAt]
  );
  return result.rowCount;
}
