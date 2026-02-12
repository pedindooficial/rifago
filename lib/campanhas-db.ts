import type { Campanha, CriarCampanhaData } from "@/lib/api";
import type { ICampanha } from "@/lib/models/Campanha";

/** Converte documento do MongoDB para o formato da API (id string, createdAt string) */
export function docToCampanha(doc: ICampanha | null): Campanha | null {
  if (!doc) return null;
  const d = doc as ICampanha & { createdAt: Date };
  return {
    id: d._id.toString(),
    nome: d.nome,
    descricao: d.descricao,
    imagemUrl: d.imagemUrl,
    tipoSorteio: d.tipoSorteio,
    quantidadeTitulos: d.quantidadeTitulos,
    valorPorTitulo: d.valorPorTitulo,
    arrecadacaoEstimada: d.arrecadacaoEstimada,
    taxa: d.taxa,
    dataInicio: d.dataInicio,
    dataFim: d.dataFim,
    tipoRealizacaoSorteio: d.tipoRealizacaoSorteio,
    dataSorteio: d.dataSorteio,
    minutosPixExpirar: d.minutosPixExpirar,
    mercadoPagoHabilitado: d.mercadoPagoHabilitado,
    mercadoPagoPublicKey: d.mercadoPagoPublicKey,
    regulamento: d.regulamento,
    prazoReservaExpirar: d.prazoReservaExpirar,
    quantidadeMinimaReserva: d.quantidadeMinimaReserva,
    quantidadeMaximaReserva: d.quantidadeMaximaReserva,
    modoTitulos: d.modoTitulos,
    progressoVisivel: d.progressoVisivel,
    rankingVisivel: d.rankingVisivel,
    premios: d.premios,
    promocao: d.promocao,
    status: d.status,
    createdAt: d.createdAt instanceof Date ? d.createdAt.toISOString() : (d.createdAt as string),
  } as Campanha;
}
