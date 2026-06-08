"use client";

import { Component, ReactNode } from "react";

type Props = {
  children: ReactNode;
  tabName?: string;
};
type State = { hasError: boolean };

export default class TabErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch() {
    // Silencioso — não envia PII para telemetria
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-16">
        <div className="w-full max-w-[340px] rounded-2xl border border-navy-100/80 bg-white/[0.88] px-5 py-6 shadow-card text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-navy-300">
            {this.props.tabName ?? "Seção"}
          </p>
          <p className="mt-2 text-[15px] font-semibold text-navy-800">
            Não foi possível carregar.
          </p>
          <p className="mt-1.5 text-[12px] leading-relaxed text-navy-500">
            Dados locais preservados. Tente recarregar a página ou exporte um backup.
          </p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false })}
            className="mt-4 rounded-full bg-navy-700 px-5 py-2.5 text-[12px] font-semibold text-cream-50 hover:bg-navy-800 active:scale-[0.98] transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }
}
