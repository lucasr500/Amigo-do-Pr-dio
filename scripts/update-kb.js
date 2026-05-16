const fs = require('fs');
const path = require('path');

const kbPath = path.join(__dirname, '..', 'lib', 'knowledge.json');
const data = JSON.parse(fs.readFileSync(kbPath, 'utf8'));

// ── 1. Fix keywords: conflito-interesses-sindico (phrases → tokens) ──────────
const conflito = data.base.find((e) => e.id === 'conflito-interesses-sindico');
if (conflito) {
  conflito.keywords = [
    'conflito', 'interesses', 'empresa', 'parente', 'familia',
    'nepotismo', 'contratar', 'favorecimento', 'transparencia',
    'familiar', 'proprio', 'sindico', 'contratacao',
  ];
  console.log('Fixed keywords: conflito-interesses-sindico');
}

// ── 2. Fix keywords: multa-antissocial-reiteracao (phrases → tokens) ─────────
const antissocial = data.base.find((e) => e.id === 'multa-antissocial-reiteracao');
if (antissocial) {
  antissocial.keywords = [
    'multa', 'antissocial', 'comportamento', 'reiteracao', 'infracao',
    'vezes', 'assembleia', 'reincidente', 'contumaz', 'grave',
    'perturbacao', 'conflito', 'maxima', 'descumprimento',
  ];
  console.log('Fixed keywords: multa-antissocial-reiteracao');
}

