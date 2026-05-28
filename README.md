# StuntGuard

StuntGuard adalah aplikasi web untuk skrining awal dan monitoring risiko stunting pada balita. Aplikasi ini ditujukan untuk demo proyek universitas berbasis AI, dengan fitur pencatatan data balita, riwayat pemeriksaan tinggi badan, prediksi status gizi, dashboard analytics, rekomendasi edukatif, dan chatbot gizi sederhana.

Hasil prediksi bukan diagnosis medis. Semua hasil harus dikonsultasikan dengan tenaga kesehatan atau Puskesmas untuk keputusan resmi.

## Features

- FastAPI prediction API.
- CRUD data balita tanpa NIK atau identitas sensitif.
- Riwayat pemeriksaan tinggi badan.
- Prediksi status: severely stunted, stunted, normal, tall.
- Risk level dan rekomendasi edukatif.
- Dashboard analytics dengan charts.
- Growth tracking per balita.
- Chatbot edukasi rule-based dengan optional LLM.
- ML training workflow dengan scikit-learn.
- Dokumentasi proposal, arsitektur, demo, dan presentasi.

## Tech Stack

- Backend: Python, FastAPI, SQLAlchemy, SQLite
- ML: pandas, scikit-learn, joblib
- Frontend: React, Vite, TypeScript
- Styling: Tailwind CSS
- Charts: Recharts
- Testing: pytest

## Folder Structure

```text
StuntGuard/
  backend/
    app/
      main.py
      database.py
      models.py
      schemas.py
      crud.py
      ml/
      routers/
      seed.py
    data/
    tests/
    requirements.txt
  frontend/
    src/
      components/
      pages/
      services/
      types/
    package.json
  docs/
  README.md
```

## Setup Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
python -m pip install -r requirements.txt
```

## Dataset Setup

Dataset utama: `https://www.kaggle.com/datasets/rendiputra/stunting-balita-detection-121k-rows`

Unduh dataset dari Kaggle, lalu letakkan CSV di:

```text
backend/data/stunting_balita.csv
```

Repository menyertakan `backend/data/sample_stunting_data.csv` hanya untuk demo lokal. Sample ini bukan representasi dataset 121K baris.

## Training Model

Dengan sample demo:

```bash
cd backend
python -m app.ml.train_model --csv data/sample_stunting_data.csv
```

Dengan dataset Kaggle:

```bash
cd backend
python -m app.ml.train_model --csv data/stunting_balita.csv
```

Training script menghasilkan:

- `backend/app/ml/model_artifacts/stunting_model.joblib`
- `backend/app/ml/model_artifacts/metrics.json`
- `backend/app/ml/model_artifacts/labels.json`

Metrics tidak dibuat manual. Nilainya berasal dari dataset yang dipakai saat training.

## Seed Demo Data

```bash
cd backend
python -m app.seed
```

## Run Backend

```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API docs tersedia di `http://localhost:8000/docs`.

## Setup Frontend

```bash
cd frontend
npm install
```

Opsional buat `.env`:

```bash
VITE_API_BASE_URL=http://localhost:8000
```

## Run Frontend

```bash
cd frontend
npm run dev
```

Buka `http://localhost:5173`.

## Demo Flow

1. Jalankan backend dan frontend.
2. Buka Dashboard.
3. Tambahkan data balita demo di Data Balita.
4. Buka detail balita dan tambah pemeriksaan.
5. Lihat hasil prediksi, rekomendasi, disclaimer, dan grafik pertumbuhan.
6. Kembali ke Dashboard untuk melihat update analytics.
7. Coba Prediksi Cepat tanpa menyimpan data.
8. Coba Chatbot Edukasi.
9. Buka Tentang Model untuk menjelaskan fitur, metrics, dan batasan.

## Troubleshooting

- Jika `/predict` mengembalikan confidence `null`, model belum dilatih atau gagal dimuat. Jalankan training model.
- Jika frontend gagal terhubung backend, pastikan backend aktif di `http://localhost:8000` atau set `VITE_API_BASE_URL`.
- Jika training gagal karena kolom tidak ditemukan, cek nama kolom CSV. Script mendukung `Age`, `Age (Month)`, `age_month`, `Gender`, `Height`, dan `Nutrition Status`.
- Jika database kosong, jalankan `python -m app.seed` dari folder backend.

## Disclaimer

StuntGuard adalah sistem skrining awal, edukasi, dan pendukung keputusan untuk proyek akademik. Aplikasi ini bukan pengganti diagnosis medis, pemeriksaan antropometri resmi, atau intervensi tenaga kesehatan. Konsultasikan hasil ke Posyandu, Puskesmas, bidan, dokter, atau tenaga kesehatan berwenang.
