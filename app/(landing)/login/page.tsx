"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Logo from "@/components/Logo";
import { Mail, Lock, ArrowRight, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"credentials" | "2fa">("credentials");
  const [twoFactorToken, setTwoFactorToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmitCredentials(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/check-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError((data as { error?: string }).error ?? "E-mail ou senha incorretos.");
        setLoading(false);
        return;
      }

      const payload = data as { requires2FA?: boolean; token?: string };
      if (payload.requires2FA && payload.token) {
        setTwoFactorToken(payload.token);
        setStep("2fa");
        setLoading(false);
        return;
      }

      const signInRes = await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: false,
      });
      if (signInRes?.error) {
        setError("E-mail ou senha incorretos. Tente novamente.");
        setLoading(false);
        return;
      }
      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError("Erro ao entrar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit2FA(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await signIn("credentials", {
        email: email.trim(),
        twoFactorToken,
        twoFactorCode: code.replace(/\D/g, ""),
        redirect: false,
      });
      if (res?.error) {
        setError("Código inválido ou expirado. Tente novamente.");
        setLoading(false);
        return;
      }
      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError("Erro ao verificar código.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col">
      <header className="border-b border-gray-200/80 bg-white/90 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Logo href="/" size="xs" />
          <nav className="flex items-center gap-3">
            <Link
              href="/criar-conta"
              className="px-4 py-2.5 rounded-lg font-medium text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Criar conta
            </Link>
            <Link
              href="/login"
              className="px-4 py-2.5 rounded-lg font-semibold bg-primary text-white"
            >
              Entrar
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Entrar</h1>
            <p className="text-gray-600 mb-6">
              {step === "2fa"
                ? "Digite o código de 6 dígitos do seu aplicativo autenticador (Google Authenticator ou similar)."
                : "Use seu e-mail e senha para acessar a plataforma."}
            </p>

            {step === "2fa" ? (
              <form onSubmit={handleSubmit2FA} className="space-y-5">
                {error && (
                  <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">
                    {error}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Código 2FA (6 dígitos)
                  </label>
                  <div className="relative">
                    <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="000000"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-center text-lg tracking-widest font-mono"
                      maxLength={6}
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading || code.replace(/\D/g, "").length !== 6}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-primary text-white font-semibold hover:bg-primary-dark disabled:opacity-60 transition-colors"
                >
                  {loading ? "Verificando..." : "Verificar e entrar"}
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => { setStep("credentials"); setCode(""); setError(""); }}
                  className="w-full text-sm text-gray-500 hover:text-gray-700"
                >
                  ← Voltar para e-mail e senha
                </button>
              </form>
            ) : (
              <form onSubmit={handleSubmitCredentials} className="space-y-5">
                {error && (
                  <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">
                    {error}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    E-mail
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      autoComplete="email"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Senha
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      autoComplete="current-password"
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-primary text-white font-semibold hover:bg-primary-dark disabled:opacity-60 transition-colors"
                >
                  {loading ? "Entrando..." : "Entrar"}
                  <ArrowRight className="w-5 h-5" />
                </button>
              </form>
            )}

            <p className="mt-6 text-center text-gray-600 text-sm">
              Ainda não tem conta?{" "}
              <Link href="/criar-conta" className="text-primary font-medium hover:underline">
                Criar conta
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
