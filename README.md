WhatsApp Auction Bot
WhatsApp Auction Bot adalah bot berbasis WhatsApp yang dibuat untuk mengelola lelang ikan koi. Bot ini dapat menangani berbagai perintah seperti pendaftaran penjual, manajemen lelang, dan penanganan media yang diunggah oleh pengguna.

Daftar Isi
Persyaratan
Instalasi
Penggunaan
Menjalankan Bot
Daftar Perintah
Struktur Proyek
Kontribusi
Lisensi
Persyaratan
Pastikan Anda telah menginstal perangkat lunak berikut sebelum memulai:

Node.js (versi terbaru disarankan)
NPM atau Yarn (manajer paket Node.js)
Instalasi
Clone repository ini ke dalam direktori lokal Anda:

bash
Copy code
git clone https://github.com/username/whatsapp-auction-bot.git
cd whatsapp-auction-bot
Instal dependensi yang diperlukan dengan menggunakan NPM atau Yarn:

bash
Copy code
npm install
atau

bash
Copy code
yarn install
Penggunaan
Menjalankan Bot
Setelah instalasi selesai, Anda dapat menjalankan bot dengan perintah berikut:

bash
Copy code
node index.js
Bot akan menampilkan QR code di terminal. Scan QR code tersebut menggunakan akun WhatsApp yang akan digunakan sebagai bot.

Daftar Perintah
Berikut adalah daftar perintah yang didukung oleh bot:

ping - Mengembalikan pesan "pong!" sebagai respons.
me - Menampilkan informasi akun penjual.
reg - Mendaftarkan penjual baru.
rekening - Mengelola informasi rekening penjual.
gantirek - Mengganti informasi rekening penjual.
lelang - Membuat lelang baru.
lelang-list - Menampilkan daftar lelang yang aktif.
lelang-tinjau - Meninjau detail lelang.
koi - Mengelola informasi ikan koi yang akan dilelang.
koi-list - Menampilkan daftar ikan koi yang terdaftar.
koi-foto - Mengunggah foto ikan koi untuk lelang.
koi-hapus - Menghapus ikan koi dari daftar lelang.
help - Menampilkan daftar perintah yang tersedia.
Struktur Proyek
Struktur direktori proyek ini dirancang untuk memisahkan logika bot menjadi beberapa modul:

python
Copy code
.
├── commands/
│   ├── seller/
│   │   ├── me.js
│   │   ├── reg.js
│   │   ├── rekening.js
│   │   └── gantirek.js
│   ├── auction/
│   │   ├── lelang.js
│   │   ├── lelang-list.js
│   │   ├── lelang-tinjau.js
│   │   ├── koi.js
│   │   ├── koi-list.js
│   │   ├── koi-foto.js
│   │   └── koi-hapus.js
│   └── other/
│       └── help.js
├── seller-media/
├── index.js
└── README.md
commands/ - Berisi perintah yang didukung oleh bot.
seller-media/ - Direktori tempat penyimpanan file media yang diunggah oleh penjual.
index.js - Skrip utama untuk menjalankan bot.
Kontribusi
Kontribusi sangat disambut! Jika Anda ingin berkontribusi, silakan fork repository ini, buat branch baru untuk fitur atau perbaikan Anda, dan buat pull request setelah selesai.

Fork proyek ini.
Buat branch fitur Anda (git checkout -b fitur-anda).
Commit perubahan Anda (git commit -am 'Menambahkan fitur baru').
Push ke branch (git push origin fitur-anda).
Buat pull request.
Lisensi
Proyek ini dilisensikan di bawah MIT License. Silakan lihat file LICENSE untuk detailnya.