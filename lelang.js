// Dependency
const { writeFile } = require("fs/promises");
const fs = require("fs");
const path = require("path");
const pino = require("pino");
const { makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys");

// ENV
const botname = "Yuki Auction Moderator";

// Import command
const handleStartCommand = require("./commands/lelang/start");

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
      console.log(botname + " Ready !");
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

    // Handle command
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
      default:
        break; // Abaikan command yang tidak dikenal
    }
  });
}

// Menjalankan fungsi koneksi WhatsApp
connectWhatsapp();
