
const form = document.getElementById("reportForm");
const inputFoto = document.getElementById("foto");
const daftarLaporan = document.getElementById("daftar-laporan");

let semuaLaporan = JSON.parse(localStorage.getItem("laporanPEDULIIN")) || [];
let latitudeTerpilih = null;
let longitudeTerpilih = null;

let latitudeEdit = null;
let longitudeEdit = null;
let penandaEdit = null;
let petaEditLokasi = null;
function sinkronkanLaporanLama() {

    semuaLaporan.forEach(function(data) {

        // Menyesuaikan kategori laporan lama
if (data.kategori === "sampah") {
    data.kategori = "Sampah Berserakan";
}

        fetch("http://127.0.0.1:5000/api/laporan/sinkron", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        })
        .then(function(response) {
    return response.json().then(function(hasil) {
        if (!response.ok) {
            throw new Error(hasil.pesan || "Gagal menyinkronkan laporan.");
        }

        return hasil;
    });
})
        .then(function(hasil) {
            console.log("Sinkronisasi:", data.nomor, hasil.pesan);
        })
        .catch(function(error) {
            console.error("Gagal sinkron:", data.nomor, error);
        });

    });

localStorage.setItem(
    "laporanPEDULIIN",
    JSON.stringify(semuaLaporan)
);

}
function ambilLaporanDariDatabase() {
    fetch("http://127.0.0.1:5000/api/laporan")
        .then(function(response) {
    return response.json().then(function(hasil) {
        if (!response.ok) {
            throw new Error(hasil.pesan || "Gagal menyinkronkan laporan.");
        }

        return hasil;
    });
})
        .then(function(dataDatabase) {
    console.log("Laporan dari database:", dataDatabase);

    dataDatabase.forEach(function(data) {
        const sudahAda = semuaLaporan.some(function(laporan) {
            return laporan.nomor === data.nomor;
        });

        if (!sudahAda) {
            semuaLaporan.push(data);
        }
    });

    localStorage.setItem(
        "laporanPEDULIIN",
        JSON.stringify(semuaLaporan)
    );

    console.log("Total laporan setelah digabung:", semuaLaporan.length);

// Mengosongkan tampilan sebelum membuat ulang kartu
// Mengambil elemen daftar laporan
const daftarLaporan = document.getElementById("daftar-laporan");
const kelolaLaporan = document.getElementById("kelola-laporan");

// Mengosongkan tampilan sebelum membuat ulang kartu
if (daftarLaporan) {
    daftarLaporan.innerHTML = "";
}

if (kelolaLaporan) {
    kelolaLaporan.innerHTML = "";
}

tampilkanLaporanTersimpan();
perbaruiDashboard();
tampilkanPenandaLaporan();
}) 
        .catch(function(error) {
            console.error("Gagal mengambil laporan:", error);
        });
}
let nomorLaporanEdit = null;

// Fungsi kompresi foto otomatis
function kompresFoto(file) {
    return new Promise(function(resolve, reject) {
        const gambar = new Image();
        const urlFoto = URL.createObjectURL(file);

        gambar.onload = function() {
            const canvas = document.createElement("canvas");

            const batasUkuran = 1200;
            let lebar = gambar.width;
            let tinggi = gambar.height;

            if (lebar > batasUkuran || tinggi > batasUkuran) {
                const skala = batasUkuran / Math.max(lebar, tinggi);

                lebar = Math.round(lebar * skala);
                tinggi = Math.round(tinggi * skala);
            }

            canvas.width = lebar;
            canvas.height = tinggi;

            const konteks = canvas.getContext("2d");

            konteks.fillStyle = "#ffffff";
            konteks.fillRect(0, 0, lebar, tinggi);

            konteks.drawImage(gambar, 0, 0, lebar, tinggi);

            const fotoKompres = canvas.toDataURL("image/jpeg", 0.7);
            const ukuranAsli = (file.size / 1024).toFixed(2);
const ukuranKompres = (fotoKompres.length * 0.75 / 1024).toFixed(2);

console.log("Ukuran foto asli: " + ukuranAsli + " KB");
console.log("Ukuran foto setelah kompresi: " + ukuranKompres + " KB");

            URL.revokeObjectURL(urlFoto);

            resolve(fotoKompres);
        };

        gambar.onerror = function() {
            URL.revokeObjectURL(urlFoto);
            reject(new Error("Foto gagal diproses."));
        };

        gambar.src = urlFoto;
    });
}

const pratinjauFoto = document.getElementById("pratinjau-foto");

inputFoto.addEventListener("change", function() {
    pratinjauFoto.innerHTML = "";

    if (inputFoto.files.length > 0) {
        const fileFoto = inputFoto.files[0];
        // Membatasi ukuran foto maksimal 5 MB
        const batasUkuran = 5 * 1024 * 1024;

if (fileFoto.size > batasUkuran) {
    alert("Ukuran foto terlalu besar. Maksimal 5 MB.");
    inputFoto.value = "";
    pratinjauFoto.innerHTML = "";
    return;
}

        if (!fileFoto.type.startsWith("image/")) {
            alert("Silakan pilih file gambar.");
            inputFoto.value = "";
            return;
        }

        const gambar = document.createElement("img");
        gambar.src = URL.createObjectURL(fileFoto);
        gambar.style.width = "200px";
        gambar.style.marginTop = "10px";
        gambar.style.borderRadius = "10px";

        pratinjauFoto.appendChild(gambar);

        console.log("Foto dipilih:", fileFoto.name);
    }
});

