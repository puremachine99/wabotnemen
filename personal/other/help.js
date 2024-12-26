module.exports = async function handleHelpCommand(socket, chat) {
  const helpMessage =
    "`ping` \t: Mengecek konektivitas bot. Balas dengan 'pong!'.\n" +
    "_Contoh_ : `ping`\n\n" +

    "`me` \t: Melihat informasi akun Anda.\n" +
    "_Contoh_ : `me`\n\n" +

    "`reg` \t: Mendaftar sebagai seller di bot ini.\n" +
    "_Contoh_ : `reg #RR Koi#Reza Rahardian#Jl. Alamat No.12#Blitar#3571234567890123`\n\n" +

    "`rekening` \t: Menambahkan atau memperbarui informasi rekening Anda.\n" +
    "_Contoh_ : `rekening #bca#331xxxxxx`\n\n" +

    "`edit-rekening` \t: Mengedit informasi rekening yang telah terdaftar.\n" +
    "_Contoh_ : `edit-rekening #bca#123xxxxxx`\n\n" +

    "`edit-farm` \t: Mengedit nama farm Anda.\n" +
    "_Contoh_ : `edit-farm #Farm Baru`\n\n" +

    "`edit-owner` \t: Mengedit nama pemilik farm.\n" +
    "_Contoh_ : `edit-owner #Nama Pemilik Baru`\n\n" +

    "`edit-alamat` \t: Mengedit alamat farm.\n" +
    "_Contoh_ : `edit-alamat #Alamat Baru`\n\n" +

    "`edit-kota` \t: Mengedit kota farm.\n" +
    "_Contoh_ : `edit-kota #Kota Baru`\n\n" +

    "`edit-nik` \t: Mengedit NIK pemilik farm.\n" +
    "_Contoh_ : `edit-nik #3571234567890123`\n\n" +

    "`lelang` \t: Membuat lelang baru dengan judul dan deskripsi yang ditentukan.\n" +
    "_Contoh_ : `lelang #Lelang Showa Blitar#Lelang koi Showa terbesar`\n\n" +

    "`lelang-list` \t: Menampilkan daftar lelang yang Anda buat.\n" +
    "_Contoh_ : `lelang-list`\n\n" +

    "`lelang-tinjau` \t: Menampilkan pratinjau lelang untuk dikoreksi oleh seller.\n" +
    "_Contoh_ : `lelang-tinjau`\n\n" +

    "`lelang-group` \t: Mendaftarkan grup untuk lelang.\n" +
    "_Contoh_ : `lelang-group #invitation_link`\n\n" +

    "`koi` \t: Mendaftarkan ikan koi untuk dilelang dengan data yang ditentukan.\n" +
    "_Contoh_ : `koi A#Goshiki#M#47#500#50#0`\n\n" +

    "`koi-jenis` \t: Mengedit jenis ikan koi.\n" +
    "_Contoh_ : `koi-jenis #A#Showa`\n\n" +

    "`koi-size` \t: Mengedit ukuran ikan koi.\n" +
    "_Contoh_ : `koi-size #A#50`\n\n" +

    "`koi-gender` \t: Mengedit gender ikan koi.\n" +
    "_Contoh_ : `koi-gender #A#M`\n\n" +

    "`koi-ob` \t: Mengedit nilai open bid ikan koi.\n" +
    "_Contoh_ : `koi-ob #A#700`\n\n" +

    "`koi-kb` \t: Mengedit nilai kelipatan bid ikan koi.\n" +
    "_Contoh_ : `koi-kb #A#50`\n\n" +

    "`koi-bin` \t: Mengedit harga Buy It Now ikan koi.\n" +
    "_Contoh_ : `koi-bin #A#1500`\n\n" +

    "`koi-list` \t: Menampilkan daftar atau detail ikan koi berdasarkan lelang.\n" +
    "_Contoh_ : `koi-list` atau `koi-list #kode_koi`\n\n" +

    "`koi-media` \t: Mengunggah foto atau video koi untuk lelang.\n" +
    "_Contoh_ : Kirim media + caption: `koi-media #RG2408004#A`\n\n" +

    "`koi-foto` \t: Mendownload atau meninjau foto untuk ikan yang sudah terdaftar dalam lelang.\n" +
    "_Contoh_ : `koi-foto A`\n\n" +

    "`koi-video` \t: Mendownload atau meninjau video untuk ikan yang sudah terdaftar dalam lelang.\n" +
    "_Contoh_ : `koi-video A`\n\n" +

    "`koi-sertifikat` \t: Mengunggah sertifikat untuk ikan koi.\n" +
    "_Contoh_ : Kirim sertifikat + caption: `koi-sertifikat #A`\n\n" +

    "`koi-hapus` \t: Menghapus data ikan koi dari lelang.\n" +
    "_Contoh_ : `koi-hapus #A`\n\n" +

    "`help` \t: Menampilkan daftar perintah yang tersedia dan panduan penggunaannya.\n" +
    "_Contoh_ : `help`\n\n" +

    "⚠️ Semua perintah hanya dapat digunakan dalam chat pribadi, bukan di grup.\n" +
    "Untuk bantuan lebih lanjut, hubungi admin bot ini.\n";

  await socket.sendMessage(chat.key.remoteJid, { text: helpMessage }, { quoted: chat });
};
