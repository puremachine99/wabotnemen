const db = require("../../db");
const sellerUtils = require("./sellerUtils");
module.exports = async (socket, chat, messageText) => {
  const seller_id = chat.key.remoteJid.split("@")[0];

  const isRegistered = await sellerUtils.isSellerRegistered(seller_id);
  if (isRegistered) {
    const meCommand = require("./me");
    await meCommand(socket, chat);
    return;
  } else {
    // Seller belum terdaftar, cek apakah format pendaftaran benar
    if (messageText.split("#").length < 6) {
      await socket.sendMessage(
        chat.key.remoteJid,
        {
          text:
            "ℹ️ *Panduan Pendaftaran sebagai SELLER (Penyedia Lelang)*\nSilakan ketik dengan format:\n\n" +
            "`reg # nama_farm # nama_owner # alamat # kota # NIK`\n\n" +
            "*Contoh Pengisian:*\n" +
            "`reg #Koi Blitar#Siti Rahayu#Jl. Raya Blitar No. 22#Blitar#3512123456789012`\n\n" +
            "_Pastikan data yang Anda masukkan benar dan sesuai dengan KTP dan format yang ditentukan._",
        },
        { quoted: chat }
      );
    } else {
      // Parse data dan lakukan pendaftaran
      const [, farmName, ownerName, address, city, nik] = messageText.split("#");

      db.query(
        "INSERT INTO sellers (seller_id, farm, owner, address, city, nik, timestamp) VALUES (?, ?, ?, ?, ?, ?, NOW())",
        [seller_id, farmName, ownerName, address, city, nik],
        async err => {
          if (err) {
            console.error("Terjadi kesalahan saat menyimpan data ke database:", err);
            await socket.sendMessage(
              chat.key.remoteJid,
              { text: "⚠️ Terjadi kesalahan saat menyimpan data. Silakan coba lagi nanti." },
              { quoted: chat }
            );
          } else {
            await socket.sendMessage(chat.key.remoteJid, { text: "✅ Anda telah berhasil terdaftar sebagai SELLER!" }, { quoted: chat });
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
  }
};