form.addEventListener("submit", function(event) {
    event.preventDefault();
        // Memastikan lokasi sudah dipilih pada peta
    if (
        latitudeTerpilih === null ||
        longitudeTerpilih === null
    ) {
        alert("Silakan pilih titik lokasi pada peta terlebih dahulu!");
        return;
    }


    // Mengambil data dari formulir
    const kategori = document.getElementById("kategori").value;
    const lokasi = document.getElementById("lokasi").value;
    const deskripsi = document.getElementById("deskripsi").value;
    const fileFoto = inputFoto.files[0];
    // Memeriksa kategori
if (kategori.trim() === "") {
    alert("Silakan pilih kategori laporan!");
    return;
}

// Memeriksa lokasi
if (lokasi.trim() === "") {
    alert("Silakan isi lokasi laporan!");
    return;
}

// Memeriksa deskripsi
if (deskripsi.trim() === "") {
    alert("Silakan isi deskripsi laporan!");
    return;
}
    if (fileFoto && fileFoto.size > 5 * 1024 * 1024) {
    alert("Ukuran foto terlalu besar. Maksimal 5 MB.");
    return;
}

    let fotoBase64 = "";

    // Membuat fungsi penyimpanan laporan
    function simpanLaporan(fotoBase64) {

        // Menghapus pesan jika belum ada laporan
        const pesanKosong = document.getElementById("pesan-kosong");
        if (pesanKosong) {
            pesanKosong.remove();
        }

        // Membuat nomor laporan otomatis
        const nomorLaporan = "PDL-" + Date.now();

        // Menyimpan data laporan
        const dataLaporan = {
            nomor: nomorLaporan,
            kategori: kategori,
            lokasi: lokasi,
            latitude: latitudeTerpilih,
            longitude: longitudeTerpilih,
            deskripsi: deskripsi,
            foto: fotoBase64,
            tanggal: new Date().toLocaleString("id-ID"),
            status: "Menunggu Penanganan"
        };
        // Mengirim laporan ke database Flask
fetch("http://127.0.0.1:5000/api/laporan", {
    method: "POST",
    headers: {
        "Content-Type": "application/json"
    },
    body: JSON.stringify(dataLaporan)
})
.then(function(response) {
    return response.json().then(function(hasil) {
        if (!response.ok) {
            throw new Error(hasil.pesan || "Gagal memperbarui status database.");
        }

        return hasil;
    });
})
.then(function(hasil) {
    console.log("Database:", hasil.pesan);
})
.catch(function(error) {
    console.error("Koneksi database gagal:", error);
});

        semuaLaporan.push(dataLaporan);

    

localStorage.setItem(
    "laporanPEDULIIN",
    JSON.stringify(semuaLaporan)
);
perbaruiPenyimpanan();
perbaruiDashboard();
tampilkanPenandaLaporan();

    // Membuat tampilan laporan baru
    const laporan = document.createElement("div");
    laporan.className = "kartu-laporan";
    const nomor = document.createElement("p");
    nomor.textContent = "Nomor Laporan: " + nomorLaporan;

    const judul = document.createElement("h3");
    judul.textContent = kategori;

    const tempat = document.createElement("p");
    tempat.textContent = "Lokasi: " + lokasi;

    const isi = document.createElement("p");
    isi.textContent = "Deskripsi: " + deskripsi;

    const status = document.createElement("p");
    status.textContent = "Status: Menunggu Penanganan";

    laporan.appendChild(nomor);
    laporan.appendChild(judul);
    laporan.appendChild(tempat);
    laporan.appendChild(isi);
    // Menampilkan foto bukti laporan
if (fotoBase64) {
    const gambar = document.createElement("img");

    gambar.src = fotoBase64;
    gambar.alt = "Foto bukti laporan";

    gambar.style.width = "200px";
    gambar.style.marginTop = "10px";
    gambar.style.borderRadius = "10px";
    gambar.style.cursor = "pointer";

    gambar.addEventListener("click", function() {
        const tabFoto = window.open();

        if (tabFoto) {
            tabFoto.document.write(
                '<!DOCTYPE html><html><head><title>Foto Laporan</title></head><body style="margin:0; display:flex; justify-content:center; align-items:center; min-height:100vh; background:#eeeeee;"><img src="' + fotoBase64 + '" style="max-width:95vw; max-height:90vh; object-fit:contain;"></body></html>'
            );
        }
    });

    laporan.appendChild(gambar);
}


    laporan.appendChild(status);

    daftarLaporan.appendChild(laporan);


// Mengambil area Panel Admin
const kelolaLaporan = document.getElementById("kelola-laporan");

// Menghapus pesan jika belum ada laporan
if (kelolaLaporan.querySelector("p")) {
    kelolaLaporan.innerHTML = "";
}

// Membuat kartu pengelolaan
const adminCard = document.createElement("div");
adminCard.className = "kartu-laporan";
adminCard.dataset.status = dataLaporan.status;

const infoNomor = document.createElement("p");
infoNomor.textContent = "Kelola: " + nomorLaporan;

const infoTanggal = document.createElement("p");
infoTanggal.textContent = "Tanggal: " + dataLaporan.tanggal;

// Informasi kategori
const infoKategori = document.createElement("p");
infoKategori.textContent = "Kategori: " + dataLaporan.kategori;

// Informasi lokasi
const infoLokasi = document.createElement("p");
infoLokasi.textContent = "Lokasi: " + dataLaporan.lokasi;

// Informasi deskripsi
const infoDeskripsi = document.createElement("p");
infoDeskripsi.textContent = "Deskripsi: " + dataLaporan.deskripsi;

// Informasi koordinat
const infoKoordinat = document.createElement("p");
infoKoordinat.textContent =
    "Koordinat: " +
    (dataLaporan.latitude ?? "Belum tersedia") +
    ", " +
    (dataLaporan.longitude ?? "Belum tersedia");

    const infoStatus = document.createElement("p");
infoStatus.textContent = "Status: " + dataLaporan.status;

function perbaruiWarnaStatus() {
    infoStatus.className = "";

    if (dataLaporan.status === "Menunggu Penanganan") {
        infoStatus.classList.add("status-menunggu");
    } else if (dataLaporan.status === "Sedang Diproses") {
        infoStatus.classList.add("status-diproses");
    } else if (dataLaporan.status === "Selesai") {
        infoStatus.classList.add("status-selesai");
    }
}

perbaruiWarnaStatus();

// Membuat pilihan status
const pilihanStatus = document.createElement("select");

const pilihan = [
    "Menunggu Penanganan",
    "Sedang Diproses",
    "Selesai"
];

pilihan.forEach(function(namaStatus) {
    const opsi = document.createElement("option");
    opsi.value = namaStatus;
    opsi.textContent = namaStatus;
    pilihanStatus.appendChild(opsi);
});

// Mengubah status pada kartu laporan

// Menampilkan foto bukti laporan
if (dataLaporan.foto) {
    const fotoAdmin = document.createElement("img");

    fotoAdmin.src = dataLaporan.foto;
    fotoAdmin.alt = "Foto bukti laporan";
    fotoAdmin.style.width = "200px";
    fotoAdmin.style.borderRadius = "10px";
    fotoAdmin.style.marginTop = "10px";

    adminCard.appendChild(fotoAdmin);
} 
// Menampilkan kartu admin
adminCard.appendChild(infoNomor);
adminCard.appendChild(infoKategori);
adminCard.appendChild(infoLokasi);
adminCard.appendChild(infoTanggal);
adminCard.appendChild(infoDeskripsi);
adminCard.appendChild(infoKoordinat);
adminCard.appendChild(infoStatus);
adminCard.appendChild(pilihanStatus);

kelolaLaporan.appendChild(adminCard);


    alert("Laporan berhasil ditampilkan!");

    form.reset();
    pratinjauFoto.innerHTML = "";
    }
    // Membaca foto sebelum menyimpan laporan

if (fileFoto) {
    kompresFoto(fileFoto)
        .then(function(fotoKompres) {
            simpanLaporan(fotoKompres);
        })
        .catch(function(error) {
            alert("Foto gagal diproses. Silakan coba lagi.");
            console.error(error);
        });
} else {
    simpanLaporan("");
}

  });


