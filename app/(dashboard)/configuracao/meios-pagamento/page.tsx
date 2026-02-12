"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, CreditCard, Zap, Lock, AlertCircle } from "lucide-react";

const STORAGE_KEY = "rifago_meios_pagamento_mp";

type ModoMP = "producao" | "teste";
type TiposPagamento = "pix_e_cartao" | "somente_pix" | "somente_cartao";

interface ConfigMP {
  modo: ModoMP;
  chavePublicaTeste: string;
  chavePublicaProducao: string;
  accessTokenConfiguradoTeste: boolean;
  accessTokenConfiguradoProducao: boolean;
  accessToken: string;
  tiposPagamento: TiposPagamento;
}

const defaultConfig: ConfigMP = {
  modo: "teste",
  chavePublicaTeste: "",
  chavePublicaProducao: "",
  accessTokenConfiguradoTeste: false,
  accessTokenConfiguradoProducao: false,
  accessToken: "",
  tiposPagamento: "pix_e_cartao",
};

function loadConfig(): ConfigMP {
  if (typeof window === "undefined") return defaultConfig;
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    const parsed = s ? (JSON.parse(s) as Partial<ConfigMP>) : {};
    return {
      ...defaultConfig,
      ...parsed,
      accessToken: "",
    };
  } catch (_) {}
  return defaultConfig;
}

