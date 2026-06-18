"use client";

import { useEffect, useState } from "react";
import {
  getAssemblies, addAssembly, deleteAssembly,
  getAgendaItems, addAgendaItem, deleteAgendaItem,
  countAgendaItems,
  ASSEMBLY_TIPO_LABELS, ASSEMBLY_STATUS_LABELS, AGENDA_ITEM_TIPO_LABELS,
  type Assembly, type AssemblyAgendaItem, type AssemblyTipo, type AssemblyStatus, type AgendaItemTipo,
} from "@/lib/session-assembleias";
import {
  convocarAssembleia, realizarAssembleia, encerrarAssembleia,
  deliberarItem, deliberacaoProgress,
} from "@/lib/assembleias-loop";

const TIPOS = Object.entries(ASSEMBLY_TIPO_LABELS) as [AssemblyTipo, string][];
const ITEM_TIPOS = Object.entries(AGENDA_ITEM_TIPO_LABELS) as [AgendaItemTipo, string][];

const STATUS_STYLES: Record<AssemblyStatus, string> = {
  rascunho:  "bg-navy-50 text-navy-500 ring-navy-100",
  convocada: "bg-amber-50 text-amber-700 ring-amber-100",
  realizada: "bg-sage-50 text-sage-700 ring-sage-100",
  encerrada: "bg-navy-100 text-navy-600 ring-navy-200",
};

type NewAssembly = { titulo: string; tipo: AssemblyTipo; data: string; local: string };
const EMPTY_ASSEMBLY: NewAssembly = { titulo: "", tipo: "ago", data: new Date().toISOString().slice(0, 10), local: "" };

export default function AssembleiasPanel() {
  const [assemblies, setAssemblies] = useState<Assembly[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<NewAssembly>(EMPTY_ASSEMBLY);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => { setAssemblies(getAssemblies()); }, []);
  const refresh = () => setAssemblies(getAssemblies());

  const handleCreate = () => {
    if (!form.titulo.trim()) return;
    const nova = addAssembly({
      titulo: form.titulo,
      tipo: form.tipo,
      data: form.data || undefined,
      local: form.local || undefined,
      status: "rascunho",
    });
    setShowForm(false);
    setForm(EMPTY_ASSEMBLY);
    refresh();
    setExpandedId(nova.id);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Remover esta assembleia e toda a sua pauta?")) return;
    deleteAssembly(id);
    if (expandedId === id) setExpandedId(null);
    refresh();
  };

  return (
    <section className="px-5 pb-4 sm:px-6 animate-fade-in-up space-y-3">

      {/* Header */}
      <div className="overflow-hidden rounded-2xl border border-navy-100/80 bg-white/90 shadow-[0_1px_3px_rgba(31,49,71,0.04),0_4px_16px_-6px_rgba(31,49,71,0.06)]">
        <div className="px-5 pt-4 pb-3 flex items-start justify-between">
          <div>
            <p className="text-[10.5px] font-medium uppercase tracking-[0.11em] text-navy-400">Governança</p>
            <h2 className="mt-0.5 text-[15px] font-semibold text-navy-800">Assembleias</h2>
            <p className="mt-1 text-[12px] leading-relaxed text-navy-500">
              Convoque, organize a pauta e delibere. Cada deliberação vira decisão registrada e entra na linha do tempo.
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-navy-400">
              Apoio à condução — não substitui a ata oficial nem a deliberação formal em assembleia.
            </p>
          </div>
          <button type="button" onClick={() => { setShowForm(true); setForm(EMPTY_ASSEMBLY); }}
            className="flex-shrink-0 ml-3 mt-0.5 rounded-full bg-navy-800 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-navy-700">
            Nova assembleia
          </button>
        </div>
      </div>

      {/* Formulário de criação */}
      {showForm && (
        <div className="overflow-hidden rounded-2xl border border-navy-200 bg-white/95 shadow-[0_1px_3px_rgba(31,49,71,0.06)]">
          <div className="px-5 pt-4 pb-4 space-y-2.5">
            <p className="text-[12.5px] font-semibold text-navy-800 mb-1">Nova assembleia</p>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-navy-500">Título *</label>
              <input type="text" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                placeholder="Ex: AGO 2026 — prestação de contas e previsão orçamentária"
                className="w-full rounded-xl border border-navy-100 bg-white px-3 py-2 text-[12.5px] text-navy-800 focus:border-navy-300 focus:outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-[11px] font-medium text-navy-500">Tipo</label>
                <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value as AssemblyTipo })}
                  className="w-full rounded-xl border border-navy-100 bg-white px-3 py-2 text-[12px] text-navy-800 focus:border-navy-300 focus:outline-none">
                  {TIPOS.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-navy-500">Data</label>
                <input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })}
                  className="w-full rounded-xl border border-navy-100 bg-white px-3 py-2 text-[12px] text-navy-800 focus:border-navy-300 focus:outline-none" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-navy-500">Local</label>
              <input type="text" value={form.local} onChange={(e) => setForm({ ...form, local: e.target.value })}
                placeholder="Ex: Salão de festas / videoconferência"
                className="w-full rounded-xl border border-navy-100 bg-white px-3 py-2 text-[12.5px] text-navy-800 focus:border-navy-300 focus:outline-none" />
            </div>
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={handleCreate}
                className="rounded-full bg-navy-800 px-4 py-1.5 text-[11px] font-medium text-white hover:bg-navy-700 disabled:opacity-40"
                disabled={!form.titulo.trim()}>
                Criar
              </button>
              <button type="button" onClick={() => { setShowForm(false); setForm(EMPTY_ASSEMBLY); }}
                className="rounded-full border border-navy-100 bg-white px-4 py-1.5 text-[11px] font-medium text-navy-600 hover:bg-navy-50">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista */}
      {assemblies.length === 0 && !showForm && (
        <div className="rounded-2xl border border-dashed border-navy-100 bg-white/60 px-5 py-8 text-center">
          <p className="text-[12.5px] text-navy-500">Nenhuma assembleia ainda.</p>
          <p className="mt-1 text-[11.5px] text-navy-400">Crie a primeira para organizar pauta e registrar deliberações.</p>
        </div>
      )}

      {assemblies.map((a) => (
        <AssemblyCard
          key={a.id}
          assembly={a}
          expanded={expandedId === a.id}
          onToggle={() => setExpandedId(expandedId === a.id ? null : a.id)}
          onChanged={refresh}
          onDelete={() => handleDelete(a.id)}
        />
      ))}
    </section>
  );
}

