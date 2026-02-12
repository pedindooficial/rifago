"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import {
  ArrowLeft,
  DollarSign,
  Loader2,
  Search,
  Filter,
  BarChart3,
  Eye,
  X,
  User,
  Mail,
  Phone,
  Ticket,
  MessageCircle,
  EyeOff,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { formatarMoeda } from "@/lib/taxas";
import { formatarNumeroCota } from "@/lib/formatadores";

type CompraItem = {
  id: string;
  comprador: { nome: string; cpf: string; email: string; telefone?: string };
  quantidade: number;
  numeros: string[];
  valorTotal: number;
  status: string;
  createdAt: string;
};

export default function MinhasVendasPage() {
  const params = useParams();
  const id = params.id as string;
  const [compras, setCompras] = useState<CompraItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [busca, setBusca] = useState("");
  const [detalhe, setDetalhe] = useState<CompraItem | null>(null);
  const [mostrarTelefone, setMostrarTelefone] = useState(false);
  const [mostrarEmail, setMostrarEmail] = useState(false);
  const [buscaTitulos, setBuscaTitulos] = useState("");
  const [paginaTitulos, setPaginaTitulos] = useState(1);
  const [cancelando, setCancelando] = useState(false);
  const [confirmarCancelar, setConfirmarCancelar] = useState(false);
  const [erroCancelar, setErroCancelar] = useState<string | null>(null);
  const [aprovando, setAprovando] = useState(false);
  const [erroAprovar, setErroAprovar] = useState<string | null>(null);
  const [mostrarReembolsoManual, setMostrarReembolsoManual] = useState(false);
  const TITULOS_POR_PAGINA = 12;

  const ERRO_REEMBOLSO_MP =
    "Não foi possível processar o reembolso no Mercado Pago. Tente novamente ou cancele manualmente.";

  useEffect(() => {
    async function carregar() {
      setLoading(true);
      setErro(null);
      try {
        const res = await fetch(`/api/campanhas/${id}/compras`);
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error((data as { error?: string }).error ?? "Erro ao carregar vendas");
        }
        const data = (await res.json()) as { compras: CompraItem[] };
        setCompras(data.compras ?? []);
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Erro ao carregar vendas");
      } finally {
        setLoading(false);
      }
    }
    carregar();
  }, [id]);

  const filtrados = useMemo(() => {
    let list = compras;
    if (filtroStatus !== "todos") {
      list = list.filter((c) => c.status === filtroStatus);
    }
    if (busca.trim()) {
      const q = busca.trim().toLowerCase();
      list = list.filter(
        (c) =>
          c.comprador.nome.toLowerCase().includes(q) ||
          c.comprador.email.toLowerCase().includes(q)
      );
    }
    return list;
  }, [compras, filtroStatus, busca]);

  function formatarData(iso: string) {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  }

  function origemCompra(c: CompraItem): string {
    if (c.status === "paga") return "PIX";
    if (c.status === "simulada") return "Simulação";
    if (c.status === "pendente") return "PIX (pendente)";
    return "—";
  }

  function formatarTelefoneWhatsApp(tel: string): string {
    const n = tel.replace(/\D/g, "");
    if (n.length >= 10) return "55" + n;
    return "";
  }

  function mascararTelefone(tel: string): string {
    const n = tel.replace(/\D/g, "");
    if (n.length < 10) return tel;
    return `+55 ${n.slice(0, 2)} *******${n.slice(-4)}`;
  }

  function mascararEmail(email: string): string {
    if (!email || !email.includes("@")) return email;
    const [local, dom] = email.split("@");
    if (local.length <= 3) return email;
    return local.slice(0, 3) + "*******@" + dom;
  }

  function abrirConfirmarCancelar() {
    setErroCancelar(null);
    setConfirmarCancelar(true);
  }

  function fecharConfirmarCancelar() {
    setConfirmarCancelar(false);
    setErroCancelar(null);
    setMostrarReembolsoManual(false);
  }

  function abrirDetalhe(c: CompraItem) {
    setMostrarTelefone(false);
    setMostrarEmail(false);
    setBuscaTitulos("");
    setPaginaTitulos(1);
    setErroAprovar(null);
    setDetalhe(c);
  }

  async function executarCancelamento(forcarReembolsoManual = false) {
    if (!detalhe || cancelando) return;
    setCancelando(true);
    setErroCancelar(null);
    try {
      const res = await fetch(`/api/campanhas/${id}/compras/${detalhe.id}/cancelar`, {
        method: "POST",
        ...(forcarReembolsoManual
          ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify({ forcar: true }) }
          : {}),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = (data as { error?: string }).error ?? "Erro ao cancelar compra.";
        setErroCancelar(msg);
        if (msg.includes("reembolso") && msg.includes("manualmente")) {
          setMostrarReembolsoManual(true);
        }
        return;
      }
      setCompras((prev) =>
        prev.map((c) => (c.id === detalhe.id ? { ...c, status: "cancelada" } : c))
      );
      setDetalhe((d) => (d && d.id === detalhe.id ? { ...d, status: "cancelada" } : d));
      fecharConfirmarCancelar();
    } finally {
      setCancelando(false);
    }
  }

  function formatarCpfDisplay(cpf: string): string {
    const n = (cpf || "").replace(/\D/g, "");
    if (n.length <= 3) return n;
    if (n.length <= 6) return `${n.slice(0, 3)}.${n.slice(3)}`;
    if (n.length <= 9) return `${n.slice(0, 3)}.${n.slice(3, 6)}.${n.slice(6)}`;
    return `${n.slice(0, 3)}.${n.slice(3, 6)}.${n.slice(6, 9)}-${n.slice(9, 11)}`;
  }

  function formatarTelefoneDisplay(tel: string): string {
    const n = (tel || "").replace(/\D/g, "");
    if (n.length <= 2) return n ? `(${n}` : "";
    if (n.length <= 6) return `(${n.slice(0, 2)}) ${n.slice(2)}`;
    return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7, 11)}`;
  }

  async function executarAprovacao() {
    if (!detalhe || aprovando || detalhe.status !== "pendente") return;
    setAprovando(true);
    setErroAprovar(null);
    try {
      const res = await fetch(`/api/campanhas/${id}/compras/${detalhe.id}/aprovar`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErroAprovar((data as { error?: string }).error ?? "Erro ao aprovar compra.");
        return;
      }
      setCompras((prev) =>
        prev.map((c) => (c.id === detalhe.id ? { ...c, status: "paga" } : c))
      );
      setDetalhe((d) => (d && d.id === detalhe.id ? { ...d, status: "paga" } : d));
    } finally {
      setAprovando(false);
    }
  }

  function labelStatus(status: string): string {
    if (status === "paga") return "Aprovado";
    if (status === "simulada") return "Simulada";
    if (status === "pendente") return "Pendente";
    if (status === "cancelada") return "Cancelada";
    return status;
  }

  function exportarRelatorio() {
    const cabecalho = "Apoiador;Data;Origem;Valor;Títulos;Status\n";
    const linhas = filtrados
      .map(
        (c) =>
          `"${c.comprador.nome.replace(/"/g, '""')}";"${formatarData(c.createdAt)}";"${origemCompra(c)}";${c.valorTotal.toFixed(2).replace(".", ",")};${c.quantidade};"${labelStatus(c.status)}"`
      )
      .join("\n");
    const blob = new Blob(["\uFEFF" + cabecalho + linhas], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "vendas.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      <Link
        href={`/campanhas/${id}`}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-300 transition-colors mb-6 shadow-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar para gerenciar campanha
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <DollarSign className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Minhas vendas</h1>
            <p className="text-sm text-gray-500">
              Histórico de compras (pagas, simuladas, pendentes e canceladas) nesta campanha.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="todos">Filtro: Todos</option>
              <option value="paga">Aprovado</option>
              <option value="simulada">Simulada</option>
              <option value="pendente">Pendente</option>
              <option value="cancelada">Cancelada</option>
            </select>
            <div className="relative w-full sm:w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium"
            >
              <Filter className="w-4 h-4" />
              Filtro
            </button>
            <button
              type="button"
              onClick={exportarRelatorio}
              disabled={filtrados.length === 0}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <BarChart3 className="w-4 h-4" />
              Relatório
            </button>
          </div>
        </div>

        <p className="px-4 py-3 text-sm font-medium text-gray-700 border-b border-gray-100 bg-gray-50/50">
          Resultados ({filtrados.length})
        </p>

        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : erro ? (
          <div className="p-8 text-center text-red-600 font-medium">{erro}</div>
        ) : filtrados.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            Nenhuma venda encontrada.
            {compras.length === 0
              ? " As compras confirmadas aparecerão aqui."
              : " Tente outro filtro ou busca."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-800 text-white">
                  <th className="text-left py-3 px-4 font-semibold">Apoiador</th>
                  <th className="text-left py-3 px-4 font-semibold">Data</th>
                  <th className="text-left py-3 px-4 font-semibold">Origem</th>
                  <th className="text-right py-3 px-4 font-semibold">Valor</th>
                  <th className="text-right py-3 px-4 font-semibold">Títulos</th>
                  <th className="text-center py-3 px-4 font-semibold">Status</th>
                  <th className="text-center py-3 px-4 font-semibold w-20">Ação</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((c, index) => (
                  <tr
                    key={c.id}
                    className={`border-b border-gray-100 transition-colors ${
                      index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                    } hover:bg-primary/5`}
                  >
                    <td className="py-3 px-4 font-medium text-gray-900">
                      {c.comprador.nome}
                    </td>
                    <td className="py-3 px-4 text-gray-600 whitespace-nowrap">
                      {formatarData(c.createdAt)}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {origemCompra(c)}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-gray-900">
                      R$ {formatarMoeda(c.valorTotal)}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-700">
                      {c.quantidade.toLocaleString("pt-BR")}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          c.status === "paga"
                            ? "bg-green-100 text-green-800"
                            : c.status === "simulada"
                            ? "bg-amber-100 text-amber-800"
                            : c.status === "pendente"
                            ? "bg-blue-100 text-blue-800"
                            : c.status === "cancelada"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {labelStatus(c.status)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => abrirDetalhe(c)}
                        className="inline-flex items-center justify-center w-9 h-9 rounded-full border-2 border-primary text-primary hover:bg-primary/10 transition-colors"
                        title="Ver detalhes"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal detalhe da transação */}
      {detalhe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col my-4">
            <div className="p-4 sm:p-6 border-b border-gray-200 flex items-center justify-between shrink-0">
              <h2 className="text-lg font-bold text-gray-900">
                {detalhe.status === "paga"
                  ? "Compra aprovada"
                  : detalhe.status === "simulada"
                  ? "Compra simulada"
                  : detalhe.status === "pendente"
                  ? "Compra pendente"
                  : detalhe.status === "cancelada"
                  ? "Compra cancelada"
                  : "Detalhes da compra"}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setDetalhe(null);
                  setConfirmarCancelar(false);
                  setErroCancelar(null);
                }}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
              {/* Apoiador */}
              <div>
                <p className="font-semibold text-gray-900 mb-2">{detalhe.comprador.nome}</p>
                <div className="flex flex-wrap items-center gap-2">
                  {detalhe.comprador.telefone && (
                    <div className="flex items-center gap-1">
                      <MessageCircle className="w-4 h-4 text-green-600 shrink-0" />
                      <span className="text-sm text-gray-600 font-mono">
                        {mostrarTelefone ? detalhe.comprador.telefone : mascararTelefone(detalhe.comprador.telefone)}
                      </span>
                      <button
                        type="button"
                        onClick={() => setMostrarTelefone(!mostrarTelefone)}
                        className="p-1 text-gray-400 hover:text-gray-600"
                        title={mostrarTelefone ? "Ocultar" : "Mostrar"}
                      >
                        {mostrarTelefone ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <a
                        href={`https://wa.me/${formatarTelefoneWhatsApp(detalhe.comprador.telefone)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-1 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700"
                      >
                        <MessageCircle className="w-4 h-4" />
                        Contatar
                      </a>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="text-sm text-gray-600 font-mono">
                      {mostrarEmail ? detalhe.comprador.email : mascararEmail(detalhe.comprador.email)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setMostrarEmail(!mostrarEmail)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                      title={mostrarEmail ? "Ocultar" : "Mostrar"}
                    >
                      {mostrarEmail ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Detalhes da compra */}
              <div className="rounded-xl bg-gray-50 border border-gray-200 p-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Detalhes da compra</p>
                <ul className="space-y-1 text-sm text-gray-700">
                  <li><strong>Forma de pagamento:</strong> {origemCompra(detalhe)}</li>
                  <li><strong>Data da reserva:</strong> {formatarData(detalhe.createdAt)}</li>
                  <li><strong>Valor total da compra:</strong> R$ {formatarMoeda(detalhe.valorTotal)}</li>
                  <li><strong>Títulos:</strong> {detalhe.quantidade}</li>
                </ul>
              </div>

              {/* Títulos com busca e paginação */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <Ticket className="w-4 h-4 text-primary" />
                    Títulos ({detalhe.numeros.length})
                  </p>
                  <div className="relative w-32">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar número"
                      value={buscaTitulos}
                      onChange={(e) => {
                        setBuscaTitulos(e.target.value);
                        setPaginaTitulos(1);
                      }}
                      className="w-full pl-8 pr-2 py-1.5 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                </div>
                {detalhe.status === "cancelada" && (
                  <p className="mb-3 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                    Estas cotas foram liberadas e estão disponíveis para nova compra.
                  </p>
                )}
                {(() => {
                  const filtradosTitulos = buscaTitulos.trim()
                    ? detalhe.numeros.filter((n) => formatarNumeroCota(n).includes(buscaTitulos.trim()))
                    : detalhe.numeros;
                  const totalPaginas = Math.max(1, Math.ceil(filtradosTitulos.length / TITULOS_POR_PAGINA));
                  const inicio = (paginaTitulos - 1) * TITULOS_POR_PAGINA;
                  const titulosPagina = filtradosTitulos.slice(inicio, inicio + TITULOS_POR_PAGINA);
                  const isCancelada = detalhe.status === "cancelada";
                  return (
                    <>
                      <div className="flex flex-wrap gap-2 min-h-[3rem]">
                        {titulosPagina.map((num) => (
                          <span
                            key={num}
                            className={`inline-flex items-center justify-center min-w-[3.5rem] px-2.5 py-1.5 rounded-lg font-mono text-sm font-semibold ${
                              isCancelada
                                ? "border border-gray-300 bg-gray-100 text-gray-700"
                                : "border border-green-200 bg-green-50 text-green-800"
                            }`}
                          >
                            {formatarNumeroCota(num)}
                          </span>
                        ))}
                      </div>
                      {totalPaginas > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-3">
                          <button
                            type="button"
                            onClick={() => setPaginaTitulos((p) => Math.max(1, p - 1))}
                            disabled={paginaTitulos <= 1}
                            className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <span className="text-sm text-gray-600">
                            Página {paginaTitulos} de {totalPaginas}
                          </span>
                          <button
                            type="button"
                            onClick={() => setPaginaTitulos((p) => Math.min(totalPaginas, p + 1))}
                            disabled={paginaTitulos >= totalPaginas}
                            className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>

            <div className="p-4 sm:p-6 border-t border-gray-200 shrink-0">
              {detalhe.status === "cancelada" ? (
                <p className="text-center text-gray-600 font-medium">
                  Esta compra foi cancelada. As cotas acima estão disponíveis novamente para venda.
                </p>
              ) : detalhe.status === "pendente" ? (
                <>
                  <button
                    type="button"
                    onClick={executarAprovacao}
                    disabled={aprovando}
                    className="w-full py-3 px-4 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold disabled:opacity-60 transition-colors"
                  >
                    {aprovando ? "Aprovando..." : "Aprovar manualmente"}
                  </button>
                  {erroAprovar && (
                    <p className="mt-2 text-sm text-red-600 text-center">{erroAprovar}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    A compra ainda não foi paga. Se o cliente já efetuou o PIX, clique em Aprovar manualmente para confirmar.
                  </p>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={abrirConfirmarCancelar}
                    disabled={cancelando}
                    className="w-full py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold disabled:opacity-60 transition-colors"
                  >
                    {cancelando ? "Cancelando..." : "Cancelar compra"}
                  </button>
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Será gerado reembolso (se paga) e as cotas voltarão ao montante disponível.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmação de cancelamento */}
      {confirmarCancelar && detalhe && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 my-4">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Cancelar compra?</h3>
            {!mostrarReembolsoManual ? (
              <>
                <p className="text-gray-600 text-sm mb-6">
                  Tem certeza que deseja cancelar esta compra? Será gerado reembolso (se paga) e as cotas voltarão ao montante disponível.
                </p>
                {erroCancelar && (
                  <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
                    {erroCancelar}
                  </div>
                )}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={fecharConfirmarCancelar}
                    disabled={cancelando}
                    className="flex-1 py-2.5 px-4 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50"
                  >
                    Não, voltar
                  </button>
                  <button
                    type="button"
                    onClick={() => executarCancelamento(false)}
                    disabled={cancelando}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold disabled:opacity-60"
                  >
                    {cancelando ? "Cancelando..." : "Sim, cancelar compra"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-gray-600 text-sm mb-3">
                  Faça o reembolso manualmente ao cliente. Use os dados abaixo para transferência PIX:
                </p>
                <div className="mb-4 p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-2 text-sm">
                  <div>
                    <span className="font-medium text-gray-500 block mb-0.5">CPF</span>
                    <p className="font-mono text-gray-900">{formatarCpfDisplay(detalhe.comprador.cpf)}</p>
                  </div>
                  {detalhe.comprador.telefone && (
                    <div>
                      <span className="font-medium text-gray-500 block mb-0.5">Celular</span>
                      <p className="font-mono text-gray-900">{formatarTelefoneDisplay(detalhe.comprador.telefone)}</p>
                    </div>
                  )}
                  <div>
                    <span className="font-medium text-gray-500 block mb-0.5">E-mail</span>
                    <p className="font-mono text-gray-900 break-all">{detalhe.comprador.email}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mb-4">
                  Após realizar o reembolso, clique em &quot;Já fiz reembolso e cancelar&quot; para encerrar a compra e liberar as cotas.
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={fecharConfirmarCancelar}
                    disabled={cancelando}
                    className="flex-1 py-2.5 px-4 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50"
                  >
                    Não, voltar
                  </button>
                  <button
                    type="button"
                    onClick={() => executarCancelamento(true)}
                    disabled={cancelando}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold disabled:opacity-60"
                  >
                    {cancelando ? "Cancelando..." : "Já fiz reembolso e cancelar"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
