const db = require("../../db");
const { isSellerRegistered, checkSellerDataComplete, doesSellerHaveAuction } = require("../seller/sellerUtils");

module.exports = async function handleLelangStartCommand(socket, chat, messageText) {
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

  // Cek apakah seller memiliki lelang dengan status 'draft'
  const auction = await doesSellerHaveAuction(sellerId);
  if (!auction || auction.status !== "draft") {
    await socket.sendMessage(
      chat.key.remoteJid,
      {
        text: "⚠️ Anda tidak memiliki lelang dengan status 'draft'. Pastikan Anda sudah membuat lelang dan semua data koi sudah diisi.",
      },
      { quoted: chat }
    );
    return;
  }

  // Cek apakah semua data koi sudah diisi kecuali sertifikat dan BIN
  const koiData = await new Promise((resolve, reject) => {
    db.query(
      "SELECT * FROM koi WHERE lelang_id = ? AND (jenis_ikan IS NULL OR ukuran IS NULL OR gender IS NULL OR open_bid IS NULL OR kelipatan_bid IS NULL)",
      [auction.lelang_id],
      (err, results) => {
        if (err) return reject(err);
        resolve(results);
      }
    );
  });

  if (koiData.length > 0) {
    await socket.sendMessage(
      chat.key.remoteJid,
      {
        text: "⚠️ Terdapat data koi yang belum lengkap. Pastikan semua kolom wajib telah diisi kecuali sertifikat dan BIN.",
      },
      { quoted: chat }
    );
    return;
  }

  // Jika command hanya 'lelang-start' tanpa parameter
  const args = messageText.split("#");
  if (args.length < 2) {
    await socket.sendMessage(
      chat.key.remoteJid,
      {
        text:
          "ℹ️ *Tutorial Lelang Start*\n\n" +
          "Gunakan perintah berikut untuk memulai lelang setelah semua data koi terisi:\n" +
          "*lelang-start #tanggal mulai<spasi>jam(format 24h)#tanggal selesai<spasi>jam(format 24h)*\n\n" +
          "Contoh penggunaan:\n" +
          "*lelang-start #2024-09-01 19:00#2024-09-02 19:00*\n\n" +
          "Jika tanggal selesai tidak diisi, maka otomatis akan diatur 24 jam dari waktu mulai.",
      },
      { quoted: chat }
    );
    return;
  }

  // Ekstrak tanggal mulai dan selesai dari pesan
  const [startDateStr, endDateStr] = args.slice(1, 3);
  const startDate = new Date(startDateStr.trim());
  let endDate = endDateStr ? new Date(endDateStr.trim()) : null;

  if (isNaN(startDate.getTime())) {
    await socket.sendMessage(
      chat.key.remoteJid,
      {
        text: "⚠️ Tanggal mulai tidak valid. Gunakan format: YYYY-MM-DD HH:MM.",
      },
      { quoted: chat }
    );
    return;
  }

  if (!endDate || isNaN(endDate.getTime())) {
    // Jika tanggal berakhir tidak diberikan atau tidak valid, set 24 jam dari tanggal mulai
    endDate = new Date(startDate);
    endDate.setHours(endDate.getHours() + 24);
  }

  // Update status lelang menjadi 'ready' dan simpan tanggal mulai dan selesai
  await new Promise((resolve, reject) => {
    db.query(
      "UPDATE lelang SET status = 'ready', timestamp_start = ?, timestamp_end = ? WHERE lelang_id = ?",
      [startDate, endDate, auction.lelang_id],
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      }
    );
  });

  await socket.sendMessage(
    chat.key.remoteJid,
    {
      text: `✅ Lelang dengan ID *${auction.lelang_id}* telah diset untuk mulai pada *${startDate.toLocaleString()}* dan berakhir pada *${endDate.toLocaleString()}*.`,
    },
    { quoted: chat }
  );
};
