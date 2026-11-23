import sqlite3

def buat_database():
    koneksi = sqlite3.connect("peduliin.db")

    cursor = koneksi.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS laporan (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nomor TEXT UNIQUE NOT NULL,
            kategori TEXT NOT NULL,
            lokasi TEXT NOT NULL,
            latitude REAL,
            longitude REAL,
            deskripsi TEXT NOT NULL,
            foto TEXT,
            tanggal TEXT,
            status TEXT NOT NULL
        )
    """)

    koneksi.commit()
    koneksi.close()

    print("Database PEDULIIN berhasil dibuat!")

if __name__ == "__main__":
    buat_database()