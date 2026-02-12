"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, BarChart3, Loader2, Trophy, Medal, Award, Ticket, Eye, EyeOff } from "lucide-react";
import { formatarMoeda } from "@/lib/taxas";

type RankingItem = {
  posicao: number;
  nome: string;
  email: string;
  cpf: string;
  valorTotal: number;
  quantidadeNumeros: number;
};

function PosicaoBadge({ posicao }: { posicao: number }) {
  const base = "flex flex-col items-center justify-center gap-0.5 w-12 h-12 rounded-xl font-bold shrink-0";
  if (posicao === 1)
    return (
      <div className={`${base} bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-md shadow-amber-200/50`}>
        <Trophy className="w-5 h-5 text-amber-100" strokeWidth={2.5} />
        <span className="text-lg font-black leading-none">1</span>
      </div>
    );
  if (posicao === 2)
    return (
      <div className={`${base} bg-gradient-to-br from-gray-300 to-gray-500 text-white shadow-md shadow-gray-200/50`}>
        <Medal className="w-5 h-5 text-white/90" strokeWidth={2.5} />
        <span className="text-lg font-black leading-none">2</span>
      </div>
    );
  if (posicao === 3)
    return (
      <div className={`${base} bg-gradient-to-br from-amber-600 to-amber-800 text-white shadow-md shadow-amber-300/30`}>
        <Award className="w-5 h-5 text-amber-200" strokeWidth={2.5} />
        <span className="text-lg font-black leading-none">3</span>
      </div>
    );
  return (
    <div className={`flex items-center justify-center w-12 h-12 rounded-xl font-bold shrink-0 bg-gray-100 text-gray-600 border border-gray-200/80`}>
      {posicao}°
    </div>
  );
}

export default function RankingPage() {
  const params = useParams();
  const id = params.id as string;
  const [ranking, setRanking] = useState<RankingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [rankingVisivel, setRankingVisivel] = useState(false);
  const [savingVisivel, setSavingVisivel] = useState(false);

  useEffect(() => {
    async function carregar() {
      setLoading(true);
      setErro(null);
      try {
        const [resRanking, resCampanha] = await Promise.all([
          fetch(`/api/campanhas/${id}/ranking`),
          fetch(`/api/campanhas/${id}`),
        ]);
        if (!resRanking.ok) {
          const data = await resRanking.json().catch(() => ({}));
          throw new Error((data as { error?: string }).error ?? "Erro ao carregar ranking");
        }
        const dataRanking = (await resRanking.json()) as { ranking: RankingItem[] };
        setRanking(dataRanking.ranking ?? []);
        if (resCampanha.ok) {
          const dataCampanha = (await resCampanha.json()) as { rankingVisivel?: boolean };
          setRankingVisivel(!!dataCampanha.rankingVisivel);
        }
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Erro ao carregar ranking");
      } finally {
        setLoading(false);
      }
    }
    carregar();
  }, [id]);

  async function toggleRankingVisivel() {
    setSavingVisivel(true);
    try {
      const res = await fetch(`/api/campanhas/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rankingVisivel: !rankingVisivel }),
      });
      if (res.ok) setRankingVisivel(!rankingVisivel);
    } finally {
      setSavingVisivel(false);
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl">
      <Link
        href={`/campanhas/${id}`}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-sm mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar para gerenciar campanha
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Ranking</h1>
        <p className="text-gray-600 text-sm sm:text-base mb-4">
          Compradores ordenados por valor total gasto nesta campanha.
        </p>
        <label className="flex items-center gap-3 cursor-pointer group">
          <button
            type="button"
            role="switch"
            aria-checked={rankingVisivel}
            disabled={savingVisivel}
            onClick={toggleRankingVisivel}
            className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 ${
              rankingVisivel ? "bg-primary border-primary" : "bg-gray-200 border-gray-300"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform ${
                rankingVisivel ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
          <span className="flex items-center gap-2 text-sm font-medium text-gray-700 group-hover:text-gray-900">
            {rankingVisivel ? <Eye className="w-4 h-4 text-primary" /> : <EyeOff className="w-4 h-4 text-gray-400" />}
            Deixar o ranking visível para os participantes
          </span>
        </label>
        {rankingVisivel && (
          <p className="text-xs text-gray-500 mt-2">
            O ranking aparecerá na página pública da campanha (rifa) para quem estiver participando.
          </p>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : erro ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-700 font-medium">
          {erro}
        </div>
      ) : ranking.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-gray-50/50 p-12 text-center text-gray-500">
          <BarChart3 className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <p className="font-medium">Nenhuma compra confirmada ainda.</p>
          <p className="text-sm mt-1">As compras (pagas ou simuladas) aparecerão aqui.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {ranking.map((r) => (
            <li
              key={`${r.cpf}-${r.email}`}
              className="flex items-center gap-4 p-4 rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md hover:border-gray-300 transition-all"
            >
              <PosicaoBadge posicao={r.posicao} />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-gray-900 truncate" title={r.nome}>
                  {r.nome}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Total gasto: {formatarMoeda(r.valorTotal)}
                </p>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-100 text-green-800 font-semibold text-sm shrink-0">
                <Ticket className="w-4 h-4 text-green-600" />
                <span>{r.quantidadeNumeros.toLocaleString("pt-BR")}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
