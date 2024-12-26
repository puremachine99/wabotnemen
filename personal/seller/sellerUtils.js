const db = require("../../db");

module.exports = {
  async isSellerRegistered(seller_id) {
    return new Promise((resolve, reject) => {
      db.query("SELECT * FROM sellers WHERE seller_id = ?", [seller_id], (err, results) => {
        if (err) {
          console.error("Error checking seller registration:", err);
          return reject(err);
        }
        resolve(results.length > 0);
      });
    });
  },

  async getSellerInfo(seller_id) {
    return new Promise((resolve, reject) => {
      db.query("SELECT * FROM sellers WHERE seller_id = ?", [seller_id], (err, results) => {
        if (err) {
          console.error("Error fetching seller info:", err);
          return reject(err);
        }
        resolve(results[0]);
      });
    });
  },

  isPersonalChat(chat) {
    return !chat.key.remoteJid.includes("@g.us");
  },
  isGroupChat(chat) {
    return chat.key.remoteJid.includes("@g.us");
  },
  async doesSellerHaveAuction(seller_id) {
    return new Promise((resolve, reject) => {
      db.query("SELECT lelang_id, status FROM lelang WHERE seller_id = ? ORDER BY timestamp_dibuat DESC LIMIT 1", [seller_id], (err, results) => {
        if (err) {
          console.error("Error checking seller auctions:", err);
          return reject(err);
        }
        resolve(results[0] || null);
      });
    });
  },

  async checkSellerDataComplete(seller_id) {
    return new Promise((resolve, reject) => {
      db.query(
        "SELECT * FROM sellers WHERE seller_id = ? AND farm IS NOT NULL AND owner IS NOT NULL AND address IS NOT NULL AND city IS NOT NULL AND ktp IS NOT NULL AND bank IS NOT NULL AND account_number IS NOT NULL",
        [seller_id],
        (err, results) => {
          if (err) {
            console.error("Error checking seller data completeness:", err);
            return reject(err);
          }
          resolve(results.length > 0);
        }
      );
    });
  },

  async isSellerValidated(seller_id) {
    return new Promise((resolve, reject) => {
      db.query("SELECT * FROM sellers WHERE seller_id = ? AND validasi IS NOT NULL", [seller_id], (err, results) => {
        if (err) {
          console.error("Error checking seller validation:", err);
          return reject(err);
        }
        resolve(results.length > 0);
      });
    });
  },
};
