const db = require("../../db"); // Path harus sesuai
const sellerUtils = require("../seller/sellerUtils"); // Module yang berisi utility untuk pengecekan seller

async function generateLelangId(jenisLelang) {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2); // Ambil dua digit terakhir tahun
    const month = (now.getMonth() + 1).toString().padStart(2, "0"); // Bulan 01-12
    let sequenceNumber = await getNextSequenceNumber(jenisLelang, year, month); // Ambil nomor urut berikutnya

    const sequence = sequenceNumber.toString().padStart(3, "0"); // Nomor urut 000-999

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

module.exports = async function handleLelangCommand(socket, chat) {
    const sellerid = chat.key.remoteJid.split("@")[0];

    try {
        // Cek apakah seller terdaftar dan data lengkap
        const isComplete = await sellerUtils.checkSellerDataComplete(sellerid);
        if (!isComplete) {
            await socket.sendMessage(
                chat.key.remoteJid,
                {
                    text: "⚠️ Data Anda belum lengkap. Pastikan Anda sudah melengkapi data termasuk rekening.\nGunakan command */edit* untuk memperbarui data Anda.",
                },
                { quoted: chat }
            );
            return;
        }

        // Cek apakah seller sudah divalidasi oleh admin
        const isValidated = await sellerUtils.isSellerValidated(sellerid);
        if (!isValidated) {
            await socket.sendMessage(
                chat.key.remoteJid,
                {
                    text: "⚠️ Akun Anda belum divalidasi oleh admin. Silakan tunggu hingga akun Anda divalidasi.",
                },
                { quoted: chat }
            );
            return;
        }

        // Cek apakah seller sudah memiliki lelang yang berjalan
        const auctionData = await sellerUtils.doesSellerHaveAuction(sellerid);

        if (auctionData) {
            if (auctionData.status === "draft") {
                await socket.sendMessage(
                    chat.key.remoteJid,
                    {
                        text: `⚠️ Anda sudah memiliki lelang dalam status *draft*. Lelang ID: ${auctionData.lelang_id}\nSilakan lanjutkan lelang ini atau tambahkan ikan.`,
                    },
                    { quoted: chat }
                );
                // Panggil command untuk meninjau lelang
                const handleLelangTinjauCommand = require("./lelang-tinjau");
                await handleLelangTinjauCommand(socket, chat, auctionData.lelang_id);
                return;
            } else if (auctionData.status === "ready" || auctionData.status === "on going") {
                await socket.sendMessage(
                    chat.key.remoteJid,
                    {
                        text: `⚠️ Anda sudah memiliki lelang yang berstatus *${auctionData.status}*. Silakan selesaikan lelang tersebut terlebih dahulu sebelum membuat lelang baru.`,
                    },
                    { quoted: chat }
                );
                return;
            }
        }

        // Ambil nama farm seller
        const sellerInfo = await sellerUtils.getSellerInfo(sellerid);
        const namaFarm = sellerInfo.farm;

        // Generate auction code
        const auctionCode = await generateLelangId("RG");

        // Judul lelang adalah nama farm + nomor urut
        const judulLelang = `${namaFarm} #${await getNextSequenceNumber("RG", new Date().getFullYear().toString().slice(-2), (new Date().getMonth() + 1).toString().padStart(2, "0"))}`;

        await db.query(
            `INSERT INTO lelang (lelang_id, seller_id, jenis_lelang, judul_lelang, status)
            VALUES (?, ?, ?, ?, ?)`,
            [auctionCode, sellerid, "reguler", judulLelang, "draft"]
        );

        await socket.sendMessage(
            chat.key.remoteJid,
            {
                text: "🎉 Selamat, Anda telah dibuatkan lelang baru dengan kode *" +
                    auctionCode +
                    "*\n" +
                    `Judul: ${judulLelang}\n` +
                    `Status lelang: draft`,
            },
            { quoted: chat }
        );
    } catch (error) {
        console.error("Error handling lelang command:", error);
        await socket.sendMessage(
            chat.key.remoteJid,
            { text: "🛑 Terjadi kesalahan saat memproses lelang Anda. Silakan coba lagi." },
            { quoted: chat }
        );
    }
};
