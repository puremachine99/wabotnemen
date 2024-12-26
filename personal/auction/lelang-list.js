const db = require("../../db");
const { isSellerRegistered, checkSellerDataComplete, isPersonalChat } = require("../seller/sellerUtils");

module.exports = async function handleLelangListCommand(socket, chat, messageText) {
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

  const sellerId = chat.key.remoteJid.split("@")[0];

  // Cek apakah pengguna terdaftar sebagai seller
  const isRegistered = await isSellerRegistered(sellerId);
  if (!isRegistered) {
    await socket.sendMessage(
      chat.key.remoteJid,
      {
        text: "⚠️ Anda belum terdaftar sebagai seller. Silakan mendaftar terlebih dahulu sebelum melihat daftar lelang.\nKetik: *reg* untuk detailnya.",
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
        text: "⚠️ Anda belum melengkapi data Anda atau belum memasukkan nomor rekening. Silakan melengkapi data terlebih dahulu dengan mengetik: *rekening #[bank]#[nomor]*.",
      },
      { quoted: chat }
    );
    return;
  }

  // Extract the query from the message
  const listlelangparts = messageText.split("#");
  const queryCode = listlelangparts[1] ? listlelangparts[1].trim() : "";

  if (queryCode) {
    // Menampilkan detail lelang untuk kode tertentu
    db.query("SELECT * FROM lelang WHERE lelang_id = ? AND seller_id = ?", [queryCode, sellerId], async (err, results) => {
      if (err) {
        console.error("Error fetching auction data:", err);
        await socket.sendMessage(
          chat.key.remoteJid,
          { text: "🛑 Terjadi kesalahan saat mengambil data lelang. Silakan coba lagi." },
          { quoted: chat }
        );
        return;
      }

      if (results.length > 0) {
        const auction = results[0];
        const statusText =
          auction.status === "draft"
            ? "Proses Pengisian Data"
            : auction.status === "on going"
            ? "Sedang berlangsung"
            : auction.status === "done"
            ? "Selesai"
            : "Tidak diketahui";

        const message =
          `📋 *Detail Lelang*\n` +
          `*Kode Lelang\t:*  ${auction.lelang_id}\n` +
          `*Judul Lelang\t:*  ${auction.judul_lelang}\n` +
          `*Deskripsi\t:*  ${auction.deskripsi}\n` +
          `*Status\t:*  _${statusText}_\n` +
          `*Pemenang Lelang\t:*  ${auction.pemenang_lelang || "Belum ada"}\n` +
          `*Timestamp Dibuat\t:*  ${auction.timestamp_dibuat}\n` +
          `*Timestamp Start\t:*  ${auction.timestamp_start || "Belum dimulai"}\n` +
          `*Timestamp End\t:*  ${auction.timestamp_end || "Belum berakhir"}`;

        await socket.sendMessage(chat.key.remoteJid, { text: message }, { quoted: chat });
      } else {
        // Kode lelang tidak ditemukan
        await socket.sendMessage(chat.key.remoteJid, { text: "🛑 Kode lelang tidak ditemukan." }, { quoted: chat });
      }
    });
  } else {
    // Menampilkan daftar lelang yang sedang dalam proses draft jika tidak ada kode lelang
    db.query("SELECT lelang_id, status FROM lelang WHERE seller_id = ?", [sellerId], async (err, results) => {
      if (err) {
        console.error("Error fetching auctions:", err);
        await socket.sendMessage(
          chat.key.remoteJid,
          { text: "🛑 Terjadi kesalahan saat mengambil data lelang. Silakan coba lagi." },
          { quoted: chat }
        );
        return;
      }

      if (results.length > 0) {
        const auctionList = results.map(auction => `*${auction.lelang_id}* (_${auction.status}_)`).join("\n");

        const tutorialMessage =
          "Berikut adalah daftar lelang Anda yang sedang dalam proses:\n" +
          auctionList +
          "\n\n" +
          "ℹ️ *Tutorial Menampilkan Daftar Lelang*\n" +
          "Jika Anda ingin melihat detail dari lelang tertentu, ketik:\n" +
          "`lelang-list #lelang_id`\n\n" +
          "*Contoh Penggunaan:* \n" +
          "`lelang-list #RG2212001`";

        await socket.sendMessage(chat.key.remoteJid, { text: tutorialMessage }, { quoted: chat });
      } else {
        // Tidak ada lelang yang ditemukan
        await socket.sendMessage(chat.key.remoteJid, { text: "🛑 Anda belum memiliki lelang yang terdaftar atau dalam proses." }, { quoted: chat });
      }
    });
  }
};
