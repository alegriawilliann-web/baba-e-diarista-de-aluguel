import { pgTable, uuid, text, varchar, timestamp, pgEnum, index, unique } from "drizzle-orm/pg-core";
import { JOB_STATUSES, JOB_APPLICATION_STATUSES } from "../../config/constants";
import { users } from "../users/users.model";
import { professionalProfiles, serviceTypeEnum } from "../professionals/professionals.model";

export const jobStatusEnum = pgEnum("job_status", [...JOB_STATUSES]);
export const jobApplicationStatusEnum = pgEnum("job_application_status", [...JOB_APPLICATION_STATUSES]);

// "Vaga" publicada por uma contratante (mãe ou cliente-diarista) descrevendo
// o que ela precisa, sem já apontar pra uma profissional específica —
// profissionais do tipo certo veem isso num feed e enviam candidatura
// (ver jobApplications), em vez de depender só de aparecer numa busca.
export const jobPosts = pgTable(
  "job_posts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clientId: uuid("client_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    serviceType: serviceTypeEnum("service_type").notNull(),
    descricao: text("descricao").notNull(),
    bairro: varchar("bairro", { length: 150 }),
    cidade: varchar("cidade", { length: 150 }),
    status: jobStatusEnum("status").notNull().default("aberta"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("job_posts_client_id_idx").on(t.clientId),
    index("job_posts_search_idx").on(t.serviceType, t.status),
  ]
);

export const jobApplications = pgTable(
  "job_applications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    jobPostId: uuid("job_post_id").notNull().references(() => jobPosts.id, { onDelete: "cascade" }),
    professionalId: uuid("professional_id").notNull().references(() => professionalProfiles.id, { onDelete: "cascade" }),
    mensagem: text("mensagem").notNull(),
    status: jobApplicationStatusEnum("status").notNull().default("pendente"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("job_applications_job_post_id_idx").on(t.jobPostId),
    index("job_applications_professional_id_idx").on(t.professionalId),
    unique().on(t.jobPostId, t.professionalId),
  ]
);
