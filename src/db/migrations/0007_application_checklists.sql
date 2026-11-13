WITH ranked_defaults AS (
	SELECT id, student_id,
		first_value(id) OVER (PARTITION BY student_id ORDER BY created_at, id) AS keep_id,
		row_number() OVER (PARTITION BY student_id ORDER BY created_at, id) AS position
	FROM checklist_lists
	WHERE name IN ('New Applicant', 'Renewal')
)
UPDATE requirements r
SET checklist_list_id = ranked.keep_id
FROM ranked_defaults ranked
WHERE r.checklist_list_id = ranked.id AND ranked.position > 1;
--> statement-breakpoint
UPDATE checklist_lists keep
SET deadline = COALESCE(keep.deadline, (
		SELECT max(other.deadline) FROM checklist_lists other
		WHERE other.student_id = keep.student_id AND other.name IN ('New Applicant', 'Renewal')
	))
WHERE keep.id = (
	SELECT first_list.id FROM checklist_lists first_list
	WHERE first_list.student_id = keep.student_id AND first_list.name IN ('New Applicant', 'Renewal')
	ORDER BY first_list.created_at, first_list.id LIMIT 1
);
--> statement-breakpoint
WITH ranked_defaults AS (
	SELECT id,
		row_number() OVER (PARTITION BY student_id ORDER BY created_at, id) AS position
	FROM checklist_lists
	WHERE name IN ('New Applicant', 'Renewal')
)
DELETE FROM checklist_lists list
USING ranked_defaults ranked
WHERE list.id = ranked.id AND ranked.position > 1;
--> statement-breakpoint
UPDATE checklist_lists SET name = 'Application Checklist' WHERE name IN ('New Applicant', 'Renewal');
