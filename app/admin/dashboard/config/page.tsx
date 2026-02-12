"use client";

import { useEffect, useState } from "react";
import { Settings, MessageCircle, UserPlus, Loader2, Save } from "lucide-react";
import Link from "next/link";

export default function AdminConfigPage() {
  const [whatsappUrl, setWhatsappUrl] = useState("");
  const [registrationOpen, setRegistrationOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/admin/config")
      .then((res) => {
        if (!res.ok) throw new Error("Erro");
        return res.json();
      })
      .then((data: { whatsappUrl?: string; registrationOpen?: boolean }) => {
        setWhatsappUrl(data.whatsappUrl ?? "");
        setRegistrationOpen(data.registrationOpen ?? false);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/admin/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ whatsappUrl: whatsappUrl.trim(), registrationOpen }),
      });
      if (res.ok) setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6 lg:p-8 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <Settings className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Configurações do admin</h1>
            <p className="text-sm text-gray-500">WhatsApp do suporte e cadastro de admin</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <MessageCircle className="w-5 h-5 text-amber-600" />
              <h2 className="font-semibold text-gray-900">Botão WhatsApp (Suporte)</h2>
            </div>
            <p className="text-sm text-gray-500 mb-3">
              O link ou número configurado aqui aparecerá na página de Suporte dos usuários (dashboard), para que eles possam chamar no WhatsApp.
            </p>
            <input
              type="text"
              value={whatsappUrl}
              onChange={(e) => setWhatsappUrl(e.target.value)}
              placeholder="https://wa.me/5511999999999 ou 5511999999999"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <UserPlus className="w-5 h-5 text-amber-600" />
              <h2 className="font-semibold text-gray-900">Cadastro de administrador</h2>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Se ativado, a página de cadastro de admin (<Link href="/admin/registro" className="text-amber-600 hover:underline">/admin/registro</Link>) ficará disponível para criar um novo administrador. Desative após o primeiro cadastro e reative apenas quando quiser permitir outro cadastro.
            </p>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={registrationOpen}
                onChange={(e) => setRegistrationOpen(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
              />
              <span className="text-sm font-medium text-gray-700">Ativar página de cadastro de admin</span>
            </label>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 text-white font-semibold hover:bg-amber-700 disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Salvar
            </button>
            {saved && (
              <span className="text-sm text-green-600 font-medium">Salvo com sucesso.</span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
