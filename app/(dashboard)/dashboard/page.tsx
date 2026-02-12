"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  LayoutDashboard,
  Banknote,
  Ticket,
  Users,
  FolderOpen,
  TrendingUp,
  Loader2,
  ShoppingBag,
  Calendar,
} from "lucide-react";
import { listarCampanhas, Campanha } from "@/lib/api";
import { formatarMoeda } from "@/lib/taxas";

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

function formatarData(iso: string): string {
  try {
    const d = new Date(iso);
    const hoje = new Date();
    const ontem = new Date(hoje);
    ontem.setDate(ontem.getDate() - 1);
    if (d.toDateString() === hoje.toDateString()) {
      return `Hoje, ${d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
    }
    if (d.toDateString() === ontem.toDateString()) {
      return `Ontem, ${d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
    }
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

export default function DashboardPage() {
  const [campanhas, setCampanhas] = useState<Campanha[]>([]);
  const [apoiadores, setApoiadores] = useState<Apoiador[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    async function carregar() {
      setLoading(true);
      setErro(null);
      try {
        const [dataCampanhas, resApoiadores] = await Promise.all([
          listarCampanhas(),
          fetch("/api/apoiadores").then((r) => (r.ok ? r.json() : { apoiadores: [] })),
        ]);
        setCampanhas(dataCampanhas ?? []);
        setApoiadores((resApoiadores as { apoiadores?: Apoiador[] }).apoiadores ?? []);
      } catch (error) {
        console.error("Erro ao carregar dashboard:", error);
        setErro("Erro ao carregar dados.");
      } finally {
        setLoading(false);
      }
    }
    carregar();
  }, []);

  const totalArrecadado = campanhas.reduce((s, c) => s + (c.valorArrecadado ?? 0), 0);
  const totalVendidos = campanhas.reduce((s, c) => s + (c.titulosVendidos ?? 0), 0);
  const campanhasAtivas = campanhas.filter((c) => c.status === "ativa").length;

  const ultimasCompras: { nome: string; campanhaNome: string; valorTotal: number; createdAt: string }[] = [];
  apoiadores.forEach((a) => {
    a.compras.forEach((c) => {
      ultimasCompras.push({
        nome: a.nome,
        campanhaNome: c.campanhaNome,
        valorTotal: c.valorTotal,
        createdAt: c.createdAt,
      });
    });
  });
  ultimasCompras.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const ultimas10 = ultimasCompras.slice(0, 10);

  const tiposSorteio: Record<string, string> = {
    "loteria-federal": "Loteria Federal",
    sorteador: "Sorteador",
    "deu-no-poste": "Deu no Poste",
    organizador: "Organizador",
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (erro) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto text-center py-12 text-red-600 font-medium">{erro}</div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <LayoutDashboard className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-500">Visão geral das suas campanhas e vendas</p>
          </div>
        </div>

        {/* Cards de estatísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total arrecadado</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  R$ {formatarMoeda(totalArrecadado)}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <Banknote className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Compras pagas e simuladas</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Cotas vendidas</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {totalVendidos.toLocaleString("pt-BR")}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Ticket className="w-6 h-6 text-primary" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Em todas as campanhas</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Apoiadores (clientes)</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {apoiadores.length.toLocaleString("pt-BR")}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <Link
              href="/apoiadores"
              className="text-xs text-primary font-medium hover:underline mt-2 inline-block"
            >
              Ver apoiadores →
            </Link>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Campanhas ativas</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{campanhasAtivas}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-amber-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              de {campanhas.length} total
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Últimas compras */}
          <div className="lg:col-span-1 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-gray-500" />
                Últimas compras
              </h2>
              {ultimas10.length > 0 && (
                <Link
                  href="/apoiadores"
                  className="text-xs text-primary font-medium hover:underline"
                >
                  Ver todos
                </Link>
              )}
            </div>
            <div className="p-4 max-h-[320px] overflow-y-auto">
              {ultimas10.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-6">
                  Nenhuma compra ainda. As vendas aparecerão aqui.
                </p>
              ) : (
                <ul className="space-y-3">
                  {ultimas10.map((c, i) => (
                    <li
                      key={`${c.nome}-${c.campanhaNome}-${c.createdAt}-${i}`}
                      className="flex flex-col gap-0.5 py-2 border-b border-gray-100 last:border-0"
                    >
                      <p className="font-medium text-gray-900 text-sm truncate" title={c.nome}>
                        {c.nome}
                      </p>
                      <p className="text-xs text-gray-600 truncate" title={c.campanhaNome}>
                        {c.campanhaNome}
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-sm font-semibold text-green-700">
                          R$ {formatarMoeda(c.valorTotal)}
                        </span>
                        <span className="text-xs text-gray-400 flex items-center gap-0.5">
                          <Calendar className="w-3 h-3" />
                          {formatarData(c.createdAt)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Campanhas */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-gray-500" />
                Suas campanhas
              </h2>
              <Link
                href="/campanhas"
                className="text-xs text-primary font-medium hover:underline"
              >
                Ver todas →
              </Link>
            </div>
            <div className="p-4">
              {campanhas.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <FolderOpen className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <p>Nenhuma campanha criada ainda.</p>
                  <Link
                    href="/campanhas/criar"
                    className="inline-block mt-3 text-primary font-medium hover:underline"
                  >
                    Criar primeira campanha
                  </Link>
                </div>
              ) : (
                <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {campanhas.slice(0, 4).map((campanha) => (
                    <Link
                      key={campanha.id}
                      href={`/campanhas/${campanha.id}`}
                      className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-md hover:border-primary/30 transition-all min-w-0 group"
                    >
                      <div className="aspect-video bg-gray-100 relative flex-shrink-0">
                        {campanha.imagemUrl ? (
                          <img
                            src={campanha.imagemUrl}
                            alt={campanha.nome}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <Ticket className="w-8 h-8" />
                          </div>
                        )}
                        <span
                          className={`absolute top-2 right-2 inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                            campanha.status === "ativa"
                              ? "bg-green-100 text-green-800"
                              : campanha.status === "finalizada"
                              ? "bg-gray-100 text-gray-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {campanha.status === "ativa"
                            ? "Ativa"
                            : campanha.status === "finalizada"
                            ? "Finalizada"
                            : "Rascunho"}
                        </span>
                      </div>
                      <div className="p-3 min-w-0">
                        <h3
                          className="font-semibold text-gray-900 text-sm mb-2 truncate group-hover:text-primary transition-colors"
                          title={campanha.nome}
                        >
                          {campanha.nome}
                        </h3>
                        <p className="text-xs text-gray-500 mb-2">
                          {tiposSorteio[campanha.tipoSorteio] || campanha.tipoSorteio}
                        </p>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-600">
                            {(campanha.titulosVendidos ?? 0).toLocaleString("pt-BR")} vendidas
                          </span>
                          <span className="font-semibold text-gray-900">
                            R$ {formatarMoeda(campanha.valorArrecadado ?? 0)}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center text-primary text-xs font-medium group-hover:underline">
                          Ver detalhes
                          <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
                {campanhas.length > 4 && (
                  <div className="mt-4 text-center">
                    <Link
                      href="/campanhas"
                      className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                    >
                      Ver todas as {campanhas.length} campanhas
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Acesso rápido */}
        <div className="mt-8 p-4 rounded-2xl bg-gray-50 border border-gray-200">
          <p className="text-sm font-medium text-gray-700 mb-3">Acesso rápido</p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/campanhas/criar"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white font-medium text-sm hover:bg-primary-dark transition-colors"
            >
              <FolderOpen className="w-4 h-4" />
              Criar campanha
            </Link>
            <Link
              href="/campanhas"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-700 font-medium text-sm hover:bg-gray-50 transition-colors"
            >
              Minhas campanhas
            </Link>
            <Link
              href="/apoiadores"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-700 font-medium text-sm hover:bg-gray-50 transition-colors"
            >
              <Users className="w-4 h-4" />
              Meus apoiadores
            </Link>
            <Link
              href="/configuracao"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-700 font-medium text-sm hover:bg-gray-50 transition-colors"
            >
              Configuração
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
