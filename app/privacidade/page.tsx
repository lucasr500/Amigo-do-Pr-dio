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

        {/* Banner versão */}
        <div className="mb-6 rounded-xl border border-navy-200 bg-navy-50 px-4 py-3">
          <p className="text-[12.5px] font-semibold text-navy-700">Política de Privacidade — Versão 1.0</p>
          <p className="mt-1 text-[11.5px] leading-relaxed text-navy-500">
            Este documento está em vigor para a versão 1.0 do Amigo do Prédio, elaborado em conformidade com a LGPD (Lei 13.709/2018). Recomenda-se consulta a profissional jurídico especializado para dúvidas específicas ao seu caso.
          </p>
        </div>

        <div className="space-y-6 text-navy-700">

          <div>
            <h1 className="font-display text-[22px] font-semibold leading-snug text-navy-800">
              Política de Privacidade
            </h1>
            <p className="mt-1 text-[12px] text-navy-400">
              Última atualização: 25/05/2026
            </p>
          </div>

          {/* Seção 1 */}
          <section>
            <h2 className="mb-2 text-[14px] font-semibold text-navy-800">1. Identificação do Responsável</h2>
            <p className="text-[13.5px] leading-relaxed text-navy-600">
              <strong>Amigo do Prédio</strong>, produto digital independente, ainda sem pessoa jurídica específica constituída.
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
              Os dados abaixo ficam armazenados <strong>apenas no dispositivo do usuário</strong> (localStorage do navegador). Eles nunca são enviados para servidores externos. O responsável pelo projeto não tem acesso a essas informações.
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

            <div className="mt-3 rounded-lg border border-navy-100 bg-navy-50/50 px-3 py-2.5">
              <p className="text-[12px] leading-relaxed text-navy-600">
                <strong>Importante:</strong> não há conta, login ou sincronização em nuvem na versão atual. Os dados estão vinculados ao navegador e aparelho utilizados. Limpar o navegador, trocar de dispositivo ou usar modo privado pode apagar os dados permanentemente se não houver backup. O backup é de responsabilidade do usuário, via "Exportar dados" no app.
              </p>
            </div>

            <p className="mt-4 mb-2 text-[13px] font-medium text-navy-700">2.2 Telemetria de uso (quando ativa)</p>
            <p className="mb-2 text-[13px] leading-relaxed text-navy-600">
              A telemetria, quando ativa, registra <strong>eventos técnicos de uso</strong> para ajudar a melhorar o produto. Exemplos de eventos coletados: abertura de telas, cliques em botões, uso de ferramentas e ocorrência de erros técnicos.
            </p>
            <p className="mb-2 text-[13px] leading-relaxed text-navy-600">
              A telemetria <strong>não inclui</strong>: o nome do condomínio, perguntas completas digitadas pelo usuário, dados de moradores, CPF, unidade, conteúdo de pendências, valores financeiros ou qualquer informação sensível do condomínio.
            </p>
            <p className="text-[12px] text-navy-500">
              São coletados apenas metadados técnicos: categoria do tema identificado, se houve resposta ou fallback, duração da sessão em segundos e identificador técnico anônimo de sessão — sem vínculo com nome, e-mail ou CPF do usuário.
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
              Os dados de telemetria, quando coletados, são armazenados no Supabase (plataforma com servidores nos EUA). O Amigo do Prédio <strong>não vende, aluga ou compartilha dados com terceiros para fins de marketing</strong>.
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
                    <td className="px-3 py-2">Dados de telemetria (Supabase)</td>
                    <td className="px-3 py-2">Até 12 meses, podendo ser anonimizados ou excluídos antes desse prazo</td>
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
              <li>• <strong>Exclusão:</strong> solicitar a eliminação dos dados de telemetria;</li>
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
                  <tr><td className="px-3 py-2">Telemetria</td><td className="px-3 py-2">Transmitida via HTTPS; armazenada com Row Level Security (RLS) no Supabase</td></tr>
                  <tr><td className="px-3 py-2">Painel admin</td><td className="px-3 py-2">Protegido por senha configurada pelo responsável pelo projeto</td></tr>
                  <tr><td className="px-3 py-2">Dados sensíveis</td><td className="px-3 py-2">Não coletados — por design, o app não possui campo para CPF, nome de moradores ou valores financeiros individuais</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Seção 8 */}
          <section>
            <h2 className="mb-2 text-[14px] font-semibold text-navy-800">8. Cookies e Rastreamento</h2>
            <p className="text-[13.5px] leading-relaxed text-navy-600">
              O Amigo do Prédio <strong>não usa cookies de rastreamento</strong>. O armazenamento local (localStorage) é utilizado exclusivamente para os dados do próprio usuário listados na seção 2.1.
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
              Esta política pode ser atualizada a qualquer momento. Alterações serão comunicadas pelo e-mail de contato do projeto ou por aviso dentro do aplicativo.
            </p>
          </section>

          {/* Seção 11 */}
          <section>
            <h2 className="mb-2 text-[14px] font-semibold text-navy-800">11. Encarregado de Dados (DPO)</h2>
            <p className="text-[13.5px] leading-relaxed text-navy-600">
              O canal de contato para dúvidas sobre privacidade é o e-mail{" "}
              <a href="mailto:oamigodopredio@gmail.com" className="font-medium text-navy-700 underline underline-offset-2">
                oamigodopredio@gmail.com
              </a>. A eventual necessidade de encarregado formal de dados será reavaliada conforme a evolução do projeto e orientação jurídica especializada.
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
