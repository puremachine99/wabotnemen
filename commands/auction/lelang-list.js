const db = require("../../db"); // Pastikan path ini sesuai dengan struktur direktori Anda

module.exports = async function handleLelangListCommand(socket, chat, messageText) {
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

  const sellerId = chat.key.remoteJid.split("@")[0];

  // Cek apakah pengguna terdaftar sebagai seller dan memiliki nomor rekening
  db.query("SELECT COUNT(*) AS count, bank, account_number FROM sellers WHERE seller_id = ?", [sellerId], async (err, results) => {
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
      // Seller tidak terdaftar
      await socket.sendMessage(
        chat.key.remoteJid,
        {
          text: "⚠️ Anda belum terdaftar sebagai seller. Silakan mendaftar terlebih dahulu sebelum melihat daftar lelang.\n ketik : *reg* untuk detail nya",
        },
        { quoted: chat }
      );
      return;
    }

    if (!seller.bank || !seller.account_number) {
      // Seller belum memasukkan nomor rekening
      await socket.sendMessage(
        chat.key.remoteJid,
        {
          text: "⚠️ Anda belum memasukkan nomor rekening. Silakan daftar nomor rekening terlebih dahulu dengan mengetik: *rekening #[bank]#[nomor]*.",
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
          const auctionList = results.map(auction => "* " + auction.lelang_id + " (_" + auction.status + "_)").join("\n");

          const tutorialMessage =
            "Berikut adalah daftar lelang Anda yang sedang dalam proses:\n" +
            auctionList +
            "\n\n" +
            "ℹ️ *Tutorial Menampilkan Daftar Lelang*\n" +
            "Jika Anda ingin melihat detail dari lelang tertentu, ketik:\n" +
            "`lelang-list # lelang_id`\n\n" +
            "*Contoh Penggunaan:* \t\n" +
            "`lelang-list #RG240813001`";

          await socket.sendMessage(chat.key.remoteJid, { text: tutorialMessage }, { quoted: chat });
        } else {
          // Tidak ada lelang yang ditemukan
          await socket.sendMessage(chat.key.remoteJid, { text: "🛑 Anda belum memiliki lelang yang terdaftar atau dalam proses." }, { quoted: chat });
        }
      });
    }
  });
};
