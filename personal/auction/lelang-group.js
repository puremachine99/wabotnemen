const db = require("../../db");
const { parseInviteLink } = require("@whiskeysockets/baileys"); // Asumsi ada fungsi yang bisa mengurai link undangan

module.exports = async (socket, chat, messageText) => {
  try {
    // Parsing messageText untuk mendapatkan lelang_id dan link grup
    const [command, lelangId, inviteLink] = messageText.split("#");

    if (!lelangId || !inviteLink) {
      await socket.sendMessage(chat.key.remoteJid, { text: "⚠️ Format tidak benar. Gunakan format: lelang-group #lelang_id #invitation_link" }, { quoted: chat });
      return;
    }

    // Cek apakah lelang_id valid
    const lelang = await db.query("SELECT * FROM lelang WHERE lelang_id = ? AND seller_id = ?", [lelangId, chat.key.remoteJid.replace("@s.whatsapp.net", "")]);
    if (lelang.length === 0) {
      await socket.sendMessage(chat.key.remoteJid, { text: "⚠️ Lelang ID tidak ditemukan atau Anda bukan pemilik lelang." }, { quoted: chat });
      return;
    }

    // Mengurai link grup untuk mendapatkan group_id
    const groupId = parseInviteLink(inviteLink);
    if (!groupId) {
      await socket.sendMessage(chat.key.remoteJid, { text: "⚠️ Link undangan grup tidak valid." }, { quoted: chat });
      return;
    }

    // Jadwal default adalah sekarang + 5 menit (bisa diubah oleh pengguna nantinya)
    const jadwal = new Date(Date.now() + 5 * 60000);

    // Insert data ke tabel group
    await db.query("INSERT INTO `group` (group_id, seller_id, lelang_id, jadwal) VALUES (?, ?, ?, ?)", [groupId, chat.key.remoteJid.replace("@s.whatsapp.net", ""), lelangId, jadwal]);

    // Update status lelang menjadi 'ready'
    await db.query("UPDATE lelang SET status = 'ready' WHERE lelang_id = ?", [lelangId]);

    await socket.sendMessage(chat.key.remoteJid, { text: `✅ Grup *${groupId}* telah didaftarkan untuk lelang ID *${lelangId}* dan lelang siap dilaksanakan pada *${jadwal.toLocaleString()}*.` }, { quoted: chat });

  } catch (err) {
    console.error("Error processing lelang-group command:", err);
    await socket.sendMessage(chat.key.remoteJid, { text: "🛑 Terjadi kesalahan saat memproses pendaftaran grup. Silakan coba lagi." }, { quoted: chat });
  }
};
