const db = require("../../db");

module.exports = async (socket, chat, messageText) => {
    const seller_id = chat.key.remoteJid.split("@")[0];

    if (messageText.split("#").length < 3) {
        await socket.sendMessage(
            chat.key.remoteJid,
            {
                text:
                    "ℹ️ *Cara Mengganti Rekening Anda*\n" +
                    "Silakan ketik dengan format:\n" +
                    "`gantirek #bank#no_rekening`\n\n" +
                    "*Contoh Pengisian:* \n" +
                    "`gantirek *#BCA#331025923`\n\n" +
                    "_Pastikan data yang Anda masukkan benar dan sesuai dengan format yang ditentukan._",
            },
            { quoted: chat }
        );
    } else {
        const [, bank, accountNumber] = messageText.split("#");

        db.query("SELECT * FROM sellers WHERE seller_id = ?", [seller_id], (err, results) => {
            if (err) {
                console.error("Terjadi kesalahan saat mengambil data dari database:", err);
                socket.sendMessage(
                    chat.key.remoteJid,
                    { text: "⚠️ Terjadi kesalahan saat memeriksa data rekening. Silakan coba lagi nanti." },
                    { quoted: chat }
                );
                return;
            }

            if (results.length > 0) {
                db.query(
                    "UPDATE sellers SET bank = ?, account_number = ? WHERE seller_id = ?",
                    [bank, accountNumber, seller_id],
                    err => {
                        if (err) {
                            console.error("Terjadi kesalahan saat mengupdate data rekening:", err);
                            socket.sendMessage(
                                chat.key.remoteJid,
                                { text: "⚠️ Terjadi kesalahan saat mengupdate data rekening. Silakan coba lagi nanti." },
                                { quoted: chat }
                            );
                        } else {
                            socket.sendMessage(chat.key.remoteJid, { text: "✅ Rekening Anda berhasil diperbarui!" }, { quoted: chat });
                        }
                    }
                );
            } else {
                socket.sendMessage(
                    chat.key.remoteJid,
                    { text: "⚠️ Anda belum terdaftar sebagai SELLER. Silakan lakukan pendaftaran terlebih dahulu menggunakan perintah reg." },
                    { quoted: chat }
                );
            }
        });
    }
};
