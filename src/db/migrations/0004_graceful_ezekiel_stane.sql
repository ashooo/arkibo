ALTER TABLE "students" ADD COLUMN "account_id" text;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_account_id_unique" UNIQUE("account_id");