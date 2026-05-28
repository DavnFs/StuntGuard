import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Edit2, Plus, Search, Trash2, UserRound } from "lucide-react";

import { ErrorBlock, LoadingBlock } from "../components/StateBlock";
import { api } from "../services/api";
import type { Child, ChildInput, Gender } from "../types";

const emptyForm: ChildInput = {
  name: "",
  gender: "female",
  birth_date: "",
  parent_name: "",
  address: "",
  posyandu_area: "",
};

const genderLabel: Record<Gender, string> = {
  male: "Laki-laki",
  female: "Perempuan",
};

export default function ChildrenPage() {
  const [children, setChildren] = useState<Child[]>([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<ChildInput>(emptyForm);
  const [editing, setEditing] = useState<Child | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredChildren = useMemo(() => children, [children]);

  const loadChildren = () => {
    setLoading(true);
    api
      .getChildren(search)
      .then(setChildren)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadChildren();
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (editing) {
        await api.updateChild(editing.id, form);
      } else {
        await api.createChild(form);
      }
      setForm(emptyForm);
      setEditing(null);
      await api.getChildren(search).then(setChildren);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan data");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (child: Child) => {
    setEditing(child);
    setForm({
      name: child.name,
      gender: child.gender,
      birth_date: child.birth_date,
      parent_name: child.parent_name ?? "",
      address: child.address ?? "",
      posyandu_area: child.posyandu_area ?? "",
    });
  };

  const remove = async (child: Child) => {
    if (!window.confirm(`Hapus data ${child.name}?`)) return;
    await api.deleteChild(child.id);
    setChildren((items) => items.filter((item) => item.id !== child.id));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-brand-700">Data Balita</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-950">Kelola Data Balita Demo</h2>
        </div>
        <form
          className="flex w-full max-w-md items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm sm:w-96"
          onSubmit={(event) => {
            event.preventDefault();
            loadChildren();
          }}
        >
          <Search className="h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cari nama atau wilayah"
            className="w-full border-0 bg-transparent text-sm outline-none"
          />
        </form>
      </div>

      {error ? <ErrorBlock message={error} /> : null}

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          {loading ? (
            <LoadingBlock />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead>
                  <tr className="text-left text-slate-500">
                    <th className="py-3 pr-4 font-semibold">Nama</th>
                    <th className="py-3 pr-4 font-semibold">Gender</th>
                    <th className="py-3 pr-4 font-semibold">Tanggal Lahir</th>
                    <th className="py-3 pr-4 font-semibold">Orang Tua</th>
                    <th className="py-3 pr-4 font-semibold">Wilayah</th>
                    <th className="py-3 pr-4 font-semibold">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredChildren.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-500">
                        Belum ada data balita.
                      </td>
                    </tr>
                  ) : (
                    filteredChildren.map((child) => (
                      <tr key={child.id}>
                        <td className="py-3 pr-4">
                          <Link to={`/children/${child.id}`} className="font-semibold text-brand-700 hover:text-brand-800">
                            {child.name}
                          </Link>
                        </td>
                        <td className="py-3 pr-4 text-slate-600">{genderLabel[child.gender]}</td>
                        <td className="py-3 pr-4 text-slate-600">{new Date(child.birth_date).toLocaleDateString("id-ID")}</td>
                        <td className="py-3 pr-4 text-slate-600">{child.parent_name || "-"}</td>
                        <td className="py-3 pr-4 text-slate-600">{child.posyandu_area || "-"}</td>
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => startEdit(child)}
                              className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
                              title="Edit data"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => remove(child)}
                              className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50"
                              title="Hapus data"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            {editing ? <Edit2 className="h-5 w-5 text-brand-700" /> : <Plus className="h-5 w-5 text-brand-700" />}
            <h3 className="text-base font-semibold text-slate-950">{editing ? "Edit Balita" : "Tambah Balita"}</h3>
          </div>
          <form className="mt-4 space-y-4" onSubmit={submit}>
            <label className="block text-sm font-medium text-slate-700">
              Nama
              <input
                required
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-brand-600"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Gender
              <select
                value={form.gender}
                onChange={(event) => setForm({ ...form, gender: event.target.value as Gender })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-brand-600"
              >
                <option value="female">Perempuan</option>
                <option value="male">Laki-laki</option>
              </select>
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Tanggal Lahir
              <input
                required
                type="date"
                value={form.birth_date}
                onChange={(event) => setForm({ ...form, birth_date: event.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-brand-600"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Nama Orang Tua
              <input
                value={form.parent_name}
                onChange={(event) => setForm({ ...form, parent_name: event.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-brand-600"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Wilayah Posyandu
              <input
                value={form.posyandu_area}
                onChange={(event) => setForm({ ...form, posyandu_area: event.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-brand-600"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Alamat Demo
              <textarea
                value={form.address}
                onChange={(event) => setForm({ ...form, address: event.target.value })}
                rows={3}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-brand-600"
              />
            </label>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
              >
                <UserRound className="h-4 w-4" />
                {saving ? "Menyimpan..." : editing ? "Simpan Perubahan" : "Tambah Data"}
              </button>
              {editing ? (
                <button
                  type="button"
                  onClick={() => {
                    setEditing(null);
                    setForm(emptyForm);
                  }}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
              ) : null}
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
