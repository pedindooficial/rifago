"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Users,
  Loader2,
  X,
  Phone,
  Mail,
  User,
  Hash,
  Search,
  ArrowUpFromLine,
  ArrowLeft,
} from "lucide-react";
import { formatarMoeda } from "@/lib/taxas";
import { formatarNumeroCota } from "@/lib/formatadores";

type ApoiadorCompra = {
  campanhaId: string;
  campanhaNome: string;
  numeros: string[];
  valorTotal: number;
  quantidade: number;
  status: string;
  createdAt: string;
};

type Apoiador = {
  nome: string;
  cpf: string;
  email: string;
  telefone?: string;
  totalGasto: number;
  compras: ApoiadorCompra[];
};

const POR_PAGINA = 12;

function formatarCpf(cpf: string): string {
  const n = cpf.replace(/\D/g, "");
  if (n.length !== 11) return cpf;
  return n.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

function formatarTelefone(tel: string): string {
  const n = tel.replace(/\D/g, "");
  if (n.length === 11) return `+55 ${n.slice(0, 2)} ${n.slice(2, 7)} ${n.slice(7)}`;
  if (n.length === 10) return `+55 ${n.slice(0, 2)} ${n.slice(2, 6)}-${n.slice(6)}`;
  return tel;
}

function formatarData(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("pt-BR", {
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

export default function ApoiadoresPage() {
  const [apoiadores, setApoiadores] = useState<Apoiador[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [detalhe, setDetalhe] = useState<Apoiador | null>(null);
  const [filtroCampanha, setFiltroCampanha] = useState<string>("todos");
  const [busca, setBusca] = useState("");
  const [pagina, setPagina] = useState(1);

  useEffect(() => {
    async function carregar() {
      setLoading(true);
      setErro(null);
      try {
        const res = await fetch("/api/apoiadores");
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error((data as { error?: string }).error ?? "Erro ao carregar apoiadores");
        }
        const data = (await res.json()) as { apoiadores: Apoiador[] };
        setApoiadores(data.apoiadores ?? []);
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Erro ao carregar apoiadores");
      } finally {
        setLoading(false);
      }
    }
    carregar();
  }, []);

  const campanhasFiltro = useMemo(() => {
    const ids = new Map<string, string>();
    apoiadores.forEach((a) => {
      a.compras.forEach((c) => ids.set(c.campanhaId, c.campanhaNome));
    });
    return Array.from(ids.entries()).map(([id, nome]) => ({ id, nome }));
  }, [apoiadores]);

  const filtrados = useMemo(() => {
    let list = apoiadores;
    if (filtroCampanha !== "todos") {
      list = list.filter((a) => a.compras.some((c) => c.campanhaId === filtroCampanha));
    }
    if (busca.trim()) {
      const q = busca.trim().toLowerCase();
      list = list.filter(
        (a) =>
          a.nome.toLowerCase().includes(q) ||
          a.email.toLowerCase().includes(q) ||
          (a.telefone && a.telefone.replace(/\D/g, "").includes(q.replace(/\D/g, "")))
      );
    }
    return list;
  }, [apoiadores, filtroCampanha, busca]);

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const listaPaginada = useMemo(() => {
    const inicio = (paginaAtual - 1) * POR_PAGINA;
    return filtrados.slice(inicio, inicio + POR_PAGINA);
  }, [filtrados, paginaAtual]);

  useEffect(() => {
    setPagina(1);
  }, [filtroCampanha, busca]);

  const exportarCsv = () => {
    const cabecalho = "Nome;E-mail;Telefone;Total gasto\n";
    const linhas = filtrados
      .map(
        (a) =>
          `"${a.nome.replace(/"/g, '""')}";"${a.email}";"${a.telefone ?? ""}";${a.totalGasto.toFixed(2).replace(".", ",")}`
      )
      .join("\n");
    const blob = new Blob(["\uFEFF" + cabecalho + linhas], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "apoiadores.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Cabeçalho: título + toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Meus apoiadores</h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filtroCampanha}
              onChange={(e) => setFiltroCampanha(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="todos">Filtro: Todos</option>
              {campanhasFiltro.map(({ id, nome }) => (
                <option key={id} value={id}>
                  {nome}
                </option>
              ))}
            </select>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm w-40 sm:w-48 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <button
              type="button"
              onClick={exportarCsv}
              disabled={filtrados.length === 0}
              className="p-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Exportar CSV"
            >
              <ArrowUpFromLine className="w-5 h-5" />
            </button>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : erro ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-red-600">
            {erro}
          </div>
        ) : filtrados.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center text-gray-500">
            <p>Nenhum apoiador encontrado.</p>
            <p className="text-sm mt-2">
              {apoiadores.length === 0
                ? "As compras confirmadas (pagas ou simuladas) aparecerão aqui."
                : "Tente outro filtro ou termo de busca."}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {listaPaginada.map((a) => (
                <button
                  type="button"
                  key={`${a.cpf}-${a.email}`}
                  onClick={() => setDetalhe(a)}
                  className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 text-left hover:shadow-md hover:border-gray-300 transition-all"
                >
                  <p className="font-semibold text-gray-900 mb-3 truncate" title={a.nome}>
                    {a.nome}
                  </p>
                  {a.telefone ? (
                    <div className="flex items-center gap-2 text-gray-700 mb-2">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#25D366]/10 shrink-0">
                        <svg className="w-3.5 h-3.5 text-[#25D366]" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                      </span>
                      <span className="text-sm truncate">{formatarTelefone(a.telefone)}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-gray-400 mb-2">
                      <Phone className="w-4 h-4 shrink-0" />
                      <span className="text-sm">—</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-gray-700">
                    <Mail className="w-4 h-4 text-red-500 shrink-0" />
                    <span className="text-sm truncate">{a.email}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Paginação */}
            {totalPaginas > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  type="button"
                  onClick={() => setPagina((p) => Math.max(1, p - 1))}
                  disabled={paginaAtual <= 1}
                  className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Página anterior"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-1">
                  {(() => {
                    const paginas: (number | "ellipsis")[] = [];
                    if (totalPaginas <= 7) {
                      for (let i = 1; i <= totalPaginas; i++) paginas.push(i);
                    } else {
                      paginas.push(1);
                      if (paginaAtual > 3) paginas.push("ellipsis");
                      const meio = new Set<number>();
                      for (let i = paginaAtual - 1; i <= paginaAtual + 1; i++) {
                        if (i >= 2 && i <= totalPaginas - 1) meio.add(i);
                      }
                      [...meio].sort((a, b) => a - b).forEach((n) => paginas.push(n));
                      if (paginaAtual < totalPaginas - 2) paginas.push("ellipsis");
                      if (totalPaginas > 1) paginas.push(totalPaginas);
                    }
                    return paginas.map((n, idx) =>
                      n === "ellipsis" ? (
                        <span key={`e-${idx}`} className="px-1 text-gray-500">…</span>
                      ) : (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setPagina(n)}
                          className={`min-w-[2.25rem] py-2 px-2 rounded-lg text-sm font-medium ${
                            n === paginaAtual
                              ? "bg-primary text-white"
                              : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          {n}
                        </button>
                      )
                    );
                  })()}
                </div>
                <button
                  type="button"
                  onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                  disabled={paginaAtual >= totalPaginas}
                  className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed rotate-180"
                  aria-label="Próxima página"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal detalhe do apoiador */}
      {detalhe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 sm:p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Dados do apoiador</h2>
              <button
                type="button"
                onClick={() => setDetalhe(null)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 sm:p-6 overflow-y-auto flex-1">
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-gray-700">
                  <User className="w-5 h-5 text-gray-400 shrink-0" />
                  <span><strong>Nome:</strong> {detalhe.nome}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <Hash className="w-5 h-5 text-gray-400 shrink-0" />
                  <span><strong>CPF:</strong> {formatarCpf(detalhe.cpf)}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <Mail className="w-5 h-5 text-gray-400 shrink-0" />
                  <span><strong>E-mail:</strong> {detalhe.email}</span>
                </div>
                {detalhe.telefone && (
                  <div className="flex items-center gap-3 text-gray-700">
                    <Phone className="w-5 h-5 text-gray-400 shrink-0" />
                    <span><strong>Telefone:</strong> {formatarTelefone(detalhe.telefone)}</span>
                  </div>
                )}
              </div>

              <p className="text-sm font-semibold text-gray-700 mb-3">Números por campanha</p>
              <div className="space-y-4">
                {(() => {
                  const agrupadas = new Map<
                    string,
                    {
                      campanhaId: string;
                      campanhaNome: string;
                      numeros: string[];
                      valorTotal: number;
                      quantidade: number;
                    }
                  >();

                  const toArray = (n: string[] | string | undefined): string[] =>
                    Array.isArray(n) ? n : typeof n === "string" ? n.split(",").map((s) => s.trim()).filter(Boolean) : [];

                  detalhe.compras.forEach((c) => {
                    const nums = toArray(c.numeros);
                    const existente = agrupadas.get(c.campanhaId);
                    if (existente) {
                      existente.valorTotal += c.valorTotal;
                      existente.quantidade += c.quantidade;
                      existente.numeros.push(...nums);
                    } else {
                      agrupadas.set(c.campanhaId, {
                        campanhaId: c.campanhaId,
                        campanhaNome: c.campanhaNome,
                        numeros: [...nums],
                        valorTotal: c.valorTotal,
                        quantidade: c.quantidade,
                      });
                    }
                  });

                  return Array.from(agrupadas.values()).map((c) => (
                    <div
                      key={c.campanhaId}
                      className="p-4 rounded-xl bg-gray-50 border border-gray-200"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Link
                          href={`/campanhas/${c.campanhaId}`}
                          className="font-medium text-gray-900 hover:text-primary hover:underline"
                          onClick={() => setDetalhe(null)}
                        >
                          {c.campanhaNome}
                        </Link>
                        <span className="text-sm font-semibold text-gray-700">
                          {formatarMoeda(c.valorTotal)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        {c.quantidade} número(s):
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {c.numeros.map((num) => (
                          <span
                            key={num}
                            className="inline-flex items-center justify-center min-w-[4.5rem] w-auto px-4 py-2.5 rounded-lg border border-gray-200 bg-white font-mono text-sm font-semibold text-gray-800 shadow-sm"
                          >
                            {formatarNumeroCota(num)}
                          </span>
                        ))}
                      </div>
                    </div>
                  ));
                })()}
              </div>
              <p className="mt-4 text-sm text-gray-600">
                <strong>Total gasto:</strong> {formatarMoeda(detalhe.totalGasto)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
