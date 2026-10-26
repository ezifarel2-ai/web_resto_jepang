# 🎨 Savoria Frontend

Antarmuka pengguna (Client-side) untuk aplikasi restoran Savoria.

## 📂 Struktur Direktori

```text
frontend/
├── views/                # Halaman Web (HTML5)
│   ├── index.html        # Halaman utama katalog menu, pemesanan, & perencana budget
│   ├── kitchen.html      # Dasbor operasional staf dapur & kasir (Live Orders)
│   └── qr_generator.html # Halaman generator & cetak QR Code Meja
│
└── static/               # Aset Statis & Skrip Klien
    ├── styles.css        # Tata letak, tema Dark Luxury, HSL color tokens, & glassmorphism
    ├── app.js           # Logika reaktif antarmuka tamu (cart, search, AI combo, modal)
    ├── kitchen.js       # Logika realtime dasbor dapur (polling status & action buttons)
    └── images/          # Aset foto hidangan Jepang lokal
```

## 🌐 Koneksi ke Backend API

Frontend berkomunikasi dengan backend melalui REST API:
- `GET /api/foods` — Mengambil katalog menu dan filter
- `POST /api/orders` — Mengirim pesanan baru & mendapatkan URL WhatsApp
- `GET /api/orders` — Mengambil daftar antrean dapur
- `PATCH /api/orders/{id}/status` — Memperbarui status pesanan dapur
- `POST /api/ai/smart-combo` — Mengambil rekomendasi paket hemat budget
