"use client";

import { Component, ReactNode } from "react";

type Props = { children: ReactNode };
type State = { hasError: boolean };

export default class AppErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch() {
    // Silencioso — erro não contém PII; não envia stack para telemetria
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="flex min-h-dvh items-center justify-center bg-cream-50 px-5">
        <div className="w-full max-w-[360px] rounded-[22px] border border-cream-200 bg-white px-6 py-7 shadow-[0_2px_16px_-4px_rgba(35,75,99,0.12)]">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-navy-400">
            Amigo do Prédio
          </p>
          <h1 className="mt-2 text-[18px] font-semibold leading-snug text-navy-900">
            Não consegui carregar o app corretamente.
          </h1>
          <p className="mt-3 text-[13.5px] leading-relaxed text-navy-500">
            Pode ter acontecido algum problema temporário ou inconsistência nos dados salvos neste dispositivo.
          </p>
          <div className="mt-5 flex flex-col gap-2.5">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-full bg-navy-700 px-5 py-3 text-[13px] font-semibold text-cream-50 transition-colors hover:bg-navy-800 active:scale-[0.98]"
            >
              Tentar novamente
            </button>
            <button
              type="button"
              onClick={() => { window.location.href = "/"; }}
              className="rounded-full border border-navy-200 px-5 py-2.5 text-[13px] font-medium text-navy-600 transition-colors hover:bg-navy-50 active:scale-[0.98]"
            >
              Voltar ao início
            </button>
          </div>
          <p className="mt-5 text-[10.5px] leading-relaxed text-navy-400">
            Se o problema persistir, use{" "}
            <span className="font-medium text-navy-500">Condomínio → Backup</span>{" "}
            para exportar seus dados antes de limpar o armazenamento do navegador.
          </p>
        </div>
      </div>
    );
  }
}
