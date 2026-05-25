import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Política de Privacidade — Amigo do Prédio",
  description: "Política de privacidade do aplicativo Amigo do Prédio.",
  robots: { index: false },
};

function Placeholder({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded bg-amber-100 px-1 font-medium text-amber-700">
      {children}
    </span>
  );
}

export default function PrivacidadePage() {
  return (
    <div className="min-h-screen bg-[#F7F1E8]">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-navy-100/60 bg-[#F7F1E8]/90 px-5 py-3 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[640px] items-center justify-between">
          <span className="font-display text-[15px] font-semibold text-navy-800">Amigo do Prédio</span>
          <Link
            href="/"
            className="rounded-full border border-navy-200 px-3 py-1.5 text-[12px] font-medium text-navy-600 transition-colors hover:bg-navy-50"
          >
            ← Voltar ao app
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-[640px] px-5 py-6">

        {/* Banner de rascunho */}
        <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3">
          <p className="text-[12.5px] font-semibold text-amber-800">Versão preliminar — rascunho pré-beta</p>
          <p className="mt-1 text-[11.5px] leading-relaxed text-amber-700">
            Este documento está em rascunho e aguarda revisão jurídica e preenchimento dos campos marcados em destaque antes de ser publicado como versão definitiva. Elaborado em conformidade com os princípios da LGPD (Lei 13.709/2018). Não tem valor jurídico como publicado.
          </p>
        </div>

        {/* Campos faltantes */}
        <div className="mb-6 rounded-xl border border-navy-100 bg-white px-4 py-3">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-navy-500">Campos que o fundador precisa preencher</p>
          <ul className="space-y-1 text-[12px] text-navy-600">
            <li>• Razão social ou nome do responsável pelo serviço (Seção 1)</li>
            <li>• E-mail de contato de privacidade (Seção 1 e Seção 6)</li>
            <li>• Prazo de retenção dos dados de telemetria (Seção 5 — sugestão: 12 meses)</li>
            <li>• Nome e contato do DPO, ou declaração de não obrigatoriedade (Seção 11)</li>
            <li>• Data de última atualização</li>
          </ul>
        </div>

        <div className="space-y-6 text-navy-700">

          <div>
            <h1 className="font-display text-[22px] font-semibold leading-snug text-navy-800">
              Política de Privacidade
            </h1>
            <p className="mt-1 text-[12px] text-navy-400">
              Última atualização: <Placeholder>[data a preencher]</Placeholder>
            </p>
          </div>

          {/* Seção 1 */}
          <section>
            <h2 className="mb-2 text-[14px] font-semibold text-navy-800">1. Identificação do Controlador</h2>
            <p className="text-[13.5px] leading-relaxed text-navy-600">
              <strong>Amigo do Prédio</strong> —{" "}
              <Placeholder>[razão social / nome do responsável a definir]</Placeholder>
            </p>
            <p className="mt-1.5 text-[13px] text-navy-500">
              E-mail de privacidade: <Placeholder>[contato de privacidade a definir]</Placeholder>
            </p>
          </section>

          {/* Seção 2 */}
          <section>
            <h2 className="mb-2 text-[14px] font-semibold text-navy-800">2. Dados Coletados e Finalidade</h2>
            <p className="mb-2 text-[13px] font-medium text-navy-700">2.1 Dados armazenados localmente (no dispositivo do usuário)</p>
            <p className="mb-2 text-[13px] leading-relaxed text-navy-600">
              Os seguintes dados ficam armazenados <strong>apenas no dispositivo do usuário</strong> (localStorage do navegador), nunca são enviados para servidores externos:
            </p>
            <div className="overflow-x-auto rounded-lg border border-navy-100">
              <table className="w-full text-left text-[12px]">
                <thead>
                  <tr className="border-b border-navy-100 bg-navy-50/60">
                    <th className="px-3 py-2 font-semibold text-navy-700">Dado</th>
                    <th className="px-3 py-2 font-semibold text-navy-700">Finalidade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-50 text-navy-600">
                  <tr><td className="px-3 py-2">Nome do condomínio</td><td className="px-3 py-2">Personalização da interface</td></tr>
                  <tr><td className="px-3 py-2">Características (elevador, piscina, tipo de síndico)</td><td className="px-3 py-2">Personalização da interface</td></tr>
                  <tr><td className="px-3 py-2">Datas operacionais (vencimentos, assembleias)</td><td className="px-3 py-2">Monitoramento e alertas</td></tr>
                  <tr><td className="px-3 py-2">Histórico de perguntas ao Assistente</td><td className="px-3 py-2">Histórico pessoal</td></tr>
                  <tr><td className="px-3 py-2">Favoritos salvos</td><td className="px-3 py-2">Acesso rápido</td></tr>
                  <tr><td className="px-3 py-2">Progresso de checklists</td><td className="px-3 py-2">Rastreamento de tarefas</td></tr>
                  <tr><td className="px-3 py-2">Pendências e ocorrências registradas</td><td className="px-3 py-2">Gestão operacional</td></tr>
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-[12px] text-navy-500">
              Estes dados não saem do dispositivo. O desenvolvedor não tem acesso a eles.
            </p>

            <p className="mt-4 mb-2 text-[13px] font-medium text-navy-700">2.2 Dados de telemetria (quando configurado)</p>
            <p className="mb-2 text-[13px] leading-relaxed text-navy-600">
              O Amigo do Prédio pode coletar, de forma anônima, eventos de uso para melhoria do produto. O conteúdo textual das perguntas feitas ao Assistente <strong>não é enviado</strong>. São coletados apenas metadados técnicos: categoria do tema identificado, score de correspondência, se houve resposta ou fallback e duração da sessão em segundos.
            </p>
            <p className="text-[12px] text-navy-500">
              Nenhum texto livre digitado, nome de morador, valor financeiro ou dado operacional do condomínio é transmitido.
            </p>
          </section>

          {/* Seção 3 */}
          <section>
            <h2 className="mb-2 text-[14px] font-semibold text-navy-800">3. Base Legal (LGPD)</h2>
            <div className="overflow-x-auto rounded-lg border border-navy-100">
              <table className="w-full text-left text-[12px]">
                <thead>
                  <tr className="border-b border-navy-100 bg-navy-50/60">
                    <th className="px-3 py-2 font-semibold text-navy-700">Tratamento</th>
                    <th className="px-3 py-2 font-semibold text-navy-700">Base legal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-50 text-navy-600">
                  <tr>
                    <td className="px-3 py-2">Dados locais no dispositivo</td>
                    <td className="px-3 py-2">Legítimo interesse do usuário (dados permanecem no próprio dispositivo)</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2">Telemetria de uso</td>
                    <td className="px-3 py-2">Legítimo interesse do controlador (melhoria do serviço, art. 7º, IX, LGPD)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Seção 4 */}
          <section>
            <h2 className="mb-2 text-[14px] font-semibold text-navy-800">4. Compartilhamento de Dados</h2>
            <p className="text-[13.5px] leading-relaxed text-navy-600">
              Os dados de telemetria são armazenados no Supabase (plataforma com servidores nos EUA). O Amigo do Prédio <strong>não vende, aluga ou compartilha dados com terceiros para fins de marketing</strong>.
            </p>
          </section>

          {/* Seção 5 */}
          <section>
            <h2 className="mb-2 text-[14px] font-semibold text-navy-800">5. Retenção de Dados</h2>
            <div className="overflow-x-auto rounded-lg border border-navy-100">
              <table className="w-full text-left text-[12px]">
                <thead>
                  <tr className="border-b border-navy-100 bg-navy-50/60">
                    <th className="px-3 py-2 font-semibold text-navy-700">Dado</th>
                    <th className="px-3 py-2 font-semibold text-navy-700">Retenção</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-50 text-navy-600">
                  <tr>
                    <td className="px-3 py-2">Dados locais no dispositivo</td>
                    <td className="px-3 py-2">Enquanto o usuário não limpar o navegador ou usar a função "Apagar dados" no app</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2">Dados de telemetria (Supabase)</td>
                    <td className="px-3 py-2"><Placeholder>[prazo a definir — sugestão: 12 meses]</Placeholder></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Seção 6 */}
          <section>
            <h2 className="mb-2 text-[14px] font-semibold text-navy-800">6. Direitos do Titular (LGPD)</h2>
            <p className="mb-2 text-[13px] leading-relaxed text-navy-600">O usuário tem direito a:</p>
            <ul className="space-y-1 pl-4 text-[13px] leading-relaxed text-navy-600">
              <li>• <strong>Acesso:</strong> solicitar quais dados temos sobre você;</li>
              <li>• <strong>Correção:</strong> corrigir dados inexatos;</li>
              <li>• <strong>Exclusão:</strong> solicitar a eliminação dos dados de telemetria;</li>
              <li>• <strong>Portabilidade:</strong> exportar dados locais via função "Exportar backup" no app;</li>
              <li>• <strong>Revogação:</strong> parar de usar o app (dados locais permanecem no dispositivo até limpeza manual).</li>
            </ul>
            <p className="mt-2 text-[13px] text-navy-500">
              Para exercer esses direitos: <Placeholder>[e-mail de privacidade a definir]</Placeholder>
            </p>
          </section>

          {/* Seção 7 */}
          <section>
            <h2 className="mb-2 text-[14px] font-semibold text-navy-800">7. Segurança</h2>
            <div className="overflow-x-auto rounded-lg border border-navy-100">
              <table className="w-full text-left text-[12px]">
                <thead>
                  <tr className="border-b border-navy-100 bg-navy-50/60">
                    <th className="px-3 py-2 font-semibold text-navy-700">Medida</th>
                    <th className="px-3 py-2 font-semibold text-navy-700">Descrição</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-50 text-navy-600">
                  <tr><td className="px-3 py-2">Dados locais</td><td className="px-3 py-2">Protegidos pela segurança do próprio dispositivo/navegador</td></tr>
                  <tr><td className="px-3 py-2">Telemetria</td><td className="px-3 py-2">Transmitida via HTTPS; armazenada com Row Level Security (RLS) no Supabase</td></tr>
                  <tr><td className="px-3 py-2">Painel admin</td><td className="px-3 py-2">Protegido por senha configurada pelo operador</td></tr>
                  <tr><td className="px-3 py-2">Dados sensíveis</td><td className="px-3 py-2">Não coletados — por design, não existe campo para nome de moradores ou valores financeiros</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Seção 8 */}
          <section>
            <h2 className="mb-2 text-[14px] font-semibold text-navy-800">8. Cookies e Rastreamento</h2>
            <p className="text-[13.5px] leading-relaxed text-navy-600">
              O Amigo do Prédio <strong>não usa cookies de rastreamento</strong>. O armazenamento local (localStorage) é usado apenas para dados do próprio usuário listados na seção 2.1.
            </p>
          </section>

          {/* Seção 9 */}
          <section>
            <h2 className="mb-2 text-[14px] font-semibold text-navy-800">9. Usuários Menores</h2>
            <p className="text-[13.5px] leading-relaxed text-navy-600">
              O Amigo do Prédio é destinado a síndicos e profissionais do setor condominial. Não é destinado a menores de 18 anos.
            </p>
          </section>

          {/* Seção 10 */}
          <section>
            <h2 className="mb-2 text-[14px] font-semibold text-navy-800">10. Alterações nesta Política</h2>
            <p className="text-[13.5px] leading-relaxed text-navy-600">
              Alterações significativas serão comunicadas com no mínimo 30 dias de antecedência. A versão mais recente estará sempre disponível no aplicativo.
            </p>
          </section>

          {/* Seção 11 */}
          <section>
            <h2 className="mb-2 text-[14px] font-semibold text-navy-800">11. Encarregado de Dados (DPO)</h2>
            <p className="text-[13.5px] leading-relaxed text-navy-600">
              <Placeholder>[Nome e contato do DPO a definir — ou confirmar com advogado se DPO é obrigatório para esta operação de pequeno porte, com base no art. 41, §3º da LGPD]</Placeholder>
            </p>
          </section>

          {/* Links */}
          <div className="border-t border-navy-100 pt-4">
            <Link
              href="/termos"
              className="text-[12.5px] text-navy-500 underline underline-offset-2 transition-colors hover:text-navy-700"
            >
              Termos de Uso
            </Link>
          </div>

        </div>
      </main>
    </div>
  );
}
