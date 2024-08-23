const mysql = require("mysql");

//ENV
const host = "localhost";
const user = "root";
const password = "";
const database = "yuki_auction";

// Setup Mysql
const db = mysql.createConnection({
  host: host,
  user: user,
  password: password,
  database: database,
});

// koneksi
db.connect(err => {
  if (err) {
    console.error("Terjadi kesalahan saat menghubungkan ke database:", err);
    process.exit(1); // exit klo gabisa nyambung ke database
  }
  console.log("Tersambung ke " + host + " database " + database + " aktif");
});
module.exports = db;
