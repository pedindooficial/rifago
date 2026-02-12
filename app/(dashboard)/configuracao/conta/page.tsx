"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { ArrowLeft, User, Shield, Loader2, Smartphone, CheckCircle } from "lucide-react";

export default function Conta() {
  const { data: session, status } = useSession();
  const [twoFAEnabled, setTwoFAEnabled] = useState<boolean | null>(null);
  const [loading2FA, setLoading2FA] = useState(false);
  const [step2FA, setStep2FA] = useState<"idle" | "setup" | "enable" | "disable">("idle");
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState("");
  const [secretBackup, setSecretBackup] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!session?.user?.id) return;
    fetch("/api/auth/2fa/status")
      .then((r) => r.json())
      .then((data: { enabled?: boolean }) => setTwoFAEnabled(!!data.enabled))
      .catch(() => setTwoFAEnabled(false));
  }, [session?.user?.id]);

  async function handleSetup2FA() {
    setError("");
    setSuccess("");
    setLoading2FA(true);
    try {
      const res = await fetch("/api/auth/2fa/setup", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { error?: string }).error ?? "Erro ao configurar 2FA");
        setLoading2FA(false);
        return;
      }
      const payload = data as { qrCodeDataUrl?: string; secret?: string };
      setQrCodeDataUrl(payload.qrCodeDataUrl ?? "");
      setSecretBackup(payload.secret ?? "");
      setStep2FA("enable");
    } catch {
      setError("Erro ao configurar 2FA");
    } finally {
      setLoading2FA(false);
    }
  }

  async function handleEnable2FA(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    const codeNum = code.replace(/\D/g, "");
    if (codeNum.length !== 6) {
      setError("Digite o código de 6 dígitos do aplicativo.");
      return;
    }
    setLoading2FA(true);
    try {
      const res = await fetch("/api/auth/2fa/enable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: codeNum }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { error?: string }).error ?? "Código inválido. Tente novamente.");
        setLoading2FA(false);
        return;
      }
      setTwoFAEnabled(true);
      setStep2FA("idle");
      setCode("");
      setQrCodeDataUrl("");
      setSecretBackup("");
      setSuccess("2FA ativado com sucesso. Na próxima vez que entrar, será pedido o código do aplicativo.");
    } catch {
      setError("Erro ao ativar 2FA");
    } finally {
      setLoading2FA(false);
    }
  }

  async function handleDisable2FA(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    const codeNum = code.replace(/\D/g, "");
    if (codeNum.length !== 6) {
      setError("Digite o código de 6 dígitos do aplicativo.");
      return;
    }
    if (!password) {
      setError("Digite sua senha para desativar o 2FA.");
      return;
    }
    setLoading2FA(true);
    try {
      const res = await fetch("/api/auth/2fa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: codeNum, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { error?: string }).error ?? "Código ou senha incorretos.");
        setLoading2FA(false);
        return;
      }
      setTwoFAEnabled(false);
      setStep2FA("idle");
      setCode("");
      setPassword("");
      setSuccess("2FA desativado com sucesso.");
    } catch {
      setError("Erro ao desativar 2FA");
    } finally {
      setLoading2FA(false);
    }
  }

  if (status === "loading") {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-6 w-32 bg-gray-200 rounded" />
            <div className="h-10 w-48 bg-gray-200 rounded" />
            <div className="h-40 bg-gray-100 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto text-center py-12 text-gray-500">
          <p>Você precisa estar logado para ver esta página.</p>
          <Link href="/login" className="text-primary font-medium mt-2 inline-block">
            Entrar
          </Link>
        </div>
      </div>
    );
  }

  const { name, email } = session.user;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/configuracao"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 text-sm sm:text-base"
        >
          <ArrowLeft className="w-5 h-5 shrink-0" /> Voltar
        </Link>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">Sua conta</h1>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Dados do perfil
            </h2>
            <dl className="space-y-4">
              <div>
                <dt className="text-xs sm:text-sm font-medium text-gray-500 mb-1">Nome</dt>
                <dd className="text-base sm:text-lg text-gray-900 font-medium break-words">
                  {name ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs sm:text-sm font-medium text-gray-500 mb-1">E-mail</dt>
                <dd className="text-base sm:text-lg text-gray-900 break-all">
                  {email ?? "—"}
                </dd>
              </div>
            </dl>
            <p className="text-sm text-gray-500 mt-4 italic">
              Em breve: alteração de nome, e-mail e senha.
            </p>
          </div>

          <div className="p-4 sm:p-6 bg-gray-50/50">
            <h2 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Segurança — Autenticação em duas etapas (2FA)
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Use o Google Authenticator (ou outro app compatível) para gerar códigos de 6 dígitos. Ao ativar, o código será pedido sempre que você fizer login.
            </p>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 p-3 rounded-lg bg-green-50 text-green-800 text-sm flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                {success}
              </div>
            )}

            {twoFAEnabled === null ? (
              <div className="flex items-center gap-2 text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                Carregando...
              </div>
            ) : step2FA === "setup" ? (
              <div className="text-sm text-gray-600">
                <Loader2 className="w-5 h-5 animate-spin inline-block mr-2" />
                Gerando QR Code...
              </div>
            ) : step2FA === "enable" ? (
              <form onSubmit={handleEnable2FA} className="space-y-4">
                <p className="text-sm font-medium text-gray-700">
                  Escaneie o QR Code com o Google Authenticator e digite o código de 6 dígitos abaixo.
                </p>
                {qrCodeDataUrl && (
                  <div className="flex flex-col items-center gap-2">
                    <img
                      src={qrCodeDataUrl}
                      alt="QR Code 2FA"
                      className="w-48 h-48 rounded-lg border border-gray-200 bg-white p-2"
                    />
                    {secretBackup && (
                      <p className="text-xs text-gray-500 font-mono break-all text-center max-w-xs">
                        Ou adicione manualmente: {secretBackup}
                      </p>
                    )}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Código de 6 dígitos</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="000000"
                    className="w-full max-w-[8rem] px-3 py-2 border border-gray-300 rounded-lg text-center text-lg tracking-widest font-mono"
                    maxLength={6}
                    required
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="submit"
                    disabled={loading2FA || code.replace(/\D/g, "").length !== 6}
                    className="px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary-dark disabled:opacity-60"
                  >
                    {loading2FA ? "Ativando..." : "Ativar 2FA"}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setStep2FA("idle"); setCode(""); setQrCodeDataUrl(""); setSecretBackup(""); setError(""); }}
                    className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            ) : step2FA === "disable" ? (
              <form onSubmit={handleDisable2FA} className="space-y-4">
                <p className="text-sm text-gray-600">
                  Para desativar o 2FA, digite o código atual do aplicativo e sua senha.
                </p>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Código 2FA (6 dígitos)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="000000"
                    className="w-full max-w-[8rem] px-3 py-2 border border-gray-300 rounded-lg text-center text-lg tracking-widest font-mono"
                    maxLength={6}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sua senha</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="submit"
                    disabled={loading2FA || code.replace(/\D/g, "").length !== 6 || !password}
                    className="px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 disabled:opacity-60"
                  >
                    {loading2FA ? "Desativando..." : "Desativar 2FA"}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setStep2FA("idle"); setCode(""); setPassword(""); setError(""); }}
                    className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            ) : twoFAEnabled ? (
              <div className="space-y-3">
                <p className="text-sm text-green-700 font-medium flex items-center gap-2">
                  <Smartphone className="w-4 h-4" />
                  2FA está ativo. Um código será pedido no próximo login.
                </p>
                <button
                  type="button"
                  onClick={() => setStep2FA("disable")}
                  className="px-4 py-2 rounded-lg border border-red-300 text-red-700 font-medium hover:bg-red-50"
                >
                  Desativar 2FA
                </button>
              </div>
            ) : (
              <div>
                <button
                  type="button"
                  onClick={() => { setStep2FA("setup"); handleSetup2FA(); }}
                  disabled={loading2FA}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-white font-medium hover:bg-primary-dark disabled:opacity-60"
                >
                  {loading2FA ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Smartphone className="w-4 h-4" />
                  )}
                  Ativar 2FA (Google Authenticator)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
