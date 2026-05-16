"use client";

import { useState } from "react";
import { trackEvent } from "@/lib/telemetry";

type ResultRow = {
  mes: number;
  juros: number;
  multa: number;
  total: number;
};

const SLIDER_MAX = 12;

function fmt(n: number): string {
  return n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function SimuladorMulta() {
  const [cota, setCota] = useState("");
  const [meses, setMeses] = useState("1");
  const [taxaJuros, setTaxaJuros] = useState("1");
  const [taxaMulta, setTaxaMulta] = useState("2");
  const [resultado, setResultado] = useState<ResultRow[] | null>(null);

  const cotaNum = Math.max(0, parseFloat(cota.replace(",", ".")) || 0);
  const mesesNum = Math.max(1, Math.min(SLIDER_MAX, parseInt(meses, 10) || 1));
  const jurosRate = Math.max(0, Math.min(5, parseFloat(taxaJuros.replace(",", ".")) || 1)) / 100;
  const multaRate = Math.max(0, Math.min(10, parseFloat(taxaMulta.replace(",", ".")) || 2)) / 100;

  const usouValoresPadrao = taxaJuros.replace(",", ".") === "1" && taxaMulta.replace(",", ".") === "2";

  const calcular = () => {
    if (!cotaNum) return;
    const rows: ResultRow[] = [];
    for (let m = 1; m <= mesesNum; m++) {
      const juros = cotaNum * jurosRate * m;
      const multa = cotaNum * multaRate;
      rows.push({ mes: m, juros, multa, total: cotaNum * m + juros + multa });
    }
    setResultado(rows);
    void trackEvent("simulador_calculado", {
      meses: mesesNum,
      usou_valores_padrao: usouValoresPadrao,
      source: "ferramentas",
    });
  };

  const resetResultado = () => {
    setResultado(null);
  };

  const ultimo = resultado ? resultado[resultado.length - 1] : null;

  return (
    <section className="px-5 pb-6 sm:px-6">
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="text-[11.5px] font-semibold uppercase tracking-[0.12em] text-navy-500">
          Simulador de multa e juros
        </h3>
      </div>

      <div className="overflow-hidden rounded-xl border border-navy-100 bg-white shadow-sm">
        <div className="space-y-4 p-4">
          {/* Cota condominial */}
          <div>
            <label
              htmlFor="sim-cota"
              className="mb-1.5 block text-[11.5px] font-medium text-navy-600"
            >
              Valor da cota condominial (R$)
            </label>
            <input
              id="sim-cota"
              type="text"
              inputMode="decimal"
              value={cota}
              onChange={(e) => { setCota(e.target.value); resetResultado(); }}
              placeholder="Ex: 850,00"
              className="w-full rounded-lg border border-navy-200 bg-navy-50/30 px-3 py-2.5 text-[12.5px] text-navy-800 placeholder-navy-300 outline-none transition-colors focus:border-navy-400 focus:bg-white"
            />
          </div>

          {/* Meses em atraso */}
          <div>
            <div className="mb-1.5 flex items-baseline justify-between">
              <label
                htmlFor="sim-meses"
                className="text-[11.5px] font-medium text-navy-600"
              >
                Meses em atraso
              </label>
              <span className="text-[13px] font-semibold text-navy-800">
                {meses} {Number(meses) === 1 ? "mês" : "meses"}
              </span>
            </div>
            <input
              id="sim-meses"
              type="range"
              min={1}
              max={SLIDER_MAX}
              value={meses}
              onChange={(e) => { setMeses(e.target.value); resetResultado(); }}
              className="w-full accent-navy-700"
            />
            <div className="mt-0.5 flex justify-between text-[10px] text-navy-300">
              <span>1</span>
              <span>{SLIDER_MAX}</span>
            </div>
          </div>

          {/* Taxas */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label
                htmlFor="sim-juros"
                className="mb-1.5 block text-[11.5px] font-medium text-navy-600"
              >
                Juros (% a.m.)
              </label>
              <input
                id="sim-juros"
                type="text"
                inputMode="decimal"
                value={taxaJuros}
                onChange={(e) => { setTaxaJuros(e.target.value); resetResultado(); }}
                className="w-full rounded-lg border border-navy-200 bg-navy-50/30 px-3 py-2.5 text-[12.5px] text-navy-800 outline-none transition-colors focus:border-navy-400 focus:bg-white"
              />
              <p className="mt-1 text-[10.5px] text-navy-400">Padrão: 1% a.m.</p>
            </div>
            <div className="flex-1">
              <label
                htmlFor="sim-multa"
                className="mb-1.5 block text-[11.5px] font-medium text-navy-600"
              >
                Multa (%)
              </label>
              <input
                id="sim-multa"
                type="text"
                inputMode="decimal"
                value={taxaMulta}
                onChange={(e) => { setTaxaMulta(e.target.value); resetResultado(); }}
                className="w-full rounded-lg border border-navy-200 bg-navy-50/30 px-3 py-2.5 text-[12.5px] text-navy-800 outline-none transition-colors focus:border-navy-400 focus:bg-white"
              />
              <p className="mt-1 text-[10.5px] text-navy-400">Máx. legal: 2%</p>
            </div>
          </div>
        </div>

        {/* Botão calcular */}
        <div className="border-t border-navy-50 px-4 py-3">
          <button
            type="button"
            onClick={calcular}
            disabled={!cotaNum}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-navy-800 py-3 text-[13px] font-medium text-cream-50 transition-all hover:bg-navy-900 active:scale-[0.98] disabled:opacity-40"
          >
            Calcular
          </button>
          {!cotaNum && (
            <p className="mt-2 text-center text-[10.5px] text-navy-400">
              Informe o valor da cota para calcular.
            </p>
          )}
        </div>

        {/* Resultado */}
        {resultado && ultimo && (
          <div className="border-t border-navy-50 p-4">
            {/* Total em destaque */}
            <div className="mb-4 rounded-xl bg-navy-800 px-4 py-4 text-center">
              <p className="text-[10.5px] font-medium uppercase tracking-[0.10em] text-cream-50/60">
                Estimativa total — {meses} {Number(meses) === 1 ? "mês" : "meses"} em atraso
              </p>
              <p className="mt-1.5 font-display text-[28px] font-semibold tracking-tight text-cream-50">
                R$ {fmt(ultimo.total)}
              </p>
              <div className="mt-1.5 flex flex-wrap justify-center gap-x-3 gap-y-0.5 text-[11px] text-cream-50/60">
                <span>Cota: R$ {fmt(cotaNum * mesesNum)}</span>
                <span>·</span>
                <span>Multa: R$ {fmt(ultimo.multa)}</span>
                <span>·</span>
                <span>Juros: R$ {fmt(ultimo.juros)}</span>
              </div>
            </div>

            {/* Evolução mês a mês — só quando > 1 mês */}
            {resultado.length > 1 && (
              <div className="mb-4">
                <p className="mb-2 text-[10.5px] font-medium uppercase tracking-[0.10em] text-navy-400">
                  Evolução mês a mês
                </p>
                <div className="space-y-1">
                  {resultado.map((row) => (
                    <div
                      key={row.mes}
                      className={`flex items-center justify-between rounded-lg px-3 py-2 ${
                        row.mes === resultado.length
                          ? "bg-navy-50 font-medium"
                          : "bg-transparent"
                      }`}
                    >
                      <span className="text-[11.5px] text-navy-500">
                        {row.mes} {row.mes === 1 ? "mês" : "meses"}
                      </span>
                      <span className="text-[12.5px] text-navy-800">
                        R$ {fmt(row.total)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <p className="text-[10.5px] leading-relaxed text-navy-400">
              Cálculo estimativo. A multa considera aplicação única sobre a cota. Verifique
              na convenção, com a administradora e no boleto os critérios exatos (multa por
              parcela, correção monetária e outros encargos aplicáveis).
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
