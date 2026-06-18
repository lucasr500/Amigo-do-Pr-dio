"use client";

import { useMemo, useState } from "react";
import { buildTransparencySummary, buildTransparencyReport } from "@/lib/transparency";

// Superfície de Transparência (W3) — payoff de usuário do financeiro→transparência.
// Mostra SÓ agregados (receitas/despesas/resultado/saldo); nunca inadimplência nem
// dado por unidade. Visível ao morador. Read-only sobre lib/transparency.

function moneyBRL(v: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

export default function TransparencyPanel({ refreshKey }: { refreshKey?: number }) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const s = useMemo(() => buildTransparencySummary(), [refreshKey]);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildTransparencyReport());
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    } catch { setCopied(false); }
  };

  return (
    <div className="rounded-[20px] border border-navy-100/80 bg-white/[0.86] p-4 shadow-card">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-navy-400">Transparência</p>
        <span className="text-[10.5px] text-navy-300">{s.month}</span>
      </div>
      <h3 className="mt-0.5 font-display text-[16px] font-semibold text-navy-900">Prestação de contas</h3>

      {!s.hasData ? (
        <p className="mt-2 text-[12px] leading-relaxed text-navy-500">
          Ainda não há lançamentos publicados para este mês. Quando a gestão registrar, o resumo aparece aqui.
        </p>
      ) : (
        <>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Figure label="Receitas" value={moneyBRL(s.receitas)} tone="pos" />
            <Figure label="Despesas" value={moneyBRL(s.despesas)} tone="neg" />
            <Figure label="Resultado" value={moneyBRL(s.resultado)} tone={s.resultado >= 0 ? "pos" : "neg"} />
            <Figure label="Saldo estimado" value={moneyBRL(s.saldoEstimado)} tone="neutral" />
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className="mt-3 w-full rounded-full border border-navy-100/80 bg-navy-50/60 px-4 py-2 text-[11.5px] font-semibold text-navy-600 transition-colors hover:bg-navy-50 active:scale-[0.99]"
          >
            {copied ? "Resumo copiado" : "Copiar prestação de contas"}
          </button>
        </>
      )}

      <p className="mt-2.5 text-[10px] leading-relaxed text-navy-400">
        Resumo agregado, para transparência. Não substitui a prestação de contas formal da administradora.
      </p>
    </div>
  );
}

function Figure({ label, value, tone }: { label: string; value: string; tone: "pos" | "neg" | "neutral" }) {
  const color = tone === "pos" ? "text-sage-700" : tone === "neg" ? "text-terracotta-700" : "text-navy-800";
  return (
    <div className="rounded-lg bg-navy-50/50 px-3 py-2">
      <p className="text-[9.5px] font-semibold uppercase tracking-[0.1em] text-navy-400">{label}</p>
      <p className={`mt-0.5 text-[13.5px] font-semibold ${color}`}>{value}</p>
    </div>
  );
}
