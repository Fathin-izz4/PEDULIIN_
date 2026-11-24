import os
import math
import sqlite3

from functools import wraps
from flask import Flask, jsonify, request, session
from flask_cors import CORS
from werkzeug.security import check_password_hash


# Membuat aplikasi Flask
app = Flask(__name__)
app.secret_key = os.environ.get("PEDULIIN_SECRET_KEY")

# Konfigurasi keamanan session
app.secret_key = os.environ.get("PEDULIIN_SECRET_KEY")

app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"

# Membatasi ukuran permintaan maksimal 8 MB
app.config["MAX_CONTENT_LENGTH"] = 8 * 1024 * 1024

CORS(
    app,
    supports_credentials=True,
    origins=["http://127.0.0.1:5500"]
)

# Memeriksa apakah admin sudah login
def admin_required(f):

    @wraps(f)
    def decorated_function(*args, **kwargs):

        if not session.get("admin_login"):
            return jsonify({
                "pesan": "Akses ditolak! Silakan login sebagai admin."
            }), 401

        return f(*args, **kwargs)

    return decorated_function

# Login admin
@app.route("/api/admin/login", methods=["POST"])
def login_admin():

    data = request.get_json()

    if not data:
        return jsonify({
            "pesan": "Data login tidak ditemukan!"
        }), 400

    username = data.get("username")
    password = data.get("password")

    username_admin = os.environ.get("PEDULIIN_ADMIN_USERNAME")
    password_hash = os.environ.get("PEDULIIN_ADMIN_PASSWORD_HASH")

    if not username_admin or not password_hash:
        return jsonify({
            "pesan": "Konfigurasi admin belum tersedia!"
        }), 500

    if (
        username != username_admin
        or not isinstance(password, str)
        or not check_password_hash(password_hash, password)
    ):
        return jsonify({
            "pesan": "Username atau password salah!"
        }), 401

    session["admin_login"] = True

    return jsonify({
        "pesan": "Login admin berhasil!"
    }), 200

# Logout admin
@app.route("/api/admin/logout", methods=["POST"])
def logout_admin():

    session.clear()

    return jsonify({
        "pesan": "Logout berhasil!"
    }), 200

def koneksi_database():
    koneksi = sqlite3.connect("peduliin.db")
    koneksi.row_factory = sqlite3.Row
    return koneksi


@app.route("/")
def beranda():
    return "PEDULIIN Backend Berhasil Berjalan!"


@app.route("/api/laporan", methods=["GET"])
def ambil_laporan():

    koneksi = koneksi_database()

    cursor = koneksi.cursor()

    cursor.execute("SELECT * FROM laporan")

    hasil = cursor.fetchall()

    laporan = [dict(data) for data in hasil]

    koneksi.close()

    return jsonify(laporan)
@app.route("/api/laporan", methods=["POST"])
def tambah_laporan():

    data = request.get_json()

    if not data:
        return jsonify({
            "pesan": "Data laporan tidak ditemukan!"
        }), 400

    # Memeriksa data wajib
    kolom_wajib = [
        "nomor",
        "kategori",
        "lokasi",
        "deskripsi"
    ]

    for kolom in kolom_wajib:
        if not data.get(kolom):
            return jsonify({
                "pesan": f"Data {kolom} wajib diisi!"
            }), 400

    # Memeriksa kategori laporan
    kategori_valid = [
        "Sampah Berserakan",
        "Saluran Air Tersumbat",
        "Fasilitas Rusak",
        "Penghijauan",
        "Lainnya"
    ]

    if data.get("kategori") not in kategori_valid:
        return jsonify({
            "pesan": "Kategori laporan tidak valid!"
        }), 400

    # Memeriksa panjang data
    batas_panjang = {
        "nomor": 50,
        "kategori": 100,
        "lokasi": 200,
        "deskripsi": 1000
    }

    for kolom, batas in batas_panjang.items():
        nilai = data.get(kolom)

        if not isinstance(nilai, str):
            return jsonify({
                "pesan": f"Format {kolom} harus berupa teks!"
            }), 400

        if len(nilai.strip()) > batas:
            return jsonify({
                "pesan": f"{kolom.capitalize()} maksimal {batas} karakter!"
            }), 400
            
    # Memeriksa koordinat lokasi
    latitude = data.get("latitude")
    longitude = data.get("longitude")

    if latitude is None or longitude is None:
        return jsonify({
            "pesan": "Koordinat lokasi wajib diisi!"
        }), 400

    try:
        latitude = float(latitude)
        longitude = float(longitude)
    except (ValueError, TypeError):
        return jsonify({
            "pesan": "Koordinat harus berupa angka!"
        }), 400

    if not math.isfinite(latitude) or not math.isfinite(longitude):
        return jsonify({
            "pesan": "Koordinat harus berupa angka yang valid!"
        }), 400

    if not (-90 <= latitude <= 90):
        return jsonify({
            "pesan": "Latitude tidak valid!"
        }), 400

    if not (-180 <= longitude <= 180):
        return jsonify({
            "pesan": "Longitude tidak valid!"
        }), 400

    # Memeriksa format foto
    foto = data.get("foto")

    if foto is not None and not isinstance(foto, str):
        return jsonify({
            "pesan": "Format foto tidak valid!"
        }), 400

    koneksi = koneksi_database()
    cursor = koneksi.cursor()

    try:
        cursor.execute("""
            INSERT INTO laporan (
                nomor, kategori, lokasi, latitude,
                longitude, deskripsi, foto, tanggal, status
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            data.get("nomor"),
            data.get("kategori"),
            data.get("lokasi"),
            data.get("latitude"),
            data.get("longitude"),
            data.get("deskripsi"),
            data.get("foto"),
            data.get("tanggal"),
            data.get("status", "Menunggu Penanganan")
        ))

        koneksi.commit()

        print("LOKASI DATABASE:", os.path.abspath("peduliin.db"))
        print("NOMOR TERSIMPAN:", data.get("nomor"))

        return jsonify({
            "pesan": "Laporan berhasil disimpan!"
        }), 201

    except sqlite3.IntegrityError:
        return jsonify({
            "pesan": "Nomor laporan sudah digunakan!"
        }), 409

    finally:
        koneksi.close()
@app.route("/api/laporan/sinkron", methods=["POST"])
def sinkron_laporan():

    data = request.get_json()

    if not data:
        return jsonify({"pesan": "Data tidak ditemukan!"}), 400
    
    # Memeriksa kategori laporan
    kategori_valid = [
        "Sampah Berserakan",
        "Saluran Air Tersumbat",
        "Fasilitas Rusak",
        "Penghijauan",
        "Lainnya"
    ]

    if data.get("kategori") not in kategori_valid:
        return jsonify({
            "pesan": "Kategori laporan tidak valid!"
        }), 400
        
    # Memeriksa format foto
    foto = data.get("foto")

    if foto is not None and not isinstance(foto, str):
        return jsonify({
            "pesan": "Format foto tidak valid!"
        }), 400

    koneksi = koneksi_database()
    cursor = koneksi.cursor()

    try:
        cursor.execute("""
            INSERT OR IGNORE INTO laporan (
                nomor, kategori, lokasi, latitude,
                longitude, deskripsi, foto, tanggal, status
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            data.get("nomor"),
            data.get("kategori"),
            data.get("lokasi"),
            data.get("latitude"),
            data.get("longitude"),
            data.get("deskripsi"),
            data.get("foto"),
            data.get("tanggal"),
            data.get("status", "Menunggu Penanganan")
        ))

        koneksi.commit()

        return jsonify({"pesan": "Sinkronisasi selesai!"}), 200

    finally:
        koneksi.close()
        
