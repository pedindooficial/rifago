"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowUpDown, Loader2, ArrowDown, ArrowUp, Ticket } from "lucide-react";

type MaiorMenorData = {
  menorTitulo: string | null;
  maiorTitulo: string | null;
  quantidadeTitulosVendidos: number;
  quantidadeTitulosCampanha: number;
};

export default function MaiorMenorTituloPage() {
  const params = useParams();
  const id = params.id as string;
  const [data, setData] = useState<MaiorMenorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    async function carregar() {
      setLoading(true);
      setErro(null);
      try {
        const res = await fetch(`/api/campanhas/${id}/maior-menor-titulo`);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error((body as { error?: string }).error ?? "Erro ao carregar dados");
        }
        const json = (await res.json()) as MaiorMenorData;
        setData(json);
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Erro ao carregar dados");
      } finally {
        setLoading(false);
      }
    }
    carregar();
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="rounded-xl border-2 border-gray-200 bg-gray-50/50 p-6 text-center">
                <div className="flex items-center justify-center gap-2 text-gray-500 mb-2">
                  <ArrowDown className="w-5 h-5" />
                  <span className="text-sm font-semibold uppercase tracking-wide">Menor título</span>
                </div>
                <p className="text-3xl sm:text-4xl font-bold text-gray-900 font-mono tracking-tight">
                  {data.menorTitulo ?? "—"}
                </p>
                <p className="text-xs text-gray-500 mt-2">menor cota vendida ou reservada</p>
              </div>
              <div className="rounded-xl border-2 border-gray-200 bg-gray-50/50 p-6 text-center">
                <div className="flex items-center justify-center gap-2 text-gray-500 mb-2">
                  <ArrowUp className="w-5 h-5" />
                  <span className="text-sm font-semibold uppercase tracking-wide">Maior título</span>
                </div>
                <p className="text-3xl sm:text-4xl font-bold text-gray-900 font-mono tracking-tight">
                  {data.maiorTitulo ?? "—"}
                </p>
                <p className="text-xs text-gray-500 mt-2">maior cota vendida ou reservada</p>
              </div>
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
