// update-kb-fase34.js — Phase 34 editorial KB update
// Adds 5 new entries and improves 6 existing entries.

const fs = require('fs');
const path = require('path');

const kbPath = path.join(__dirname, '..', 'lib', 'knowledge.json');
const data = JSON.parse(fs.readFileSync(kbPath, 'utf8'));

// ─── NOVAS ENTRADAS ────────────────────────────────────────────────────────────

const newEntries = [

  // 1. Obra emergencial sem assembleia
  // Lacuna: "Preciso de obra urgente, posso contratar sem assembleia?"
  // A entrada 'obras-necessarias-sindico' confirma a legalidade, mas não dá o procedimento.
  // A entrada 'obra-emergencial-condominios' cobre síndico ausente, não o fluxo de contratação.
  {
    id: "obra-emergencial-sem-assembleia",
    categoria: "obras",
    pergunta: "Preciso contratar uma obra urgente no condomínio. Posso agir sem convocar assembleia?",
    resposta: "Sim. Para obras necessárias e urgentes (vazamento estrutural, bomba parada, risco elétrico, infiltração com dano imediato) o síndico pode contratar sem aprovação prévia da assembleia. O CC (art. 1.341) autoriza esse poder de ofício. O que muda é a obrigação pós-contratação: comunicar à assembleia imediatamente e prestar contas detalhadas.",
    contexto: "O Código Civil distingue: obras necessárias (síndico age sozinho, urgentes ou não), obras úteis (maioria da assembleia) e obras voluptuárias (2/3 dos condôminos). Emergências reais se enquadram em obras necessárias urgentes. O síndico pode ser responsabilizado se deixar de agir por não convocar assembleia — a inércia também gera risco.",
    dica: "Documente tudo antes, durante e após: fotos da situação, laudos se houver, 3 orçamentos mesmo que por WhatsApp, contrato assinado e notas fiscais. Após resolver, convoque assembleia extraordinária para ratificação e rateio do custo entre os condôminos.",
    keywords: [
      "obra", "emergencia", "urgente", "contratar", "assembleia", "autorizar",
      "sindico", "aprovacao", "vazamento", "encanamento", "bomba", "agua",
      "eletrica", "necessaria", "reparo", "urgencia", "contratar", "sem",
      "esperar", "assembleia", "decidir", "ratificar", "prestar", "contas"
    ]
  },

  // 2. Subíndico — poderes e limites
  // Lacuna: "O subsíndico pode assinar contratos se o síndico estiver viajando?"
  // Não existe nenhuma entrada sobre subsíndico na KB.
  {
    id: "subsindico-poderes-limites",
    categoria: "gestao",
    pergunta: "O que o subsíndico pode e não pode fazer?",
    resposta: "O subsíndico substitui o síndico nos casos previstos na convenção — geralmente nas ausências e nos impedimentos formais. Se a convenção não especificar os poderes do subsíndico, ele só pode agir quando o síndico estiver formalmente ausente ou impedido de exercer o cargo. Para assinar contratos, movimentar contas ou tomar decisões relevantes de forma autônoma, a convenção ou a assembleia precisa autorizar expressamente.",
    contexto: "O Código Civil não detalha os poderes do subsíndico — delega isso para a convenção. Na omissão, o subsíndico é apenas um substituto eventual, sem poderes autônomos permanentes. Convenções modernas costumam listar os atos que o subsíndico pode praticar sozinho e os que exigem o síndico ou a assembleia.",
    dica: "Se o subsíndico precisar agir por ausência do síndico, registre formalmente o motivo da ausência e os atos praticados. Revise a convenção periodicamente para garantir que as atribuições do subsíndico estejam claras e atualizadas.",
    keywords: [
      "subsindico", "substituto", "poderes", "limites", "ausencia", "convencao",
      "sindico", "assinar", "contratos", "representar", "funcoes", "mandato",
      "cargo", "impedimento", "viagem", "atribuicoes", "autonomia", "assembleia"
    ]
  },

  // 3. Multa sem base legal — consequências
  // Lacuna: "O que acontece se eu multar sem base legal?"
  // Motor retornava incorporacao-atraso-entrega (off-topic).
  {
    id: "multa-sem-base-legal-consequencias",
    categoria: "multas",
    pergunta: "O que acontece se o síndico aplicar uma multa sem base legal?",
    resposta: "A multa sem previsão na convenção ou no regimento é nula. O condômino pode: 1) Impugnar formalmente a multa por escrito, solicitando cancelamento; 2) Pedir à assembleia que anule a cobrança; 3) Ajuizar ação para declarar a nulidade e pedir devolução do valor; 4) Em casos graves, responsabilizar o síndico pessoalmente por abuso de poder. O condomínio pode ser condenado a devolver o valor cobrado indevidamente.",
    contexto: "O poder de multar do síndico é vinculado — só pode ser exercido para infrações e valores expressamente previstos na convenção (CC art. 1.336 e 1.337). Multa por analogia, estimativa ou 'bom senso' do síndico não tem amparo legal e pode ser anulada. A responsabilidade pessoal do síndico inclui dano moral e material ao condômino.",
    dica: "Antes de qualquer multa, verifique: (1) a infração está descrita na convenção ou regimento? (2) o valor ou o critério de cálculo está previsto? (3) o rito de notificação e prazo de defesa foi seguido? Se faltar qualquer um dos três, não multe — documente e consulte a administradora ou um advogado.",
    keywords: [
      "multa", "sem", "base", "legal", "invalida", "nula", "contestar",
      "impugnar", "anular", "consequencias", "responsabilidade", "sindico",
      "indevida", "convencao", "regimento", "fundamento", "abuso",
      "cancelar", "devolver", "dano", "moral", "acao"
    ]
  },

  // 4. Dano causado por vizinho — procedimento
  // Lacuna: "Vizinho causou dano na minha parede — como cobrar?"
  // Motor retornava cobranca-inadimplente (off-topic).
  {
    id: "dano-vizinho-procedimento",
    categoria: "responsabilidade",
    pergunta: "Vizinho causou dano na minha parede ou no meu apartamento — como agir?",
    resposta: "O condomínio não responde por danos entre unidades, mas pode ajudar o morador prejudicado com: 1) Documentar o dano com fotos e relatório formal; 2) Comunicar por escrito ao causador; 3) Se o dano envolver área comum, o síndico notifica o responsável. O morador prejudicado deve: registrar o ocorrido por escrito, solicitar orçamento de reparo, tentar acordo direto com o vizinho e, se não houver resposta, buscar indenização na justiça.",
    contexto: "O Código Civil (art. 1.336, II e art. 1.277) protege o condômino contra atos de vizinho que causem dano ou excedam o uso normal. A responsabilidade é pessoal do causador — não do condomínio, salvo quando o dano vem de partes comuns (instalação hidráulica coletiva, telhado, estrutura). Juizados Especiais Cíveis aceitam casos de dano entre vizinhos sem advogado.",
    dica: "Como síndico, documente e intermedie, mas deixe claro que o condomínio não é parte no conflito entre unidades. Indique ao morador que procure o PROCON, um acordo extrajudicial ou o Juizado Especial Cível. Tentar cobrar pelo morador cria expectativas que o condomínio não pode cumprir.",
    keywords: [
      "dano", "vizinho", "parede", "obra", "apartamento", "morador",
      "responsabilidade", "cobrar", "indenizacao", "prejudicado", "sinistro",
      "laudo", "documentar", "notificar", "acionar", "reparo", "conta",
      "acordo", "juizado", "processo", "ressarcir"
    ]
  },

  // 5. Animal de estimação vs. convenção — ângulo do locatário
  // Lacuna: "O locatário pode ter animal mesmo contra a convenção?"
  // A entrada 'animais-estimacao' cobre a proibição geral; esta cobre o ângulo locatário+convenção.
  {
    id: "animal-locatario-convencao",
    categoria: "locacao",
    pergunta: "O locatário pode ter animal de estimação mesmo se a convenção do condomínio proibir?",
    resposta: "Depende de dois fatores: o contrato de locação e o impacto real do animal. O STJ firmou que a proibição genérica de animais em condomínio é desproporcional quando o animal não causa perturbação. Se o contrato de aluguel proibir animais, a discussão é entre locatário e proprietário — não com o condomínio. O condomínio só pode agir se houver infração real: latidos excessivos, odor, medo fundado de vizinhos ou dano.",
    contexto: "O STJ (Tema 1.079) decidiu que vedar genericamente animais viola direitos do condômino (e, por extensão, do locatário). A convenção pode regulamentar — área de passeio, coleira, focinheira, horários — mas não proibir totalmente sem critério. O locatário tem os mesmos deveres condominiais que o proprietário, incluindo obrigação de não causar perturbação.",
    dica: "Se houver reclamação de animal de locatário: documente a perturbação com horário e testemunhas. Notifique o locatário por escrito. Se o contrato de aluguel proibir animais, comunique o proprietário para tomar providências com o inquilino. Não tente resolver o contrato de locação — isso é assunto entre as partes do aluguel.",
    keywords: [
      "animal", "estimacao", "locatario", "inquilino", "convencao", "proibir",
      "cachorro", "gato", "pet", "locacao", "aluguel", "stj", "perturbacao",
      "regra", "latido", "odor", "contrato", "proprietario", "barulho",
      "convivencia", "regulamentar"
    ]
  },

];

