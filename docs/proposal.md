# Proposal Project: StuntGuard

## 1. Judul Project

StuntGuard: Web App Skrining Awal Risiko Stunting Balita Berbasis AI.

## 2. Latar Belakang Masalah

Stunting masih menjadi masalah kesehatan anak karena dapat berkaitan dengan gangguan pertumbuhan jangka panjang. Orang tua sering membutuhkan alat bantu awal untuk memahami apakah hasil pengukuran tinggi dan berat anak perlu dipantau lebih lanjut. StuntGuard dibuat sebagai sistem skrining awal yang mudah digunakan, bukan sebagai diagnosis medis.

## 3. Tujuan Project

- Membantu orang tua melakukan cek risiko stunting tanpa login.
- Membantu orang tua menyimpan riwayat pertumbuhan anak setelah login.
- Membantu petugas Posyandu/Puskesmas melihat ringkasan kasus dan konsultasi.
- Menyediakan edukasi gizi yang aman melalui chatbot edukatif.

## 4. Use Case / Manfaat

- Orang tua mengecek risiko awal menggunakan umur, gender, tinggi, dan berat.
- Orang tua menyimpan pengukuran berkala anak.
- Orang tua mengirim consultation ticket untuk tindak lanjut.
- Admin/petugas melihat dashboard, high-risk cases, dan membalas ticket.

## 5. Arsitektur Sistem

Frontend React mengirim request ke FastAPI. Backend menyimpan data ke SQLite dan memanggil modul ML scikit-learn untuk prediksi. Chatbot memakai rule-based fallback dan opsional LLM jika API key tersedia.

## 6. Teknologi yang Digunakan

- Frontend: React, Vite, TypeScript, Tailwind CSS, Recharts
- Backend: FastAPI, SQLAlchemy, SQLite
- AI/ML: scikit-learn, pandas, joblib
- Testing: pytest

## 7. Dataset

Dataset utama berasal dari Kaggle: Stunting Balita Detection 121K rows. Dataset asli dapat berisi `Age`, `Gender`, `Height`, dan `Nutrition Status`. Jika dataset lokal memiliki `weight_kg`, model penuh memakai tinggi dan berat. Jika tidak, sistem melatih `height-only-fallback-model` dan mencatat batasan tersebut.

## 8. AI Workflow

Data dibersihkan, kolom dinormalisasi, gender dikodekan, lalu model dilatih. Untuk mode penuh, pipeline menggunakan `GrowthFeatureEngineer` yang menurunkan gap dan rasio tinggi/berat terhadap estimasi pertumbuhan umum. Model dipilih berdasarkan macro F1 dari hasil training lokal.

## 9. Timeline Pengerjaan

1. Setup monorepo, backend, frontend, dan database.
2. Implementasi training ML dan prediction API.
3. Implementasi landing page, dashboard, CRUD anak, dan grafik pertumbuhan.
4. Implementasi login demo, chatbot, dan consultation ticket.
5. Testing, dokumentasi, dan persiapan demo.

## 10. Pembagian Tugas Anggota

- Frontend developer: landing page, dashboard, form, chart, role UI.
- Backend developer: FastAPI, database, CRUD, consultation ticket.
- ML engineer: preprocessing, feature engineering, training, model info.
- Documentation/testing: proposal, demo script, testing, presentasi.

## 11. Risiko dan Batasan Sistem

- StuntGuard bukan diagnosis medis.
- Dataset lokal mungkin tidak memiliki berat badan.
- Metrics hanya valid untuk dataset yang benar-benar digunakan saat training.
- Auth masih demo sederhana, bukan keamanan produksi.
- Faktor klinis lain seperti riwayat penyakit, sanitasi, dan asupan detail belum digunakan.

## 12. Rencana Pengembangan Lanjutan

- Integrasi standar antropometri resmi dan validasi dengan tenaga kesehatan.
- Auth produksi dan pemisahan data per akun.
- Export laporan PDF.
- Integrasi notifikasi follow-up.
- Dataset lebih lengkap dengan berat badan dan variabel kesehatan lain.
