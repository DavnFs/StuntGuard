# Dataset

Dataset utama yang direkomendasikan:

`https://www.kaggle.com/datasets/rendiputra/stunting-balita-detection-121k-rows`

Cara pakai:

1. Unduh dataset dari Kaggle.
2. Letakkan file CSV di folder ini, misalnya `backend/data/stunting_balita.csv`.
3. Pastikan CSV minimal memiliki kolom usia, gender, tinggi badan, dan label status gizi. Script mendukung variasi nama seperti `Age`, `Umur (bulan)`, `Gender`, `Jenis Kelamin`, `Height`, `Tinggi Badan (cm)`, `Nutrition Status`, atau `Stunting`.
4. Jika CSV memiliki `Weight` / `Berat Badan (kg)`, training menghasilkan `full-growth-model`. Jika tidak, training menghasilkan `height-only-fallback-model`. Jangan membuat data berat badan palsu hanya untuk mengejar mode penuh.
5. Jalankan training dari folder `backend`:

```bash
python -m app.ml.train_model --csv data/stunting_balita.csv
```

File `sample_stunting_data.csv` hanya contoh kecil untuk demo lokal dan pengujian alur aplikasi. Sample ini bukan pengganti dataset 121K baris dan tidak boleh dipakai untuk mengklaim performa model final.