function tampilkanLaporanTersimpan() {

    const namaKategori = {
        sampah: "Sampah Berserakan",
        saluran: "Saluran Air Tersumbat",
        fasilitas: "Fasilitas Rusak",
        penghijauan: "Penghijauan",
        lainnya: "Lainnya"
    };

    const daftarLaporan = document.getElementById("daftar-laporan");

const kelolaLaporan = document.getElementById("kelola-laporan");

daftarLaporan.innerHTML = "";
kelolaLaporan.innerHTML = "";

    semuaLaporan.forEach(function(data) {
        const laporan = document.createElement("div");
        laporan.className = "kartu-laporan";

        const nomor = document.createElement("p");
        nomor.textContent = "Nomor Laporan: " + data.nomor;

        const judul = document.createElement("h3");

judul.textContent =
    namaKategori[String(data.kategori).toLowerCase()] ||
    data.kategori;

        const lokasi = document.createElement("p");
        lokasi.textContent = "Lokasi: " + data.lokasi;

        const tanggal = document.createElement("p");
tanggal.textContent = "Tanggal: " + (data.tanggal || "Tidak tersedia");

        const deskripsi = document.createElement("p");
        deskripsi.textContent = "Deskripsi: " + data.deskripsi;

        const koordinat = document.createElement("p");
koordinat.textContent =
    "Koordinat: " +
    (data.latitude ?? "Belum tersedia") +
    ", " +
    (data.longitude ?? "Belum tersedia");

        const status = document.createElement("p");
        status.textContent = "Status: " + data.status;

        laporan.appendChild(nomor);
        laporan.appendChild(judul);
        laporan.appendChild(lokasi);
        laporan.appendChild(tanggal);
        laporan.appendChild(deskripsi);
        laporan.appendChild(koordinat);

if (data.foto) {
    const gambar = document.createElement("img");

    gambar.src = data.foto;
    gambar.alt = "Foto bukti laporan";

    gambar.style.width = "200px";
    gambar.style.marginTop = "10px";
    gambar.style.borderRadius = "10px";
    gambar.style.cursor = "pointer";

    gambar.addEventListener("click", function() {
        const tabFoto = window.open();

        if (tabFoto) {
            tabFoto.document.write(
                '<!DOCTYPE html><html><head><title>Foto Laporan</title></head><body style="margin:0; display:flex; justify-content:center; align-items:center; min-height:100vh; background:#eeeeee;"><img src="' + data.foto + '" style="max-width:95vw; max-height:90vh; object-fit:contain;"></body></html>'
            );
        }
    });

    laporan.appendChild(gambar);
}

        laporan.appendChild(status);

        const tombolDetail = document.createElement("button");

tombolDetail.textContent = "Lihat Detail";
tombolDetail.className = "tombol-detail";

tombolDetail.addEventListener("click", function() {
    const popup = document.getElementById("detail-popup");
    const isiDetail = document.getElementById("isi-detail");

    isiDetail.innerHTML = "";

    function tambahInfo(label, nilai) {
        const paragraf = document.createElement("p");
        paragraf.textContent = label + ": " + (nilai || "Tidak tersedia");
        isiDetail.appendChild(paragraf);
    }

    tambahInfo("Nomor Laporan", data.nomor);
    tambahInfo("Kategori", data.kategori);
    tambahInfo("Lokasi", data.lokasi);
    tambahInfo("Deskripsi", data.deskripsi);
    tambahInfo("Tanggal", data.tanggal);
    tambahInfo("Status", data.status);

    if (data.foto) {
        const fotoDetail = document.createElement("img");
        fotoDetail.src = data.foto;
        fotoDetail.alt = "Foto bukti laporan";
        isiDetail.appendChild(fotoDetail);
    }

    popup.style.display = "flex";
});

laporan.appendChild(tombolDetail);

        daftarLaporan.appendChild(laporan);



const adminCard = document.createElement("div");
adminCard.className = "kartu-laporan";
adminCard.dataset.status = data.status;

const nomorAdmin = document.createElement("p");
nomorAdmin.textContent = "Kelola: " + data.nomor;

const infoTanggal = document.createElement("p");
infoTanggal.textContent = "Tanggal: " + (data.tanggal || "Tidak tersedia");

const infoKategori = document.createElement("p");

infoKategori.textContent =
    "Kategori: " +
    (namaKategori[String(data.kategori).toLowerCase()] || data.kategori);

const infoDeskripsi = document.createElement("p");
infoDeskripsi.textContent = "Deskripsi: " + data.deskripsi;

const infoStatus = document.createElement("p");
infoStatus.textContent = "Status: " + data.status;

const infoKoordinat = document.createElement("p");
infoKoordinat.textContent =
    "Koordinat: " +
    (data.latitude ?? "Belum tersedia") +
    ", " +
    (data.longitude ?? "Belum tersedia");

const infoLokasi = document.createElement("p");
infoLokasi.textContent = "Lokasi: " + data.lokasi;

// Menyiapkan foto Panel Admin
let fotoAdmin = null;

if (data.foto) {
    fotoAdmin = document.createElement("img");

    fotoAdmin.src = data.foto;
    fotoAdmin.alt = "Foto bukti laporan";

    fotoAdmin.style.width = "150px";
fotoAdmin.style.height = "120px";
fotoAdmin.style.objectFit = "contain";
fotoAdmin.style.backgroundColor = "#eeeeee";
fotoAdmin.style.marginTop = "10px";
fotoAdmin.style.borderRadius = "10px";
    fotoAdmin.style.cursor = "pointer";

fotoAdmin.addEventListener("click", function() {
    const tabFoto = window.open();

    if (tabFoto) {
        tabFoto.document.write(
            '<img src="' + data.foto + '" style="max-width:95vw; max-height:90vh; width:auto; height:auto; object-fit:contain;">'
        );
    }
});
}

const pilihanStatus = document.createElement("select");

const daftarStatus = [
    "Menunggu Penanganan",
    "Sedang Diproses",
    "Selesai"
];

daftarStatus.forEach(function(namaStatus) {
    const opsi = document.createElement("option");
    opsi.value = namaStatus;
    opsi.textContent = namaStatus;
    pilihanStatus.appendChild(opsi);
});

pilihanStatus.value = data.status;

infoStatus.className = "";

function perbaruiWarnaStatusAdmin() {
    infoStatus.className = "";

    if (data.status === "Menunggu Penanganan") {
        infoStatus.classList.add("status-menunggu");
    } else if (data.status === "Sedang Diproses") {
        infoStatus.classList.add("status-diproses");
    } else if (data.status === "Selesai") {
        infoStatus.classList.add("status-selesai");
    }
}

perbaruiWarnaStatusAdmin();


adminCard.appendChild(nomorAdmin);
adminCard.appendChild(infoKategori);
adminCard.appendChild(infoLokasi);
adminCard.appendChild(infoTanggal);
adminCard.appendChild(infoDeskripsi);
adminCard.appendChild(infoKoordinat);
adminCard.appendChild(infoStatus);

if (fotoAdmin) {
    adminCard.appendChild(fotoAdmin);
}

adminCard.appendChild(pilihanStatus);

pilihanStatus.addEventListener("change", function() {

    const statusLama = data.status;
    const statusBaru = pilihanStatus.value;

    pilihanStatus.disabled = true;

    console.log("Mengirim perubahan status...");
    console.log("Nomor laporan:", data.nomor);
    console.log("Status baru:", statusBaru);

    fetch("http://127.0.0.1:5000/api/laporan/" + encodeURIComponent(data.nomor) + "/status", {
    method: "PUT",
    credentials: "include",
    headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            status: statusBaru
        })
    })
    .then(function(response) {
        if (!response.ok) {
            throw new Error("Gagal memperbarui status database.");
        }
        return response.json();
    })
    .then(function(hasil) {

        console.log("Database:", hasil.pesan);

        data.status = statusBaru;
        adminCard.dataset.status = statusBaru;
        infoStatus.textContent = "Status: " + statusBaru;

        perbaruiWarnaStatusAdmin();

        localStorage.setItem(
            "laporanPEDULIIN",
            JSON.stringify(semuaLaporan)
        );

        perbaruiDashboard();
        terapkanFilterAdmin();

    })
    .catch(function(error) {
        console.error("Gagal mengubah status:", error);
        pilihanStatus.value = statusLama;
        alert("Status gagal diperbarui.");
    })
    .finally(function() {
        pilihanStatus.disabled = false;
    });

});

const tombolHapus = document.createElement("button");
tombolHapus.textContent = "Hapus Laporan";
tombolHapus.className = "tombol-hapus";

tombolHapus.addEventListener("click", function() {
    const yakin = confirm("Apakah kamu yakin ingin menghapus laporan ini?");

    if (!yakin) {
        return;
    }

    fetch("http://127.0.0.1:5000/api/laporan/" + encodeURIComponent(data.nomor), {
    method: "DELETE",
    credentials: "include"
})
    .then(function(response) {
        if (!response.ok) {
            throw new Error("Gagal menghapus laporan dari database.");
        }

        return response.json();
    })
    .then(function(hasil) {
        console.log("Database:", hasil.pesan);

        semuaLaporan = semuaLaporan.filter(function(item) {
            return item.nomor !== data.nomor;
        });

        localStorage.setItem(
            "laporanPEDULIIN",
            JSON.stringify(semuaLaporan)
        );

        perbaruiPenyimpanan();

daftarLaporan.innerHTML = "";
kelolaLaporan.innerHTML = "";

tampilkanLaporanTersimpan();
perbaruiDashboard();
tampilkanPenandaLaporan();

        alert("Laporan berhasil dihapus!");
    })
    .catch(function(error) {
        console.error("Gagal menghapus laporan:", error);
        alert("Laporan gagal dihapus. Data tetap dipertahankan.");
    });
});

const tombolEdit = document.createElement("button");
tombolEdit.textContent = "Edit Laporan";
tombolEdit.className = "tombol-edit";

tombolEdit.addEventListener("click", function() {
    nomorLaporanEdit = data.nomor;
    const popupEdit = document.getElementById("edit-popup");

    const daftarKategori = {
    "sampah": "Sampah Berserakan",
    "saluran": "Saluran Air Tersumbat",
    "fasilitas": "Fasilitas Rusak",
    "penghijauan": "Penghijauan",
    "lainnya": "Lainnya"
};

document.getElementById("edit-kategori").value =
    daftarKategori[data.kategori] || data.kategori;
    document.getElementById("edit-lokasi").value = data.lokasi;
    document.getElementById("edit-deskripsi").value = data.deskripsi;
    // Mengambil koordinat lokasi lama
latitudeEdit = data.latitude;
longitudeEdit = data.longitude;

// Menghapus penanda sebelumnya
if (penandaEdit) {
    petaEditLokasi.removeLayer(penandaEdit);
    penandaEdit = null;
}

// Menampilkan penanda lokasi lama
if (
    Number.isFinite(latitudeEdit) &&
    Number.isFinite(longitudeEdit)
) {
    penandaEdit = L.marker([
        latitudeEdit,
        longitudeEdit
    ]).addTo(petaEditLokasi);

    petaEditLokasi.setView(
        [latitudeEdit, longitudeEdit],
        17
    );

    document.getElementById("koordinat-edit-terpilih").textContent =
        "Koordinat terpilih: " +
        latitudeEdit.toFixed(6) + ", " +
        longitudeEdit.toFixed(6);
} else {
    document.getElementById("koordinat-edit-terpilih").textContent =
        "Pilih titik lokasi pada peta";
}

    document.getElementById("edit-foto").value = "";
    document.getElementById("pratinjau-edit-foto").innerHTML = "";

    // Menampilkan foto lama jika tersedia
    if (data.foto) {
        const fotoLama = document.createElement("img");
        fotoLama.src = data.foto;
        fotoLama.alt = "Foto laporan saat ini";

        document.getElementById("pratinjau-edit-foto")
            .appendChild(fotoLama);
    }

    popupEdit.style.display = "flex";
    setTimeout(function() {
    petaEditLokasi.invalidateSize();
}, 300);
});

adminCard.appendChild(tombolEdit);

adminCard.appendChild(tombolHapus);

kelolaLaporan.appendChild(adminCard);

    });

    const pesanKosong = document.getElementById("pesan-kosong");

    if (semuaLaporan.length > 0 && pesanKosong) {
        pesanKosong.remove();
    }
}

