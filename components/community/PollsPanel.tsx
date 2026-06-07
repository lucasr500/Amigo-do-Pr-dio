"use client";

import { useState, useEffect } from "react";
import {
  getPolls, addPoll, closePoll,
  vote, getPollResults, buildPollReport, seedDemoPolls, POLL_DISCLAIMER,
  type Poll,
} from "@/lib/community-polls";
import { emitPollCreated, emitPollClosed } from "@/lib/community-timeline";
import { VISIBILITY_LABELS, type Visibility, type CommunityRole } from "@/lib/community-types";
import { can, filterByVisibility } from "@/lib/community-permissions";

const VISIBILITIES = Object.entries(VISIBILITY_LABELS) as [Visibility, string][];

type FormState = {
  title: string;
  description: string;
  options: string[];
  visibility: Visibility;
  endsAt: string;
};

const EMPTY_FORM: FormState = {
  title: "", description: "", options: ["", ""],
  visibility: "moradores", endsAt: "",
};

type Props = { role: CommunityRole; onSeed?: () => void };

export default function PollsPanel({ role, onSeed }: Props) {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [voted, setVoted] = useState<Set<string>>(new Set());
  const [showResults, setShowResults] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState<string | null>(null);
  const [showClosed, setShowClosed] = useState(false);

  const isManager = role === "manager";

  const load = () => {
    const all = getPolls().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    setPolls(filterByVisibility(all, role));
  };

  useEffect(() => {
    if (isManager && getPolls().length === 0) { seedDemoPolls(); onSeed?.(); }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  const handleSubmit = () => {
    const opts = form.options.filter((o) => o.trim());
    if (!form.title.trim() || opts.length < 2) return;
    const poll = addPoll({
      title: form.title.trim(),
      description: form.description.trim(),
      options: opts.map((label, i) => ({ id: `opt-${i}-${Date.now()}`, label: label.trim() })),
      visibility: form.visibility,
      status: "ativa",
      endsAt: form.endsAt || undefined,
    });
    emitPollCreated(poll.id, poll.title);
    setShowForm(false);
    setForm(EMPTY_FORM);
    load();
  };

  const handleVote = (pollId: string) => {
    const optionId = selected[pollId];
    if (!optionId) return;
    vote(pollId, optionId, `Un. ${role}`);
    setVoted((prev) => new Set([...prev, pollId]));
    setShowResults((prev) => new Set([...prev, pollId]));
  };

  const handleClose = (poll: Poll) => {
    closePoll(poll.id);
    emitPollClosed(poll.id, poll.title);
    load();
  };

  const handleCopyReport = (poll: Poll) => {
    navigator.clipboard.writeText(buildPollReport(poll)).then(() => {
      setCopied(poll.id);
      setTimeout(() => setCopied(null), 2500);
    }).catch(() => {});
  };

  const active = polls.filter((p) => p.status === "ativa");
  const closed = polls.filter((p) => p.status !== "ativa");

  return (
    <section className="px-5 pb-4 sm:px-6 animate-fade-in-up space-y-3">
      {/* Header */}
      <div className="overflow-hidden rounded-2xl border border-navy-100/80 bg-white/90 shadow-[0_1px_3px_rgba(31,49,71,0.04)]">
        <div className="px-5 pt-4 pb-3 flex items-start justify-between">
          <div>
            <p className="text-[10.5px] font-medium uppercase tracking-[0.11em] text-navy-400">Central Digital</p>
            <h2 className="mt-0.5 text-[15px] font-semibold text-navy-800">Enquetes Consultivas</h2>
            <p className="mt-1 text-[12px] leading-relaxed text-navy-500">
              Participação controlada. Resultados orientam decisões sem substituir assembleia formal.
            </p>
          </div>
          {can(role, "canCreatePoll") && (
            <button type="button" onClick={() => setShowForm(true)}
              className="ml-3 flex-shrink-0 mt-0.5 rounded-full bg-navy-800 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-navy-700">
              + Nova
            </button>
          )}
        </div>
        {/* Disclaimer */}
        <div className="border-t border-navy-50 px-5 py-2.5">
          <p className="text-[10.5px] text-navy-400 leading-relaxed">
            ⚠ {POLL_DISCLAIMER}
          </p>
        </div>
      </div>

      {/* Formulário */}
      {showForm && isManager && (
        <div className="overflow-hidden rounded-2xl border border-navy-200 bg-white/95 shadow-[0_1px_3px_rgba(31,49,71,0.06)]">
          <div className="px-5 pt-4 pb-3 space-y-2.5">
            <p className="text-[12.5px] font-semibold text-navy-800">Nova enquete consultiva</p>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-navy-500">Pergunta *</label>
              <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Ex: Qual o melhor horário para obras?"
                className="w-full rounded-xl border border-navy-100 bg-white px-3 py-2 text-[12.5px] text-navy-800 focus:border-navy-300 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-navy-500">Descrição (opcional)</label>
              <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full resize-none rounded-xl border border-navy-100 bg-white px-3 py-2 text-[12.5px] text-navy-800 focus:border-navy-300 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-navy-500">Opções (mínimo 2)</label>
              {form.options.map((opt, i) => (
                <div key={i} className="mb-1.5 flex gap-2">
                  <input type="text" value={opt}
                    onChange={(e) => {
                      const opts = [...form.options];
                      opts[i] = e.target.value;
                      setForm({ ...form, options: opts });
                    }}
                    placeholder={`Opção ${i + 1}`}
                    className="flex-1 rounded-xl border border-navy-100 bg-white px-3 py-2 text-[12px] text-navy-800 focus:border-navy-300 focus:outline-none" />
                  {form.options.length > 2 && (
                    <button type="button" onClick={() => setForm({ ...form, options: form.options.filter((_, j) => j !== i) })}
                      className="text-[11px] text-navy-300 hover:text-terracotta-600">✕</button>
                  )}
                </div>
              ))}
              {form.options.length < 5 && (
                <button type="button" onClick={() => setForm({ ...form, options: [...form.options, ""] })}
                  className="text-[11px] text-navy-400 underline underline-offset-2 hover:text-navy-600">+ Adicionar opção</button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-[11px] font-medium text-navy-500">Visibilidade</label>
                <select value={form.visibility} onChange={(e) => setForm({ ...form, visibility: e.target.value as Visibility })}
                  className="w-full rounded-xl border border-navy-100 bg-white px-3 py-2 text-[12px] text-navy-800 focus:border-navy-300 focus:outline-none">
                  {VISIBILITIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-navy-500">Encerramento</label>
                <input type="date" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
                  className="w-full rounded-xl border border-navy-100 bg-white px-3 py-2 text-[12px] text-navy-800 focus:border-navy-300 focus:outline-none" />
              </div>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={handleSubmit}
                className="rounded-full bg-navy-800 px-4 py-1.5 text-[12px] font-medium text-white hover:bg-navy-700 active:scale-[0.97]">
                Criar enquete
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="rounded-full px-4 py-1.5 text-[12px] text-navy-400 hover:text-navy-600">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Enquetes ativas */}
      {active.length === 0 && !showForm && (
        <div className="rounded-2xl border border-navy-100 bg-white/90 px-5 py-8 text-center">
          <p className="text-[13px] font-medium text-navy-600 mb-1">Nenhuma enquete ativa</p>
          <p className="text-[11.5px] text-navy-400">
            {isManager ? "Crie uma enquete consultiva para ouvir os moradores." : "Aguarde a criação de enquetes pela gestão."}
          </p>
        </div>
      )}

      <div className="space-y-2">
        {active.map((poll) => {
          const results = getPollResults(poll.id);
          const totalVotes = results.reduce((s, r) => s + r.count, 0);
          const hasVoted = voted.has(poll.id);
          const seeResults = showResults.has(poll.id) || isManager;

          return (
            <div key={poll.id} className="overflow-hidden rounded-2xl border border-navy-100/80 bg-white/90 shadow-[0_1px_3px_rgba(31,49,71,0.04)]">
              <div className="px-5 py-4">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <p className="text-[13px] font-semibold text-navy-800">{poll.title}</p>
                    {poll.description && <p className="mt-0.5 text-[11.5px] text-navy-500">{poll.description}</p>}
                    <p className="mt-0.5 text-[10.5px] text-navy-400">
                      {totalVotes} resposta{totalVotes !== 1 ? "s" : ""}
                      {poll.endsAt && ` · Encerra ${new Date(poll.endsAt).toLocaleDateString("pt-BR")}`}
                    </p>
                  </div>
                  {isManager && (
                    <div className="flex gap-2 flex-shrink-0">
                      <button type="button" onClick={() => handleCopyReport(poll)}
                        className="rounded-full border border-navy-100 px-2.5 py-1 text-[10.5px] text-navy-600 hover:bg-navy-50">
                        {copied === poll.id ? "Copiado!" : "Exportar"}
                      </button>
                      <button type="button" onClick={() => handleClose(poll)}
                        className="rounded-full border border-navy-100 px-2.5 py-1 text-[10.5px] text-navy-600 hover:bg-navy-50">
                        Encerrar
                      </button>
                    </div>
                  )}
                </div>

                {/* Votação */}
                {!hasVoted && can(role, "canVoteInPoll") && !isManager && (
                  <div className="space-y-1.5 mb-3">
                    {poll.options.map((opt) => (
                      <button key={opt.id} type="button"
                        onClick={() => setSelected((prev) => ({ ...prev, [poll.id]: opt.id }))}
                        className={`w-full rounded-xl border px-3 py-2 text-left text-[12px] transition-colors ${selected[poll.id] === opt.id ? "border-navy-400 bg-navy-50 text-navy-800 font-medium" : "border-navy-100 bg-white text-navy-600 hover:bg-navy-50"}`}>
                        {opt.label}
                      </button>
                    ))}
                    <button type="button" onClick={() => handleVote(poll.id)}
                      disabled={!selected[poll.id]}
                      className="mt-2 w-full rounded-xl bg-navy-800 py-2 text-[12px] font-medium text-white hover:bg-navy-700 disabled:opacity-40">
                      Votar
                    </button>
                  </div>
                )}

                {/* Resultados */}
                {seeResults && (
                  <div className="space-y-1.5">
                    {results.map((r) => (
                      <div key={r.optionId}>
                        <div className="flex items-center justify-between text-[11.5px] mb-0.5">
                          <span className="text-navy-700">{r.label}</span>
                          <span className="text-navy-500 font-medium">{r.count} ({r.pct}%)</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-navy-100 overflow-hidden">
                          <div className="h-full rounded-full bg-navy-400 transition-all duration-500" style={{ width: `${r.pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {hasVoted && !seeResults && (
                  <div className="flex items-center gap-2">
                    <p className="text-[11.5px] text-green-600 font-medium">Voto registrado.</p>
                    <button type="button" onClick={() => setShowResults((prev) => new Set([...prev, poll.id]))}
                      className="text-[11px] text-navy-400 underline underline-offset-2 hover:text-navy-600">Ver resultados</button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Enquetes encerradas */}
      {isManager && closed.length > 0 && (
        <div>
          <button type="button" onClick={() => setShowClosed((v) => !v)}
            className="text-[11px] text-navy-400 underline underline-offset-2 hover:text-navy-600">
            {showClosed ? "Ocultar encerradas" : `Ver ${closed.length} enquete${closed.length !== 1 ? "s" : ""} encerrada${closed.length !== 1 ? "s" : ""}`}
          </button>
          {showClosed && closed.map((poll) => {
            const results = getPollResults(poll.id);
            const totalVotes = results.reduce((s, r) => s + r.count, 0);
            return (
              <div key={poll.id} className="mt-2 overflow-hidden rounded-2xl border border-navy-100/50 bg-white/70 shadow-[0_1px_3px_rgba(31,49,71,0.03)]">
                <div className="px-5 py-3.5">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-[12.5px] font-semibold text-navy-600">{poll.title}</p>
                      <p className="text-[10.5px] text-navy-400">{totalVotes} respostas · Encerrada</p>
                    </div>
                    <button type="button" onClick={() => handleCopyReport(poll)}
                      className="text-[11px] text-navy-400 underline underline-offset-2 hover:text-navy-600">
                      {copied === poll.id ? "Copiado!" : "Exportar"}
                    </button>
                  </div>
                  <div className="space-y-1">
                    {results.map((r) => (
                      <div key={r.optionId} className="flex items-center gap-2 text-[11px] text-navy-500">
                        <div className="w-20 h-1.5 rounded-full bg-navy-100 overflow-hidden flex-shrink-0">
                          <div className="h-full rounded-full bg-navy-300" style={{ width: `${r.pct}%` }} />
                        </div>
                        <span>{r.label} — {r.pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
