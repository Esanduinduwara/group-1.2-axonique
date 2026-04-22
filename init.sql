CREATE DATABASE IF NOT EXISTS axo_nique;
USE axo_nique;

CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    enabled BOOLEAN DEFAULT FALSE,
    role VARCHAR(20) NOT NULL DEFAULT 'CUSTOMER'
);

CREATE TABLE IF NOT EXISTS products (
  id         BIGINT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(255)   NOT NULL,
  category   VARCHAR(100)   NOT NULL,
  price      DECIMAL(10, 2) NOT NULL,
  description TEXT,
  emoji      VARCHAR(10),
  badge      VARCHAR(50),
  image_url  VARCHAR(500),
  in_stock   BOOLEAN        NOT NULL DEFAULT TRUE,
  sizes_raw  VARCHAR(255)   NOT NULL DEFAULT '',
  stock_quantity INT NOT NULL DEFAULT 0,
  low_stock_threshold INT NOT NULL DEFAULT 5,
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cart_items (
  id         BIGINT AUTO_INCREMENT PRIMARY KEY,
  product_id BIGINT       NOT NULL,
  quantity   INT          NOT NULL DEFAULT 1,
  size       VARCHAR(20),
  session_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS orders (
  id                BIGINT AUTO_INCREMENT PRIMARY KEY,
  customer_name     VARCHAR(255) NOT NULL,
  customer_email    VARCHAR(255) NOT NULL,
  delivery_address  TEXT NOT NULL,
  subtotal          DECIMAL(10, 2) NOT NULL,
  shipping_fee      DECIMAL(10, 2) NOT NULL,
  total             DECIMAL(10, 2) NOT NULL,
  status            VARCHAR(50) NOT NULL DEFAULT 'PENDING',
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_items (
  id                BIGINT AUTO_INCREMENT PRIMARY KEY,
  order_id          BIGINT NOT NULL,
  product_id        BIGINT,
  product_name      VARCHAR(255),
  product_category  VARCHAR(100),
  quantity          INT NOT NULL,
  unit_price        DECIMAL(10, 2) NOT NULL,
  line_total        DECIMAL(10, 2) NOT NULL,
  selected_size     VARCHAR(20),
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS brand_profile (
  id                         BIGINT AUTO_INCREMENT PRIMARY KEY,
  logo_url                   LONGTEXT,
  hero_banner_url            LONGTEXT,
  discount_banner_text       VARCHAR(500),
  discount_banner_active     BOOLEAN DEFAULT FALSE,
  mission                    TEXT,
  vision                     TEXT,
  policies                   TEXT,
  updated_at                 TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ── 2. Discount tiers (reference data) ───────────────────
CREATE TABLE IF NOT EXISTS discount_tiers (
  id          INT          AUTO_INCREMENT PRIMARY KEY,
  label       VARCHAR(50)  NOT NULL,          -- e.g. Bronze, Silver, Gold, Platinum
  min_qty     INT          NOT NULL,           -- minimum total units in a single order
  discount_pct DECIMAL(5,2) NOT NULL,          -- percentage off, e.g. 5.00
  active      BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_min_qty (min_qty)
);

INSERT IGNORE INTO discount_tiers (label, min_qty, discount_pct) VALUES
  ('Bronze',   50,   5.00),
  ('Silver',  100,  10.00),
  ('Gold',    200,  15.00),
  ('Platinum',500,  20.00);

-- ── 3. Bulk orders ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bulk_orders (
  id               BIGINT       AUTO_INCREMENT PRIMARY KEY,
  ref              VARCHAR(20)  NOT NULL UNIQUE,              -- e.g. BLK-0042
  retailer_user_id BIGINT       NOT NULL,
  company_name     VARCHAR(255) NOT NULL,
  contact_person   VARCHAR(255) NOT NULL,
  contact_email    VARCHAR(255) NOT NULL,
  delivery_address TEXT         NOT NULL,
  notes            TEXT,
  subtotal         DECIMAL(12,2) NOT NULL,
  discount_pct     DECIMAL(5,2)  NOT NULL DEFAULT 0.00,
  discount_amount  DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  grand_total      DECIMAL(12,2) NOT NULL,
  total_qty        INT           NOT NULL DEFAULT 0,
  status           VARCHAR(30)   NOT NULL DEFAULT 'PENDING',
  -- PENDING | CONFIRMED | SHIPPED | DELIVERED | CANCELLED
  created_at       TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (retailer_user_id) REFERENCES users(id)
);

-- Auto-generate readable reference number via trigger
DELIMITER $$
CREATE TRIGGER IF NOT EXISTS trg_bulk_order_ref
  BEFORE INSERT ON bulk_orders
  FOR EACH ROW
BEGIN
  IF NEW.ref IS NULL OR NEW.ref = '' THEN
    SET NEW.ref = CONCAT('BLK-', LPAD((SELECT COUNT(*) + 1 FROM bulk_orders), 4, '0'));
  END IF;
END$$
DELIMITER ;

-- ── 4. Bulk order line items ──────────────────────────────
CREATE TABLE IF NOT EXISTS bulk_order_items (
  id               BIGINT       AUTO_INCREMENT PRIMARY KEY,
  bulk_order_id    BIGINT       NOT NULL,
  product_id       BIGINT,                      -- nullable: product may be deleted later
  product_name     VARCHAR(255) NOT NULL,        -- snapshot at order time
  product_category VARCHAR(100),
  selected_size    VARCHAR(20),
  quantity         INT          NOT NULL,
  unit_price       DECIMAL(10,2) NOT NULL,       -- price at order time (pre-discount)
  discount_pct     DECIMAL(5,2)  NOT NULL DEFAULT 0.00,
  line_total       DECIMAL(12,2) NOT NULL,       -- quantity * unit_price * (1 - discount_pct/100)
  created_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (bulk_order_id) REFERENCES bulk_orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id)    REFERENCES products(id) ON SET NULL
);

-- ── 5. Retailer profile (optional enrichment) ─────────────
CREATE TABLE IF NOT EXISTS retailer_profiles (
  id               BIGINT       AUTO_INCREMENT PRIMARY KEY,
  user_id          BIGINT       NOT NULL UNIQUE,
  company_name     VARCHAR(255),
  business_reg_no  VARCHAR(100),
  contact_person   VARCHAR(255),
  phone            VARCHAR(30),
  address          TEXT,
  preferred_tier   VARCHAR(50),  -- cached last-used discount tier label
  created_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ── 6. Useful views for reporting ────────────────────────
CREATE OR REPLACE VIEW vw_bulk_order_summary AS
SELECT
  bo.id,
  bo.ref,
  bo.company_name,
  bo.contact_email,
  bo.status,
  bo.total_qty,
  bo.subtotal,
  bo.discount_pct,
  bo.discount_amount,
  bo.grand_total,
  bo.created_at,
  u.username  AS retailer_username
FROM bulk_orders bo
JOIN users u ON u.id = bo.retailer_user_id;

-- Axonique products
INSERT IGNORE INTO products (id, name, category, price, description, emoji, badge, image_url, in_stock, sizes_raw) VALUES
  (1,  'Timeless Tee (220 GSM)',   'T-Shirts', 2490.00, 'Premium quality Timeless Tee crafted from 220 GSM fabric. Comfortable fit with a classic design perfect for everyday wear. Durable and long-lasting with superior comfort.',   '👕', 'New',      'https://res.cloudinary.com/dimdro5dm/image/upload/v1772361691/Artboard_2_1_hnmmx0.png', TRUE, 'XS,S,M,L,XL,XXL'),
  (2,  'Impossible Tee (220 GSM)', 'T-Shirts', 2490.00, 'The legendary Impossible Tee made from 220 GSM premium cotton. Perfect as a statement piece or everyday essential. Superior quality and durability.',                         '👕', 'New',      'https://res.cloudinary.com/dimdro5dm/image/upload/v1772361685/Artboard_1_1_qk5nj4.png', TRUE, 'XS,S,M,L,XL,XXL'),
  (3,  'Phantom Tee (220 GSM)',    'T-Shirts', 2390.00, 'Sleek Phantom Tee crafted from 220 GSM fabric. Minimalist design with maximum comfort. Perfect for layering or wearing solo with style.',                                      '👕', 'Featured', 'https://res.cloudinary.com/dimdro5dm/image/upload/v1772372435/Whisk_220c855f9cae17a92ef44c2b9cfbc142dr_e1uymk.png', TRUE, 'S,M,L,XL,XXL'),
  (4,  'Xenonix Tee (220 GSM)',    'T-Shirts', 2290.00, 'Modern Xenonix Tee featuring 220 GSM premium fabric. Contemporary design with premium comfort. Versatile and easy to style for any occasion.',                                 '👕', 'Featured', 'https://res.cloudinary.com/dimdro5dm/image/upload/v1772372615/Whisk_1b2718f44b9d3d685094184d21fd0057dr_jzj6dk.png', TRUE, 'XS,S,M,L,XL'),
  (5,  'Timeless Hoodie',     'Hoodies',  4890.00, 'Oversized white hoodie with bold centered AXO logo. Heavy-weight cotton blend. Perfect for a bold streetwear statement.',                                '🧥', 'Limited',  'https://res.cloudinary.com/dimdro5dm/image/upload/v1772370314/Whisk_fa44f643be97a15965747d65c30045eceg_itzqa7.png', TRUE, 'XS,S,M,L,XL,XXL'),
  (6,  'Phantom Hoodie',          'Hoodies',  5290.00, 'Charcoal gray zip-up hoodie with embroidered AXO branding. Full front zip with adjustable hood. Premium comfort and durability.',                                             '🧥', 'Limited', 'https://res.cloudinary.com/dimdro5dm/image/upload/v1772371995/Whisk_52c9893ff3ac20a98144ae7a4f7f4580dr_c3vp5b.png', TRUE, 'XS,S,M,L,XL'),
  (7,  'Impossible Hoodie',        'Hoodies',  5490.00, 'Premium heavyweight black hoodie with kangaroo pocket and drawstring. Perfect for layering or as a statement piece. Ultra-soft fleece lining.',                                                     '🧥', 'Limited',       'https://res.cloudinary.com/dimdro5dm/image/upload/v1772370975/Whisk_4e6052ec69bf657bc6a48cc1a46c8f67dr_jywuyn.png', TRUE, 'S,M,L,XL,XXL'),
  (8,  'Impossible Cap',     'Caps',     1990.00, 'Timeless snapback cap in black with embroidered AXO logo. Adjustable fit for all head sizes. Perfect for any casual outfit.',                                                 '🧢', 'New',       'https://res.cloudinary.com/dimdro5dm/image/upload/v1772371155/Whisk_aef561bc5f2edbbbfaa440f4298d7eaedr_psu4xz.png', TRUE, 'One Size'),
  (9,  'Timeless Cap',        'Caps',     2190.00, 'Vintage-style trucker cap with white front panels and mesh back. Adjustable snapback closure. Great for hot days and street style.',                                          '🧢', 'New',       'https://res.cloudinary.com/dimdro5dm/image/upload/v1772371306/Whisk_c12c7e404e6248ea40c44fdfa5d43520eg_tbn8ek.png', TRUE, 'One Size'),
  (10, 'Phantom Hat',                  'Caps',     2090.00, 'Relaxed dad hat style with curved visor. Premium cotton construction with embroidered logo. One size fits most.',                                                             '🧢', 'Limited',       'https://res.cloudinary.com/dimdro5dm/image/upload/v1772372157/Whisk_62e23c381c7713c88a9489f40f05fdc5dr_uzthom.png', TRUE, 'One Size');