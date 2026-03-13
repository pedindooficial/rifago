"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowUpDown, Loader2, ArrowDown, ArrowUp, Ticket } from "lucide-react";
import { formatarMoeda } from "@/lib/taxas";

type StatusCompra = "pendente" | "paga" | "simulada" | "cancelada";

type TituloResumo = {
  numero: string | null;
  compradorNome: string | null;
  quantidade: number | null;
  valorTotal: number | null;
  status: StatusCompra | null;
  createdAt: string | null;
  numerosCompra?: string[] | null;
};

type MaiorMenorData = {
  menorTitulo: TituloResumo | null;
  maiorTitulo: TituloResumo | null;
  quantidadeTitulosVendidos: number;
  quantidadeTitulosCampanha: number;
};

export default function MaiorMenorTituloPage() {
  const params = useParams();
  const id = params.id as string;
  const [data, setData] = useState<MaiorMenorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [mostrarMenor, setMostrarMenor] = useState(true);
  const [mostrarMaior, setMostrarMaior] = useState(true);
  const [dataInicio, setDataInicio] = useState<string>("");
  const [dataFim, setDataFim] = useState<string>("");
  const [carregandoBusca, setCarregandoBusca] = useState(false);
  const [expandido, setExpandido] = useState<"menor" | "maior" | null>(null);

  async function buscar(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setLoading(true);
    setCarregandoBusca(true);
    setErro(null);
    try {
      const params = new URLSearchParams();
      if (dataInicio) params.set("dataInicio", dataInicio);
      if (dataFim) params.set("dataFim", dataFim);
      const qs = params.toString();
      const url = qs
        ? `/api/campanhas/${id}/maior-menor-titulo?${qs}`
        : `/api/campanhas/${id}/maior-menor-titulo`;
      const res = await fetch(url);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? "Erro ao carregar dados");
      }
      const json = (await res.json()) as MaiorMenorData;
      setData(json);
      setExpandido(null);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao carregar dados");
      setData(null);
    } finally {
      setLoading(false);
      setCarregandoBusca(false);
    }
  }

  useEffect(() => {
    // carga inicial sem filtro de data
    // eslint-disable-next-line react-hooks/exhaustive-deps
    buscar();
  }, [id]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <Link
        href={`/campanhas/${id}`}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-300 transition-colors mb-6 shadow-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar para gerenciar campanha
      </Link>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 sm:p-8 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <ArrowUpDown className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Maior e Menor título</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Consulte o maior e o menor título/cota desta campanha (vendidos ou reservados).
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="text-sm text-gray-500">Carregando...</p>
          </div>
        ) : erro ? (
          <div className="p-8 text-center">
            <p className="text-red-600 font-medium">{erro}</p>
          </div>
        ) : data && (data.menorTitulo != null || data.maiorTitulo != null) ? (
          <div className="p-6 sm:p-8">
            <form
              onSubmit={buscar}
              className="mb-6 space-y-4 border-b border-gray-100 pb-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-700">Filtrar por período</p>
                  <p className="text-xs text-gray-500">
                    Escolha uma data inicial e final para considerar apenas compras nesse intervalo.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Data inicial
                    </label>
                    <input
                      type="date"
                      value={dataInicio}
                      onChange={(e) => setDataInicio(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Data final
                    </label>
                    <input
                      type="date"
                      value={dataFim}
                      onChange={(e) => setDataFim(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-gray-700">Busca por:</p>
                  <p className="text-xs text-gray-500">
                    Escolha se quer ver menor, maior título ou ambos.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                      checked={mostrarMenor}
                      onChange={(e) => setMostrarMenor(e.target.checked)}
                    />
                    <span>Menor título</span>
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                      checked={mostrarMaior}
                      onChange={(e) => setMostrarMaior(e.target.checked)}
                    />
                    <span>Maior título</span>
                  </label>
                </div>
              </div>
              <div className="pt-1">
                <button
                  type="submit"
                  disabled={carregandoBusca}
                  className="w-full inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-dark disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
                >
                  {carregandoBusca ? "Buscando..." : "Buscar"}
                </button>
              </div>
            </form>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {mostrarMenor && data.menorTitulo && (
                <button
                  type="button"
                  onClick={() =>
                    setExpandido((prev) => (prev === "menor" ? null : "menor"))
                  }
                  className={`rounded-xl border-2 bg-gray-50/50 p-6 text-center transition-colors ${
                    expandido === "menor"
                      ? "border-primary/70 bg-primary/5"
                      : "border-gray-200 hover:border-primary/40 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center justify-center gap-2 text-gray-500 mb-2">
                    <ArrowDown className="w-5 h-5" />
                    <span className="text-sm font-semibold uppercase tracking-wide">Menor título</span>
                  </div>
                  <p className="text-3xl sm:text-4xl font-bold text-gray-900 font-mono tracking-tight">
                    {data.menorTitulo.numero ?? "—"}
                  </p>
                  <div className="mt-3 space-y-1 text-xs text-gray-600 text-left sm:text-center">
                    {data.menorTitulo.compradorNome && (
                      <p className="font-medium text-gray-800">
                        Compra {data.menorTitulo.status === "paga" ? "aprovada" : "reservada"} ·{" "}
                        {data.menorTitulo.compradorNome}
                      </p>
                    )}
                    {data.menorTitulo.quantidade != null && data.menorTitulo.valorTotal != null && (
                      <p>
                        {data.menorTitulo.quantidade} título(s) · R${" "}
                        {formatarMoeda(data.menorTitulo.valorTotal)}
                      </p>
                    )}
                    {data.menorTitulo.createdAt && (
                      <p className="text-[11px] text-gray-500">
                        {new Date(data.menorTitulo.createdAt).toLocaleString("pt-BR")}
                      </p>
                    )}
                    {expandido === "menor" &&
                      data.menorTitulo.numerosCompra &&
                      data.menorTitulo.numerosCompra.length > 0 && (
                        <p className="pt-2 text-[11px] text-gray-600">
                          Números dessa compra:{" "}
                          <span className="font-mono">
                            {data.menorTitulo.numerosCompra.join(", ")}
                          </span>
                        </p>
                      )}
                  </div>
                </button>
              )}
              {mostrarMaior && data.maiorTitulo && (
                <button
                  type="button"
                  onClick={() =>
                    setExpandido((prev) => (prev === "maior" ? null : "maior"))
                  }
                  className={`rounded-xl border-2 bg-gray-50/50 p-6 text-center transition-colors ${
                    expandido === "maior"
                      ? "border-primary/70 bg-primary/5"
                      : "border-gray-200 hover:border-primary/40 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center justify-center gap-2 text-gray-500 mb-2">
                    <ArrowUp className="w-5 h-5" />
                    <span className="text-sm font-semibold uppercase tracking-wide">Maior título</span>
                  </div>
                  <p className="text-3xl sm:text-4xl font-bold text-gray-900 font-mono tracking-tight">
                    {data.maiorTitulo.numero ?? "—"}
                  </p>
                  <div className="mt-3 space-y-1 text-xs text-gray-600 text-left sm:text-center">
                    {data.maiorTitulo.compradorNome && (
                      <p className="font-medium text-gray-800">
                        Compra {data.maiorTitulo.status === "paga" ? "aprovada" : "reservada"} ·{" "}
                        {data.maiorTitulo.compradorNome}
                      </p>
                    )}
                    {data.maiorTitulo.quantidade != null && data.maiorTitulo.valorTotal != null && (
                      <p>
                        {data.maiorTitulo.quantidade} título(s) · R${" "}
                        {formatarMoeda(data.maiorTitulo.valorTotal)}
                      </p>
                    )}
                    {data.maiorTitulo.createdAt && (
                      <p className="text-[11px] text-gray-500">
                        {new Date(data.maiorTitulo.createdAt).toLocaleString("pt-BR")}
                      </p>
                    )}
                    {expandido === "maior" &&
                      data.maiorTitulo.numerosCompra &&
                      data.maiorTitulo.numerosCompra.length > 0 && (
                        <p className="pt-2 text-[11px] text-gray-600">
                          Números dessa compra:{" "}
                          <span className="font-mono">
                            {data.maiorTitulo.numerosCompra.join(", ")}
                          </span>
                        </p>
                      )}
                  </div>
                </button>
              )}
            </div>
            <div className="mt-6 pt-6 border-t border-gray-200 flex flex-wrap items-center gap-4 justify-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary font-medium">
                <Ticket className="w-4 h-4" />
                <span>
                  {data.quantidadeTitulosVendidos.toLocaleString("pt-BR")} de{" "}
                  {data.quantidadeTitulosCampanha.toLocaleString("pt-BR")} cotas vendidas ou reservadas
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 sm:p-12 text-center">
            <p className="text-gray-600 font-medium mb-1">Nenhuma cota vendida ou reservada ainda</p>
            <p className="text-sm text-gray-500">
              Quando houver compras (pagas, simuladas ou pendentes), o menor e o maior título aparecerão aqui.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
