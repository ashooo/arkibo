CREATE TABLE "checklist_lists" (
	"id" uuid PRIMARY KEY NOT NULL,
	"student_id" uuid NOT NULL,
	"application_type" "application_type" NOT NULL,
	"name" varchar(100) NOT NULL,
	"deadline" varchar(10),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP INDEX "requirements_student_template_unique";--> statement-breakpoint
ALTER TABLE "requirements" ADD COLUMN "checklist_list_id" uuid;--> statement-breakpoint
ALTER TABLE "checklist_lists" ADD CONSTRAINT "checklist_lists_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "checklist_lists_student_track_idx" ON "checklist_lists" USING btree ("student_id","application_type");--> statement-breakpoint
ALTER TABLE "requirements" ADD CONSTRAINT "requirements_checklist_list_id_checklist_lists_id_fk" FOREIGN KEY ("checklist_list_id") REFERENCES "public"."checklist_lists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "requirements_student_template_unique" ON "requirements" USING btree ("student_id","checklist_list_id","template_key");
--> statement-breakpoint
-- Preserve both former tracks as folders, including their independent deadlines.
INSERT INTO checklist_lists (id, student_id, application_type, name, deadline)
SELECT gen_random_uuid(), s.id, track.application_type,
 CASE WHEN track.application_type = 'renewal' THEN 'Renewal Requirements' ELSE 'New Applicant Requirements' END,
 ct.deadline
FROM students s
CROSS JOIN (VALUES ('new'::application_type), ('renewal'::application_type)) AS track(application_type)
LEFT JOIN checklist_tracks ct ON ct.student_id = s.id AND ct.application_type = track.application_type;
--> statement-breakpoint
UPDATE requirements r SET checklist_list_id = folder.id
FROM checklist_lists folder
WHERE r.student_id = folder.student_id AND r.application_type = folder.application_type;
--> statement-breakpoint
-- Materialize the previously virtual template without changing existing requirements or items.
INSERT INTO requirements (id, student_id, checklist_list_id, template_key, application_type, title, description, sort_order, source_note)
SELECT gen_random_uuid(), folder.student_id, folder.id, 'renewal-proof-enrollment', folder.application_type, 'Proof of Enrollment', 'Prepare a current document confirming your enrollment.', 1, 'Existing checklist template preserved during folder migration.'
FROM checklist_lists folder WHERE folder.application_type = 'renewal'
AND NOT EXISTS (SELECT 1 FROM requirements r WHERE r.checklist_list_id = folder.id AND r.template_key = 'renewal-proof-enrollment');
--> statement-breakpoint
-- Materialize the previously virtual template without changing existing requirements or items.
INSERT INTO requirements (id, student_id, checklist_list_id, template_key, application_type, title, description, sort_order, source_note)
SELECT gen_random_uuid(), folder.student_id, folder.id, 'renewal-report-card', folder.application_type, 'Report Card', 'Prepare your latest report card or academic record.', 2, 'Existing checklist template preserved during folder migration.'
FROM checklist_lists folder WHERE folder.application_type = 'renewal'
AND NOT EXISTS (SELECT 1 FROM requirements r WHERE r.checklist_list_id = folder.id AND r.template_key = 'renewal-report-card');
--> statement-breakpoint
-- Materialize the previously virtual template without changing existing requirements or items.
INSERT INTO requirements (id, student_id, checklist_list_id, template_key, application_type, title, description, sort_order, source_note)
SELECT gen_random_uuid(), folder.student_id, folder.id, 'renewal-proof-income', folder.application_type, 'Proof of Income', 'Prepare the requested proof of household income.', 3, 'Existing checklist template preserved during folder migration.'
FROM checklist_lists folder WHERE folder.application_type = 'renewal'
AND NOT EXISTS (SELECT 1 FROM requirements r WHERE r.checklist_list_id = folder.id AND r.template_key = 'renewal-proof-income');
--> statement-breakpoint
-- Materialize the previously virtual template without changing existing requirements or items.
INSERT INTO requirements (id, student_id, checklist_list_id, template_key, application_type, title, description, sort_order, source_note)
SELECT gen_random_uuid(), folder.student_id, folder.id, 'renewal-residency', folder.application_type, 'Barangay Certificate of Residency', 'Request a current certificate confirming your residency.', 4, 'Existing checklist template preserved during folder migration.'
FROM checklist_lists folder WHERE folder.application_type = 'renewal'
AND NOT EXISTS (SELECT 1 FROM requirements r WHERE r.checklist_list_id = folder.id AND r.template_key = 'renewal-residency');
--> statement-breakpoint
-- Materialize the previously virtual template without changing existing requirements or items.
INSERT INTO requirements (id, student_id, checklist_list_id, template_key, application_type, title, description, sort_order, source_note)
SELECT gen_random_uuid(), folder.student_id, folder.id, 'renewal-school-id', folder.application_type, 'School ID', 'Prepare a clear copy of your school ID.', 5, 'Existing checklist template preserved during folder migration.'
FROM checklist_lists folder WHERE folder.application_type = 'renewal'
AND NOT EXISTS (SELECT 1 FROM requirements r WHERE r.checklist_list_id = folder.id AND r.template_key = 'renewal-school-id');
--> statement-breakpoint
-- Materialize the previously virtual template without changing existing requirements or items.
INSERT INTO requirements (id, student_id, checklist_list_id, template_key, application_type, title, description, sort_order, source_note)
SELECT gen_random_uuid(), folder.student_id, folder.id, 'new-birth-certificate', folder.application_type, 'Birth Certificate', 'Prepare a copy of your birth certificate.', 1, 'Existing checklist template preserved during folder migration.'
FROM checklist_lists folder WHERE folder.application_type = 'new'
AND NOT EXISTS (SELECT 1 FROM requirements r WHERE r.checklist_list_id = folder.id AND r.template_key = 'new-birth-certificate');
--> statement-breakpoint
-- Materialize the previously virtual template without changing existing requirements or items.
INSERT INTO requirements (id, student_id, checklist_list_id, template_key, application_type, title, description, sort_order, source_note)
SELECT gen_random_uuid(), folder.student_id, folder.id, 'new-residency', folder.application_type, 'Certificate of Residency', 'Request a certificate confirming your residency.', 2, 'Existing checklist template preserved during folder migration.'
FROM checklist_lists folder WHERE folder.application_type = 'new'
AND NOT EXISTS (SELECT 1 FROM requirements r WHERE r.checklist_list_id = folder.id AND r.template_key = 'new-residency');
--> statement-breakpoint
-- Materialize the previously virtual template without changing existing requirements or items.
INSERT INTO requirements (id, student_id, checklist_list_id, template_key, application_type, title, description, sort_order, source_note)
SELECT gen_random_uuid(), folder.student_id, folder.id, 'new-bir-income-tax-return', folder.application_type, 'BIR Income Tax Return', 'Prepare the requested BIR income tax return for your household.', 3, 'Existing checklist template preserved during folder migration.'
FROM checklist_lists folder WHERE folder.application_type = 'new'
AND NOT EXISTS (SELECT 1 FROM requirements r WHERE r.checklist_list_id = folder.id AND r.template_key = 'new-bir-income-tax-return');
--> statement-breakpoint
-- Materialize the previously virtual template without changing existing requirements or items.
INSERT INTO requirements (id, student_id, checklist_list_id, template_key, application_type, title, description, sort_order, source_note)
SELECT gen_random_uuid(), folder.student_id, folder.id, 'new-report-card', folder.application_type, 'Report Card', 'Prepare your latest report card or academic record.', 4, 'Existing checklist template preserved during folder migration.'
FROM checklist_lists folder WHERE folder.application_type = 'new'
AND NOT EXISTS (SELECT 1 FROM requirements r WHERE r.checklist_list_id = folder.id AND r.template_key = 'new-report-card');

