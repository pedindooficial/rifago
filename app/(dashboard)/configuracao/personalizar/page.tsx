 "use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Image as ImageIcon, Sparkles, Palette, Type, MessageSquare, AlignLeft } from "lucide-react";

type BrandingForm = {
  siteTitle: string;
  logoUrl: string;
  faviconUrl: string;
  primaryColor: string;
  ctaButtonText: string;
  slogan: string;
  footerText: string;
};

const defaultForm: BrandingForm = {
  siteTitle: "",
  logoUrl: "",
  faviconUrl: "",
  primaryColor: "",
  ctaButtonText: "Participar",
  slogan: "",
  footerText: "",
};

export default function Personalizar() {
  const [form, setForm] = useState<BrandingForm>(defaultForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [salvo, setSalvo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const faviconInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/config/personalizar");
        if (!cancelled && res.ok) {
          const data = (await res.json()) as BrandingForm;
          setForm((prev) => ({ ...prev, ...data }));
        }
      } catch {
        if (!cancelled) setForm(defaultForm);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSalvo(false);
    try {
      const payload: BrandingForm = {
        siteTitle: form.siteTitle ?? "",
        logoUrl: form.logoUrl ?? "",
        faviconUrl: form.faviconUrl ?? "",
        primaryColor: form.primaryColor ?? "",
        ctaButtonText: form.ctaButtonText || "Participar",
        slogan: form.slogan ?? "",
        footerText: form.footerText ?? "",
      };
      const res = await fetch("/api/config/personalizar", {
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

  const handleFile = (file: File, target: "logoUrl" | "faviconUrl") => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setForm((f) => ({ ...f, [target]: result }));
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/configuracao"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" /> Voltar
        </Link>

        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-gray-900">Personalize do seu jeito</h1>
        </div>
        <p className="text-gray-500 mb-6">
          Defina logo, favicon, cores e textos que aparecerão na página de venda. O título da aba será: <strong>Nome da marca | Nome da campanha</strong>.
        </p>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {loading ? (
              <p className="text-gray-500">Carregando...</p>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Type className="w-4 h-4 text-primary" />
                    Nome da sua marca
                  </label>
                  <input
                    type="text"
                    value={form.siteTitle}
                    onChange={(e) => setForm((f) => ({ ...f, siteTitle: e.target.value }))}
                    placeholder="Ex.: Sul Prêmios"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm sm:text-base"
                  />
                  <p className="text-xs text-gray-500">
                    Na aba do navegador aparecerá: <strong>Nome da marca | Nome da campanha</strong>. Deixe em branco para usar só o nome da campanha.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Logo principal */}
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Logotipo principal (cabeçalho da página)
                    </label>
                    <div className="border border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center gap-3">
                      {form.logoUrl ? (
                        <>
                          <div className="relative w-48 h-16">
                            <Image
                              src={form.logoUrl}
                              alt="Logo do organizador"
                              fill
                              className="object-contain"
                              unoptimized
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => setForm((f) => ({ ...f, logoUrl: "" }))}
                            className="text-xs text-red-600 hover:underline"
                          >
                            Remover logo
                          </button>
                        </>
                      ) : (
                        <>
                          <ImageIcon className="w-8 h-8 text-gray-400" />
                          <p className="text-xs text-gray-500 text-center">
                            Envie uma imagem em PNG ou JPG, de preferência com fundo transparente.
                          </p>
                        </>
                      )}
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFile(file, "logoUrl");
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => logoInputRef.current?.click()}
                        className="mt-2 inline-flex items-center justify-center px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        {form.logoUrl ? "Trocar logo" : "Adicionar logo"}
                      </button>
                    </div>
                  </div>

                  {/* Favicon */}
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Favicon (ícone da aba do navegador)
                    </label>
                    <div className="border border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center gap-3">
                      {form.faviconUrl ? (
                        <>
                          <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-gray-200">
                            <Image
                              src={form.faviconUrl}
                              alt="Favicon"
                              fill
                              className="object-contain"
                              unoptimized
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => setForm((f) => ({ ...f, faviconUrl: "" }))}
                            className="text-xs text-red-600 hover:underline"
                          >
                            Remover favicon
                          </button>
                        </>
                      ) : (
                        <>
                          <ImageIcon className="w-6 h-6 text-gray-400" />
                          <p className="text-xs text-gray-500 text-center">
                            Imagem quadrada (ex.: 64x64px) em PNG. Usada na aba do navegador.
                          </p>
                        </>
                      )}
                      <input
                        ref={faviconInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFile(file, "faviconUrl");
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => faviconInputRef.current?.click()}
                        className="mt-2 inline-flex items-center justify-center px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        {form.faviconUrl ? "Trocar favicon" : "Adicionar favicon"}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-6 space-y-6">
                  <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                    <Palette className="w-4 h-4 text-primary" />
                    Cores e textos
                  </h3>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Cor primária (botões e destaques)
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={form.primaryColor || "#DC2626"}
                        onChange={(e) => setForm((f) => ({ ...f, primaryColor: e.target.value }))}
                        className="w-12 h-12 rounded-lg border border-gray-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={form.primaryColor}
                        onChange={(e) => setForm((f) => ({ ...f, primaryColor: e.target.value }))}
                        placeholder="#DC2626"
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                      />
                    </div>
                    <p className="text-xs text-gray-500">Deixe em branco para usar a cor padrão do Rifago.</p>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-primary" />
                      Texto do botão principal
                    </label>
                    <input
                      type="text"
                      value={form.ctaButtonText}
                      onChange={(e) => setForm((f) => ({ ...f, ctaButtonText: e.target.value }))}
                      placeholder="Participar"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm sm:text-base"
                    />
                    <p className="text-xs text-gray-500">Ex.: Participar, Comprar cotas, Garantir meu número.</p>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                      <AlignLeft className="w-4 h-4 text-primary" />
                      Slogan ou frase de destaque
                    </label>
                    <input
                      type="text"
                      value={form.slogan}
                      onChange={(e) => setForm((f) => ({ ...f, slogan: e.target.value }))}
                      placeholder="Ex.: Sua sorte está aqui!"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm sm:text-base"
                    />
                    <p className="text-xs text-gray-500">Aparece na página da rifa, abaixo do nome da campanha.</p>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Texto do rodapé
                    </label>
                    <textarea
                      value={form.footerText}
                      onChange={(e) => setForm((f) => ({ ...f, footerText: e.target.value }))}
                      placeholder="Ex.: Dúvidas? Fale conosco no WhatsApp (11) 99999-9999"
                      rows={2}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm sm:text-base resize-none"
                    />
                    <p className="text-xs text-gray-500">Opcional. Exibido no rodapé da página de venda.</p>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-3 px-4 rounded-lg bg-primary hover:bg-primary-dark disabled:opacity-80 text-white font-semibold transition-colors"
                >
                  {saving ? "Salvando..." : salvo ? "Salvo ✓" : "Salvar personalização"}
                </button>
              </>
            )}
          </form>
        </div>

        <p className="mt-6 text-sm text-gray-500 text-center">
          Essas configurações afetam apenas a sua conta: todas as suas campanhas públicas usarão essa identidade na página de venda.
        </p>
      </div>
    </div>
  );
}

