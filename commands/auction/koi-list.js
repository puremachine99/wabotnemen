const db = require("../../db"); // Pastikan path ini sesuai dengan struktur direktori Anda

module.exports = async function handleKoiListCommand(socket, chat, messageText) {
  // Cek apakah command diakses di chat pribadi atau grup
  if (chat.key.remoteJid.includes("-")) {
    await socket.sendMessage(
      chat.key.remoteJid,
      {
        text: "⚠️ Perintah ini tidak bisa digunakan di grup. Silakan gunakan perintah ini di chat pribadi.",
      },
      { quoted: chat }
    );
    return;
  }

  const sellerId = chat.key.remoteJid.split("@")[0];

  // Cek apakah pengguna terdaftar sebagai seller dan memiliki nomor rekening
  db.query(
    "SELECT COUNT(*) AS count FROM sellers WHERE seller_id = ? AND bank IS NOT NULL AND account_number IS NOT NULL",
    [sellerId],
    async (err, results) => {
      if (err) {
        console.error("Error checking seller status:", err);
        await socket.sendMessage(
          chat.key.remoteJid,
          { text: "🛑 Terjadi kesalahan saat memeriksa status seller. Silakan coba lagi nanti." },
          { quoted: chat }
        );
        return;
      }

      const seller = results[0];
      if (seller.count === 0) {
        // Seller tidak terdaftar atau belum update rekening
        await socket.sendMessage(
          chat.key.remoteJid,
          {
            text: "⚠️ Anda belum terdaftar sebagai seller atau belum memasukkan nomor rekening. Silakan mendaftar dan update rekening terlebih dahulu.\nKetik : *reg* untuk registrasi dan *rekening #[bank]#[nomor]* untuk update nomor rekening.",
          },
          { quoted: chat }
        );
        return;
      }

      // Cek apakah ada lelang_id yang diberikan
      const lelangId = messageText.split(" ")[1];

      if (lelangId) {
        // Tampilkan ikan koi dari lelang tertentu
        db.query("SELECT * FROM koi WHERE lelang_id = ? AND seller_id = ?", [lelangId, sellerId], async (err, results) => {
          if (err) {
            console.error("Error fetching koi details:", err);
            await socket.sendMessage(
              chat.key.remoteJid,
              { text: "🛑 Terjadi kesalahan saat mengambil data ikan. Silakan coba lagi." },
              { quoted: chat }
            );
            return;
          }

          if (results.length === 0) {
            await socket.sendMessage(chat.key.remoteJid, { text: `⚠️ Tidak ditemukan ikan koi untuk lelang ID ${lelangId}.` }, { quoted: chat });
            return;
          }

          let koiListMessage = `📜 *Daftar Ikan Koi untuk Lelang ${lelangId}*\n`;
          results.forEach((koi, index) => {
            koiListMessage +=
              `\n${index + 1}. Kode Ikan: ${koi.kode_ikan}\n` +
              `   Jenis: ${koi.jenis_ikan}\n` +
              `   Ukuran: ${koi.ukuran} cm\n` +
              `   OB: ${koi.open_bid} K\n` +
              `   KB: ${koi.kelipatan_bid} K\n` +
              `   BIN: ${koi.buy_it_now} K\n`;
          });

          await socket.sendMessage(chat.key.remoteJid, { text: koiListMessage }, { quoted: chat });
        });
      } else {
        // Jika tidak ada lelang_id, tampilkan semua ikan koi dari lelang dengan status "draft"
        db.query(
          `SELECT 
              koi.kode_ikan,
              koi.jenis_ikan,
              koi.ukuran,
              koi.gender,
              koi.open_bid,
              koi.kelipatan_bid,
              koi.buy_it_now,
              koi.foto,
              koi.video,
              a.lelang_id,
              a.judul_lelang
          FROM 
              koi 
          JOIN 
              lelang a ON koi.lelang_id = a.lelang_id
          WHERE 
              koi.seller_id = ? AND a.status = 'draft'`,
          [sellerId],
          async (err, results) => {
            if (err) {
              console.error("Error fetching koi list:", err);
              await socket.sendMessage(
                chat.key.remoteJid,
                { text: "🛑 Terjadi kesalahan saat mengambil data ikan. Silakan coba lagi." },
                { quoted: chat }
              );
              return;
            }

            if (results.length === 0) {
              await socket.sendMessage(
                chat.key.remoteJid,
                { text: "⚠️ Anda belum mendaftarkan ikan koi untuk lelang atau semua lelang sudah selesai." },
                { quoted: chat }
              );
              return;
            }
            if (results.length > 0) {
              // Extract auction details from the first koi item
              let judulLelang = results[0].judul_lelang;
              let lelangId = results[0].lelang_id;
            
              var koiListMessage = "📜 *Daftar Ikan Koi Terdaftar (Draft: _" + judulLelang + "_ [" + lelangId + "])*\n";
            
              results.forEach(koi => {
                let kelamin;
                switch (koi.gender.toLowerCase()) {
                  case "m":
                    kelamin = "Male";
                    break;
                  case "f":
                    kelamin = "Female";
                    break;
                  default:
                    kelamin = "Unchecked";
                    break;
                }
              // Tentukan status foto dan video
                const foto = koi.foto !== null ? "Tersedia" : "-";
                const video = koi.video !== null ? "Tersedia" : "-";
                koiListMessage += "\n*[" + koi.kode_ikan.toUpperCase() + "]* " + koi.jenis_ikan +" ["+koi.ukuran+" cm]\n"+
                  "   Gender\t: " + kelamin + " \n" +
                  "   OB\t: " + koi.open_bid + " K\n" +
                  "   KB \t: " + koi.kelipatan_bid + " K\n" +
                  "   BIN\t: " + koi.buy_it_now + " K\n"+
                  "   Foto\t: " + foto + "\n"+
                  "   Video\t: " + video + "\n";
              });
            
              await socket.sendMessage(chat.key.remoteJid, { text: koiListMessage },{quoted:chat});
            } else {
              await socket.sendMessage(chat.key.remoteJid, { text: "⚠️ Anda belum mendaftarkan ikan koi untuk lelang." }, { quoted: chat });
            }
          }
        );
      }
    }
  );
};
