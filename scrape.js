const makeWASocket = require('@whiskeysockets/baileys').default;
const { useMultiFileAuthState, jidDecode } = require('@whiskeysockets/baileys');
const P = require('pino');

// ENV
const botname = "Nopel bot";

// Fungsi koneksi ke WhatsApp
async function connectWhatsapp() {
  const { state, saveCreds } = await useMultiFileAuthState('session');

  const socket = makeWASocket({
    printQRInTerminal: true,
    browser: [botname, "", ""],
    auth: state,
    logger: P({ level: 'silent' }),
  });

  socket.ev.on('creds.update', saveCreds);

  socket.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log('connection closed due to', lastDisconnect.error, ', reconnecting', shouldReconnect);
      if (shouldReconnect) {
        connectWhatsapp();
      }
    } else if (connection === 'open') {
      console.log(botname + ' Siap!');
    }
  });

  socket.ev.on('messages.upsert', async ({ messages, type }) => {
    const chat = messages[0];

    if (chat.key.fromMe || !chat.message) return; // Menghindari loop

    const messageType = Object.keys(chat.message)[0]; // Mendapatkan tipe pesan

    if (messageType === 'conversation' || messageType === 'extendedTextMessage') {
      const messageText =
        chat.message.conversation ||
        chat.message.extendedTextMessage.text.toLowerCase();

      // Command untuk menampilkan nomor pengguna
      if (messageText === 'me') {
        const userNumber = jidDecode(chat.key.remoteJid).user;
        const responseText = `Nomor Anda: @${userNumber}`;
        
        await socket.sendMessage(
          chat.key.remoteJid,
          { text: responseText, mentions: [chat.key.remoteJid] },
          { quoted: chat }
        );

        console.log(`Nomor ${userNumber} telah ditampilkan.`);
      }

      // Command untuk absen yang mengetag semua anggota grup
      if (messageText === '/absen' && chat.key.remoteJid.endsWith('@g.us')) {
        console.log("Perintah absen diterima di grup.");

        // Mendapatkan metadata grup
        const groupMetadata = await socket.groupMetadata(chat.key.remoteJid);
        const groupMembers = groupMetadata.participants;

        const mentions = groupMembers.map(member => member.id);
        const mentionText = mentions.map(mention => `@${jidDecode(mention).user}`).join(' ');

        await socket.sendMessage(
          chat.key.remoteJid,
          { text: mentionText, mentions },
          { quoted: chat }
        );

        console.log("Absen selesai.");
      }
    }
  });
}

// Menjalankan fungsi koneksi WhatsApp
connectWhatsapp();
