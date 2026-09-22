import { eq, and, desc } from "drizzle-orm";
import { db } from "../../config/database";
import { boostPlans, boostPlanOptions, boostPurchases } from "./boosts.model";
import { professionalProfiles } from "../professionals/professionals.model";
import { users } from "../users/users.model";
import { createGenericPixPayment } from "../payments/payments.service";
import { NotFoundError } from "../../shared/errors";

export async function listPlans() {
  const plans = await db.query.boostPlans.findMany();
  const options = await db.query.boostPlanOptions.findMany();
  return plans.map((plan) => ({
    key: plan.key,
    titulo: plan.titulo,
    descricao: plan.descricao,
    iconeKey: plan.iconeKey,
    opcoes: options.filter((o) => o.planKey === plan.key).map((o) => ({ dias: o.duracaoDias, precoCents: o.precoCents })),
  }));
}

export async function purchase(userId: string, serviceType: "baba" | "diarista", planKey: string, durationDays: number) {
  const profile = await db.query.professionalProfiles.findFirst({
    where: and(eq(professionalProfiles.userId, userId), eq(professionalProfiles.serviceType, serviceType)),
  });
  if (!profile) throw new NotFoundError("Você ainda não tem um perfil profissional desse tipo");

  const option = await db.query.boostPlanOptions.findFirst({ where: and(eq(boostPlanOptions.planKey, planKey), eq(boostPlanOptions.duracaoDias, durationDays)) });
  if (!option) throw new NotFoundError("Plano de impulsionamento não encontrado para essa duração");

  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });

  const [purchaseRow] = await db
    .insert(boostPurchases)
    .values({ professionalId: profile.id, planKey, duracaoDias: durationDays, precoCents: option.precoCents })
    .returning();

  const payment = await createGenericPixPayment(userId, {
    purpose: "boost",
    referenceId: purchaseRow!.id,
    amountCents: option.precoCents,
    description: `Impulsionamento: ${planKey} (${durationDays} dias)`,
    email: user!.email,
    nome: user!.name,
    method: "pix",
  });

  await db.update(boostPurchases).set({ paymentId: payment.id }).where(eq(boostPurchases.id, purchaseRow!.id));

  return { purchaseId: purchaseRow!.id, payment };
}

export async function listMine(userId: string) {
  const profiles = await db.query.professionalProfiles.findMany({ where: eq(professionalProfiles.userId, userId) });
  if (profiles.length === 0) return [];

  const ids = profiles.map((p) => p.id);
  const rows = await db.query.boostPurchases.findMany({
    where: (t, { inArray }) => inArray(t.professionalId, ids),
    orderBy: (t) => [desc(t.createdAt)],
  });
  return rows;
}
