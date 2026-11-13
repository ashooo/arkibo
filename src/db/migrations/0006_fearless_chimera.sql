ALTER TABLE "documents" ALTER COLUMN "category" SET DEFAULT 'unclassified';--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "tags" text[] DEFAULT '{}'::text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "classification" jsonb;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "classification_status" varchar(20) DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "classification_input_hash" varchar(64);--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "classification_error" text;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "classification_updated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "classification_confirmed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "metadata_version" integer DEFAULT 0 NOT NULL;