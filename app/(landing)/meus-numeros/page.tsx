"use client";

import { useState } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import { Ticket, Mail, Hash, ArrowRight, ExternalLink, RefreshCw, Gift } from "lucide-react";
import { formatarMoeda } from "@/lib/taxas";
import { formatarNumeroCota } from "@/lib/formatadores";

type CompraItem = {
  campanhaId: string;
  campanhaNome: string;
  numeros: string[];
  valorTotal: number;
  quantidadeTotal: number;
};

type Totais = {
  campanhas: number;
  cotas: number;
  valorTotal: number;
};

export default function MeusNumerosPage() {
  const [cpf, setCpf] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [compras, setCompras] = useState<CompraItem[]>([]);
  const [totais, setTotais] = useState<Totais | null>(null);
  const [buscado, setBuscado] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    const cpfNumeros = cpf.replace(/\D/g, "");
    if (cpfNumeros.length !== 11) {
      setErro("Digite um CPF válido (11 números).");
      return;
    }
    if (!email.trim()) {
      setErro("Digite seu e-mail.");
      return;
    }

    setLoading(true);
    setCompras([]);
    setTotais(null);
    setBuscado(false);
    try {
      const res = await fetch("/api/compras/meus-numeros", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cpf: cpfNumeros, email: email.trim().toLowerCase() }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErro((data as { error?: string }).error ?? "Não foi possível buscar seus números.");
        setLoading(false);
        return;
      }

      const list = (data as { compras?: CompraItem[] }).compras ?? [];
      const tot = (data as { totais?: Totais }).totais ?? null;
      setCompras(list);
      setTotais(tot);
      setBuscado(true);
    } catch {
      setErro("Erro ao buscar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const temResultados = buscado && compras.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col">
      <header className="border-b border-gray-200/80 bg-white/90 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14 sm:h-16 gap-2">
          <Logo href="/" size="xs" className="shrink-0" />
          <Link
            href="/"
            className="text-sm text-gray-600 hover:text-gray-900 font-medium"
          >
            Voltar ao início
          </Link>
        </div>
      </header>

      <main className="flex-1 px-4 py-8 sm:py-12">
        <div className="max-w-3xl mx-auto">
          {/* Estado: formulário de busca (quando não tem resultados ou ainda não buscou) */}
          {!temResultados && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Ticket className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Meus números</h1>
                  <p className="text-sm text-gray-500">Área do comprador</p>
                </div>
              </div>
              <p className="text-gray-600 mb-6 text-sm">
                Já comprou? Digite seu CPF e e-mail para ver os números das suas cotas.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                {erro && (
                  <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">
                    {erro}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">CPF</label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={cpf}
                      onChange={(e) => setCpf(e.target.value.replace(/\D/g, "").slice(0, 11))}
                      placeholder="Somente números (11 dígitos)"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">E-mail</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary text-white font-semibold hover:bg-primary-dark disabled:opacity-60 transition-colors"
                >
                  {loading ? "Buscando..." : "Ver meus números"}
                  <ArrowRight className="w-5 h-5" />
                </button>
              </form>

              {buscado && compras.length === 0 && (
                <div className="mt-6 p-4 rounded-xl bg-amber-50 border border-amber-200">
                  <p className="text-sm text-amber-800">
                    Nenhuma compra encontrada com este CPF e e-mail. Compras confirmadas (pagas ou simuladas) aparecerão aqui.
                  </p>
                </div>
              )}

              <p className="mt-6 text-center text-gray-500 text-sm">
                É organizador de rifa?{" "}
                <Link href="/login" className="text-primary font-medium hover:underline">
                  Entrar no painel
                </Link>
              </p>
            </div>
          )}

          {/* Estado: tela personalizada com resultados */}
          {temResultados && (
            <div className="space-y-6">
              {/* Resumo geral */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Ticket className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h1 className="text-xl font-bold text-gray-900">Suas cotas</h1>
                      <p className="text-sm text-gray-500">Resumo das suas participações</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setCompras([]);
                      setTotais(null);
                      setBuscado(false);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Consultar outro CPF/e-mail
                  </button>
                </div>

                {totais && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Campanhas</p>
                      <p className="text-2xl font-bold text-gray-900 mt-0.5">{totais.campanhas}</p>
                    </div>
                    <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total de cotas</p>
                      <p className="text-2xl font-bold text-gray-900 mt-0.5">{totais.cotas}</p>
                    </div>
                    <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 col-span-2 sm:col-span-1">
                      <p className="text-xs font-medium text-primary/80 uppercase tracking-wide">Valor total</p>
                      <p className="text-2xl font-bold text-primary mt-0.5">
                        R$ {formatarMoeda(totais.valorTotal)}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Cards por campanha */}
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Gift className="w-5 h-5 text-primary" />
                  Cotas por campanha
                </h2>

                {compras.map((c) => (
                  <div
                    key={c.campanhaId}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
                  >
                    <div className="p-4 sm:p-6 border-b border-gray-100 bg-gray-50/50">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <h3 className="font-bold text-gray-900 text-lg leading-tight">
                          {c.campanhaNome}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                            {c.numeros.length} cota{c.numeros.length !== 1 ? "s" : ""}
                          </span>
                          {c.valorTotal > 0 && (
                            <span className="text-sm font-semibold text-gray-700">
                              R$ {formatarMoeda(c.valorTotal)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="p-4 sm:p-6">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
                        Números das suas cotas
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

                      <Link
                        href={`/rifa/${c.campanhaId}`}
                        className="inline-flex items-center gap-2 mt-4 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-colors"
                      >
                        Ver campanha
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer organizador */}
              <div className="text-center py-4">
                <p className="text-gray-500 text-sm">
                  É organizador de rifa?{" "}
                  <Link href="/login" className="text-primary font-medium hover:underline">
                    Entrar no painel
                  </Link>
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
