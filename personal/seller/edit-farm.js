const db = require("../../db");

module.exports = async (socket, chat, messageText) => {
  try {
    // Parsing messageText untuk mendapatkan nama farm baru
    const [command, newFarmName] = messageText.split("#");

    if (!newFarmName) {
      await socket.sendMessage(chat.key.remoteJid, { text: "⚠️ Format tidak benar. Gunakan format: edit-farm #nama_farm_baru" }, { quoted: chat });
      return;
    }

    const sellerId = chat.key.remoteJid.replace("@s.whatsapp.net", ""); // Mengambil seller_id dari nomor HP

    // Update nama farm di database
    db.query("UPDATE sellers SET farm = ? WHERE seller_id = ?", [newFarmName.trim(), sellerId], async (err, result) => {
      if (err) {
        console.error("Error saat mengupdate nama farm:", err);
        await socket.sendMessage(chat.key.remoteJid, { text: "🛑 Terjadi kesalahan saat mengupdate nama farm. Silakan coba lagi." }, { quoted: chat });
        return;
      }

      if (result.affectedRows === 0) {
        await socket.sendMessage(chat.key.remoteJid, { text: "⚠️ Tidak ditemukan data seller untuk diupdate." }, { quoted: chat });
        return;
      }

      // Konfirmasi bahwa nama farm telah diupdate
      await socket.sendMessage(chat.key.remoteJid, { text: `✅ Nama farm berhasil diupdate menjadi *${newFarmName}*.` }, { quoted: chat });

      // Panggil command "me" untuk mengecek pembaruan
      const meCommand = require("./me");
      await meCommand(socket, chat);
    });

  } catch (err) {
    console.error("Error processing edit-farm command:", err);
    await socket.sendMessage(chat.key.remoteJid, { text: "🛑 Terjadi kesalahan saat memproses command. Silakan coba lagi." }, { quoted: chat });
  }
};
