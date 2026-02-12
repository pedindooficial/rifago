"use client";

import Link from "next/link";
import { Settings, User, Wallet, Palette, Share2, Code } from "lucide-react";

export default function Configuracao() {
  const recursos = [
    {
      href: "/configuracao/meios-pagamento",
      label: "Adicionar meio de pagamento",
      desc: "Configure o Mercado Pago para receber pagamentos",
      icon: Wallet,
      color: "text-primary",
    },
    {
      href: "/configuracao/personalizar",
      label: "Personalize do seu jeito",
      desc: "Ajuste cores e identidade visual",
      icon: Palette,
      color: "text-primary",
    },
    {
      href: "/configuracao/redes-sociais",
      label: "Adicionar redes sociais",
      desc: "Vincule suas redes para divulgação",
      icon: Share2,
      color: "text-primary",
    },
    {
      href: "/configuracao/integracoes",
      label: "Integrações avançadas",
      desc: "APIs e webhooks",
      icon: Code,
      color: "text-primary",
    },
  ];

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-2 mb-8">
          <Settings className="w-8 h-8 text-primary" />
          <h1 className="text-2xl font-bold text-gray-900">Configuração</h1>
        </div>

        {/* Conta */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-7 h-7 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-gray-900">Sua conta</h2>
              <p className="text-sm text-gray-500">
                Gerencie informações e segurança da sua conta
              </p>
            </div>
            <Link
              href="/configuracao/conta"
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <span className="sr-only">Abrir</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Recursos */}
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recursos</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {recursos.map((r) => {
            const Icon = r.icon;
            return (
              <Link
                key={r.href}
                href={r.href}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-start gap-4 hover:border-primary/30 hover:shadow-md transition-all"
              >
                <div className={`w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 ${r.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-900">{r.label}</h3>
                  <p className="text-sm text-gray-500 mt-0.5">{r.desc}</p>
                </div>
                <svg className="w-5 h-5 text-gray-400 shrink-0 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
