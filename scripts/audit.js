/**
 * Auditoria offline do motor de respostas — Amigo do Prédio
 * Reimplementação fiel em CommonJS do motor de lib/data.ts.
 * Roda sem browser, sem Next.js, sem TypeScript.
 *
 * Execução: node scripts/audit.js
 */

const fs = require("fs");
const path = require("path");

// ── Knowledge Base ────────────────────────────────────────────────────────────

const kb = JSON.parse(
  fs.readFileSync(path.join(__dirname, "..", "lib", "knowledge.json"), "utf-8")
);
const KNOWLEDGE_BASE = kb.base;

// ── Text helpers ──────────────────────────────────────────────────────────────

function normalize(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .trim();
}

function tokenize(text) {
  return text.split(/\s+/).filter((t) => t.length > 2);
}

// ── Constants ─────────────────────────────────────────────────────────────────

const SCORE_THRESHOLD    = 8;
const MIN_CLEAR_WIN_SCORE = 14;
const MIN_CONFIDENCE_GAP  = 4;

const WEAK_KEYWORDS = new Set([
  "como","qual","quais","quando","onde","quem",
  "posso","pode","deve","devo","preciso","tenho","quero",
  "por","com","que","nao","sim",
  "para","sem","mas","dos","das","nos","nas",
  "condominio","assembleia","sindico",
  "pagamento","notificacao","aprovacao",
  "funcionario","hora","tempo",
  "aplicar","fazer","mudar","alterar",
]);

const STRONG_INTENT_WORDS = [
  "inss","demitir","afastamento","justa","rescisao",
  "ferias","adicional","noturno","gestante","estabilidade",
  "agua","cortar","inadimplente","negativacao","destituicao",
  "convocacao","quorum","teletrabalho","pejotizacao",
  "furto","vazamento",
  "prescricao","avcb","cnpj","dedetizacao","protesto",
  "distrato","incorporacao","ruina","despejo","unanimidade",
  "spda","extintor","loteamento","balancete",
  "orcamento","visitante",
  "atestado","hidrometro",
  "quorum","cotacao",
  "embargo","reincidente",
  "dissidio","retencao","recarga",
  "piscina","manobrista","destituicao","playground",
  "camera","barulho","vazamento","procuracao","gravacao",
  "inadimplencia","rescisao",
  "desempate","airbnb","nepotismo",
];

const DOMAIN_ANCHOR_WORDS = new Set([
  "multa","taxa","condominio","inadimplente","inadimplencia",
  "cobranca","fundo","reserva","rateio","boleto","juros","mora",
  "obra","reforma","construcao","estrutura",
  "assembleia","convocacao","quorum","votacao","voto","ata",
  "zelador","porteiro","funcionario","empregado","clt","ferias",
  "rescisao","adicional","noturno","teletrabalho","terceirizacao",
  "convencao","regimento","sindico",
  "garagem","seguro","animal","pet",
  "barulho","ruido","negativacao","spc","serasa",
  "predio","edificio",
  "locacao","locatario","locador","inquilino","aluguel",
  "lgpd","dados","privacidade",
  "responsabilidade","dano","vazamento",
  "cobranca","juridico",
  "elevador","camera","piscina","academia","salao",
  "furto","manutencao","vistoria",
  "incendio","avcb","dedetizacao","prescricao","protesto","cnpj",
  "parcelamento","mediacao",
  "despejo","fianca","retomada","distrato","incorporacao",
  "associacao","ruina","empreiteiro","marquise",
  "balancete","administradora","sinistro","extintor",
  "bicicleta","spda","pararraios","loteamento","fornecedor","reajuste",
  "encomenda","varanda","sacada","visitante","orcamento",
  "atestado","hidrometro",
  "quorum","cotacao","periodico",
  "embargo","reincidente","apólice",
  "recarga","dissidio","retencao","regularizacao",
  "piscina","manobrista","terceirizado","destituicao","playground",
  "advertencia","infrator","laudo","gravacao","filmagem",
  "escala","edital","eleicao","protesto","acordo",
  "cota","morador","condominial",
  "airbnb","temporada","hospedagem","desempate","empate",
  "infracao","documentar","registrar",
]);

