# AI Workflow

## Dataset

Dataset utama adalah Kaggle Stunting Balita Detection 121K rows. Kolom yang umum tersedia:

- Age / Age (Month)
- Gender
- Height
- Nutrition Status

Versi dataset lain atau dataset gabungan dapat memiliki `weight_kg`. StuntGuard mendeteksi keberadaan kolom berat badan saat training.

## Preprocessing

Training script menormalisasi nama kolom fleksibel:

- `Age`, `Age (Month)`, `age_month`, `Umur (bulan)` menjadi `age_month`
- `Gender`, `Jenis Kelamin` menjadi `gender`
- `Height`, `Height (cm)`, `Tinggi Badan (cm)` menjadi `height_cm`
- `Weight`, `Berat Badan (kg)` menjadi `weight_kg` jika tersedia
- `Nutrition Status`, `Stunting` menjadi `nutrition_status`

Data dibersihkan dari nilai kosong, umur di luar 0-60 bulan, tinggi tidak masuk akal, dan berat tidak masuk akal bila tersedia.

## Feature Engineering

Mode penuh memakai `GrowthFeatureEngineer` untuk menurunkan:

- `age_month`
- `height_cm`
- `weight_kg`
- `height_gap_expected`
- `height_expected_ratio`
- `weight_gap_expected`
- `weight_expected_ratio`

Fitur turunan ini dipakai sebagai fitur screening sederhana, bukan standar diagnosis resmi.

## Model Candidates

Training script membandingkan beberapa model scikit-learn:

- DecisionTreeClassifier
- RandomForestClassifier
- ExtraTreesClassifier
- HistGradientBoostingClassifier
- LogisticRegression
- MLPClassifier

Model terbaik dipilih berdasarkan macro F1.

## Fallback Dataset Mode

Jika `weight_kg` tersedia, script melatih `full-growth-model`.

Jika `weight_kg` tidak tersedia, script melatih `height-only-fallback-model` menggunakan usia, gender, dan tinggi badan. Metrics fallback ini harus dijelaskan sebagai fallback, bukan hasil model penuh.

## Evaluation

Metrics yang disimpan:

- Accuracy
- Macro precision
- Macro recall
- Macro F1
- Confusion matrix
- Classification report

Metrics tidak boleh dibuat manual. Nilainya berasal dari training lokal.

## Prediction Flow

1. Frontend mengirim umur, gender, tinggi, dan berat.
2. Backend menghitung `growth_notes`.
3. Backend memuat model joblib bila tersedia.
4. Jika model tersedia, output status dan confidence.
5. Jika model tidak tersedia/gagal, backend memakai `rule-based-fallback`.
6. Backend mengembalikan rekomendasi aman, model mode, dan disclaimer.

## Chatbot AI Workflow

StuntGuard AI Assistant adalah chatbot edukasi gizi berbahasa Indonesia. Chatbot memakai LLM jika environment `OPENAI_API_KEY` tersedia, tetapi tetap bisa berjalan tanpa API key menggunakan rule-based fallback.

Alur chatbot:

1. User mengirim pertanyaan dan opsional `child_context` dari hasil skrining.
2. Input guardrail mengklasifikasikan pesan:
   - out-of-scope
   - medical diagnosis request
   - medication or dosage request
   - emergency or danger sign
   - nutrition/stunting/app help question
3. Jika pesan berisiko, backend langsung menjawab dengan guardrail response.
4. Jika aman dan LLM tersedia, backend mengirim system prompt yang membatasi peran chatbot sebagai edukator gizi Posyandu.
5. Output guardrail memeriksa jawaban LLM dari pola tidak aman seperti diagnosis pasti, dosis obat, atau klaim penyembuhan.
6. Jika jawaban LLM tidak aman atau LLM gagal, backend memakai fallback rule-based.

Guardrail penting:

- Chatbot tidak memberi diagnosis medis.
- Chatbot tidak memberi dosis obat, vitamin, antibiotik, atau suplemen.
- Tanda bahaya seperti sesak, kejang, lemas sekali, tidak sadar, muntah terus, diare berat, atau tidak mau minum diarahkan segera ke fasilitas kesehatan.
- Untuk bayi di bawah 6 bulan, chatbot tidak menyarankan makanan padat dan menjelaskan ASI eksklusif kecuali ada arahan tenaga kesehatan.
- Jawaban selalu menekankan bahwa informasi bersifat edukasi dan bukan pengganti konsultasi tenaga kesehatan.

## Limitations

- Bukan diagnosis medis.
- Dataset mungkin tidak berisi berat badan.
- Estimasi expected growth di feature engineering adalah pendekatan demo.
- Faktor klinis dan sosial belum dipakai.
- Chatbot bergantung pada guardrails dan fallback; hasilnya tetap edukasi umum, bukan rekomendasi medis personal.
