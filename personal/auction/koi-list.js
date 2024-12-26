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

      if (results[0].count === 0) {
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

      // Cek apakah ada parameter kode ikan
      const commandParts = messageText.split(" ");
      const kodeIkan = commandParts.length > 1 ? commandParts[1].trim().toUpperCase() : null;

      if (kodeIkan) {
        // Tampilkan detail ikan koi berdasarkan kode_ikan
        db.query(
          "SELECT * FROM koi WHERE kode_ikan = ? AND seller_id = ?",
          [kodeIkan, sellerId],
          async (err, results) => {
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
              await socket.sendMessage(
                chat.key.remoteJid,
                { text: `⚠️ Tidak ditemukan ikan koi dengan kode *${kodeIkan}*.` },
                { quoted: chat }
              );
              return;
            }

            const koi = results[0];
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

            // Tentukan status foto, video, dan sertifikat
            const foto = koi.foto !== null ? "Tersedia" : "-";
            const video = koi.video !== null ? "Tersedia" : "-";
            const sertifikat = koi.sertifikat !== null ? "Tersedia" : "-";

            const koiDetailMessage =
              `📋 *Detail Ikan Koi [${koi.kode_ikan}]*\n\n` +
              `   Jenis\t: ${koi.jenis_ikan}\n` +
              `   Ukuran\t: ${koi.ukuran} cm\n` +
              `   Gender\t: ${kelamin}\n` +
              `   OB\t: ${koi.open_bid} K\n` +
              `   KB\t: ${koi.kelipatan_bid} K\n` +
              `   BIN\t: ${koi.buy_it_now} K\n` +
              `   Foto\t: ${foto}\n` +
              `   Video\t: ${video}\n` +
              `   Sertif\t: ${sertifikat}`;

            await socket.sendMessage(chat.key.remoteJid, { text: koiDetailMessage }, { quoted: chat });
          }
        );
      } else {
        // Jika tidak ada kode ikan, tampilkan semua ikan koi dari lelang dengan status "draft"
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
              koi.sertifikat,
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
                { text: "⚠️ Anda belum mendaftarkan ikan koi." },
                { quoted: chat }
              );
              return;
            }

            // Ambil detail lelang dari ikan pertama dalam daftar
            let judulLelang = results[0].judul_lelang;
            let lelangId = results[0].lelang_id;

            let koiListMessage = `📜 *Daftar Ikan Koi Terdaftar (Draft: _${judulLelang}_ [${lelangId}])*\n`;

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

              // Tentukan status foto, video, dan sertifikat
              const foto = koi.foto !== null ? "Tersedia" : "-";
              const video = koi.video !== null ? "Tersedia" : "-";
              const sertifikat = koi.sertifikat !== null ? "Tersedia" : "-";

              koiListMessage += `\n*${koi.kode_ikan}* ${koi.jenis_ikan} [${koi.ukuran} cm]\n` +
                                `   Gender\t: ${kelamin}\n` +
                                `   OB\t: ${koi.open_bid} K\n` +
                                `   KB\t: ${koi.kelipatan_bid} K\n` +
                                `   BIN\t: ${koi.buy_it_now} K\n` +
                                `   Foto\t: ${foto}\n` +
                                `   Video\t: ${video}\n` +
                                `   Sertif\t: ${sertifikat}\n`;
            });

            await socket.sendMessage(chat.key.remoteJid, { text: koiListMessage }, { quoted: chat });
          }
        );
      }
    }
  );
};
