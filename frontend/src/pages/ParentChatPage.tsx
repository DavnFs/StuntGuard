import { FormEvent, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { Bot, Send, ShieldCheck, Sparkles, UserRound } from "lucide-react";

import { ErrorBlock } from "../components/StateBlock";
import { api } from "../services/api";
import type { ChatChildContext, ChatResponse } from "../types";

interface Message {
  role: "user" | "assistant";
  text: string;
  source?: ChatResponse["source"];
  safetyLevel?: string;
  suggestedActions?: string[];
}

interface LocationState {
  childContext?: string | null;
  childName?: string | null;
}

const suggestions = [
  "Apa itu stunting?",
  "Anak saya berisiko, harus apa?",
  "Variasi makanan balita gizi kurang?",
  "Makanan apa yang baik untuk balita?",
  "Kapan harus ke Puskesmas?",
];

export default function ParentChatPage() {
  const location = useLocation();
  const routeState = (location.state as LocationState | null) ?? {};
  const routeChildContext = routeState.childContext ?? null;
  const routeChildName = routeState.childName ?? null;

  // Fallback: read from sessionStorage if no route state
  const [childContext, setChildContext] = useState<ChatChildContext | null>(() => {
    if (routeChildContext) return null; // handled via string path instead
    try {
      const raw = window.sessionStorage.getItem("stuntguard_last_child_context");
      return raw ? (JSON.parse(raw) as ChatChildContext) : null;
    } catch {
      return null;
    }
  });

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "Halo, saya Asisten StuntGuard! Saya siap membantu Anda memahami hasil skrining, memberikan edukasi gizi balita, dan menjawab pertanyaan seputar tumbuh kembang anak.",
      source: "rule-based",
      safetyLevel: "safe",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const firstMessageSent = useRef(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Clear route state on unmount — chat stays ephemeral
  useEffect(() => {
    return () => {
      firstMessageSent.current = false;
    };
  }, []);

  const ask = async (message: string) => {
    if (!message.trim()) return;

    // Silently prepend child context on VERY FIRST message only
    let finalMessage = message;
    if (!firstMessageSent.current && routeChildContext) {
      finalMessage = `[Data Anak: ${routeChildContext}]\n\nPertanyaan Orang Tua: "${message}"`;
      firstMessageSent.current = true;
    }

    setMessages((items) => [...items, { role: "user", text: message }]);
    setInput("");
    setLoading(true);
    setError(null);
    try {
      const response = await api.chatbot(finalMessage, childContext);
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
      setError(err instanceof Error ? err.message : "Asisten AI sedang sibuk. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    ask(input);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Fixed header — native dashboard bar */}
      <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-0 pb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 text-white shadow-sm">
          <Bot className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-heading text-lg font-bold text-slate-950">Analisis Pertumbuhan AI</h1>
          <p className="text-xs text-slate-500">
            Asisten edukasi gizi dan tumbuh kembang balita &mdash; bukan pengganti konsultasi tenaga kesehatan
          </p>
        </div>
      </div>

      {/* Data KMS info banner — shows when route state is present */}
      {routeChildContext && (
        <div className="flex items-center gap-2 border-b border-cyan-100 bg-cyan-50 px-4 py-3 text-sm text-cyan-900">
          <Sparkles className="h-4 w-4 shrink-0 text-cyan-600" />
          <span>
            Sedang membahas data KMS: <strong className="font-bold">{routeChildName ?? "anak"}</strong>
          </span>
        </div>
      )}

      {/* Scrollable messages area — fills remaining height */}
      <div className="flex-1 overflow-y-auto bg-slate-50/50">
        <div className="mx-auto flex max-w-3xl flex-col gap-5 px-0 py-5">
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {message.role === "assistant" && (
                <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100">
                  <Bot className="h-4 w-4" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  message.role === "user"
                    ? "rounded-tr-sm bg-cyan-600 text-white"
                    : "rounded-tl-sm border border-slate-200 bg-white text-slate-700"
                }`}
              >
                <p className="whitespace-pre-wrap">{message.text}</p>

                {message.suggestedActions?.length ? (
                  <div className="mt-3 rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-600 ring-1 ring-slate-100">
                    <p className="mb-1 font-bold text-slate-800">Langkah yang disarankan:</p>
                    <ul className="list-disc pl-4 space-y-0.5">
                      {message.suggestedActions.map((action) => (
                        <li key={action}>{action}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {message.source && message.role === "assistant" && (
                  <details className="mt-2 text-[11px] opacity-60 hover:opacity-100 transition">
                    <summary className="cursor-pointer font-medium">Detail sistem</summary>
                    <p className="mt-1">
                      Sumber: {message.source} | Keamanan: {message.safetyLevel ?? "-"}
                    </p>
                  </details>
                )}
              </div>
              {message.role === "user" && (
                <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 ring-1 ring-slate-200">
                  <UserRound className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100">
                <Bot className="h-4 w-4" />
              </div>
              <div className="flex items-center gap-2 rounded-2xl rounded-tl-sm border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
                <span>Memikirkan saran gizi</span>
                <span className="flex items-center gap-0.5">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: "0ms" }} />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: "150ms" }} />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: "300ms" }} />
                </span>
              </div>
            </div>
          )}

          {error && <ErrorBlock message={error} />}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Fixed input bar — docked flat */}
      <div className="border-t border-slate-200 bg-white px-0 pt-4">
        <div className="mx-auto max-w-3xl">
          <div className="mb-3 flex flex-wrap gap-2">
            {suggestions.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => ask(item)}
                disabled={loading}
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {item}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="flex gap-3">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              maxLength={500}
              aria-label="Tulis pertanyaan edukasi gizi"
              placeholder="Tulis pertanyaan edukasi gizi..."
              className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-50"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              Kirim
            </button>
          </form>

          <div className="mt-3 flex items-start gap-2 pb-1 text-xs leading-5 text-slate-500">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-cyan-600" />
            <span>
              Informasi bersifat edukasi gizi umum dan bukan pengganti konsultasi tenaga kesehatan. Chat tidak disimpan — refresh akan menghapus percakapan.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
