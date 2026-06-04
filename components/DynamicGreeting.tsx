"use client";

function buildGreeting(condoName?: string): string {
  const h = new Date().getHours();
  const day = new Date().getDay();
  const condo = condoName ? ` — ${condoName}` : "";

  if (day === 5 && h >= 14 && h < 22) return `Boa sexta-feira, síndico${condo}`;
  if (h >= 5 && h < 12) return `Bom dia, síndico${condo}`;
  if (h >= 12 && h < 18) return `Boa tarde, síndico${condo}`;
  return `Boa noite, síndico${condo}`;
}

export default function DynamicGreeting({ condoName }: { condoName: string }) {
  const greeting = buildGreeting(condoName || undefined);
  return (
    <div className="px-5 pb-2 pt-1 sm:px-6">
      <p className="text-[15px] font-semibold leading-snug text-navy-800">{greeting}</p>
    </div>
  );
}
