-- Products 테이블 생성
CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    internal_code VARCHAR(50) UNIQUE NOT NULL,
    unique_code VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    unit VARCHAR(20) NOT NULL,
    unit_price DECIMAL(10,2) DEFAULT 0,
    min_stock INTEGER DEFAULT 0,
    current_stock INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Transactions 테이블 생성
CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    type VARCHAR(10) NOT NULL CHECK (type IN ('INBOUND', 'OUTBOUND')),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2),
    total_amount DECIMAL(10,2),
    supplier VARCHAR(200),
    reason VARCHAR(200),
    transaction_date DATE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_products_internal_code ON products(internal_code);
CREATE INDEX IF NOT EXISTS idx_products_unique_code ON products(unique_code);
CREATE INDEX IF NOT EXISTS idx_transactions_product_id ON transactions(product_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);