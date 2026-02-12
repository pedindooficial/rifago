"use client";

import Link from "next/link";
import Logo from "@/components/Logo";
import { Ticket, Shield, Zap, ArrowRight, Sparkles } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-gray-200/80 bg-white/90 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 flex items-center justify-between h-14 sm:h-16 gap-2">
          <Logo href="/" size="xs" className="shrink-0" />
          <nav className="flex items-center gap-1 sm:gap-3 shrink-0">
            <Link
              href="/criar-conta"
              className="px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors text-sm sm:text-base"
            >
              Criar conta
            </Link>
            <Link
              href="/login"
              className="px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg font-semibold bg-primary text-white hover:bg-primary-dark transition-colors text-sm sm:text-base"
            >
              Entrar
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-24 sm:pt-28 lg:pt-32 pb-12 sm:pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-primary/10 text-primary text-xs sm:text-sm font-medium mb-4 sm:mb-6">
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            Plataforma de rifas e sorteios
          </div>
          <h1 className="text-2xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 tracking-tight mb-4 sm:mb-6 px-1">
            Crie e gerencie suas{" "}
            <span className="text-primary">campanhas de rifa</span> em um só lugar
          </h1>
          <p className="text-base sm:text-xl text-gray-600 mb-8 sm:mb-10 max-w-2xl mx-auto px-1">
            Configure sorteios, receba por PIX e Mercado Pago, gerencie reservas e
            tenha tudo sob controle. Simples e seguro.
          </p>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4">
            <Link
              href="/criar-conta"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-primary text-white font-semibold text-lg hover:bg-primary-dark transition-colors shadow-lg shadow-primary/25"
            >
              Começar grátis
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
            >
              Já tenho conta
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-gray-50/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-center text-gray-900 mb-8 sm:mb-12 px-2">
            Tudo que você precisa para suas rifas
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            <div className="bg-white rounded-2xl p-5 sm:p-6 lg:p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
                <Ticket className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                Campanhas completas
              </h3>
              <p className="text-gray-600 text-sm sm:text-base">
                Crie campanhas com fotos, quantidades de títulos, valor por título e
                tipo de sorteio. Defina quando o sorteio será realizado.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-5 sm:p-6 lg:p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                PIX e Mercado Pago
              </h3>
              <p className="text-gray-600 text-sm sm:text-base">
                Receba por PIX com tempo configurável de expiração. Configure o
                Mercado Pago em um só lugar e use em todas as campanhas.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-5 sm:p-6 lg:p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                Reservas e controle
              </h3>
              <p className="text-gray-600 text-sm sm:text-base">
                Prazo para reserva expirar, quantidade mínima e máxima por reserva.
                Acompanhe apoiadores e afiliados.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">
            Pronto para começar?
          </h2>
          <p className="text-gray-600 mb-6 sm:mb-8 text-sm sm:text-base">
            Crie sua conta em segundos e lance sua primeira campanha.
          </p>
          <Link
            href="/criar-conta"
            className="inline-flex items-center gap-2 px-6 py-3 sm:px-8 sm:py-4 rounded-xl bg-primary text-white font-semibold text-base sm:text-lg hover:bg-primary-dark transition-colors"
          >
            Criar conta grátis
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8 px-4 text-center text-gray-500 text-sm">
        © {new Date().getFullYear()} Rifago. Todos os direitos reservados.
      </footer>
    </div>
  );
}