tampilkanLaporanTersimpan();

perbaruiDashboard();

function perbaruiDashboard() {

    // MENGHITUNG TOTAL LAPORAN
    const total = semuaLaporan.length;

    // MENGHITUNG BERDASARKAN STATUS
    const menunggu = semuaLaporan.filter(function(data) {
        return data.status === "Menunggu Penanganan";
    }).length;

    const diproses = semuaLaporan.filter(function(data) {
        return data.status === "Sedang Diproses";
    }).length;

    const selesai = semuaLaporan.filter(function(data) {
        return data.status === "Selesai";
    }).length;

    // MEMPERBARUI KARTU DASHBOARD
    document.getElementById("total-laporan").textContent = total;
    document.getElementById("total-menunggu").textContent = menunggu;
    document.getElementById("total-diproses").textContent = diproses;
    document.getElementById("total-selesai").textContent = selesai;


    // FUNGSI MEMBUAT BARIS TABEL
    function tambahBaris(tabel, nilai) {
        const baris = document.createElement("tr");

        nilai.forEach(function(teks) {
            const kolom = document.createElement("td");
            kolom.textContent = teks;
            baris.appendChild(kolom);
        });

        tabel.appendChild(baris);
    }

    function formatPersentase(jumlah) {
        if (total === 0) {
            return "0%";
        }

        return ((jumlah / total) * 100)
            .toFixed(1)
            .replace(".", ",") + "%";
    }


    // 1. REKAPITULASI KATEGORI
    const tabelKategori = document.getElementById("tabel-kategori");

    if (tabelKategori) {
        tabelKategori.innerHTML = "";

        const daftarKategori = {
            "sampah": "Sampah Berserakan",
            "saluran": "Saluran Air Tersumbat",
            "fasilitas": "Fasilitas Rusak",
            "penghijauan": "Penghijauan",
            "lainnya": "Lainnya"
        };

        const jumlahKategori = {};

        semuaLaporan.forEach(function(data) {
            const kategoriAsli = String(data.kategori || "Lainnya").trim();
            const kunci = kategoriAsli.toLowerCase();

            const namaKategori =
                daftarKategori[kunci] || kategoriAsli;

            jumlahKategori[namaKategori] =
                (jumlahKategori[namaKategori] || 0) + 1;
        });

        Object.values(daftarKategori).forEach(function(nama) {
            const jumlah = jumlahKategori[nama] || 0;

            tambahBaris(tabelKategori, [
                nama,
                jumlah,
                formatPersentase(jumlah)
            ]);
        });

        Object.keys(jumlahKategori).forEach(function(nama) {
            if (!Object.values(daftarKategori).includes(nama)) {
                const jumlah = jumlahKategori[nama];

                tambahBaris(tabelKategori, [
                    nama,
                    jumlah,
                    formatPersentase(jumlah)
                ]);
            }
        });
    }


    // 2. PERKEMBANGAN PENANGANAN
    const tabelStatus = document.getElementById("tabel-status");

    if (tabelStatus) {
        tabelStatus.innerHTML = "";

        const daftarStatus = [
            "Menunggu Penanganan",
            "Sedang Diproses",
            "Selesai"
        ];

        daftarStatus.forEach(function(status) {
            const jumlah = semuaLaporan.filter(function(data) {
                return data.status === status;
            }).length;

            tambahBaris(tabelStatus, [
                status,
                jumlah,
                formatPersentase(jumlah)
            ]);
        });
    }


    // 3. ANALISIS PERSEBARAN LOKASI
    const tabelLokasi = document.getElementById("tabel-lokasi");

    if (tabelLokasi) {
        tabelLokasi.innerHTML = "";

        const jumlahLokasi = {};

        semuaLaporan.forEach(function(data) {
            const lokasi = String(
                data.lokasi || "Tidak diketahui"
            ).trim() || "Tidak diketahui";

            jumlahLokasi[lokasi] =
                (jumlahLokasi[lokasi] || 0) + 1;
        });

        const daftarLokasi = Object.entries(jumlahLokasi);

        daftarLokasi.sort(function(a, b) {
            return b[1] - a[1];
        });

        if (daftarLokasi.length === 0) {
            tambahBaris(tabelLokasi, [
                "Belum ada laporan",
                "0"
            ]);
        } else {
            daftarLokasi.forEach(function(item) {
                tambahBaris(tabelLokasi, [
                    item[0],
                    item[1]
                ]);
            });
        }
    }

}

