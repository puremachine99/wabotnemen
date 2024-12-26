const db = require("../../db");

module.exports = async (socket, chat, messageText) => {
  try {
    // Parsing messageText untuk mendapatkan nama nik baru
    const [command, newnikName] = messageText.split("#");

    if (!newnikName) {
      await socket.sendMessage(chat.key.remoteJid, { text: "⚠️ Format tidak benar. Gunakan format: edit-nik #nik_baru" }, { quoted: chat });
      return;
    }

    const sellerId = chat.key.remoteJid.replace("@s.whatsapp.net", ""); // Mengambil seller_id dari nomor HP

    // Update nama nik di database
    db.query("UPDATE sellers SET nik = ? WHERE seller_id = ?", [newnikName.trim(), sellerId], async (err, result) => {
      if (err) {
        console.error("Error saat mengupdate nama nik:", err);
        await socket.sendMessage(chat.key.remoteJid, { text: "🛑 Terjadi kesalahan saat mengupdate nama nik. Silakan coba lagi." }, { quoted: chat });
        return;
      }

      if (result.affectedRows === 0) {
        await socket.sendMessage(chat.key.remoteJid, { text: "⚠️ Tidak ditemukan data seller untuk diupdate." }, { quoted: chat });
        return;
      }

      // Konfirmasi bahwa nama nik telah diupdate
      await socket.sendMessage(chat.key.remoteJid, { text: `✅ Nama nik berhasil diupdate menjadi *${newnikName}*.` }, { quoted: chat });

      // Panggil command "me" untuk mengecek pembaruan
      const meCommand = require("./me");
      await meCommand(socket, chat);
    });

  } catch (err) {
    console.error("Error processing edit-nik command:", err);
    await socket.sendMessage(chat.key.remoteJid, { text: "🛑 Terjadi kesalahan saat memproses command. Silakan coba lagi." }, { quoted: chat });
  }
};
