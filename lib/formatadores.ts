/**
 * Exibe número da cota sem zero à esquerda (ex.: 7994 em vez de 07994).
 * Útil para exibição em telas e para filtros/busca.
 */
export function formatarNumeroCota(num: string | number): string {
  const s = String(num).trim();
  if (s === "") return "";
  const n = parseInt(s, 10);
  return Number.isNaN(n) ? s : String(n);
}
