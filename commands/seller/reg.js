const db = require("../../db");

module.exports = async (socket, chat, messageText) => {
    if (messageText.split("#").length < 6) {
        await socket.sendMessage(
            chat.key.remoteJid,
            {
                text:
                    "ℹ️ *Panduan Pendaftaran sebagai SELLER (Penyedia Lelang)*\nSilakan ketik dengan format:\n\n" +
                    "`reg # nama_farm # nama_owner # alamat # kota # NIK`\n\n" +
                    "*Contoh Pengisian:*\n" +
                    "`reg #Koi Blitar#Siti Rahayu#Jl. Raya Blitar No. 22#Blitar#3512123456789012`\n\n" +
                    "_Pastikan data yang Anda masukkan benar dan sesuai dengan format yang ditentukan._",
            },
            { quoted: chat }
        );
    } else {
        const [, farmName, ownerName, address, city, nik] = messageText.split("#");

        const seller_id = chat.key.remoteJid.split("@")[0];

        db.query("SELECT * FROM sellers WHERE seller_id = ?", [seller_id], (err, results) => {
            if (err) {
                console.error("Terjadi kesalahan saat memeriksa data dari database:", err);
                socket.sendMessage(
                    chat.key.remoteJid,
                    { text: "⚠️ Terjadi kesalahan saat memproses pendaftaran. Silakan coba lagi nanti." },
                    { quoted: chat }
                );
                return;
            }

            if (results.length > 0) {
                socket.sendMessage(chat.key.remoteJid, { text: "✅ Anda sudah terdaftar sebagai SELLER." }, { quoted: chat });
            } else {
                db.query(
                    "INSERT INTO sellers (seller_id, farm, owner, address, city, nik, timestamp) VALUES (?, ?, ?, ?, ?, ?, NOW())",
                    [seller_id, farmName, ownerName, address, city, nik],
                    err => {
                        if (err) {
                            console.error("Terjadi kesalahan saat menyimpan data ke database:", err);
                            socket.sendMessage(
                                chat.key.remoteJid,
                                { text: "⚠️ Terjadi kesalahan saat menyimpan data. Silakan coba lagi nanti." },
                                { quoted: chat }
                            );
                        } else {
                            socket.sendMessage(chat.key.remoteJid, { text: "✅ Anda telah berhasil terdaftar sebagai SELLER!" }, { quoted: chat });
                            console.log(`================[${seller_id}]================`);
                            console.log("Farm \t:", farmName);
                            console.log("Owner \t:", ownerName);
                            console.log("Alamat \t:", address);
                            console.log("Kota \t:", city);
                            console.log("NIK \t:", nik);
                            console.log("============================================\n");
                        }
                    }
                );
            }
        });
    }
};
