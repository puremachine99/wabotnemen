const db = require("../../db");

module.exports = async (socket, chat, messageText) => {
  try {
    // Parsing messageText untuk mendapatkan nama city baru
    const [command, newcityName] = messageText.split("#");

    if (!newcityName) {
      await socket.sendMessage(chat.key.remoteJid, { text: "⚠️ Format tidak benar. Gunakan format: edit-city #nama_city_baru" }, { quoted: chat });
      return;
    }

    const sellerId = chat.key.remoteJid.replace("@s.whatsapp.net", ""); // Mengambil seller_id dari nomor HP

    // Update nama city di database
    db.query("UPDATE sellers SET city = ? WHERE seller_id = ?", [newcityName.trim(), sellerId], async (err, result) => {
      if (err) {
        console.error("Error saat mengupdate nama city:", err);
        await socket.sendMessage(chat.key.remoteJid, { text: "🛑 Terjadi kesalahan saat mengupdate nama city. Silakan coba lagi." }, { quoted: chat });
        return;
      }

      if (result.affectedRows === 0) {
        await socket.sendMessage(chat.key.remoteJid, { text: "⚠️ Tidak ditemukan data seller untuk diupdate." }, { quoted: chat });
        return;
      }

      // Konfirmasi bahwa nama city telah diupdate
      await socket.sendMessage(chat.key.remoteJid, { text: `✅ Nama city berhasil diupdate menjadi *${newcityName}*.` }, { quoted: chat });

      // Panggil command "me" untuk mengecek pembaruan
      const meCommand = require("./me");
      await meCommand(socket, chat);
    });

  } catch (err) {
    console.error("Error processing edit-city command:", err);
    await socket.sendMessage(chat.key.remoteJid, { text: "🛑 Terjadi kesalahan saat memproses command. Silakan coba lagi." }, { quoted: chat });
  }
};