const SYNONYMS = {
  suspender:["cortar"],interromper:["cortar"],bloquear:["cortar","proibir"],
  devedor:["inadimplente","inadimplencia"],reuniao:["assembleia"],
  reformar:["obra","reforma"],construir:["obra"],regra:["convencao","regimento"],
  multar:["multa"],penalidade:["multa","sancao"],demissao:["demitir","rescisao"],
  dispensar:["demitir"],trabalhador:["funcionario","empregado"],porteiro:["funcionario"],
  zelador:["funcionario"],proibir:["vedar"],pagar:["quitar"],votar:["voto"],
  taxa:["condominio","taxa"],cachorro:["animal","pet"],gato:["animal","pet"],
  aluguel:["locacao","locatario"],alugar:["locacao"],inquilino:["locatario","locacao"],
  locatario:["locacao","inquilino"],proprietario:["locador"],
  convocar:["convocacao"],notificar:["notificacao"],avisar:["notificacao"],
  comunicar:["notificacao"],regulamento:["regimento","convencao"],estatuto:["convencao"],
  cobrar:["cobranca","inadimplencia"],divida:["inadimplencia","inadimplente"],
  atraso:["inadimplencia","mora"],seguranca:["funcionario"],
  faxineira:["funcionario","empregado"],dano:["responsabilidade"],
  prejuizo:["responsabilidade","dano"],estrago:["responsabilidade","dano"],
  vazar:["vazamento","responsabilidade"],vazou:["vazamento","responsabilidade"],
  dados:["lgpd"],privacidade:["lgpd"],cameras:["camera"],imagens:["camera","lgpd"],
  elevadores:["elevador"],roubo:["furto"],infiltracao:["vazamento","responsabilidade"],
  goteira:["vazamento","responsabilidade"],portao:["garagem"],
  vizinho:["responsabilidade","dano"],vigilancia:["camera"],
  portaria:["porteiro","funcionario"],incendio:["seguro","vistoria"],
  avcb:["vistoria"],dedetizar:["dedetizacao"],prescrever:["prescricao"],
  parcelar:["parcelamento","acordo"],cartorio:["registro","convencao"],
  mediar:["mediacao"],despejo:["locacao","despejo"],fianca:["garantia","locacao"],
  retomada:["locacao"],distrato:["rescisao","incorporacao"],incorporadora:["incorporacao"],
  ruina:["responsabilidade","dano"],empreiteiro:["obra","contrato"],
  marquise:["responsabilidade","dano"],associacao:["condominio"],
  balancete:["financeiro","prestacao"],administradora:["gestao","contrato"],
  sinistro:["seguro","responsabilidade"],extintor:["seguranca","incendio"],
  bicicleta:["areas-comuns","garagem"],pararraios:["spda","manutencao"],
  impugnar:["contestar","assembleia"],loteamento:["condominio","juridico"],
  fornecedor:["contrato","gestao"],reajuste:["taxa","financeiro"],
  prestacao:["gestao","financeiro"],encomenda:["entrega","gestao"],
  varanda:["sacada","fachada","convencao"],sacada:["varanda","fachada","convencao"],
  visitante:["convidado","multa"],orcamento:["financeiro","previsao"],
  virtual:["portaria","tecnologia"],arquivo:["documentos","gestao"],
  atestado:["medico","doenca","saude"],hidrometro:["agua","consumo","medicao"],
  feriado:["obra","horario"],credenciada:["empresa","manutencao"],
  cotacao:["fornecedor","contratacao"],quorum:["assembleia","votacao"],
  periodico:["exame","saude"],bombeiros:["avcb","incendio"],
  comunicado:["notificacao","morador"],embargo:["obra","interdito","proibida"],
  penal:["responsabilidade","crime"],aviso:["notificacao"],previo:["rescisao","aviso"],
  reincidente:["multa","contumaz"],apólice:["seguro","cobertura"],
  revisao:["contrato","gestao"],recarga:["extintor","validade"],
  bacteriologica:["agua","analise","limpeza"],dissidio:["reajuste","salario","cct"],
  retencao:["documento","prazo","guardar"],regularizacao:["obra","alvara","prazo"],
  antecipacao:["seguro","renovacao","prazo"],piscina:["area-comum","lazer","limpeza"],
  manobrista:["garagem","carro","estacionamento"],terceirizado:["empresa","prestador","portaria"],
  destituicao:["afastar","remover","sindico"],playground:["parquinho","crianca","area-comum"],
  festa:["barulho","ruido","perturbacao"],som:["barulho","ruido"],
  advertir:["advertencia","multa","notificacao"],infrator:["multa","advertencia","notificacao"],
  laudo:["obra","documentacao","engenheiro"],rrt:["obra","documentacao"],
  engenheiro:["obra","estrutura"],solar:["obra","autorizacao"],
  regularizar:["regularizacao","obra","alvara"],edital:["convocacao","assembleia"],
  eleicao:["assembleia","votacao","sindico"],destituir:["destituicao","sindico","assembleia"],
  aprovacao:["votacao","assembleia","quorum"],previsao:["financeiro","orcamento"],
  acordo:["parcelamento","inadimplencia"],negativar:["negativacao","inadimplencia"],
  extra:["taxa"],escala:["funcionario","trabalhista"],folga:["funcionario","trabalhista"],
  falta:["funcionario","trabalhista"],horario:["funcionario","trabalho","obra"],
  filmagem:["camera","lgpd"],gravacao:["camera","lgpd"],imobiliaria:["locacao"],
  venceu:["vencimento","prazo"],vencida:["vencimento","prazo"],expirou:["vencimento","prazo"],
  paga:["inadimplente","inadimplencia","cobranca"],pago:["quitar","inadimplencia"],
  deve:["inadimplente","inadimplencia"],dono:["proprietario","locador"],
  trocar:["substituir","reforma","obra"],piso:["reforma","obra"],parede:["reforma","obra"],
  teto:["reforma","obra"],janela:["reforma","obra"],porta:["reforma","obra"],
  domingo:["horario","obra"],art:["obra","documentacao","regularizacao"],
  foto:["imagem","lgpd","camera"],fotos:["imagem","camera","lgpd"],
  whatsapp:["comunicacao","lgpd"],grupo:["comunicacao","lgpd"],lista:["lgpd","inadimplencia"],
  devedores:["inadimplente","lgpd"],faço:["gestao"],faltou:["funcionario","trabalho"],
  briga:["multa","responsabilidade"],reclamar:["notificacao","multa"],
  votação:["votacao","assembleia"],garagem:["garagem","estacionamento"],
  vaga:["garagem","estacionamento"],raios:["spda","pararraios"],
  cota:["taxa","inadimplencia"],contribuicao:["taxa","rateio"],
  airbnb:["locacao","temporada","hospedagem"],temporada:["locacao","hospedagem","curto"],
  hospedagem:["locacao","temporada"],desempate:["empate","votacao","voto"],
  empatou:["empate","votacao"],minerva:["votacao","sindico","voto"],
  advertencias:["advertencia","multa","notificacao"],documentar:["documentacao","registro","prova"],
  infracao:["multa","advertencia","notificacao"],familiar:["parente","familia","conflito"],
  nepotismo:["conflito","interesses","empresa"],
};

