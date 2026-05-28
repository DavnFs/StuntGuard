# Proposal Project

## 1. Judul Project

StuntGuard: Sistem Prediksi dan Monitoring Risiko Stunting pada Balita.

## 2. Latar Belakang Masalah

Stunting masih menjadi masalah kesehatan masyarakat karena dapat memengaruhi pertumbuhan fisik, perkembangan kognitif, dan kualitas hidup anak. Posyandu dan Puskesmas memiliki peran penting dalam pemantauan tumbuh kembang balita, tetapi pencatatan manual sering menyulitkan analisis cepat terhadap kasus berisiko.

StuntGuard dirancang sebagai aplikasi web untuk membantu kader atau petugas melakukan pencatatan tinggi badan, melihat riwayat pertumbuhan, dan mendapatkan hasil skrining awal berbasis AI. Sistem ini bukan pengganti diagnosis medis, melainkan alat bantu edukasi dan pendukung keputusan.

## 3. Tujuan Project

- Membuat aplikasi web yang dapat mencatat data balita dan pemeriksaan tinggi badan.
- Melatih model machine learning untuk memprediksi kategori status gizi berdasarkan usia, gender, dan tinggi badan.
- Menyediakan dashboard monitoring kasus stunting dan tren pemeriksaan.
- Menampilkan rekomendasi edukatif yang aman dan disertai disclaimer medis.
- Menyediakan chatbot edukasi gizi dengan fallback rule-based.

## 4. Use Case / Manfaat

- Kader Posyandu dapat mencatat data balita tanpa memakai identitas sensitif seperti NIK.
- Petugas dapat melihat riwayat tinggi badan dan hasil skrining setiap balita.
- Koordinator wilayah dapat memantau distribusi kasus berdasarkan status gizi, gender, dan wilayah Posyandu.
- Orang tua memperoleh edukasi umum tentang stunting dan kapan perlu konsultasi ke Puskesmas.

## 5. Arsitektur Sistem

Sistem menggunakan arsitektur client-server sederhana:

- Frontend React menerima input pengguna dan menampilkan dashboard.
- Backend FastAPI menyediakan REST API.
- SQLite menyimpan data balita dan pemeriksaan.
- Model scikit-learn memprediksi status gizi.
- Chatbot menggunakan fallback rule-based dan dapat memakai LLM jika API key tersedia.

## 6. Teknologi yang Digunakan

- Backend: Python, FastAPI, SQLAlchemy, SQLite
- Machine Learning: pandas, scikit-learn, joblib
- Frontend: React, Vite, TypeScript
- Styling: Tailwind CSS
- Charts: Recharts
- Testing: pytest, FastAPI TestClient

## 7. Dataset

Dataset utama berasal dari Kaggle: `rendiputra/stunting-balita-detection-121k-rows`.

Kolom yang digunakan:

- Age atau Age (Month)
- Gender
- Height
- Nutrition Status

Repository menyertakan `backend/data/sample_stunting_data.csv` hanya untuk demo lokal dan pengujian alur aplikasi. Sample ini bukan representasi dataset 121K baris.

## 8. AI Workflow

1. Load dataset CSV dari `backend/data/`.
2. Normalisasi nama kolom agar fleksibel.
3. Bersihkan data usia, gender, tinggi badan, dan label status gizi.
4. Latih beberapa model: Decision Tree, Random Forest, dan Logistic Regression.
5. Evaluasi dengan accuracy, macro precision, macro recall, macro F1, confusion matrix, dan classification report.
6. Pilih model terbaik berdasarkan macro F1.
7. Simpan pipeline model dan metrics ke `backend/app/ml/model_artifacts/`.
8. Backend memakai model tersimpan untuk prediksi API.

## 9. Timeline Pengerjaan

Ringkasan timeline:

- Minggu 1: Analisis kebutuhan, setup repository, desain arsitektur.
- Minggu 2: Backend CRUD, database, dan endpoint prediksi.
- Minggu 3: Training model, evaluasi, dan integrasi ML.
- Minggu 4: Frontend dashboard, data balita, detail, dan prediksi.
- Minggu 5: Chatbot edukasi, dokumentasi, testing, dan persiapan presentasi.

## 10. Pembagian Tugas Anggota

- Frontend developer: UI dashboard, data balita, detail, prediksi cepat, chatbot.
- Backend developer: FastAPI, database, CRUD, dashboard API.
- ML engineer: preprocessing, training, evaluasi, model artifact.
- Documentation/testing: proposal, demo script, testing, slide outline.

## 11. Risiko dan Batasan Sistem

- Sistem hanya menggunakan usia, gender, dan tinggi badan.
- Faktor klinis lain seperti berat badan, riwayat penyakit, prematuritas, sanitasi, dan pola makan belum digunakan.
- Label dataset kemungkinan sangat berkaitan dengan aturan z-score atau standar pertumbuhan.
- Hasil prediksi tidak boleh dianggap diagnosis medis.
- Metrics hanya valid untuk dataset lokal yang dipakai saat training.

## 12. Rencana Pengembangan Lanjutan

- Menambahkan berat badan, lingkar kepala, dan riwayat imunisasi.
- Integrasi standar WHO Anthro atau kalkulasi z-score resmi.
- Export laporan PDF/Excel untuk petugas.
- Role-based access sederhana untuk kader, petugas Puskesmas, dan admin.
- Integrasi IoT alat ukur tinggi badan jika waktu dan perangkat tersedia.
