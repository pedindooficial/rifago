"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Share2, Facebook, Instagram, Twitter, MessageCircle, Users, Youtube, Linkedin } from "lucide-react";

type RedesForm = {
  facebook: string;
  instagram: string;
  twitter: string;
  whatsapp: string;
  whatsappGrupo: string;
  youtube: string;
  tiktok: string;
  linkedin: string;
  facebookAtivo: boolean;
  instagramAtivo: boolean;
  twitterAtivo: boolean;
  whatsappAtivo: boolean;
  whatsappGrupoAtivo: boolean;
  youtubeAtivo: boolean;
  tiktokAtivo: boolean;
  linkedinAtivo: boolean;
};

const REDES = [
  { key: "facebook" as const, label: "Facebook", placeholder: "https://facebook.com/suapagina", icon: Facebook, color: "text-[#1877F2]" },
  { key: "instagram" as const, label: "Instagram", placeholder: "https://instagram.com/seuusuario", icon: Instagram, color: "text-[#E4405F]" },
  { key: "twitter" as const, label: "X (Twitter)", placeholder: "https://x.com/seuusuario", icon: Twitter, color: "text-gray-800" },
  { key: "whatsapp" as const, label: "WhatsApp", placeholder: "https://wa.me/5511999999999 ou número com DDD", icon: MessageCircle, color: "text-[#25D366]" },
  { key: "whatsappGrupo" as const, label: "Grupo do WhatsApp", placeholder: "https://chat.whatsapp.com/xxxxx (link de convite do grupo)", icon: Users, color: "text-[#25D366]" },
  { key: "youtube" as const, label: "YouTube", placeholder: "https://youtube.com/@seucanal", icon: Youtube, color: "text-[#FF0000]" },
  { key: "tiktok" as const, label: "TikTok", placeholder: "https://tiktok.com/@seuusuario", icon: Share2, color: "text-gray-900" },
  { key: "linkedin" as const, label: "LinkedIn", placeholder: "https://linkedin.com/in/seuperfil", icon: Linkedin, color: "text-[#0A66C2]" },
];

const defaultForm: RedesForm = {
  facebook: "",
  instagram: "",
  twitter: "",
  whatsapp: "",
  whatsappGrupo: "",
  youtube: "",
  tiktok: "",
  linkedin: "",
  facebookAtivo: true,
  instagramAtivo: true,
  twitterAtivo: true,
  whatsappAtivo: true,
  whatsappGrupoAtivo: true,
  youtubeAtivo: true,
  tiktokAtivo: true,
  linkedinAtivo: true,
};

export default function RedesSociaisPage() {
  const [form, setForm] = useState<RedesForm>(defaultForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [salvo, setSalvo] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/config/redes-sociais");
        if (res.ok && !cancelled) {
          const data = (await res.json()) as RedesForm;
          setForm((prev) => ({ ...prev, ...data }));
        }
      } catch {
        if (!cancelled) setForm(defaultForm);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSalvo(false);
    try {
      const payload = {
        facebook: form.facebook ?? "",
        instagram: form.instagram ?? "",
        twitter: form.twitter ?? "",
        whatsapp: form.whatsapp ?? "",
        whatsappGrupo: form.whatsappGrupo ?? "",
        youtube: form.youtube ?? "",
        tiktok: form.tiktok ?? "",
        linkedin: form.linkedin ?? "",
        facebookAtivo: form.facebookAtivo ?? true,
        instagramAtivo: form.instagramAtivo ?? true,
        twitterAtivo: form.twitterAtivo ?? true,
        whatsappAtivo: form.whatsappAtivo ?? true,
        whatsappGrupoAtivo: form.whatsappGrupoAtivo ?? true,
        youtubeAtivo: form.youtubeAtivo ?? true,
        tiktokAtivo: form.tiktokAtivo ?? true,
        linkedinAtivo: form.linkedinAtivo ?? true,
      };
      const res = await fetch("/api/config/redes-sociais", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Erro ao salvar");
      setSalvo(true);
      setTimeout(() => setSalvo(false), 3000);
    } catch {
      alert("Não foi possível salvar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  const set = (key: keyof RedesForm, value: string | boolean) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/configuracao"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 text-sm sm:text-base"
        >
          <ArrowLeft className="w-5 h-5" />
          Voltar
        </Link>

        <div className="flex items-center gap-2 mb-2">
          <Share2 className="w-6 h-6 text-primary shrink-0" />
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            Redes sociais
          </h1>
        </div>
        <p className="text-gray-500 mb-6 sm:mb-8 text-sm sm:text-base">
          Adicione os links das suas redes. Eles aparecerão na página pública da campanha para os participantes seguirem ou compartilharem.
        </p>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 sm:p-6">
            {loading ? (
              <p className="text-gray-500">Carregando...</p>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {REDES.map(({ key, label, placeholder, icon: Icon, color }) => {
                  const ativoKey = `${key}Ativo` as keyof RedesForm;
                  const ativo = form[ativoKey] as boolean;
                  return (
                    <div key={key} className="space-y-2">
                      <div className="flex items-center justify-between gap-4">
                        <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                          <Icon className={`w-4 h-4 ${color}`} />
                          {label}
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer shrink-0">
                          <span className="text-xs text-gray-500">Exibir na página da rifa</span>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={ativo}
                            onClick={() => set(ativoKey, !ativo)}
                            className={`relative w-11 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                              ativo ? "bg-primary" : "bg-gray-300"
                            }`}
                          >
                            <span
                              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                                ativo ? "translate-x-5" : "translate-x-0"
                              }`}
                            />
                          </button>
                        </label>
                      </div>
                      <input
                        type="text"
                        inputMode="url"
                        value={form[key]}
                        onChange={(e) => set(key, e.target.value)}
                        placeholder={placeholder}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm sm:text-base"
                      />
                    </div>
                  );
                })}

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-3 px-4 rounded-lg bg-primary hover:bg-primary-dark disabled:opacity-80 text-white font-semibold transition-colors"
                >
                  {saving ? "Salvando..." : salvo ? "Salvo ✓" : "Salvar redes sociais"}
                </button>
              </form>
            )}
          </div>
        </div>

        <p className="mt-6 text-sm text-gray-500 text-center">
          Use o switch &quot;Exibir na página da rifa&quot; para mostrar ou esconder cada ícone na página de venda da campanha. Deixe em branco as redes que não deseja usar.
        </p>
      </div>
    </div>
  );
}
