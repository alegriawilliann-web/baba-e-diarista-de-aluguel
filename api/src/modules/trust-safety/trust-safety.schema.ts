import { t } from "elysia";

export const blockBody = t.Object({
  professionalId: t.String({ format: "uuid" }),
});

export const reportBody = t.Object({
  targetProfessionalId: t.String({ format: "uuid" }),
  motivo: t.Union([
    t.Literal("comportamento_inadequado"),
    t.Literal("cobranca_indevida"),
    t.Literal("perfil_falso"),
    t.Literal("assedio"),
    t.Literal("outro"),
  ]),
  detalhes: t.Optional(t.String()),
});

export const updateReportStatusBody = t.Object({
  status: t.Union([t.Literal("aberto"), t.Literal("revisado"), t.Literal("arquivado")]),
});
