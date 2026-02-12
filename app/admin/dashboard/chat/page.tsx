"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { MessageSquare, Send, User, Loader2, ChevronRight } from "lucide-react";

type Thread = { userId: string; email: string; name: string; lastAt?: string };
type Message = { sender: string; content: string; createdAt: string };

export default function AdminChatPage() {
  const searchParams = useSearchParams();
  const userIdFromUrl = searchParams.get("userId");
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(userIdFromUrl || null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  function loadThreads() {
    setLoadingThreads(true);
    fetch("/api/admin/chat")
      .then((res) => {
        if (!res.ok) throw new Error("Erro");
        return res.json();
      })
      .then((data: { threads: Thread[] }) => setThreads(data.threads ?? []))
      .catch(() => setThreads([]))
      .finally(() => setLoadingThreads(false));
  }

  useEffect(() => {
    loadThreads();
  }, []);

  useEffect(() => {
    if (userIdFromUrl) setSelectedUserId(userIdFromUrl);
  }, [userIdFromUrl]);

  function loadMessages() {
    if (!selectedUserId) return;
    fetch(`/api/admin/chat?userId=${selectedUserId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Erro");
        return res.json();
      })
      .then((data: { messages: Message[] }) => setMessages(data.messages ?? []))
      .catch(() => setMessages([]));
  }

  useEffect(() => {
    if (!selectedUserId) {
      setMessages([]);
      return;
    }
    loadMessages();
  }, [selectedUserId]);

  useEffect(() => {
    if (!selectedUserId) return;
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [selectedUserId]);

  useEffect(() => {
    const interval = setInterval(loadThreads, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    if (!selectedUserId || !input.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/admin/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedUserId, content: input.trim() }),
      });
      if (res.ok) {
        setInput("");
        const data = await res.json();
        setMessages((prev) => [
          ...prev,
          { sender: "admin", content: input.trim(), createdAt: new Date().toISOString() },
        ]);
      }
    } finally {
      setSending(false);
    }
  }

  function formatarHora(iso: string): string {
    try {
      return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  }

  const selectedThread = threads.find((t) => t.userId === selectedUserId);

  return (
    <div className="p-6 lg:p-8 h-full flex flex-col">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
          <MessageSquare className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Chat / Suporte</h1>
          <p className="text-sm text-gray-500">Conversas dos usuários com o suporte</p>
        </div>
      </div>

      <div className="flex-1 flex gap-4 min-h-0 bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="w-72 border-r border-gray-200 flex flex-col overflow-hidden">
          <div className="p-3 border-b border-gray-100 font-medium text-gray-700 text-sm">
            Conversas
          </div>
          {loadingThreads ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
            </div>
          ) : threads.length === 0 ? (
            <p className="p-4 text-sm text-gray-500">Nenhuma conversa ainda.</p>
          ) : (
            <ul className="overflow-y-auto flex-1">
              {threads.map((t) => (
                <li key={t.userId}>
                  <button
                    type="button"
                    onClick={() => setSelectedUserId(t.userId)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left border-b border-gray-50 hover:bg-gray-50 ${
                      selectedUserId === t.userId ? "bg-amber-50 border-l-2 border-l-amber-500" : ""
                    }`}
                  >
                    <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium text-sm shrink-0">
                      {(t.name || t.email)[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate text-sm">{t.name || t.email}</p>
                      <p className="text-xs text-gray-500 truncate">{t.email}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex-1 flex flex-col min-w-0">
          {!selectedUserId ? (
            <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
              Selecione uma conversa
            </div>
          ) : (
            <>
              <div className="p-3 border-b border-gray-100 flex items-center gap-2">
                <User className="w-4 h-4 text-gray-400" />
                <span className="font-medium text-gray-900">
                  {selectedThread?.name || selectedThread?.email || selectedUserId}
                </span>
                <span className="text-gray-500 text-sm">({selectedThread?.email})</span>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((m, i) => (
                  <div
                    key={i}
                    className={`flex ${m.sender === "admin" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-2 ${
                        m.sender === "admin"
                          ? "bg-amber-500 text-white"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                      <p
                        className={`text-xs mt-1 ${
                          m.sender === "admin" ? "text-amber-100" : "text-gray-500"
                        }`}
                      >
                        {formatarHora(m.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              <div className="p-3 border-t border-gray-100 flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendMessage())}
                  placeholder="Digite sua resposta..."
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                />
                <button
                  type="button"
                  onClick={sendMessage}
                  disabled={!input.trim() || sending}
                  className="px-4 py-2.5 rounded-lg bg-amber-600 text-white font-medium disabled:opacity-50 hover:bg-amber-700 flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Enviar
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
