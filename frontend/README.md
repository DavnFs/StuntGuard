# StuntGuard Frontend

React + Vite + TypeScript frontend untuk StuntGuard. Halaman pertama adalah landing page publik dengan quick stunting check tanpa login. Login demo dipakai untuk parent dashboard, riwayat anak, grafik pertumbuhan, admin dashboard, dan consultation ticket.

## Setup

```bash
cd frontend
npm install
```

Opsional: buat `.env` untuk mengganti URL backend.

```bash
VITE_API_BASE_URL=http://localhost:8000
```

## Run

```bash
npm run dev
```

Frontend tersedia di `http://localhost:5173`.

Dari root project, backend dan frontend bisa dijalankan bersamaan:

```bash
npm run dev
```

Demo accounts:

- `parent@demo.com` / `password`
- `admin@demo.com` / `password`

## Build

```bash
npm run build
```
