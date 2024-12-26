const db = require("../../db");

module.exports = async (socket, chat) => {
  db.query("SELECT * FROM sellers WHERE seller_id = ?", [chat.key.remoteJid.split('@')[0]], (err, results) => {
    if (err) {
      console.error("Terjadi kesalahan saat mengambil data dari database:", err);
      socket.sendMessage(chat.key.remoteJid, { text: "⚠️ Terjadi kesalahan saat mengambil data. Silakan coba lagi nanti." }, { quoted: chat });
      return;
    }

    if (results.length > 0) {
      const seller = results[0];
      const bankInfo =
        seller.bank && seller.account_number
          ? `\nBank: ${seller.bank}\nNo. Rek: ${seller.account_number}`
          : `\n⚠️ Informasi rekening belum terdaftar. Silakan tambahkan menggunakan perintah rekening #bank#no_rekening`;

      const responseMessage =
        "🪪 ID Seller: [" + seller.seller_id + "]\n" +
        "Data Pendaftaran\n" +
        "Farm: " + seller.farm + "\n" +
        "Owner: " + seller.owner + "\n" +
        "Alamat: " + seller.address + "\n" +
        "Kota: " + seller.city + "\n" +
        
        "NIK: " + seller.nik + "\n" +
        "Sejak: " + seller.timestamp + "\n" +
        bankInfo + "\n" +
        "\nAnda sudah bisa membuat lelang.";

      socket.sendMessage(chat.key.remoteJid, { text: responseMessage }, { quoted: chat });
    } else {
      socket.sendMessage(
        chat.key.remoteJid,
        { text: "⚠️ Anda belum terdaftar sebagai SELLER. Silakan lakukan pendaftaran terlebih dahulu menggunakan perintah `reg`." },
        { quoted: chat }
      );
    }
  });
};
