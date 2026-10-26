import os
import time
import sqlite3
import pymysql
import pymysql.cursors
import config

DB_FILE = config.DB_FILE
DB_TYPE = getattr(config, "DB_TYPE", "mysql").lower()

class RowDict(dict):
    """Dictionary yang mendukung akses berbasis key (row['col']) dan integer index (row[0])."""
    def __getitem__(self, key):
        if isinstance(key, int):
            return list(self.values())[key]
        return super().__getitem__(key)

class RowCursor(pymysql.cursors.DictCursor):
    """Custom cursor PyMySQL yang membungkus setiap row dengan RowDict."""
    def _conv_row(self, build_row):
        r = super()._conv_row(build_row)
        return RowDict(r) if r is not None else None

class MySQLCursorWrapper:
    """Wrapper kursor MySQL yang otomatis menerjemahkan placeholder '?' ke '%s'."""
    def __init__(self, cursor):
        self._cursor = cursor

    def execute(self, query, params=None):
        if "?" in query:
            query = query.replace("?", "%s")
        if params is None:
            return self._cursor.execute(query)
        return self._cursor.execute(query, params)

    def fetchone(self):
        return self._cursor.fetchone()

    def fetchall(self):
        return self._cursor.fetchall()

    @property
    def rowcount(self):
        return self._cursor.rowcount

    @property
    def lastrowid(self):
        return self._cursor.lastrowid

    def close(self):
        return self._cursor.close()

class MySQLConnectionWrapper:
    """Wrapper koneksi MySQL untuk antarmuka DB-API standar."""
    def __init__(self, conn):
        self._conn = conn

    def cursor(self):
        return MySQLCursorWrapper(self._conn.cursor(RowCursor))

    def commit(self):
        return self._conn.commit()

    def rollback(self):
        return self._conn.rollback()

    def close(self):
        return self._conn.close()

    def execute(self, query, params=None):
        cur = self.cursor()
        res = cur.execute(query, params)
        cur.close()
        return res

def get_mysql_connection():
    """Membuka koneksi ke MySQL server dan memastikan database ada."""
    try:
        # Coba koneksi langsung ke database yang ditargetkan dengan timeout 1 detik
        conn = pymysql.connect(
            host=config.MYSQL_HOST,
            port=config.MYSQL_PORT,
            user=config.MYSQL_USER,
            password=config.MYSQL_PASSWORD,
            database=config.MYSQL_DB,
            charset="utf8mb4",
            autocommit=False,
            connect_timeout=1,
            cursorclass=RowCursor
        )
        return MySQLConnectionWrapper(conn)
    except pymysql.err.OperationalError as e:
        # Kode 1049: Unknown database -> buat database otomatis
        if e.args[0] == 1049:
            root_conn = pymysql.connect(
                host=config.MYSQL_HOST,
                port=config.MYSQL_PORT,
                user=config.MYSQL_USER,
                password=config.MYSQL_PASSWORD,
                charset="utf8mb4",
                autocommit=True,
                connect_timeout=1
            )
            with root_conn.cursor() as cur:
                cur.execute(f"CREATE DATABASE IF NOT EXISTS `{config.MYSQL_DB}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
            root_conn.close()

            conn = pymysql.connect(
                host=config.MYSQL_HOST,
                port=config.MYSQL_PORT,
                user=config.MYSQL_USER,
                password=config.MYSQL_PASSWORD,
                database=config.MYSQL_DB,
                charset="utf8mb4",
                autocommit=False,
                connect_timeout=1,
                cursorclass=RowCursor
            )
            return MySQLConnectionWrapper(conn)
        raise e

class DatabaseOfflineError(RuntimeError):
    """Exception yang dilempar ketika service database MySQL Laragon belum dinyalakan."""
    pass

_last_mysql_check_time = 0
_last_mysql_check_status = False

def is_mysql_active() -> bool:
    """Mengecek apakah service MySQL Laragon sedang aktif dengan cache responsif (1.5s)."""
    global _last_mysql_check_time, _last_mysql_check_status
    now = time.time()
    if now - _last_mysql_check_time < 1.5:
        return _last_mysql_check_status

    try:
        conn = pymysql.connect(
            host=config.MYSQL_HOST,
            port=config.MYSQL_PORT,
            user=config.MYSQL_USER,
            password=config.MYSQL_PASSWORD,
            charset="utf8mb4",
            connect_timeout=0.4
        )
        conn.close()
        _last_mysql_check_status = True
    except Exception:
        _last_mysql_check_status = False

_sqlite_initialized = False

def get_sqlite_connection():
    """Membuka koneksi ke SQLite database (fallback mandiri untuk cloud/lokal tanpa MySQL)."""
    global _sqlite_initialized
    conn = sqlite3.connect(DB_FILE, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    if not _sqlite_initialized:
        _sqlite_initialized = True
        try:
            from .schema import create_tables
            from .seeder import seed_all
            create_tables()
            seed_all()
        except Exception:
            pass
    return conn

def get_connection():
    """Mendapatkan koneksi database. Gunakan MySQL jika aktif/dikonfigurasi, atau otomatis fallback ke SQLite."""
    if DB_TYPE == "mysql" and is_mysql_active():
        try:
            return get_mysql_connection()
        except Exception:
            pass
    return get_sqlite_connection()

def get_active_db_type() -> str:
    """Mengembalikan jenis database yang saat ini aktif."""
    if DB_TYPE == "mysql" and is_mysql_active():
        try:
            conn = pymysql.connect(
                host=config.MYSQL_HOST,
                port=config.MYSQL_PORT,
                user=config.MYSQL_USER,
                password=config.MYSQL_PASSWORD,
                charset="utf8mb4",
                connect_timeout=0.4
            )
            ver = conn.get_server_info()
            conn.close()
            return f"MySQL {ver}"
        except Exception:
            pass
    return f"SQLite 3 ({os.path.basename(DB_FILE)})"


