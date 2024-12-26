const fs = require("fs");
const path = require("path");
const db = require("../../db");

async function handleKoiFotoCommand(socket, chat, messageText) {
  // Parsing command dan parameter
  const [command, kodeIkan] = messageText.split(" ");
  
  // Cek format command
  if (command.toLowerCase() !== "koi-foto" || !kodeIkan) {
    await socket.sendMessage(chat.key.remoteJid, { text: "⚠️ Format command salah. Gunakan format: `koi-foto #kode_ikan`" }, { quoted: chat });
    return;
  }

  // Ambil nomor HP pengirim
  const sellerid = chat.key.remoteJid.split("@")[0];

  // Query database untuk mendapatkan path file
  db.query(
    "SELECT foto, lelang_id FROM koi WHERE kode_ikan = ? AND seller_id = ?",
    [kodeIkan, sellerid],
    async (err, results) => {
      if (err) {
        console.error("Error saat pengecekan data koi:", err);
        await socket.sendMessage(chat.key.remoteJid, { text: "🛑 Terjadi kesalahan saat pengecekan data ikan koi. Silakan coba lagi." }, { quoted: chat });
        return;
      }

      if (results.length === 0) {
        await socket.sendMessage(chat.key.remoteJid, { text: `⚠️ Data untuk kode ikan *${kodeIkan}* tidak ditemukan.` }, { quoted: chat });
        return;
      }

      // Ambil path file foto dari hasil query
      const fotoPath = results[0].foto;

      // Cek keberadaan file
      if (fs.existsSync(fotoPath)) {
        // Kirimkan file media
        const mediaBuffer = fs.readFileSync(fotoPath);
        const ext = path.extname(fotoPath).substring(1); // Ekstensi file gambar

        await socket.sendMessage(
          chat.key.remoteJid,
          { 
            image: mediaBuffer,
            caption: `Foto untuk ikan koi dengan kode *${kodeIkan}*`,
            mimetype: `image/${ext}`
          },
          { quoted: chat }
        );
      } else {
        await socket.sendMessage(chat.key.remoteJid, { text: "⚠️ Foto untuk ikan koi ini tidak tersedia." }, { quoted: chat });
      }
    }
  );
}

module.exports = handleKoiFotoCommand;
