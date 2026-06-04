import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Política de Privacidade — Amigo do Prédio",
  description: "Política de privacidade do aplicativo Amigo do Prédio.",
  robots: { index: false },
};

export default function PrivacidadePage() {
  return (
    <div className="min-h-screen bg-[#F7F1E8]">
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
        <div className="space-y-6 text-navy-700">

          <div>
            <h1 className="font-display text-[22px] font-semibold leading-snug text-navy-800">
              Política de Privacidade
            </h1>
            <p className="mt-1 text-[12px] text-navy-400">
              Última atualização: 03/06/2026 · Elaborada em conformidade com a LGPD (Lei 13.709/2018)
            </p>
          </div>

          {/* Seção 1 */}
          <section>
            <h2 className="mb-2 text-[14px] font-semibold text-navy-800">1. Identificação do Responsável</h2>
            <p className="text-[13.5px] leading-relaxed text-navy-600">
              Serviço <strong>Amigo do Prédio</strong>.
            </p>
            <p className="mt-2 text-[13px] leading-relaxed text-navy-500">
              E-mail de contato:{" "}
              <a href="mailto:oamigodopredio@gmail.com" className="font-medium text-navy-700 underline underline-offset-2">
                oamigodopredio@gmail.com
              </a>
            </p>
          </section>

          {/* Seção 2 */}
          <section>
            <h2 className="mb-2 text-[14px] font-semibold text-navy-800">2. Dados Coletados e Finalidade</h2>

            <p className="mb-2 text-[13px] font-medium text-navy-700">2.1 Dados armazenados localmente (no dispositivo do usuário)</p>
            <p className="mb-3 text-[13px] leading-relaxed text-navy-600">
              Por padrão, os dados abaixo ficam armazenados <strong>apenas no dispositivo do usuário</strong> (localStorage do navegador). O responsável pelo serviço não tem acesso a essas informações.
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
                  <tr><td className="px-3 py-2">Características do prédio (elevador, tipo de síndico)</td><td className="px-3 py-2">Personalização da interface</td></tr>
                  <tr><td className="px-3 py-2">Datas operacionais (AVCB, seguro, mandato, manutenções)</td><td className="px-3 py-2">Alertas e monitoramento de prazos</td></tr>
                  <tr><td className="px-3 py-2">Histórico de perguntas ao Assistente</td><td className="px-3 py-2">Histórico pessoal no dispositivo</td></tr>
                  <tr><td className="px-3 py-2">Favoritos salvos</td><td className="px-3 py-2">Acesso rápido a respostas</td></tr>
                  <tr><td className="px-3 py-2">Progresso de checklists</td><td className="px-3 py-2">Acompanhamento de tarefas</td></tr>
                  <tr><td className="px-3 py-2">Pendências e ocorrências registradas</td><td className="px-3 py-2">Gestão operacional do condomínio</td></tr>
                  <tr><td className="px-3 py-2">Eventos da agenda do condomínio</td><td className="px-3 py-2">Calendário e compromissos</td></tr>
                </tbody>
              </table>
            </div>

            <p className="mt-4 mb-2 text-[13px] font-medium text-navy-700">2.2 Backup opcional em nuvem</p>
            <p className="mb-2 text-[13px] leading-relaxed text-navy-600">
              O usuário pode criar uma conta (via e-mail com link mágico) para ativar o backup dos dados na nuvem. Quando ativo, o conjunto de dados operacionais do condomínio é armazenado de forma segura no Supabase, sob a conta do próprio usuário, com acesso restrito via RLS (Row Level Security).
            </p>
            <div className="rounded-lg border border-navy-100 bg-navy-50/50 px-3 py-2.5">
              <p className="text-[12px] leading-relaxed text-navy-600">
                <strong>Backup local:</strong> sem conta, os dados ficam apenas no dispositivo. Limpar o navegador, trocar de aparelho ou usar modo privado pode apagar os dados permanentemente se não houver backup. O backup é responsabilidade do usuário, via "Exportar dados" no app.
              </p>
            </div>

            <p className="mt-4 mb-2 text-[13px] font-medium text-navy-700">2.3 Telemetria de uso (quando ativa)</p>
            <p className="mb-2 text-[13px] leading-relaxed text-navy-600">
              A telemetria, quando ativa, registra <strong>eventos técnicos de uso</strong> para ajudar a melhorar o produto. Exemplos: abertura de telas, cliques em botões e uso de ferramentas.
            </p>
            <p className="text-[12px] text-navy-500">
              A telemetria <strong>não inclui</strong>: nome do condomínio, perguntas completas digitadas, dados de moradores, CPF, valores financeiros ou qualquer informação sensível. São coletados apenas metadados técnicos anônimos: categoria do tema, se houve resposta ou fallback, duração da sessão e identificador técnico de sessão — sem vínculo com nome, e-mail ou CPF.
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
                    <td className="px-3 py-2">Backup em nuvem (opcional)</td>
                    <td className="px-3 py-2">Consentimento do usuário (opt-in ao criar conta)</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2">Telemetria de uso</td>
                    <td className="px-3 py-2">Legítimo interesse do responsável (melhoria do serviço, art. 7º, IX, LGPD)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Seção 4 */}
          <section>
            <h2 className="mb-2 text-[14px] font-semibold text-navy-800">4. Compartilhamento de Dados</h2>
            <p className="text-[13.5px] leading-relaxed text-navy-600">
              Os dados de telemetria e os backups em nuvem são armazenados no Supabase (plataforma com servidores nos EUA). O Amigo do Prédio <strong>não vende, aluga ou compartilha dados com terceiros para fins de marketing</strong>.
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
                    <td className="px-3 py-2">Enquanto o usuário não limpar o navegador ou usar "Apagar dados" no app</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2">Backup em nuvem (conta)</td>
                    <td className="px-3 py-2">Enquanto a conta estiver ativa; pode ser excluído pelo usuário</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2">Dados de telemetria (Supabase)</td>
                    <td className="px-3 py-2">Até 12 meses, podendo ser anonimizados ou excluídos antes</td>
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
              <li>• <strong>Acesso:</strong> saber quais dados técnicos foram coletados;</li>
              <li>• <strong>Exclusão:</strong> solicitar a eliminação dos dados de telemetria ou do backup em nuvem;</li>
              <li>• <strong>Portabilidade:</strong> exportar os dados locais do condomínio via "Exportar backup" no app;</li>
              <li>• <strong>Revogação:</strong> parar de usar o app — os dados locais permanecem no dispositivo até limpeza manual.</li>
            </ul>
            <p className="mt-2 text-[13px] text-navy-500">
              Para exercer esses direitos:{" "}
              <a href="mailto:oamigodopredio@gmail.com" className="font-medium text-navy-700 underline underline-offset-2">
                oamigodopredio@gmail.com
              </a>
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
                  <tr><td className="px-3 py-2">Dados locais</td><td className="px-3 py-2">Protegidos pela segurança do próprio dispositivo e navegador</td></tr>
                  <tr><td className="px-3 py-2">Backup em nuvem</td><td className="px-3 py-2">Transmitido via HTTPS; armazenado com Row Level Security (RLS) no Supabase — cada usuário acessa apenas seus próprios dados</td></tr>
                  <tr><td className="px-3 py-2">Telemetria</td><td className="px-3 py-2">Transmitida via HTTPS; armazenada com RLS no Supabase</td></tr>
                  <tr><td className="px-3 py-2">Dados sensíveis</td><td className="px-3 py-2">Não coletados — por design, o app não possui campo para CPF, nome de moradores ou valores financeiros individuais</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Seção 8 */}
          <section>
            <h2 className="mb-2 text-[14px] font-semibold text-navy-800">8. Cookies e Rastreamento</h2>
            <p className="text-[13.5px] leading-relaxed text-navy-600">
              O Amigo do Prédio <strong>não usa cookies de rastreamento</strong>. O armazenamento local (localStorage) é utilizado exclusivamente para os dados operacionais do próprio usuário.
            </p>
          </section>

          {/* Seção 9 */}
          <section>
            <h2 className="mb-2 text-[14px] font-semibold text-navy-800">9. Usuários Menores</h2>
            <p className="text-[13.5px] leading-relaxed text-navy-600">
              O Amigo do Prédio é destinado a síndicos e profissionais do setor condominial, com idade mínima de 18 anos.
            </p>
          </section>

          {/* Seção 10 */}
          <section>
            <h2 className="mb-2 text-[14px] font-semibold text-navy-800">10. Alterações nesta Política</h2>
            <p className="text-[13.5px] leading-relaxed text-navy-600">
              Esta política pode ser atualizada a qualquer momento. Alterações serão comunicadas pelo e-mail de contato ou por aviso dentro do aplicativo.
            </p>
          </section>

          {/* Seção 11 */}
          <section>
            <h2 className="mb-2 text-[14px] font-semibold text-navy-800">11. Contato para Dúvidas de Privacidade</h2>
            <p className="text-[13.5px] leading-relaxed text-navy-600">
              Para dúvidas sobre privacidade ou exercício de direitos previstos na LGPD:{" "}
              <a href="mailto:oamigodopredio@gmail.com" className="font-medium text-navy-700 underline underline-offset-2">
                oamigodopredio@gmail.com
              </a>
            </p>
          </section>

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
