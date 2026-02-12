"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { ArrowLeft, Dices, Play, Trophy, X, Loader2 } from "lucide-react";
import { obterCampanha, Campanha } from "@/lib/api";

export default function RealizarSorteioPage() {
  const params = useParams();
  const id = params.id as string;
  const [campanha, setCampanha] = useState<Campanha | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [passo, setPasso] = useState<1 | 2>(1);
  const [numeroVencedor, setNumeroVencedor] = useState("");
  const [ganhador, setGanhador] = useState<string | null>(null);
  const [loadingGanhador, setLoadingGanhador] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [mostrarComoFunciona, setMostrarComoFunciona] = useState(false);

  useEffect(() => {
    async function carregar() {
      setLoading(true);
      setErro(null);
      try {
        const data = await obterCampanha(id);
        setCampanha(data);
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Erro ao carregar campanha");
      } finally {
        setLoading(false);
      }
    }
    carregar();
  }, [id]);

  const buscarGanhador = useCallback(
    async (numero: string) => {
      const n = numero.replace(/\D/g, "").trim();
      if (!n || !id) {
        setGanhador(null);
        return;
      }
      setLoadingGanhador(true);
      setGanhador(null);
      try {
        const res = await fetch(
          `/api/campanhas/${id}/sorteio/ganhador?numero=${encodeURIComponent(n)}`
        );
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.ganhador) {
          setGanhador(data.ganhador);
        } else {
          setGanhador(null);
        }
      } catch {
        setGanhador(null);
      } finally {
        setLoadingGanhador(false);
      }
    },
    [id]
  );

  useEffect(() => {
    if (!numeroVencedor.trim()) {
      setGanhador(null);
      return;
    }
    const t = setTimeout(() => {
      buscarGanhador(numeroVencedor);
    }, 400);
    return () => clearTimeout(t);
  }, [numeroVencedor, buscarGanhador]);

  const premioPrincipal =
    campanha?.premios?.trim().split("\n").filter(Boolean)[0] ||
    "Prêmio desta campanha";

  const handleContinuar = () => {
    if (numeroVencedor.trim()) setPasso(2);
  };

  const handleConfirmar = async () => {
    setConfirmando(true);
    try {
      await new Promise((r) => setTimeout(r, 600));
      setSucesso(true);
      setTimeout(() => {
        setPasso(1);
        setNumeroVencedor("");
        setGanhador(null);
        setSucesso(false);
      }, 2000);
    } finally {
      setConfirmando(false);
    }
  };

  const handleCancelar = () => {
    setPasso(1);
    setNumeroVencedor("");
    setGanhador(null);
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[40vh]">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
        <p className="text-gray-500">Carregando...</p>
      </div>
    );
  }

  if (erro || !campanha) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
        <Link
          href={`/campanhas/${id}`}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Link>
        <p className="text-red-600 font-medium">{erro ?? "Campanha não encontrada"}</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <Link
        href={`/campanhas/${id}`}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 font-medium hover:bg-gray-50 mb-6 shadow-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar para gerenciar campanha
      </Link>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 sm:p-8 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Dices className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Realizar sorteio</h1>
          </div>
        </div>

        <div className="p-6 sm:p-8">
          <button
            type="button"
            onClick={() => setMostrarComoFunciona(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-primary/40 text-primary text-sm font-medium hover:bg-primary/5 mb-6"
          >
            <Play className="w-4 h-4" />
            Ver como funciona
          </button>

          {passo === 1 ? (
            <>
              <p className="text-sm font-semibold text-gray-700 mb-1">Prêmio</p>
              <p className="text-lg font-bold text-gray-900 mb-6">{premioPrincipal}</p>

              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número vencedor
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={numeroVencedor}
                onChange={(e) => setNumeroVencedor(e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="Ex.: 1458"
                className="w-full max-w-xs px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent text-lg font-mono"
              />

              <div className="mt-4 min-h-[2.5rem]">
                {loadingGanhador && numeroVencedor.trim() ? (
                  <p className="text-sm text-gray-500 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Consultando...
                  </p>
                ) : numeroVencedor.trim() && ganhador ? (
                  <p className="text-base font-semibold text-green-700">
                    Ganhador: {ganhador}
                  </p>
                ) : numeroVencedor.trim() && !loadingGanhador ? (
                  <p className="text-sm text-amber-700">
                    Nenhum comprador encontrado para esta cota.
                  </p>
                ) : null}
              </div>

              <div className="mt-8">
                <button
                  type="button"
                  onClick={handleContinuar}
                  disabled={!numeroVencedor.trim()}
                  className="w-full sm:w-auto px-8 py-3 rounded-xl bg-primary hover:bg-primary-dark text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Continuar
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-gray-700 mb-1">Prêmio</p>
              <p className="text-lg font-bold text-gray-900 mb-4">{premioPrincipal}</p>

              <div className="rounded-xl border-2 border-green-200 bg-green-50/80 p-4 flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                  <Trophy className="w-5 h-5 text-green-700" />
                </div>
                <div>
                  <p className="font-mono font-bold text-gray-900 text-lg">{numeroVencedor}</p>
                  <p className="text-gray-700 font-medium">{ganhador ?? "Cota não vendida"}</p>
                </div>
              </div>

              {sucesso ? (
                <p className="text-green-600 font-semibold mb-4">Sorteio registrado com sucesso!</p>
              ) : (
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleCancelar}
                    disabled={confirmando}
                    className="flex-1 sm:flex-none px-6 py-3 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmar}
                    disabled={confirmando}
                    className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-primary hover:bg-primary-dark text-white font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {confirmando ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Confirmando...
                      </>
                    ) : (
                      "Confirmar"
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal Ver como funciona */}
      {mostrarComoFunciona && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 relative">
            <button
              type="button"
              onClick={() => setMostrarComoFunciona(false)}
              className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 rounded-lg"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold text-gray-900 mb-3">Como funciona</h2>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
              <li>Informe o número da cota sorteada (ex.: resultado da Loteria Federal).</li>
              <li>O sistema mostra automaticamente o nome de quem comprou essa cota.</li>
              <li>Clique em <strong>Continuar</strong> e depois em <strong>Confirmar</strong> para registrar o sorteio.</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
