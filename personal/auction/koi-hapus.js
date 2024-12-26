const db = require("../../db");
const { isPersonalChat, isSellerRegistered, checkSellerDataComplete } = require("../seller/sellerUtils");

module.exports = async function handleKoiHapusCommand(socket, chat, messageText) {
  // Pastikan command hanya bisa digunakan di chat pribadi
  if (!isPersonalChat(chat)) {
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
        text: "⚠️ Format perintah tidak valid. Gunakan format: *koi-hapus #lelang_id#kode_ikan*\n\nContoh: *koi-hapus #AZ2408001#A1*\n\nTutorial: Pastikan Anda memasukkan kode lelang dan kode ikan yang ingin dihapus.",
      },
      { quoted: chat }
    );
    return;
  }

  const lelangId = args[1].trim();
  const kodeIkan = args[2].trim();
  const sellerId = chat.key.remoteJid.split("@")[0];

  // Cek apakah pengguna terdaftar sebagai seller
  const isRegistered = await isSellerRegistered(sellerId);
  if (!isRegistered) {
    await socket.sendMessage(
      chat.key.remoteJid,
      {
        text: "⚠️ Anda belum terdaftar sebagai seller. Silakan mendaftar terlebih dahulu sebelum menggunakan perintah ini.\nKetik: *reg* untuk registrasi.",
      },
      { quoted: chat }
    );
    return;
  }

  // Cek apakah seller telah melengkapi data termasuk nomor rekening
  const isDataComplete = await checkSellerDataComplete(sellerId);
  if (!isDataComplete) {
    await socket.sendMessage(
      chat.key.remoteJid,
      {
        text: "⚠️ Anda belum melengkapi data Anda atau belum memasukkan nomor rekening. Silakan lengkapi data terlebih dahulu dengan mengetik: *rekening #[bank]#[nomor]*.",
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
};
