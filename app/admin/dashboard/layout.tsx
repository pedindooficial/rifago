"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Users, MessageSquare, Settings, LogOut, Shield, Loader2 } from "lucide-react";

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [admin, setAdmin] = useState<{ id: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/auth/session")
      .then((res) => {
        if (!res.ok) {
          router.replace("/admin/login");
          return;
        }
        return res.json();
      })
      .then((data) => {
        if (data?.admin) setAdmin(data.admin);
      })
      .catch(() => router.replace("/admin/login"))
      .finally(() => setLoading(false));
  }, [router]);

  async function handleLogout() {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }

  if (loading || !admin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    );
  }

  const nav = [
    { href: "/admin/dashboard", label: "Usuários", icon: Users },
    { href: "/admin/dashboard/chat", label: "Chat / Suporte", icon: MessageSquare },
    { href: "/admin/dashboard/config", label: "Configurações", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <aside className="w-56 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-100 flex items-center gap-2">
          <Shield className="w-6 h-6 text-amber-600" />
          <span className="font-semibold text-gray-900">Admin</span>
        </div>
        <nav className="p-2 flex-1">
          {nav.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                  isActive ? "bg-amber-500/10 text-amber-700" : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-gray-100">
          <p className="text-xs text-gray-500 truncate mb-2" title={admin.email}>
            {admin.email}
          </p>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
