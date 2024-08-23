const db = require("../../db"); // Path harus sesuai

async function generateLelangId(jenisLelang) {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2); // Ambil dua digit terakhir tahun
  const month = (now.getMonth() + 1).toString().padStart(2, "0"); // Bulan 01-12
  let sequenceNumber = await getNextSequenceNumber(jenisLelang, year, month); // Ambil nomor urut berikutnya

  // Format nomor urut dengan padding
  const sequence = sequenceNumber.toString().padStart(3, "0"); // Nomor urut 0001-9999

  return `${jenisLelang}${year}${month}${sequence}`;
}

function getNextSequenceNumber(jenisLelang, year, month) {
  return new Promise((resolve, reject) => {
    const query = `
        SELECT COALESCE(MAX(CAST(SUBSTRING(lelang_id, 5, 4) AS UNSIGNED)), 0) + 1 AS next_seq
        FROM lelang
        WHERE lelang_id LIKE '${jenisLelang}${year}${month}%'
      `;

    db.query(query, (err, results) => {
      if (err) return reject(err);
      resolve(results[0].next_seq);
    });
  });
}

module.exports = async function handleLelangCommand(socket, chat, messageText) {
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

  const sellerid = chat.key.remoteJid.split("@")[0];

  // Cek apakah pengguna terdaftar sebagai seller
  db.query("SELECT COUNT(*) AS count FROM sellers WHERE seller_id = ?", [sellerid], async (err, results) => {
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
      await socket.sendMessage(
        chat.key.remoteJid,
        {
          text: "⚠️ Anda belum terdaftar sebagai seller. Silakan mendaftar terlebih dahulu sebelum membuat lelang.\n ketik : */reg* untuk detail nya",
        },
        { quoted: chat }
      );
      return;
    }

    // Cek apakah pengguna sudah memiliki lelang yang sedang berjalan
    db.query("SELECT status FROM lelang WHERE seller_id = ? ORDER BY timestamp_dibuat DESC LIMIT 1", [sellerid], async (err, auctionResults) => {
      if (err) {
        console.error("Error checking auction status:", err);
        await socket.sendMessage(
          chat.key.remoteJid,
          { text: "🛑 Terjadi kesalahan saat memeriksa status lelang. Silakan coba lagi nanti." },
          { quoted: chat }
        );
        return;
      }

      // Tambahkan cek format untuk jenis lelang
      const parts = messageText.split("#");
      if (parts.length < 4) {
        await socket.sendMessage(
          chat.key.remoteJid,
          {
            text:
              "ℹ️ *Cara Mendaftarkan Lelang Anda*\n" +
              "Silakan ketik dengan format:\n" +
              "`lelang # jenis lelang # judul lelang # deskripsi lelang`\n\n" +
              "Jenis Lelang:\n" +
              "RG: Reguler\n" +
              "KC: Keeping Contest\n" +
              "AZ: Azukari\n" +
              "GO: Go\n\n" +
              "*Contoh Pengisian:* \t\n" +
              "`lelang #RG#Lelang Koi Langka#Koi koi koi yang sangat langka`\n\n" +
              "_Pastikan data yang Anda masukkan benar dan sesuai dengan format yang ditentukan._",
          },
          { quoted: chat }
        );
        return;
      }

      const jenisLelang = parts[1].trim().toUpperCase();
      const judulLelang = parts[2].trim();
      const deskripsiLelang = parts[3].trim();

      // Validasi jenis lelang
      const validJenisLelang = ["RG", "KC", "AZ", "GO"];
      if (!validJenisLelang.includes(jenisLelang)) {
        await socket.sendMessage(
          chat.key.remoteJid,
          {
            text:
              "⚠️ Jenis lelang tidak valid. Jenis lelang yang tersedia adalah:\n" +
              "RG: Reguler\n" +
              "KC: Keeping Contest\n" +
              "AZ: Azukari\n" +
              "GO: Go\n",
          },
          { quoted: chat }
        );
        return;
      }

      if (auctionResults.length > 0 && auctionResults[0].status !== "done") {
        await socket.sendMessage(
          chat.key.remoteJid,
          {
            text:
              "⚠️ Anda hanya bisa menyelenggarakan satu lelang dalam satu waktu.\n" +
              "Gunakan command /ikan untuk mendaftarkan barang lelang, atau /start untuk memulai lelang.",
          },
          { quoted: chat }
        );
        return;
      }

      // Generate auction code
      const auctionCode = await generateLelangId(jenisLelang);

      // Insert auction into the database
      // Mapping singkatan jenis lelang ke bentuk jabarannya
      function translateJenisLelang(kode) {
        switch (kode.toLowerCase()) {
          case "rg":
            return "reguler";
          case "kc":
            return "keeping contest";
          case "az":
            return "azukari";
          case "go":
            return "go";
          default:
            throw new Error("Jenis lelang tidak valid");
        }
      }

      try {
        // Terjemahkan jenisLelang ke bentuk jabarannya
        const deskripsiJenisLelang = translateJenisLelang(jenisLelang);

        // Lakukan INSERT dengan deskripsi jenis lelang yang benar
        await db.query(
          `INSERT INTO lelang (lelang_id, seller_id, judul_lelang, deskripsi, jenis_lelang, status)
     VALUES (?, ?, ?, ?, ?, ?)`,
          [auctionCode, sellerid, judulLelang, deskripsiLelang, deskripsiJenisLelang, "draft"]
        );

        // Send confirmation message
        await socket.sendMessage(
          chat.key.remoteJid,
          {
            text:
              "🎉 Selamat, Anda telah terdaftar sebagai seller lelang kode lelang anda *" +
              auctionCode +
              "*\n" +
              `Seller ID: ${sellerid}\n` +
              `Status lelang: draft\n` +
              `Timestamp start: Kosong\n` +
              `Timestamp end: Kosong`,
          },
          { quoted: chat }
        );
        await socket.sendMessage(chat.key.remoteJid, {
          text: auctionCode,
        });
      } catch (error) {
        console.error("Error inserting auction data:", error);
        await socket.sendMessage(
          chat.key.remoteJid,
          { text: "🛑 Terjadi kesalahan saat menyimpan data lelang. Silakan coba lagi." },
          { quoted: chat }
        );
      }
    });
  });
};
