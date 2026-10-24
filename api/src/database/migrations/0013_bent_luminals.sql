ALTER TABLE "professional_profiles" ADD COLUMN "certidao_negativa_foto" text;--> statement-breakpoint
ALTER TABLE "professional_profiles" ADD COLUMN "certidao_negativa_aprovada_em" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "team_members" ADD COLUMN "certidao_negativa_foto" text;--> statement-breakpoint
UPDATE "professional_profiles" SET "certidao_negativa_foto" = "certidao_negativa_url", "certidao_negativa_aprovada_em" = now() WHERE "certidao_negativa_url" IS NOT NULL;--> statement-breakpoint
UPDATE "team_members" SET "certidao_negativa_foto" = "certidao_negativa_url" WHERE "certidao_negativa_url" IS NOT NULL;