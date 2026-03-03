/**
 * Normaliza número da cota SEM zero à esquerda (ex.: 7994, nunca 07994).
 * Usar ao salvar e ao retornar numeros nas APIs.
 */
export function formatarNumeroCota(num: string | number): string {
  const s = String(num).trim();
  if (s === "") return "";
  const n = parseInt(s, 10);
  return Number.isNaN(n) ? s : String(n);
}

/** Normaliza array de números de cota (remove zeros à esquerda). */
export function normalizarNumerosCotas(numeros: (string | number)[] | undefined | null): string[] {
  if (!numeros || !Array.isArray(numeros)) return [];
  return numeros.map(formatarNumeroCota).filter(Boolean);
}
