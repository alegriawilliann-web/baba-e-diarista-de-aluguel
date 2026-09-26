// Traduz as respostas do questionário de cadastro profissional (rótulos em
// português, texto livre) pro formato que a API espera (booleans, enums
// curtos, centavos). Ver api/src/modules/professionals/professionals.schema.ts
// e professionals.types.ts para o contrato exato do lado do servidor.

const LOCAL_TRABALHO_MAP = {
  "Na minha casa": "minha_casa",
  "Na casa da família": "casa_familia",
  "Ambos": "ambos",
};

const TRANSPORTE_MAP = {
  "Tenho carro": "carro",
  "Tenho moto": "moto",
  "Preciso ser buscada": "buscada",
};

const FORMA_PAGAMENTO_MAP = {
  "Pix": "pix",
  "Cartão de crédito": "credito",
  "Cartão de débito": "debito",
  "Boleto": "boleto",
};

const DIAS_SEMANA = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

function centavos(valor) {
  const n = Number(valor);
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) : null;
}

function enderecoParaApi(respostas) {
  return {
    postalCode: respostas.cep || "",
    street: respostas.rua || "",
    number: respostas.numero || undefined,
    complement: respostas.complemento || undefined,
    neighborhood: respostas.bairro || undefined,
    city: respostas.cidade || "São Paulo",
    countryCode: "BR",
  };
}

function montarBioBaba(respostas) {
  const frases = [];
  if (respostas.experienciaBebe === "Sim") frases.push("tenho experiência cuidando de bebês");
  if (respostas.experienciaRecemNascido === "Sim") frases.push("já cuidei de recém-nascidos");
  if (respostas.sabeCozinhar === "Sim") frases.push("sei cozinhar para a família");
  if (frases.length === 0) {
    return "Estou começando agora na plataforma, mas com muita dedicação e vontade de cuidar bem das crianças.";
  }
  const texto = `Estou começando agora na plataforma. ${frases.join(", ")}.`;
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function montarBioDiarista(respostas) {
  const frases = [];
  if (respostas.fazFaxina === "Sim") frases.push("faço faxina completa");
  if (respostas.valorComida) frases.push("também faço comida");
  frases.push(respostas.trabalhaComMaisPessoas === "Trabalho com mais pessoas" ? "trabalho em equipe" : "trabalho sozinha");
  const texto = `Estou começando agora na plataforma. ${frases.join(", ")}.`;
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/** Monta o body de `POST /professionals` a partir das respostas do questionário. */
export function respostasParaCreateProfessionalInput(respostas, serviceType) {
  const disponibilidadePeriodo = respostas.disponibilidadePeriodo || [];
  const valorCombinar = respostas.modoValor === "Combinar pelo chat";
  const transporte = TRANSPORTE_MAP[respostas.transporte] || "buscada";
  const formaPagamento = FORMA_PAGAMENTO_MAP[respostas.formaPagamento] || "pix";

  const base = {
    serviceType,
    idade: Number(respostas.idade),
    endereco: enderecoParaApi(respostas),
    transporte,
    disponibilidadeNoite: disponibilidadePeriodo.includes("À noite"),
    disponibilidadeFds: disponibilidadePeriodo.includes("Finais de semana"),
    valorCombinar,
    formaPagamento,
  };

  if (serviceType === "baba") {
    base.bio = montarBioBaba(respostas);
    if (!valorCombinar) base.precoHoraCents = centavos(respostas.valorHora);
    const pacotes = [{ label: "Hora avulsa", valorCents: centavos(respostas.valorHora) }];
    if (respostas.valorSemanal) pacotes.push({ label: "Semanal", valorCents: centavos(respostas.valorSemanal) });
    if (respostas.valorMensal) pacotes.push({ label: "Mensal", valorCents: centavos(respostas.valorMensal) });
    base.details = {
      experienciaBebe: respostas.experienciaBebe === "Sim",
      experienciaRecemNascido: respostas.experienciaRecemNascido === "Sim",
      sabeCozinhar: respostas.sabeCozinhar === "Sim",
      localTrabalho: LOCAL_TRABALHO_MAP[respostas.localTrabalho] || "ambos",
      pacotes: valorCombinar ? [{ label: "Hora avulsa", valorCents: null }] : pacotes,
    };
  } else {
    base.bio = montarBioDiarista(respostas);
    if (!valorCombinar) base.precoHoraCents = centavos(respostas.valorFaxina);
    const servicos = [
      ...(respostas.valorFaxina ? [{ label: "Faxina completa (diária)", valorCents: centavos(respostas.valorFaxina) }] : []),
      ...(respostas.valorGeladeira ? [{ label: "Limpar geladeira", valorCents: centavos(respostas.valorGeladeira) }] : []),
      ...(respostas.valorLoucas ? [{ label: "Lavar louça", valorCents: centavos(respostas.valorLoucas) }] : []),
      ...(respostas.valorPassarRoupa ? [{ label: "Passar roupa", valorCents: centavos(respostas.valorPassarRoupa) }] : []),
      ...(respostas.valorComida ? [{ label: "Fazer comida", valorCents: centavos(respostas.valorComida) }] : []),
      ...(respostas.valorPosObraEvento ? [{ label: "Limpeza pós-obra ou pós-evento", valorCents: centavos(respostas.valorPosObraEvento) }] : []),
    ];
    base.details = {
      fazFaxina: respostas.fazFaxina === "Sim",
      fazComida: !!respostas.valorComida,
      trabalhaComEquipe: respostas.trabalhaComMaisPessoas === "Trabalho com mais pessoas",
      servicos: valorCombinar ? [{ label: "Faxina", valorCents: null }] : servicos,
    };
  }

  return base;
}

/** Monta o body de `PATCH /professionals/me` (campo `agenda`) a partir das respostas. */
export function respostasParaAgenda(respostas) {
  const dias = respostas.disponibilidadeSemana || [];
  const agenda = {};
  DIAS_SEMANA.forEach((d) => {
    agenda[d] = dias.includes(d) ? "A combinar" : "Indisponível";
  });
  return agenda;
}