// ─── MELHORIAS EM ENTRADAS EXISTENTES ─────────────────────────────────────────

const improvements = [

  // 1. justa-causa-funcionario — keywords eram frases multi-palavra (não tokenizadas)
  {
    id: "justa-causa-funcionario",
    keywords: [
      "justa", "causa", "demissao", "falta", "abandono", "emprego",
      "condominio", "desidia", "embriaguez", "servico", "documentacao",
      "grave", "celular", "porteiro", "zelador", "faxineiro", "funcionario",
      "dispensar", "demitir", "imediatidade", "registro", "faltas"
    ]
  },

  // 2. juros-atraso — adicionar tokens para queries "venceu ontem, posso cobrar juros?"
  {
    id: "juros-atraso",
    keywords: [
      "multa", "atraso", "juros", "mora", "porcentagem", "pagamento",
      "taxa", "condominio", "encargo", "cobranca", "vencimento", "venceu",
      "cobrar", "inicio", "automatico", "primeiro", "dia", "quando",
      "calcular", "cota", "percentual", "incide"
    ]
  },

  // 3. obra-emergencial-condominios — keywords eram frases multi-palavra
  {
    id: "obra-emergencial-condominios",
    keywords: [
      "obra", "emergencia", "reparo", "urgente", "sindico", "ausente",
      "reembolso", "vazamento", "omisso", "emergencial", "condomino",
      "contratar", "autorizar", "urgencia", "inerte", "agir"
    ]
  },

  // 4. jornada-horas-extras-condominio — adicionar faxineiro, calcular, adicional
  {
    id: "jornada-horas-extras-condominio",
    keywords: [
      "jornada", "8", "horas", "44", "semanal", "hora", "extra", "50",
      "porcentagem", "banco", "12x36", "controle", "ponto", "porteiro",
      "zelador", "correta", "maxima", "trabalho", "turno", "faxineiro",
      "faxineira", "calcular", "adicional", "noturno", "horas-extras", "clt"
    ]
  },

  // 5. obras-necessarias-sindico — adicionar tokens de urgência e contratação
  {
    id: "obras-necessarias-sindico",
    keywords: [
      "obras", "necessarias", "sindico", "assembleia", "urgente",
      "conservacao", "reparo", "autorizar", "partes", "comuns",
      "manutencao", "voluptuaria", "util", "emergencia", "contratar",
      "encanamento", "bomba", "agua", "eletrica", "aprovar", "oficio"
    ]
  },

  // 6. contratacao-emergencial — keywords eram frases multi-palavra
  {
    id: "contratacao-emergencial",
    keywords: [
      "contratacao", "emergencia", "cotacao", "urgente", "preco",
      "contrato", "elevador", "quebrado", "bomba", "agua", "urgencia",
      "lesao", "orcamento", "pesquisa", "fornecedor", "sindico"
    ]
  },

];

// ─── APLICAR ──────────────────────────────────────────────────────────────────

// Adicionar novas entradas (verificar duplicidade antes)
let added = 0;
for (const entry of newEntries) {
  const exists = data.base.find(e => e.id === entry.id);
  if (exists) {
    console.log('SKIP (já existe):', entry.id);
  } else {
    data.base.push(entry);
    console.log('ADDED:', entry.id);
    added++;
  }
}

// Aplicar melhorias de keywords
let improved = 0;
for (const imp of improvements) {
  const entry = data.base.find(e => e.id === imp.id);
  if (!entry) {
    console.log('NOT FOUND:', imp.id);
    continue;
  }
  entry.keywords = imp.keywords;
  console.log('IMPROVED keywords:', imp.id, '→', entry.keywords.length, 'tokens');
  improved++;
}

fs.writeFileSync(kbPath, JSON.stringify(data, null, 2), 'utf8');
console.log('\nFase 34 KB update:');
console.log('  Novas entradas:', added);
console.log('  Entradas melhoradas:', improved);
console.log('  Total KB:', data.base.length);
