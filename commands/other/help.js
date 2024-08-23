module.exports = async function handleHelpCommand(socket, chat) {
  const helpMessage =
    "`reg` \t : Mendaftar sebagai seller di bot ini.\n" +
    "_Contoh_ : `reg #RR Koi#Reza Rahardian#Jl. alamat no.12#Blitar#3571234567890123`\n\n" +

    "`rekening` \t : Menambahkan atau memperbarui informasi rekening Anda.\n" +
    "_Contoh_ : `rekening #bca#331xxxxxx`\n\n" +

    "`gantirek` \t : Mengedit informasi rekening yang telah terdaftar.\n" +
    "_Contoh_ : `gantirek #bca#123xxxxxx`\n\n" +

    "`me` \t : Melihat informasi akun Anda.\n" +
    "_Contoh_ : `me`\n\n" +

    "`lelang` \t : Membuat lelang baru dengan judul dan deskripsi yang ditentukan.\n" +
    "_Contoh_ : `lelang #Lelang Showa Blitar#Lelang koi Showa terbesar`\n\n" +

    "`lelang-list` \t : Menampilkan daftar lelang yang Anda buat.\n" +
    "_Contoh_ : `lelang-list`\n\n" +

    "`lelang-list #kode lelang` \t : Menampilkan detail lelang berdasarkan kode lelang.\n" +
    "_Contoh_ : `lelang-list #RG2408004`\n\n" +

    "`lelang-tinjau` \t : Menampilkan pratinjau lelang untuk di koreksi oleh seller.\n" +
    "_Contoh_ : `lelang-tinjau`\n\n" +

    "`koi` \t : Mendaftarkan ikan koi untuk dilelang dengan data yang ditentukan.\n" +
    "_Contoh_ : `koi A#Goshiki#M#47#500#50#0`\n\n" +

    "`koi-media` \t : Mengunggah foto atau video koi yang akan masuk lelang.\n" +
    "_Contoh_ : kirim media + caption : `koi-media #RG2408004#a`\n\n" +

    "`koi-foto` \t : Mendownload atau meninjau foto untuk ikan yang sudah terdaftar dalam lelang.\n" +
    "_Contoh_ : `koi-foto a`\n\n" +

    "`koi-video` \t : Mendownload atau meninjau video untuk ikan yang sudah terdaftar dalam lelang.\n" +
    "_Contoh_ : `koi-video a`\n\n" +

    "`help` \t : Menampilkan daftar perintah yang tersedia dan panduan penggunaannya.\n" +
    "_Contoh_ : `help`\n\n" +

    "*Tutorials:*\n" +
    "`tutorial-reg` \t : Tutorial registrasi dan menambahkan data rekening.\n" +
    "`tutorial-lelang` \t : Tutorial membuat lelang.\n" +
    "`tutorial-koi` \t : Tutorial menambahkan koi, foto, dan video.\n" +
    "`tutorial-start-lelang` \t : Tutorial memulai lelang.\n\n" +

    "⚠️ Semua perintah hanya dapat digunakan dalam chat pribadi, bukan di grup.\n" +
    "Untuk bantuan lebih lanjut, hubungi admin bot ini.\n";

  await socket.sendMessage(chat.key.remoteJid, { text: helpMessage }, { quoted: chat });
};