function expandWithSynonyms(tokens) {
  const expanded = new Set(tokens);
  for (const token of tokens) {
    if (WEAK_KEYWORDS.has(token)) continue;
    const syns = SYNONYMS[token];
    if (syns) syns.forEach((s) => expanded.add(normalize(s)));
    const stem = token.slice(0, Math.max(4, token.length - 3));
    for (const [key, syns2] of Object.entries(SYNONYMS)) {
      if (stem.length >= 4 && key !== token && key.startsWith(stem)) {
        syns2.forEach((s) => expanded.add(normalize(s)));
      }
    }
  }
  return Array.from(expanded);
}

// ── Motor ─────────────────────────────────────────────────────────────────────

function findAnswer(question) {
  const normQ = normalize(question);
  const baseTokens = tokenize(normQ);

  if (baseTokens.length === 0) {
    return { isDefault: true, blockedByDomainAnchor: false, score: 0, matched: null };
  }

  const tokens = expandWithSynonyms(baseTokens);
  const hasDomainAnchor = tokens.some((t) => DOMAIN_ANCHOR_WORDS.has(t));

  if (!hasDomainAnchor) {
    return { isDefault: true, blockedByDomainAnchor: true, score: 0, matched: null, tokens };
  }

  const questionStrong = STRONG_INTENT_WORDS.filter((w) => normQ.includes(w));
  let best = null;
  let bestScore = 0;
  const candidates = [];

  for (const entry of KNOWLEDGE_BASE) {
    const perguntaHay = normalize(entry.pergunta);
    const keywordsHay = normalize(entry.keywords.join(" "));
    const supportHay  = normalize(`${entry.resposta} ${entry.contexto} ${entry.dica ?? ""}`);

    const strongMatches = questionStrong.filter(
      (w) => perguntaHay.includes(w) || keywordsHay.includes(w)
    );
    if (questionStrong.length >= 2 && strongMatches.length === 0) continue;

    let score = 0;
    let hasNonWeakMatch = false;

    for (const token of tokens) {
      const isWeak = WEAK_KEYWORDS.has(token);
      const stem = token.slice(0, Math.max(4, token.length - 3));

      if (perguntaHay.includes(stem)) {
        score += isWeak ? 2 : 5;
        if (!isWeak) hasNonWeakMatch = true;
      } else if (keywordsHay.includes(stem)) {
        if (!isWeak) { score += 4; hasNonWeakMatch = true; }
        else score += 1;
      } else if (!isWeak && supportHay.includes(stem)) {
        score += 1;
      }
    }

    score += strongMatches.length * 6;
    if (perguntaHay.includes(normQ)) score += 20;
    if (!hasNonWeakMatch && strongMatches.length === 0) continue;

    if (score > 0) candidates.push({ entry, score });
    if (score > bestScore) { bestScore = score; best = entry; }
  }

  if (best && bestScore >= SCORE_THRESHOLD) {
    candidates.sort((a, b) => b.score - a.score);
    const secondScore = candidates.length >= 2 ? candidates[1].score : 0;
    const isAmbiguous = bestScore < MIN_CLEAR_WIN_SCORE && secondScore >= bestScore - MIN_CONFIDENCE_GAP;

    if (!isAmbiguous) {
      return { isDefault: false, blockedByDomainAnchor: false, score: bestScore, matched: best, tokens };
    }
  }

  return { isDefault: true, blockedByDomainAnchor: false, score: bestScore, matched: null, tokens };
}