// ── 3. New entries ────────────────────────────────────────────────────────────
const newEntries = [
  {
    id: 'advertencia-antes-multar',
    categoria: 'multas',
    pergunta: 'Quantas advertencias o sindico precisa dar antes de aplicar multa?',
    resposta: 'Nao existe um numero fixo de advertencias obrigatorias definido em lei. O que importa e o que a convencao e o regimento interno estabelecem. A boa pratica e sempre notificar antes de sancionar: isso demonstra proporcionalidade e respeita o contraditorio. Em casos graves ou reincidentes, o regimento pode permitir multa direta sem advertencia previa — desde que haja prova da infracao e previsao na norma interna. Registre formalmente cada etapa.',
    contexto: 'O Codigo Civil (art. 1.336 e 1.337) nao define quantas advertencias sao necessarias — remete a convencao. O STJ ja decidiu que a ausencia de processo gradual pode fragilizar a multa em contestacao judicial. A proporcionalidade e a documentacao sao o que sustentam o processo punitivo.',
    dica: 'Siga o rito da convencao e documente cada etapa: data da ocorrencia, notificacao enviada, prazo de defesa, resposta do morador e decisao de aplicar ou nao a multa. Sem documentacao, o processo todo fica vulneravel a contestacao.',
    keywords: [
      'advertencia', 'quantas', 'numero', 'vezes', 'antes', 'multa',
      'primeira', 'sequencia', 'obrigatoria', 'rito', 'processo',
      'etapa', 'aviso', 'infracao', 'graduacao',
    ],
  },
  {
    id: 'voto-desempate-sindico',
    categoria: 'assembleias',
    pergunta: 'O sindico tem voto de desempate quando a votacao empatou?',
    resposta: 'Nao ha voto de qualidade automatico para o sindico previsto no Codigo Civil. Se o sindico for condomino, ele vota como condomino — e seu voto pode ser o que desempata, mas isso nao e diferente do voto de qualquer outro morador. Em caso de empate persistente, o caminho mais seguro e verificar o que a convencao preve. Se nao houver previsao, o ideal e adiar a deliberacao e buscar nova assembleia com mais participantes.',
    contexto: 'O CC/2002 nao preve voto de minerva ou de qualidade para o sindico. A convencao pode criar esse mecanismo — se nao o fizer, o empate nao tem solucao automatica pela lei. Forcao uma decisao sem respaldo legal ou convencional pode gerar questionamentos sobre a validade da ata.',
    dica: 'Se a votacao empatou em assunto relevante, registre o empate na ata e anote que sera deliberado em nova assembleia. Evite forcar uma decisao sem amparo claro na convencao — isso protege o sindico de questionamentos futuros.',
    keywords: [
      'empate', 'desempate', 'voto', 'qualidade', 'minerva', 'sindico',
      'assembleia', 'votacao', 'empatou', 'resultado', 'metade',
      'desempatar', 'igual', 'decidir',
    ],
  },
  {
    id: 'registro-infracao-procedimento',
    categoria: 'multas',
    pergunta: 'Como registrar formalmente uma infracao no condominio?',
    resposta: 'Para registrar uma infracao com solidez: 1) Anote data, horario, local e descricao do ocorrido; 2) Guarde relatos por escrito de testemunhas, se houver — sem exposicao publica; 3) Utilize o livro de ocorrencias ou sistema da administradora; 4) Se houver imagens de camera, guarde o trecho com data/hora respeitando a LGPD; 5) Emita notificacao escrita ao infrator com prazo de defesa; 6) Guarde comprovante de entrega (AR, protocolo ou app do condominio). Esse registro sustenta todo o processo punitivo.',
    contexto: 'Sem documentacao, a multa pode ser anulada judicialmente mesmo que a infracao tenha ocorrido. O onus de provar que o rito foi seguido e do condominio. Registros baseados apenas em relatos verbais sao facilmente contestados.',
    dica: 'Monte uma pasta fisica e digital para cada infracao. Antes de notificar, verifique se a situacao esta claramente prevista no regimento interno — multar por situacao nao prevista gera contestacao automatica.',
    keywords: [
      'registrar', 'documentar', 'infracao', 'ocorrencia', 'prova',
      'foto', 'testemunha', 'livro', 'formal', 'anotacao',
      'registro', 'comprovar', 'evidencia', 'anotar', 'como',
    ],
  },
  {
    id: 'locacao-temporada-airbnb',
    categoria: 'locacao',
    pergunta: 'O condominio pode proibir locacao por temporada tipo Airbnb?',
    resposta: 'Sim, desde que a proibicao esteja prevista na convencao ou aprovada em assembleia. O STJ decidiu (REsp 1.819.075) que o condominio pode vetar a locacao por temporada via plataforma por deliberacao assemblear. Sem previsao na convencao, e dificil proibir — o que pode ser regulado sao comportamentos (barulho, visitantes, horarios). Se quiser proibir, convoque assembleia e altere a convencao com o quorum exigido (geralmente 2/3 dos condominos).',
    contexto: 'A locacao por temporada e regulada pela Lei 8.245/91 (art. 48) e pelo CC. Convenções criadas antes das plataformas digitais geralmente nao tem previsao expressa — requerem atualizacao assemblear. A discussao juridica e se o uso repetido via plataforma se enquadra como uso residencial ou comercial.',
    dica: 'Se quiser regular o tema, consulte um advogado especializado antes de propor o texto para a assembleia. Enquanto nao ha previsao, foque em regular comportamentos que afetam todos: horarios de silencio, circulacao de visitantes, uso das areas comuns.',
    keywords: [
      'airbnb', 'temporada', 'locacao', 'proibir', 'plataforma', 'hospedar',
      'diaria', 'booking', 'aluguel', 'hospedagem', 'vetar',
      'temporario', 'turista', 'aplicativo', 'dias', 'curtissimo',
    ],
  },
];

newEntries.forEach((entry) => {
  const exists = data.base.find((e) => e.id === entry.id);
  if (!exists) {
    data.base.push(entry);
    console.log('Added: ' + entry.id);
  } else {
    console.log('Already exists (skipped): ' + entry.id);
  }
});

fs.writeFileSync(kbPath, JSON.stringify(data, null, 2), 'utf8');
console.log('\nTotal entries: ' + data.base.length);
console.log('Done.');
