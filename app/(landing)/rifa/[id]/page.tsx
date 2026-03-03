"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Gift, Percent, ChevronDown, Ticket, CheckCircle2, Facebook, Instagram, Twitter, MessageCircle, Users, Youtube, Share2, Linkedin, Minus, Plus, Trophy, Medal, Award } from "lucide-react";
import { obterCampanhaPublica, Campanha } from "@/lib/api";
import { formatarMoeda } from "@/lib/taxas";
import { formatarNumeroCota } from "@/lib/formatadores";
import { parsePromocaoFromString, valorTotalComPromocao } from "@/lib/promocao";
import Logo from "@/components/Logo";

const CPF_LENGTH = 11;
const TELEFONE_LENGTH = 11;
const NOME_MAX_LENGTH = 150;
const EMAIL_MAX_LENGTH = 255;

function formatarCpf(val: string): string {
  const n = val.replace(/\D/g, "").slice(0, CPF_LENGTH);
  if (n.length <= 3) return n;
  if (n.length <= 6) return `${n.slice(0, 3)}.${n.slice(3)}`;
  if (n.length <= 9) return `${n.slice(0, 3)}.${n.slice(3, 6)}.${n.slice(6)}`;
  return `${n.slice(0, 3)}.${n.slice(3, 6)}.${n.slice(6, 9)}-${n.slice(9)}`;
}

