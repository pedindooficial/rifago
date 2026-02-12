"use client";

import { useEffect, useState, useRef } from "react";
import { MessageCircle, Send, Headphones, MessageCircle as MessageCircleIcon } from "lucide-react";

type Message = { sender: string; content: string; createdAt: string };

function formatarHora(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

export default function SuportePage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [whatsappUrl, setWhatsappUrl] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  function fetchMessages() {
    return fetch("/api/support/messages")
      .then((res) => (res.ok ? res.json() : { messages: [] }))
      .then((data: { messages?: Message[] }) => setMessages(data.messages ?? []))
      .catch(() => {});
  }

  useEffect(() => {
    Promise.all([
      fetch("/api/support/messages").then((res) => (res.ok ? res.json() : { messages: [] })),
      fetch("/api/support/config").then((res) => (res.ok ? res.json() : { whatsappUrl: "" })),
    ])
      .then(([msgData, configData]) => {
        setMessages((msgData as { messages: Message[] }).messages ?? []);
        setWhatsappUrl((configData as { whatsappUrl?: string }).whatsappUrl ?? "");
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (loading) return;
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [loading]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    if (!input.trim() || sending) return;
    setSending(true);
    const text = input.trim();
    setInput("");
    try {
      const res = await fetch("/api/support/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });
      if (res.ok) {
        setMessages((prev) => [
          ...prev,
          { sender: "user", content: text, createdAt: new Date().toISOString() },
        ]);
      } else {
        setInput(text);
      }
    } catch {
      setInput(text);
    } finally {
      setSending(false);
    }
  }

  const whatsappLink =
    whatsappUrl.trim() &&
    (whatsappUrl.trim().startsWith("http") ? whatsappUrl.trim() : `https://wa.me/${whatsappUrl.replace(/\D/g, "")}`);

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Headphones className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Suporte</h1>
              <p className="text-sm text-gray-500">Converse com a equipe ou chame no WhatsApp</p>
            </div>
          </div>
          {whatsappLink && (
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold transition-colors"
            >
              <MessageCircleIcon className="w-5 h-5" />
              Chamar no WhatsApp
            </a>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col min-h-[400px]">
          <div className="p-3 border-b border-gray-100 flex items-center gap-2 text-gray-700 font-medium">
            <MessageCircle className="w-5 h-5 text-primary" />
            Chat com o suporte
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[280px]">
            {messages.length === 0 ? (
              <div className="text-center py-12 text-gray-500 text-sm">
                Nenhuma mensagem ainda. Envie uma mensagem ou use o botão acima para chamar no WhatsApp.
              </div>
            ) : (
              messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      m.sender === "user" ? "bg-primary text-white" : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                    <p
                      className={`text-xs mt-1 ${
                        m.sender === "user" ? "text-primary-100" : "text-gray-500"
                      }`}
                    >
                      {formatarHora(m.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="p-3 border-t border-gray-100 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendMessage())}
              placeholder="Digite sua mensagem..."
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
            />
            <button
              type="button"
              onClick={sendMessage}
              disabled={!input.trim() || sending}
              className="px-4 py-2.5 rounded-lg bg-primary text-white font-medium disabled:opacity-50 hover:bg-primary-dark flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              Enviar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
