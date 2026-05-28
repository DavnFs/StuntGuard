# AI Workflow

## Dataset Description

Dataset utama yang digunakan adalah Kaggle `Stunting Toddler (Balita) Detection (121K rows)`. Fitur yang dipakai:

- Age atau Age (Month): usia balita dalam bulan, 0-60.
- Gender: male/female.
- Height: tinggi badan dalam sentimeter.
- Nutrition Status: severely stunted, stunted, normal, tall.

File sample di repository hanya data kecil untuk demo lokal.

## Preprocessing

Script `backend/app/ml/train_model.py` melakukan:

- Load CSV dari `backend/data/`.
- Normalisasi nama kolom fleksibel.
- Konversi usia dan tinggi badan ke numerik.
- Normalisasi gender ke `male` atau `female`.
- Normalisasi label status gizi.
- Drop data kosong atau tidak valid.
- Validasi usia 0-60 bulan dan tinggi badan yang masuk akal.

## Model Candidates

Model yang dilatih:

- DecisionTreeClassifier
- RandomForestClassifier
- LogisticRegression

Setiap model dibungkus dalam pipeline scikit-learn dengan preprocessing gender menggunakan OneHotEncoder.

## Evaluation Metrics

Metrics yang dihitung:

- Accuracy
- Macro precision
- Macro recall
- Macro F1
- Confusion matrix
- Classification report

Macro F1 dipakai sebagai metric pemilihan utama karena semua kelas penting untuk dipantau, termasuk kelas risiko.

## Model Selection

Training script memilih model dengan macro F1 tertinggi pada test set. Hasil disimpan ke:

- `backend/app/ml/model_artifacts/stunting_model.joblib`
- `backend/app/ml/model_artifacts/metrics.json`
- `backend/app/ml/model_artifacts/labels.json`

Metrics tidak ditulis manual. Nilainya selalu dihasilkan dari dataset lokal saat script training dijalankan.

## Prediction Flow

1. Frontend mengirim usia, gender, dan tinggi badan ke backend.
2. Backend memvalidasi payload.
3. Backend memuat model joblib jika tersedia.
4. Model menghasilkan kategori status gizi.
5. Backend memetakan status menjadi risk level.
6. Backend menambahkan rekomendasi edukatif dan disclaimer.
7. Response dikirim ke frontend.

## Explainability

Untuk Decision Tree atau Random Forest, script mengekstrak feature importance dari model terbaik dan menyimpannya di metrics. Endpoint `GET /model/info` menampilkan feature importance jika tersedia.

## Limitations

- Input model hanya usia, gender, dan tinggi badan.
- Sistem belum menghitung z-score WHO secara resmi.
- Data kesehatan lain belum dipakai.
- Hasil prediksi tidak boleh menggantikan diagnosis tenaga kesehatan.
- Dataset label dapat memiliki hubungan sangat kuat dengan aturan antropometri, sehingga model harus diposisikan sebagai demo AI screening.
