/** Quando o sorteio será realizado */
export type TipoRealizacaoSorteio =
  | "venda_total"       // Assim que vender todas as cotas
  | "data_encerramento" // Na data de encerramento da campanha
  | "data_especifica";  // Em uma data específica

export interface Campanha {
  id: string;
  nome: string;
  descricao?: string;
  /** URL ou base64 da imagem da campanha */
  imagemUrl?: string;
  tipoSorteio: string;
  quantidadeTitulos: number;
  valorPorTitulo?: number;
  arrecadacaoEstimada: number;
  taxa: number;
  dataInicio?: string;
  dataFim?: string;
  tipoRealizacaoSorteio?: TipoRealizacaoSorteio;
  dataSorteio?: string;
  /** Minutos para o PIX expirar (ex: 15, 30, 60) */
  minutosPixExpirar?: number;
  /** Mercado Pago habilitado para esta campanha */
  mercadoPagoHabilitado?: boolean;
  /** Chave pública do Mercado Pago (para frontend) */
  mercadoPagoPublicKey?: string;
  /** Regulamento/descrição da campanha (Configurações) */
  regulamento?: string;
  /** Prazo para reserva expirar (minutos) */
  prazoReservaExpirar?: number;
  /** Quantidade mínima de títulos para reserva */
  quantidadeMinimaReserva?: number;
  /** Quantidade máxima de títulos para reserva */
  quantidadeMaximaReserva?: number;
  /** Modo de títulos: aleatórios (sistema sorteia) ou expostos (participante escolhe) */
  modoTitulos?: "aleatorios" | "expostos";
  /** Exibir progresso da campanha para participantes */
  progressoVisivel?: boolean;
  /** Exibir ranking de compradores para participantes na página pública */
  rankingVisivel?: boolean;
  /** Descrição dos prêmios da campanha */
  premios?: string;
  /** Descrição da promoção (ex.: desconto, bônus) */
  promocao?: string;
  status: "rascunho" | "ativa" | "finalizada";
  createdAt: string;
  /** Títulos já vendidos (compras pagas ou simuladas). Preenchido pela API ao obter campanha. */
  titulosVendidos?: number;
  /** Títulos reservados/pendentes (compras com pagamento pendente). Preenchido pela API pública. */
  titulosPendentes?: number;
  /** Valor total arrecadado (compras pagas ou simuladas). Preenchido pela API ao obter campanha. */
  valorArrecadado?: number;
  /** Redes sociais do organizador (URLs). Preenchido pela API ao obter campanha pública. */
  redesSociais?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    whatsapp?: string;
    whatsappGrupo?: string;
    youtube?: string;
    tiktok?: string;
    linkedin?: string;
  };
  /** Branding do organizador para a página pública */
  brandingLogoUrl?: string;
  brandingFaviconUrl?: string;
  brandingSiteTitle?: string;
}

export interface CriarCampanhaData {
  nome: string;
  descricao?: string;
  imagemUrl?: string;
  tipoSorteio: string;
  quantidadeTitulos: number;
  valorPorTitulo: number;
  arrecadacaoEstimada: number;
  taxa: number;
  dataInicio?: string;
  dataFim?: string;
  tipoRealizacaoSorteio?: TipoRealizacaoSorteio;
  dataSorteio?: string;
  minutosPixExpirar?: number;
  mercadoPagoHabilitado?: boolean;
  mercadoPagoPublicKey?: string;
  regulamento?: string;
  prazoReservaExpirar?: number;
  quantidadeMinimaReserva?: number;
  quantidadeMaximaReserva?: number;
  modoTitulos?: "aleatorios" | "expostos";
  progressoVisivel?: boolean;
  premios?: string;
  promocao?: string;
}

export async function criarCampanha(
  data: CriarCampanhaData
): Promise<Campanha> {
  const response = await fetch("/api/campanhas", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Erro ao criar campanha");
  }

  return response.json();
}

export async function listarCampanhas(): Promise<Campanha[]> {
  const response = await fetch("/api/campanhas");

  if (!response.ok) {
    throw new Error("Erro ao listar campanhas");
  }

  return response.json();
}

export async function obterCampanha(id: string): Promise<Campanha> {
  const response = await fetch(`/api/campanhas/${id}`);

  if (!response.ok) {
    throw new Error("Erro ao obter campanha");
  }

  return response.json();
}

export async function atualizarCampanha(
  id: string,
  data: Partial<CriarCampanhaData>
): Promise<Campanha> {
  const response = await fetch(`/api/campanhas/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Erro ao atualizar campanha");
  }

  return response.json();
}

export async function deletarCampanha(id: string): Promise<void> {
  const response = await fetch(`/api/campanhas/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Erro ao deletar campanha");
  }
}

/** Ativa a campanha (após pagamento da taxa). */
export async function publicarCampanha(id: string): Promise<Campanha> {
  const response = await fetch(`/api/campanhas/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "ativa" }),
  });
  if (!response.ok) {
    throw new Error("Erro ao publicar campanha");
  }
  return response.json();
}

/** Obtém campanha pública por ID (apenas campanhas ativas, sem auth). Use para o link real /rifa/[id]. */
export async function obterCampanhaPublica(id: string): Promise<Campanha> {
  const response = await fetch(`/api/campanhas/public/${id}`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error("Campanha não encontrada ou não está ativa");
  }
  return response.json();
}
