const db = require("../../db");

module.exports = async function handleKoiHapusCommand(socket, chat, messageText) {
  // Cek apakah command diakses di chat pribadi atau grup
  if (chat.key.remoteJid.includes("-")) {
    await socket.sendMessage(
      chat.key.remoteJid,
      {
        text: "⚠️ Perintah ini tidak bisa digunakan di grup. Silakan gunakan perintah ini di chat pribadi.",
      },
      { quoted: chat }
    );
    return;
  }

  // Ekstrak kode lelang dan kode ikan dari perintah
  const args = messageText.split("#");
  if (args.length < 3) {
    await socket.sendMessage(
      chat.key.remoteJid,
      {
        text: "⚠️ Format perintah tidak valid. Gunakan format: *koi-hapus #lelang_id#kode_ikan*\n\nContoh: *koi-hapus #AZ2408001#A1*\n\nTutorial: Pastikan Anda memasukkan kode lelang dan kode ikan yang ingin dihapus. Kode lelang adalah kode unik dari lelang yang Anda ikuti, dan kode ikan adalah kode unik dari ikan yang Anda daftarkan di lelang tersebut.",
      },
      { quoted: chat }
    );
    return;
  }

  const lelangId = args[1].trim();
  const kodeIkan = args[2].trim();
  const sellerId = chat.key.remoteJid.split("@")[0];

  // Cek apakah pengguna terdaftar sebagai seller dan memiliki nomor rekening
  db.query(
    "SELECT COUNT(*) AS count FROM sellers WHERE seller_id = ? AND bank IS NOT NULL AND account_number IS NOT NULL",
    [sellerId],
    async (err, results) => {
      if (err) {
        console.error("Error checking seller status:", err);
        await socket.sendMessage(
          chat.key.remoteJid,
          { text: "🛑 Terjadi kesalahan saat memeriksa status seller. Silakan coba lagi nanti." },
          { quoted: chat }
        );
        return;
      }

      const seller = results[0];
      if (seller.count === 0) {
        await socket.sendMessage(
          chat.key.remoteJid,
          {
            text: "⚠️ Anda belum terdaftar sebagai seller atau belum memasukkan nomor rekening. Silakan mendaftar dan update rekening terlebih dahulu.\nKetik : *reg* untuk registrasi dan *rekening #[bank]#[nomor]* untuk update nomor rekening.",
          },
          { quoted: chat }
        );
        return;
      }

      // Hapus ikan koi dari database
      db.query(
        "DELETE FROM koi WHERE kode_ikan = ? AND lelang_id = ? AND seller_id = ?",
        [kodeIkan, lelangId, sellerId],
        async (err, result) => {
          if (err) {
            console.error("Error deleting koi:", err);
            await socket.sendMessage(
              chat.key.remoteJid,
              { text: "🛑 Terjadi kesalahan saat menghapus ikan koi. Silakan coba lagi." },
              { quoted: chat }
            );
            return;
          }

          if (result.affectedRows === 0) {
            await socket.sendMessage(
              chat.key.remoteJid,
              {
                text: `⚠️ Tidak ada ikan koi dengan kode *${kodeIkan}* di lelang *${lelangId}* yang dapat dihapus. Pastikan kode lelang dan kode ikan benar dan coba lagi.`,
              },
              { quoted: chat }
            );
            return;
          }

          await socket.sendMessage(
            chat.key.remoteJid,
            { text: `✅ Ikan koi dengan kode *${kodeIkan}* telah berhasil dihapus dari lelang *${lelangId}*.` },
            { quoted: chat }
          );
        }
      );
    }
  );
};
