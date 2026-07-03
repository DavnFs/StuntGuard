# StuntGuard

StuntGuard adalah aplikasi web skrining awal stunting yang dirancang untuk membantu orang tua mengecek risiko stunting balita secara cepat dengan memasukkan umur, jenis kelamin, tinggi badan, dan berat badan. Aplikasi ini dilengkapi dengan chatbot AI interaktif untuk edukasi gizi dan sistem pelacakan riwayat pertumbuhan anak secara berkala yang sepenuhnya ditujukan untuk membantu orang tua di rumah.

**Penting:** StuntGuard adalah alat bantu skrining awal dan edukasi gizi, bukan diagnosis medis resmi. Segala keputusan medis terkait pertumbuhan balita, serta intervensi lebih lanjut, harus tetap dikonsultasikan secara langsung kepada dokter atau petugas kesehatan Posyandu/Puskesmas.

## Key Features

- **Quick Stunting Check**: Formulir prediksi pertumbuhan balita publik di halaman depan tanpa memerlukan *login*.
- **AI Nutrition Assistant**: Chatbot pintar (terintegrasi dengan Google Gemini) yang memberikan edukasi gizi dan merespons pertanyaan berbasis konteks data anak dengan pelindung *guardrails* agar aman dan patuh standar kesehatan.
- **Parent Dashboard**: Akses bagi orang tua (melalui akun) untuk menyimpan profil anak, menambahkan entri riwayat pertumbuhan tiap bulan, memonitor grafik pertumbuhan, dan mencatat histori prediksi.
- **Machine Learning Integration**: Memungkinkan penerapan model prediksi (klasifikasi pertumbuhan) melalui *scikit-learn* secara dinamis, dilengkapi dengan mekanisme pengganti berbasis aturan (*rule-based fallback*) standar WHO jika model tidak tersedia.

---

## Tech Stack

- **Language**: Python 3.9+ (Backend), TypeScript (Frontend)
- **Framework**: FastAPI (Backend), React 18 & Vite (Frontend)
- **Database**: SQLite (SQLAlchemy ORM)
- **Machine Learning**: `scikit-learn`, `pandas`, `joblib`
- **Styling**: Tailwind CSS, Recharts (untuk grafik)
- **Validation**: Pydantic
- **Deployment**: Docker (Rekomendasi untuk lingkungan *production*)

---

## Prerequisites

Pastikan perangkat Anda telah memiliki aplikasi berikut sebelum menjalankan StuntGuard:

