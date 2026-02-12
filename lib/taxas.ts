/**
 * Tabela de taxas no modelo RIFA 321:
 * Não cobramos comissão na venda dos títulos. Todo o valor arrecadado vai para sua conta.
 * Cobramos apenas uma taxa fixa conforme a faixa de arrecadação.
 */
export const FAIXAS_TAXA: { ate: number; taxa: number }[] = [
  { ate: 100, taxa: 7 },
  { ate: 250, taxa: 17 },
  { ate: 450, taxa: 27 },
  { ate: 750, taxa: 37 },
  { ate: 1000, taxa: 47 },
  { ate: 2000, taxa: 67 },
  { ate: 4000, taxa: 77 },
  { ate: 7000, taxa: 97 },
  { ate: 10000, taxa: 147 },
  { ate: 15000, taxa: 197 },
  { ate: 20000, taxa: 247 },
  { ate: 30000, taxa: 347 },
  { ate: 50000, taxa: 697 },
  { ate: 70000, taxa: 797 },
  { ate: 100000, taxa: 997 },
  { ate: Infinity, taxa: 1497 },
];

/**
 * Retorna a taxa em R$ para uma arrecadação dada.
 * Usa a primeira faixa cujo limite (ate) seja >= arrecadacao.
 */
export function calcularTaxaPorFaixas(arrecadacao: number): number {
  if (arrecadacao <= 0) return 0;
  const faixa = FAIXAS_TAXA.find((f) => arrecadacao <= f.ate);
  return faixa ? faixa.taxa : FAIXAS_TAXA[FAIXAS_TAXA.length - 1].taxa;
}

export function formatarMoeda(valor: number): string {
  return valor.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
