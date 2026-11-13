CREATE TABLE "checklist_lists" (
	"id" uuid PRIMARY KEY NOT NULL,
	"student_id" uuid NOT NULL REFERENCES "students"("id") ON DELETE cascade,
	"application_type" "application_type" NOT NULL,
	"name" varchar(100) NOT NULL,
	"deadline" varchar(10),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "checklist_lists_student_track_idx" ON "checklist_lists" USING btree ("student_id", "application_type");
--> statement-breakpoint
INSERT INTO "checklist_lists" ("id", "student_id", "application_type", "name", "deadline")
SELECT gen_random_uuid(), s."id", tracks."application_type",
	CASE WHEN tracks."application_type" = 'new' THEN 'New Applicant' ELSE 'Renewal' END,
	ct."deadline"
FROM "students" s
CROSS JOIN (VALUES ('new'::"application_type"), ('renewal'::"application_type")) AS tracks("application_type")
LEFT JOIN "checklist_tracks" ct ON ct."student_id" = s."id" AND ct."application_type" = tracks."application_type";
--> statement-breakpoint
ALTER TABLE "requirements" ADD COLUMN "checklist_list_id" uuid REFERENCES "checklist_lists"("id") ON DELETE cascade;
--> statement-breakpoint
UPDATE "requirements" r SET "checklist_list_id" = cl."id"
FROM "checklist_lists" cl
WHERE r."student_id" = cl."student_id" AND r."application_type" = cl."application_type";
--> statement-breakpoint
DROP INDEX "requirements_student_template_unique";
--> statement-breakpoint
CREATE UNIQUE INDEX "requirements_student_template_unique" ON "requirements" USING btree ("student_id", "checklist_list_id", "template_key");
