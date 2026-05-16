const fs = require('fs');
const path = require('path');

const kbPath = path.join(__dirname, '..', 'lib', 'knowledge.json');
const data = JSON.parse(fs.readFileSync(kbPath, 'utf8'));

// Fix 1: jornada-horas-extras-condominio — adicionar porteiro/zelador para queries naturais
const jornada = data.base.find(e => e.id === 'jornada-horas-extras-condominio');
if (jornada) {
  // Adicionar tokens específicos que o usuário usa para chegar nesta entrada
  const toAdd = ['porteiro', 'zelador', 'correta', 'maxima', 'trabalho', 'turno'];
  toAdd.forEach(k => { if (!jornada.keywords.includes(k)) jornada.keywords.push(k); });
  console.log('Fixed keywords: jornada-horas-extras-condominio →', jornada.keywords.join(', '));
} else {
  console.log('ERRO: jornada-horas-extras-condominio nao encontrado');
}

// Fix 2: fundo-reserva — adicionar obrigatorio para score acima de MIN_CLEAR_WIN_SCORE
const fundo = data.base.find(e => e.id === 'fundo-reserva');
if (fundo) {
  const toAdd = ['obrigatorio', 'obrigatoriedade', 'exigido', 'exige', 'legal', 'lei'];
  toAdd.forEach(k => { if (!fundo.keywords.includes(k)) fundo.keywords.push(k); });
  console.log('Fixed keywords: fundo-reserva →', fundo.keywords.join(', '));
} else {
  console.log('ERRO: fundo-reserva nao encontrado');
}

// Fix 3: rateio-despesas — remover "locatario" das keywords (causa match excessivo)
// "locatario" é genérico demais para ficar em rateio-despesas
const rateio = data.base.find(e => e.id === 'rateio-despesas');
if (rateio) {
  const before = rateio.keywords.length;
  rateio.keywords = rateio.keywords.filter(k => !['locatario', 'proprietario'].includes(k));
  console.log('Fixed rateio-despesas: removidas', before - rateio.keywords.length, 'keywords genéricas. Restam:', rateio.keywords.join(', '));
}

fs.writeFileSync(kbPath, JSON.stringify(data, null, 2), 'utf8');
console.log('\nTotal entradas KB:', data.base.length);
console.log('Done.');
