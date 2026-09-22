import { db } from "../../config/database";
import { boostPlans, boostPlanOptions } from "../../modules/boosts/boosts.model";

// Mesmo catálogo de `planosImpulsionamento` no App.jsx (linha ~4236).
const PLANS = [
  { key: "destaque", titulo: "Destaque na busca", descricao: "Apareça nas primeiras posições da busca.", iconeKey: "trending-up", opcoes: [{ dias: 7, precoCents: 1990 }, { dias: 15, precoCents: 3490 }, { dias: 30, precoCents: 5990 }] },
  { key: "banner", titulo: "Banner na tela inicial", descricao: "Seu perfil em destaque na tela inicial do app.", iconeKey: "image", opcoes: [{ dias: 7, precoCents: 2990 }, { dias: 15, precoCents: 4990 }, { dias: 30, precoCents: 7990 }] },
  { key: "popup", titulo: "Pop-up de recomendação", descricao: "Apareça em um pop-up de recomendação para famílias.", iconeKey: "sparkles", opcoes: [{ dias: 7, precoCents: 3990 }, { dias: 15, precoCents: 6990 }, { dias: 30, precoCents: 9990 }] },
];

export async function seedBoostPlans() {
  for (const plan of PLANS) {
    await db.insert(boostPlans).values({ key: plan.key, titulo: plan.titulo, descricao: plan.descricao, iconeKey: plan.iconeKey }).onConflictDoNothing();
    for (const opcao of plan.opcoes) {
      await db
        .insert(boostPlanOptions)
        .values({ planKey: plan.key, duracaoDias: opcao.dias, precoCents: opcao.precoCents })
        .onConflictDoNothing();
    }
  }
  console.log("[seed] boost_plans e boost_plan_options prontos");
}
