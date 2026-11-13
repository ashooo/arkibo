ALTER TABLE "documents" ADD COLUMN "search_metadata" text DEFAULT '' NOT NULL;--> statement-breakpoint
CREATE INDEX "documents_metadata_trgm_idx" ON "documents" USING gin ("search_metadata" gin_trgm_ops);
