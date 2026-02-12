"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import Logo from "./Logo";
import {
  Plus,
  Home,
  FolderOpen,
  Users,
  UserCog,
  Settings,
  Headphones,
  LogOut,
  X,
  User,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const menuItems = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/campanhas", label: "Minhas campanhas", icon: FolderOpen },
  { href: "/apoiadores", label: "Meus apoiadores", icon: Users },
  { href: "/afiliados", label: "Gerenciar afiliados", icon: UserCog },
  { href: "/configuracao", label: "Configuração", icon: Settings },
  { href: "/suporte", label: "Suporte", icon: Headphones },
];

type SidebarProps = {
  mobileOpen?: boolean;
  onClose?: () => void;
};

export default function Sidebar({ mobileOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [userCardOpen, setUserCardOpen] = useState(false);

  const linkClass = (isActive: boolean) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
      isActive ? "bg-primary/10 text-primary" : "text-gray-700 hover:bg-gray-100"
    }`;

  const content = (
    <>
      {/* Logo + fechar no mobile */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <Logo href="/dashboard" size="md" />
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900"
            aria-label="Fechar menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="p-4">
        <Link
          href="/campanhas/criar"
          onClick={onClose}
          className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-primary hover:bg-primary-dark text-white font-semibold transition-colors"
        >
          <Plus className="w-5 h-5" />
          Criar campanha
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-2">
        <ul className="space-y-0.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  className={linkClass(isActive)}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="border-t border-gray-100 my-4" />

        {/* Card do usuário: ao clicar mostra Minha conta + Sair */}
        <div className="px-3 py-2">
          <div className="rounded-xl bg-gray-50 border border-gray-100 overflow-hidden">
            {session?.user ? (
              <>
                <button
                  type="button"
                  onClick={() => setUserCardOpen((o) => !o)}
                  className="flex items-center gap-3 w-full p-3 text-left hover:bg-gray-100/80 transition-colors"
                  aria-expanded={userCardOpen}
                  aria-label={userCardOpen ? "Fechar opções do usuário" : "Abrir opções do usuário"}
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-primary font-semibold text-sm">
                      {(session.user.name ?? "U").charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {session.user.name ?? "Usuário"}
                    </p>
                    <p className="text-xs text-gray-500 truncate" title={session.user.email ?? ""}>
                      {session.user.email ?? ""}
                    </p>
                  </div>
                  <span className="shrink-0 text-gray-400">
                    {userCardOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </span>
                </button>
                {userCardOpen && (
                  <div className="flex flex-col gap-0.5 border-t border-gray-100 px-2 pb-2 pt-1">
                    <Link
                      href="/configuracao/conta"
                      onClick={() => {
                        onClose?.();
                        setUserCardOpen(false);
                      }}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        pathname === "/configuracao/conta"
                          ? "bg-primary/10 text-primary"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <User className="w-4 h-4 shrink-0" />
                      Minha conta
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        onClose?.();
                        setUserCardOpen(false);
                        signOut({ callbackUrl: "/" });
                      }}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 w-full text-left"
                    >
                      <LogOut className="w-4 h-4 shrink-0" />
                      Sair
                    </button>
                  </div>
                )}
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  onClose?.();
                  signOut({ callbackUrl: "/" });
                }}
                className="flex items-center gap-2 px-3 py-3 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 w-full text-left"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                Sair
              </button>
            )}
          </div>
        </div>
      </nav>
    </>
  );

  return (
    <>
      {/* Overlay no mobile */}
      {onClose && (
        <div
          className={`fixed inset-0 bg-black/50 z-40 transition-opacity lg:hidden ${
            mobileOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={`fixed left-0 top-0 z-50 h-screen w-64 max-w-[85vw] border-r border-gray-200 bg-white flex flex-col transition-transform duration-300 ease-out lg:translate-x-0 ${
          onClose ? (mobileOpen ? "translate-x-0" : "-translate-x-full") : ""
        }`}
      >
        {content}
      </aside>
    </>
  );
}