// ─── Card de uma assembleia ───────────────────────────────────────────────────

function AssemblyCard({
  assembly, expanded, onToggle, onChanged, onDelete,
}: {
  assembly: Assembly;
  expanded: boolean;
  onToggle: () => void;
  onChanged: () => void;
  onDelete: () => void;
}) {
  const a = assembly;
  const itemCount = countAgendaItems(a.id);
  const progress = deliberacaoProgress(a.id);

  const advance = (fn: () => void) => { fn(); onChanged(); };

  return (
    <div className="overflow-hidden rounded-2xl border border-navy-100/80 bg-white/90 shadow-[0_1px_3px_rgba(31,49,71,0.04)]">
      {/* Cabeçalho do card */}
      <button type="button" onClick={onToggle} className="w-full px-5 pt-4 pb-3 text-left">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset ${STATUS_STYLES[a.status]}`}>
                {ASSEMBLY_STATUS_LABELS[a.status]}
              </span>
              <span className="text-[10.5px] font-medium uppercase tracking-[0.08em] text-navy-400">
                {ASSEMBLY_TIPO_LABELS[a.tipo]}
              </span>
            </div>
            <h3 className="mt-1.5 text-[13.5px] font-semibold text-navy-800 truncate">{a.titulo}</h3>
            <p className="mt-0.5 text-[11.5px] text-navy-500">
              {a.data ? new Date(`${a.data}T12:00:00`).toLocaleDateString("pt-BR") : "Sem data"}
              {a.local ? ` · ${a.local}` : ""}
              {` · ${itemCount} item${itemCount !== 1 ? "s" : ""} de pauta`}
            </p>
          </div>
          <span className="flex-shrink-0 text-navy-300 text-[12px] mt-1">{expanded ? "▲" : "▼"}</span>
        </div>

        {progress.total > 0 && (
          <div className="mt-2.5">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-navy-50">
              <div className="h-full rounded-full bg-sage-400 transition-all" style={{ width: `${progress.pct}%` }} />
            </div>
            <p className="mt-1 text-[10.5px] text-navy-400">
              {progress.decididos} de {progress.total} deliberações concluídas
            </p>
          </div>
        )}
      </button>

      {expanded && (
        <div className="border-t border-navy-50 px-5 py-4 space-y-4">
          {/* Ciclo de vida */}
          <div className="flex flex-wrap gap-2">
            {a.status === "rascunho" && (
              <button type="button" onClick={() => advance(() => convocarAssembleia(a.id))}
                className="rounded-full bg-amber-500 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-amber-600">
                Convocar
              </button>
            )}
            {(a.status === "rascunho" || a.status === "convocada") && (
              <button type="button" onClick={() => advance(() => realizarAssembleia(a.id))}
                className="rounded-full bg-sage-600 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-sage-700">
                Marcar como realizada
              </button>
            )}
            {a.status === "realizada" && (
              <button type="button" onClick={() => advance(() => encerrarAssembleia(a.id))}
                className="rounded-full bg-navy-700 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-navy-800">
                Encerrar
              </button>
            )}
            <button type="button" onClick={onDelete}
              className="ml-auto rounded-full border border-terracotta-100 bg-white px-3 py-1.5 text-[11px] font-medium text-terracotta-600 hover:bg-terracotta-50">
              Remover
            </button>
          </div>

          <PautaEditor assemblyId={a.id} onChanged={onChanged} />
        </div>
      )}
    </div>
  );
}

// ─── Editor de pauta + deliberação ────────────────────────────────────────────

function PautaEditor({ assemblyId, onChanged }: { assemblyId: string; onChanged: () => void }) {
  const [itens, setItens] = useState<AssemblyAgendaItem[]>([]);
  const [novoTitulo, setNovoTitulo] = useState("");
  const [novoTipo, setNovoTipo] = useState<AgendaItemTipo>("deliberacao");
  const [deliberandoId, setDeliberandoId] = useState<string | null>(null);
  const [resultado, setResultado] = useState("");

  const reload = () => setItens(getAgendaItems(assemblyId));
  useEffect(reload, [assemblyId]);

  const handleAdd = () => {
    if (!novoTitulo.trim()) return;
    addAgendaItem({ assemblyId, titulo: novoTitulo, tipo: novoTipo });
    setNovoTitulo("");
    setNovoTipo("deliberacao");
    reload();
    onChanged();
  };

  const handleDeliberar = (itemId: string) => {
    if (!resultado.trim()) return;
    deliberarItem(itemId, { resultado });
    setDeliberandoId(null);
    setResultado("");
    reload();
    onChanged();
  };

  const handleRemoveItem = (itemId: string) => {
    deleteAgendaItem(itemId);
    reload();
    onChanged();
  };

  return (
    <div className="space-y-2.5">
      <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-navy-400">Pauta</p>

      {itens.length === 0 && (
        <p className="text-[11.5px] text-navy-400">Nenhum item de pauta. Adicione abaixo.</p>
      )}

      {itens.map((item, idx) => (
        <div key={item.id} className="rounded-xl border border-navy-50 bg-navy-50/30 px-3 py-2.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[12.5px] font-medium text-navy-800">
                <span className="text-navy-400 mr-1">{idx + 1}.</span>{item.titulo}
              </p>
              <span className="text-[10px] font-medium uppercase tracking-[0.06em] text-navy-400">
                {AGENDA_ITEM_TIPO_LABELS[item.tipo]}
              </span>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {item.decididoEm ? (
                <span className="rounded-full bg-sage-50 px-2 py-0.5 text-[10px] font-medium text-sage-700 ring-1 ring-inset ring-sage-100">
                  Deliberado
                </span>
              ) : item.tipo !== "informe" ? (
                <button type="button" onClick={() => { setDeliberandoId(item.id); setResultado(""); }}
                  className="rounded-full bg-navy-800 px-2.5 py-1 text-[10.5px] font-medium text-white hover:bg-navy-700">
                  Deliberar
                </button>
              ) : null}
              <button type="button" onClick={() => handleRemoveItem(item.id)}
                className="rounded-full border border-navy-100 bg-white px-2 py-1 text-[10.5px] font-medium text-navy-500 hover:bg-white">
                ✕
              </button>
            </div>
          </div>

          {item.resultado && (
            <p className="mt-1.5 text-[11.5px] leading-relaxed text-navy-600">
              <span className="font-medium text-navy-500">Resultado: </span>{item.resultado}
              {item.linkedDecisionId && (
                <span className="ml-1 text-[10.5px] text-sage-600">· decisão registrada</span>
              )}
            </p>
          )}

          {deliberandoId === item.id && (
            <div className="mt-2 space-y-2">
              <textarea rows={2} value={resultado} onChange={(e) => setResultado(e.target.value)}
                placeholder="O que foi deliberado neste item..."
                className="w-full resize-none rounded-xl border border-navy-100 bg-white px-3 py-2 text-[12px] text-navy-800 focus:border-navy-300 focus:outline-none" />
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => handleDeliberar(item.id)}
                  className="rounded-full bg-sage-600 px-3 py-1.5 text-[10.5px] font-medium text-white hover:bg-sage-700 disabled:opacity-40"
                  disabled={!resultado.trim()}>
                  Registrar deliberação
                </button>
                <button type="button" onClick={() => { setDeliberandoId(null); setResultado(""); }}
                  className="rounded-full border border-navy-100 bg-white px-3 py-1.5 text-[10.5px] font-medium text-navy-500 hover:bg-navy-50">
                  Cancelar
                </button>
              </div>
              <p className="text-[10px] text-navy-400">A deliberação cria uma decisão registrada (categoria Assembleia) e entra na linha do tempo.</p>
            </div>
          )}
        </div>
      ))}

      {/* Adicionar item */}
      <div className="flex items-end gap-2 pt-1">
        <div className="flex-1">
          <input type="text" value={novoTitulo} onChange={(e) => setNovoTitulo(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
            placeholder="Novo item de pauta"
            className="w-full rounded-xl border border-navy-100 bg-white px-3 py-2 text-[12px] text-navy-800 focus:border-navy-300 focus:outline-none" />
        </div>
        <select value={novoTipo} onChange={(e) => setNovoTipo(e.target.value as AgendaItemTipo)}
          className="rounded-xl border border-navy-100 bg-white px-2 py-2 text-[11.5px] text-navy-700 focus:border-navy-300 focus:outline-none">
          {ITEM_TIPOS.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
        </select>
        <button type="button" onClick={handleAdd}
          className="rounded-full bg-navy-800 px-3 py-2 text-[11px] font-medium text-white hover:bg-navy-700 disabled:opacity-40"
          disabled={!novoTitulo.trim()}>
          Adicionar
        </button>
      </div>
    </div>
  );
}
