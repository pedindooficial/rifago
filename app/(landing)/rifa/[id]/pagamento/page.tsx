"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Ticket, Copy, CheckCircle2, Share2, Loader2 } from "lucide-react";
import Logo from "@/components/Logo";
import { formatarMoeda } from "@/lib/taxas";

type SessionData = {
  token: string;
  pagamentoId: string;
  qrCode: string;
  qrCodeBase64: string | null;
  ticketUrl?: string;
  modo: string;
  campanhaId: string;
  campanhaNome: string;
  minutosPixExpirar: number;
  nome: string;
  email: string;
  cpfMascarado: string;
  quantidade: number;
  valorTotal: number;
};

export default function PagamentoPixPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const campanhaId = params.id as string;

  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [pago, setPago] = useState(false);
  const [verificando, setVerificando] = useState(false);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (!token) {
      setErro("Link de pagamento inválido. Gere um novo PIX na página da campanha.");
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/pagamentos/pix/session?token=${encodeURIComponent(token)}`);
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) {
          setErro((data as { error?: string }).error ?? "Sessão expirada. Gere um novo PIX na página da campanha.");
          setLoading(false);
          return;
        }
        setSession(data as SessionData);
      } catch {
        if (!cancelled) setErro("Erro ao carregar dados do pagamento.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  const verificarPagamento = useCallback(async () => {
    if (!token) return;
    setVerificando(true);
    try {
      const res = await fetch(`/api/pagamentos/mercadopago/status?token=${encodeURIComponent(token)}`);
      const data = await res.json().catch(() => ({}));
      if ((data as { approved?: boolean }).approved) {
        await fetch("/api/pagamentos/mercadopago/confirmar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        setPago(true);
      }
    } finally {
      setVerificando(false);
    }
  }, [token]);

  const copiarCodigo = useCallback(async () => {
    if (!session?.qrCode) return;
    try {
      await navigator.clipboard.writeText(session.qrCode);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // ignore
    }
  }, [session?.qrCode]);

  const compartilhar = useCallback(async () => {
    const url = typeof window !== "undefined" ? window.location.origin + "/meus-numeros" : "";
    const title = "Participei da rifa! Confira meus números.";
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title,
          url,
          text: title,
        });
      } catch {
        // usuário cancelou ou erro
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${title} ${url}`);
        setCopiado(true);
        setTimeout(() => setCopiado(false), 2000);
      } catch {
        // ignore
      }
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
            <Logo href="/" size="xs" />
            <Link
              href="/meus-numeros"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 font-medium text-xs sm:text-sm"
            >
              <Ticket className="w-4 h-4" />
              Meus números
            </Link>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="flex items-center gap-2 text-gray-600">
            <Loader2 className="w-6 h-6 animate-spin" />
            Carregando...
          </div>
        </div>
      </div>
    );
  }

  if (erro || !session) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
            <Logo href="/" size="xs" />
            <Link
              href="/meus-numeros"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 font-medium text-xs sm:text-sm"
            >
              <Ticket className="w-4 h-4" />
              Meus números
            </Link>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <p className="text-gray-700 mb-4">{erro ?? "Sessão não encontrada."}</p>
            <Link
              href={campanhaId ? `/rifa/${campanhaId}` : "/"}
              className="inline-flex items-center gap-2 text-primary font-medium hover:underline"
            >
              {campanhaId ? "Voltar à campanha" : "Voltar ao início"}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (pago) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
            <Logo href="/" size="xs" />
            <Link
              href="/meus-numeros"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 font-medium text-xs sm:text-sm"
            >
              <Ticket className="w-4 h-4" />
              Meus números
            </Link>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 w-full max-w-md p-6 sm:p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10 text-green-600" strokeWidth={2} />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Obrigado pelo pagamento!</h1>
            <p className="text-gray-600 mb-6">
              Suas cotas da campanha <strong>{session.campanhaNome}</strong> serão registradas em breve. Você pode conferir em Meus números.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={compartilhar}
                className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-primary bg-primary/5 text-primary font-semibold hover:bg-primary/10 transition-colors"
              >
                <Share2 className="w-5 h-5" />
                {copiado ? "Link copiado!" : "Compartilhar"}
              </button>
              <Link
                href="/meus-numeros"
                className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary hover:bg-primary-dark text-white font-semibold transition-colors"
              >
                <Ticket className="w-5 h-5" />
                Meus números
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const minutosTexto =
    session.minutosPixExpirar === 15
      ? "15 min"
      : session.minutosPixExpirar === 30
        ? "30 min"
        : `${session.minutosPixExpirar} min`;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <Logo href="/" size="xs" />
          <Link
            href="/meus-numeros"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 font-medium text-xs sm:text-sm"
          >
            <Ticket className="w-4 h-4" />
            Meus números
          </Link>
        </div>
      </header>

      <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-100 bg-gray-50/50">
            <h1 className="text-lg sm:text-xl font-bold text-gray-900">Pagamento via PIX</h1>
            <p className="text-sm text-gray-600 mt-1">
              Escaneie o QR Code ou copie o código PIX para pagar no seu banco.
            </p>
            <p className="text-sm font-medium text-gray-700 mt-2">PIX expira em {minutosTexto}.</p>
          </div>

          <div className="p-4 sm:p-6 space-y-6">
            {/* Dados do pagador e da compra */}
            <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Resumo da compra
              </p>
              <p className="text-sm font-medium text-gray-900 mb-1">{session.campanhaNome}</p>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-gray-600 mt-3">
                <dt>Nome</dt>
                <dd className="font-medium text-gray-900">{session.nome}</dd>
                <dt>E-mail</dt>
                <dd className="font-medium text-gray-900 break-all">{session.email}</dd>
                <dt>CPF</dt>
                <dd className="font-medium text-gray-900">{session.cpfMascarado}</dd>
                <dt>Quantidade</dt>
                <dd className="font-medium text-gray-900">{session.quantidade} cota(s)</dd>
                <dt>Total</dt>
                <dd className="font-bold text-gray-900">R$ {formatarMoeda(session.valorTotal)}</dd>
              </dl>
            </div>

            {/* QR Code */}
            {session.qrCodeBase64 && (
              <div className="flex justify-center p-4 bg-gray-50 rounded-2xl">
                <img
                  src={`data:image/png;base64,${session.qrCodeBase64}`}
                  alt="QR Code PIX"
                  className="w-48 h-48"
                />
              </div>
            )}

            {/* Código copia e cola */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Código PIX (copia e cola)
              </label>
              <div className="flex gap-2">
                <textarea
                  className="flex-1 px-3 py-2 rounded-xl border border-gray-300 text-xs text-gray-700 resize-none h-20 focus:ring-2 focus:ring-primary focus:border-transparent"
                  readOnly
                  value={session.qrCode}
                />
                <button
                  type="button"
                  onClick={copiarCodigo}
                  className="shrink-0 p-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 h-20"
                  title="Copiar código"
                >
                  {copiado ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <p className="text-xs text-gray-500">
              Após o pagamento ser confirmado pelo Mercado Pago, suas cotas serão registradas automaticamente.
            </p>

            <button
              type="button"
              onClick={verificarPagamento}
              disabled={verificando}
              className="w-full rounded-xl bg-primary hover:bg-primary-dark text-white font-semibold py-3 px-4 flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {verificando ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Verificando...
                </>
              ) : (
                "Já paguei — verificar pagamento"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
