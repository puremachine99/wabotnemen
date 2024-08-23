const db = require("../../db");
const Fuse = require("fuse.js");

// Daftar jenis ikan koi
const koiTypes = [
  "Kohaku",
  "Taisho Sanshoku (Sanke)",
  "Showa Sanshoku (Showa)",
  "Shiro Utsuri (Shiro)",
  "Goshiki",
  "Kujaku",
  "Kinginrin A",
  "Ochiba",
  "Hikari Moyomono",
  "Tancho",
  "Koromo",
  "Doitsu",
  "Kinginrin B",
  "Kawarimono A",
  "Asagi",
  "Shusui",
  "Bekko",
  "Hi/Ki Utsurimono",
  "Hikari Utsurimono",
  "Hikari Mujimono",
  "Kinginrin C",
  "Kawarimono B",
];

// Setup Fuse.js untuk pencocokan jenis ikan
const fuse = new Fuse(koiTypes, { includeScore: true, threshold: 0.3 });

module.exports = async function handleKoiCommand(socket, chat, messageText) {
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
        await socket.sendMessage(
          chat.key.remoteJid,
          {
            text: "⚠️ Anda belum terdaftar sebagai seller atau belum memasukkan nomor rekening. Silakan mendaftar dan update rekening terlebih dahulu.\nKetik : *reg* untuk registrasi dan *rekening #[bank]#[nomor]* untuk update nomor rekening.",
          },
          { quoted: chat }
        );
        return;
      }

      // Extract dan bersihkan data dari pesan
      const koiParts = messageText
        .split("#")
        .slice(1)
        .map(part => part.trim().replace(/[\n\t]/g, "")); // Membersihkan karakter \n dan \t

      if (koiParts.length === 0) {
        const tutorialMessage =
          "ℹ️ *Tutorial Mendaftarkan Ikan Koi*\n" +
          "Gunakan format berikut untuk mendaftarkan ikan koi:\n\n" +
          "`koi # kode koi # lelang_id # jenis koi # Gender(M/F/U) # ukuran [cm] # Open Bid # Kelipatan Bid # Buy it Now (isi 0 jika tidak ada)`\n\n" +
          "*Contoh Penggunaan:* \n" +
          "_jika anda ingin mendaftarkan koi yang diberi kode *A*, di dalam lelang *AZ2408001*, jenis koi nya *Goshiki* bergender *Female* dengan ukuran *45* cm, harga open bid *650*.000, kelipatan bid *50*.000, buy it now nya tidak aktif (*0*)_\n\n" +
          "`koi #A#AZ2408001#Goshiki#F#45#650#50#0`\n\n" +
          "_Pastikan Anda mengisi data dengan benar, Jenis koi otomatis akan dikoreksi oleh sistem._";

        await socket.sendMessage(chat.key.remoteJid, { text: tutorialMessage }, { quoted: chat });
        return;
      }

      // Validasi dan simpan data koi
      const [kodeIkan, lelangId, jenisIkan, gender, ukuran, openBid, kelipatanBid, buyItNow] = koiParts;

      // Validasi dan koreksi jenis ikan menggunakan fuse.js
      const fuseResult = fuse.search(jenisIkan);
      if (fuseResult.length === 0) {
        await socket.sendMessage(
          chat.key.remoteJid,
          { text: "🛑 Jenis ikan tidak valid. Gunakan salah satu jenis ikan yang valid: " + koiTypes.join(", ") },
          { quoted: chat }
        );
        return;
      }

      const validJenisIkan = fuseResult[0].item;

      // Insert koi data ke database
      db.query(
        "INSERT INTO koi (kode_ikan, lelang_id, seller_id, jenis_ikan, ukuran, gender, open_bid, kelipatan_bid, buy_it_now) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [kodeIkan, lelangId, sellerId, validJenisIkan, ukuran, gender, openBid, kelipatanBid, buyItNow],
        async (err, results) => {
          if (err) {
            console.error("Error inserting koi data:", err);
            await socket.sendMessage(
              chat.key.remoteJid,
              { text: "🛑 Terjadi kesalahan saat menyimpan data ikan. Sepertinya Kode ikan sama, atau format salah" },
              { quoted: chat }
            );
            return;
          }

          await socket.sendMessage(chat.key.remoteJid, { text: "✅ Data ikan berhasil disimpan." }, { quoted: chat });
        }
      );
    }
  );
};
