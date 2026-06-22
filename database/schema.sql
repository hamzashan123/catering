CREATE DATABASE IF NOT EXISTS bookin_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE bookin_system;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL,
  username VARCHAR(80) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin','user') NOT NULL DEFAULT 'user',
  status ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token_hash VARCHAR(128) NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS clients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  status ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS owners (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  status ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pms (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  status ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS appliance_types (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  status ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS book_ins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  stock_code VARCHAR(40) NOT NULL UNIQUE,
  make VARCHAR(120),
  model VARCHAR(120),
  serial_no VARCHAR(120),
  type_id INT,
  qty INT DEFAULT 1,
  length_mm INT,
  depth_mm INT,
  condition_grade ENUM('A','B','C','D'),
  stock_category ENUM('NSE','S/Hand'),
  client_id INT,
  owner_id INT,
  removed_from VARCHAR(160),
  pm_id INT,
  date_received DATE,
  action_status ENUM('Sell','Hold','Scrap','Refurb'),
  notes TEXT,
  archived TINYINT(1) DEFAULT 0,
  archived_at DATETIME NULL,
  created_by INT,
  updated_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (type_id) REFERENCES appliance_types(id) ON DELETE SET NULL,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
  FOREIGN KEY (owner_id) REFERENCES owners(id) ON DELETE SET NULL,
  FOREIGN KEY (pm_id) REFERENCES pms(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS book_in_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  book_in_id INT NOT NULL,
  file_path VARCHAR(255) NOT NULL,
  original_name VARCHAR(255),
  sort_order INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (book_in_id) REFERENCES book_ins(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS stock_activities (
  id INT AUTO_INCREMENT PRIMARY KEY,
  book_in_id INT NOT NULL,
  activity VARCHAR(255),
  activity_date DATE,
  hours DECIMAL(8,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (book_in_id) REFERENCES book_ins(id) ON DELETE CASCADE
);

INSERT INTO users (name, email, username, password_hash, role, status)
VALUES ('Admin User', 'admin@example.com', 'admin', '$2y$12$BliO1f/wzykDBbwhN0H2tOxo9YL1qEsbQ.bupWT1NXToblsgUkbRu', 'admin', 'active')
ON DUPLICATE KEY UPDATE username = username;

INSERT INTO clients (name) VALUES ('Whitbread'), ('Haven'), ('Stonegate'), ('Stars'), ('Wetherspoon');
INSERT INTO owners (name) VALUES ('Client'), ('Company'), ('Third Party');
INSERT INTO pms (name) VALUES ('BC'), ('PM 1'), ('PM 2');
INSERT INTO appliance_types (name) VALUES ('Fabrication'), ('Range Cooker'), ('Cooking Range'), ('Fridge'), ('Freezer');