function perbaruiPenyimpanan() {
    const dataPenyimpanan = localStorage.getItem("laporanPEDULIIN") || "";

    const ukuranKB = new Blob([dataPenyimpanan]).size / 1024;

    // Perkiraan batas localStorage sebesar 5 MB
    const batasKB = 5 * 1024;

    const persentase = Math.min(
        (ukuranKB / batasKB) * 100,
        100
    );

    document.getElementById("teks-penyimpanan").textContent =
        ukuranKB.toFixed(2) + " KB dari " + batasKB + " KB digunakan (" +
        persentase.toFixed(1) + "%)";

    document.getElementById("bar-penyimpanan").style.width =
        persentase + "%";
        const barPenyimpanan = document.getElementById("bar-penyimpanan");

if (persentase < 60) {
    barPenyimpanan.style.backgroundColor = "#16a36a";
} else if (persentase < 85) {
    barPenyimpanan.style.backgroundColor = "#e6a23c";
} else {
    barPenyimpanan.style.backgroundColor = "#dc3545";
}
}
// Menjalankan fungsi Dashboard
perbaruiDashboard();

const kolomPencarian = document.getElementById("cari-laporan");
const filterStatus = document.getElementById("filter-status");

function terapkanFilterAdmin() {
    const kataKunci = kolomPencarian.value.toLowerCase();
    const statusDipilih = filterStatus.value;

    const daftarKartu = document.querySelectorAll(
        "#kelola-laporan .kartu-laporan"
    );

    daftarKartu.forEach(function(kartu) {
        const isiLaporan = kartu.textContent.toLowerCase();

        const cocokPencarian = isiLaporan.includes(kataKunci);

        const cocokStatus =
    statusDipilih === "semua" ||
    kartu.dataset.status === statusDipilih;

        if (cocokPencarian && cocokStatus) {
            kartu.style.display = "";
        } else {
            kartu.style.display = "none";
        }
    });
}

