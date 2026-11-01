CREATE TYPE "public"."job_application_status" AS ENUM('pendente', 'aceita', 'recusada');--> statement-breakpoint
CREATE TYPE "public"."job_status" AS ENUM('aberta', 'fechada');--> statement-breakpoint
CREATE TABLE "job_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_post_id" uuid NOT NULL,
	"professional_id" uuid NOT NULL,
	"mensagem" text NOT NULL,
	"status" "job_application_status" DEFAULT 'pendente' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "job_applications_job_post_id_professional_id_unique" UNIQUE("job_post_id","professional_id")
);
--> statement-breakpoint
CREATE TABLE "job_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"service_type" "service_type" NOT NULL,
	"descricao" text NOT NULL,
	"bairro" varchar(150),
	"cidade" varchar(150),
	"status" "job_status" DEFAULT 'aberta' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_job_post_id_job_posts_id_fk" FOREIGN KEY ("job_post_id") REFERENCES "public"."job_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_professional_id_professional_profiles_id_fk" FOREIGN KEY ("professional_id") REFERENCES "public"."professional_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_posts" ADD CONSTRAINT "job_posts_client_id_users_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "job_applications_job_post_id_idx" ON "job_applications" USING btree ("job_post_id");--> statement-breakpoint
CREATE INDEX "job_applications_professional_id_idx" ON "job_applications" USING btree ("professional_id");--> statement-breakpoint
CREATE INDEX "job_posts_client_id_idx" ON "job_posts" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "job_posts_search_idx" ON "job_posts" USING btree ("service_type","status");