// ── Audit Cases ───────────────────────────────────────────────────────────────

const AUDIT_CASES = [
  // Multas
  { q: "Posso aplicar multa sem assembleia?", t: "A", cat: "multas" },
  { q: "Quantas advertências antes de multar?", t: "A", cat: "multas" },
  { q: "Morador fez barulho de madrugada — o que faço?", t: "A", cat: "multas" },
  { q: "Morador reincidente pode ter multa mais alta?", t: "A", cat: "multas" },
  { q: "O que acontece se eu multar sem base legal?", t: "B", cat: "multas" },
  { q: "Vizinho colocou grade na varanda sem avisar — posso multar?", t: "A", cat: "multas" },
  { q: "Morador briga muito com os vizinhos — dá para punir?", t: "A", cat: "multas" },
  { q: "Como documentar uma infração antes de multar?", t: "A", cat: "multas" },
  // Obras
  { q: "Morador precisa avisar antes de fazer obra?", t: "A", cat: "obras" },
  { q: "Em quais horários é permitido fazer reforma?", t: "A", cat: "obras" },
  { q: "Obra no fim de semana — pode?", t: "A", cat: "obras" },
  { q: "Quem paga se obra do vizinho danificou meu apartamento?", t: "A", cat: "obras" },
  { q: "Morador trocou o piso da sacada sem permissão — o que faço?", t: "A", cat: "obras" },
  { q: "Posso exigir ART do profissional que fez a obra?", t: "B", cat: "obras" },
  { q: "Morador quebrou a parede entre dois cômodos — legal?", t: "A", cat: "obras" },
  { q: "Como regularizar uma obra já feita sem comunicação?", t: "A", cat: "obras" },
  // Inadimplência
  { q: "Como cobrar moradores inadimplentes?", t: "A", cat: "inadimplencia" },
  { q: "Posso cortar a água de quem não paga?", t: "A", cat: "inadimplencia" },
  { q: "Posso negativar o condômino inadimplente?", t: "A", cat: "inadimplencia" },
  { q: "Qual o prazo para prescrição da dívida condominial?", t: "A", cat: "inadimplencia" },
  { q: "Morador deve 4 meses — posso proibir o uso da piscina?", t: "A", cat: "inadimplencia" },
  { q: "Posso cobrar juros de mora? Qual a porcentagem?", t: "A", cat: "inadimplencia" },
  { q: "Inquilino não paga — dono da unidade responde?", t: "A", cat: "locacao" },
  { q: "Morador parcelou a dívida mas não está cumprindo — o que faço?", t: "A", cat: "inadimplencia" },
  { q: "A cota condominial venceu ontem — já posso cobrar juros?", t: "B", cat: "inadimplencia" },
  // Assembleias
  { q: "Como convocar assembleia extraordinária?", t: "A", cat: "assembleias" },
  { q: "Com quantos dias de antecedência convocar a AGO?", t: "A", cat: "assembleias" },
  { q: "Inquilino pode votar em assembleia?", t: "A", cat: "assembleias" },
  { q: "Qual o quórum para mudar a convenção?", t: "A", cat: "assembleias" },
  { q: "Posso fazer assembleia virtual?", t: "A", cat: "assembleias" },
  { q: "Como registrar a ata da assembleia corretamente?", t: "B", cat: "assembleias" },
  { q: "Um condômino com procuração pode votar por outro?", t: "A", cat: "assembleias" },
  { q: "A votação foi empatada — o síndico tem voto de desempate?", t: "A", cat: "assembleias" },
  // Funcionários/Trabalhista
  { q: "Qual a jornada correta do porteiro?", t: "A", cat: "trabalhista" },
  { q: "Posso contratar zelador como PJ?", t: "A", cat: "funcionarios" },
  { q: "O porteiro faltou — posso descontar?", t: "A", cat: "funcionarios" },
  { q: "Porteiro grávida pode ser dispensada?", t: "A", cat: "trabalhista" },
  { q: "Como calcular o aviso prévio do zelador?", t: "A", cat: "trabalhista" },
  { q: "O faxineiro faz hora extra — como calcular?", t: "B", cat: "trabalhista" },
  { q: "Funcionário terceirizado — o condomínio responde por acidente?", t: "A", cat: "trabalhista" },
  { q: "Qual a diferença entre CLT e contrato de prestação de serviço?", t: "A", cat: "trabalhista" },
  { q: "Posso demitir o porteiro por justa causa por usar o celular?", t: "B", cat: "trabalhista" },
  // LGPD
  { q: "O condomínio pode publicar lista de devedores?", t: "A", cat: "lgpd" },
  { q: "Posso instalar câmera de segurança no corredor?", t: "A", cat: "lgpd" },
  { q: "Por quanto tempo guardar as imagens das câmeras?", t: "A", cat: "lgpd" },
  { q: "O condomínio pode compartilhar fotos no grupo de WhatsApp?", t: "A", cat: "lgpd" },
  { q: "Posso publicar o nome dos inadimplentes no mural?", t: "B", cat: "lgpd" },
  { q: "Síndico pode gravar reunião de assembleia?", t: "B", cat: "lgpd" },
  { q: "Que dados do morador o condomínio pode guardar?", t: "A", cat: "lgpd" },
  { q: "Morador não quer aparecer nas câmeras — pode exigir isso?", t: "A", cat: "lgpd" },
  // Responsabilidade
  { q: "Vazamento do apartamento de cima: quem paga?", t: "A", cat: "responsabilidade" },
  { q: "Infiltração na garagem — responsabilidade de quem?", t: "A", cat: "responsabilidade" },
  { q: "Goteira no meu apartamento veio do teto — o que faço?", t: "A", cat: "responsabilidade" },
  { q: "Morador vizinho causou dano na minha parede — como cobrar?", t: "B", cat: "responsabilidade" },
  { q: "Furto de bicicleta na garagem — o condomínio responde?", t: "A", cat: "responsabilidade" },
  { q: "Acidente na piscina — quem é responsável?", t: "A", cat: "responsabilidade" },
  { q: "A marquise caiu e danificou um carro — e agora?", t: "B", cat: "responsabilidade" },
  { q: "Incêndio na unidade do vizinho danificou meu apartamento", t: "A", cat: "responsabilidade" },
  // Locação
  { q: "Quem paga o condomínio: dono ou inquilino?", t: "A", cat: "locacao" },
  { q: "Inquilino fez bagunça na área comum — quem paga a multa?", t: "A", cat: "locacao" },
  { q: "Dono pode ser responsabilizado pelo inquilino inadimplente?", t: "A", cat: "locacao" },
  { q: "Posso proibir o aluguel por temporada no condomínio?", t: "A", cat: "locacao" },
  { q: "Como fazer o despejo de um inquilino que não paga?", t: "B", cat: "locacao" },
  { q: "O locatário pode ter animal de estimação mesmo contra a convenção?", t: "B", cat: "locacao" },
  { q: "Inquilino saiu sem pagar — o que fazer?", t: "A", cat: "inadimplencia" },
  // Finanças/Gestão
  { q: "Quais são os deveres do síndico?", t: "A", cat: "gestao" },
  { q: "Como calcular o rateio das despesas?", t: "A", cat: "financeiro" },
  { q: "O condomínio é obrigado a ter fundo de reserva?", t: "A", cat: "financeiro" },
  { q: "Como apresentar a prestação de contas?", t: "A", cat: "gestao" },
  { q: "Síndico pode ser destituído sem assembleia?", t: "A", cat: "gestao" },
  { q: "Qual o prazo para apresentar o balancete mensal?", t: "A", cat: "financeiro" },
  { q: "Como fazer cotação de fornecedores no condomínio?", t: "A", cat: "gestao" },
  { q: "Posso mudar de administradora sem assembleia?", t: "A", cat: "gestao" },
  { q: "O síndico pode contratar empresa da família?", t: "A", cat: "gestao" },
  // Fora do escopo
  { q: "Qual a receita de bolo de chocolate?", t: "C" },
  { q: "Como faço para renovar minha CNH?", t: "C" },
  { q: "Quem é o presidente do Brasil?", t: "C" },
  { q: "Como calcular o imposto de renda?", t: "C" },
  { q: "Como funciona a herança de um imóvel?", t: "B" },
  { q: "Qual é a diferença entre condomínio edilício e loteamento?", t: "A", cat: "juridico" },
  { q: "Posso instalar placa solar no meu apartamento?", t: "B", cat: "obras" },
  { q: "Como registrar um condomínio em cartório?", t: "A", cat: "gestao" },
  { q: "O que é IPTU e quem paga no condomínio?", t: "B", cat: "financeiro" },
];

