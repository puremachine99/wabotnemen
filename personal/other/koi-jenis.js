 // Extract the query from the message
 const searchQuery = messageText.split(" ")[1] || "";
 let replyMessage = "";

 console.log("Search Query:", searchQuery);

 if (searchQuery) {
   // Perform fuzzy search
   const results = fuse.search(searchQuery);
   console.log("Search Results:", results);

   if (results.length > 0) {
     // Get the best match
     const bestMatch = results[0].item.name;
     replyMessage = `Maksud Anda: ${bestMatch}`;
   } else {
     replyMessage = "🛑 Maaf, jenis ikan tidak ditemukan.";
   }
 } else {
   replyMessage = "🛑 Harap masukkan jenis ikan yang ingin dicari.";
 }

 try {
   await socket.sendMessage(
     chat.key.remoteJid,
     {
       text: replyMessage,
       headerType: 1,
     },
     { quoted: chat }
   );
 } catch (error) {
   console.error("Error sending message:", error);
 }