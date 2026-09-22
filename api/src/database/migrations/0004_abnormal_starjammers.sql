CREATE TYPE "public"."payment_provider" AS ENUM('mercadopago');--> statement-breakpoint
CREATE TYPE "public"."payment_purpose" AS ENUM('mensalidade', 'boost', 'booking');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pendente', 'processando', 'aprovado', 'rejeitado', 'cancelado', 'reembolsado');--> statement-breakpoint
CREATE TABLE "payment_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payment_id" uuid,
	"event_type" varchar(50),
	"payload" jsonb,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" "payment_provider" DEFAULT 'mercadopago' NOT NULL,
	"provider_payment_id" varchar(100),
	"purpose" "payment_purpose" NOT NULL,
	"reference_id" uuid,
	"method" "payment_method" NOT NULL,
	"currency" char(3) DEFAULT 'BRL' NOT NULL,
	"amount_cents" integer NOT NULL,
	"status" "payment_status" DEFAULT 'pendente' NOT NULL,
	"description" varchar(255),
	"payer_email" varchar(255),
	"payer_name" varchar(150),
	"external_reference" varchar(100),
	"raw_provider_payload" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payments_provider_payment_id_unique" UNIQUE("provider_payment_id")
);
--> statement-breakpoint
ALTER TABLE "payment_events" ADD CONSTRAINT "payment_events_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "payment_events_payment_id_idx" ON "payment_events" USING btree ("payment_id");--> statement-breakpoint
CREATE INDEX "payments_user_id_idx" ON "payments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "payments_provider_payment_id_idx" ON "payments" USING btree ("provider_payment_id");--> statement-breakpoint
CREATE INDEX "payments_purpose_reference_idx" ON "payments" USING btree ("purpose","reference_id");