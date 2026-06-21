CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  phone VARCHAR(20) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('guest', 'host') NOT NULL,
  nickname VARCHAR(50),
  avatar VARCHAR(255),
  balance DECIMAL(10,2) DEFAULT 10000.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS properties (
  id INT AUTO_INCREMENT PRIMARY KEY,
  host_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  address VARCHAR(500) NOT NULL,
  room_type VARCHAR(50) NOT NULL,
  max_guests INT NOT NULL,
  weekday_price DECIMAL(10,2) NOT NULL,
  weekend_price DECIMAL(10,2) NOT NULL,
  cover_image VARCHAR(255),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (host_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS property_facilities (
  id INT AUTO_INCREMENT PRIMARY KEY,
  property_id INT NOT NULL,
  facility VARCHAR(50) NOT NULL,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS calendar (
  id INT AUTO_INCREMENT PRIMARY KEY,
  property_id INT NOT NULL,
  date DATE NOT NULL,
  status ENUM('available', 'booked', 'maintenance') DEFAULT 'available',
  price DECIMAL(10,2) NOT NULL,
  order_id INT,
  UNIQUE KEY unique_date (property_id, date),
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_no VARCHAR(32) NOT NULL UNIQUE,
  property_id INT NOT NULL,
  guest_id INT NOT NULL,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  guest_name VARCHAR(50) NOT NULL,
  guest_phone VARCHAR(20) NOT NULL,
  status ENUM('pending_payment', 'pending_accept', 'pending_checkin', 'completed', 'cancelled') DEFAULT 'pending_payment',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (property_id) REFERENCES properties(id),
  FOREIGN KEY (guest_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  type ENUM('booking_success', 'host_accept', 'host_reject', 'system') NOT NULL,
  is_read TINYINT(1) DEFAULT 0,
  order_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
