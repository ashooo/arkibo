CREATE TABLE "announcement_sync" (
	"source" text PRIMARY KEY NOT NULL,
	"synced_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "announcements" (
	"source" text NOT NULL,
	"post_id" text NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"categories" text[] NOT NULL,
	"original_url" text NOT NULL,
	"published_at" timestamp with time zone NOT NULL,
	CONSTRAINT "announcements_source_post_id_pk" PRIMARY KEY("source","post_id")
);
--> statement-breakpoint
CREATE INDEX "announcements_published_idx" ON "announcements" USING btree ("published_at");