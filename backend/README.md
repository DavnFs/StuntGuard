# StuntGuard Backend

FastAPI backend untuk StuntGuard. API ini menyediakan prediksi publik, CRUD data balita, pemeriksaan tinggi dan berat badan, dashboard, info model, chatbot edukasi, login demo, dan consultation ticket.

## Setup

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
python -m pip install -r requirements.txt
```

## Training Model

Gunakan sample demo:

```bash
python -m app.ml.train_model --csv data/sample_stunting_data.csv
```

Gunakan dataset Kaggle setelah diunduh ke `backend/data/`:

```bash
python -m app.ml.train_model --csv data/stunting_balita.csv
```

Metrics akan tersimpan di `app/ml/model_artifacts/metrics.json`. Nilai metrics selalu dihasilkan oleh script dari dataset lokal yang dipakai.

Jika dataset memiliki `weight_kg`, script melatih `full-growth-model` memakai `GrowthFeatureEngineer`. Jika dataset tidak memiliki `weight_kg`, script melatih `height-only-fallback-model` dan memberi warning agar metrics tidak diklaim sebagai model tinggi+berat penuh.

## Menggunakan Model dari Notebook

Backend juga mendukung format notebook `modelstunting.ipynb` yang mengekspor `MLPClassifier` dan `StandardScaler` secara terpisah. Salin kedua file ini ke `app/ml/model_artifacts/`:

```text
stunting_model.joblib
scaler.joblib
```

Format input model notebook harus tetap berurutan: umur bulan, gender encoded (`Laki-laki/male=0`, `Perempuan/female=1`), tinggi cm, dan berat kg. Label angka otomatis dipetakan menjadi `severely stunted`, `stunted`, `normal`, dan `tall`.

## Seed Data Demo

```bash
python -m app.seed
```

## Run API

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Chatbot LLM

Backend membaca environment dari process env, root `.env`, atau `backend/.env`. Gemini menjadi provider utama:

```bash
LLM_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.0-flash-lite
```

Provider opsional: `groq`, `openai`, dan `openrouter`. Lihat root `.env.example`. Jika API key kosong atau provider gagal, `/chatbot` tetap memakai rule-based fallback aman. Usage limit disimpan di tabel `chat_usage`.

Endpoint penting:

- `GET /health`
- `POST /predict`
- `GET /children`
- `POST /children`
- `GET /children/{id}/measurements`
- `POST /children/{id}/measurements`
- `GET /dashboard/summary`
- `POST /auth/login`
- `GET /consultations`
- `POST /consultations`
- `POST /consultations/{id}/reply`
- `POST /chatbot`
- `GET /model/info`

Demo login:

- `parent@demo.com` / `password`
- `admin@demo.com` / `password`

## Disclaimer

Aplikasi ini untuk demo akademik, skrining awal, dan pendukung keputusan. Hasil prediksi bukan diagnosis medis dan harus dikonsultasikan dengan tenaga kesehatan atau Puskesmas.
