const db = require("../../db");
const Fuse = require("fuse.js"); // Import Fuse.js untuk pencocokan jenis ikan
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

module.exports = async function handleKoiJenisCommand(socket, chat, messageText) {
  // Pastikan command hanya bisa digunakan di chat pribadi
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

  // Ekstrak kode koi dan jenis baru dari pesan
  const [command, kodeIkan, newJenisIkan] = messageText.split("#").map(part => part.trim());

  // Validasi input
  if (!kodeIkan || !newJenisIkan) {
    await socket.sendMessage(
      chat.key.remoteJid,
      {
        text: "⚠️ Format tidak benar. Gunakan format: koi-jenis #kode_koi#jenis_ikan",
      },
      { quoted: chat }
    );
    return;
  }

  // Validasi jenis ikan menggunakan Fuse.js
  const fuseResult = fuse.search(newJenisIkan);
  if (fuseResult.length === 0) {
    await socket.sendMessage(
      chat.key.remoteJid,
      {
        text: "🛑 Jenis ikan tidak valid. Gunakan salah satu jenis ikan yang valid: " + koiTypes.join(", "),
      },
      { quoted: chat }
    );
    return;
  }

  const validJenisIkan = fuseResult[0].item;

  // Cek apakah koi tersebut dimiliki oleh seller
  db.query(
    "SELECT COUNT(*) AS count FROM koi WHERE kode_ikan = ? AND seller_id = ?",
    [kodeIkan, sellerId],
    async (err, results) => {
      if (err) {
        console.error("Error checking koi ownership:", err);
        await socket.sendMessage(
          chat.key.remoteJid,
          { text: "🛑 Terjadi kesalahan saat memeriksa kepemilikan koi. Silakan coba lagi nanti." },
          { quoted: chat }
        );
        return;
      }

      if (results[0].count === 0) {
        await socket.sendMessage(
          chat.key.remoteJid,
          {
            text: "⚠️ Anda tidak memiliki koi dengan kode tersebut. Pastikan kode ikan benar.",
          },
          { quoted: chat }
        );
        // Trigger command koi-list untuk menampilkan detail koi yang ada
        await handleKoiListCommand(socket, chat, `koi-list ${kodeIkan}`); // Memanggil command koi-list dengan parameter kode_ikan
        return;
      }

      // Update jenis ikan koi
      db.query(
        "UPDATE koi SET jenis_ikan = ? WHERE kode_ikan = ? AND seller_id = ?",
        [validJenisIkan, kodeIkan, sellerId],
        async (err, results) => {
          if (err) {
            console.error("Error updating koi jenis:", err);
            await socket.sendMessage(
              chat.key.remoteJid,
              { text: "🛑 Terjadi kesalahan saat mengupdate jenis koi. Silakan coba lagi nanti." },
              { quoted: chat }
            );
            return;
          }

          if (results.affectedRows > 0) {
            await socket.sendMessage(
              chat.key.remoteJid,
              { text: `✅ Jenis ikan dengan kode *${kodeIkan}* berhasil diubah menjadi *${validJenisIkan}*.` },
              { quoted: chat }
            );
            // Setelah update berhasil, tampilkan detail ikan tersebut
            await handleKoiListCommand(socket, chat, `koi-list ${kodeIkan}`); // Memanggil command koi-list dengan parameter kode_ikan
          } else {
            await socket.sendMessage(
              chat.key.remoteJid,
              { text: "⚠️ Terjadi kesalahan, data tidak berhasil diperbarui. Coba lagi nanti." },
              { quoted: chat }
            );
          }
        }
      );
    }
  );
};
