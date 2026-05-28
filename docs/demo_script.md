# Demo Script 10-15 Menit

## 1. Problem Introduction

Jelaskan bahwa stunting membutuhkan pemantauan rutin dan tindak lanjut cepat. Posyandu membutuhkan alat bantu pencatatan dan skrining awal agar kasus berisiko lebih mudah terlihat.

## 2. Dashboard Overview

Buka halaman Dashboard. Tunjukkan kartu total balita, total pemeriksaan, status normal, stunted, severely stunted, dan persentase risiko stunting. Jelaskan chart distribusi status, status berdasarkan gender, tren bulanan, dan kasus risiko tinggi.

## 3. Add Child Data

Masuk ke halaman Data Balita. Tambahkan data demo balita tanpa NIK atau identitas sensitif. Isi nama demo, gender, tanggal lahir, orang tua, alamat demo, dan wilayah Posyandu.

## 4. Add Measurement

Buka detail balita. Isi tanggal pemeriksaan, usia dalam bulan, dan tinggi badan.

## 5. Run Prediction

Klik Simpan & Prediksi. Tunjukkan bahwa sistem otomatis memanggil model AI dan menyimpan hasil ke riwayat pemeriksaan.

## 6. Show Recommendation

Tunjukkan status gizi, risk level, confidence jika tersedia, rekomendasi edukatif, dan disclaimer bahwa hasil bukan diagnosis medis.

## 7. Show Growth Chart

Tunjukkan grafik age_month vs height_cm di halaman detail. Jelaskan bahwa grafik membantu pemantauan pertumbuhan dari waktu ke waktu.

## 8. Show Dashboard Update

Kembali ke Dashboard. Tunjukkan bahwa total pemeriksaan dan chart berubah setelah data baru ditambahkan.

## 9. Show Chatbot

Masuk ke Edukasi Gizi. Coba pertanyaan:

- Apa itu stunting?
- Makanan untuk mencegah stunting
- Kapan harus ke Puskesmas?

Jelaskan bahwa chatbot memiliki fallback rule-based sehingga tetap berjalan tanpa API key LLM.

## 10. Explain Model and Limitations

Buka Tentang Model. Tunjukkan model aktif, fitur input, label, metrics jika model sudah dilatih, dan feature importance jika tersedia. Tekankan bahwa sistem adalah skrining awal dan harus dikonsultasikan dengan tenaga kesehatan.
