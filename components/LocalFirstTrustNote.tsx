import AlertBox from "@/components/ui/AlertBox";

type Props = {
  compact?: boolean;
};

export default function LocalFirstTrustNote({ compact = false }: Props) {
  return (
    <AlertBox
      tone="info"
      title="Dados locais sob seu controle"
      description={
        compact
          ? "Seus dados ficam neste dispositivo. O backup JSON pode conter informações sensíveis do condomínio; guarde-o com cuidado."
          : "Seus dados ficam neste dispositivo, a menos que você ative recursos de conta ou backup em nuvem. O arquivo de backup pode conter informações sensíveis do condomínio; guarde-o com cuidado."
      }
    />
  );
}
