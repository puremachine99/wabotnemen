const fs = require("fs");
const path = require("path");
const db = require("../../db");

async function handleKoivideoCommand(socket, chat, messageText) {
  // Parsing command dan parameter
  const [command, kodeIkan] = messageText.split(" ");
  
  // Cek format command
  if (command.toLowerCase() !== "koi-video" || !kodeIkan) {
    await socket.sendMessage(chat.key.remoteJid, { text: "⚠️ Format command salah. Gunakan format: `koi-video #kode_ikan`" }, { quoted: chat });
    return;
  }

  // Ambil nomor HP pengirim
  const sellerid = chat.key.remoteJid.split("@")[0];

  // Query database untuk mendapatkan path file
  db.query(
    "SELECT video, lelang_id FROM koi WHERE kode_ikan = ? AND seller_id = ?",
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

      // Ambil path file video dari hasil query
      const videoPath = results[0].video;

      // Cek keberadaan file
      if (fs.existsSync(videoPath)) {
        // Kirimkan file media
        const mediaBuffer = fs.readFileSync(videoPath);
        const ext = path.extname(videoPath).substring(1); // Ekstensi file gambar

        await socket.sendMessage(
          chat.key.remoteJid,
          { 
            video: mediaBuffer,
            caption: `video untuk ikan koi dengan kode *${kodeIkan}*`,
            mimetype: `video/${ext}`
          },
          { quoted: chat }
        );
      } else {
        await socket.sendMessage(chat.key.remoteJid, { text: "⚠️ video untuk ikan koi ini tidak tersedia." }, { quoted: chat });
      }
    }
  );
}

module.exports = handleKoivideoCommand;
