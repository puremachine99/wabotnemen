const db = require("../../db");
const Fuse = require("fuse.js");
const handleKoiListCommand = require("./koi-list"); // Import handler untuk koi-list
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
  const sellerId = chat.key.remoteJid.split("@")[0];

  // Jika hanya mengetik "koi" tanpa parameter, berikan tutorial
  if (messageText.trim().toLowerCase() === "koi") {
    const tutorialMessage = 
      "===========================\n" +
      "🔰 *Tutorial Mendaftarkan Ikan Koi* \n" +
      "Gunakan format berikut untuk mendaftarkan ikan koi baru:\n\n" +
      "`koi #KODE#NAMA s cm#OB#KB`\n\n" +
      "Contoh:\n" +
      "`koi A#TANCHO SHOWA DOITSU 38 cm#100#25`\n\n" +
      "\t KODE : isikan huruf A s.d Z\n" +
      "\t NAMA s cm : Jenis ikan dengan ukuran cm\n" +
      "\t OB : Nilai open bid dalam ribuan rupiah\n" +
      "\t KB : Nilai Kelipatan Bid Dalam Rupiah\n" +
      "===========================\n\n" +
      "📸 *Untuk update foto ikan gabungan, kirimkan foto dengan caption atau pesan*\n" +
      "`lelang-banner`";
      
    await socket.sendMessage(chat.key.remoteJid, { text: tutorialMessage }, { quoted: chat });
    await handleKoiListCommand(socket, chat, "koi-list"); // Memanggil command koi-list secara langsung
        return;
  }

  // Extract dan bersihkan data dari pesan
  const koiParts = messageText.split("#").slice(1).map(part => part.trim().replace(/[\n\t]/g, "")); // Membersihkan karakter \n dan \t

  if (koiParts.length < 4) {
    await socket.sendMessage(
      chat.key.remoteJid,
      { text: "⚠️ Format tidak benar. Silakan ketik 'koi' untuk mendapatkan tutorial." },
      { quoted: chat }
    );
    return;
  }

  const [kodeIkan, jenisUkuran, openBid, kelipatanBid] = koiParts;

  // Validasi jenis ikan menggunakan fuse.js
  const [jenisIkan, ukuran] = extractJenisUkuran(jenisUkuran);
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

  // Ambil lelang_id terbaru yang berstatus draft milik user
  const lelangId = await getLatestDraftLelang(sellerId);
  if (!lelangId) {
    await socket.sendMessage(
      chat.key.remoteJid,
      { text: "⚠️ Anda belum memiliki lelang dengan status draft. Buat lelang terlebih dahulu." },
      { quoted: chat }
    );
    return;
  }

  // Insert koi data ke database
  db.query(
    "INSERT INTO koi (kode_ikan, lelang_id, seller_id, jenis_ikan, ukuran, gender, open_bid, kelipatan_bid, buy_it_now) VALUES (?, ?, ?, ?, ?, 'U', ?, ?, 0)",
    [kodeIkan, lelangId, sellerId, validJenisIkan, ukuran, openBid, kelipatanBid],
    async (err, results) => {
      if (err) {
        console.error("Error inserting koi data:", err);
        await socket.sendMessage(
          chat.key.remoteJid,
          { text: "🛑 Terjadi kesalahan saat menyimpan data ikan. Sepertinya Kode ikan sama, atau format salah." },
          { quoted: chat }
        );
        return;
      }

      await socket.sendMessage(
        chat.key.remoteJid,
        { text: "✅ Data ikan berhasil disimpan. Gunakan command berikut untuk memperbarui informasi:" },
        { quoted: chat }
      );

      const updateTutorialMessage = 
        "📚 *Cara Memperbarui Informasi Ikan Koi*\n\n" +
        "`koi-gender #A#M` => untuk ikan Jantan\n" +
        "`koi-gender #A#F` => untuk ikan Betina\n" +
        "`koi-gender #A#U` => untuk Unchecked\n\n" +
        "`koi-nama #A#Kohaku` => perubahan nama ikan\n" +
        "`koi-ob #A#700` => perubahan OB ikan\n" +
        "`koi-kb #A#25` => perubahan KB ikan\n" +
        "`koi-bin #A#1500` => perubahan harga Buy it now\n\n" +
        "📸 *Informasi Media*\n" +
        "`koi-media #A` => sertakan foto atau video\n" +
        "`koi-sertifikat #A` => sertakan sertifikat ikan";
      
      await socket.sendMessage(chat.key.remoteJid, { text: updateTutorialMessage }, { quoted: chat });
    }
  );
};

// Fungsi untuk mengambil lelang_id terbaru dengan status draft
function getLatestDraftLelang(sellerId) {
  return new Promise((resolve, reject) => {
    db.query(
      "SELECT lelang_id FROM lelang WHERE seller_id = ? AND status = 'draft' ORDER BY timestamp_dibuat DESC LIMIT 1",
      [sellerId],
      (err, results) => {
        if (err) return reject(err);
        resolve(results.length > 0 ? results[0].lelang_id : null);
      }
    );
  });
}

// Fungsi untuk mengekstrak jenis ikan dan ukuran dari string yang diberikan
function extractJenisUkuran(jenisUkuran) {
  const regex = /(.*)\s(\d+)\s?cm/i;
  const match = jenisUkuran.match(regex);
  if (match) {
    return [match[1], match[2]]; // Return jenis ikan dan ukuran
  }
  return [jenisUkuran, null]; // Jika tidak ada ukuran, kembalikan jenis saja
}
