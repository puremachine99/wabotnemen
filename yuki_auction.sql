-- Database creation and settings
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

-- Table structure for `sellers`
CREATE TABLE `sellers` (
  `seller_id` varchar(36) NOT NULL,  -- phone number as seller_id
  `farm` varchar(20) NOT NULL,
  `owner` varchar(30) NOT NULL,
  `address` text NOT NULL,
  `city` varchar(20) NOT NULL,
  `nik` varchar(16) NOT NULL,
  `timestamp` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `bank` varchar(36) DEFAULT NULL,
  `account_number` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`seller_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table structure for `lelang`
CREATE TABLE `lelang` (
  `lelang_id` char(12) NOT NULL,  -- Format: 2 char jenis_lelang, 2 tahun, 2 bulan, 3 no urut (e.g., RG2408001)
  `seller_id` varchar(36) NOT NULL,  -- Foreign key reference to sellers
  `jenis_lelang` enum('reguler','kc','azukari','go') NOT NULL,
  `aktif` tinyint(1) NOT NULL,
  `judul_lelang` text NOT NULL,
  `deskripsi` text DEFAULT NULL,
  `status` enum('draft','on going','done') NOT NULL,
  `pemenang_lelang` varchar(36) DEFAULT NULL,
  `timestamp_dibuat` timestamp NOT NULL DEFAULT current_timestamp(),
  `timestamp_start` timestamp NULL DEFAULT NULL,
  `timestamp_end` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`lelang_id`),
  KEY `seller_id` (`seller_id`),
  CONSTRAINT `lelang_ibfk_1` FOREIGN KEY (`seller_id`) REFERENCES `sellers` (`seller_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table structure for `koi`
CREATE TABLE `koi` (
  `koi_id` int(5) NOT NULL AUTO_INCREMENT,  -- Integer auto increment ID
  `lelang_id` char(12) NOT NULL,  -- Foreign key reference to lelang
  `seller_id` varchar(36) NOT NULL,  -- Foreign key reference to sellers
  `kode_ikan` varchar(4) NOT NULL,  -- Seller-defined fish code (e.g., A2, B120)
  `jenis_ikan` varchar(100) NOT NULL,
  `ukuran` decimal(5,2) NOT NULL,
  `gender` enum('M','F','U') NOT NULL,  -- Gender with 'M' for male, 'F' for female, 'U' for unknown
  `open_bid` decimal(10,2) NOT NULL,
  `kelipatan_bid` decimal(10,2) NOT NULL,
  `buy_it_now` decimal(10,2) DEFAULT NULL,
  `foto` text DEFAULT NULL,
  `video` text DEFAULT NULL,
  `sertifikat` text DEFAULT NULL,
  `no_pemenang` varchar(20) DEFAULT NULL,
  `pemenang` varchar(100) DEFAULT NULL,
  `timestamp` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`koi_id`),
  UNIQUE KEY `kode_ikan` (`kode_ikan`),
  KEY `lelang_id` (`lelang_id`),
  KEY `seller_id` (`seller_id`),
  CONSTRAINT `koi_ibfk_1` FOREIGN KEY (`lelang_id`) REFERENCES `lelang` (`lelang_id`) ON DELETE CASCADE,
  CONSTRAINT `koi_ibfk_2` FOREIGN KEY (`seller_id`) REFERENCES `sellers` (`seller_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table structure for `group`
CREATE TABLE `group` (
  `group_id` varchar(36) NOT NULL,  -- ID grup WhatsApp, diambil dari WhatsApp API
  `seller_id` varchar(36) NOT NULL,  -- Foreign key mengacu ke tabel sellers
  `lelang_id` char(12) NOT NULL,  -- Foreign key mengacu ke tabel lelang
  `timestamp` timestamp NOT NULL DEFAULT current_timestamp(),  -- Waktu pendaftaran grup
  `jadwal` timestamp NULL,  -- Jadwal pelaksanaan lelang
  PRIMARY KEY (`group_id`),
  KEY `seller_id` (`seller_id`),
  KEY `lelang_id` (`lelang_id`),
  CONSTRAINT `group_ibfk_1` FOREIGN KEY (`seller_id`) REFERENCES `sellers` (`seller_id`) ON DELETE CASCADE,
  CONSTRAINT `group_ibfk_2` FOREIGN KEY (`lelang_id`) REFERENCES `lelang` (`lelang_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table structure for `bid`
CREATE TABLE `bid` (
  `bid_id` int(11) NOT NULL AUTO_INCREMENT,  -- Auto-increment primary key
  `lelang_id` char(12) NOT NULL,  -- Foreign key ke tabel lelang
  `group_id` varchar(36) NOT NULL,  -- Foreign key ke tabel group
  `kode_ikan` varchar(4) NOT NULL,  -- Kode ikan yang di-bid
  `bidder_id` varchar(36) NOT NULL,  -- Nomor telepon bidder
  `bidder_nama` varchar(100) NOT NULL,  -- Nama bidder di WhatsApp
  `price` decimal(10,2) NOT NULL,  -- Harga bid
  `timestamp` timestamp NOT NULL DEFAULT current_timestamp(),  -- Waktu bid
  PRIMARY KEY (`bid_id`),
  KEY `lelang_id` (`lelang_id`),
  KEY `group_id` (`group_id`),
  KEY `kode_ikan` (`kode_ikan`),
  CONSTRAINT `bid_ibfk_1` FOREIGN KEY (`lelang_id`) REFERENCES `lelang` (`lelang_id`) ON DELETE CASCADE,
  CONSTRAINT `bid_ibfk_2` FOREIGN KEY (`group_id`) REFERENCES `group` (`group_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

COMMIT;
