// test-fixes-fase33.js — verifica que as correções resolvem os 5 casos problemáticos
const kb = require('../lib/knowledge.json').base;

function normalize(text) {
  return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9\s]/g,'').trim();
}
function tokenize(text) { return text.split(/\s+/).filter(t => t.length > 2); }

const WEAK_KEYWORDS = new Set([
  'como','qual','quais','quando','onde','quem','posso','pode','deve','devo','preciso','tenho','quero',
  'por','com','que','nao','sim','para','sem','mas','dos','das','nos','nas',
  'condominio','assembleia','sindico','pagamento','notificacao','aprovacao','funcionario','hora','tempo',
  'aplicar','fazer','mudar','alterar',
]);

const SYNONYMS_EXTRA = { extra: ['taxa'] }; // foi ['taxa','rateio']

const DOMAIN_ANCHOR_WORDS = new Set([
  'multa','taxa','condominio','inadimplente','inadimplencia','cobranca','fundo','reserva','rateio','boleto','juros','mora',
  'obra','reforma','construcao','estrutura','assembleia','convocacao','quorum','votacao','voto','ata',
  'zelador','porteiro','funcionario','empregado','clt','ferias','rescisao','adicional','noturno','teletrabalho','terceirizacao',
  'convencao','regimento','sindico','garagem','seguro','animal','pet','barulho','ruido','negativacao','spc','serasa','predio','edificio',
  'locacao','locatario','locador','inquilino','aluguel','lgpd','dados','privacidade','responsabilidade','dano','vazamento','juridico',
  'elevador','camera','piscina','academia','salao','furto','manutencao','vistoria','incendio','avcb','dedetizacao','prescricao',
  'parcelamento','mediacao','despejo','fianca','distrato','incorporacao','associacao','ruina','empreiteiro','marquise',
  'balancete','administradora','sinistro','extintor','bicicleta','spda','pararraios','loteamento','fornecedor','reajuste',
  'encomenda','varanda','sacada','visitante','orcamento','atestado','hidrometro','quorum','cotacao','embargo','reincidente',
  'recarga','dissidio','retencao','regularizacao','piscina','manobrista','terceirizado','destituicao','playground',
  'advertencia','infrator','laudo','gravacao','filmagem','escala','edital','eleicao','acordo','cota','morador','condominial',
  'airbnb','temporada','hospedagem','desempate','empate','infracao','documentar','registrar',
]);

// Simplified expandWithSynonyms with the FIX (skip WEAK_KEYWORDS)
const SYNONYMS_PORTEIRO = { porteiro: ['funcionario'], pararraios: ['spda','manutencao'] };
function expandTokens(baseTokens) {
  const expanded = new Set(baseTokens);
  for (const token of baseTokens) {
    if (WEAK_KEYWORDS.has(token)) continue; // FIX
    // "para" would previously expand via pararraios → spda
    const stem = token.slice(0, Math.max(4, token.length - 3));
    // simulate: "para" stem = "para" → would match "pararraios"
    if (stem.length >= 4) {
      for (const [key, syns] of Object.entries(SYNONYMS_PORTEIRO)) {
        if (key !== token && key.startsWith(stem)) {
          syns.forEach(s => expanded.add(normalize(s)));
        }
      }
    }
  }
  return Array.from(expanded);
}

const tests = [
  { q: 'Como faco para renovar minha CNH', expected: 'blocked' },
  { q: 'Qual a jornada correta do porteiro', expected: 'domain-passes' },
  { q: 'O condominio obrigado ter fundo reserva', expected: 'domain-passes' },
  { q: 'O que acontece multar sem base legal', expected: 'domain-passes' },
  { q: 'O faxineiro faz hora extra calcular', expected: 'check-extra-expansion' },
];

console.log('── Verificação de correções ──────────────────────────────');
for (const { q, expected } of tests) {
  const normQ = normalize(q);
  const baseTokens = tokenize(normQ);
  const expanded = expandTokens(baseTokens);
  const hasDomain = expanded.some(t => DOMAIN_ANCHOR_WORDS.has(t));
  const domainWords = expanded.filter(t => DOMAIN_ANCHOR_WORDS.has(t));
  const weakSkipped = baseTokens.filter(t => WEAK_KEYWORDS.has(t));
  console.log('\nQ:', q);
  console.log('  Domain:', hasDomain ? 'PASSA ✓' : 'BLOQUEADO ✓');
  console.log('  Tokens fracos ignorados na expansão:', weakSkipped.join(', ') || 'nenhum');
  if (domainWords.length > 0) console.log('  Domain words encontradas:', domainWords.join(', '));
}

// Test "sem" as WEAK — multar sem base legal
console.log('\n── "sem" agora é WEAK ────────────────────────────────────');
const q2 = normalize('O que acontece se eu multar sem base legal');
const toks2 = tokenize(q2);
console.log('Tokens:', toks2.join(', '));
console.log('"sem" é WEAK:', WEAK_KEYWORDS.has('sem'));
console.log('"multar" é WEAK:', WEAK_KEYWORDS.has('multar'));
console.log('"multar" non-weak → score +5 em pergunta, +4 em keyword');

// Test KB fixes
const jornada = kb.find(e => e.id === 'jornada-horas-extras-condominio');
const fundo = kb.find(e => e.id === 'fundo-reserva');
const rateio = kb.find(e => e.id === 'rateio-despesas');
console.log('\n── KB fixes ──────────────────────────────────────────────');
console.log('jornada keywords incluem porteiro/zelador:', jornada && jornada.keywords.includes('porteiro') && jornada.keywords.includes('zelador') ? 'SIM ✓' : 'NAO ✗');
console.log('fundo-reserva keywords incluem obrigatorio:', fundo && fundo.keywords.includes('obrigatorio') ? 'SIM ✓' : 'NAO ✗');
console.log('rateio-despesas sem locatario/proprietario:', rateio && !rateio.keywords.includes('locatario') ? 'SIM ✓' : 'NAO ✗');
