const { downloadMediaMessage } = require("@whiskeysockets/baileys");
const fs = require("fs");
const path = require("path");

async function handleSertifikatCommand(socket, chat, messageText) {
    // Mengambil nomor HP pengirim
    const nomorHp = chat.key.remoteJid.replace("@s.whatsapp.net", "");
  
    // Jika hanya mengetik "sertifikat" tanpa parameter
    if (messageText.trim().toLowerCase() === "sertifikat") {
        // Kirim tutorial untuk penggunaan yang benar
        const tutorialMessage = "📚 *Tutorial Penggunaan Command Sertifikat* \n\n" +
                                "Untuk mengupload sertifikat ikan koi, Anda perlu mengirimkan gambar dengan kualitas HD (minimal 1280x720) dan menggunakan format caption yang benar.\n\n" +
                                "Cara menggunakan command:\n" +
                                "1. Kirimkan gambar sertifikat dengan kualitas HD ke chat ini.\n" +
                                "2. Pada caption atau pesan media tersebut, sertakan format command berikut: \n\t`sertifikat #kode_ikan`.\n\n" +
                                "Contoh:\n" +
                                "📸 Jika Anda memiliki sertifikat untuk ikan dengan kode `ABC`, gunakan caption atau pesan seperti ini: `sertifikat #ABC`.\n\n" +
                                "Pastikan kode ikan sesuai dengan yang ada di sistem Anda.";
  
        await socket.sendMessage(chat.key.remoteJid, { text: tutorialMessage }, { quoted: chat });
    } else {
        // Jika ada parameter lain dalam pesan, lanjutkan dengan proses sertifikat
        const [command, kodeIkan] = messageText.split("#");

        if (!kodeIkan) {
            await socket.sendMessage(chat.key.remoteJid, { text: "⚠️ Format salah. Gunakan format: `sertifikat #kode_ikan`." }, { quoted: chat });
            return;
        }

        // Pastikan pesan berisi media
        if (chat.message.imageMessage) {
            const mediaMessage = chat.message.imageMessage;
            const mimeType = mediaMessage.mimetype;

            // Validasi tipe file
            if (!mimeType.includes("image/")) {
                await socket.sendMessage(chat.key.remoteJid, { text: "⚠️ Hanya file gambar yang diperbolehkan untuk sertifikat." }, { quoted: chat });
                return;
            }

            // Pastikan kualitas HD (minimal 1280x720)
            const { height, width } = mediaMessage;

            if (width < 1280 || height < 720) {
                await socket.sendMessage(chat.key.remoteJid, { text: "⚠️ Kualitas gambar harus minimal HD (1280x720)." }, { quoted: chat });
                return;
            }

            try {
                // Buat direktori tujuan berdasarkan nomor HP dan kode_ikan
                const filePath = path.join("./seller-media", nomorHp, kodeIkan, "sertifikat");
                await fs.promises.mkdir(filePath, { recursive: true });

                // Buat file dengan format timestamp agar tidak duplikat
                const fileName = `sertifikat_${Date.now()}.jpg`;
                const fullPath = path.join(filePath, fileName);

                // Download media
                const buffer = await downloadMediaMessage(chat, "buffer", {}, {});

                // Simpan file
                await fs.promises.writeFile(fullPath, buffer);

                // Update database atau lakukan tindakan lain dengan sertifikat
                // Misal: db.query(`UPDATE koi SET sertifikat = ? WHERE kode_ikan = ? AND seller_id = ?`, [fullPath, kodeIkan, nomorHp]);

                // Beri tahu pengguna bahwa sertifikat berhasil diupload
                await socket.sendMessage(chat.key.remoteJid, { text: `✅ Sertifikat untuk ikan koi dengan kode *${kodeIkan}* telah berhasil diupload.` }, { quoted: chat });

                console.log(`File sertifikat berhasil disimpan: ${fullPath}`);
            } catch (error) {
                console.error("Gagal download atau simpan file:", error);
                await socket.sendMessage(chat.key.remoteJid, { text: "🛑 Terjadi kesalahan saat menyimpan sertifikat. Silakan coba lagi." }, { quoted: chat });
            }
        } else {
            await socket.sendMessage(chat.key.remoteJid, { text: "⚠️ Anda harus mengirimkan file gambar sertifikat." }, { quoted: chat });
        }
    }
}

module.exports = handleSertifikatCommand;
