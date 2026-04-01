-- 1. START CLEAN
DROP DATABASE IF EXISTS axo_nique;
CREATE DATABASE axo_nique;
USE axo_nique;

-- 2. USERS TABLE
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    security_question_1 VARCHAR(255),
    security_answer_1 VARCHAR(255),
    security_question_2 VARCHAR(255),
    security_answer_2 VARCHAR(255),
    security_question_3 VARCHAR(255),
    security_answer_3 VARCHAR(255),
    enabled BOOLEAN DEFAULT FALSE,
    role VARCHAR(20) NOT NULL DEFAULT 'CUSTOMER'
);

-- 3. PRODUCTS TABLE
CREATE TABLE products (
  id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
  name                VARCHAR(255)   NOT NULL,
  category            VARCHAR(100)   NOT NULL,
  price               DECIMAL(10, 2) NOT NULL,
  description         TEXT,
  emoji               VARCHAR(10),
  badge               VARCHAR(50),
  image_url           VARCHAR(500),
  in_stock            BOOLEAN        NOT NULL DEFAULT TRUE,
  is_deleted          BOOLEAN        NOT NULL DEFAULT FALSE, 
  sizes_raw           VARCHAR(255)   NOT NULL DEFAULT '',
  stock_quantity      INT            NOT NULL DEFAULT 0,
  low_stock_threshold INT            NOT NULL DEFAULT 5,
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 4. CART ITEMS 
-- Uses CASCADE: If a product is deleted from the store, it is removed from all active carts.
CREATE TABLE cart_items (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  product_id  BIGINT       NOT NULL,
  quantity    INT          NOT NULL DEFAULT 1,
  size        VARCHAR(20),
  session_id  VARCHAR(255),
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- 5. ORDERS TABLE
CREATE TABLE orders (
  id                BIGINT AUTO_INCREMENT PRIMARY KEY,
  customer_name      VARCHAR(255) NOT NULL,
  customer_email     VARCHAR(255) NOT NULL,
  delivery_address   TEXT NOT NULL,
  subtotal          DECIMAL(10, 2) NOT NULL,
  shipping_fee      DECIMAL(10, 2) NOT NULL,
  total             DECIMAL(10, 2) NOT NULL,
  status            VARCHAR(50) NOT NULL DEFAULT 'PENDING',
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 6. ORDER ITEMS
-- CRITICAL FIX: product_id MUST be NULLable for ON DELETE SET NULL to work.
CREATE TABLE order_items (
  id                BIGINT AUTO_INCREMENT PRIMARY KEY,
  order_id          BIGINT NOT NULL,
  product_id        BIGINT NULL, -- Changed to NULL to allow SET NULL constraint
  product_name      VARCHAR(255),
  product_category  VARCHAR(100),
  quantity          INT NOT NULL,
  unit_price        DECIMAL(10, 2) NOT NULL,
  line_total        DECIMAL(10, 2) NOT NULL,
  selected_size     VARCHAR(20),
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_order_header FOREIGN KEY (order