kolomPencarian.addEventListener("input", terapkanFilterAdmin);
filterStatus.addEventListener("change", terapkanFilterAdmin);

const tombolCari = document.getElementById("tombol-cari");
const nomorPencarian = document.getElementById("nomor-pencarian");
const hasilPencarian = document.getElementById("hasil-pencarian");

tombolCari.addEventListener("click", function() {
    const nomorDicari = nomorPencarian.value.trim();

    // Memeriksa apakah kolom kosong
    if (nomorDicari === "") {
        hasilPencarian.textContent = "Masukkan nomor laporan terlebih dahulu.";
        return;
    }

    // Mencari laporan berdasarkan nomor
    const laporanDitemukan = semuaLaporan.find(function(data) {
        return data.nomor.toLowerCase() === nomorDicari.toLowerCase();
    });

    // Jika laporan ditemukan
    if (laporanDitemukan) {
        hasilPencarian.innerHTML = "";

        const kartu = document.createElement("div");
        kartu.className = "kartu-laporan";

        const nomor = document.createElement("p");
        nomor.textContent = "Nomor: " + laporanDitemukan.nomor;

        const kategori = document.createElement("h3");
        kategori.textContent = laporanDitemukan.kategori;

        const lokasi = document.createElement("p");
        lokasi.textContent = "Lokasi: " + laporanDitemukan.lokasi;

        const deskripsi = document.createElement("p");
deskripsi.textContent = "Deskripsi: " + laporanDitemukan.deskripsi;

        const tanggal = document.createElement("p");
        tanggal.textContent = "Tanggal: " + (laporanDitemukan.tanggal || "Belum tersedia");

        // Menampilkan foto laporan
if (laporanDitemukan.foto) {
    const foto = document.createElement("img");

    foto.src = laporanDitemukan.foto;
    foto.alt = "Foto laporan lingkungan";

    foto.style.width = "100%";
    foto.style.maxWidth = "350px";
    foto.style.height = "auto";
    foto.style.objectFit = "cover";
    foto.style.borderRadius = "10px";
    foto.style.marginTop = "10px";

    kartu.appendChild(foto);
}

        const status = document.createElement("p");
        status.textContent = "Status: " + laporanDitemukan.status;

        kartu.appendChild(nomor);
        kartu.appendChild(kategori);
        kartu.appendChild(lokasi);
        kartu.appendChild(deskripsi);
        kartu.appendChild(tanggal);
        kartu.appendChild(status);

        hasilPencarian.appendChild(kartu);

    } else {
        hasilPencarian.textContent = "Laporan tidak ditemukan. Periksa kembali nomor laporan.";
    }
});
const popupDetail = document.getElementById("detail-popup");
const tombolTutupDetail = document.getElementById("tutup-detail");

tombolTutupDetail.addEventListener("click", function() {
    popupDetail.style.display = "none";
});

popupDetail.addEventListener("click", function(event) {
    if (event.target === popupDetail) {
        popupDetail.style.display = "none";
    }
});
const formEdit = document.getElementById("form-edit");
const popupEdit = document.getElementById("edit-popup");
const tombolTutupEdit = document.getElementById("tutup-edit");
const kelolaLaporan = document.getElementById("kelola-laporan");

formEdit.addEventListener("submit", function(event) {
    event.preventDefault();

    if (latitudeEdit === null || longitudeEdit === null) {
        alert("Silakan pilih titik lokasi pada peta terlebih dahulu!");
        return;
    }

    const kategoriBaru = document.getElementById("edit-kategori").value;
    const lokasiBaru = document.getElementById("edit-lokasi").value;
    const deskripsiBaru = document.getElementById("edit-deskripsi").value;
    const fileFotoBaru = document.getElementById("edit-foto").files[0];

    // Memperbarui informasi laporan
    const laporanEdit = semuaLaporan.find(function(data) {
        return data.nomor === nomorLaporanEdit;
    });

    if (!laporanEdit) {
        alert("Laporan tidak ditemukan!");
        return;
    }

    laporanEdit.kategori = kategoriBaru;
    laporanEdit.lokasi = lokasiBaru;
    laporanEdit.deskripsi = deskripsiBaru;laporanEdit.kategori = kategoriBaru;
laporanEdit.lokasi = lokasiBaru;
laporanEdit.latitude = latitudeEdit;
laporanEdit.longitude = longitudeEdit;
laporanEdit.deskripsi = deskripsiBaru;

    function simpanPerubahan(fotoBaru) {

    const dataPerubahan = {
        kategori: kategoriBaru,
        lokasi: lokasiBaru,
        latitude: latitudeEdit,
        longitude: longitudeEdit,
        deskripsi: deskripsiBaru,
        foto: fotoBaru || laporanEdit.foto || ""
    };

    console.log("Mengirim perubahan laporan...");
    console.log("Nomor laporan:", nomorLaporanEdit);
    console.log("Koordinat baru:", latitudeEdit, longitudeEdit);
    console.log("Kategori yang dikirim:", dataPerubahan.kategori);


    fetch(
        "http://127.0.0.1:5000/api/laporan/" +
        encodeURIComponent(nomorLaporanEdit),
        {
            method: "PUT",
            credentials: "include",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(dataPerubahan)
        }
    )
    .then(function(response) {
        return response.json().then(function(hasil) {
            if (!response.ok) {
                throw new Error(hasil.pesan || "Gagal memperbarui laporan!");
            }

            return hasil;
        });
    })
    .then(function(hasil) {

        laporanEdit.kategori = kategoriBaru;
        laporanEdit.lokasi = lokasiBaru;
        laporanEdit.latitude = latitudeEdit;
        laporanEdit.longitude = longitudeEdit;
        laporanEdit.deskripsi = deskripsiBaru;
        laporanEdit.foto = dataPerubahan.foto;

        localStorage.setItem(
            "laporanPEDULIIN",
            JSON.stringify(semuaLaporan)
        );

        perbaruiPenyimpanan();

        daftarLaporan.innerHTML = "";
        kelolaLaporan.innerHTML = "";

        tampilkanLaporanTersimpan();
        perbaruiDashboard();
        tampilkanPenandaLaporan();

        popupEdit.style.display = "none";
        formEdit.reset();

        console.log("Berhasil diperbarui:", hasil.pesan);

        alert("Laporan berhasil diperbarui!");

    })
    .catch(function(error) {
        console.error("Gagal menyimpan perubahan:", error);
        alert("Gagal memperbarui laporan: " + error.message);
    });
}

    if (fileFotoBaru) {
    if (!fileFotoBaru.type.startsWith("image/")) {
        alert("Silakan pilih file gambar.");
        return;
    }

    kompresFoto(fileFotoBaru)
        .then(function(fotoKompres) {
            simpanPerubahan(fotoKompres);
        })
        .catch(function(error) {
            alert("Foto gagal diproses. Silakan coba lagi.");
            console.error(error);
        });

} else {
    simpanPerubahan("");
}
});
tombolTutupEdit.addEventListener("click", function() {
    popupEdit.style.display = "none";
});
popupEdit.addEventListener("click", function(event) {
    if (event.target === popupEdit) {
        popupEdit.style.display = "none";
    }
});
const inputEditFoto = document.getElementById("edit-foto");
const pratinjauEditFoto = document.getElementById("pratinjau-edit-foto");

