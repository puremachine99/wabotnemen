// Dependency
const { writeFile } = require("fs/promises");
const fs = require("fs");
const path = require("path");
const pino = require("pino");
const db = require("./db");
const { downloadMediaMessage, makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys");
const sellerUtils = require("./personal/seller/sellerUtils"); // Import sellerUtils

// ENV
const botname = "Nopel bot";

// Import command Seller
const meCommand = require("./personal/seller/me");
const regCommand = require("./personal/seller/reg");
const editFarm = require("./personal/seller/edit-farm");
const editOwner = require("./personal/seller/edit-owner");
const editAlamat = require("./personal/seller/edit-alamat");
const editKota = require("./personal/seller/edit-kota");
const editNik = require("./personal/seller/edit-nik");
const rekeningCommand = require("./personal/seller/rekening");
const gantirekCommand = require("./personal/seller/edit-rekening");

// Import command auctions
const handleLelangCommand = require("./personal/auction/lelang");
const handleLelangListCommand = require("./personal/auction/lelang-list");
const handleLelangTinjauCommand = require("./personal/auction/lelang-tinjau");
const handleLelangGroupCommand = require("./personal/auction/lelang-group");
const handleLelangStartCommand = require("./personal/auction/lelang-start");
const handleKoiCommand = require("./personal/auction/koi");
const handleKoiJenisCommand = require("./personal/auction/koi-jenis");
const handleKoiGenderCommand = require("./personal/auction/koi-gender");
const handleKoiSizeCommand = require("./personal/auction/koi-size");
const handleKoiOBCommand = require("./personal/auction/koi-ob");
const handleKoiKBCommand = require("./personal/auction/koi-kb");
const handleKoiBINCommand = require("./personal/auction/koi-bin");
const handleKoiListCommand = require("./personal/auction/koi-list");
const handleKoiMediaCommand = require("./personal/auction/koi-media");
const handleKoiFotoCommand = require("./personal/auction/koi-foto");
const handleKoiVideoCommand = require("./personal/auction/koi-video");
const handleKoiSertifikatCommand = require("./personal/auction/koi-sertifikat");
const handleKoiHapusCommand = require("./personal/auction/koi-hapus");

// Import command other
const handleHelpCommand = require("./personal/other/help");

// Fungsi koneksi ke WhatsApp
async function connectWhatsapp() {
  const auth = await useMultiFileAuthState("session");

  // Setting WaSocket
  const socket = makeWASocket({
    printQRInTerminal: true,
    browser: [botname, "", ""],
    auth: auth.state,
    logger: pino({ level: "silent" }),
  });

  socket.ev.on("creds.update", auth.saveCreds);

  socket.ev.on("connection.update", async ({ connection }) => {
    if (connection === "open") {
      console.log(botname + " Siap !");
    } else if (connection === "close") {
      console.log("Koneksi putus, nyoba nyambung lagi...");
      setTimeout(async () => {
        await connectWhatsapp(); // Reconnect setelah jeda
      }, 5000); // jeda 5 detik sebelum nyoba lagi
    }
  });

  socket.ev.on("messages.upsert", async ({ messages, type }) => {
    const chat = messages[0];

    if (chat.key.fromMe) return; // Biar nggak loop

    if (!chat.message) return; // Kalau nggak ada pesan
    const messageType = Object.keys(chat.message)[0]; // Mendapatkan tipe pesan

    const nomorHp = chat.key.remoteJid.replace("@s.whatsapp.net", ""); // Mendapatkan nomor telepon pengirim
    const timestamp = new Date().toLocaleString(); // Mendapatkan waktu sekarang

    // Cek apakah ini adalah personal chat
    if (!sellerUtils.isPersonalChat(chat)) {
     
      return;
    }

    // Handle media message (KTP, koi-sertifikat, koi-media)
    if (chat.message.imageMessage || chat.message.videoMessage) {
      const mediaMessage = chat.message[messageType];
      const caption = mediaMessage.caption || ""; // Ambil caption
      const mimeType = mediaMessage.mimetype || "application/octet-stream"; // Ambil mimeType

      let fileExtension = "";
      if (mimeType.includes("jpeg")) fileExtension = "jpeg";
      else if (mimeType.includes("jpg")) fileExtension = "jpg";
      else if (mimeType.includes("mp4")) fileExtension = "mp4";
      else {
        console.log("Tipe file tidak didukung untuk update.");
        return;
      }

      if (caption.toLowerCase() === "ktp") {
        // Jika caption adalah 'ktp', simpan media sebagai KTP
        try {
          const ktpDir = path.join("./seller-media", nomorHp);
          await fs.promises.mkdir(ktpDir, { recursive: true });

          const ktpPath = path.join(ktpDir, `ktp.${fileExtension}`);
          const buffer = await downloadMediaMessage(chat, "buffer", {}, { logger: pino({ level: "silent" }) });
          await writeFile(ktpPath, buffer);

          // Update path KTP di database
          db.query("UPDATE sellers SET ktp = ? WHERE seller_id = ?", [ktpPath, nomorHp], async (err, result) => {
            if (err) {
              console.error("Error saat mengupdate path KTP di database:", err);
              await socket.sendMessage(
                chat.key.remoteJid,
                { text: "🛑 Terjadi kesalahan saat menyimpan KTP Anda. Silakan coba lagi." },
                { quoted: chat }
              );
              return;
            }

            if (result.affectedRows === 0) {
              await socket.sendMessage(chat.key.remoteJid, { text: "⚠️ Tidak ditemukan seller dengan ID Anda." }, { quoted: chat });
              return;
            }

            await socket.sendMessage(chat.key.remoteJid, { text: "✅ Foto KTP Anda berhasil disimpan." }, { quoted: chat });

            console.log(`KTP berhasil disimpan di: ${ktpPath}`);
          });
        } catch (error) {
          console.error("Gagal menyimpan KTP:", error);
          await socket.sendMessage(
            chat.key.remoteJid,
            { text: "🛑 Terjadi kesalahan saat menyimpan KTP Anda. Silakan coba lagi." },
            { quoted: chat }
          );
        }
      } else if (caption.toLowerCase().startsWith("koi-sertifikat")) {
        // Jika caption adalah 'koi-sertifikat', simpan media sebagai sertifikat
        try {
          const [command, kodeIkan] = caption.split("#");
          if (!kodeIkan) {
            await socket.sendMessage(
              chat.key.remoteJid,
              { text: "⚠️ Format tidak benar. Gunakan format: koi-sertifikat #kode_koi" },
              { quoted: chat }
            );
            return;
          }

          // Cek apakah koi tersebut dimiliki oleh seller
          db.query("SELECT * FROM koi WHERE kode_ikan = ? AND seller_id = ?", [kodeIkan, nomorHp], async (err, results) => {
            if (err) {
              console.error("Error saat pengecekan kode_ikan dan seller_id:", err);
              await socket.sendMessage(
                chat.key.remoteJid,
                { text: "🛑 Terjadi kesalahan saat pengecekan data ikan koi. Silakan coba lagi." },
                { quoted: chat }
              );
              return;
            }

            if (results.length === 0) {
              console.log("Kode Ikan tidak ditemukan, sertifikat tidak disimpan.");
              await socket.sendMessage(chat.key.remoteJid, { text: `⚠️ Kode Ikan *${kodeIkan}* tidak ditemukan.` }, { quoted: chat });
              return;
            }

            // Buat direktori tujuan berdasarkan nomor HP dan kode_ikan
            const filePath = path.join("./seller-media", nomorHp, kodeIkan);
            await fs.promises.mkdir(filePath, { recursive: true });

            // Simpan sertifikat dengan nama sertifikat.ext (jpg/png)
            const fileName = `sertifikat.${fileExtension}`;
            const fullPath = path.join(filePath, fileName);

            // Download dan simpan file
            const buffer = await downloadMediaMessage(chat, "buffer", {}, { logger: pino({ level: "silent" }) });
            await writeFile(fullPath, buffer);

            // Update database dengan path sertifikat yang baru
            db.query("UPDATE koi SET sertifikat = ? WHERE kode_ikan = ? AND seller_id = ?", [fullPath, kodeIkan, nomorHp], async (err, result) => {
              if (err) {
                console.error("Error updating koi certificate path:", err);
                await socket.sendMessage(
                  chat.key.remoteJid,
                  { text: "🛑 Terjadi kesalahan saat menyimpan sertifikat. Silakan coba lagi." },
                  { quoted: chat }
                );
                return;
              }

              if (result.affectedRows > 0) {
                await socket.sendMessage(
                  chat.key.remoteJid,
                  { text: `✅ Sertifikat untuk ikan koi dengan kode *${kodeIkan}* telah berhasil disimpan.` },
                  { quoted: chat }
                );
              } else {
                await socket.sendMessage(
                  chat.key.remoteJid,
                  { text: "⚠️ Terjadi kesalahan, sertifikat tidak berhasil diperbarui. Coba lagi nanti." },
                  { quoted: chat }
                );
              }
            });

            console.log(`Sertifikat berhasil disimpan: ${fullPath}`);
          });
        } catch (error) {
          console.error("Gagal menyimpan sertifikat:", error);
          await socket.sendMessage(
            chat.key.remoteJid,
            { text: "🛑 Terjadi kesalahan saat menyimpan sertifikat. Silakan coba lagi." },
            { quoted: chat }
          );
        }
      } else {
        try {
          // Parsing caption buat ambil lelang_id dan kode_ikan
          const [command, lelangId, kodeIkan] = caption.split("#");
          if (command.toLowerCase() !== "koi-media " || !lelangId || !kodeIkan) {
            console.log("Format caption tidak sesuai untuk command koi-media.");
            return;
          }

          // Cek lelang_id dan kode_ikan ada di database
          db.query(
            "SELECT * FROM koi WHERE lelang_id = ? AND kode_ikan = ? AND seller_id = ?",
            [lelangId, kodeIkan, nomorHp],
            async (err, results) => {
              if (err) {
                console.error("Error saat pengecekan lelang_id dan kode_ikan:", err);
                await socket.sendMessage(
                  chat.key.remoteJid,
                  { text: "🛑 Terjadi kesalahan saat pengecekan data ikan koi. Silakan coba lagi." },
                  { quoted: chat }
                );
                return;
              }

              if (results.length === 0) {
                console.log("Lelang ID atau Kode Ikan tidak ditemukan, media tidak disimpan.");
                await socket.sendMessage(
                  chat.key.remoteJid,
                  { text: `⚠️ Lelang ID *${lelangId}* atau Kode Ikan *${kodeIkan}* tidak ditemukan.` },
                  { quoted: chat }
                );
                return;
              }

              // Buat direktori tujuan berdasarkan nomor HP, lelang_id, dan kode_ikan
              const filePath = path.join("./seller-media", nomorHp, lelangId, kodeIkan);
              await fs.promises.mkdir(filePath, { recursive: true });

              // Buat file dengan format timestamp biar nggak duplikat
              const fileName = `media_${kodeIkan}.${fileExtension}`;
              const fullPath = path.join(filePath, fileName);

              // Download media
              const buffer = await downloadMediaMessage(
                chat,
                "buffer",
                {},
                {
                  logger: pino({ level: "silent" }), // Logger buat info debug
                  reuploadRequest: socket.updateMediaMessage, // Request reupload kalau media udah ilang
                }
              );

              // Simpan file
              await writeFile(fullPath, buffer);

              // Tentukan kolom yang akan diupdate berdasarkan tipe file
              const columnToUpdate = mimeType.includes("mp4") ? "video" : "foto";

              // Update database dengan path file yang baru
              db.query(
                `UPDATE koi SET ${columnToUpdate} = ? WHERE lelang_id = ? AND kode_ikan = ? AND seller_id = ?`,
                [fullPath, lelangId, kodeIkan, nomorHp],
                async (err, result) => {
                  if (err) {
                    console.error("Error updating koi photo/video path:", err);
                    await socket.sendMessage(
                      chat.key.remoteJid,
                      { text: "🛑 Terjadi kesalahan saat mengupdate data ikan koi. Silahkan coba lagi." },
                      { quoted: chat }
                    );
                    return;
                  }

                  if (result.affectedRows === 0) {
                    await socket.sendMessage(
                      chat.key.remoteJid,
                      { text: `⚠️ Tidak ditemukan ikan koi dengan lelang ID ${lelangId} dan kode ikan ${kodeIkan}.` },
                      { quoted: chat }
                    );
                    return;
                  }

                  // Beri tahu pengguna bahwa media telah berhasil diupdate
                  await socket.sendMessage(
                    chat.key.remoteJid,
                    {
                      text: `✅ ${
                        columnToUpdate === "foto" ? "Foto" : "Video"
                      } untuk ikan koi dengan kode *${kodeIkan}* pada lelang *${lelangId}* telah berhasil diupdate.`,
                    },
                    { quoted: chat }
                  );
                }
              );

              console.log(`File berhasil disimpan: ${fullPath}`);
            }
          );
        } catch (error) {
          console.error("Gagal download atau simpan file:", error);
        }
      }
    } else {
      // Handle command biasa
      const messageText =
        (
          chat.message?.extendedTextMessage?.text ??
          chat.message?.ephemeralMessage?.message?.extendedTextMessage?.text ??
          chat.message?.conversation
        )?.toLowerCase() || "";
      const command = messageText.split(" ")[0];

      console.log(`${timestamp} ${nomorHp}:${messageText} [${messageType}]`);

      switch (command) {
        case "ping":
          await socket.sendMessage(chat.key.remoteJid, { text: "pong!" }, { quoted: chat });
          break;
        case "me":
          await meCommand(socket, chat);
          break;
        case "reg":
          await regCommand(socket, chat, messageText);
          break;
        case "rekening":
          await rekeningCommand(socket, chat, messageText);
          break;
        case "edit-rekening":
          await gantirekCommand(socket, chat, messageText);
          break;
        case "edit-farm":
          await editFarm(socket, chat, messageText);
          break;
        case "edit-owner":
          await editOwner(socket, chat, messageText);
          break;
        case "edit-alamat":
          await editAlamat(socket, chat, messageText);
          break;
        case "edit-kota":
          await editKota(socket, chat, messageText);
          break;
        case "edit-nik":
          await editNik(socket, chat, messageText);
          break;
        case "lelang":
          await handleLelangCommand(socket, chat, messageText);
          break;
        case "lelang-list":
          await handleLelangListCommand(socket, chat, messageText);
          break;
        case "lelang-tinjau":
          await handleLelangTinjauCommand(socket, chat, messageText);
          break;
        case "lelang-start":
          await handleLelangStartCommand(socket, chat, messageText);
          break;
        case "lelang-group":
          await handleLelangGroupCommand(socket, chat, messageText);
          break;
        case "koi":
          await handleKoiCommand(socket, chat, messageText);
          break;

        case "koi-jenis":
          await handleKoiJenisCommand(socket, chat, messageText);
          break;
        case "koi-size":
          await handleKoiSizeCommand(socket, chat, messageText);
          break;
        case "koi-gender":
          await handleKoiGenderCommand(socket, chat, messageText);
          break;
        case "koi-ob":
          await handleKoiOBCommand(socket, chat, messageText);
          break;
        case "koi-kb":
          await handleKoiKBCommand(socket, chat, messageText);
          break;
        case "koi-bin":
          await handleKoiBINCommand(socket, chat, messageText);
          break;
        case "koi-list":
          await handleKoiListCommand(socket, chat, messageText);
          break;
        case "koi-media":
          await handleKoiMediaCommand(socket, chat, messageText);
          break;
        case "koi-foto":
          await handleKoiFotoCommand(socket, chat, messageText);
          break;
        case "koi-video":
          await handleKoiVideoCommand(socket, chat, messageText);
          break;
        case "koi-sertifikat":
          await handleKoiSertifikatCommand(socket, chat, messageText);
          break;
        case "koi-hapus":
          await handleKoiHapusCommand(socket, chat, messageText);
          break;
        case "help":
          await handleHelpCommand(socket, chat, messageText);
          break;
        default:
          break; // Abaikan command yang tidak dikenal
      }
    }
  });
}

// Menjalankan fungsi koneksi WhatsApp
connectWhatsapp();
