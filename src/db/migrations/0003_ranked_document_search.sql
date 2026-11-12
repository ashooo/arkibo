CREATE EXTENSION IF NOT EXISTS pg_trgm;--> statement-breakpoint
CREATE INDEX "documents_original_name_trgm_idx" ON "documents" USING gin ("original_name" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "documents_category_trgm_idx" ON "documents" USING gin ("category" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "documents_ocr_text_trgm_idx" ON "documents" USING gin ("ocr_text" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "documents_search_tsv_idx" ON "documents" USING gin (to_tsvector('simple', coalesce("original_name", '') || ' ' || coalesce("category", '') || ' ' || coalesce("ocr_text", '')));
