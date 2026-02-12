"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";
import { Mail, Lock, ArrowRight, Shield } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { error?: string }).error ?? "Erro ao fazer login.");
        setLoading(false);
        return;
      }
      router.push("/admin/dashboard");
      router.refresh();
    } catch {
      setError("Erro ao entrar. Tente novamente.");
    } finally {
      setLoading(false);
    }
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
              <h1 className="text-xl font-bold text-gray-900">Painel Admin</h1>
              <p className="text-sm text-gray-500">Acesso restrito</p>
            </div>
          </div>
          <p className="text-gray-600 text-sm mb-6">
            Entre com as credenciais de administrador da plataforma.
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
                  placeholder="••••••••"
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
              {loading ? "Entrando..." : "Entrar"}
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>
          <p className="mt-6 text-center text-gray-500 text-sm">
            <Link href="/" className="text-amber-600 hover:underline">
              Voltar ao site
            </Link>
          </p>
        </div>
        <p className="mt-4 text-center text-gray-500 text-xs">
          Não é admin?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Login de usuário
          </Link>
        </p>
      </div>
    </div>
  );
}