- **Node.js**: Versi 20 atau lebih baru (untuk *frontend*)
- **npm** atau **yarn**: *Package manager* Node.js
- **Python**: Versi 3.9 atau lebih baru (untuk *backend*)
- (Opsional) Akun [Google AI Studio](https://aistudio.google.com/) jika Anda ingin menggunakan fitur Google Gemini API untuk Chatbot edukasi gizi.

---

## Getting Started

Panduan lengkap untuk menjalankan StuntGuard secara lokal.

### 1. Clone the Repository

```bash
git clone <repository_url>
cd StuntGuard
```

### 2. Setup Backend (Python & FastAPI)

Pastikan Anda membuat lingkungan virtual (*virtual environment*) agar dependensi Python tidak bercampur dengan yang lain:

```bash
cd backend
python -m venv .venv

# Untuk Windows (Command Prompt / PowerShell)
.venv\Scripts\activate

# Untuk Linux / macOS
source .venv/bin/activate

# Install dependensi
python -m pip install -r requirements.txt
```

### 3. Setup Frontend (React & Vite)

Buka tab terminal baru (atau terminal kedua):

```bash
cd frontend
npm install
```

### 4. Environment Setup

Sistem backend bergantung pada file `.env`. Anda bisa membuat file konfigurasi dari template yang disediakan:

```bash
# Di dalam root direktori StuntGuard
cp .env.example .env
```

Buka dan sesuaikan variabel di dalam `.env`. Berikut adalah panduannya:

| Variable | Description | Example |
| -------- | ----------- | ------- |
| `STUNTGUARD_SECRET_KEY` | Kunci rahasia untuk enkripsi token JWT. Isi dengan string acak (misal `python -c "import secrets; print(secrets.token_urlsafe(48))"`). | `b3D2F...` |
| `LLM_PROVIDER` | Algoritma pilihan penyedia LLM. Defaultnya menggunakan metode antrean prioritas. | `chain` |
| `GEMINI_API_KEY` | Kunci API Google Gemini (AI Chatbot). | `AIza...` |
| `CORS_ALLOWED_ORIGINS`| Membatasi domain yang bisa mengakses API | `http://localhost:5173` |

Untuk *frontend*, (jika perlu) Anda bisa membuat file `.env` di dalam folder `frontend/`:
```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

### 5. Database Setup

Aplikasi StuntGuard menggunakan SQLite secara bawaan sehingga Anda tidak perlu mengkonfigurasi server database eksternal. Anda cukup melakukan *seeding* (membuat skema awal dan data demo *dummy*):

```bash
# Pastikan Anda berada di direktori /backend dan virtual environment aktif
python -m app.seed
```
*Script* ini akan membuat file database `backend/stuntguard.db` beserta beberapa akun *demo* dan riwayat anak secara otomatis.

### 6. Training Model Machine Learning (Opsional)

Jika Anda ingin menjalankan model ML sungguhan (Bukan *Rule-based fallback*), Anda bisa melatih sampel data bawaan:

```bash
# Di dalam direktori /backend
python -m app.ml.train_model --csv data/sample_stunting_data.csv
```
*Script* ini akan memproduksi file `.joblib` dalam folder `backend/app/ml/model_artifacts/` yang nantinya dipakai oleh rute `/predict`.

### 7. Start Development Server

Untuk menjalankan aplikasi ini secara lokal, Anda butuh **dua sesi terminal aktif**:

**Terminal 1 (Backend - FastAPI)**:
```bash
cd backend
.venv\Scripts\activate # (Jika belum aktif)
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

**Terminal 2 (Frontend - Vite)**:
```bash
cd frontend
npm run dev
```

Buka browser Anda di:
- Aplikasi Web: [http://localhost:5173](http://localhost:5173)
- Dokumentasi API Backend: [http://localhost:8000/docs](http://localhost:8000/docs)

Akun login *Demo*:
- Akun Orang Tua: `parent@demo.com` (Sandi: `password`)

---

## Architecture Overview

StuntGuard menggunakan arsitektur monolitik-terpisah, di mana aplikasi React (*Frontend*) memanggil API *stateless* berbasis REST yang disajikan oleh aplikasi FastAPI (*Backend*).

### Directory Structure

```text
StuntGuard/
├── backend/
│   ├── app/
│   │   ├── routers/       # Rute endpoint (API controllers) untuk Auth, Chat, dll.
│   │   ├── services/      # Layanan inti eksternal (LLM client, JWT auth, guardrails)
│   │   ├── ml/            # Modul klasifikasi pertumbuhan WHO & model training
│   │   ├── models.py      # Schema struktur tabel SQLAlchemy (ORM)
│   │   ├── schemas.py     # Pydantic schemas untuk validasi input dan output API
│   │   ├── crud.py        # Logika operasi dasar database (Create, Read, Update, Delete)
│   │   ├── database.py    # Konfigurasi engine & koneksi database SQLite
│   │   └── main.py        # Titik masuk (entry point) aplikasi FastAPI
│   ├── data/              # Folder untuk file CSV atau dataset model
│   ├── requirements.txt   # Daftar dependensi modul Python
│   └── stuntguard.db      # Database SQLite (dibuat otomatis oleh SQLAlchemy)
├── frontend/
│   ├── src/
│   │   ├── components/    # Komponen Reusable UI (Cards, Forms, Layouts)
│   │   ├── pages/         # Layar tampilan antarmuka spesifik (Dashboard, Login, dll)
│   │   ├── services/      # Layanan Fetching API atau konfigurasi utilitas web
│   │   ├── App.tsx        # Integrasi Router utama
│   │   └── main.tsx       # Titik masuk (entry point) aplikasi React
│   ├── index.html
│   ├── package.json       # Dependensi NPM React
│   ├── tailwind.config.js # Konfigurasi *styling* Tailwind CSS
│   └── vite.config.ts     # Konfigurasi bundler Vite
├── .env.example           # Contoh Environment configuration
└── README.md
```

### Request Lifecycle

1. Pengguna memasukkan data berat badan dan tinggi di formulir aplikasi (React).
2. Fungsi `fetch` di Frontend memanggil *endpoint* backend `POST /api/predict/stunting`.
3. Panggilan ditangkap oleh `routers/prediction.py`.
4. *Pydantic* memvalidasi format (Misal: Umur berada di jangkauan yang diperbolehkan).
5. Mesin *Machine Learning* atau modul `ml/predict.py` bekerja mengalkulasi konversi deviasi (Z-Score) sesuai *lookup table* WHO, dan menetapkan klasifikasinya.
6. Hasilnya dibungkus kembali dalam *response JSON* dan dikembalikan ke React untuk *rendering* halaman hasil.

### Chatbot LLM Architecture

Bagian yang menonjol dari *backend* ini adalah bagaimana *chatbot* gizi dienkapsulasi menggunakan konsep "Guardrails" sebelum meminta respon dari LLM (Google Gemini):
1. **Input Guardrails**: `services/chatbot_guardrails.py` akan mencari dan mengawasi pola kata gawat darurat (misal: "dosis obat", "demam tinggi") yang akan dihentikan saat itu juga, diganti menjadi instruksi hardcoded agar segera merujuk ke RS.
2. **System Prompt Injection**: Data profil pertumbuhan si anak (status gizi) digabungkan sebagai identitas *system prompt* untuk AI, sambil memberikan pelarangan keras agar model tidak mendiagnosis penyakit.
3. **Output Guardrails**: Hasil keluaran dari Gemini disaring kembali. Jika AI mengutarakan kata "Menurut diagnosis saya", jawaban tersebut langsung diganti menjadi format aman. Jika aman, *backend* akan menyematkan *Disclaimer* edukasi pada balasan ke *frontend*.

### Database Schema

Secara ringkas, database SQLite berisi tabel:
- `users`: Menyimpan kredensial otentikasi orang tua (menggunakan hashing) dan *role*.
- `children`: Profil statis anak (nama, tanggal lahir, jenis kelamin).
- `measurements`: Catatan jejak riwayat pertumbuhan secara berkala yang menyimpan nilai `age_month`, `height_cm`, `weight_kg` hingga status pertumbuhannya. Tabel ini tertaut secara relasional ke tabel `children`.

---

## Environment Variables

Referensi variabel lingkungan (*Environment Variables*) utama untuk konfigurasi aplikasi yang berlokasi pada `.env`:

### Keamanan dan Aplikasi Dasar

| Variable | Description |
| -------- | ----------- |
| `STUNTGUARD_SECRET_KEY` | Kunci wajib untuk keamanan tanda tangan sesi token (*JWT Signature*). |
| `LOGIN_MAX_ATTEMPTS_PER_MINUTE` | Pembatasan (*rate-limit*) brute-force akses *login* per IP. (Default: 10) |
| `CORS_ALLOWED_ORIGINS` | Daftar URL host yang diperbolehkan memanggil API *backend*. |
| `TRUST_PROXY_HEADERS` | Ubah ke `true` hanya jika menggunakan NGINX/Apache Reverse Proxy di *production*. |
| `VITE_API_BASE_URL` | Konfigurasi Frontend (di `.env` dalam folder frontend) menuju host *backend*. |

### Integrasi Artificial Intelligence (LLM)

| Variable | Description |
| -------- | ----------- |
| `LLM_PROVIDER` | Memilih algoritma LLM (Misalnya `chain` untuk fallback berantai otomatis). |
| `GEMINI_API_KEY` | Token utama dari Google AI Studio. |
| `GEMINI_MODEL` | Jenis model yang digunakan, biasanya diset `gemini-2.0-flash-lite`. |
| `LLM_MAX_OUTPUT_TOKENS` | Penghematan pengeluaran *token*, batas panjang respon bot (Default: 250). |
| `CHAT_RATE_LIMIT_ENABLED`| Set ke `true` untuk membatasi frekuensi *spam* tanya-jawab dari pengguna. |
| `CHAT_PARENT_DAILY_LIMIT`| Kuota pertanyaan AI khusus pengguna yang login sebagai orang tua. (Default: 200) |

---

## Available Scripts

Daftar perintah yang berguna untuk pengelolaan harian proyek:

| Command | Lokasi | Description |
| ------- | ------ | ----------- |
| `npm run dev` | `frontend/` | Menyalakan *development server* Vite (React). |
| `npm run build` | `frontend/` | Melakukan *compile/build package* React untuk *production*. |
| `python -m app.seed` | `backend/` | Menyuntikkan atau mereset data pengguna dan balita *dummy*. |
| `python -m app.ml.train_model` | `backend/` | Melatih ulang *Machine Learning* dengan data `.csv` khusus. |
| `pytest` | `backend/` | Mengeksekusi seluruh skrip pengujian (Unit Test) Python secara otomatis. |
| `uvicorn app.main:app` | `backend/` | Menjalankan peladen ASGI *backend* (API). |

---

## Testing

Aplikasi ini dilengkapi pengujian (*Testing*) untuk memastikan algoritma klasifikasi berjalan akurat dan antarmuka terlindungi. Pengujian menggunakan modul `pytest` di dalam lingkungan Python.

### Running Tests

```bash
# Pastikan Anda berada di direktori /backend dan virtual environment aktif
pytest

# Jalankan pengujian spesifik secara terperinci (verbose)
pytest tests/ -v
```

Struktur folder pengujian:
```text
tests/
├── conftest.py       # Pengaturan setup dan perbaikan mock (seperti mock DB)
├── test_ml.py        # Memverifikasi konversi model prediktif (Tinggi -> Z-Score)
├── test_chat_ai.py   # Memverifikasi Input/Output Guardrails memblokir prompt darurat
├── test_auth.py      # Memverifikasi login limiters dan enkripsi sandi
└── test_routers.py   # Uji coba end-to-end API HTTP Endpoint (Simulasi request FastAPI)
```

---

## Deployment

Aplikasi *StuntGuard* saat ini direkomendasikan untuk dijalankan menggunakan VM (Virtual Machine/VPS) atau menggunakan infrastruktur Docker Compose (meski file *docker-compose.yml* mungkin perlu Anda kembangkan secara mandiri menyesuaikan *environment*).

### Manual / VPS Deployment Setup

1. Unduh kode sumber dari repositori di *server* target Anda.
2. Atur infrastruktur untuk dua *service*: NGINX (untuk melayani statis file hasil React) dan Gunicorn/Uvicorn atau proses Manajer *SystemD* untuk melayani FastAPI.
3. Jalankan `npm run build` pada direktori `frontend/`. Salin seluruh isi folder `/dist` ke folder `/var/www/html` server Anda.
4. Pada lingkungan *server*, pastikan Anda mengisi variabel konfigurasi pada berkas rahasia `.env` (berada di belakang lingkungan web eksternal). Terutama `CORS_ALLOWED_ORIGINS` untuk mengarah pada domain URL website *production* dan nyalakan `TRUST_PROXY_HEADERS=true` jika *backend* dilindungi *reverse proxy*.
5. Jalankan `uvicorn` dengan konfigurasi server Gunicorn dan pantau pelayanannya menggunakan `supervisor` atau agen *SystemD* (*system control*).

---

## Troubleshooting

Panduan perbaikan jika Anda mengalami kendala.

### Frontend Tidak Terhubung (Gagal Mengambil Data)
**Error:** Tidak ada koneksi, grafik dan *login* *error*, *loading* terus menerus.
**Solusi:**
1. Pastikan *backend* Python FastAPI sedang hidup di terminal lainnya.
2. Periksa kembali nilai `VITE_API_BASE_URL` di *frontend*.
3. Pastikan browser atau terminal tidak memblokir akses HTTP *(CORS)*.

### Chatbot AI Selalu Menjawab dengan Mode Aman (Rule-Based)
**Error:** Chatbot membalas, tapi sumber jawabannya berlabel "*source: rule-based*" terus-menerus.
**Solusi:**
Kunci API LLM (`GEMINI_API_KEY`) Anda mungkin kedaluwarsa, kurang saldo kuota gratis, atau belum Anda input di `.env`. Chatbot secara otomatis fallback ke jawaban aman (*Rule-Based*) yang tidak memerlukan API LLM luar jika integrasinya gagal. Aplikasi tetap dapat beroperasi normal.

### Chatbot Menolak Semua Pesan
**Error:** Selalu membalas error atau "*source: rate-limit*".
**Solusi:**
Anda (Alamat IP Anda) telah mencapai batas limit percobaan pertanyaan per hari (misalnya melebihi 10 pertanyaan khusus untuk pengguna *Guest*). Tunggu selama satu jam atau ubah batas limit `CHAT_GUEST_DAILY_LIMIT` pada file `.env`.

### Masalah Model Prediksi Tidak Akurat atau Model Lama
**Error:** Respons API mengembalikan prediksi yang keliru atau *Warning: Model Missing*.
**Solusi:**
1. Anda perlu menjalankan proses *training* ulang untuk membuat file `stunting_model.joblib`.
2. Jalankan `python -m app.ml.train_model --csv data/sample_stunting_data.csv`.

---

## License
Ini merupakan pengerjaan implementasi untuk proyek akademik. Hubungi kreator atau institusi akademik terkait jika Anda ingin mendeploy ini sebagai layanan kesehatan rujukan berlisensi di lapangan.
