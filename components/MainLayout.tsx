"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import Logo from "./Logo";
import { Menu, X } from "lucide-react";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header mobile: logo + botão (hambúrguer quando fechado, X quando aberto) */}
      <header className="fixed top-0 left-0 right-0 z-40 h-14 border-b border-gray-200 bg-white px-4 flex items-center justify-between lg:hidden">
        <Logo href="/dashboard" size="md" />
        <button
          type="button"
          onClick={() => setMobileOpen((o) => !o)}
          className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      {/* Conteúdo: no mobile com padding-top para o header; no desktop com margem da sidebar */}
      <main className="min-h-screen pt-14 lg:pt-0 lg:pl-64">
        {children}
      </main>
    </div>
  );
}
