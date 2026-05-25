import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Termos de Uso — Amigo do Prédio",
  description: "Termos de uso do aplicativo Amigo do Prédio.",
  robots: { index: false },
};

function Placeholder({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded bg-amber-100 px-1 font-medium text-amber-700">
      {children}
    </span>
  );
}

export default function TermosPage() {
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
            Este documento está em rascunho e aguarda revisão jurídica e preenchimento dos campos marcados em destaque antes de ser publicado como versão definitiva. Não tem valor jurídico como publicado.
          </p>
        </div>

        {/* Campos faltantes */}
        <div className="mb-6 rounded-xl border border-navy-100 bg-white px-4 py-3">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-navy-500">Campos que o fundador precisa preencher</p>
          <ul className="space-y-1 text-[12px] text-navy-600">
            <li>• Data de última atualização</li>
            <li>• E-mail de contato (Seção 9)</li>
          </ul>
        </div>

        <div className="space-y-6 text-navy-700">

          <div>
            <h1 className="font-display text-[22px] font-semibold leading-snug text-navy-800">
              Termos de Uso
            </h1>
            <p className="mt-1 text-[12px] text-navy-400">
              Última atualização: <Placeholder>[data a preencher]</Placeholder>
            </p>
          </div>

          {/* Seção 1 */}
          <section>
            <h2 className="mb-2 text-[14px] font-semibold text-navy-800">1. Sobre o Serviço</h2>
            <p className="text-[13.5px] leading-relaxed text-navy-600">
              O <strong>Amigo do Prédio</strong> é um aplicativo web de orientação condominial desenvolvido para auxiliar síndicos na gestão do dia a dia do condomínio. O serviço oferece:
            </p>
            <ul className="mt-2 space-y-1 pl-4 text-[13px] leading-relaxed text-navy-600">
              <li>• Assistente de perguntas e respostas sobre legislação condominial (Lei 4.591/64, Lei 10.406/02 — Código Civil, e normas relacionadas);</li>
              <li>• Ferramentas de gestão: gerador de comunicados, simulador de multas e juros, checklists operacionais;</li>
              <li>• Monitoramento de datas operacionais críticas (vencimentos, assembleias, manutenções).</li>
            </ul>
          </section>

          {/* Seção 2 */}
          <section>
            <h2 className="mb-2 text-[14px] font-semibold text-navy-800">2. Natureza Informativa — Não é Assessoria Jurídica</h2>
            <p className="text-[13.5px] leading-relaxed text-navy-600">
              As orientações fornecidas pelo Amigo do Prédio têm <strong>caráter exclusivamente informativo e educativo</strong>. O serviço:
            </p>
            <ul className="mt-2 space-y-1.5 pl-4 text-[13px] leading-relaxed text-navy-600">
              <li>• <strong>Não substitui</strong> a assessoria de advogado, administradora de condomínios, contador ou outros profissionais especializados;</li>
              <li>• <strong>Não garante</strong> a precisão, completude ou atualização das informações diante de alterações legislativas;</li>
              <li>• <strong>Não é responsável</strong> por decisões tomadas com base nas orientações fornecidas;</li>
              <li>• <strong>Não representa</strong> aconselhamento jurídico, contábil ou trabalhista específico ao caso concreto.</li>
            </ul>
            <p className="mt-3 text-[13px] leading-relaxed text-navy-500">
              Situações que envolvam conflitos, litígios, demissões de funcionários, cobranças judiciais ou interpretação de cláusulas específicas da convenção condominial devem ser submetidas a profissional habilitado.
            </p>
          </section>

          {/* Seção 3 */}
          <section>
            <h2 className="mb-2 text-[14px] font-semibold text-navy-800">3. Simulações Financeiras</h2>
            <p className="text-[13.5px] leading-relaxed text-navy-600">
              O simulador de multas e juros do Amigo do Prédio fornece <strong>estimativas</strong> baseadas nas taxas informadas pelo usuário. Os valores calculados:
            </p>
            <ul className="mt-2 space-y-1 pl-4 text-[13px] leading-relaxed text-navy-600">
              <li>• São estimativas para fins de planejamento;</li>
              <li>• Não consideram particularidades da convenção do condomínio;</li>
              <li>• Não substituem o cálculo da administradora ou de profissional contábil;</li>
              <li>• Podem diferir dos valores devidos em cenários reais.</li>
            </ul>
          </section>

          {/* Seção 4 */}
          <section>
            <h2 className="mb-2 text-[14px] font-semibold text-navy-800">4. Informações Trabalhistas — Limitação Regional</h2>
            <p className="text-[13.5px] leading-relaxed text-navy-600">
              Parte das orientações trabalhistas é baseada na <strong>Convenção Coletiva de Trabalho (CCT) SECOVI-Rio</strong> (Rio de Janeiro). Síndicos em outros estados devem consultar a CCT aplicável à sua localidade, pois salários mínimos, benefícios e condições de trabalho variam por região e convenção sindical.
            </p>
          </section>

          {/* Seção 5 */}
          <section>
            <h2 className="mb-2 text-[14px] font-semibold text-navy-800">5. Uso Aceito</h2>
            <p className="text-[13.5px] leading-relaxed text-navy-600">
              O Amigo do Prédio é destinado a síndicos profissionais e voluntários, membros de conselhos fiscais e consultivos, administradoras de condomínios e profissionais do setor condominial.
            </p>
            <p className="mt-2 text-[13px] leading-relaxed text-navy-500">
              É vedado o uso para fins ilegais, para induzir moradores ou funcionários a erro, ou para contornar direitos trabalhistas de funcionários do condomínio.
            </p>
          </section>

          {/* Seção 6 */}
          <section>
            <h2 className="mb-2 text-[14px] font-semibold text-navy-800">6. Disponibilidade</h2>
            <p className="text-[13.5px] leading-relaxed text-navy-600">
              O serviço é oferecido em regime de "melhor esforço" (best effort). Podem ocorrer interrupções para manutenção, atualizações ou por motivos técnicos. O Amigo do Prédio não se responsabiliza por prejuízos decorrentes de indisponibilidade temporária.
            </p>
          </section>

          {/* Seção 7 */}
          <section>
            <h2 className="mb-2 text-[14px] font-semibold text-navy-800">7. Propriedade Intelectual</h2>
            <p className="text-[13.5px] leading-relaxed text-navy-600">
              O conteúdo do Amigo do Prédio — incluindo textos de orientação, design, código e estrutura — é de propriedade do desenvolvedor. A legislação condominial citada é de domínio público.
            </p>
          </section>

          {/* Seção 8 */}
          <section>
            <h2 className="mb-2 text-[14px] font-semibold text-navy-800">8. Alterações nos Termos</h2>
            <p className="text-[13.5px] leading-relaxed text-navy-600">
              Estes termos podem ser atualizados. Alterações significativas serão comunicadas aos usuários da beta antes de publicação pública.
            </p>
          </section>

          {/* Seção 9 */}
          <section>
            <h2 className="mb-2 text-[14px] font-semibold text-navy-800">9. Contato</h2>
            <p className="text-[13.5px] leading-relaxed text-navy-600">
              Para dúvidas sobre estes termos:{" "}
              <Placeholder>[e-mail de contato a definir]</Placeholder>
            </p>
          </section>

          {/* Links */}
          <div className="border-t border-navy-100 pt-4">
            <Link
              href="/privacidade"
              className="text-[12.5px] text-navy-500 underline underline-offset-2 transition-colors hover:text-navy-700"
            >
              Política de Privacidade
            </Link>
          </div>

        </div>
      </main>
    </div>
  );
}
