from .connection import get_connection, MySQLConnectionWrapper

def create_tables():
    """Membuat 4 tabel utama database (MySQL / SQLite) untuk alur pemesanan meja QR & kasir."""
    conn = get_connection()
    cursor = conn.cursor()

    is_mysql = isinstance(conn, MySQLConnectionWrapper)

    if is_mysql:
        # 1. Tabel Menu Makanan (Foods Catalog) - MySQL
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS foods (
            id INT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            japanese_name VARCHAR(255) DEFAULT '',
            description TEXT,
            price INT NOT NULL,
            image_url VARCHAR(500) DEFAULT '',
            category VARCHAR(100) NOT NULL,
            calories INT DEFAULT 0,
            prep_time_min INT DEFAULT 10,
            spiciness INT DEFAULT 0,
            is_vegetarian TINYINT(1) DEFAULT 0,
            is_halal TINYINT(1) DEFAULT 1,
            rating FLOAT DEFAULT 4.8,
            review_count INT DEFAULT 0,
            tags TEXT,
            pairings TEXT,
            is_available TINYINT(1) DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        """)

        # 2. Tabel Master Meja & Token QR Code (Tables) - MySQL
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS tables (
            id INT AUTO_INCREMENT PRIMARY KEY,
            table_number VARCHAR(50) UNIQUE NOT NULL,
            capacity INT DEFAULT 4,
            section VARCHAR(50) DEFAULT 'Main Dining',
            status VARCHAR(50) DEFAULT 'available',
            current_order_id VARCHAR(100) DEFAULT NULL,
            qr_token VARCHAR(100) UNIQUE NOT NULL,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        """)

        # 3. Tabel Orders (Pesanan Pelanggan & Status Pembayaran Kasir / QRIS) - MySQL
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS orders (
            id INT AUTO_INCREMENT PRIMARY KEY,
            order_id VARCHAR(100) UNIQUE NOT NULL,
            customer_name VARCHAR(255) NOT NULL,
            customer_phone VARCHAR(50) DEFAULT '',
            order_type VARCHAR(50) NOT NULL,
            table_number VARCHAR(50) DEFAULT '-',
            notes TEXT,
            subtotal INT NOT NULL,
            tax INT NOT NULL,
            service_fee INT NOT NULL,
            grand_total INT NOT NULL,
            status VARCHAR(50) DEFAULT 'menunggu',
            payment_method VARCHAR(50) DEFAULT 'qris',
            payment_status VARCHAR(50) DEFAULT 'belum_bayar',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        """)

        # 4. Tabel Order Items (Rincian Porsi & Catatan Item) - MySQL
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS order_items (
            id INT AUTO_INCREMENT PRIMARY KEY,
            order_id VARCHAR(100) NOT NULL,
            food_id INT NOT NULL,
            food_name VARCHAR(255) NOT NULL,
            price INT NOT NULL,
            quantity INT NOT NULL,
            line_total INT NOT NULL,
            notes TEXT,
            FOREIGN KEY (order_id) REFERENCES orders (order_id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        """)

    else:
        # SQLite Schemas (Fallback)
        # 1. Foods
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS foods (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            japanese_name TEXT DEFAULT '',
            description TEXT DEFAULT '',
            price INTEGER NOT NULL,
            image_url TEXT DEFAULT '',
            category TEXT NOT NULL,
            calories INTEGER DEFAULT 0,
            prep_time_min INTEGER DEFAULT 10,
            spiciness INTEGER DEFAULT 0,
            is_vegetarian INTEGER DEFAULT 0,
            is_halal INTEGER DEFAULT 1,
            rating REAL DEFAULT 4.8,
            review_count INTEGER DEFAULT 0,
            tags TEXT DEFAULT '[]',
            pairings TEXT DEFAULT '[]',
            is_available INTEGER DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)

        # 2. Tables
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS tables (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            table_number TEXT UNIQUE NOT NULL,
            capacity INTEGER DEFAULT 4,
            section TEXT DEFAULT 'Main Dining',
            status TEXT DEFAULT 'available',
            current_order_id TEXT DEFAULT NULL,
            qr_token TEXT UNIQUE NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)

        # 3. Orders
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id TEXT UNIQUE NOT NULL,
            customer_name TEXT NOT NULL,
            customer_phone TEXT DEFAULT '',
            order_type TEXT NOT NULL,
            table_number TEXT DEFAULT '-',
            notes TEXT DEFAULT '',
            subtotal INTEGER NOT NULL,
            tax INTEGER NOT NULL,
            service_fee INTEGER NOT NULL,
            grand_total INTEGER NOT NULL,
            status TEXT DEFAULT 'menunggu',
            payment_method TEXT DEFAULT 'qris',
            payment_status TEXT DEFAULT 'belum_bayar',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)

        # 4. Order Items
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS order_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id TEXT NOT NULL,
            food_id INTEGER NOT NULL,
            food_name TEXT NOT NULL,
            price INTEGER NOT NULL,
            quantity INTEGER NOT NULL,
            line_total INTEGER NOT NULL,
            notes TEXT DEFAULT '',
            FOREIGN KEY (order_id) REFERENCES orders (order_id) ON DELETE CASCADE
        );
        """)

    conn.commit()
    conn.close()

def init_db():
    """Inisialisasi tabel utama database."""
    create_tables()
