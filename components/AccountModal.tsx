"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { isEnabled } from "@/lib/feature-flags";

type Step = "idle" | "sending" | "sent" | "error";

type Props = {
  onClose: () => void;
};

export default function AccountModal({ onClose }: Props) {
  const { mode, user, isAuthenticated, sendMagicLink, signOut } = useAuth();
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<Step>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const authEnabled = isEnabled("auth_enabled");

  async function handleSendLink() {
    if (!email.trim() || !email.includes("@")) {
      setErrorMsg("Informe um e-mail válido.");
      return;
    }
    setStep("sending");
    setErrorMsg("");
    const result = await sendMagicLink(email.trim());
    if (result.error) {
      setErrorMsg(result.error);
      setStep("error");
    } else {
      setStep("sent");
    }
  }

  async function handleSignOut() {
    await signOut();
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="absolute inset-0 bg-navy-900/40 backdrop-blur-[2px]" aria-hidden="true" />

      <div className="relative w-full max-w-sm rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-2xl">
        {/* Handle */}
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-navy-100 sm:hidden" />

        {/* Fechar */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-navy-300 hover:bg-navy-50 hover:text-navy-500"
        >
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none">
            <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
          </svg>
        </button>

        {/* ── Usuário autenticado ── */}
        {isAuthenticated && user?.type === "authenticated" ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-100 text-teal-700 font-semibold text-base">
                {user.email?.[0]?.toUpperCase() ?? "S"}
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-navy-800 truncate">{user.email}</p>
                <p className="text-[11px] text-teal-600 font-medium">Conta ativa</p>
              </div>
            </div>

            <div className="rounded-xl bg-navy-50 p-3 text-[12px] text-navy-500 leading-relaxed">
              Seus dados são sincronizados automaticamente. Você pode acessar de qualquer dispositivo com o mesmo e-mail.
            </div>

            <button
              type="button"
              onClick={handleSignOut}
              className="w-full rounded-xl border border-red-200 py-2.5 text-[13px] font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              Sair da conta
            </button>
          </div>
        ) : (
          /* ── Guest / magic link ── */
          <div className="space-y-4">
            <div>
              <h2 className="font-display text-[17px] font-bold text-navy-800">
                {authEnabled ? "Salvar na nuvem" : "Conta"}
              </h2>
              {authEnabled ? (
                <p className="mt-1 text-[12px] text-navy-500">
                  Acesse de qualquer dispositivo com um link enviado por e-mail.
                </p>
              ) : (
                <p className="mt-1 text-[12px] text-navy-500">
                  No momento o app funciona localmente no seu dispositivo. O login em nuvem estará disponível em breve.
                </p>
              )}
            </div>

            {authEnabled && step !== "sent" && (
              <div className="space-y-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSendLink(); }}
                  placeholder="seu@email.com"
                  autoFocus
                  className="w-full rounded-xl border border-navy-200 px-3.5 py-2.5 text-[14px] text-navy-800 placeholder:text-navy-300 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-400/20"
                />
                {errorMsg && (
                  <p className="text-[11px] text-red-500">{errorMsg}</p>
                )}
                <button
                  type="button"
                  onClick={handleSendLink}
                  disabled={step === "sending"}
                  className="w-full rounded-xl bg-teal-600 py-2.5 text-[13px] font-semibold text-white hover:bg-teal-700 disabled:opacity-50 transition-colors"
                >
                  {step === "sending" ? "Enviando…" : "Enviar link de acesso"}
                </button>
              </div>
            )}

            {step === "sent" && (
              <div className="rounded-xl bg-teal-50 p-4 text-center">
                <p className="text-[13px] font-semibold text-teal-700">Link enviado!</p>
                <p className="mt-1 text-[12px] text-teal-600">
                  Verifique seu e-mail e clique no link para entrar. Você pode fechar esta janela.
                </p>
              </div>
            )}

            <div className="rounded-xl bg-navy-50 p-3">
              <p className="text-[11px] text-navy-500 leading-relaxed">
                <span className="font-medium text-navy-600">Modo local ativo.</span>{" "}
                {mode === "loading"
                  ? "Verificando sessão…"
                  : "Seus dados estão salvos neste dispositivo e funcionam sem internet."}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
