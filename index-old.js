const { makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys");
const pino = require("pino"); //qr code generator

// import command Seller
const meCommand = require("./commands/seller/me");
const regCommand = require("./commands/seller/reg");
const rekeningCommand = require("./commands/seller/rekening");
const gantirekCommand = require("./commands/seller/gantirek");

// import command auctions
const handleLelangCommand = require("./commands/auction/lelang");
const handleLelangListCommand = require("./commands/auction/lelang-list");
const handleLelangTinjauCommand = require("./commands/auction/lelang-tinjau");
const handleKoiCommand = require("./commands/auction/koi");
const handleKoiListCommand = require("./commands/auction/koi-list");
const handleKoiFotoCommand = require("./commands/auction/koi-foto");
const handleKoiHapusCommand = require("./commands/auction/koi-hapus");

// import command other
const handleHelpCommand = require("./commands/other/help");

//koneksi whatsapp
async function connectWhatsapp() {
  const auth = await useMultiFileAuthState("session");

  // Pengaturan WaSocket
  const socket = makeWASocket({
    printQRInTerminal: true,
    browser: ["NP Bot", "", ""],
    auth: auth.state,
    logger: pino({ level: "silent" }),
  });

  socket.ev.on("creds.update", auth.saveCreds);

  socket.ev.on("connection.update", async ({ connection }) => {
    if (connection === "open") {
      console.log("Bot siap\nSilakan pindai QR code dengan akun WhatsApp yang akan digunakan sebagai bot.");
    } else if (connection === "close") {
      console.log("Koneksi terputus, mencoba menyambung kembali...");
      setTimeout(async () => {
        await connectWhatsapp(); // recon setelah delay
      }, 5000); // jeda 5 detik sebelum mencoba menyambung kembali
    }
  });

  socket.ev.on("messages.upsert", async ({ messages, type }) => {
    const chat = messages[0];

    if (chat.key.fromMe) return; // cek gak loop

    const messageText =
      (
        chat.message?.extendedTextMessage?.text ??
        chat.message?.ephemeralMessage?.message?.extendedTextMessage?.text ??
        chat.message?.conversation
      )?.toLowerCase() || "";
    const command = messageText.split(" ")[0];

    if (chat.message?.imageMessage || chat.message?.videoMessage) {
      const caption = chat.message.imageMessage?.caption || chat.message.videoMessage?.caption || "";
      switch (caption) {
        case "koi-foto":
          await handleKoiFotoCommand({ chat, socket });
          break;
        case "koi-video":
          await handleKoiVideoCommand({ chat, socket });
          break;
        default:
          console.log(`Command media tidak dikenal: ${mediaCommand}`);
      }
    } else {
      switch (command) {
        //================== Personal =====================
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
        // ===============Lelang===============
        case "lelang": //perbaiki kode lelang lebih simple (pakai username) untuk menghitung nomor pakai count
          await handleLelangCommand(socket, chat, messageText);
          break;
        case "lelang-list": //tanpa kode lelang, karena lelang max 1
          await handleLelangListCommand(socket, chat, messageText);
          break;
        case "lelang-tinjau": //tanpa kode lelang, karena lelang max 1
          await handleLelangTinjauCommand(socket, chat, messageText);
          break;
        case "koi": //input koi tanpa kode lelang
          await handleKoiCommand(socket, chat, messageText);
          break;
        case "koi-list": //input koi tanpa kode lelang
          await handleKoiListCommand(socket, chat, messageText);
          break;
        case "koi-foto": //input koi tanpa kode lelang
          await handleKoiFotoCommand(socket, chat, messageText);
          break;
        case "koi-hapus": //input koi tanpa kode lelang
          await handleKoiHapusCommand(socket, chat, messageText);
          break;
        //================= lain-lain ==================
        case "fuzzy":
          break;
        case "help":
          await handleHelpCommand(socket, chat, messageText);
          break;
        default:
          // await socket.sendMessage(chat.key.remoteJid, { text: "⚠️ Perintah tidak tersedia!" }, { quoted: chat });
          break;
      }
    }
  });
}

connectWhatsapp();

// to DO :
// insert : ====================================================
// daftarkan ikan = /lelang kode_ikan#jenis#OB#KB#Gender#ukuran#BIN
//  update : ===================================================
// /nama_ikan #kode ikan => update nama ikan
// /OB #kode_ikan => update OB ikan
// /KB #kode_ikan => update KB ikan
// /G #kode_ikan (M/F/U) => update gender ikan
// /CM #kode_ikan (satuan integer dalam CM) => update ukuran ikan
// /BIN #kode_ikan =>update buy it now ikan
// /foto #kode_ikan => upload foto satuan ikan
// /video #kode_ikan => upload video satuan ikan
// /list => menampilkan semua data ikan yang ikut lelang
// /start => mengirimkan request untuk penyelenggaraan lelang ke admin.
// next kode kode ini bakal di ganti ke nomor hp aja kyk e
// untuk lelang sing sudah selesai atau ada pemenang bakalan
// Proses input akan dipermudah daripada pakai # pake koma atau spasi
// =======================================lain-lain========================================
// sekarang ada mekanisme dimana command lelang-start
// dimana fungsi tersebut tidak bisa diakses ketika user tidak terdaftar dan belum update rekening
// belum membuat lelang
// tidak ada koi yang di pasang kan ke lelang
// dan ada warning message dimana user akan di tanya yes or no untuk start lelang
