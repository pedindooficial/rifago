"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  Mail,
  Calendar,
  ShieldCheck,
  Loader2,
  FolderOpen,
  ShoppingCart,
  MessageSquare,
  ExternalLink,
  User,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import { formatarMoeda } from "@/lib/taxas";
import { formatarNumeroCota } from "@/lib/formatadores";

type UserItem = {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  twoFactorEnabled: boolean;
};

type CampanhaItem = {
  id: string;
  nome: string;
  status: string;
  quantidadeTitulos: number;
  valorPorTitulo: number;
  createdAt: string;
  tipoSorteio: string;
};

type CompraItem = {
  id: string;
  campanhaId: string;
  campanhaNome: string;
  comprador: { nome: string; cpf: string; email: string; telefone?: string };
  quantidade: number;
  numeros: string[];
  valorTotal: number;
  status: string;
  createdAt: string;
};

type UserDetalhe = {
  user: { id: string; email: string; name: string; createdAt: string; twoFactorEnabled: boolean };
  campanhas: CampanhaItem[];
  compras: CompraItem[];
};

function formatarCpf(cpf: string): string {
  const n = (cpf || "").replace(/\D/g, "");
  if (n.length !== 11) return cpf || "—";
  return n.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

function formatarData(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function formatarDataHora(iso: string): string {
  try {
    return new Date(iso).toLocaleString("pt-BR", {
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

function statusLabel(s: string): string {
  const map: Record<string, string> = {
    rascunho: "Rascunho",
    ativa: "Ativa",
    finalizada: "Finalizada",
    pendente: "Pendente",
    paga: "Paga",
    simulada: "Simulada",
  };
  return map[s] ?? s;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [detalhe, setDetalhe] = useState<UserDetalhe | null>(null);
  const [loadingDetalhe, setLoadingDetalhe] = useState(false);

  useEffect(() => {
    fetch("/api/admin/users")
      .then((res) => {
        if (!res.ok) throw new Error("Erro ao carregar");
        return res.json();
      })
      .then((data: { users: UserItem[] }) => setUsers(data.users ?? []))
      .catch(() => setError("Erro ao carregar usuários."))
      .finally(() => setLoading(false));
  }, []);

  function openUser(userId: string) {
    setSelectedUserId(userId);
    setDetalhe(null);
    setLoadingDetalhe(true);
    fetch(`/api/admin/users/${userId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Erro ao carregar");
        return res.json();
      })
      .then((data: UserDetalhe) => setDetalhe(data))
      .catch(() => setDetalhe(null))
      .finally(() => setLoadingDetalhe(false));
  }

  function voltar() {
    setSelectedUserId(null);
    setDetalhe(null);
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {!selectedUserId ? (
          <>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Usuários da plataforma</h1>
                <p className="text-sm text-gray-500">Todos os donos de campanhas (Rifago)</p>
              </div>
            </div>

            {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
            {error}
          </div>
        ) : users.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500">
            Nenhum usuário cadastrado ainda.
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <ul className="divide-y divide-gray-100">
              {users.map((u) => (
                <li key={u.id}>
                  <button
                    type="button"
                    onClick={() => openUser(u.id)}
                    className="w-full flex items-center gap-4 p-4 hover:bg-gray-50/50 text-left transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-semibold">
                      {(u.name || u.email)[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{u.name || "—"}</p>
                      <p className="text-sm text-gray-500 flex items-center gap-1 truncate">
                        <Mail className="w-3.5 h-3.5 shrink-0" />
                        {u.email}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar className="w-4 h-4" />
                      {formatarData(u.createdAt)}
                    </div>
                    {u.twoFactorEnabled && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-green-50 text-green-700 text-xs font-medium">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        2FA
                      </span>
                    )}
                    <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={voltar}
              className="flex items-center gap-2 text-sm font-medium text-amber-600 hover:text-amber-700 mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar para Usuários da plataforma
            </button>
            <div className="space-y-6">
              {loadingDetalhe ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
                </div>
              ) : detalhe ? (
                <>
                  {/* Dados do usuário */}
                  <section>
                    <h3 className="flex items-center gap-2 font-semibold text-gray-900 mb-3">
                      <User className="w-5 h-5 text-amber-600" />
                      Dados do usuário
                    </h3>
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-2">
                      <p className="text-sm">
                        <span className="font-medium text-gray-600">Nome:</span>{" "}
                        <span className="text-gray-900">{detalhe.user.name || "—"}</span>
                      </p>
                      <p className="text-sm">
                        <span className="font-medium text-gray-600">E-mail:</span>{" "}
                        <span className="text-gray-900">{detalhe.user.email}</span>
                      </p>
                      <p className="text-sm">
                        <span className="font-medium text-gray-600">Cadastro:</span>{" "}
                        <span className="text-gray-900">{formatarData(detalhe.user.createdAt)}</span>
                      </p>
                      {detalhe.user.twoFactorEnabled && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-green-50 text-green-700 text-xs font-medium">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          2FA ativo
                        </span>
                      )}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Link
                        href={`/admin/dashboard/chat?userId=${detalhe.user.id}`}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-700"
                      >
                        <MessageSquare className="w-4 h-4" />
                        Abrir chat com este usuário
                      </Link>
                    </div>
                  </section>

                  {/* Campanhas */}
                  <section>
                    <h3 className="flex items-center gap-2 font-semibold text-gray-900 mb-3">
                      <FolderOpen className="w-5 h-5 text-amber-600" />
                      Campanhas ({detalhe.campanhas.length})
                    </h3>
                    {detalhe.campanhas.length === 0 ? (
                      <p className="text-sm text-gray-500 bg-gray-50 rounded-xl p-4">
                        Nenhuma campanha criada.
                      </p>
                    ) : (
                      <div className="border border-gray-200 rounded-xl overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                              <th className="text-left p-3 font-medium text-gray-700">Nome</th>
                              <th className="text-left p-3 font-medium text-gray-700">Status</th>
                              <th className="text-left p-3 font-medium text-gray-700">Cotas</th>
                              <th className="text-left p-3 font-medium text-gray-700">Valor/cota</th>
                              <th className="text-left p-3 font-medium text-gray-700">Criada em</th>
                              <th className="text-right p-3 font-medium text-gray-700">Ação</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {detalhe.campanhas.map((c) => (
                              <tr key={c.id} className="hover:bg-gray-50/50">
                                <td className="p-3 font-medium text-gray-900">{c.nome}</td>
                                <td className="p-3">
                                  <span
                                    className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                                      c.status === "ativa"
                                        ? "bg-green-50 text-green-700"
                                        : c.status === "finalizada"
                                          ? "bg-gray-100 text-gray-700"
                                          : "bg-amber-50 text-amber-700"
                                    }`}
                                  >
                                    {statusLabel(c.status)}
                                  </span>
                                </td>
                                <td className="p-3 text-gray-600">{c.quantidadeTitulos}</td>
                                <td className="p-3 text-gray-600">R$ {formatarMoeda(c.valorPorTitulo)}</td>
                                <td className="p-3 text-gray-600">{formatarData(c.createdAt)}</td>
                                <td className="p-3 text-right">
                                  <a
                                    href={`/rifa/${c.id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-amber-600 hover:underline font-medium"
                                  >
                                    Ver rifa pública
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </a>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </section>

                  {/* Vendas / Compras */}
                  <section>
                    <h3 className="flex items-center gap-2 font-semibold text-gray-900 mb-3">
                      <ShoppingCart className="w-5 h-5 text-amber-600" />
                      Vendas nas campanhas ({detalhe.compras.length})
                    </h3>
                    {detalhe.compras.length === 0 ? (
                      <p className="text-sm text-gray-500 bg-gray-50 rounded-xl p-4">
                        Nenhuma venda ainda.
                      </p>
                    ) : (
                      <div className="border border-gray-200 rounded-xl overflow-hidden">
                        <div className="overflow-x-auto max-h-80 overflow-y-auto">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                              <tr>
                                <th className="text-left p-3 font-medium text-gray-700">Data</th>
                                <th className="text-left p-3 font-medium text-gray-700">Comprador</th>
                                <th className="text-left p-3 font-medium text-gray-700">Campanha</th>
                                <th className="text-left p-3 font-medium text-gray-700">Qtd</th>
                                <th className="text-left p-3 font-medium text-gray-700">Valor</th>
                                <th className="text-left p-3 font-medium text-gray-700">Status</th>
                                <th className="text-left p-3 font-medium text-gray-700">Números</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {detalhe.compras.map((compra) => (
                                <tr key={compra.id} className="hover:bg-gray-50/50">
                                  <td className="p-3 text-gray-600 whitespace-nowrap">
                                    {formatarDataHora(compra.createdAt)}
                                  </td>
                                  <td className="p-3">
                                    <p className="font-medium text-gray-900">{compra.comprador.nome}</p>
                                    <p className="text-xs text-gray-500">{compra.comprador.email}</p>
                                    {compra.comprador.cpf && (
                                      <p className="text-xs text-gray-500">
                                        CPF: {formatarCpf(compra.comprador.cpf)}
                                      </p>
                                    )}
                                  </td>
                                  <td className="p-3 text-gray-600">{compra.campanhaNome}</td>
                                  <td className="p-3 text-gray-600">{compra.quantidade}</td>
                                  <td className="p-3 font-medium text-gray-900">
                                    R$ {formatarMoeda(compra.valorTotal)}
                                  </td>
                                  <td className="p-3">
                                    <span
                                      className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                                        compra.status === "paga"
                                          ? "bg-green-50 text-green-700"
                                          : compra.status === "simulada"
                                            ? "bg-blue-50 text-blue-700"
                                            : "bg-amber-50 text-amber-700"
                                      }`}
                                    >
                                      {statusLabel(compra.status)}
                                    </span>
                                  </td>
                                  <td className="p-3">
                                    <div className="flex flex-wrap gap-1 max-w-[120px]">
                                      {compra.numeros.slice(0, 5).map((num) => (
                                        <span
                                          key={num}
                                          className="inline-flex px-1.5 py-0.5 rounded bg-gray-100 text-xs font-mono text-gray-700"
                                        >
                                          {formatarNumeroCota(num)}
                                        </span>
                                      ))}
                                      {compra.numeros.length > 5 && (
                                        <span className="text-xs text-gray-500">
                                          +{compra.numeros.length - 5}
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </section>
                </>
              ) : (
                <p className="text-center text-gray-500 py-8">Erro ao carregar dados do usuário.</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
