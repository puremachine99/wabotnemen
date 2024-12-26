const axios = require('axios');

// Fungsi untuk mendapatkan alamat dari koordinat
async function getAddressFromLocation(lat, lon) {
  try {
    const response = await axios.get(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);
    return response.data.display_name;
  } catch (error) {
    console.error('Error fetching address:', error);
    return 'Alamat tidak ditemukan';
  }
}

// Fungsi untuk menangani pesan lokasi yang dibagikan
async function handleShareLocation(socket, chat, location) {
  const { lat, lon } = location;

  if (!lat || !lon) {
    await socket.sendMessage(
      chat.key.remoteJid,
      {
        text: "🛑 Lokasi yang dibagikan tidak valid. Pastikan lokasi yang dibagikan memiliki koordinat.",
      },
      { quoted: chat }
    );
    return;
  }

  const address = await getAddressFromLocation(lat, lon);

  await socket.sendMessage(
    chat.key.remoteJid,
    {
      text: `📍 Lokasi yang Anda bagikan:\n*Alamat:* ${address}`,
    },
    { quoted: chat }
  );
}

// Fungsi utama untuk menangani perintah lokasi
module.exports = async function handleLocationCommand(socket, chat, messageText) {
  if (messageText.trim() === 'location') {
    // Mengirim pesan meminta pengguna untuk membagikan lokasi mereka
    await socket.sendMessage(
      chat.key.remoteJid,
      {
        text: "📍 Silakan bagikan lokasi Anda.",
      },
      { quoted: chat }
    );
  } else {
    // Menangani pesan lokasi yang dibagikan
    const location = chat.message?.locationMessage;

    if (location) {
      await handleShareLocation(socket, chat, location);
    } else {
      await socket.sendMessage(
        chat.key.remoteJid,
        {
          text: "🛑 Untuk menggunakan perintah ini, silakan ketik `location` terlebih dahulu dan kemudian bagikan lokasi Anda.",
        },
        { quoted: chat }
      );
    }
  }
};
