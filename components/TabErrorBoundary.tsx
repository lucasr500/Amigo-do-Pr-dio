"use client";

import { Component, ReactNode } from "react";
import ErrorState from "@/components/ui/ErrorState";

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
        <div className="w-full max-w-[340px]">
          <ErrorState
            eyebrow={this.props.tabName ?? "Seção"}
            description="Seus dados locais estão preservados. Tente novamente ou exporte um backup pelo Condomínio."
            onRetry={() => this.setState({ hasError: false })}
          />
        </div>
      </div>
    );
  }
}
