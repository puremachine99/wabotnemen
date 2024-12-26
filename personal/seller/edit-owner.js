const db = require("../../db");

module.exports = async (socket, chat, messageText) => {
  try {
    // Parsing messageText untuk mendapatkan nama owner baru
    const [command, newownerName] = messageText.split("#");

    if (!newownerName) {
      await socket.sendMessage(chat.key.remoteJid, { text: "⚠️ Format tidak benar. Gunakan format: edit-owner #nama_owner_baru" }, { quoted: chat });
      return;
    }

    const sellerId = chat.key.remoteJid.replace("@s.whatsapp.net", ""); // Mengambil seller_id dari nomor HP

    // Update nama owner di database
    db.query("UPDATE sellers SET owner = ? WHERE seller_id = ?", [newownerName.trim(), sellerId], async (err, result) => {
      if (err) {
        console.error("Error saat mengupdate nama owner:", err);
        await socket.sendMessage(chat.key.remoteJid, { text: "🛑 Terjadi kesalahan saat mengupdate nama owner. Silakan coba lagi." }, { quoted: chat });
        return;
      }

      if (result.affectedRows === 0) {
        await socket.sendMessage(chat.key.remoteJid, { text: "⚠️ Tidak ditemukan data seller untuk diupdate." }, { quoted: chat });
        return;
      }

      // Konfirmasi bahwa nama owner telah diupdate
      await socket.sendMessage(chat.key.remoteJid, { text: `✅ Nama owner berhasil diupdate menjadi *${newownerName}*.` }, { quoted: chat });

      // Panggil command "me" untuk mengecek pembaruan
      const meCommand = require("./me");
      await meCommand(socket, chat);
    });

  } catch (err) {
    console.error("Error processing edit-owner command:", err);
    await socket.sendMessage(chat.key.remoteJid, { text: "🛑 Terjadi kesalahan saat memproses command. Silakan coba lagi." }, { quoted: chat });
  }
};
