import { FormEvent, useMemo, useState } from "react";
import { Bot, ShieldCheck, Send, UserRound } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

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

const suggestions = [
  "Apa itu stunting?",
  "Anak saya berisiko, harus apa?",
  "Apa efeknya jika dibiarkan?",
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

export default function ChatbotPage() {
  const location = useLocation();
  const routedContext = (location.state as { childContext?: ChatChildContext } | null)?.childContext ?? null;
  const storedContext = useMemo(() => {
    try {
      const raw = window.sessionStorage.getItem("stuntguard_last_child_context");
      return raw ? (JSON.parse(raw) as ChatChildContext) : null;
    } catch {
      return null;
    }
  }, []);
  const childContext = routedContext ?? storedContext;
  const contextSummary = useMemo(() => contextLabel(childContext), [childContext]);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "Halo, saya Asisten StuntGuard. Saya bisa membantu menjelaskan stunting, hasil skrining, dan edukasi gizi balita.",
      source: "rule-based",
      safetyLevel: "safe",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      setError(err instanceof Error ? err.message : "Chatbot gagal menjawab");
    } finally {
      setLoading(false);
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    ask(input);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-brand-700">StuntGuard AI Assistant</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-950">Asisten Edukasi Gizi Balita</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Tanyakan seputar stunting, hasil skrining, makanan bergizi, dan kapan perlu ke Puskesmas.
          </p>
        </div>
        <Link to="/" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
          Kembali ke Landing
        </Link>
      </div>

      {contextSummary ? (
        <div className="rounded-lg border border-care-200 bg-care-50 p-4 text-sm text-care-800">
          Konteks skrining aktif: {contextSummary}. Asisten akan memakai konteks ini untuk memberi edukasi umum, bukan diagnosis.
        </div>
      ) : null}

      {error ? <ErrorBlock message={error} /> : null}

      <section className="rounded-2xl border border-slate-200/80 bg-white shadow-card">
        <div className="h-[520px] overflow-y-auto p-5">
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {message.role === "assistant" ? (
                  <div className="mt-1 rounded-lg bg-brand-50 p-2 text-brand-700">
                    <Bot className="h-4 w-4" />
                  </div>
                ) : null}
                <div
                  className={`max-w-2xl rounded-lg px-4 py-3 text-sm leading-6 ${
                    message.role === "user"
                      ? "bg-brand-600 text-white"
                      : "border border-slate-200 bg-slate-50 text-slate-700"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.text}</p>
                  {message.suggestedActions?.length ? (
                    <div className="mt-3 rounded-lg bg-white/70 p-3 text-xs leading-5 text-slate-600">
                      <p className="font-semibold text-slate-800">Langkah yang bisa dilakukan:</p>
                      <ul className="mt-1 list-disc pl-4">
                        {message.suggestedActions.map((action) => (
                          <li key={action}>{action}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {message.source && message.role === "assistant" ? (
                    <details className="mt-3 text-xs opacity-70">
                      <summary className="cursor-pointer font-semibold">Detail sistem</summary>
                      <p className="mt-1">
                        Source: {message.source} | Safety: {message.safetyLevel ?? "-"}
                      </p>
                    </details>
                  ) : null}
                </div>
                {message.role === "user" ? (
                  <div className="mt-1 rounded-lg bg-slate-100 p-2 text-slate-600">
                    <UserRound className="h-4 w-4" />
                  </div>
                ) : null}
              </div>
            ))}
            {loading ? (
              <div role="status" aria-live="polite" className="text-sm text-slate-500">Menyiapkan jawaban aman...</div>
            ) : null}
          </div>
        </div>

        <div className="border-t border-slate-200 p-4">
          <div className="mb-3 flex flex-wrap gap-2">
            {suggestions.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => ask(item)}
                disabled={loading}
                className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {item}
              </button>
            ))}
          </div>
          <form className="flex gap-2" onSubmit={submit}>
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              maxLength={500}
              aria-label="Pertanyaan edukasi"
              placeholder="Tulis pertanyaan edukasi..."
              className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-care-600 px-4 py-2 text-sm font-semibold text-white hover:bg-care-700 disabled:opacity-60"
            >
              <Send className="h-4 w-4" />
              Kirim
            </button>
          </form>
          <p className="mt-3 inline-flex items-start gap-2 text-xs leading-5 text-slate-500">
            <ShieldCheck className="mt-0.5 h-4 w-4 flex-none text-brand-700" />
            Asisten ini memberikan edukasi umum dan bukan pengganti konsultasi tenaga kesehatan. Maksimal 500 karakter per pesan.
          </p>
        </div>
      </section>
    </div>
  );
}
