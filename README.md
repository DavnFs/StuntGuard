# StuntGuard

StuntGuard adalah web app skrining awal stunting yang membantu orang tua mengecek risiko stunting balita secara cepat menggunakan umur, jenis kelamin, tinggi badan, dan berat badan. Aplikasi ini juga menyediakan edukasi gizi berbasis AI, riwayat pertumbuhan anak, konsultasi lanjutan dengan petugas, serta dashboard monitoring untuk Posyandu/Puskesmas.

Hasil StuntGuard bukan diagnosis medis. Pemeriksaan dan keputusan resmi tetap harus dikonsultasikan ke petugas kesehatan atau Puskesmas.

## Features

- Landing page publik dengan quick stunting check tanpa login.
- Input prediksi: `age_month`, `gender`, `height_cm`, `weight_kg`.
- Output prediksi dengan status gizi, risk level, confidence, growth notes, model mode, rekomendasi, dan disclaimer.
- Login demo role-based: parent dan admin.
- Parent flow: simpan data anak, tambah pemeriksaan, lihat grafik tinggi dan berat, ajukan consultation ticket.
- Admin flow: dashboard monitoring, data balita, data pemeriksaan, high-risk cases, balas consultation ticket.
- Chatbot edukasi gizi rule-based dengan optional OpenAI LLM jika `OPENAI_API_KEY` tersedia.
- Training workflow scikit-learn dengan mode `full-growth-model` atau `height-only-fallback-model`.
- SQLite database untuk data demo lokal.

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
  package.json
  README.md
```

## Setup Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
python -m pip install -r requirements.txt
```

Jika memakai `.venv` di root project yang sudah ada:

```bash
.\.venv\Scripts\activate
cd backend
python -m pip install -r requirements.txt
```

## Setup Frontend

```bash
cd frontend
npm install
```

Opsional buat `frontend/.env`:

```bash
VITE_API_BASE_URL=http://127.0.0.1:8000
```

## Dataset Setup

Dataset awal: `https://www.kaggle.com/datasets/rendiputra/stunting-balita-detection-121k-rows`

Letakkan CSV di:

```text
backend/data/stunting_balita.csv
```

Catatan penting:

- Dataset Kaggle asli mungkin hanya berisi usia, gender, tinggi badan, dan nutrition status.
- Jika CSV memiliki `weight_kg`, training menghasilkan `full-growth-model`.
- Jika CSV tidak memiliki `weight_kg`, script training tetap jalan sebagai `height-only-fallback-model` dan metriknya tidak boleh diklaim sebagai metrik model tinggi+berat penuh.
- Repository menyertakan sample CSV kecil hanya untuk demo lokal, bukan representasi dataset 121K.

## Training Model

Dengan sample demo:

```bash
cd backend
python -m app.ml.train_model --csv data/sample_stunting_data.csv
```

Dengan dataset lokal:

```bash
cd backend
python -m app.ml.train_model --csv data/stunting_balita.csv
```

Training menghasilkan artefak di:

```text
backend/app/ml/model_artifacts/stunting_model.joblib
backend/app/ml/model_artifacts/metrics.json
backend/app/ml/model_artifacts/labels.json
backend/app/ml/model_artifacts/normal_values.csv
```

Model dari `modelstunting.ipynb` juga didukung jika memakai:

```text
backend/app/ml/model_artifacts/stunting_model.joblib
backend/app/ml/model_artifacts/scaler.joblib
```

Format notebook tersebut memakai urutan fitur: umur bulan, gender encoded (`male=0`, `female=1`), tinggi cm, dan berat kg.

## Seed Demo Data

```bash
cd backend
python -m app.seed
```

## Running the App

Dari root project:

```bash
npm run dev
```

URL:

- Frontend: `http://127.0.0.1:5173`
- Backend: `http://127.0.0.1:8000`
- API docs: `http://127.0.0.1:8000/docs`

Manual mode:

```bash
cd backend
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

```bash
cd frontend
npm run dev
```

## Demo Accounts

- Parent: `parent@demo.com` / `password`
- Admin: `admin@demo.com` / `password`

Auth ini hanya demo role switcher sederhana, bukan sistem keamanan produksi.

## Demo Flow

1. Buka landing page StuntGuard.
2. Jalankan quick stunting check tanpa login.
3. Tampilkan status prediksi, risk level, growth notes, rekomendasi, model mode, dan disclaimer.
4. Jika hasil berisiko, buka chatbot edukasi gizi.
5. Login sebagai parent.
6. Simpan data anak dan tambah pemeriksaan tinggi/berat.
7. Lihat grafik pertumbuhan tinggi dan berat.
8. Ajukan consultation ticket.
9. Login sebagai admin.
10. Buka dashboard, high-risk cases, dan data pemeriksaan.
11. Balas consultation ticket.
12. Buka Tentang Model untuk menjelaskan mode model, dataset, metrics, dan batasan.

## Troubleshooting

- Jika `/predict` memakai `rule-based-fallback`, artefak model belum ada atau gagal dimuat.
- Jika model notebook dipakai, pastikan `stunting_model.joblib` dan `scaler.joblib` berada di `backend/app/ml/model_artifacts/`.
- Jika training dataset tidak punya weight, model akan dilabeli `height-only-fallback-model`.
- Jika frontend gagal terhubung backend, cek `VITE_API_BASE_URL` dan pastikan backend berjalan di port `8000`.
- Jika database lama tidak punya kolom baru, jalankan backend sekali; migrasi ringan akan menambah kolom `weight_kg` dan `model_mode`.

## Disclaimer

StuntGuard adalah sistem skrining awal, edukasi, dan pendukung keputusan untuk proyek akademik. Aplikasi ini bukan pengganti diagnosis medis, pemeriksaan antropometri resmi, atau intervensi tenaga kesehatan. Konsultasikan hasil ke Posyandu, Puskesmas, bidan, dokter, atau tenaga kesehatan berwenang.
