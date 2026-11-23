import requests

data_laporan = {
    "nomor": "PDL-TEST-001",
    "kategori": "sampah",
    "lokasi": "Halaman Sekolah",
    "latitude": -8.095,
    "longitude": 112.165,
    "deskripsi": "Terdapat sampah berserakan di halaman sekolah.",
    "foto": None,
    "tanggal": "2026-11-22",
    "status": "Menunggu"
}

respon = requests.post(
    "http://127.0.0.1:5000/api/laporan",
    json=data_laporan
)

print("Status:", respon.status_code)
print("Hasil:", respon.json())