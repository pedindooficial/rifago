"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Settings,
  Eye,
  Share2,
  ChevronDown,
  DollarSign,
  Award,
  BarChart3,
  ArrowUpDown,
  Gift,
  CircleDot,
  Dices,
  Link2,
  Send,
  X,
  MessageCircle,
  Copy,
} from "lucide-react";
import Link from "next/link";
import { obterCampanha, deletarCampanha, publicarCampanha, atualizarCampanha, Campanha } from "@/lib/api";
import { formatarMoeda } from "@/lib/taxas";

export default function GerenciarCampanha() {
  const params = useParams();
  const router = useRouter();
  const [campanha, setCampanha] = useState<Campanha | null>(null);
  const [loading, setLoading] = useState(true);
  const [detalhesAbertos, setDetalhesAbertos] = useState(false);
  const [modalPublicarAberto, setModalPublicarAberto] = useState(false);
  const [publicando, setPublicando] = useState(false);
  const [linkCopiado, setLinkCopiado] = useState(false);
  const [shareMenuAberto, setShareMenuAberto] = useState(false);
  const [copiadoTipo, setCopiadoTipo] = useState<"link" | "texto" | null>(null);
  const shareMenuRef = useRef<HTMLDivElement>(null);
  const [statusMenuAberto, setStatusMenuAberto] = useState(false);
  const statusMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickFora(e: MouseEvent) {
      if (shareMenuRef.current && !shareMenuRef.current.contains(e.target as Node)) {
        setShareMenuAberto(false);
      }
      if (statusMenuRef.current && !statusMenuRef.current.contains(e.target as Node)) {
        setStatusMenuAberto(false);
      }
    }
    if (shareMenuAberto) {
      document.addEventListener("click", handleClickFora);
      return () => document.removeEventListener("click", handleClickFora);
    }
    if (statusMenuAberto) {
      document.addEventListener("click", handleClickFora);
      return () => document.removeEventListener("click", handleClickFora);
    }
  }, [shareMenuAberto, statusMenuAberto]);

  useEffect(() => {
    async function carregarCampanha() {
      try {
        const data = await obterCampanha(params.id as string);
        setCampanha(data);
      } catch (error) {
        console.error("Erro ao carregar campanha:", error);
      } finally {
        setLoading(false);
      }
    }
    carregarCampanha();
  }, [params.id]);

  const handleDelete = async () => {
    if (!confirm("Tem certeza que deseja deletar esta campanha?")) return;
    try {
      await deletarCampanha(params.id as string);
      router.push("/campanhas");
    } catch (error) {
      console.error("Erro ao deletar campanha:", error);
      alert("Erro ao deletar campanha");
    }
  };

  const handleFinalizarPagamento = async () => {
    if (!campanha) return;
    setPublicando(true);
    try {
      const atualizada = await publicarCampanha(campanha.id);
      setCampanha(atualizada);
      setModalPublicarAberto(false);
    } catch (error) {
      console.error("Erro ao publicar campanha:", error);
      alert("Erro ao publicar campanha. Tente novamente.");
    } finally {
      setPublicando(false);
    }
  };

  const shareUrl =
    typeof window !== "undefined" ? `${window.location.origin}/rifa/${campanha?.id}` : "";
  const shareTextoPronto = campanha
    ? `🎉 Confira essa rifa: ${campanha.nome}\n\nParticipe aqui: ${shareUrl}`
    : "";

  const copiarLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setLinkCopiado(true);
      setCopiadoTipo("link");
      setTimeout(() => {
        setLinkCopiado(false);
        setCopiadoTipo(null);
      }, 2500);
      setShareMenuAberto(false);
    } catch {
      alert("Link da campanha: " + shareUrl);
    }
  };

  const copiarTextoCompartilhar = async () => {
    if (!shareTextoPronto) return;
    try {
      await navigator.clipboard.writeText(shareTextoPronto);
      setCopiadoTipo("texto");
      setTimeout(() => setCopiadoTipo(null), 2500);
      setShareMenuAberto(false);
    } catch {
      alert(shareTextoPronto);
    }
  };

  const abrirWhatsApp = () => {
    if (!shareTextoPronto) return;
    const url = `https://wa.me/?text=${encodeURIComponent(shareTextoPronto)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    setShareMenuAberto(false);
  };

  const abrirFacebook = () => {
    if (!shareUrl) return;
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      "_blank",
      "noopener,noreferrer"
    );
    setShareMenuAberto(false);
  };

  const abrirTwitter = () => {
    const text = campanha
      ? `Confira essa rifa: ${campanha.nome} ${shareUrl}`
      : shareUrl;
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
      "_blank",
      "noopener,noreferrer"
    );
    setShareMenuAberto(false);
  };

  const titulosVendidos = campanha?.titulosVendidos ?? 0;
  const titulosPendentes = campanha?.titulosPendentes ?? 0;
  const valorArrecadado = campanha?.valorArrecadado ?? 0;
  const quantidadeTotal = campanha?.quantidadeTitulos ?? 0;
  const percentualVendido =
    quantidadeTotal > 0 ? (titulosVendidos / quantidadeTotal) * 100 : 0;
  const percentualPendente =
    quantidadeTotal > 0 ? (titulosPendentes / quantidadeTotal) * 100 : 0;
  const percentualVendidoTexto =
    percentualVendido >= 1
      ? `${Math.round(percentualVendido)}`
      : percentualVendido > 0
        ? percentualVendido.toFixed(2).replace(".", ",")
        : "0";
  const percentualPendenteTexto =
    percentualPendente >= 1
      ? `${Math.round(percentualPendente)}`
      : percentualPendente > 0
        ? percentualPendente.toFixed(2).replace(".", ",")
        : "0";

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Carregando...</p>
      </div>
    );
  }

  if (!campanha) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Campanha não encontrada</p>
          <Link href="/campanhas" className="text-primary hover:underline">
            Voltar para Minhas campanhas
          </Link>
        </div>
      </div>
    );
  }

  const statusLabel =
    campanha.status === "ativa"
      ? "Ativa"
      : campanha.status === "pausada"
        ? "Pausada"
        : campanha.status === "finalizada"
          ? "Finalizada"
          : "Rascunho";

  const podePausar = campanha.status === "ativa";
  const podeRetomar = campanha.status === "pausada";

  const handleAlterarStatus = async (novoStatus: "ativa" | "pausada") => {
    if (!campanha) return;
    const mensagemConfirm =
      novoStatus === "pausada"
        ? "Pausar campanha? Participantes não poderão comprar enquanto estiver pausada."
        : "Retomar campanha como ATIVA e permitir novas compras?";
    if (!confirm(mensagemConfirm)) return;
    try {
      const atualizada = await atualizarCampanha(campanha.id, { status: novoStatus });
      setCampanha(atualizada);
      setStatusMenuAberto(false);
    } catch (error) {
      console.error("Erro ao alterar status da campanha:", error);
      alert("Não foi possível alterar o status. Tente novamente.");
    }
  };

  const base = `/campanhas/${campanha.id}`;
  const acoesCampanha = [
    { label: "Minhas vendas", icon: DollarSign, href: `${base}/vendas` },
    { label: "Título premiado", icon: Award, href: `${base}/titulo-premiado` },
    { label: "Ranking", icon: BarChart3, href: `${base}/ranking` },
    { label: "Maior e Menor título", icon: ArrowUpDown, href: `${base}/maior-menor-titulo` },
    { label: "Caixa Premiada", icon: Gift, href: `${base}/caixa-premiada` },
  ];

  const acoesSegundaLinha = [
    { label: "Roleta Premiada", icon: CircleDot, href: `${base}/roleta-premiada` },
    { label: "Realizar sorteio", icon: Dices, href: `${base}/sorteio` },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-4 sm:py-6">
        {/* Header: Gerenciar campanha + ações */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Settings className="w-6 h-6 text-primary" />
            Gerenciar campanha
          </h1>
          <div className="flex items-center gap-2">
            <Link
              href={`/campanhas/${campanha.id}/visualizar`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50"
              title="Visualizar como participante"
              aria-label="Visualizar"
            >
              <Eye className="w-5 h-5" />
            </Link>
            <div className="relative" ref={shareMenuRef}>
              <button
                type="button"
                onClick={() => setShareMenuAberto((v) => !v)}
                className="p-2.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 flex items-center gap-1"
                title="Compartilhar campanha"
                aria-label="Compartilhar"
                aria-expanded={shareMenuAberto}
              >
                <Share2 className="w-5 h-5" />
                <ChevronDown className="w-4 h-4 opacity-70" />
              </button>
              {(linkCopiado || copiadoTipo) && (
                <span className="absolute -top-1 -right-1 text-[10px] font-medium text-green-600 bg-green-100 px-1.5 py-0.5 rounded whitespace-nowrap">
                  {copiadoTipo === "texto" ? "Texto copiado!" : "Link copiado!"}
                </span>
              )}
              {shareMenuAberto && (
                <div className="absolute right-0 top-full mt-1 w-56 rounded-xl border border-gray-200 bg-white py-2 shadow-lg z-50">
                  <p className="px-3 py-1.5 text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Compartilhar
                  </p>
                  <button
                    type="button"
                    onClick={copiarLink}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Link2 className="w-4 h-4 text-gray-500 shrink-0" />
                    Copiar link
                  </button>
                  <button
                    type="button"
                    onClick={copiarTextoCompartilhar}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Copy className="w-4 h-4 text-gray-500 shrink-0" />
                    Copiar texto para redes sociais
                  </button>
                  <button
                    type="button"
                    onClick={abrirWhatsApp}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <MessageCircle className="w-4 h-4 text-[#25D366] shrink-0" />
                    Compartilhar no WhatsApp
                  </button>
                  <button
                    type="button"
                    onClick={abrirFacebook}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Share2 className="w-4 h-4 text-[#1877F2] shrink-0" />
                    Compartilhar no Facebook
                  </button>
                  <button
                    type="button"
                    onClick={abrirTwitter}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Share2 className="w-4 h-4 text-[#1DA1F2] shrink-0" />
                    Compartilhar no X (Twitter)
                  </button>
                </div>
              )}
            </div>
            <Link
              href={`/campanhas/criar?editar=${campanha.id}`}
              className="p-2.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 inline-flex items-center justify-center"
              title="Editar campanha"
              aria-label="Editar campanha"
            >
              <Edit className="w-5 h-5" />
            </Link>
            <Link
              href="/campanhas"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-primary text-primary hover:bg-primary/5 font-medium text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Link>
          </div>
        </div>

        {/* Card compacto da campanha */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
          <div className="flex flex-col sm:flex-row">
            <div className="sm:w-64 lg:w-80 flex-shrink-0 bg-gray-200">
              {campanha.imagemUrl ? (
                <img
                  src={campanha.imagemUrl}
                  alt={campanha.nome}
                  className="w-full h-48 sm:h-full sm:min-h-[220px] object-cover"
                />
              ) : (
                <div className="w-full h-48 sm:min-h-[220px] flex items-center justify-center text-gray-400">
                  <Gift className="w-12 h-12" />
                </div>
              )}
            </div>
            <div className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 truncate" title={campanha.nome}>
                {campanha.nome}
              </h2>

              {campanha.status === "ativa" && (
                <div className="space-y-2 mb-4">
                  <p className="text-sm font-medium text-gray-700">Em andamento</p>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden flex">
                    {percentualVendido > 0 && (
                      <div
                        className={`h-full bg-green-500 transition-all shrink-0 ${percentualPendente > 0 ? "rounded-l-full" : "rounded-full"}`}
                        style={{ width: `${Math.min(100, percentualVendido)}%` }}
                      />
                    )}
                    {percentualPendente > 0 && (
                      <div
                        className={`h-full bg-amber-400 transition-all shrink-0 ${percentualVendido > 0 ? "rounded-r-full" : "rounded-full"}`}
                        style={{ width: `${Math.min(100 - percentualVendido, percentualPendente)}%` }}
                        title="Reservadas (pagamento pendente)"
                      />
                    )}
                  </div>
                  <div className="flex flex-wrap justify-between gap-x-4 gap-y-1 text-sm text-gray-600">
                    <span>
                      {percentualVendidoTexto}% vendido · {titulosVendidos.toLocaleString("pt-BR")} de{" "}
                      {campanha.quantidadeTitulos.toLocaleString("pt-BR")} cotas
                      {titulosPendentes > 0 && (
                        <span className="text-amber-700 font-medium">
                          {" "}
                          · {titulosPendentes.toLocaleString("pt-BR")} reservadas (pendentes)
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3 mb-4">
                <div>
                  <p className="text-xs text-gray-500">Valor arrecadado</p>
                  <p className="text-lg font-semibold text-gray-900 flex items-center gap-1">
                    R$ {formatarMoeda(valorArrecadado)}
                    <button
                      type="button"
                      className="p-1 rounded text-gray-400 hover:text-gray-600"
                      title="Copiar"
                      aria-label="Copiar"
                    >
                      <Link2 className="w-4 h-4" />
                    </button>
                  </p>
                </div>
                <div className="relative" ref={statusMenuRef}>
                  <button
                    type="button"
                    onClick={() => setStatusMenuAberto((v) => !v)}
                    className={`flex items-center gap-1 rounded-lg border px-3 py-2 ${
                      campanha.status === "ativa"
                        ? "border-green-200 bg-green-50"
                        : campanha.status === "pausada"
                          ? "border-yellow-200 bg-yellow-50"
                          : campanha.status === "finalizada"
                            ? "border-gray-200 bg-gray-50"
                            : "border-amber-200 bg-amber-50"
                    }`}
                  >
                    <span
                      className={`text-sm font-medium ${
                        campanha.status === "ativa"
                          ? "text-green-700"
                          : campanha.status === "pausada"
                            ? "text-yellow-800"
                            : campanha.status === "finalizada"
                              ? "text-gray-700"
                              : "text-amber-800"
                      }`}
                    >
                      {statusLabel}
                    </span>
                    <ChevronDown className="w-4 h-4 text-gray-500" aria-hidden />
                  </button>
                  {statusMenuAberto && (
                    <div className="absolute right-0 mt-1 w-52 rounded-xl border border-gray-200 bg-white shadow-lg z-40">
                      <p className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Status da campanha
                      </p>
                      {podePausar && (
                        <button
                          type="button"
                          onClick={() => handleAlterarStatus("pausada")}
                          className="w-full flex items-center justify-between px-3 py-2.5 text-sm hover:bg-gray-50 text-gray-700"
                        >
                          <span>Pausar campanha</span>
                        </button>
                      )}
                      {podeRetomar && (
                        <button
                          type="button"
                          onClick={() => handleAlterarStatus("ativa")}
                          className="w-full flex items-center justify-between px-3 py-2.5 text-sm hover:bg-gray-50 text-gray-700"
                        >
                          <span>Retomar como ativa</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {campanha.status === "rascunho" && (
                <div className="mb-4">
                  <button
                    type="button"
                    onClick={() => setModalPublicarAberto(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-semibold text-sm transition-colors"
                  >
                    <Send className="w-4 h-4" />
                    Publicar campanha
                  </button>
                </div>
              )}

              {/* Botões de ação da campanha */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
                {acoesCampanha.map(({ label, icon: Icon, href }) => (
                  <Link
                    key={label}
                    href={href}
                    className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-primary/30 text-sm font-medium transition-colors"
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{label}</span>
                  </Link>
                ))}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-2 sm:gap-3 mt-3 max-w-2xl">
                {acoesSegundaLinha.map(({ label, icon: Icon, href }) => (
                  <Link
                    key={label}
                    href={href}
                    className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-primary/30 text-sm font-medium transition-colors"
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Modal: Publicar campanha (cobrança da taxa) */}
        {modalPublicarAberto && campanha && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => !publicando && setModalPublicarAberto(false)}
            aria-hidden
          >
            <div
              className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Publicar campanha</h2>
                <button
                  type="button"
                  onClick={() => !publicando && setModalPublicarAberto(false)}
                  className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                  aria-label="Fechar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Para publicar sua campanha, é necessário pagar a taxa. Após a confirmação do pagamento, sua campanha ficará ativa.
              </p>
              <div className="space-y-3 mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Taxa</span>
                  <span className="font-semibold text-gray-900">
                    R$ {formatarMoeda(campanha.taxa)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-base font-semibold pt-2 border-t border-gray-200">
                  <span className="text-gray-900">Valor total</span>
                  <span className="text-primary">
                    R$ {formatarMoeda(campanha.taxa)}
                  </span>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => !publicando && setModalPublicarAberto(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleFinalizarPagamento}
                  disabled={publicando}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-primary hover:bg-primary-dark text-white font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center justify-center gap-2"
                >
                  {publicando ? "Publicando..." : "Finalizar pagamento"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Seção expansível: Regulamento e detalhes */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <button
            type="button"
            onClick={() => setDetalhesAbertos(!detalhesAbertos)}
            className="w-full flex items-center justify-between p-4 text-left font-semibold text-gray-900 hover:bg-gray-50"
          >
            Regulamento e detalhes da campanha
            <ChevronDown
              className={`w-5 h-5 text-gray-500 transition-transform ${detalhesAbertos ? "rotate-180" : ""}`}
            />
          </button>
          {detalhesAbertos && (
            <div className="border-t border-gray-200 p-4 sm:p-6 lg:p-8 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <div>
                  <label className="text-xs font-medium text-gray-500">Tipo de Sorteio</label>
                  <p className="mt-1 text-gray-900">
                    {campanha.tipoSorteio === "sorteador"
                      ? "Sorteador"
                      : campanha.tipoSorteio === "loteria-federal"
                        ? "Loteria Federal"
                        : campanha.tipoSorteio}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Quantidade de Títulos</label>
                  <p className="mt-1 text-gray-900">
                    {campanha.quantidadeTitulos.toLocaleString("pt-BR")} títulos
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Valor por título</label>
                  <p className="mt-1 text-gray-900">
                    R$ {((campanha.valorPorTitulo ?? 0)).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Arrecadação Estimada</label>
                  <p className="mt-1 text-gray-900 font-semibold">
                    R$ {campanha.arrecadacaoEstimada.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Taxa</label>
                  <p className="mt-1 text-gray-900 font-semibold">
                    R$ {campanha.taxa.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Quando o sorteio</label>
                  <p className="mt-1 text-gray-900 text-sm">
                    {campanha.tipoRealizacaoSorteio === "venda_total"
                      ? "Quando todas as cotas forem vendidas"
                      : campanha.tipoRealizacaoSorteio === "data_encerramento"
                        ? "Na data de encerramento"
                        : campanha.tipoRealizacaoSorteio === "data_especifica"
                          ? "Em data específica"
                          : "--"}
                  </p>
                </div>
                {campanha.dataInicio && (
                  <div>
                    <label className="text-xs font-medium text-gray-500">Data de início</label>
                    <p className="mt-1 text-gray-900">
                      {new Date(campanha.dataInicio).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                )}
                <div>
                  <label className="text-xs font-medium text-gray-500">Data de Criação</label>
                  <p className="mt-1 text-gray-900">
                    {new Date(campanha.createdAt).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                {campanha.minutosPixExpirar != null && (
                  <div>
                    <label className="text-xs font-medium text-gray-500">PIX expira em</label>
                    <p className="mt-1 text-gray-900">
                      {campanha.minutosPixExpirar === 15
                        ? "15 minutos"
                        : campanha.minutosPixExpirar === 30
                          ? "30 minutos"
                          : `${campanha.minutosPixExpirar} min`}
                    </p>
                  </div>
                )}
                {campanha.prazoReservaExpirar != null && (
                  <div>
                    <label className="text-xs font-medium text-gray-500">Prazo para reserva expirar</label>
                    <p className="mt-1 text-gray-900">
                      {campanha.prazoReservaExpirar === 60 ? "1 hora" : `${campanha.prazoReservaExpirar} min`}
                    </p>
                  </div>
                )}
                {campanha.quantidadeMinimaReserva != null && (
                  <div>
                    <label className="text-xs font-medium text-gray-500">Mín. títulos para reserva</label>
                    <p className="mt-1 text-gray-900">{campanha.quantidadeMinimaReserva}</p>
                  </div>
                )}
                {campanha.quantidadeMaximaReserva != null && campanha.quantidadeMaximaReserva > 0 && (
                  <div>
                    <label className="text-xs font-medium text-gray-500">Máx. títulos para reserva</label>
                    <p className="mt-1 text-gray-900">{campanha.quantidadeMaximaReserva}</p>
                  </div>
                )}
              </div>

              {(campanha.regulamento || campanha.descricao) && (
                <div className="pt-6 border-t border-gray-200">
                  <label className="text-sm font-medium text-gray-500">Regulamento da campanha</label>
                  <p className="mt-2 text-gray-900 whitespace-pre-wrap break-words text-sm sm:text-base">
                    {campanha.regulamento || campanha.descricao}
                  </p>
                </div>
              )}

              <div className="pt-4 border-t border-gray-200 flex justify-end">
                <button
                  type="button"
                  onClick={handleDelete}
                  className="inline-flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
                >
                  <Trash2 className="w-4 h-4" />
                  Deletar campanha
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
