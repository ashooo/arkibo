CREATE TYPE "public"."application_type" AS ENUM('new', 'renewal');--> statement-breakpoint
CREATE TYPE "public"."checklist_status" AS ENUM('missing', 'uploaded', 'prepared', 'needs_attention');--> statement-breakpoint
CREATE TYPE "public"."ocr_status" AS ENUM('pending', 'complete', 'failed');--> statement-breakpoint
CREATE TABLE "academic_terms" (
	"id" uuid PRIMARY KEY NOT NULL,
	"student_id" uuid NOT NULL,
	"academic_year" varchar(20) NOT NULL,
	"semester" varchar(80) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "checklist_documents" (
	"checklist_item_id" uuid NOT NULL,
	"document_id" uuid NOT NULL,
	CONSTRAINT "checklist_documents_checklist_item_id_document_id_pk" PRIMARY KEY("checklist_item_id","document_id")
);
--> statement-breakpoint
CREATE TABLE "checklist_items" (
	"id" uuid PRIMARY KEY NOT NULL,
	"student_id" uuid NOT NULL,
	"requirement_id" uuid NOT NULL,
	"status" "checklist_status" DEFAULT 'missing' NOT NULL,
	"notes" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" uuid PRIMARY KEY NOT NULL,
	"student_id" uuid,
	"original_name" varchar(256) NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"storage_path" text NOT NULL,
	"category" varchar(80) DEFAULT 'others' NOT NULL,
	"provider_document_id" varchar(128),
	"ocr_text" text,
	"ocr_status" "ocr_status" DEFAULT 'pending' NOT NULL,
	"ocr_error" text,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "grade_entries" (
	"id" uuid PRIMARY KEY NOT NULL,
	"term_id" uuid NOT NULL,
	"source_document_id" uuid,
	"subject_code" varchar(50) NOT NULL,
	"subject_name" varchar(255) NOT NULL,
	"grade" varchar(30) NOT NULL,
	"verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY NOT NULL,
	"title" varchar(200) NOT NULL,
	"body" text NOT NULL,
	"is_sample" boolean DEFAULT true NOT NULL,
	"published_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "requirements" (
	"id" uuid PRIMARY KEY NOT NULL,
	"application_type" "application_type" NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text NOT NULL,
	"sort_order" integer NOT NULL,
	"source_note" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "students" (
	"id" uuid PRIMARY KEY NOT NULL,
	"display_name" varchar(160) NOT NULL,
	"application_type" "application_type" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "academic_terms" ADD CONSTRAINT "academic_terms_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklist_documents" ADD CONSTRAINT "checklist_documents_checklist_item_id_checklist_items_id_fk" FOREIGN KEY ("checklist_item_id") REFERENCES "public"."checklist_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklist_documents" ADD CONSTRAINT "checklist_documents_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklist_items" ADD CONSTRAINT "checklist_items_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklist_items" ADD CONSTRAINT "checklist_items_requirement_id_requirements_id_fk" FOREIGN KEY ("requirement_id") REFERENCES "public"."requirements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grade_entries" ADD CONSTRAINT "grade_entries_term_id_academic_terms_id_fk" FOREIGN KEY ("term_id") REFERENCES "public"."academic_terms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grade_entries" ADD CONSTRAINT "grade_entries_source_document_id_documents_id_fk" FOREIGN KEY ("source_document_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "academic_terms_student_year_semester_unique" ON "academic_terms" USING btree ("student_id","academic_year","semester");--> statement-breakpoint
CREATE UNIQUE INDEX "checklist_items_student_requirement_unique" ON "checklist_items" USING btree ("student_id","requirement_id");--> statement-breakpoint
CREATE UNIQUE INDEX "documents_provider_document_id_unique" ON "documents" USING btree ("provider_document_id");