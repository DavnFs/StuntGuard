import { FormEvent, useEffect, useMemo, useState } from "react";
import { MessageSquareReply, Send } from "lucide-react";

import { ErrorBlock, LoadingBlock } from "../components/StateBlock";
import { api } from "../services/api";
import { getCurrentUser } from "../services/auth";
import type { Child, Consultation, ConsultationInput } from "../types";

export default function ConsultationsPage() {
  const user = getCurrentUser();
  const isAdmin = user?.role === "admin";
  const [children, setChildren] = useState<Child[]>([]);
  const [tickets, setTickets] = useState<Consultation[]>([]);
  const [form, setForm] = useState<ConsultationInput>({
    child_id: 0,
    subject: "",
    message: "",
    latest_measurement_id: null,
  });
  const [reply, setReply] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const childOptions = useMemo(() => children, [children]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [childData, ticketData] = await Promise.all([api.getChildren(), api.getConsultations()]);
      setChildren(childData);
      setTickets(ticketData);
      if (!form.child_id && childData[0]) {
        setForm((current) => ({ ...current, child_id: childData[0].id }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat konsultasi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submitTicket = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.createConsultation(form);
      setForm({ child_id: childOptions[0]?.id ?? 0, subject: "", message: "", latest_measurement_id: null });
      setTickets(await api.getConsultations());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengirim konsultasi");
    } finally {
      setSaving(false);
    }
  };

  const sendReply = async (ticket: Consultation) => {
    const text = reply[ticket.id]?.trim();
    if (!text) return;
    setSaving(true);
    try {
      await api.replyConsultation(ticket.id, text, "answered");
      setReply((items) => ({ ...items, [ticket.id]: "" }));
      setTickets(await api.getConsultations());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membalas konsultasi");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingBlock />;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-brand-700">Konsultasi</p>
        <h2 className="mt-1 text-2xl font-bold text-slate-950">
          {isAdmin ? "Consultation Tickets" : "Ajukan Konsultasi ke Petugas"}
        </h2>
      </div>

      {error ? <ErrorBlock message={error} /> : null}

      {!isAdmin ? (
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <Send className="h-5 w-5 text-brand-700" />
            <h3 className="text-base font-semibold text-slate-950">Ticket Baru</h3>
          </div>
          {childOptions.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">Tambahkan data anak terlebih dahulu sebelum mengirim konsultasi.</p>
          ) : (
            <form className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={submitTicket}>
              <label className="block text-sm font-medium text-slate-700">
                Anak
                <select
                  value={form.child_id}
                  onChange={(event) => setForm({ ...form, child_id: Number(event.target.value) })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-brand-600"
                >
                  {childOptions.map((child) => (
                    <option key={child.id} value={child.id}>{child.name}</option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Subjek
                <input
                  required
                  value={form.subject}
                  onChange={(event) => setForm({ ...form, subject: event.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-brand-600"
                />
              </label>
              <label className="block text-sm font-medium text-slate-700 md:col-span-2">
                Pesan
                <textarea
                  required
                  rows={4}
                  value={form.message}
                  onChange={(event) => setForm({ ...form, message: event.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-brand-600"
                />
              </label>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
              >
                <Send className="h-4 w-4" />
                {saving ? "Mengirim..." : "Kirim Ticket"}
              </button>
            </form>
          )}
        </section>
      ) : null}

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <MessageSquareReply className="h-5 w-5 text-brand-700" />
          <h3 className="text-base font-semibold text-slate-950">Daftar Konsultasi</h3>
        </div>
        <div className="mt-4 space-y-4">
          {tickets.length === 0 ? (
            <p className="text-sm text-slate-500">Belum ada ticket konsultasi.</p>
          ) : (
            tickets.map((ticket) => (
              <article key={ticket.id} className="rounded-lg border border-slate-200 p-4">
                <div className="flex flex-col justify-between gap-2 sm:flex-row">
                  <div>
                    <p className="font-semibold text-slate-950">{ticket.subject}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {ticket.child_name} | {new Date(ticket.created_at).toLocaleString("id-ID")}
                    </p>
                  </div>
                  <span className="self-start rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    {ticket.status}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-700">{ticket.message}</p>
                {ticket.admin_reply ? (
                  <div className="mt-3 rounded-lg border border-brand-100 bg-brand-50 p-3 text-sm leading-6 text-slate-700">
                    <p className="font-semibold text-slate-950">Balasan petugas</p>
                    <p className="mt-1">{ticket.admin_reply}</p>
                  </div>
                ) : null}
                {isAdmin ? (
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <input
                      value={reply[ticket.id] ?? ""}
                      onChange={(event) => setReply((items) => ({ ...items, [ticket.id]: event.target.value }))}
                      placeholder="Tulis balasan edukatif..."
                      className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-600"
                    />
                    <button
                      type="button"
                      onClick={() => sendReply(ticket)}
                      disabled={saving}
                      className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
                    >
                      Balas
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await api.updateConsultationStatus(ticket.id, "closed");
                        setTickets(await api.getConsultations());
                      }}
                      className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Tutup
                    </button>
                  </div>
                ) : null}
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
