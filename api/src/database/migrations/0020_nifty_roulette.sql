CREATE TABLE "mensalidade_discounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"percent_off" integer NOT NULL,
	"motivo" varchar(150),
	"expires_at" timestamp with time zone,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "mensalidade_discounts" ADD CONSTRAINT "mensalidade_discounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "mensalidade_discounts_user_id_idx" ON "mensalidade_discounts" USING btree ("user_id");