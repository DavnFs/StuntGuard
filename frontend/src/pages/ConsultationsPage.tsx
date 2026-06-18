import { FormEvent, useEffect, useMemo, useState } from "react";
import { MessageSquareReply, Send } from "lucide-react";

import { ErrorBlock, LoadingBlock, SuccessBlock } from "../components/StateBlock";
import { api } from "../services/api";
import { getCurrentUser } from "../services/auth";
import type { Child, Consultation, ConsultationInput } from "../types";

type StatusFilter = "all" | "open" | "answered" | "closed";

const filterTabs: Array<{ key: StatusFilter; label: string }> = [
  { key: "all", label: "Semua" },
  { key: "open", label: "Terbuka" },
  { key: "answered", label: "Dijawab" },
  { key: "closed", label: "Ditutup" },
];

const statusBadge: Record<string, { label: string; className: string }> = {
  open: { label: "Terbuka", className: "border-blue-200 bg-blue-50 text-blue-700" },
  answered: { label: "Dijawab", className: "border-care-200 bg-care-50 text-care-700" },
  closed: { label: "Ditutup", className: "border-slate-200 bg-slate-100 text-slate-500" },
};

export default function ConsultationsPage() {
  const user = getCurrentUser();
  const isAdmin = user?.role === "admin";
  const [children, setChildren] = useState<Child[]>([]);
  const [tickets, setTickets] = useState<Consultation[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
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
  const [success, setSuccess] = useState<string | null>(null);

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

  const filteredTickets = useMemo(() => {
    if (statusFilter === "all") return tickets;
    return tickets.filter((t) => t.status === statusFilter);
  }, [tickets, statusFilter]);

  const submitTicket = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await api.createConsultation(form);
      setForm({ child_id: children[0]?.id ?? 0, subject: "", message: "", latest_measurement_id: null });
      setTickets(await api.getConsultations());
      setSuccess("Konsultasi berhasil dikirim.");
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
    setError(null);
    setSuccess(null);
    try {
      await api.replyConsultation(ticket.id, text, "answered");
      setReply((items) => ({ ...items, [ticket.id]: "" }));
      setTickets(await api.getConsultations());
      setSuccess("Balasan petugas berhasil dikirim.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membalas konsultasi");
    } finally {
      setSaving(false);
    }
  };

  const closeTicket = async (ticket: Consultation) => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await api.updateConsultationStatus(ticket.id, "closed");
      setTickets(await api.getConsultations());
      setSuccess("Konsultasi ditutup.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menutup konsultasi");
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
          {isAdmin ? "Daftar Konsultasi" : "Ajukan Konsultasi ke Petugas"}
        </h2>
      </div>

      {error ? <ErrorBlock message={error} /> : null}
      {success ? <SuccessBlock message={success} /> : null}

      {!isAdmin ? (
        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card">
          <div className="flex items-center gap-2">
            <Send className="h-5 w-5 text-brand-700" />
            <h3 className="text-base font-semibold text-slate-950">Konsultasi Baru</h3>
          </div>
          {children.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">Tambahkan data anak terlebih dahulu sebelum mengirim konsultasi.</p>
          ) : (
            <form className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={submitTicket}>
              <label className="block text-sm font-medium text-slate-700">
                Anak
                <select
                  value={form.child_id}
                  onChange={(event) => setForm({ ...form, child_id: Number(event.target.value) })}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
                >
                  {children.map((child) => (
                    <option key={child.id} value={child.id}>{child.name}</option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Subjek
                <input
                  required
                  maxLength={160}
                  value={form.subject}
                  onChange={(event) => setForm({ ...form, subject: event.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
                />
              </label>
              <label className="block text-sm font-medium text-slate-700 md:col-span-2">
                Pesan
                <textarea
                  required
                  maxLength={2000}
                  rows={4}
                  value={form.message}
                  onChange={(event) => setForm({ ...form, message: event.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
                />
              </label>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-care-600 px-4 py-2 text-sm font-semibold text-white hover:bg-care-700 disabled:opacity-60"
              >
                <Send className="h-4 w-4" />
                {saving ? "Mengirim..." : "Kirim Konsultasi"}
              </button>
            </form>
          )}
        </section>
      ) : null}

      <section className="rounded-2xl border border-slate-200/80 bg-white shadow-card">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1 border-b border-slate-200/80 px-5 pt-4">
          <MessageSquareReply className="mr-2 h-5 w-5 text-brand-700" />
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusFilter(tab.key)}
              className={`relative rounded-t-lg px-4 py-2.5 text-sm font-bold transition ${
                statusFilter === tab.key
                  ? "text-brand-700"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {tab.label}
              {statusFilter === tab.key ? (
                <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-brand-600" />
              ) : null}
            </button>
          ))}
        </div>

        {/* Ticket List */}
        <div className="p-5">
          <div className="space-y-4">
            {filteredTickets.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-500">
                {statusFilter === "all" ? "Belum ada konsultasi." : `Tidak ada konsultasi dengan status "${filterTabs.find(t => t.key === statusFilter)?.label}".`}
              </p>
            ) : (
              filteredTickets.map((ticket) => {
                const badge = statusBadge[ticket.status] ?? statusBadge.open;
                return (
                  <article key={ticket.id} className="rounded-xl border border-slate-200 p-4 transition hover:border-slate-300">
                    <div className="flex flex-col justify-between gap-2 sm:flex-row">
                      <div>
                        <p className="font-semibold text-slate-950">{ticket.subject}</p>
                        <p className="mt-1 text-sm text-slate-500">
                          {ticket.child_name} · {new Date(ticket.created_at).toLocaleString("id-ID")}
                        </p>
                      </div>
                      <span className={`self-start rounded-full border px-3 py-1 text-xs font-bold ${badge.className}`}>
                        {badge.label}
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
                          maxLength={2000}
                          className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
                        />
                        <button
                          type="button"
                          onClick={() => sendReply(ticket)}
                          disabled={saving}
                          className="rounded-lg bg-care-600 px-4 py-2 text-sm font-semibold text-white hover:bg-care-700 disabled:opacity-60"
                        >
                          Balas
                        </button>
                        <button
                          type="button"
                          onClick={() => closeTicket(ticket)}
                          disabled={saving}
                          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          Tutup
                        </button>
                      </div>
                    ) : null}
                  </article>
                );
              })
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