// ── Run audit ─────────────────────────────────────────────────────────────────

function auditCase(auditCase) {
  const result = findAnswer(auditCase.q);
  const actualType = result.isDefault
    ? result.blockedByDomainAnchor ? "C" : "B"
    : "A";

  let status;
  let note = "";

  if (actualType === auditCase.t) {
    status = "pass";
    if (auditCase.t === "A" && result.score < 12) note = `score baixo (${result.score})`;
  } else if (auditCase.t === "A" && actualType === "B") {
    status = "review";
    note = `esperava A, caiu em fallback (score ${result.score})`;
  } else if (auditCase.t === "A" && actualType === "C") {
    status = "fail";
    note = `bloqueado pelo domain gate — deveria ter respondido`;
  } else if (auditCase.t === "B" && actualType === "A") {
    status = "review";
    note = `respondeu diretamente quando esperava fallback (score ${result.score}, id: ${result.matched?.id ?? "?"})`;
  } else if (auditCase.t === "C" && actualType !== "C") {
    status = "fail";
    note = `deveria ter sido bloqueado (retornou tipo ${actualType})`;
  } else {
    status = "pass";
  }

  return { q: auditCase.q, expected: auditCase.t, actual: actualType, status, note, score: result.score, matchedId: result.matched?.id ?? null };
}

