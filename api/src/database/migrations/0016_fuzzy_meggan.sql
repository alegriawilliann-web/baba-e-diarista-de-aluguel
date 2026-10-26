ALTER TABLE "portfolio_posts" ALTER COLUMN "marcado" SET DATA TYPE text USING "marcado"::text;--> statement-breakpoint
ALTER TABLE "portfolio_posts" ALTER COLUMN "marcado" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "portfolio_posts" ALTER COLUMN "marcado" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "portfolio_posts" ADD COLUMN "ordem" integer DEFAULT 0 NOT NULL;