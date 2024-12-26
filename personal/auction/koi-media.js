// koi-media.js

async function handleKoiMediaCommand(socket, chat, messageText) {
    // Mengambil nomor HP pengirim
    const nomorHp = chat.key.remoteJid.replace("@s.whatsapp.net", "");
  
    // Jika hanya mengetik "koi-media" tanpa parameter
    if (messageText.trim().toLowerCase() === "koi-media") {
      // Kirim tutorial untuk penggunaan yang benar
      const tutorialMessage = "📚 *Tutorial Penggunaan Command* \n\n" +
                              "Untuk mengupdate data media koi, Anda perlu mengirimkan media (foto atau video) dengan format caption yang benar. \n\n" +
                              "Cara menggunakan command:\n" +
                              "1. Kirimkan media (foto atau video) ke chat ini.\n" +
                              "2. Pada caption atau pesan media tersebut, sertakan format command berikut: \n\t`koi-media #kode_lelang#kode_ikan`.\n\n" +
                              "Contoh:\n" +
                              "📸 Jika Anda memiliki media untuk lelang dengan ID `123` dan kode ikan `ABC`, gunakan caption atau pesan seperti ini: `koi-media #123#ABC`.\n\n" +
                              "Pastikan ID lelang dan kode ikan sesuai dengan yang ada di sistem Anda.";
  
      await socket.sendMessage(chat.key.remoteJid, { text: tutorialMessage }, { quoted: chat });
    } else {
      // Jika ada parameter lain dalam pesan, mungkin Anda ingin menambahkan logika lain di sini
      // Misalnya, jika formatnya benar, proses media sesuai dengan kebutuhan Anda
    }
  }
  
  module.exports = handleKoiMediaCommand;
  