import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { Child, MeasurementInput } from "../types";
import { FullScreenLoader } from "../components/Loader";
import { ErrorBlock } from "../components/StateBlock";
import { Save, UserPlus } from "lucide-react";

export default function SaveMeasurementPage() {
  const navigate = useNavigate();
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // New child form state
  const [form, setForm] = useState({ name: "", gender: "female" as "female" | "male", birth_date: "" });

  useEffect(() => {
    const pending = sessionStorage.getItem("pendingMeasurement");
    if (!pending) {
      navigate("/app/parent");
      return;
    }
    
    api.getChildren()
      .then((data) => {
        setChildren(data);
        if (data.length === 0) setShowForm(true);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [navigate]);

  const handleSaveToChild = async (childId: number) => {
    const pendingStr = sessionStorage.getItem("pendingMeasurement");
    if (!pendingStr) return;
    setSaving(true);
    setError(null);
    try {
      const payload: MeasurementInput = JSON.parse(pendingStr);
      await api.createMeasurement(childId, payload);
      sessionStorage.removeItem("pendingMeasurement");
      navigate(`/app/children/${childId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan");
      setSaving(false);
    }
  };

  const handleCreateChildAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const newChild = await api.createChild({
        ...form,
        parent_name: "",
        address: ""
      });
      await handleSaveToChild(newChild.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membuat profil anak");
      setSaving(false);
    }
  };

  if (loading) return <FullScreenLoader />;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="font-heading text-3xl font-extrabold text-slate-900 mb-2">Simpan Hasil Prediksi</h1>
      <p className="text-slate-600 mb-8">Pilih profil anak untuk menyimpan hasil pengukuran dan prediksi stunting.</p>

      {error && <div className="mb-6"><ErrorBlock message={error} /></div>}

      {children.length === 0 || showForm ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-slate-600 mb-6 font-medium">Buat profil anak baru untuk menyimpan riwayat ini.</p>
          <form onSubmit={handleCreateChildAndSave} className="space-y-4">
            <label className="block text-sm font-medium text-slate-700">
              Nama Anak
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100"
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium text-slate-700">
                Gender
                <select
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value as "female" | "male" })}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100"
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
                  max={new Date().toISOString().split("T")[0]}
                  value={form.birth_date}
                  onChange={(e) => setForm({ ...form, birth_date: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100"
                />
              </label>
            </div>
            <div className="pt-4 flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex w-full justify-center items-center gap-2 rounded-xl bg-cyan-600 px-5 py-3 text-sm font-bold text-white hover:bg-cyan-700 transition disabled:opacity-50"
              >
                {saving ? "Menyimpan..." : "Simpan Profil & Hasil Pengukuran"}
              </button>
              {children.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="inline-flex justify-center items-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Batal
                </button>
              )}
            </div>
          </form>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {children.map((child) => (
              <button
                key={child.id}
                disabled={saving}
                onClick={() => handleSaveToChild(child.id)}
                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 text-left hover:border-cyan-300 hover:shadow-md transition group disabled:opacity-50"
              >
                <div>
                  <h3 className="font-bold text-slate-900 group-hover:text-cyan-700">{child.name}</h3>
                  <p className="text-xs text-slate-500 mt-1 capitalize">{child.gender} • {new Date(child.birth_date).toLocaleDateString("id-ID")}</p>
                </div>
                <Save className="h-5 w-5 text-slate-300 group-hover:text-cyan-500 transition" />
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 text-sm font-bold text-cyan-600 hover:text-cyan-700"
          >
            <UserPlus className="h-4 w-4" />
            Tambah Profil Anak Baru
          </button>
        </div>

      )}
    </div>
  );
}
