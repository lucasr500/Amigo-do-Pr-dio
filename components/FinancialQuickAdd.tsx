"use client";

import { useState } from "react";
import { addMovimentacao } from "@/lib/session";
import { CATEGORIAS_RECEITA, CATEGORIAS_DESPESA } from "@/lib/financial-categories";
import { trackEvent } from "@/lib/telemetry";

type Props = {
  onSaved?: () => void;
};

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function parseBRL(raw: string): number {
  const clean = raw.replace(/[^\d,]/g, "").replace(",", ".");
  const n = parseFloat(clean);
  return isNaN(n) ? 0 : Math.round(n * 100) / 100;
}

export default function FinancialQuickAdd({ onSaved }: Props) {
  const [expanded,  setExpanded]  = useState(false);
  const [tipo,      setTipo]      = useState<"receita" | "despesa">("despesa");
  const [valor,     setValor]     = useState("");
  const [categoria, setCategoria] = useState("");
  const [data,      setData]      = useState(todayISO());
  const [obs,       setObs]       = useState("");
  const [saved,     setSaved]     = useState(false);
  const [error,     setError]     = useState("");

  const cats = tipo === "receita" ? CATEGORIAS_RECEITA : CATEGORIAS_DESPESA;

  function reset() {
    setValor(""); setCategoria(""); setObs(""); setData(todayISO()); setError("");
  }

  function handleSave() {
    const v = parseBRL(valor);
    if (v <= 0) { setError("Informe um valor válido."); return; }
    if (!categoria) { setError("Selecione uma categoria."); return; }

    addMovimentacao({ data, valor: v, tipo, categoria, observacao: obs.trim() || undefined });
    void trackEvent("movimentacao_adicionada", { tipo, categoria });

    setSaved(true);
    reset();
    onSaved?.();
    setTimeout(() => { setSaved(false); setExpanded(false); }, 1800);
  }

  if (!expanded) {
    return (
      <section className="px-5 pb-3 sm:px-6">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => { setTipo("receita"); setExpanded(true); }}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-[14px] border border-teal-200/70 bg-teal-50/60 px-3 py-3 text-[12.5px] font-semibold text-teal-700 transition-all hover:bg-teal-50 active:scale-[0.97]"
          >
            <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Receita
          </button>
          <button
            type="button"
            onClick={() => { setTipo("despesa"); setExpanded(true); }}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-[14px] border border-terracotta-200/70 bg-terracotta-50/60 px-3 py-3 text-[12.5px] font-semibold text-terracotta-700 transition-all hover:bg-terracotta-50 active:scale-[0.97]"
          >
            <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Despesa
          </button>
        </div>
      </section>
    );
  }

  if (saved) {
    return (
      <section className="px-5 pb-3 sm:px-6">
        <div className="flex items-center gap-2.5 rounded-[16px] border border-teal-200 bg-teal-50 px-4 py-3">
          <svg className="h-4 w-4 flex-shrink-0 text-teal-600" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M3 8l3.5 3.5L13 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p className="text-[13px] font-medium text-teal-700">
            {tipo === "receita" ? "Receita" : "Despesa"} registrada com sucesso.
          </p>
        </div>
      </section>
    );
  }

  const isTipoReceita = tipo === "receita";

  return (
    <section className="px-5 pb-3 sm:px-6">
      <div className={`rounded-[18px] border px-4 py-4 shadow-sm ${
        isTipoReceita
          ? "border-teal-200/80 bg-teal-50/60"
          : "border-terracotta-200/80 bg-terracotta-50/50"
      }`}>

        {/* Tipo toggle + fechar */}
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex rounded-full border border-navy-200/70 bg-white/70 p-0.5">
            {(["receita", "despesa"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => { setTipo(t); setCategoria(""); }}
                className={`rounded-full px-3.5 py-1.5 text-[11.5px] font-semibold transition-all ${
                  tipo === t
                    ? t === "receita" ? "bg-teal-600 text-white" : "bg-terracotta-600 text-white"
                    : "text-navy-500"
                }`}
              >
                {t === "receita" ? "Receita" : "Despesa"}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => { setExpanded(false); reset(); }}
            className="text-[11.5px] text-navy-400 hover:text-navy-600"
          >
            Cancelar
          </button>
        </div>

        {/* Valor */}
        <div className="mb-3">
          <label className="mb-1 block text-[11.5px] font-medium text-navy-600">
            Valor <span className="text-terracotta-500">*</span>
          </label>
          <div className="flex items-center gap-2 rounded-xl border border-navy-200/70 bg-white px-3 py-2.5">
            <span className="text-[13px] font-medium text-navy-400">R$</span>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={valor}
              onChange={(e) => { setValor(e.target.value); setError(""); }}
              placeholder="0,00"
              autoFocus
              className="flex-1 bg-transparent text-[16px] font-semibold text-navy-800 outline-none placeholder:text-navy-300"
            />
          </div>
        </div>

        {/* Categoria */}
        <div className="mb-3">
          <p className="mb-1.5 text-[11.5px] font-medium text-navy-600">
            Categoria <span className="text-terracotta-500">*</span>
          </p>
          <div className="flex flex-wrap gap-1.5">
            {cats.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => { setCategoria(c.id); setError(""); }}
                className={`rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 transition-all active:scale-95 ${
                  categoria === c.id
                    ? isTipoReceita ? "bg-teal-600 text-white ring-teal-600" : "bg-terracotta-600 text-white ring-terracotta-600"
                    : "bg-white text-navy-600 ring-navy-200 hover:ring-navy-300"
                }`}
              >
                {c.icon} {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Data */}
        <div className="mb-3">
          <label className="mb-1 block text-[11.5px] font-medium text-navy-600">
            Data <span className="font-normal text-navy-400">(padrão: hoje)</span>
          </label>
          <input
            type="date"
            value={data}
            onChange={(e) => setData(e.target.value)}
            className="min-h-10 w-full rounded-xl border border-navy-200/70 bg-white px-3 py-2 text-[13px] text-navy-800 focus:outline-none"
          />
        </div>

        {/* Observação opcional */}
        <div className="mb-3">
          <label className="mb-1 block text-[11.5px] font-medium text-navy-600">
            Observação <span className="font-normal text-navy-400">(opcional)</span>
          </label>
          <input
            type="text"
            value={obs}
            onChange={(e) => setObs(e.target.value)}
            placeholder="Ex: Boleto ref. maio/2026"
            maxLength={120}
            className="min-h-10 w-full rounded-xl border border-navy-200/70 bg-white px-3 py-2 text-[13px] text-navy-800 placeholder:text-navy-300 focus:outline-none"
          />
        </div>

        {error && <p className="mb-2 text-[11.5px] text-terracotta-600">{error}</p>}

        <button
          type="button"
          onClick={handleSave}
          className={`inline-flex min-h-10 w-full items-center justify-center rounded-full text-[13px] font-semibold text-white transition-all active:scale-[0.97] ${
            isTipoReceita ? "bg-teal-600 hover:bg-teal-700" : "bg-terracotta-600 hover:bg-terracotta-700"
          }`}
        >
          Registrar {isTipoReceita ? "receita" : "despesa"}
        </button>
      </div>
    </section>
  );
}