inputEditFoto.addEventListener("change", function() {
    pratinjauEditFoto.innerHTML = "";

    const fileFoto = inputEditFoto.files[0];

    if (!fileFoto) return;

    if (!fileFoto.type.startsWith("image/")) {
        alert("Silakan pilih file gambar.");
        inputEditFoto.value = "";
        return;
    }

    const gambar = document.createElement("img");
    gambar.src = URL.createObjectURL(fileFoto);
    gambar.alt = "Pratinjau foto baru";

    pratinjauEditFoto.appendChild(gambar);
});
tampilkanLaporanTersimpan();
perbaruiDashboard();
perbaruiPenyimpanan();

const tombolEkspor = document.getElementById("ekspor-laporan");

tombolEkspor.addEventListener("click", function() {

    if (semuaLaporan.length === 0) {
        alert("Belum ada laporan untuk diunduh!");
        return;
    }

    const judulKolom = [
    "Nomor Laporan",
    "Kategori",
    "Lokasi",
    "Latitude",
    "Longitude",
    "Deskripsi",
    "Tanggal",
    "Status"
];

    const barisData = semuaLaporan.map(function(data) {
    return [
        data.nomor,
        data.kategori,
        data.lokasi,
        String(data.latitude).replace(".", ","),
        String(data.longitude).replace(".", ","),
        data.deskripsi,
        data.tanggal,
        data.status
    ];
    });

    const semuaBaris = [judulKolom, ...barisData];

    const isiCSV = semuaBaris.map(function(baris) {
    return baris.map(function(nilai) {
        return '"' + String(nilai || "").replace(/"/g, '""') + '"';
    }).join(";");
}).join("\r\n");
    const file = new Blob(
        ["\uFEFF" + isiCSV],
        { type: "text/csv;charset=utf-8;" }
    );

    const alamatFile = URL.createObjectURL(file);

    const linkUnduh = document.createElement("a");
    linkUnduh.href = alamatFile;
    linkUnduh.download = "Data-Laporan-PEDULIIN.csv";

    linkUnduh.click();

    URL.revokeObjectURL(alamatFile);

    alert("Data laporan berhasil diunduh!");
});
// Membuat peta PEDULIIN
const petaLaporan = L.map("peta-laporan").setView(
    [-8.1007833, 112.1807783],
    17
);
// Menyimpan semua penanda laporan pada peta
const penandaLaporan = L.layerGroup().addTo(petaLaporan);
// Menampilkan penanda dari laporan yang memiliki koordinat
function tampilkanPenandaLaporan() {

    console.log("Data laporan:", semuaLaporan);

    penandaLaporan.clearLayers();

    semuaLaporan.forEach(function(data) {

const filterKategoriPeta =
    document.getElementById("filter-kategori-peta");

const kategoriDipilih = filterKategoriPeta
    ? filterKategoriPeta.value.toLowerCase().trim()
    : "semua";

const kategoriLaporan = String(data.kategori)
    .toLowerCase()
    .trim();

const daftarKategori = {
    sampah: "sampah berserakan",
    saluran: "saluran air tersumbat",
    fasilitas: "fasilitas rusak",
    penghijauan: "penghijauan",
    lainnya: "lainnya"
};

if (
    kategoriDipilih !== "semua" &&
    kategoriLaporan !== daftarKategori[kategoriDipilih] &&
    kategoriLaporan !== kategoriDipilih
) {
    return;
}

        if (
            typeof data.latitude !== "number" ||
            typeof data.longitude !== "number"
        ) {
            return;
        }

        const isiPopup = document.createElement("div");

        const judul = document.createElement("strong");
        judul.textContent = "Laporan Lingkungan";

        const lokasi = document.createElement("p");
        lokasi.textContent = "Lokasi: " + data.lokasi;

        const status = document.createElement("p");
        status.textContent = "Status: " + data.status;

        const nomor = document.createElement("p");
nomor.textContent = "Nomor: " + data.nomor;

const kategori = document.createElement("p");
kategori.textContent = "Kategori: " + data.kategori;

const deskripsi = document.createElement("p");
deskripsi.textContent = "Deskripsi: " + data.deskripsi;

const koordinat = document.createElement("p");
koordinat.textContent =
    "Koordinat: " +
    (data.latitude ?? "Belum tersedia") +
    ", " +
    (data.longitude ?? "Belum tersedia");

// Menampilkan foto laporan pada popup peta
if (data.foto) {
    const foto = document.createElement("img");

    foto.src = data.foto;
    foto.alt = "Foto bukti laporan";

    foto.style.width = "100%";
    foto.style.maxWidth = "220px";
    foto.style.height = "auto";
    foto.style.borderRadius = "8px";
    foto.style.marginTop = "8px";

    isiPopup.appendChild(foto);
}

        isiPopup.appendChild(judul);
isiPopup.appendChild(nomor);
isiPopup.appendChild(kategori);
isiPopup.appendChild(lokasi);
isiPopup.appendChild(deskripsi);
isiPopup.appendChild(status);

        let warnaPenanda = "#E99B32";

// Menentukan warna berdasarkan status
if (data.status === "Sedang Diproses") {
    warnaPenanda = "#3186D9";
} else if (data.status === "Selesai") {
    warnaPenanda = "#20A36B";
}

// Membuat penanda dengan warna khusus
const ikonPenanda = L.divIcon({
    className: "penanda-peduliin",
    html: `
        <div style="
            width: 18px;
            height: 18px;
            background-color: ${warnaPenanda};
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 6px rgba(0,0,0,0.4);
        "></div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12]
});

L.marker([data.latitude, data.longitude], {
    icon: ikonPenanda
})
.bindPopup(isiPopup)
.addTo(penandaLaporan);
    });
}
// Menghubungkan filter kategori dengan peta
document.getElementById("filter-kategori-peta")
    .addEventListener("change", tampilkanPenandaLaporan);
// Fungsi menambahkan penanda laporan
function tambahPenandaLaporan(lokasi, latitude, longitude) {

    const penanda = L.marker([latitude, longitude]);

    penanda.bindPopup(
        "<b>Laporan Lingkungan</b><br>" +
        "Lokasi: " + lokasi
    );

    penandaLaporan.addLayer(penanda);
}

// Menghubungkan peta dengan OpenStreetMap
L.tileLayer("https://tile.openstreetmap.de/{z}/{x}/{y}.png", {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(petaLaporan);

// Menambahkan penanda lokasi sekolah
L.marker([-8.1007833, 112.1807783])
    .addTo(petaLaporan)
    .bindPopup("<b>SMAN 1 Blitar</b><br>Pusat PEDULIIN")
    .openPopup();
    // Membuat peta pemilihan lokasi laporan
const petaPilihLokasi = L.map("peta-pilih-lokasi").setView(
    [-8.1007833, 112.1807783],
    17
);

// Menampilkan gambar peta
L.tileLayer("https://tile.openstreetmap.de/{z}/{x}/{y}.png", {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(petaPilihLokasi);

// Menyimpan koordinat yang dipilih

// Menyimpan penanda pilihan
let penandaPilihan = null;

// Memilih lokasi dengan mengeklik peta
petaPilihLokasi.on("click", function(event) {

    latitudeTerpilih = event.latlng.lat;
    longitudeTerpilih = event.latlng.lng;

    if (penandaPilihan) {
        petaPilihLokasi.removeLayer(penandaPilihan);
    }

    penandaPilihan = L.marker([
        latitudeTerpilih,
        longitudeTerpilih
    ]).addTo(petaPilihLokasi);

    document.getElementById("koordinat-terpilih").textContent =
        "Koordinat terpilih: " +
        latitudeTerpilih.toFixed(6) + ", " +
        longitudeTerpilih.toFixed(6);
});
// Membuat peta untuk mengedit lokasi laporan
petaEditLokasi = L.map("peta-edit-lokasi").setView(
    [-8.1007833, 112.1807783],
    17
);

// Menampilkan peta
L.tileLayer("https://tile.openstreetmap.de/{z}/{x}/{y}.png", {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(petaEditLokasi);

// Memilih koordinat baru ketika peta diklik
petaEditLokasi.on("click", function(event) {

    latitudeEdit = event.latlng.lat;
    longitudeEdit = event.latlng.lng;

    if (penandaEdit) {
        petaEditLokasi.removeLayer(penandaEdit);
    }

    penandaEdit = L.marker([
        latitudeEdit,
        longitudeEdit
    ]).addTo(petaEditLokasi);

    document.getElementById("koordinat-edit-terpilih").textContent =
        "Koordinat terpilih: " +
        latitudeEdit.toFixed(6) + ", " +
        longitudeEdit.toFixed(6);
});

tampilkanPenandaLaporan();

console.log(
    "Jumlah penanda:",
    penandaLaporan.getLayers().length
);

if (penandaLaporan.getLayers().length > 0) {

    const penandaPertama = penandaLaporan.getLayers()[0];

    console.log(
        "Posisi penanda:",
        penandaPertama.getLatLng()
    );

    const batasPeta = L.featureGroup(
        penandaLaporan.getLayers()
    ).getBounds();

    petaLaporan.fitBounds(batasPeta, {
        padding: [30, 30]
    });

}
setTimeout(function() {
    petaLaporan.invalidateSize();
    petaPilihLokasi.invalidateSize();
}, 300);
sinkronkanLaporanLama();

setTimeout(function() {
    ambilLaporanDariDatabase();
}, 1000);
// Menghubungkan elemen login admin
const formLoginAdmin = document.getElementById("form-login-admin");
const usernameAdmin = document.getElementById("username-admin");
const passwordAdmin = document.getElementById("password-admin");
const pesanLogin = document.getElementById("pesan-login");
const tombolLogout = document.getElementById("tombol-logout");
const panelAdmin = document.getElementById("kelola-laporan");

// Proses login admin
formLoginAdmin.addEventListener("submit", function(event) {
    event.preventDefault();

    fetch("http://127.0.0.1:5000/api/admin/login", {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            username: usernameAdmin.value,
            password: passwordAdmin.value
        })
    })
    .then(function(response) {
        return response.json().then(function(hasil) {
            if (!response.ok) {
                throw new Error(hasil.pesan);
            }

            return hasil;
        });
    })
    .then(function(hasil) {
        pesanLogin.textContent = hasil.pesan;

        formLoginAdmin.style.display = "none";
        tombolLogout.style.display = "block";
        panelAdmin.style.display = "block";

        passwordAdmin.value = "";
    })
    .catch(function(error) {
        pesanLogin.textContent = error.message;
    });
});
// Proses logout admin
tombolLogout.addEventListener("click", function() {

    fetch("http://127.0.0.1:5000/api/admin/logout", {
        method: "POST",
        credentials: "include"
    })
    .then(function(response) {
        if (!response.ok) {
            throw new Error("Logout gagal!");
        }

        return response.json();
    })
    .then(function(hasil) {

        pesanLogin.textContent = hasil.pesan;

        formLoginAdmin.style.display = "block";
        tombolLogout.style.display = "none";
        panelAdmin.style.display = "none";

        usernameAdmin.value = "";
        passwordAdmin.value = "";

    })
    .catch(function(error) {
        console.error("Logout gagal:", error);
        alert("Logout gagal. Silakan coba lagi.");
    });

});