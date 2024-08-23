const db = require("../../db");

module.exports = async function handleLelangTinjauCommand(socket, chat, messageText) {
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

  // Ambil data seller lengkap
  db.query(
    "SELECT farm,owner,city FROM sellers WHERE seller_id = ? AND bank IS NOT NULL AND account_number IS NOT NULL",
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

      if (results.length === 0) {
        await socket.sendMessage(
          chat.key.remoteJid,
          {
            text: "⚠️ Anda belum terdaftar sebagai seller atau belum memasukkan nomor rekening. Silakan mendaftar dan update rekening terlebih dahulu.\nKetik : *reg* untuk registrasi dan *rekening #[bank]#[nomor]* untuk update nomor rekening.",
          },
          { quoted: chat }
        );
        return;
      }

      const seller = results[0];

      // Cek apakah seller memiliki lelang dengan status 'draft'
      db.query("SELECT * FROM lelang WHERE seller_id = ? AND status = 'draft'", [sellerId], async (err, lelang) => {
        if (err) {
          console.error("Error fetching lelang:", err);
          await socket.sendMessage(
            chat.key.remoteJid,
            { text: "🛑 Terjadi kesalahan saat mengambil data lelang. Silakan coba lagi." },
            { quoted: chat }
          );
          return;
        }

        if (lelang.length === 0) {
          await socket.sendMessage(
            chat.key.remoteJid,
            { text: "⚠️ Anda belum membuat lelang dengan status 'draft'. Silakan buat lelang terlebih dahulu." },
            { quoted: chat }
          );
          return;
        }

        const auction = lelang[0];

        // Cek apakah ada koi yang terdaftar di lelang ini
        db.query("SELECT * FROM koi WHERE seller_id = ? AND lelang_id = ?", [sellerId, auction.lelang_id], async (err, koiList) => {
          if (err) {
            console.error("Error fetching koi list:", err);
            await socket.sendMessage(
              chat.key.remoteJid,
              { text: "🛑 Terjadi kesalahan saat mengambil data ikan. Silakan coba lagi." },
              { quoted: chat }
            );
            return;
          }

          if (koiList.length === 0) {
            await socket.sendMessage(
              chat.key.remoteJid,
              { text: "⚠️ Tidak ada ikan koi yang terdaftar di lelang ini. Silakan tambahkan koi ke lelang terlebih dahulu." },
              { quoted: chat }
            );
            return;
          }

          // Buat tampilan lelang yang lengkap dan rapi
          let previewMessage =
            "📢 *Tinjauan Lelang Anda*\n\n" +
            "*" +auction.judul_lelang.split(" ").map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(" ") +" #" +auction.lelang_id +"*\n" +"_" +auction.deskripsi +"_ \n" +
            "Seller\t: " + seller.owner + " (" +seller.farm +")\n" +
            "Kota\t: " + seller.city +
            "\n\n";

          previewMessage += "*Daftar Ikan Koi Lelang*\n";
          koiList.forEach((koi, index) => {
            const buyItNow = koi.buy_it_now === 0 ? "-" : `${koi.buy_it_now} K`;

            let genderText = "";
            switch (koi.gender.toUpperCase()) {
              case "M":
                genderText = "Male";
                break;
              case "F":
                genderText = "Female";
                break;
              default:
                genderText = "Uncheck";
            }
            const foto = koi.foto !== null ? "*foto " +koi.kode_ikan.toUpperCase() +"* " : "-";
            const video = koi.video !== null ? "*video " +koi.kode_ikan.toUpperCase() +"* " : "-";
            previewMessage +=
              "\n" +"*[" +koi.kode_ikan.toUpperCase() +"]* " +koi.jenis_ikan +" [" +koi.ukuran +" cm]\n"+
              "   Gender\t: " + genderText + "\n" +
              "   OB\t: " + koi.open_bid + " K\n" +
              "   KB\t: " + koi.kelipatan_bid + " K\n" +
              "   BIN\t: " + buyItNow + "\n"+
              "   Foto\t: " + foto + "\n"+
              "   Video\t: " + video + "\n";
          });

          await socket.sendMessage(chat.key.remoteJid, { text: previewMessage }, { quoted: chat });
        });
      });
    }
  );
};
