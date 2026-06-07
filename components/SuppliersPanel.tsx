"use client";

import { useState, useEffect } from "react";
import {
  getSuppliers, addSupplier, updateSupplier, deleteSupplier, addServiceRecord,
  buildSuppliersReport, SUPPLIER_CATEGORY_LABELS,
  type Supplier, type SupplierCategory, type SupplierRating,
} from "@/lib/suppliers";

const CATEGORIES = Object.entries(SUPPLIER_CATEGORY_LABELS) as [SupplierCategory, string][];

type FormState = Omit<Supplier, "id" | "createdAt" | "updatedAt" | "serviceHistory">;

const EMPTY_FORM: FormState = {
  name: "",
  category: "outro",
  contact: "",
  responsible: "",
  cnpj: "",
  notes: "",
  active: true,
  contractStart: "",
  contractEnd: "",
  monthlyAmount: undefined,
  rating: undefined,
};

export default function SuppliersPanel() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [filterCat, setFilterCat] = useState<SupplierCategory | "all">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [serviceForm, setServiceForm] = useState<{ supplierId: string; date: string; description: string; amount: string } | null>(null);

  useEffect(() => { setSuppliers(getSuppliers()); }, []);

  const refresh = () => setSuppliers(getSuppliers());

  const handleSubmit = () => {
    if (!form.name.trim()) return;
    if (editId) {
      updateSupplier(editId, form);
    } else {
      addSupplier(form);
    }
    setShowForm(false);
    setEditId(null);
    setForm(EMPTY_FORM);
    refresh();
  };

  const handleEdit = (s: Supplier) => {
    setForm({
      name: s.name,
      category: s.category,
      contact: s.contact ?? "",
      responsible: s.responsible ?? "",
      cnpj: s.cnpj ?? "",
      notes: s.notes ?? "",
      active: s.active,
      contractStart: s.contractStart ?? "",
      contractEnd: s.contractEnd ?? "",
      monthlyAmount: s.monthlyAmount,
      rating: s.rating,
    });
    setEditId(s.id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Remover este fornecedor?")) return;
    deleteSupplier(id);
    refresh();
  };

  const handleAddService = () => {
    if (!serviceForm || !serviceForm.description.trim()) return;
    addServiceRecord(serviceForm.supplierId, {
      date: serviceForm.date || new Date().toISOString().slice(0, 10),
      description: serviceForm.description,
      amount: serviceForm.amount ? Number(serviceForm.amount) : undefined,
    });
    setServiceForm(null);
    refresh();
  };

  const handleCopyReport = () => {
    const report = buildSuppliersReport(suppliers);
    navigator.clipboard.writeText(report).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }).catch(() => {});
  };

  const filtered = filterCat === "all" ? suppliers : suppliers.filter((s) => s.category === filterCat);
  const active = filtered.filter((s) => s.active);
  const inactive = filtered.filter((s) => !s.active);

  return (
    <section className="px-5 pb-4 sm:px-6 animate-fade-in-up space-y-3">

      {/* Header */}
      <div className="overflow-hidden rounded-2xl border border-navy-100/80 bg-white/90 shadow-[0_1px_3px_rgba(31,49,71,0.04),0_4px_16px_-6px_rgba(31,49,71,0.06)]">
        <div className="px-5 pt-4 pb-3 flex items-start justify-between">
          <div>
            <p className="text-[10.5px] font-medium uppercase tracking-[0.11em] text-navy-400">Memória institucional</p>
            <h2 className="mt-0.5 text-[15px] font-semibold text-navy-800">Fornecedores</h2>
            <p className="mt-1 text-[12px] leading-relaxed text-navy-500">
              Catálogo de fornecedores com histórico de serviços. Esse ativo é herdado pelo próximo síndico.
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0 ml-3 mt-0.5">
            {suppliers.length > 0 && (
              <button
                type="button"
                onClick={handleCopyReport}
                className="rounded-full border border-navy-100 bg-white px-2.5 py-1.5 text-[11px] font-medium text-navy-600 transition-colors hover:bg-navy-50"
              >
                {copied ? "Copiado!" : "Exportar"}
              </button>
            )}
            <button
              type="button"
              onClick={() => { setShowForm(true); setEditId(null); setForm(EMPTY_FORM); }}
              className="rounded-full bg-navy-800 px-3 py-1.5 text-[11px] font-medium text-white transition-colors hover:bg-navy-700"
            >
              + Novo
            </button>
          </div>
        </div>

        {/* Filtro de categoria */}
        {suppliers.length > 2 && (
          <div className="border-t border-navy-50 px-5 py-2.5">
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setFilterCat("all")}
                className={`rounded-full px-2.5 py-1 text-[10.5px] font-medium transition-colors ${filterCat === "all" ? "bg-navy-800 text-white" : "bg-navy-50 text-navy-500 hover:bg-navy-100"}`}
              >
                Todos ({suppliers.length})
              </button>
              {CATEGORIES.filter(([cat]) => suppliers.some((s) => s.category === cat)).map(([cat, label]) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFilterCat(cat)}
                  className={`rounded-full px-2.5 py-1 text-[10.5px] font-medium transition-colors ${filterCat === cat ? "bg-navy-800 text-white" : "bg-navy-50 text-navy-500 hover:bg-navy-100"}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Formulário */}
      {showForm && (
        <div className="overflow-hidden rounded-2xl border border-navy-200 bg-white/95 shadow-[0_1px_3px_rgba(31,49,71,0.06)]">
          <div className="px-5 pt-4 pb-3">
            <p className="text-[12.5px] font-semibold text-navy-800 mb-3">{editId ? "Editar fornecedor" : "Novo fornecedor"}</p>
            <div className="space-y-2.5">
              <div>
                <label className="mb-1 block text-[11px] font-medium text-navy-500">Nome *</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-xl border border-navy-100 bg-white px-3 py-2 text-[12.5px] text-navy-800 focus:border-navy-300 focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-navy-500">Categoria</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as SupplierCategory })}
                    className="w-full rounded-xl border border-navy-100 bg-white px-3 py-2 text-[12px] text-navy-800 focus:border-navy-300 focus:outline-none">
                    {CATEGORIES.map(([cat, label]) => <option key={cat} value={cat}>{label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-navy-500">Avaliação</label>
                  <select value={form.rating ?? ""} onChange={(e) => setForm({ ...form, rating: e.target.value ? Number(e.target.value) as SupplierRating : undefined })}
                    className="w-full rounded-xl border border-navy-100 bg-white px-3 py-2 text-[12px] text-navy-800 focus:border-navy-300 focus:outline-none">
                    <option value="">— Sem avaliação</option>
                    {[1,2,3,4,5].map((n) => <option key={n} value={n}>{"★".repeat(n)}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-navy-500">Contato</label>
                  <input type="text" value={form.contact ?? ""} onChange={(e) => setForm({ ...form, contact: e.target.value })}
                    placeholder="(11) 99999-9999"
                    className="w-full rounded-xl border border-navy-100 bg-white px-3 py-2 text-[12.5px] text-navy-800 focus:border-navy-300 focus:outline-none" />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-navy-500">Responsável</label>
                  <input type="text" value={form.responsible ?? ""} onChange={(e) => setForm({ ...form, responsible: e.target.value })}
                    className="w-full rounded-xl border border-navy-100 bg-white px-3 py-2 text-[12.5px] text-navy-800 focus:border-navy-300 focus:outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-navy-500">Contrato até</label>
                  <input type="date" value={form.contractEnd ?? ""} onChange={(e) => setForm({ ...form, contractEnd: e.target.value })}
                    className="w-full rounded-xl border border-navy-100 bg-white px-3 py-2 text-[12px] text-navy-800 focus:border-navy-300 focus:outline-none" />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-navy-500">Valor mensal (R$)</label>
                  <input type="number" min="0" step="0.01" value={form.monthlyAmount ?? ""} onChange={(e) => setForm({ ...form, monthlyAmount: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full rounded-xl border border-navy-100 bg-white px-3 py-2 text-[12.5px] text-navy-800 focus:border-navy-300 focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-navy-500">Observações</label>
                <textarea rows={2} value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full resize-none rounded-xl border border-navy-100 bg-white px-3 py-2 text-[12.5px] text-navy-800 focus:border-navy-300 focus:outline-none" />
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <button type="button" onClick={handleSubmit}
                className="rounded-full bg-navy-800 px-4 py-1.5 text-[12px] font-medium text-white transition-all hover:bg-navy-700 active:scale-[0.97]">
                {editId ? "Salvar" : "Adicionar"}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setEditId(null); }}
                className="rounded-full px-4 py-1.5 text-[12px] text-navy-400 transition-colors hover:text-navy-600">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista */}
      {active.length === 0 && inactive.length === 0 && (
        <div className="rounded-2xl border border-navy-100 bg-white/90 px-5 py-8 text-center">
          <p className="text-[13px] font-medium text-navy-600 mb-1">Nenhum fornecedor cadastrado</p>
          <p className="text-[11.5px] text-navy-400">Cadastre fornecedores para construir a memória institucional do condomínio.</p>
        </div>
      )}

      {active.map((s) => (
        <div key={s.id} className="overflow-hidden rounded-2xl border border-navy-100/80 bg-white/90 shadow-[0_1px_3px_rgba(31,49,71,0.04)]">
          <button
            type="button"
            className="w-full px-5 py-3.5 text-left"
            onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-[13px] font-semibold text-navy-800">{s.name}</p>
                  {s.rating && <span className="text-[10.5px] text-amber-500">{"★".repeat(s.rating)}</span>}
                </div>
                <p className="mt-0.5 text-[11px] text-navy-400">
                  {SUPPLIER_CATEGORY_LABELS[s.category]}
                  {s.contractEnd && ` · contrato até ${s.contractEnd}`}
                  {s.contact && ` · ${s.contact}`}
                </p>
              </div>
              <svg className={`h-4 w-4 flex-shrink-0 text-navy-300 transition-transform ${expandedId === s.id ? "rotate-180" : ""}`} viewBox="0 0 16 16" fill="none">
                <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </button>

          {expandedId === s.id && (
            <div className="border-t border-navy-50 px-5 pb-3.5 space-y-3">
              {s.notes && <p className="mt-2 text-[11.5px] text-navy-600 leading-relaxed">{s.notes}</p>}

              {/* Histórico */}
              {s.serviceHistory.length > 0 && (
                <div>
                  <p className="text-[10.5px] font-medium uppercase tracking-[0.1em] text-navy-400 mb-1.5">Histórico de serviços</p>
                  <div className="space-y-1.5">
                    {[...s.serviceHistory].reverse().map((rec) => (
                      <div key={rec.id} className="rounded-xl bg-navy-50/60 px-3 py-2">
                        <p className="text-[11.5px] font-medium text-navy-700">{rec.date} — {rec.description}</p>
                        {rec.amount !== undefined && <p className="text-[10.5px] text-navy-400">R$ {rec.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Formulário de novo serviço */}
              {serviceForm?.supplierId === s.id ? (
                <div className="rounded-xl border border-navy-100 bg-navy-50/40 p-3 space-y-2">
                  <p className="text-[11px] font-medium text-navy-600">Registrar serviço</p>
                  <input type="date" value={serviceForm.date} onChange={(e) => setServiceForm({ ...serviceForm, date: e.target.value })}
                    className="w-full rounded-xl border border-navy-100 bg-white px-3 py-1.5 text-[12px] text-navy-800 focus:border-navy-300 focus:outline-none" />
                  <input type="text" value={serviceForm.description} onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                    placeholder="Descrição do serviço"
                    className="w-full rounded-xl border border-navy-100 bg-white px-3 py-1.5 text-[12px] text-navy-800 focus:border-navy-300 focus:outline-none" />
                  <input type="number" value={serviceForm.amount} onChange={(e) => setServiceForm({ ...serviceForm, amount: e.target.value })}
                    placeholder="Valor (R$)" min="0" step="0.01"
                    className="w-full rounded-xl border border-navy-100 bg-white px-3 py-1.5 text-[12px] text-navy-800 focus:border-navy-300 focus:outline-none" />
                  <div className="flex gap-2">
                    <button type="button" onClick={handleAddService}
                      className="rounded-full bg-navy-800 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-navy-700">
                      Salvar
                    </button>
                    <button type="button" onClick={() => setServiceForm(null)}
                      className="rounded-full px-3 py-1.5 text-[11px] text-navy-400 hover:text-navy-600">
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <button type="button"
                  onClick={() => setServiceForm({ supplierId: s.id, date: new Date().toISOString().slice(0, 10), description: "", amount: "" })}
                  className="text-[11.5px] font-medium text-navy-500 hover:text-navy-700 underline underline-offset-2">
                  + Registrar serviço
                </button>
              )}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => handleEdit(s)}
                  className="text-[11px] text-navy-400 underline underline-offset-2 hover:text-navy-600">
                  Editar
                </button>
                <button type="button" onClick={() => handleDelete(s.id)}
                  className="text-[11px] text-terracotta-500 underline underline-offset-2 hover:text-terracotta-700">
                  Remover
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      {inactive.length > 0 && (
        <p className="px-1 text-[11px] text-navy-400">{inactive.length} fornecedor{inactive.length > 1 ? "es" : ""} inativo{inactive.length > 1 ? "s" : ""} não exibido{inactive.length > 1 ? "s" : ""}.</p>
      )}
    </section>
  );
}
