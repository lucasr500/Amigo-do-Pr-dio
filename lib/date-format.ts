export function formatDateSafe(
  value: string | undefined | null,
  options?: Intl.DateTimeFormatOptions,
  fallback = "Data não informada",
): string {
  if (!value) return fallback;

  const trimmed = value.trim();
  if (!trimmed) return fallback;

  const date = /^\d{4}-\d{2}-\d{2}$/.test(trimmed)
    ? new Date(`${trimmed}T12:00:00`)
    : new Date(trimmed);

  if (Number.isNaN(date.getTime())) return fallback;
  return date.toLocaleDateString("pt-BR", options);
}
