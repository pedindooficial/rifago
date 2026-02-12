"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Filter, MapPin, Clock } from "lucide-react";
import { listarCampanhas, Campanha } from "@/lib/api";

export default function MinhasCampanhas() {
  const [campanhas, setCampanhas] = useState<Campanha[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagina, setPagina] = useState(1);
  const itensPorPagina = 6;

  useEffect(() => {
    async function carregar() {
      try {
        const data = await listarCampanhas();
        setCampanhas(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    carregar();
  }, []);

  const totalPaginas = Math.max(1, Math.ceil(campanhas.length / itensPorPagina));
  const campanhasPagina = campanhas.slice(
    (pagina - 1) * itensPorPagina,
    pagina * itensPorPagina
  );

  const statusTag = (c: Campanha) => {
    if (c.status === "ativa") return { label: "Ativa", className: "bg-green-100 text-green-800" };
    if (c.status === "finalizada") return { label: "Finalizada", className: "bg-gray-100 text-gray-800" };
    return { label: "Pendente", className: "bg-amber-100 text-amber-800" };
  };

  const percentualVendido = (c: Campanha) => {
    const vendidos = c.titulosVendidos ?? 0;
    if (!c.quantidadeTitulos || c.quantidadeTitulos <= 0) return 0;
    return Math.round((vendidos / c.quantidadeTitulos) * 100);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MapPin className="w-6 h-6 text-primary" />
            Campanhas
          </h1>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium"
            >
              <Filter className="w-4 h-4" />
              Filtros
            </button>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Carregando...</div>
        ) : campanhas.length === 0 ? (
          <div className="text-center py-12 text-gray-500 bg-white rounded-xl shadow-sm">
            <p>Nenhuma campanha.</p>
            <Link href="/campanhas/criar" className="text-primary font-medium mt-2 inline-block">
              Criar campanha
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {campanhasPagina.map((c) => {
                const tag = statusTag(c);
                const percentual = percentualVendido(c);
                const emAndamento = c.status === "ativa";
                return (
                  <Link
                    key={c.id}
                    href={`/campanhas/${c.id}`}
                    className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md hover:border-primary/30 transition-all flex min-w-0"
                  >
                    <div className="w-24 sm:w-28 flex-shrink-0 bg-gray-200">
                      {c.imagemUrl ? (
                        <img
                          src={c.imagemUrl}
                          alt={c.nome}
                          className="w-full h-full object-cover aspect-square sm:aspect-[4/3]"
                        />
                      ) : (
                        <div className="w-full h-full min-h-[100px] flex items-center justify-center text-gray-400">
                          <MapPin className="w-8 h-8" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 p-3 sm:p-4 flex flex-col justify-center">
                      <h3 className="font-semibold text-gray-900 truncate text-sm sm:text-base" title={c.nome}>
                        {c.nome}
                      </h3>
                      <span
                        className={`inline-flex items-center w-fit mt-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${tag.className}`}
                      >
                        {tag.label}
                      </span>
                      {c.status === "rascunho" && (
                        <p className="mt-2 text-xs text-gray-600 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 shrink-0" />
                          Faça a publicação da sua campanha em 3 dias ou ela vai expirar
                        </p>
                      )}
                      {emAndamento && (
                        <div className="mt-2 space-y-1">
                          <p className="text-xs font-medium text-gray-700">Em andamento</p>
                          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all"
                              style={{ width: `${percentual}%` }}
                            />
                          </div>
                          <p className="text-xs text-gray-600">
                            {percentual}% vendido ·{" "}
                            {(c.titulosVendidos ?? 0).toLocaleString("pt-BR")} de{" "}
                            {c.quantidadeTitulos.toLocaleString("pt-BR")}
                          </p>
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>

            {totalPaginas > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setPagina((p) => Math.max(1, p - 1))}
                  disabled={pagina <= 1}
                  className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Página anterior"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <span className="px-4 py-2 border border-primary bg-primary/10 text-primary font-semibold rounded-lg">
                  {pagina}
                </span>
                <button
                  type="button"
                  onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                  disabled={pagina >= totalPaginas}
                  className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Próxima página"
                >
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
