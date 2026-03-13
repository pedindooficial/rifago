"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Eye, Gift, Percent, ChevronDown, Ticket } from "lucide-react";
import { obterCampanha, Campanha } from "@/lib/api";
import { formatarMoeda } from "@/lib/taxas";
import { parsePromocaoFromString } from "@/lib/promocao";

export default function VisualizarCampanha() {
  const params = useParams();
  const [campanha, setCampanha] = useState<Campanha | null>(null);
  const [loading, setLoading] = useState(true);
  const [regulamentoAberto, setRegulamentoAberto] = useState(false);

  useEffect(() => {
    async function carregar() {
      try {
        const data = await obterCampanha(params.id as string);
        setCampanha(data);
      } catch (error) {
        console.error("Erro ao carregar campanha:", error);
      } finally {
        setLoading(false);
      }
    }
    carregar();
  }, [params.id]);

  const titulosVendidos = 0;
  const percentualVendido =
    campanha && campanha.quantidadeTitulos > 0
      ? Math.round((titulosVendidos / campanha.quantidadeTitulos) * 100)
      : 0;
  const promocoes = campanha ? parsePromocaoFromString(campanha.promocao) : [];
  const premiosList = campanha?.premios?.trim() ? campanha.premios.split("\n").filter(Boolean) : [];

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

  const mostrarProgresso =
    campanha.status === "ativa" && campanha.progressoVisivel;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Header: Pré-visualização */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-2 text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">
            <Eye className="w-5 h-5 shrink-0" />
            <span className="text-sm font-medium">Pré-visualização — como o participante vê</span>
          </div>
          <Link
            href={`/campanhas/${campanha.id}`}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-medium text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para gerenciar
          </Link>
        </div>

        {/* Conteúdo: visão pública */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Imagem + título */}
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
              {campanha.status === "rascunho" && (
                <span className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium bg-amber-400/90 text-amber-900">
                  Em breve
                </span>
              )}
              {campanha.status === "pausada" && (
                <span className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium bg-amber-500/90 text-white">
                  Pausada
                </span>
              )}
              {campanha.status === "finalizada" && (
                <span className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium bg-gray-500/90 text-white">
                  Encerrada
                </span>
              )}
            </div>
          </div>

          <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            {/* Progresso (se ativa/pausada e visível) */}
            {mostrarProgresso && (
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                <p className="text-sm font-medium text-gray-700 mb-2">Em andamento</p>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden mb-2">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${percentualVendido}%` }}
                  />
                </div>
                <p className="text-sm text-gray-600">
                  {percentualVendido}% vendido · {titulosVendidos.toLocaleString("pt-BR")} de{" "}
                  {campanha.quantidadeTitulos.toLocaleString("pt-BR")} cotas
                </p>
              </div>
            )}

            {/* Valor da cota */}
            <div className="flex flex-wrap items-center gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Valor da cota</p>
                <p className="text-2xl font-bold text-gray-900">
                  R$ {formatarMoeda(campanha.valorPorTitulo ?? 0)}
                </p>
              </div>
              {campanha.status === "ativa" && (
                <Link
                  href="#"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-semibold text-sm transition-colors"
                >
                  <Ticket className="w-4 h-4" />
                  Comprar cota
                </Link>
              )}
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
          </div>
        </div>
      </div>
    </div>
  );
}