const results = AUDIT_CASES.map(auditCase);

// ── Report ─────────────────────────────────────────────────────────────────────

const pass   = results.filter((r) => r.status === "pass");
const review = results.filter((r) => r.status === "review");
const fail   = results.filter((r) => r.status === "fail");

const totalA   = AUDIT_CASES.filter((c) => c.t === "A").length;
const passA    = results.filter((r) => AUDIT_CASES.find((c) => c.q === r.q)?.t === "A" && r.status === "pass").length;
const totalC   = AUDIT_CASES.filter((c) => c.t === "C").length;
const passC    = results.filter((r) => AUDIT_CASES.find((c) => c.q === r.q)?.t === "C" && r.status === "pass").length;
const recallGen = Math.round((pass.length / results.length) * 100);

console.log("═══════════════════════════════════════════════════════");
console.log("  AUDITORIA DO MOTOR — Amigo do Prédio");
console.log(`  KB: ${KNOWLEDGE_BASE.length} entradas | Casos: ${results.length}`);
console.log("═══════════════════════════════════════════════════════");
console.log(`\n  PASS:   ${pass.length}/${results.length}  (${recallGen}%)`);
console.log(`  REVIEW: ${review.length}/${results.length}`);
console.log(`  FAIL:   ${fail.length}/${results.length}`);
console.log(`\n  Recall A (direto):  ${passA}/${totalA}  (${Math.round(passA/totalA*100)}%)`);
console.log(`  Bloqueio C (escopo): ${passC}/${totalC}  (${Math.round(passC/totalC*100)}%)`);

if (fail.length > 0) {
  console.log("\n─── FAIL ───────────────────────────────────────────────");
  fail.forEach((r) => console.log(`  ✗ [${r.expected}→${r.actual}] "${r.q}"\n    ${r.note}`));
}
if (review.length > 0) {
  console.log("\n─── REVIEW ─────────────────────────────────────────────");
  review.forEach((r) => console.log(`  ⚠ [${r.expected}→${r.actual}] "${r.q}"\n    ${r.note}`));
}

console.log("\n═══════════════════════════════════════════════════════\n");
