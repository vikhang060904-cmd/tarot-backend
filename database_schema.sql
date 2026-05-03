-- Tarot Talk Database Schema for XAMPP MySQL

-- Create Database
CREATE DATABASE IF NOT EXISTS tarot_talk;
USE tarot_talk;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  username VARCHAR(100),
  token_balance INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Reading History Table
CREATE TABLE IF NOT EXISTS reading_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  topic VARCHAR(100),
  question TEXT,
  selected_cards JSON,
  result TEXT,
  token_cost INT DEFAULT 5,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at)
);

-- Token Transactions Table
CREATE TABLE IF NOT EXISTS token_transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  transaction_type ENUM('purchase', 'usage', 'refund') DEFAULT 'purchase',
  amount INT NOT NULL,
  package_name VARCHAR(100),
  price DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at)
);

-- Sample Data
INSERT INTO users (email, username, token_balance) VALUES
('user1@example.com', 'User One', 100),
('user2@example.com', 'User Two', 500),
('user3@example.com', 'User Three', 1500);

INSERT INTO token_transactions (user_id, transaction_type, amount, package_name, price) VALUES
(1, 'purchase', 100, 'Khởi Đầu', 29000),
(2, 'purchase', 500, 'Khám Phá', 99000),
(3, 'purchase', 1500, 'Thạo Thủ', 249000),
(1, 'usage', -5, NULL, NULL),
(2, 'usage', -10, NULL, NULL);

INSERT INTO reading_history (user_id, topic, question, selected_cards, result, token_cost) VALUES
(1, '💕 Tình Yêu', 'Tình yêu của tôi sẽ ra sao?', '["Cups-Ace", "Cups-Two", "Wands-Three"]', 'Kết quả tích cực', 5),
(1, '💼 Sự Nghiệp', 'Nên chuyển việc không?', '["Pentacles-Eight", "Swords-Five", "Cups-Ten"]', 'Hãy chờ thêm 3 tháng', 5),
(2, '🔮 Chung', 'Vận mệnh của tôi', '["Wands-Ace", "Pentacles-Six", "Cups-Ace"]', 'Thành công sắp đến', 10),
(3, '💕 Tình Yêu', 'Ai là người dành cho tôi?', '["Cups-Five", "Cups-Six", "Cups-Seven"]', 'Hành trình tình yêu bắt đầu', 5);
