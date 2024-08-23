// Dependency
const { writeFile } = require("fs/promises");
const fs = require("fs");
const path = require("path");
const pino = require("pino");
const db = require("./db");
const { downloadMediaMessage, MessageType, MessageOptions, Mimetype, makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys");

// ENV
const botname = "Nopel bot";

// Import command Seller
const meCommand = require("./commands/seller/me");
const regCommand = require("./commands/seller/reg");
const rekeningCommand = require("./commands/seller/rekening");
const gantirekCommand = require("./commands/seller/gantirek");

// Import command auctions
const handleLelangCommand = require("./commands/auction/lelang");
const handleLelangListCommand = require("./commands/auction/lelang-list");
const handleLelangTinjauCommand = require("./commands/auction/lelang-tinjau");
const handleKoiCommand = require("./commands/auction/koi");
const handleKoiListCommand = require("./commands/auction/koi-list");
const handleKoiMediaCommand = require("./commands/auction/koi-media");
const handleKoiFotoCommand = require("./commands/auction/koi-foto");
const handleKoiVideoCommand = require("./commands/auction/koi-video");
const handleKoiHapusCommand = require("./commands/auction/koi-hapus");

// Import command other
const handleHelpCommand = require("./commands/other/help");

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

      try {
        // Parsing caption buat ambil lelang_id dan kode_ikan
        const [command, lelangId, kodeIkan] = caption.split("#");
        if (command.toLowerCase() !== "koi-media " || !lelangId || !kodeIkan) {
          console.log("Format caption tidak sesuai untuk command koi-media.");
          return;
        }

        // Cek lelang_id dan kode_ikan ada di database
        db.query("SELECT * FROM koi WHERE lelang_id = ? AND kode_ikan = ? AND seller_id = ?", [lelangId, kodeIkan, nomorHp], async (err, results) => {
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
          const fileName = `media_${Date.now()}.${fileExtension}`;
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
        });
      } catch (error) {
        console.error("Gagal download atau simpan file:", error);
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
        case "gantirek":
          await gantirekCommand(socket, chat, messageText);
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
        case "koi":
          await handleKoiCommand(socket, chat, messageText);
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
