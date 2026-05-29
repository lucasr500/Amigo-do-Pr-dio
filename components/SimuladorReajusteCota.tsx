"use client";

import { useState } from "react";
import { trackEvent } from "@/lib/telemetry";

type Perfil = "conservador" | "moderado" | "arrojado";

const PERFIL_CONFIG: Record<Perfil, { label: string; range: [number, number]; color: string }> = {
  conservador: { label: "Conservador",  range: [5, 8],   color: "text-navy-600" },
  moderado:    { label: "Moderado",     range: [9, 11],  color: "text-amber-600" },
  arrojado:    { label: "Arrojado",     range: [12, 15], color: "text-terracotta-600" },
};

function fmt(n: number): string {
  return n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function parseNum(s: string): number {
  return Math.max(0, parseFloat(s.replace(/\./g, "").replace(",", ".")) || 0);
}

type Props = {
  anchorId?: string;
  highlighted?: boolean;
};

export default function SimuladorReajusteCota({ anchorId = "simulador-reajuste", highlighted = false }: Props) {
  const [arrecadacaoMensal, setArrecadacaoMensal] = useState("");
  const [cotaAtual, setCotaAtual] = useState("");
  const [reajustePct, setReajustePct] = useState(8);
  const [perfil, setPerfil] = useState<Perfil>("moderado");
  const [resultado, setResultado] = useState<{
    novaCota: number | null;
    novaArrecadacaoMensal: number;
    novaArrecadacaoAnual: number;
    diferencaMensal: number;
    diferencaAnual: number;
    arrecadacaoMensalAtual: number;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const arrNum   = parseNum(arrecadacaoMensal);
  const cotaNum  = parseNum(cotaAtual);
  const podeCalc = arrNum > 0;

  const calcular = () => {
    if (!podeCalc) return;
    const fator = 1 + reajustePct / 100;
    const novaArrecadacaoMensal = arrNum * fator;
    const novaArrecadacaoAnual  = novaArrecadacaoMensal * 12;
    const novaCota = cotaNum > 0 ? cotaNum * fator : null;
    const diferencaMensal = novaArrecadacaoMensal - arrNum;
    const diferencaAnual  = diferencaMensal * 12;

    setResultado({
      novaCota,
      novaArrecadacaoMensal,
      novaArrecadacaoAnual,
      diferencaMensal,
      diferencaAnual,
      arrecadacaoMensalAtual: arrNum,
    });
    void trackEvent("simulador_reajuste_calculado", {
      perfil,
      reajuste_pct: reajustePct,
      tem_cota: cotaNum > 0,
    });
  };

  const handlePerfil = (p: Perfil) => {
    setPerfil(p);
    const [min, max] = PERFIL_CONFIG[p].range;
    // Define o ponto central do perfil
    setReajustePct(Math.round((min + max) / 2));
    setResultado(null);
  };

  const handleCopy = async () => {
    if (!resultado) return;
    const { novaCota, novaArrecadacaoMensal, novaArrecadacaoAnual, diferencaMensal, diferencaAnual } = resultado;
    const lines = [
      "Simulador de reajuste de cota — Amigo do Prédio",
      "",
      `Perfil: ${PERFIL_CONFIG[perfil].label}`,
      `Reajuste simulado: ${reajustePct}%`,
      "",
      `Arrecadação mensal atual: R$ ${fmt(arrNum)}`,
      `Nova arrecadação mensal: R$ ${fmt(novaArrecadacaoMensal)}`,
      `Nova arrecadação anual: R$ ${fmt(novaArrecadacaoAnual)}`,
      `Diferença mensal: +R$ ${fmt(diferencaMensal)}`,
      `Diferença anual: +R$ ${fmt(diferencaAnual)}`,
      ...(novaCota !== null ? [`Nova cota estimada: R$ ${fmt(novaCota)}`] : []),
      "",
      "Simulação para planejamento. Não substitui previsão orçamentária formal nem aprovação assemblear.",
    ];
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch { /* clipboard indisponível */ }
  };

  return (
    <section
      id={anchorId}
      className={`scroll-mt-5 px-5 pb-6 pt-2 sm:px-6 ${highlighted ? "tool-anchor-highlight" : ""}`}
    >
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="text-[11.5px] font-semibold uppercase tracking-[0.12em] text-navy-500">
          Simulador de reajuste de cota
        </h3>
      </div>

      <div className="overflow-hidden rounded-xl border border-navy-100 bg-white shadow-sm">
        <div className="space-y-4 p-4">

          {/* Perfil */}
          <div>
            <p className="mb-1.5 text-[11.5px] font-medium text-navy-600">Perfil do reajuste</p>
            <div className="flex gap-2">
              {(Object.keys(PERFIL_CONFIG) as Perfil[]).map((p) => {
                const cfg = PERFIL_CONFIG[p];
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handlePerfil(p)}
                    className={`flex-1 rounded-xl border py-2 text-[11.5px] font-medium transition-all active:scale-95 ${
                      perfil === p
                        ? "border-navy-600 bg-navy-700 text-white"
                        : "border-navy-100 bg-navy-50/40 text-navy-600 hover:bg-navy-50"
                    }`}
                  >
                    {cfg.label}
                    <span className="mt-0.5 block text-[9.5px] opacity-70">
                      {cfg.range[0]}–{cfg.range[1]}%
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Slider */}
          <div>
            <div className="mb-1.5 flex items-baseline justify-between">
              <p className="text-[11.5px] font-medium text-navy-600">Percentual de reajuste</p>
              <p className={`text-[17px] font-bold tabular-nums ${PERFIL_CONFIG[perfil].color}`}>
                {reajustePct}%
              </p>
            </div>
            <input
              type="range"
              min={5}
              max={15}
              step={1}
              value={reajustePct}
              onChange={(e) => { setReajustePct(Number(e.target.value)); setResultado(null); }}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-navy-100 accent-navy-700"
            />
            <div className="mt-0.5 flex justify-between text-[9.5px] text-navy-400">
              <span>5%</span><span>10%</span><span>15%</span>
            </div>
          </div>

          {/* Arrecadação mensal */}
          <div className="flex gap-3">
            <div className="flex-1 min-w-0">
              <label htmlFor="sr-arr-mensal" className="mb-1 block text-[11.5px] font-medium text-navy-600">
                Arrecadação mensal (R$)
              </label>
              <input
                id="sr-arr-mensal"
                type="text"
                inputMode="decimal"
                value={arrecadacaoMensal}
                onChange={(e) => { setArrecadacaoMensal(e.target.value); setResultado(null); }}
                placeholder="Ex: 12.000,00"
                className="min-h-11 w-full rounded-lg border border-navy-200 bg-navy-50/30 px-3 py-2.5 text-[14px] text-navy-800 placeholder-navy-300 outline-none transition-colors focus:border-navy-400 focus:bg-white"
              />
            </div>
            <div className="flex-1 min-w-0">
              <label htmlFor="sr-cota" className="mb-1 block text-[11.5px] font-medium text-navy-600">
                Cota atual (R$) <span className="text-navy-400">opcional</span>
              </label>
              <input
                id="sr-cota"
                type="text"
                inputMode="decimal"
                value={cotaAtual}
                onChange={(e) => { setCotaAtual(e.target.value); setResultado(null); }}
                placeholder="Ex: 400,00"
                className="min-h-11 w-full rounded-lg border border-navy-200 bg-navy-50/30 px-3 py-2.5 text-[14px] text-navy-800 placeholder-navy-300 outline-none transition-colors focus:border-navy-400 focus:bg-white"
              />
            </div>
          </div>

        </div>

        {/* Botão calcular */}
        <div className="border-t border-navy-50 px-4 py-3">
          <button
            type="button"
            onClick={calcular}
            disabled={!podeCalc}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-navy-800 py-3 text-[13px] font-medium text-cream-50 transition-all hover:bg-navy-900 active:scale-[0.98] disabled:opacity-40"
          >
            Simular reajuste de {reajustePct}%
          </button>
          {!podeCalc && (
            <p className="mt-2 text-center text-[10.5px] text-navy-400">
              Informe a arrecadação mensal para simular.
            </p>
          )}
        </div>

        {/* Resultado */}
        {resultado && (
          <div className="border-t border-navy-50 p-4">

            {/* Destaque visual */}
            <div className="mb-4 rounded-xl bg-navy-700 px-4 py-4 text-center">
              <p className="text-[10.5px] font-medium uppercase tracking-[0.10em] text-cream-50/60">
                Nova arrecadação mensal
              </p>
              <p className="mt-1.5 font-display text-[28px] font-semibold tracking-tight text-cream-50">
                R$ {fmt(resultado.novaArrecadacaoMensal)}
              </p>
              <p className="mt-1 text-[11px] text-cream-50/60">
                +R$ {fmt(resultado.diferencaMensal)}/mês · +R$ {fmt(resultado.diferencaAnual)}/ano
              </p>
            </div>

            {/* Detalhes */}
            <div className="mb-4 space-y-2">
              <div className="flex justify-between rounded-lg bg-navy-50 px-3 py-2">
                <span className="text-[11.5px] text-navy-500">Arrecadação mensal atual</span>
                <span className="text-[12.5px] font-medium text-navy-800">R$ {fmt(resultado.arrecadacaoMensalAtual)}</span>
              </div>
              <div className="flex justify-between rounded-lg bg-navy-50 px-3 py-2">
                <span className="text-[11.5px] text-navy-500">Nova arrecadação anual</span>
                <span className="text-[12.5px] font-semibold text-navy-800">R$ {fmt(resultado.novaArrecadacaoAnual)}</span>
              </div>
              <div className="flex justify-between rounded-lg bg-navy-50 px-3 py-2">
                <span className="text-[11.5px] text-navy-500">Diferença anual projetada</span>
                <span className="text-[12.5px] font-semibold text-amber-600">+R$ {fmt(resultado.diferencaAnual)}</span>
              </div>
              {resultado.novaCota !== null && (
                <div className="flex justify-between rounded-lg bg-navy-50 px-3 py-2">
                  <span className="text-[11.5px] text-navy-500">Nova cota estimada</span>
                  <span className="text-[12.5px] font-semibold text-navy-800">R$ {fmt(resultado.novaCota)}</span>
                </div>
              )}
            </div>

            <p className="text-[10.5px] leading-relaxed text-navy-400">
              Simulação para planejamento interno. Não substitui previsão orçamentária formal elaborada pela administradora. Eventual reajuste deve observar a convenção condominial e ser aprovado em assembleia.
            </p>

            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={handleCopy}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[11.5px] font-medium transition-all ${
                  copied
                    ? "border-navy-200 bg-navy-100 text-navy-600"
                    : "border-navy-100 bg-white text-navy-500 hover:border-navy-200 hover:bg-navy-50"
                }`}
              >
                <svg className="h-3 w-3" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  {copied
                    ? <path d="M3 8l3.5 3.5L13 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    : <><rect x="5" y="3" width="8" height="10" rx="1.2" stroke="currentColor" strokeWidth="1.4" /><path d="M3 5v8a1.2 1.2 0 001.2 1.2H11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></>
                  }
                </svg>
                {copied ? "Copiado!" : "Copiar resultado"}
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
