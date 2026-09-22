CREATE TYPE "public"."payment_method" AS ENUM('pix', 'credito', 'debito', 'boleto');--> statement-breakpoint
CREATE TYPE "public"."service_type" AS ENUM('baba', 'diarista');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('pendente', 'processando', 'liberado', 'vencida');--> statement-breakpoint
CREATE TYPE "public"."transporte" AS ENUM('carro', 'moto', 'buscada');--> statement-breakpoint
CREATE TABLE "follows" (
	"follower_user_id" uuid NOT NULL,
	"followee_professional_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "follows_follower_user_id_followee_professional_id_pk" PRIMARY KEY("follower_user_id","followee_professional_id")
);
--> statement-breakpoint
CREATE TABLE "portfolio_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"professional_id" uuid NOT NULL,
	"cor" varchar(20),
	"legenda" text,
	"url" text,
	"marcado" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "professional_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"service_type" "service_type" NOT NULL,
	"address_id" uuid,
	"idade" integer NOT NULL,
	"bio" text,
	"preco_hora_cents" integer,
	"valor_combinar" boolean DEFAULT false NOT NULL,
	"disponibilidade_noite" boolean DEFAULT false NOT NULL,
	"disponibilidade_fds" boolean DEFAULT false NOT NULL,
	"transporte" "transporte" NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"agenda" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"rating" numeric(3, 2) DEFAULT '0' NOT NULL,
	"rating_count" integer DEFAULT 0 NOT NULL,
	"rating_breakdown" jsonb DEFAULT '{"1":0,"2":0,"3":0,"4":0,"5":0}'::jsonb NOT NULL,
	"seguidores_count" integer DEFAULT 0 NOT NULL,
	"verificada" boolean DEFAULT false NOT NULL,
	"forma_pagamento" "payment_method" NOT NULL,
	"status_pagamento" "subscription_status" DEFAULT 'pendente' NOT NULL,
	"subscription_expires_at" timestamp with time zone,
	"details" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "professional_profiles_user_id_service_type_unique" UNIQUE("user_id","service_type")
);
--> statement-breakpoint
ALTER TABLE "follows" ADD CONSTRAINT "follows_follower_user_id_users_id_fk" FOREIGN KEY ("follower_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follows" ADD CONSTRAINT "follows_followee_professional_id_professional_profiles_id_fk" FOREIGN KEY ("followee_professional_id") REFERENCES "public"."professional_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolio_posts" ADD CONSTRAINT "portfolio_posts_professional_id_professional_profiles_id_fk" FOREIGN KEY ("professional_id") REFERENCES "public"."professional_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "professional_profiles" ADD CONSTRAINT "professional_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "professional_profiles" ADD CONSTRAINT "professional_profiles_address_id_addresses_id_fk" FOREIGN KEY ("address_id") REFERENCES "public"."addresses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "portfolio_posts_professional_id_idx" ON "portfolio_posts" USING btree ("professional_id");--> statement-breakpoint
CREATE INDEX "professional_profiles_search_idx" ON "professional_profiles" USING btree ("service_type","status_pagamento");--> statement-breakpoint
CREATE INDEX "professional_profiles_address_idx" ON "professional_profiles" USING btree ("address_id");