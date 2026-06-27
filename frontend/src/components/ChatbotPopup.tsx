import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Bot, ShieldCheck, Send, UserRound, X, Sparkles } from "lucide-react";

import { ErrorBlock } from "./StateBlock";
import { api } from "../services/api";
import type { ChatChildContext, ChatResponse } from "../types";

interface Message {
  role: "user" | "assistant";
  text: string;
  source?: ChatResponse["source"];
  safetyLevel?: string;
  suggestedActions?: string[];
}

const suggestions = [
  "Apa itu stunting?",
  "Anak saya berisiko, harus apa?",
  "Variasi makanan balita gizi kurang?",
  "Makanan apa yang baik untuk balita?",
  "Kapan harus ke Puskesmas?",
];

function contextLabel(context?: ChatChildContext | null) {
  if (!context) return null;
  const parts = [
    context.age_month !== undefined && context.age_month !== null ? `${context.age_month} bulan` : null,
    context.nutrition_status ? `hasil ${context.nutrition_status}` : null,
    context.risk_level ? `risiko ${context.risk_level}` : null,
  ].filter(Boolean);
  return parts.length ? parts.join(" | ") : null;
}

export default function ChatbotPopup() {

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "Halo! Saya Asisten Pintar StuntGuard. Saya siap membantu memberikan panduan gizi dan edukasi tumbuh kembang balita Anda secara sederhana.",
      source: "rule-based",
      safetyLevel: "safe",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Dynamic context retrieval from sessionStorage
  const [childContext, setChildContext] = useState<ChatChildContext | null>(null);

  const contextSummary = useMemo(() => contextLabel(childContext), [childContext]);

  // Read context whenever chat opens
  useEffect(() => {
    if (isOpen) {
      try {
        const raw = window.sessionStorage.getItem("stuntguard_last_child_context");
        if (raw) {
          setChildContext(JSON.parse(raw) as ChatChildContext);
        } else {
          setChildContext(null);
        }
      } catch {
        setChildContext(null);
      }
    }
  }, [isOpen]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Listen to custom open event
  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener("open-chatbot", handleOpen);
    return () => window.removeEventListener("open-chatbot", handleOpen);
  }, []);

  const ask = async (message: string) => {
    if (!message.trim()) return;
    setMessages((items) => [...items, { role: "user", text: message }]);
    setInput("");
    setLoading(true);
    setError(null);
    try {
      const response = await api.chatbot(message, childContext);
      setMessages((items) => [
        ...items,
        {
          role: "assistant",
          text: response.reply,
          source: response.source,
          safetyLevel: response.safety_level,
          suggestedActions: response.suggested_actions,
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Asisten AI sedang sibuk. Silakan coba sesaat lagi.");
    } finally {
      setLoading(false);
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    ask(input);
  };

  return (
    <>
      {/* Floating Action Button (FAB) */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Buka Tanya AI Gizi"
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-cyan-600 to-teal-600 text-white shadow-xl hover:shadow-cyan-500/30 hover:scale-105 transition-all duration-300 focus:outline-none"
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <div className="relative">
            <Bot className="h-7 w-7" />
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white"></span>
            </span>
          </div>
        )}
      </button>

      {/* Chat Window Panel */}
      {/* Chat Window Panel */}
      <section
        aria-label="Tanya AI Gizi"
        className={`fixed bottom-24 right-6 z-50 flex w-[400px] max-w-[calc(100vw-2rem)] h-[540px] flex-col overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white shadow-2xl transition-all duration-350 transform ${
          isOpen
            ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
            : "opacity-0 translate-y-6 scale-95 pointer-events-none"
        }`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-600 via-cyan-700 to-teal-600 px-5 py-4 text-white flex items-center justify-between shadow-md relative">
          <div className="flex items-center gap-3">
            <div className="relative rounded-2xl bg-white/10 p-2 border border-white/10">
              <Bot className="h-5 w-5 text-white" />
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-cyan-700" />
            </div>
            <div>
              <h3 className="font-heading text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                Tanya AI Gizi
                <span className="inline-flex rounded-md bg-emerald-500/20 px-1 py-0.5 text-[8px] font-bold uppercase tracking-wider text-emerald-300 border border-emerald-500/25">Online</span>
              </h3>
              <p className="text-[10px] text-cyan-100 font-medium">Asisten Tumbuh Kembang & Menu Gizi</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            aria-label="Tutup Obrolan"
            className="rounded-lg p-1 text-cyan-100 hover:bg-white/10 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Context Banner */}
        {contextSummary && (
          <div className="bg-cyan-50/80 px-4 py-2 border-b border-cyan-100 text-[11px] text-cyan-800 flex items-center gap-1.5 font-medium leading-snug">
            <Sparkles className="h-3 w-3 text-cyan-600 shrink-0" />
            <span>Memakai info skrining terakhir: <strong className="text-cyan-950 font-bold">{contextSummary}</strong></span>
          </div>
        )}

        {/* Messages List Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`flex gap-2.5 ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {message.role === "assistant" && (
                <div className="mt-1 flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-lg bg-cyan-50 p-1.5 text-cyan-700 border border-cyan-100">
                  <Bot className="h-4.5 w-4.5" />
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                  message.role === "user"
                    ? "bg-cyan-600 text-white rounded-tr-none shadow-sm"
                    : "border border-slate-200 bg-white text-slate-700 rounded-tl-none shadow-card"
                }`}
              >
                <p className="whitespace-pre-wrap">{message.text}</p>
                
                {message.suggestedActions?.length ? (
                  <div className="mt-2.5 rounded-xl bg-slate-50 p-2.5 text-[11px] leading-relaxed text-slate-600 border border-slate-100">
                    <p className="font-bold text-slate-800 mb-1">Langkah yang disarankan:</p>
                    <ul className="list-disc pl-3.5 space-y-0.5">
                      {message.suggestedActions.map((action) => (
                        <li key={action}>{action}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
              {message.role === "user" && (
                <div className="mt-1 flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-lg bg-slate-100 p-1.5 text-slate-650">
                  <UserRound className="h-4.5 w-4.5" />
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex gap-2.5 justify-start" role="status" aria-live="polite">
              <div className="mt-1 flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-lg bg-cyan-50 p-1.5 text-cyan-700 border border-cyan-100">
                <Bot className="h-4.5 w-4.5" />
              </div>
              <div className="rounded-2xl rounded-tl-none border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-500 shadow-card flex items-center space-x-1">
                <span>Memikirkan saran gizi</span>
                <span className="flex items-center space-x-0.5 ml-1">
                  <span className="w-1 h-1 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1 h-1 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1 h-1 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                </span>
              </div>
            </div>
          )}
          {error && <ErrorBlock message={error} />}
          <div ref={messagesEndRef} />
        </div>

        {/* Input & Options Footer */}
        <div className="border-t border-slate-150 p-3 bg-white space-y-2">
          {/* Quick Suggestions Scroll */}
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {suggestions.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => ask(item)}
                disabled={loading}
                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-bold text-slate-600 hover:border-cyan-200 hover:bg-cyan-50/50 hover:text-cyan-800 transition whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-50"
              >
                {item}
              </button>
            ))}
          </div>

          {/* Input Form */}
          <form className="flex gap-1.5" onSubmit={submit}>
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              maxLength={500}
              aria-label="Tulis pertanyaan gizi balita"
              placeholder="Tulis pertanyaan gizi balita..."
              className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-50"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 p-2.5 text-white hover:opacity-90 disabled:opacity-50 transition shrink-0"
            >
              <Send className="h-4.5 w-4.5" />
            </button>
          </form>

          {/* AI Warning */}
          <p className="inline-flex items-start gap-1 text-[9px] leading-normal text-slate-450">
            <ShieldCheck className="h-3.5 w-3.5 text-cyan-600 shrink-0 mt-0.5" />
            <span>Anjuran AI bersifat edukasi umum, bukan diagnosis medis. Konsultasikan ke bidan/Puskesmas untuk medis.</span>
          </p>
        </div>
      </section>
    </>
  );
}