function formatarTelefone(val: string): string {
  const n = val.replace(/\D/g, "").slice(0, TELEFONE_LENGTH);
  if (n.length <= 2) return n ? `(${n}` : "";
  if (n.length <= 6) return `(${n.slice(0, 2)}) ${n.slice(2)}`;
  return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`;
}

function somenteNumeros(s: string): string {
  return s.replace(/\D/g, "");
}

function nomeApenasLetrasEspacos(s: string): string {
  return s.replace(/[^\p{L}\s\-']/gu, "").slice(0, NOME_MAX_LENGTH);
}

export default function RifaPublicaPage() {
  const params = useParams();
  const router = useRouter();
  const [campanha, setCampanha] = useState<Campanha | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [regulamentoAberto, setRegulamentoAberto] = useState(false);
  const [quantidade, setQuantidade] = useState(1);
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [comprando, setComprando] = useState(false);
  const [compraSimulada, setCompraSimulada] = useState<{
    numeros: string[];
    valorTotal: number;
    campanhaNome: string;
  } | null>(null);
  const [simulando, setSimulando] = useState(false);
  const [passo, setPasso] = useState<1 | 2>(1);
  const [rankingPublico, setRankingPublico] = useState<{
    posicao: number;
    nome: string;
    valorTotal: number;
    quantidadeNumeros: number;
  }[]>([]);
  const [loadingRanking, setLoadingRanking] = useState(false);

  useEffect(() => {
    async function carregar() {
      try {
        setErro(null);
        const data = await obterCampanhaPublica(params.id as string);
        setCampanha(data);
        // Se campanha tiver quantidade mínima de reserva, usa como valor inicial do campo
        const min = data.quantidadeMinimaReserva ?? 1;
        setQuantidade(min > 0 ? min : 1);
      } catch (error) {
        console.error("Erro ao carregar campanha:", error);
        setErro("Campanha não encontrada ou não está ativa.");
      } finally {
        setLoading(false);
      }
    }
    carregar();
  }, [params.id]);

  useEffect(() => {
    if (!campanha?.rankingVisivel || !campanha?.id) return;
    setLoadingRanking(true);
    fetch(`/api/campanhas/public/${campanha.id}/ranking`)
      .then((res) => (res.ok ? res.json() : { ranking: [] }))
      .then((data: { ranking: { posicao: number; nome: string; valorTotal: number; quantidadeNumeros: number }[] }) =>
        setRankingPublico(data.ranking ?? [])
      )
      .catch(() => setRankingPublico([]))
      .finally(() => setLoadingRanking(false));
  }, [campanha?.id, campanha?.rankingVisivel]);

  useEffect(() => {
    if (!campanha) return;
    const tituloAba = campanha.brandingSiteTitle
      ? `${campanha.brandingSiteTitle} | ${campanha.nome}`
      : campanha.nome;
    document.title = tituloAba;
    if (campanha.brandingFaviconUrl) {
      let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.href = campanha.brandingFaviconUrl;
    }
  }, [campanha]);

  const titulosVendidos = campanha?.titulosVendidos ?? 0;
  const titulosPendentes = campanha?.titulosPendentes ?? 0;
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
  const promocoes = campanha ? parsePromocaoFromString(campanha.promocao) : [];
  const premiosList = campanha?.premios?.trim() ? campanha.premios.split("\n").filter(Boolean) : [];
  const valorCota = campanha?.valorPorTitulo ?? 0;
  const totalComprar = valorTotalComPromocao(promocoes, quantidade, valorCota);

  const mostrarProgresso =
    campanha?.status === "ativa" && campanha?.progressoVisivel;

  const handleParticipar = () => {
    setPasso(2);
  };

  const handleComprar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campanha) return;

    if (!nome.trim() || !cpf.trim() || !email.trim()) {
      alert("Preencha nome, CPF e e-mail para gerar o PIX.");
      return;
    }
    if (somenteNumeros(cpf).length !== CPF_LENGTH) {
      alert("CPF deve ter 11 dígitos.");
      return;
    }

    setComprando(true);
    try {
      const res = await fetch("/api/pagamentos/mercadopago/pix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campanhaId: campanha.id,
          quantidade,
          nome: nome.trim(),
          cpf: somenteNumeros(cpf),
          email: email.trim().toLowerCase(),
          telefone: telefone ? somenteNumeros(telefone) : undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg =
          (data && (data as { error?: string }).error) ||
          "Erro ao gerar PIX";
        throw new Error(msg);
      }

      const token = (data as { token?: string }).token ?? null;
      if (!token) {
        throw new Error("PIX gerado sem token. Tente novamente.");
      }

      setCompraSimulada(null);
      router.push(`/rifa/${campanha.id}/pagamento?token=${encodeURIComponent(token)}`);
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      alert(`Não foi possível gerar o PIX: ${msg}`);
    } finally {
      setComprando(false);
    }
  };

  const handleSimularPagamento = async () => {
    if (!campanha) return;
    if (!nome.trim() || !cpf.trim() || !email.trim()) {
      alert("Preencha nome, CPF e e-mail para simular o pagamento.");
      return;
    }
    if (somenteNumeros(cpf).length !== CPF_LENGTH) {
      alert("CPF deve ter 11 dígitos.");
      return;
    }
    setSimulando(true);
    try {
      const res = await fetch("/api/compras/simular", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campanhaId: campanha.id,
          quantidade,
          nome: nome.trim(),
          cpf: somenteNumeros(cpf),
          email: email.trim().toLowerCase(),
          telefone: telefone ? somenteNumeros(telefone) : undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((data as { error?: string }).error ?? "Erro ao simular pagamento");
      }
      const payload = data as { numeros: string[]; valorTotal: number; campanhaNome: string };
      setCompraSimulada({
        numeros: payload.numeros ?? [],
        valorTotal: payload.valorTotal ?? 0,
        campanhaNome: payload.campanhaNome ?? campanha.nome,
      });
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Não foi possível simular o pagamento.");
    } finally {
      setSimulando(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Carregando...</p>
      </div>
    );
  }

  if (erro || !campanha) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <p className="text-gray-600 mb-4">{erro ?? "Campanha não encontrada."}</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-primary font-medium hover:underline"
          >
            Voltar ao início
          </Link>
        </div>
      </div>
    );
  }

  const corPrimaria = campanha.brandingPrimaryColor || undefined;
  const textoBotao = campanha.brandingCtaText?.trim() || "Participar";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header público */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <Logo
            href="/"
            size="xs"
            imageSrc={campanha.brandingLogoUrl}
            alt={campanha.brandingSiteTitle || campanha.nome}
          />
          <Link
            href="/meus-numeros"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 font-medium text-xs sm:text-sm"
          >
            <Ticket className="w-4 h-4" />
            Meus números
          </Link>
        </div>
      </header>

      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Hero */}
          <div className="relative">
            <div className="aspect-video sm:aspect-[21/9] bg-gray-200">
              {campanha.imagemUrl ? (
                <img
                  src={campanha.imagemUrl}
                  alt={campanha.nome}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <Gift className="w-16 h-16" />
                </div>
              )}
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-lg">
                {campanha.nome}
              </h1>
              {campanha.brandingSlogan && (
                <p className="text-sm sm:text-base text-white/95 drop-shadow mt-1">
                  {campanha.brandingSlogan}
                </p>
              )}
              {campanha.status === "finalizada" && (
                <span className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium bg-gray-500/90 text-white">
                  Encerrada
                </span>
              )}
            </div>
          </div>

          <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            {/* Progresso */}
            {mostrarProgresso && (
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                <p className="text-sm font-medium text-gray-700 mb-2">Em andamento</p>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden mb-2 flex">
                  {percentualVendido > 0 && (
                    <div
                      className={`h-full bg-primary transition-all shrink-0 ${percentualPendente > 0 ? "rounded-l-full" : "rounded-full"}`}
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
                <p className="text-sm text-gray-600">
                  {percentualVendidoTexto}% vendido · {titulosVendidos.toLocaleString("pt-BR")} de{" "}
                  {campanha.quantidadeTitulos.toLocaleString("pt-BR")} cotas
                  {titulosPendentes > 0 && (
                    <span className="text-amber-700 font-medium">
                      {" "}
                      · {titulosPendentes.toLocaleString("pt-BR")} reservadas (pendentes)
                    </span>
                  )}
                </p>
              </div>
            )}

            {/* Valor da cota + Comprar */}
            <div id="comprar" className="scroll-mt-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Valor da cota</p>
              <p className="text-2xl font-bold text-gray-900 mb-4">
                R$ {formatarMoeda(valorCota)}
              </p>
              <form onSubmit={handleComprar} className="flex flex-col gap-4">
                {passo === 1 ? (
                  <>
                    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                      <div className="flex-1">
                        <label htmlFor="qtd" className="block text-sm font-medium text-gray-700 mb-1">
                          Quantidade de cotas
                        </label>
                        <div className="inline-flex items-stretch rounded-lg border border-gray-300 overflow-hidden bg-white focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent">
                          <button
                            type="button"
                            aria-label="Diminuir quantidade"
                            onClick={() => {
                              const min = campanha.quantidadeMinimaReserva ?? 1;
                              setQuantidade((q) => Math.max(min, q - 1));
                            }}
                            disabled={quantidade <= (campanha.quantidadeMinimaReserva ?? 1)}
                            className="flex items-center justify-center w-10 h-10 flex-shrink-0 border-r border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <input
                            id="qtd"
                            type="number"
                            min={campanha.quantidadeMinimaReserva ?? 1}
                            max={campanha.quantidadeMaximaReserva ?? undefined}
                            value={quantidade}
                            onChange={(e) => {
                              const min = campanha.quantidadeMinimaReserva ?? 1;
                              const max = campanha.quantidadeMaximaReserva;
                              let v = parseInt(e.target.value, 10) || min;
                              if (max != null) v = Math.min(max, v);
                              setQuantidade(Math.max(min, v));
                            }}
                            className="w-14 sm:w-16 min-w-0 flex-1 text-center py-2 border-0 focus:ring-0 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <button
                            type="button"
                            aria-label="Aumentar quantidade"
                            onClick={() => {
                              const min = campanha.quantidadeMinimaReserva ?? 1;
                              const max = campanha.quantidadeMaximaReserva;
                              setQuantidade((q) => {
                                const next = q + 1;
                                if (max != null && next > max) return q;
                                return next;
                              });
                            }}
                            disabled={
                              campanha.quantidadeMaximaReserva != null &&
                              quantidade >= campanha.quantidadeMaximaReserva
                            }
                            className="flex items-center justify-center w-10 h-10 flex-shrink-0 border-l border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-3">
                          {([1, 5, 10, 20, 100, 250] as const).map((n) => {
                            const max = campanha.quantidadeMaximaReserva;
                            const atMax = max != null && quantidade >= max;
                            return (
                              <button
                                key={n}
                                type="button"
                                onClick={() => {
                                  setQuantidade((q) => {
                                    const next = q + n;
                                    if (max != null && next > max) return max;
                                    return next;
                                  });
                                }}
                                disabled={atMax}
                                className={`py-2.5 px-3 rounded-xl text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                                  !corPrimaria ? "bg-green-600 hover:bg-green-700" : ""
                                }`}
                                style={corPrimaria ? { backgroundColor: corPrimaria } : undefined}
                              >
                                +{n < 10 ? `0${n}` : n}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div className="sm:text-right shrink-0">
                        <p className="text-sm text-gray-500 mb-0.5">Total</p>
                        <p className="text-2xl font-bold text-gray-900">
                          R$ {formatarMoeda(totalComprar)}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleParticipar}
                      className={`inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 rounded-xl text-white font-semibold text-base transition-colors ${!corPrimaria ? "bg-primary hover:bg-primary-dark" : ""}`}
                      style={corPrimaria ? { backgroundColor: corPrimaria } : undefined}
                    >
                      <Ticket className="w-5 h-5" />
                      {textoBotao}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setPasso(1)}
                      className="inline-flex items-center gap-1 text-gray-600 hover:text-gray-900 text-sm font-medium mb-1"
                    >
                      ← Voltar
                    </button>
                    <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 mb-2">
                      <p className="text-sm text-gray-600">
                        {quantidade} cota(s) · Total: <strong className="text-gray-900">R$ {formatarMoeda(totalComprar)}</strong>
                      </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nome completo
                        </label>
                        <input
                          type="text"
                          value={nome}
                          onChange={(e) => setNome(nomeApenasLetrasEspacos(e.target.value))}
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                          placeholder="Digite seu nome completo"
                          maxLength={NOME_MAX_LENGTH}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          CPF
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          autoComplete="off"
                          value={formatarCpf(cpf)}
                          onChange={(e) => setCpf(somenteNumeros(e.target.value).slice(0, CPF_LENGTH))}
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                          placeholder="000.000.000-00"
                          maxLength={14}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          E-mail
                        </label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                          placeholder="seu@email.com"
                          maxLength={EMAIL_MAX_LENGTH}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Telefone (opcional)
                        </label>
                        <input
                          type="tel"
                          inputMode="numeric"
                          autoComplete="tel"
                          value={formatarTelefone(telefone)}
                          onChange={(e) => setTelefone(somenteNumeros(e.target.value).slice(0, TELEFONE_LENGTH))}
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                          placeholder="(00) 00000-0000"
                          maxLength={15}
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={comprando}
                      className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 rounded-xl bg-primary hover:bg-primary-dark text-white font-semibold text-base transition-colors disabled:opacity-70"
                    >
                      <Ticket className="w-5 h-5" />
                      {comprando ? "Gerando PIX..." : "Gerar PIX"}
                    </button>
                  </>
                )}
              </form>
            </div>

            {/* Promoções */}
            {promocoes.length > 0 && (
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                <p className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <Percent className="w-4 h-4 text-primary" />
                  Promoções
                </p>
                <ul className="space-y-1 text-sm text-gray-700">
                  {promocoes.map((p, i) => (
                    <li key={i}>
                      {p.quantidade} cota(s) por R$ {formatarMoeda(p.valorTotal)} — cada cota sai por R${" "}
                      {formatarMoeda(p.quantidade > 0 ? p.valorTotal / p.quantidade : 0)}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Prêmios */}
            {premiosList.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <Gift className="w-4 h-4 text-primary" />
                  Prêmios
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                  {premiosList.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Ranking (visível para participantes quando ativado) */}
            {campanha.rankingVisivel && (
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                <p className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-primary" />
                  Ranking dos participantes
                </p>
                {loadingRanking ? (
                  <p className="text-sm text-gray-500">Carregando ranking...</p>
                ) : rankingPublico.length === 0 ? (
                  <p className="text-sm text-gray-500">Nenhuma compra confirmada ainda.</p>
                ) : (
                  <ul className="space-y-2">
                    {rankingPublico.map((r) => (
                      <li
                        key={`${r.posicao}-${r.nome}`}
                        className="flex items-center gap-3 p-3 rounded-lg bg-white border border-gray-100"
                      >
                        <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary font-bold text-sm shrink-0">
                          {r.posicao === 1 ? (
                            <Trophy className="w-4 h-4" />
                          ) : r.posicao === 2 ? (
                            <Medal className="w-4 h-4" />
                          ) : r.posicao === 3 ? (
                            <Award className="w-4 h-4" />
                          ) : (
                            r.posicao + "°"
                          )}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{r.nome}</p>
                          <p className="text-xs text-gray-500">
                            Total: R$ {formatarMoeda(r.valorTotal)} · {r.quantidadeNumeros} cota(s)
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Regulamento */}
            {(campanha.regulamento || campanha.descricao) && (
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setRegulamentoAberto(!regulamentoAberto)}
                  className="w-full flex items-center justify-between p-4 text-left font-semibold text-gray-900 hover:bg-gray-50"
                >
                  Regulamento
                  <ChevronDown
                    className={`w-5 h-5 text-gray-500 transition-transform ${regulamentoAberto ? "rotate-180" : ""}`}
                  />
                </button>
                {regulamentoAberto && (
                  <div className="border-t border-gray-200 p-4 sm:p-6 bg-gray-50">
                    <p className="text-gray-900 whitespace-pre-wrap break-words text-sm sm:text-base">
                      {campanha.regulamento || campanha.descricao}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Redes sociais do organizador */}
            {campanha.redesSociais && Object.keys(campanha.redesSociais).length > 0 && (
              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm font-semibold text-gray-700 mb-3">Siga nas redes</p>
                <div className="flex flex-wrap gap-3">
                  {campanha.redesSociais.facebook && (
                    <a
                      href={campanha.redesSociais.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#1877F2]/10 text-[#1877F2] hover:bg-[#1877F2]/20 transition-colors"
                      title="Facebook"
                      aria-label="Facebook"
                    >
                      <Facebook className="w-5 h-5" />
                    </a>
                  )}
                  {campanha.redesSociais.instagram && (
                    <a
                      href={campanha.redesSociais.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#E4405F]/10 text-[#E4405F] hover:bg-[#E4405F]/20 transition-colors"
                      title="Instagram"
                      aria-label="Instagram"
                    >
                      <Instagram className="w-5 h-5" />
                    </a>
                  )}
                  {campanha.redesSociais.twitter && (
                    <a
                      href={campanha.redesSociais.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
                      title="X (Twitter)"
                      aria-label="X (Twitter)"
                    >
                      <Twitter className="w-5 h-5" />
                    </a>
                  )}
                  {campanha.redesSociais.whatsapp && (
                    <a
                      href={campanha.redesSociais.whatsapp}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 transition-colors"
                      title="WhatsApp"
                      aria-label="WhatsApp"
                    >
                      <MessageCircle className="w-5 h-5" />
                    </a>
                  )}
                  {campanha.redesSociais.youtube && (
                    <a
                      href={campanha.redesSociais.youtube}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#FF0000]/10 text-[#FF0000] hover:bg-[#FF0000]/20 transition-colors"
                      title="YouTube"
                      aria-label="YouTube"
                    >
                      <Youtube className="w-5 h-5" />
                    </a>
                  )}
                  {campanha.redesSociais.tiktok && (
                    <a
                      href={campanha.redesSociais.tiktok}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-900/10 text-gray-900 hover:bg-gray-900/20 transition-colors"
                      title="TikTok"
                      aria-label="TikTok"
                    >
                      <Share2 className="w-5 h-5" />
                    </a>
                  )}
                  {campanha.redesSociais.linkedin && (
                    <a
                      href={campanha.redesSociais.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#0A66C2]/10 text-[#0A66C2] hover:bg-[#0A66C2]/20 transition-colors"
                      title="LinkedIn"
                      aria-label="LinkedIn"
                    >
                      <Linkedin className="w-5 h-5" />
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {campanha.brandingFooterText && (
        <footer className="border-t border-gray-200 bg-white py-6 mt-8">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-600">
            {campanha.brandingFooterText}
          </div>
        </footer>
      )}

      {/* Ícone flutuante: Grupo do WhatsApp */}
      {campanha?.redesSociais?.whatsappGrupo && (
        <a
          href={campanha.redesSociais.whatsappGrupo}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-[#25D366] text-white shadow-lg hover:bg-[#20BD5A] hover:scale-105 active:scale-95 transition-all"
          title="Entrar no grupo do WhatsApp"
          aria-label="Grupo do WhatsApp"
        >
          <Users className="w-7 h-7" />
        </a>
      )}

      {/* Sucesso da simulação (ambiente de teste) */}
      {compraSimulada && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4 mb-6">
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="shrink-0 w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-600" strokeWidth={2} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900">Pagamento simulado!</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {compraSimulada.campanhaNome} · {compraSimulada.numeros.length} cota(s) · R$ {formatarMoeda(compraSimulada.valorTotal)}
                </p>
                <p className="text-xs text-gray-500 mt-2">Seus números: {compraSimulada.numeros.map(formatarNumeroCota).join(", ")}</p>
                <Link
                  href="/meus-numeros"
                  className="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-xl bg-primary hover:bg-primary-dark text-white font-medium text-sm"
                >
                  <Ticket className="w-4 h-4" />
                  Ver meus números
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
