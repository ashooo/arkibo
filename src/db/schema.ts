import type { AccountProfile } from "@/lib/account";
import { index, jsonb, pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";

export const announcements = pgTable("announcements", {
  source: text().notNull(),
  post_id: text().notNull(),
  title: text().notNull(),
  body: text().notNull(),
  categories: text().array().notNull(),
  original_url: text().notNull(),
  published_at: timestamp({ withTimezone: true }).notNull(),
}, (table) => [
  primaryKey({ columns: [table.source, table.post_id] }),
  index("announcements_published_idx").on(table.published_at),
]);

export const announcementSync = pgTable("announcement_sync", {
  source: text().primaryKey(),
  synced_at: timestamp({ withTimezone: true }).notNull(),
});

export const accounts = pgTable("accounts", {
  id: text().primaryKey(),
  email: text().notNull().unique(),
  password_hash: text().notNull(),
  profile: jsonb().$type<AccountProfile>(),
});

export const accountSessions = pgTable("account_sessions", {
  token_hash: text().primaryKey(),
  account_id: text().notNull().references(() => accounts.id, { onDelete: "cascade" }),
  expires_at: timestamp({ withTimezone: true }).notNull(),
}, (table) => [index("account_sessions_expiry_idx").on(table.expires_at)]);
