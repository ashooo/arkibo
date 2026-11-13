CREATE TABLE "checklist_tracks" (
	"student_id" uuid NOT NULL,
	"application_type" "application_type" NOT NULL,
	"deadline" varchar(10),
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "checklist_tracks_student_id_application_type_pk" PRIMARY KEY("student_id","application_type")
);
--> statement-breakpoint
ALTER TABLE "requirements" ADD COLUMN "student_id" uuid;--> statement-breakpoint
ALTER TABLE "requirements" ADD COLUMN "template_key" varchar(120);--> statement-breakpoint
ALTER TABLE "checklist_tracks" ADD CONSTRAINT "checklist_tracks_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requirements" ADD CONSTRAINT "requirements_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "requirements_student_template_unique" ON "requirements" USING btree ("student_id","template_key");