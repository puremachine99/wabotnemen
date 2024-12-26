const db = require("../../db");
const handleKoiListCommand = require("./koi-list"); // Import handler untuk koi-list

module.exports = async function handleKoiKBCommand(socket, chat, messageText) {
  // Pastikan command hanya bisa digunakan di chat pribadi
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

  const sellerId = chat.key.remoteJid.split("@")[0];

  // Ekstrak kode koi dan nilai KB baru dari pesan
  const [command, kodeIkan, newOpenBid] = messageText.split("#").map(part => part.trim());

  // Validasi input
  if (!kodeIkan || !newOpenBid || isNaN(newOpenBid) || parseFloat(newOpenBid) <= 0) {
    await socket.sendMessage(
      chat.key.remoteJid,
      {
        text: "⚠️ Format tidak benar. Gunakan format: koi-KB #kode_koi#nilai_KB (contoh: 500 untuk 500 ribu rupiah)",
      },
      { quoted: chat }
    );
    return;
  }

  // Cek apakah koi tersebut dimiliki oleh seller
  db.query(
    "SELECT COUNT(*) AS count FROM koi WHERE kode_ikan = ? AND seller_id = ?",
    [kodeIkan, sellerId],
    async (err, results) => {
      if (err) {
        console.error("Error checking koi ownership:", err);
        await socket.sendMessage(
          chat.key.remoteJid,
          { text: "🛑 Terjadi kesalahan saat memeriksa kepemilikan koi. Silakan coba lagi nanti." },
          { quoted: chat }
        );
        return;
      }

      if (results[0].count === 0) {
        await socket.sendMessage(
          chat.key.remoteJid,
          {
            text: "⚠️ Anda tidak memiliki koi dengan kode tersebut. Pastikan kode ikan benar.",
          },
          { quoted: chat }
        );
        // Trigger command koi-list untuk menampilkan detail koi yang ada
        await handleKoiListCommand(socket, chat, `koi-list ${kodeIkan}`); // Memanggil command koi-list dengan parameter kode_ikan
        return;
      }

      // Update KB ikan koi
      db.query(
        "UPDATE koi SET kelipatan_bid = ? WHERE kode_ikan = ? AND seller_id = ?",
        [parseFloat(newOpenBid), kodeIkan, sellerId],
        async (err, results) => {
          if (err) {
            console.error("Error updating koi KB:", err);
            await socket.sendMessage(
              chat.key.remoteJid,
              { text: "🛑 Terjadi kesalahan saat mengupdate nilai KB koi. Silakan coba lagi nanti." },
              { quoted: chat }
            );
            return;
          }

          if (results.affectedRows > 0) {
            await socket.sendMessage(
              chat.key.remoteJid,
              { text: `✅ Nilai KB ikan dengan kode *${kodeIkan}* berhasil diubah menjadi *${newOpenBid} K*.` },
              { quoted: chat }
            );
            // Setelah update berhasil, tampilkan detail ikan tersebut
            await handleKoiListCommand(socket, chat, `koi-list ${kodeIkan}`); // Memanggil command koi-list dengan parameter kode_ikan
          } else {
            await socket.sendMessage(
              chat.key.remoteJid,
              { text: "⚠️ Terjadi kesalahan, data tidak berhasil diperbarui. Coba lagi nanti." },
              { quoted: chat }
            );
          }
        }
      );
    }
  );
};
