"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";
import { Mail, Lock, ArrowRight, Shield, Loader2 } from "lucide-react";

type RegistrationStatus = {
  registrationOpen: boolean;
  hasAdmin: boolean;
  canRegister: boolean;
};

export default function AdminRegistroPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<RegistrationStatus | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    fetch("/api/admin/registration-open")
      .then((res) => res.json())
      .then((data: RegistrationStatus) => setStatus(data))
      .catch(() => setStatus({ registrationOpen: false, hasAdmin: false, canRegister: false }))
      .finally(() => setChecking(false));
  }, []);

  const canShowForm = status?.canRegister ?? status?.registrationOpen ?? false;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }
    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { error?: string }).error ?? "Erro ao cadastrar.");
        setLoading(false);
        return;
      }
      router.push("/admin/dashboard");
      router.refresh();
    } catch {
      setError("Erro ao cadastrar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    );
  }

  if (!canShowForm) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-100">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-6 h-6 text-amber-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Cadastro indisponível</h1>
          <p className="text-gray-600 text-sm mb-6">
            {status?.hasAdmin
              ? "Já existe um administrador cadastrado. Use o login ou ative o cadastro no painel admin."
              : "O cadastro de administrador está desativado."}
          </p>
          <Link
            href="/admin/login"
            className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-600 text-white font-semibold hover:bg-amber-700"
          >
            Ir para o login
            <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="mt-6">
            <Link href="/" className="text-amber-600 hover:underline text-sm">
              Voltar ao site
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-100">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Shield className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Cadastrar administrador</h1>
              <p className="text-sm text-gray-500">Cadastro único</p>
            </div>
          </div>
          <p className="text-gray-600 text-sm mb-6">
            Crie a conta de administrador da plataforma. Após o cadastro, esta página ficará indisponível até ser reativada no painel admin.
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@exemplo.com"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  required
                  minLength={6}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Confirmar senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a senha"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold disabled:opacity-60 transition-colors"
            >
              {loading ? "Cadastrando..." : "Cadastrar"}
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>
          <p className="mt-6 text-center text-gray-500 text-sm">
            Já tem conta?{" "}
            <Link href="/admin/login" className="text-amber-600 hover:underline">
              Fazer login
            </Link>
          </p>
          <p className="mt-2 text-center">
            <Link href="/" className="text-gray-500 hover:underline text-sm">
              Voltar ao site
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
