"use client";

import { useState } from "react";
import { trackEvent } from "@/lib/telemetry";

type Resultado = {
  arrecadacaoBruta: number;
  arrecadacaoLiquida: number;
  despesaProjetada: number;
  balanco: number;
  reajusteMinimo: number;
  novaCota: number | null;
};

function fmt(n: number): string {
  return n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtPct(n: number): string {
  return n.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

function parseNum(s: string): number {
  return Math.max(0, parseFloat(s.replace(",", ".")) || 0);
}

export default function SimuladorReajusteCota() {
  const [arrecadacao, setArrecadacao] = useState("");
  const [despesa, setDespesa] = useState("");
  const [unidades, setUnidades] = useState("");
  const [inadimplencia, setInadimplencia] = useState("5");
  const [aumentoDespesas, setAumentoDespesas] = useState("8");
  const [reforcoReserva, setReforcoReserva] = useState("0");
  const [cotaAtual, setCotaAtual] = useState("");
  const [resultado, setResultado] = useState<Resultado | null>(null);

  const arrNum = parseNum(arrecadacao);
  const despNum = parseNum(despesa);
  const unidNum = Math.max(1, parseInt(unidades, 10) || 1);
  const inadPct = Math.max(0, Math.min(50, parseNum(inadimplencia))) / 100;
  const aumentoPct = Math.max(0, Math.min(100, parseNum(aumentoDespesas))) / 100;
  const reforcoNum = parseNum(reforcoReserva);
  const cotaNum = parseNum(cotaAtual);

  const podeCalcular = arrNum > 0 && despNum > 0;

  const calcular = () => {
    if (!podeCalcular) return;

    const arrecadacaoBruta = arrNum;
    const arrecadacaoLiquida = arrNum * (1 - inadPct);
    const despesaProjetada = despNum * (1 + aumentoPct) + reforcoNum;
    const balanco = arrecadacaoLiquida - despesaProjetada;

    // % mínimo de reajuste para cobrir a projeção com inadimplência
    // nova_arrecadacao_liquida >= despesa_projetada
    // unidades * nova_cota * (1 - inadPct) >= despesa_projetada
    // nova_cota = despesa_projetada / (unidades * (1 - inadPct))
    const cotaNecessaria = despesaProjetada / (unidNum * (1 - inadPct));
    const cotaBase = cotaNum > 0 ? cotaNum : arrNum / unidNum;
    const reajusteMinimo = ((cotaNecessaria - cotaBase) / cotaBase) * 100;

    const novaCota = cotaNum > 0 ? cotaNecessaria : null;

    setResultado({ arrecadacaoBruta, arrecadacaoLiquida, despesaProjetada, balanco, reajusteMinimo, novaCota });

    void trackEvent("simulador_reajuste_calculado", {
      tem_cota_atual: cotaNum > 0,
      inadimplencia_pct: Math.round(inadPct * 100),
      aumento_despesas_pct: Math.round(aumentoPct * 100),
    });
  };

  const resetResultado = () => setResultado(null);

  return (
    <section className="px-5 pb-6 pt-2 sm:px-6">
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="text-[11.5px] font-semibold uppercase tracking-[0.12em] text-navy-500">
          Simulador de reajuste de cota
        </h3>
      </div>

      <div className="overflow-hidden rounded-xl border border-navy-100 bg-white shadow-sm">
        <div className="space-y-4 p-4">

          {/* Arrecadação e Despesa */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label htmlFor="sr-arrecadacao" className="mb-1.5 block text-[11.5px] font-medium text-navy-600">
                Arrecadação mensal (R$)
              </label>
              <input
                id="sr-arrecadacao"
                type="text"
                inputMode="decimal"
                value={arrecadacao}
                onChange={(e) => { setArrecadacao(e.target.value); resetResultado(); }}
                placeholder="Ex: 12.000,00"
                className="w-full rounded-lg border border-navy-200 bg-navy-50/30 px-3 py-2.5 text-[12.5px] text-navy-800 placeholder-navy-300 outline-none transition-colors focus:border-navy-400 focus:bg-white"
              />
            </div>
            <div className="flex-1">
              <label htmlFor="sr-despesa" className="mb-1.5 block text-[11.5px] font-medium text-navy-600">
                Despesa mensal média (R$)
              </label>
              <input
                id="sr-despesa"
                type="text"
                inputMode="decimal"
                value={despesa}
                onChange={(e) => { setDespesa(e.target.value); resetResultado(); }}
                placeholder="Ex: 11.000,00"
                className="w-full rounded-lg border border-navy-200 bg-navy-50/30 px-3 py-2.5 text-[12.5px] text-navy-800 placeholder-navy-300 outline-none transition-colors focus:border-navy-400 focus:bg-white"
              />
            </div>
          </div>

          {/* Unidades e Cota atual */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label htmlFor="sr-unidades" className="mb-1.5 block text-[11.5px] font-medium text-navy-600">
                Nº de unidades
              </label>
              <input
                id="sr-unidades"
                type="text"
                inputMode="numeric"
                value={unidades}
                onChange={(e) => { setUnidades(e.target.value); resetResultado(); }}
                placeholder="Ex: 30"
                className="w-full rounded-lg border border-navy-200 bg-navy-50/30 px-3 py-2.5 text-[12.5px] text-navy-800 placeholder-navy-300 outline-none transition-colors focus:border-navy-400 focus:bg-white"
              />
            </div>
            <div className="flex-1">
              <label htmlFor="sr-cota" className="mb-1.5 block text-[11.5px] font-medium text-navy-600">
                Cota atual (R$) <span className="text-navy-400">opcional</span>
              </label>
              <input
                id="sr-cota"
                type="text"
                inputMode="decimal"
                value={cotaAtual}
                onChange={(e) => { setCotaAtual(e.target.value); resetResultado(); }}
                placeholder="Ex: 400,00"
                className="w-full rounded-lg border border-navy-200 bg-navy-50/30 px-3 py-2.5 text-[12.5px] text-navy-800 placeholder-navy-300 outline-none transition-colors focus:border-navy-400 focus:bg-white"
              />
            </div>
          </div>

          {/* Inadimplência e Aumento de despesas */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label htmlFor="sr-inadimplencia" className="mb-1.5 block text-[11.5px] font-medium text-navy-600">
                Inadimplência (%)
              </label>
              <input
                id="sr-inadimplencia"
                type="text"
                inputMode="decimal"
                value={inadimplencia}
                onChange={(e) => { setInadimplencia(e.target.value); resetResultado(); }}
                className="w-full rounded-lg border border-navy-200 bg-navy-50/30 px-3 py-2.5 text-[12.5px] text-navy-800 outline-none transition-colors focus:border-navy-400 focus:bg-white"
              />
              <p className="mt-1 text-[10.5px] text-navy-400">Padrão: 5%</p>
            </div>
            <div className="flex-1">
              <label htmlFor="sr-aumento" className="mb-1.5 block text-[11.5px] font-medium text-navy-600">
                Aumento de despesas (%)
              </label>
              <input
                id="sr-aumento"
                type="text"
                inputMode="decimal"
                value={aumentoDespesas}
                onChange={(e) => { setAumentoDespesas(e.target.value); resetResultado(); }}
                className="w-full rounded-lg border border-navy-200 bg-navy-50/30 px-3 py-2.5 text-[12.5px] text-navy-800 outline-none transition-colors focus:border-navy-400 focus:bg-white"
              />
              <p className="mt-1 text-[10.5px] text-navy-400">Estimativa anual</p>
            </div>
          </div>

          {/* Reforço reserva */}
          <div>
            <label htmlFor="sr-reserva" className="mb-1.5 block text-[11.5px] font-medium text-navy-600">
              Reforço de reserva / fundo (R$/mês) <span className="text-navy-400">opcional</span>
            </label>
            <input
              id="sr-reserva"
              type="text"
              inputMode="decimal"
              value={reforcoReserva}
              onChange={(e) => { setReforcoReserva(e.target.value); resetResultado(); }}
              placeholder="Ex: 500,00"
              className="w-full rounded-lg border border-navy-200 bg-navy-50/30 px-3 py-2.5 text-[12.5px] text-navy-800 placeholder-navy-300 outline-none transition-colors focus:border-navy-400 focus:bg-white"
            />
          </div>

        </div>

        {/* Botão calcular */}
        <div className="border-t border-navy-50 px-4 py-3">
          <button
            type="button"
            onClick={calcular}
            disabled={!podeCalcular}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-navy-800 py-3 text-[13px] font-medium text-cream-50 transition-all hover:bg-navy-900 active:scale-[0.98] disabled:opacity-40"
          >
            Simular reajuste
          </button>
          {!podeCalcular && (
            <p className="mt-2 text-center text-[10.5px] text-navy-400">
              Informe arrecadação e despesa para simular.
            </p>
          )}
        </div>

        {/* Resultado */}
        {resultado && (
          <div className="border-t border-navy-50 p-4">

            {/* Balanço em destaque */}
            <div className={`mb-4 rounded-xl px-4 py-4 text-center ${resultado.balanco >= 0 ? "bg-navy-700" : "bg-navy-800"}`}>
              <p className="text-[10.5px] font-medium uppercase tracking-[0.10em] text-cream-50/60">
                Balanço projetado
              </p>
              <p className="mt-1.5 font-display text-[28px] font-semibold tracking-tight text-cream-50">
                {resultado.balanco >= 0 ? "+" : ""}R$ {fmt(resultado.balanco)}
              </p>
              <p className="mt-1 text-[11px] text-cream-50/60">
                {resultado.balanco >= 0 ? "Arrecadação cobre a projeção" : "Déficit estimado — reajuste necessário"}
              </p>
            </div>

            {/* Detalhes */}
            <div className="mb-4 space-y-2">
              <div className="flex justify-between rounded-lg bg-navy-50 px-3 py-2">
                <span className="text-[11.5px] text-navy-500">Arrecadação líquida estimada</span>
                <span className="text-[12.5px] font-medium text-navy-800">R$ {fmt(resultado.arrecadacaoLiquida)}</span>
              </div>
              <div className="flex justify-between rounded-lg bg-navy-50 px-3 py-2">
                <span className="text-[11.5px] text-navy-500">Despesa projetada</span>
                <span className="text-[12.5px] font-medium text-navy-800">R$ {fmt(resultado.despesaProjetada)}</span>
              </div>
              <div className="flex justify-between rounded-lg bg-navy-50 px-3 py-2">
                <span className="text-[11.5px] text-navy-500">Reajuste mínimo estimado</span>
                <span className={`text-[12.5px] font-semibold ${resultado.reajusteMinimo > 0 ? "text-amber-600" : "text-navy-600"}`}>
                  {resultado.reajusteMinimo > 0 ? `+${fmtPct(resultado.reajusteMinimo)}%` : "Sem necessidade"}
                </span>
              </div>
              {resultado.novaCota !== null && (
                <div className="flex justify-between rounded-lg bg-navy-50 px-3 py-2">
                  <span className="text-[11.5px] text-navy-500">Nova cota estimada</span>
                  <span className="text-[12.5px] font-semibold text-navy-800">R$ {fmt(resultado.novaCota)}</span>
                </div>
              )}
            </div>

            <p className="text-[10.5px] leading-relaxed text-navy-400">
              Simulação estimativa. Não substitui a previsão orçamentária oficial elaborada pela administradora ou contador.
              Verifique extratos, balancetes e demonstrativos reais antes de qualquer decisão. Eventual reajuste deve
              observar a convenção condominial e ser aprovado em assembleia.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
