const db = require("../../db");

module.exports = async (socket, chat, messageText) => {
  try {
    // Parsing messageText untuk mendapatkan nama address baru
    const [command, newaddressName] = messageText.split("#");

    if (!newaddressName) {
      await socket.sendMessage(chat.key.remoteJid, { text: "⚠️ Format tidak benar. Gunakan format: edit-address #address_baru" }, { quoted: chat });
      return;
    }

    const sellerId = chat.key.remoteJid.replace("@s.whatsapp.net", ""); // Mengambil seller_id dari nomor HP

    // Update nama address di database
    db.query("UPDATE sellers SET address = ? WHERE seller_id = ?", [newaddressName.trim(), sellerId], async (err, result) => {
      if (err) {
        console.error("Error saat mengupdate nama address:", err);
        await socket.sendMessage(chat.key.remoteJid, { text: "🛑 Terjadi kesalahan saat mengupdate nama address. Silakan coba lagi." }, { quoted: chat });
        return;
      }

      if (result.affectedRows === 0) {
        await socket.sendMessage(chat.key.remoteJid, { text: "⚠️ Tidak ditemukan data seller untuk diupdate." }, { quoted: chat });
        return;
      }

      // Konfirmasi bahwa nama address telah diupdate
      await socket.sendMessage(chat.key.remoteJid, { text: `✅ Nama address berhasil diupdate menjadi *${newaddressName}*.` }, { quoted: chat });

      // Panggil command "me" untuk mengecek pembaruan
      const meCommand = require("./me");
      await meCommand(socket, chat);
    });

  } catch (err) {
    console.error("Error processing edit-address command:", err);
    await socket.sendMessage(chat.key.remoteJid, { text: "🛑 Terjadi kesalahan saat memproses command. Silakan coba lagi." }, { quoted: chat });
  }
};
