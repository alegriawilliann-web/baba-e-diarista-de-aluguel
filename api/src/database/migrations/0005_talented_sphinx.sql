CREATE TYPE "public"."boost_status" AS ENUM('pendente', 'ativo', 'expirado');--> statement-breakpoint
CREATE TABLE "boost_plan_options" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_key" varchar(30) NOT NULL,
	"duracao_dias" smallint NOT NULL,
	"preco_cents" integer NOT NULL,
	CONSTRAINT "boost_plan_options_plan_key_duracao_dias_unique" UNIQUE("plan_key","duracao_dias")
);
--> statement-breakpoint
CREATE TABLE "boost_plans" (
	"key" varchar(30) PRIMARY KEY NOT NULL,
	"titulo" varchar(100) NOT NULL,
	"descricao" text NOT NULL,
	"icone_key" varchar(30) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "boost_purchases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"professional_id" uuid NOT NULL,
	"plan_key" varchar(30) NOT NULL,
	"duracao_dias" smallint NOT NULL,
	"preco_cents" integer NOT NULL,
	"payment_id" uuid,
	"status" "boost_status" DEFAULT 'pendente' NOT NULL,
	"started_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "boost_plan_options" ADD CONSTRAINT "boost_plan_options_plan_key_boost_plans_key_fk" FOREIGN KEY ("plan_key") REFERENCES "public"."boost_plans"("key") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boost_purchases" ADD CONSTRAINT "boost_purchases_professional_id_professional_profiles_id_fk" FOREIGN KEY ("professional_id") REFERENCES "public"."professional_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boost_purchases" ADD CONSTRAINT "boost_purchases_plan_key_boost_plans_key_fk" FOREIGN KEY ("plan_key") REFERENCES "public"."boost_plans"("key") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boost_purchases" ADD CONSTRAINT "boost_purchases_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "boost_purchases_professional_id_idx" ON "boost_purchases" USING btree ("professional_id","status");