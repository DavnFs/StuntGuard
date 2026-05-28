# StuntGuard Backend

FastAPI backend untuk skrining awal risiko stunting pada balita. API ini menyediakan CRUD data balita, pemeriksaan tinggi badan, prediksi status gizi, dashboard, info model, dan chatbot edukasi.

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

## Seed Data Demo

```bash
python -m app.seed
```

## Run API

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Endpoint penting:

- `GET /health`
- `POST /predict`
- `GET /children`
- `POST /children`
- `GET /children/{id}/measurements`
- `POST /children/{id}/measurements`
- `GET /dashboard/summary`
- `POST /chatbot`
- `GET /model/info`

## Disclaimer

Aplikasi ini untuk demo akademik, skrining awal, dan pendukung keputusan. Hasil prediksi bukan diagnosis medis dan harus dikonsultasikan dengan tenaga kesehatan atau Puskesmas.
