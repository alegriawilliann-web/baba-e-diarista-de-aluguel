CREATE TYPE "public"."team_member_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TABLE "team_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"professional_id" uuid NOT NULL,
	"nome" varchar(150) NOT NULL,
	"cpf" varchar(14) NOT NULL,
	"certidao_negativa_url" text,
	"status" "team_member_status" DEFAULT 'pending' NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewed_at" timestamp with time zone,
	"reviewer_id" uuid
);
--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_professional_id_professional_profiles_id_fk" FOREIGN KEY ("professional_id") REFERENCES "public"."professional_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "team_members_professional_id_idx" ON "team_members" USING btree ("professional_id","status");