const pino = require("pino");
const db = require("./db");
const { makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys");
const sellerUtils = require("./personal/seller/sellerUtils");

// ENV
const botname = "Lelang Bot";

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
      console.log(botname + " Siap di grup!");
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

    // Cek apakah ini adalah grup chat
    if (!sellerUtils.isGroupChat(chat)) {
      return;
    }

    // Handle command biasa di grup
    const messageText =
      (
        chat.message?.extendedTextMessage?.text ??
        chat.message?.ephemeralMessage?.message?.extendedTextMessage?.text ??
        chat.message?.conversation
      )?.toLowerCase() || "";
    const command = messageText.split(" ")[0];

    console.log(`${timestamp} ${nomorHp}:${messageText} [${messageType}]`);

    switch (command) {
      case "link-start":
        await handleLinkStartCommand(socket, chat, nomorHp);
        break;
      // Tambahkan command lain di sini sesuai kebutuhan
      default:
        break; // Abaikan command yang tidak dikenal
    }
  });
}

// Implementasi Command 'link-start'
async function handleLinkStartCommand(socket, chat, sellerId) {
  try {
    // Cek apakah pengguna adalah seller
    const isSeller = await sellerUtils.isSellerRegistered(sellerId);
    if (!isSeller) {
      // Silent fail, tidak ada respon apapun jika bukan seller
      return;
    }

    // Cek apakah seller memiliki lelang dengan status 'ready'
    const query = "SELECT lelang_id, timestamp_start FROM lelang WHERE seller_id = ? AND status = 'ready' LIMIT 1";
    const results = await new Promise((resolve, reject) => {
      db.query(query, [sellerId], (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });

    if (results.length === 0) {
      // Silent fail, tidak ada lelang dengan status 'ready'
      return;
    }

    const lelang = results[0];

    // Update status lelang menjadi 'on going'
    await new Promise((resolve, reject) => {
      const updateQuery = "UPDATE lelang SET status = 'on going', timestamp_start = NOW() WHERE lelang_id = ?";
      db.query(updateQuery, [lelang.lelang_id], (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });

    // Mulai timer lelang (misalnya 1 menit)
    setTimeout(async () => {
      // Ubah status lelang menjadi 'done' setelah timer habis
      await new Promise((resolve, reject) => {
        const endQuery = "UPDATE lelang SET status = 'done', timestamp_end = NOW() WHERE lelang_id = ?";
        db.query(endQuery, [lelang.lelang_id], (err, result) => {
          if (err) return reject(err);
          resolve(result);
        });
      });

      // Kirim pesan ke grup bahwa lelang telah selesai
      await socket.sendMessage(chat.key.remoteJid, {
        text: `🕒 Lelang dengan ID *${lelang.lelang_id}* telah selesai.`,
      });
    }, 60000); // Timer untuk 1 menit

    // Kirim pesan ke grup bahwa lelang telah dimulai
    await socket.sendMessage(chat.key.remoteJid, {
      text: `🚀 Lelang dengan ID *${lelang.lelang_id}* telah dimulai! Silakan mulai bidding.`,
    });
  } catch (error) {
    console.error("Error handling link-start command:", error);
    // Tangani kesalahan (misalnya, dengan mengirim pesan ke admin)
  }
}

// Menjalankan fungsi koneksi WhatsApp
connectWhatsapp();
