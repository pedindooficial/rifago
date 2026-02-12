/** Promoção estruturada: quantidade de cotas + valor total */
export interface PromocaoItem {
  quantidade: number;
  valorTotal: number;
}

export function parsePromocaoFromString(s: string | undefined): PromocaoItem[] {
  if (!s?.trim()) return [];
  try {
    const parsed = JSON.parse(s) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x): x is PromocaoItem =>
        typeof x === "object" &&
        x !== null &&
        typeof (x as PromocaoItem).quantidade === "number" &&
        typeof (x as PromocaoItem).valorTotal === "number"
    );
  } catch {
    return [];
  }
}

export function serializePromocao(items: PromocaoItem[]): string {
  if (items.length === 0) return "";
  return JSON.stringify(items);
}

/**
 * Retorna o valor total a cobrar.
 * Regra: se a quantidade for >= à quantidade de alguma promoção, aplica o preço unitário
 * dessa promoção em todas as cotas (ex.: promo "10 por R$ 13,50" → 100 cotas = 100 × 1,35 = R$ 135).
 * Se houver várias promos que se aplicam, usa a que dá o menor total (melhor para o comprador).
 */
export function valorTotalComPromocao(
  promocoes: PromocaoItem[],
  quantidade: number,
  valorUnitario: number
): number {
  let menorTotal = valorUnitario * quantidade;
  for (const p of promocoes) {
    if (p.quantidade <= 0) continue;
    if (quantidade >= p.quantidade) {
      const precoUnitarioPromo = p.valorTotal / p.quantidade;
      const totalComEstaPromo = quantidade * precoUnitarioPromo;
      if (totalComEstaPromo < menorTotal) menorTotal = totalComEstaPromo;
    }
  }
  return Number(menorTotal.toFixed(2));
}
