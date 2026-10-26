<<<<<<< HEAD

=======
# 🎌 Savoria - Smart Dining & Budget-Optimized Meal Planning Platform

**Savoria (日本料理)** adalah aplikasi web restoran pintar modern yang menggabungkan cita rasa kuliner Jepang autentik dengan sistem rekomendasi cerdas dan optimasi anggaran (*Smart Budget & Meal Optimizer*). Proyek ini dirancang sebagai platform pemesanan mandiri (*self-ordering*) yang lengkap dengan katalog menu interaktif, perencana paket hemat berbasis budget (*Smart Combo Planner*), sistem rekomendasi pairing hidangan pelengkap, serta pemesanan langsung terintegrasi WhatsApp.

---

## 🌟 Fitur Utama

### 1. ⚡ Smart Combo & Budget Optimizer (Constraint Satisfaction Heuristic)
- Pengguna dapat menentukan **Maksimum Anggaran (Budget)**, **Jumlah Orang (1, 2, atau 3-4 Orang)**, dan **Preferensi Rasa** (Gurih, Pedas, Sehat, Bebas).
- Algoritma cerdas menghitung kombinasi menu paling bernilai tinggi (Main + Drink + Side/Dessert) yang pas di bawah budget, menghitung sisa penghematan, estimasi kalori, serta profil cita rasanya.
- Tombol **"Masukkan Semua ke Keranjang"** memudahkan pemesanan paket hanya dengan 1 klik tanpa rasa bingung menentukan pilihan.

### 2. 🍶 Intelligent Food Pairing Engine (Rekomendasi Menu Pelengkap)
- Setiap kali pengguna memilih hidangan utama, sistem secara otomatis merekomendasikan hidangan pendamping (seperti side dish atau minuman teh autentik) yang memiliki kecocokan cita rasa (*taste profiling*).
- Menghilangkan *decision fatigue* bagi pelanggan baru yang belum akrab dengan menu kuliner Jepang.

### 3. 🍱 Koleksi Menu Cerdas & Modal Detail Interaktif
- Katalog hidangan Jepang autentik lengkap dengan nama kanji, foto menggugah selera, estimasi waktu masak, informasi kalori, rating bintang, dan jumlah ulasan.
- Filter multi-kriteria:
  - **Pencarian Real-Time** (nama, deskripsi, bumbu, kuah).
  - **Kategori**: Menu Utama, Pembuka, Minuman Autentik, Pencuci Mulut.
  - **Tag Khusus**: 🛡️ 100% Halal, 🔥 Pedas, 🥗 Vegetarian.
  - **Sorting**: Terpopuler, Rating Tertinggi, Harga Terendah/Tertinggi.
- **Modal Detail Hidangan**: Menampilkan deskripsi mendalam, profil rasa, dan **Rekomendasi Pairing** cerdas.

### 4. 🛒 Keranjang Pesanan & WhatsApp Direct Checkout
- Pengaturan jumlah porsi (+ / -), catatan khusus per menu.
- Pilihan mode makan: **Makan di Tempat (Dine In)** dengan nomor meja, atau **Bungkus (Takeaway)**.
- Penghitungan transparan: Subtotal, Pajak Restoran (10%), dan Biaya Layanan (5%).
- **Checkout WhatsApp**: Otomatis menyusun nota resmi yang rapi dan membuka chat WhatsApp ke kasir/restoran.

### 5. ⏱️ Pelacakan Pesanan Real-Time & Dasbor Dapur (Kitchen Ops)
- Pelanggan dapat melacak status pesanan secara mandiri menggunakan Order ID (`SVR-...`).
- Dasbor staf dapur (`/kitchen`) untuk memperbarui status pesanan (*menunggu*, *dimasak*, *selesai*).

---

## 🛠️ Arsitektur & Teknologi

- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python 3.10+) dengan Pola Arsitektur **MVC**
- **Database**: MySQL 8.0 (InnoDB utf8mb4 dengan PyMySQL) & SQLite (Fallback)
- **Server**: [Uvicorn](https://www.uvicorn.org/)
- **Data Validation & Schemas**: [Pydantic v2](https://docs.pydantic.dev/)
- **Frontend**: HTML5 Semantik (Folder `views/`), Vanilla CSS3 (Modern Glassmorphism, Dark Luxury Theme, HSL Colors), Vanilla JavaScript (ES6+ Asynchronous Fetch, Reactive State)
- **Integrasi**: WhatsApp Click-to-Chat API

---

## 🚀 Cara Menjalankan Proyek Secara Lokal

### 1. Masuk ke direktori proyek
```bash
cd fastapi-search-ai
```

### 2. Aktifkan Virtual Environment
- **Windows (PowerShell)**:
  ```powershell
  .\venv\Scripts\Activate.ps1
  ```
- **Linux / macOS**:
  ```bash
  source venv/bin/activate
  ```

### 3. Jalankan Server FastAPI
```bash
uvicorn main:app --reload --port 8000
```

### 4. Buka di Browser
- **Aplikasi Web**: [http://127.0.0.1:8000/](http://127.0.0.1:8000/)
- **Dasbor Dapur**: [http://127.0.0.1:8000/kitchen](http://127.0.0.1:8000/kitchen)
- **Dokumentasi Interaktif API (Swagger UI)**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **Alternatif Dokumentasi API (ReDoc)**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

---

## 📡 Daftar Endpoint API Utama

| Metode | Endpoint | Deskripsi |
| :--- | :--- | :--- |
| `GET` | `/` | Menampilkan antarmuka web utama restoran Savoria (View) |
| `GET` | `/kitchen` | Menampilkan dasbor pemantauan dapur staf restoran |
| `GET` | `/api/foods` | Mengambil katalog menu dengan filter query, kategori, halal, pedas, vegetarian, & sorting |
| `GET` | `/api/foods/{id}` | Mengambil detail lengkap 1 hidangan |
| `POST` | `/api/ai/smart-combo` | Algoritma peracik set hidangan optimal berdasarkan budget |
| `GET` | `/api/ai/recommendations` | Rekomendasi pairing hidangan pelengkap |
| `POST` | `/api/orders` | Membuat pesanan, menyimpan ke MySQL, menghitung pajak & fee, dan menghasilkan URL WhatsApp |
| `GET` | `/api/orders` | Mengambil daftar seluruh pesanan dari SQLite (dapat difilter status) |
| `GET` | `/api/orders/{id}` | Mengambil detail 1 pesanan beserta rincian itemnya |
| `PATCH` | `/api/orders/{id}/status` | Mengubah status pesanan (`menunggu`, `dimasak`, `selesai`, `dibatalkan`) |
| `GET` | `/api/orders/stats` | Statistik pesanan real-time, status dapur, & total omset |
| `GET` | `/api/database/info` | Informasi status database SQLite dan ringkasan tabel |

---

## 💾 Struktur Database SQLite (savoria.db)

Database menggunakan **SQLite 3** dengan skema relasional:
- **`foods`**: Menyimpan katalog lengkap hidangan Jepang (`id`, `name`, `japanese_name`, `price`, `category`, `calories`, `prep_time_min`, `spiciness`, `is_vegetarian`, `is_halal`, `rating`, `tags`, `pairings`).
- **`orders`**: Menyimpan transaksi pesanan pelanggan (`order_id`, `customer_name`, `customer_phone`, `order_type`, `table_number`, `subtotal`, `tax`, `service_fee`, `grand_total`, `status`, `created_at`).
- **`order_items`**: Menyimpan item hidangan untuk setiap pesanan (`order_id`, `food_id`, `food_name`, `price`, `quantity`, `line_total`, `notes`) dengan relasi `FOREIGN KEY CASCADE`.

Database otomatis dibuat dan di-seed saat FastAPI pertama kali dijalankan, atau dapat diinisialisasi manual via:
```bash
python database.py
```

---

## 🏛️ Arsitektur MVC (Model - View - Controller)

Proyek ini telah direfaktor menggunakan standar arsitektur **MVC** untuk memisahkan tanggung jawab kode secara bersih:

- **Model (M)**:
  - `models/`: Skema validasi data Pydantic (`food_models.py`, `order_models.py`, `ai_models.py`, `puzzle_models.py`).
  - `db/`: Akses data SQLite terisolasi (`connection.py`, `schema.py`, `foods_repo.py`, `orders_repo.py`, `seeder.py`).
- **View (V)**:
  - `static/`: Tampilan antarmuka klien (`index.html`, `styles.css`, `app.js`).
  - Serialisasi data JSON output langsung via Pydantic response models.
- **Controller (C)**:
  - `controllers/`: Mengatur alur request HTTP per domain (`foods_controller.py`, `orders_controller.py`, `ai_controller.py`, `solvers_controller.py`, `views_controller.py`).
- **Service Layer**:
  - `services/`: Memproses logika bisnis kompleks (`order_service.py`, `ai_service.py`, `solver_service.py`).

---

## 📂 Struktur Direktori Profesional (Decoupled Monorepo)

```
fastapi-search-ai/
├── backend/                  # ⚙️ BACKEND (Server, API, Logika Bisnis & Database)
│   ├── controllers/          # 🕹️ CONTROLLER (APIRouter per modul)
│   │   ├── __init__.py
│   │   ├── foods_controller.py
│   │   ├── orders_controller.py
│   │   ├── ai_controller.py
│   │   └── views_controller.py
│   ├── models/               # 📦 MODEL (Pydantic DTO & Schemas)
│   │   ├── __init__.py
│   │   ├── food_models.py
│   │   ├── order_models.py
│   │   └── ai_models.py
│   ├── services/             # ⚙️ SERVICE LAYER (Business Logic & Heuristics)
│   │   ├── __init__.py
│   │   ├── order_service.py
│   │   └── ai_service.py
│   ├── db/                   # 💾 DATABASE LAYER (SQLite Repository)
│   │   ├── __init__.py
│   │   ├── connection.py
│   │   ├── schema.py
│   │   ├── foods_repo.py
│   │   ├── orders_repo.py
│   │   └── seeder.py
│   ├── tests/                # 🧪 AUTOMATED TESTS (Pytest suite)
│   │   ├── __init__.py
│   │   └── test_api.py
│   ├── ai_engine.py          # Modul AI Sommelier & katalog
│   ├── config.py             # Konfigurasi environment backend & path
│   ├── database.py           # Facade wrapper & CLI init database
│   ├── main.py               # Aplikasi FastAPI utama
│   ├── requirements.txt      # Dependensi Python
│   ├── savoria.db            # Database SQLite
│   ├── Dockerfile            # Container backend
│   └── README.md             # Panduan khusus backend
│
├── frontend/                 # 🎨 FRONTEND (Client-side, UI & Aset Statis)
│   ├── views/                # 👁️ VIEW (Tampilan Antarmuka Halaman HTML5)
│   │   ├── index.html        # Halaman utama katalog & pemesanan
│   │   ├── kitchen.html      # Dasbor operasional staf dapur & kasir
│   │   └── qr_generator.html # Halaman generator cetak QR Meja
│   ├── static/               # 🎨 ASSETS (Aset Statis Pendukung Tampilan)
│   │   ├── styles.css        # File gaya CSS (Dark Luxury & Glassmorphism)
│   │   ├── app.js           # Logika JavaScript klien (Cart, Search, Dialog)
│   │   ├── kitchen.js       # Logika realtime antrean dapur
│   │   └── images/          # Koleksi foto hidangan lokal
│   └── README.md             # Panduan khusus frontend
│
├── main.py                   # 🚀 ROOT ENTRYPOINT WRAPPER (Bisa run dari root / backend)
├── config.py                 # Root facade config
├── docker-compose.yml        # Orkestrasi Docker container
├── Dockerfile                # Dockerfile fullstack multi-service
├── .env.example              # Template variabel lingkungan
├── .gitignore                # Filter git
└── README.md                 # Dokumentasi lengkap proyek
```

---

*Selamat mengembangkan proyek mandiri Anda! Arigatou Gozaimasu 🙏*
>>>>>>> c4711de (feat: Savoria AI restaurant platform with cloud docker configuration)
