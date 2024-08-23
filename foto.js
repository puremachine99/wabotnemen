const { writeFile } = require('fs/promises');
const path = require('path');
const pino = require('pino');
const { downloadMediaMessage, makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');

// Fungsi untuk menyambungkan ke WhatsApp
async function connectWhatsapp() {
  const auth = await useMultiFileAuthState('session');

  // Pengaturan WaSocket
  const socket = makeWASocket({
    printQRInTerminal: true,
    browser: ['NP Bot', '', ''],
    auth: auth.state,
    logger: pino({ level: 'silent' }),
  });

  socket.ev.on('creds.update', auth.saveCreds);

  socket.ev.on('connection.update', async ({ connection }) => {
    if (connection === 'open') {
      console.log('Bot siap\nSilakan pindai QR code dengan akun WhatsApp yang akan digunakan sebagai bot.');
    } else if (connection === 'close') {
      console.log('Koneksi terputus, mencoba menyambung kembali...');
      setTimeout(async () => {
        await connectWhatsapp(); // reconnect setelah delay
      }, 5000); // jeda 5 detik sebelum mencoba menyambung kembali
    }
  });

  socket.ev.on('messages.upsert', async ({ messages, type }) => {
    const m = messages[0];

    console.log('Pesan diterima:', JSON.stringify(m.message, null, 2)); // Menampilkan struktur pesan yang diterima

    if (!m.message) return; // Jika tidak ada pesan

    const messageType = Object.keys(m.message)[0]; // Mendapatkan tipe pesan
    console.log('Tipe pesan:', messageType); // Menampilkan tipe pesan

    // Menangani media yang dikirim dengan messageContextInfo
    if (messageType === 'imageMessage' || messageType === 'videoMessage' || messageType === 'messageContextInfo') {
      const mediaMessage = m.message[messageType] || m.message['messageContextInfo']; // Mendapatkan media message
      const caption = mediaMessage.caption || ''; // Mendapatkan caption
      const mimeType = mediaMessage.mimetype || 'application/octet-stream'; // Mendapatkan mimeType, default ke 'application/octet-stream'

      console.log('MimeType:', mimeType); // Untuk debugging

      // Tentukan ekstensi file berdasarkan mimeType
      let fileExtension = '';
      if (mimeType.includes('jpeg')) fileExtension = 'jpeg';
      else if (mimeType.includes('png')) fileExtension = 'png';
      else if (mimeType.includes('gif')) fileExtension = 'gif';
      else if (mimeType.includes('jpg')) fileExtension = 'jpg';
      else if (mimeType.includes('mp4')) fileExtension = 'mp4';
      else fileExtension = 'bin'; // Jika tipe file tidak diketahui, gunakan ekstensi default

      try {
        // Mengunduh media
        const buffer = await downloadMediaMessage(
          m,
          'buffer',
          {},
          {
            logger: pino({ level: 'silent' }), // Logger untuk informasi debug
            reuploadRequest: socket.updateMediaMessage // Meminta pengunggahan ulang jika media telah dihapus
          }
        );

        // Membuat nama file dengan format timestamp untuk menghindari duplikat
        const timestamp = Date.now();
        const fileName = `media_${timestamp}.${fileExtension}`;
        const filePath = path.join('./seller-media', fileName);

        // Menyimpan file
        await writeFile(filePath, buffer);

        // Menampilkan informasi di console
        console.log(`File berhasil disimpan: ${filePath}`);
        console.log(`Caption: ${caption}`);
      } catch (error) {
        console.error('Gagal mengunduh atau menyimpan file:', error);
      }
    } else {
      console.log('Pesan yang diterima bukan gambar atau video.');
    }
  });
}

// Menjalankan fungsi koneksi WhatsApp
connectWhatsapp();