@app.route("/api/laporan/<nomor>", methods=["PUT"])
@admin_required
def edit_laporan(nomor):

    data = request.get_json()

    if not data:
        return jsonify({
            "pesan": "Data laporan tidak ditemukan!"
        }), 400

    # Memeriksa kategori laporan
    kategori_valid = [
        "Sampah Berserakan",
        "Saluran Air Tersumbat",
        "Fasilitas Rusak",
        "Penghijauan",
        "Lainnya"
    ]

    if data.get("kategori") not in kategori_valid:
        return jsonify({
            "pesan": "Kategori laporan tidak valid!"
        }), 400
        
    # Memeriksa format foto
    foto = data.get("foto")

    if foto is not None and not isinstance(foto, str):
        return jsonify({
            "pesan": "Format foto tidak valid!"
        }), 400

    koneksi = koneksi_database()
    cursor = koneksi.cursor()

    cursor.execute("""
        UPDATE laporan
        SET kategori = ?,
            lokasi = ?,
            latitude = ?,
            longitude = ?,
            deskripsi = ?,
            foto = ?
        WHERE nomor = ?
    """, (
        data.get("kategori"),
        data.get("lokasi"),
        data.get("latitude"),
        data.get("longitude"),
        data.get("deskripsi"),
        data.get("foto"),
        nomor
    ))

    koneksi.commit()
    jumlah = cursor.rowcount
    koneksi.close()

    if jumlah == 0:
        return jsonify({
            "pesan": "Laporan tidak ditemukan!"
        }), 404

    return jsonify({
        "pesan": "Laporan berhasil diperbarui!"
    }), 200
        
@app.route("/api/laporan/<nomor>/status", methods=["PUT"])
@admin_required
def ubah_status_laporan(nomor):

    data = request.get_json()

    if not data or not data.get("status"):
        return jsonify({
            "pesan": "Status wajib diisi!"
        }), 400
        
    # Memeriksa status laporan
    status_valid = [
        "Menunggu Penanganan",
        "Sedang Diproses",
        "Selesai"
    ]

    if data.get("status") not in status_valid:
        return jsonify({
            "pesan": "Status laporan tidak valid!"
        }), 400

    koneksi = koneksi_database()
    cursor = koneksi.cursor()

    cursor.execute("""
        UPDATE laporan
        SET status = ?
        WHERE nomor = ?
    """, (
        data.get("status"),
        nomor
    ))

    koneksi.commit()

    jumlah = cursor.rowcount

    koneksi.close()

    if jumlah == 0:
        return jsonify({
            "pesan": "Laporan tidak ditemukan!"
        }), 404

    return jsonify({
        "pesan": "Status laporan berhasil diperbarui!"
    }), 200
        
@app.route("/api/laporan/<nomor>", methods=["DELETE"])
@admin_required
def hapus_laporan(nomor):

    koneksi = koneksi_database()
    cursor = koneksi.cursor()

    cursor.execute(
        "DELETE FROM laporan WHERE nomor = ?",
        (nomor,)
    )

    koneksi.commit()

    jumlah = cursor.rowcount

    koneksi.close()

    if jumlah == 0:
        return jsonify({
            "pesan": "Laporan tidak ditemukan!"
        }), 404

    return jsonify({
        "pesan": "Laporan berhasil dihapus dari database!"
    }), 200


if __name__ == "__main__":
    app.run(debug=True)