function saveConfig(config: ConfigMP) {
  if (typeof window === "undefined") return;
  try {
    const toStore = {
      modo: config.modo,
      chavePublicaTeste: config.chavePublicaTeste,
      chavePublicaProducao: config.chavePublicaProducao,
      accessTokenConfiguradoTeste: config.accessTokenConfiguradoTeste,
      accessTokenConfiguradoProducao: config.accessTokenConfiguradoProducao,
      tiposPagamento: config.tiposPagamento,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
  } catch (_) {}
}

export default function MeiosPagamento() {
  const [config, setConfig] = useState<ConfigMP>(defaultConfig);
  const [salvo, setSalvo] = useState(false);
  const [carregado, setCarregado] = useState(false);

  useEffect(() => {
    setConfig(loadConfig());

    async function carregarServidor() {
      try {
        const res = await fetch("/api/config/mercadopago");
        if (res.ok) {
          const data = (await res.json()) as {
            modo: ModoMP;
            chavePublicaTeste?: string;
            chavePublicaProducao?: string;
            accessTokenConfiguradoTeste?: boolean;
            accessTokenConfiguradoProducao?: boolean;
            tiposPagamento: TiposPagamento;
          };
          setConfig((prev) => ({
            ...prev,
            modo: data.modo ?? prev.modo,
            chavePublicaTeste: data.chavePublicaTeste ?? prev.chavePublicaTeste,
            chavePublicaProducao: data.chavePublicaProducao ?? prev.chavePublicaProducao,
            accessTokenConfiguradoTeste: data.accessTokenConfiguradoTeste ?? prev.accessTokenConfiguradoTeste,
            accessTokenConfiguradoProducao: data.accessTokenConfiguradoProducao ?? prev.accessTokenConfiguradoProducao,
            tiposPagamento: data.tiposPagamento ?? prev.tiposPagamento,
            accessToken: "",
          }));
        }
      } catch {
        // Silencioso
      } finally {
        setCarregado(true);
      }
    }
    carregarServidor();
  }, []);

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    const chavePublicaAtual =
      config.modo === "teste" ? config.chavePublicaTeste : config.chavePublicaProducao;
    try {
      const res = await fetch("/api/config/mercadopago", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modo: config.modo,
          chavePublica: chavePublicaAtual,
          accessToken: config.accessToken,
          tiposPagamento: config.tiposPagamento,
        }),
      });
      if (!res.ok) {
        throw new Error("Erro ao salvar configuração no servidor");
      }
      const novoTokenTeste =
        config.modo === "teste" ? (config.accessToken ? true : config.accessTokenConfiguradoTeste) : config.accessTokenConfiguradoTeste;
      const novoTokenProducao =
        config.modo === "producao" ? (config.accessToken ? true : config.accessTokenConfiguradoProducao) : config.accessTokenConfiguradoProducao;
      setConfig((c) => ({
        ...c,
        accessTokenConfiguradoTeste: novoTokenTeste,
        accessTokenConfiguradoProducao: novoTokenProducao,
        accessToken: "",
      }));
      saveConfig({
        ...config,
        accessTokenConfiguradoTeste: novoTokenTeste,
        accessTokenConfiguradoProducao: novoTokenProducao,
        accessToken: "",
      });
      setSalvo(true);
      setTimeout(() => setSalvo(false), 3000);
    } catch (error) {
      console.error(error);
      alert("Não foi possível salvar a configuração do Mercado Pago. Tente novamente.");
    }
  };

  const set = <K extends keyof ConfigMP>(key: K, value: ConfigMP[K]) => {
    setConfig((c) => ({ ...c, [key]: value }));
  };

  const chavePublicaAtual =
    config.modo === "teste" ? config.chavePublicaTeste : config.chavePublicaProducao;
  const accessTokenConfiguradoAtual =
    config.modo === "teste" ? config.accessTokenConfiguradoTeste : config.accessTokenConfiguradoProducao;

  const setChavePublicaAtual = (value: string) => {
    setConfig((c) =>
      c.modo === "teste"
        ? { ...c, chavePublicaTeste: value }
        : { ...c, chavePublicaProducao: value }
    );
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <Link
            href="/configuracao"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm sm:text-base"
          >
            <ArrowLeft className="w-5 h-5 shrink-0" />
            Voltar
          </Link>
        </div>

        <div className="flex items-center gap-2 mb-2">
          <CreditCard className="w-6 h-6 text-primary shrink-0" />
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            Configuração / Adicionar meio de pagamento
          </h1>
        </div>
        <p className="text-gray-500 mb-6 sm:mb-8 text-sm sm:text-base">
          Adicione um meio de pagamento e receba diretamente em sua conta.
        </p>

        <p className="text-sm font-medium text-gray-700 mb-4">
          Meio de pagamento disponível
        </p>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 sm:p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-[#009EE3]/10 flex items-center justify-center shrink-0">
                <span className="text-xl sm:text-2xl font-bold text-[#009EE3]">MP</span>
              </div>
              <div className="min-w-0">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Mercado Pago</h2>
                <div className="flex items-center gap-2 mt-1 text-xs sm:text-sm text-green-700">
                  <Zap className="w-4 h-4 shrink-0" />
                  <span>Meio de pagamento com baixa automática</span>
                </div>
              </div>
            </div>

            {carregado && (
              <form onSubmit={handleSalvar} className="space-y-6">
                {/* Modo: Produção ou Teste */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Modo de uso
                  </label>
                  <div className="flex flex-wrap gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="modo"
                        checked={config.modo === "teste"}
                        onChange={() => set("modo", "teste")}
                        className="w-4 h-4 text-primary border-gray-300 focus:ring-primary"
                      />
                      <span className="text-sm font-medium text-gray-900">Teste</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="modo"
                        checked={config.modo === "producao"}
                        onChange={() => set("modo", "producao")}
                        className="w-4 h-4 text-primary border-gray-300 focus:ring-primary"
                      />
                      <span className="text-sm font-medium text-gray-900">Produção</span>
                    </label>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    Use <strong>Teste</strong> para simular pagamentos. Use <strong>Produção</strong> para receber pagamentos reais.
                  </p>
                </div>

                {/* Chave pública (do modo selecionado) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chave pública (Public Key) — {config.modo === "teste" ? "Teste" : "Produção"}
                  </label>
                  <input
                    type="text"
                    value={chavePublicaAtual}
                    onChange={(e) => setChavePublicaAtual(e.target.value)}
                    placeholder="APP_USR-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm sm:text-base"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Usada no frontend. Encontre em: Mercado Pago → Sua integração → Credenciais
                    {config.modo === "teste" ? " de teste" : " de produção"}
                  </p>
                </div>

                {/* Access Token */}
                <div>
                  {config.modo === "teste" && (
                    <div className="mb-3 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
                      <strong>Modo Teste:</strong> use o Access Token da seção <strong>Credenciais de teste</strong> do Mercado Pago (não o de produção). Se o PIX deu erro de &quot;credenciais de produção&quot;, o token salvo pode ser o antigo: <strong>cole de novo o Access Token de TESTE aqui em baixo e clique em Salvar</strong>.
                    </div>
                  )}
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-gray-500" />
                    Access Token (Chave secreta)
                  </label>
                  <input
                    type="password"
                    value={config.accessToken}
                    onChange={(e) => set("accessToken", e.target.value)}
                    placeholder={
                      accessTokenConfiguradoAtual
                        ? `Cole o Access Token de ${config.modo === "teste" ? "teste" : "produção"} aqui e salve para substituir`
                        : "Digite o Access Token"
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm sm:text-base"
                    autoComplete="off"
                  />
                  {accessTokenConfiguradoAtual && (
                    <p className="mt-1 text-xs text-green-600 flex items-center gap-1">
                      {config.modo === "teste"
                        ? "Chave secreta de teste já configurada. Deixe em branco para manter a atual."
                        : "Chave secreta de produção já configurada. Deixe em branco para manter a atual."}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-500 flex items-start gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    Nunca compartilhe esta chave. Ela é usada no servidor para criar cobranças e consultar pagamentos.
                  </p>
                </div>

                {/* Tipos de pagamento aceitos */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Tipos de pagamento aceitos
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                      <input
                        type="radio"
                        name="tiposPagamento"
                        checked={config.tiposPagamento === "pix_e_cartao"}
                        onChange={() => set("tiposPagamento", "pix_e_cartao")}
                        className="w-4 h-4 text-primary border-gray-300 focus:ring-primary"
                      />
                      <span className="text-sm font-medium text-gray-900">PIX e cartão</span>
                      <span className="text-xs text-gray-500">Aceitar ambos</span>
                    </label>
                    <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                      <input
                        type="radio"
                        name="tiposPagamento"
                        checked={config.tiposPagamento === "somente_pix"}
                        onChange={() => set("tiposPagamento", "somente_pix")}
                        className="w-4 h-4 text-primary border-gray-300 focus:ring-primary"
                      />
                      <span className="text-sm font-medium text-gray-900">Somente PIX</span>
                      <span className="text-xs text-gray-500">Apenas pagamento via PIX</span>
                    </label>
                    <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                      <input
                        type="radio"
                        name="tiposPagamento"
                        checked={config.tiposPagamento === "somente_cartao"}
                        onChange={() => set("tiposPagamento", "somente_cartao")}
                        className="w-4 h-4 text-primary border-gray-300 focus:ring-primary"
                      />
                      <span className="text-sm font-medium text-gray-900">Somente cartão</span>
                      <span className="text-xs text-gray-500">Apenas cartão de crédito/débito</span>
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={salvo}
                  className="w-full py-3 px-4 rounded-lg bg-primary hover:bg-primary-dark disabled:opacity-80 text-white font-semibold transition-colors"
                >
                  {salvo ? "Salvo ✓" : "Salvar configuração Mercado Pago"}
                </button>
              </form>
            )}
          </div>
        </div>

        <p className="mt-6 text-sm text-gray-500 text-center">
          É o único gateway de pagamento disponível no momento. PIX e cartão são processados pelo Mercado Pago.
        </p>
      </div>
    </div>
  );
}
