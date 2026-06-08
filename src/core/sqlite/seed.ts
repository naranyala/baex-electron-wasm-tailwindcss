export const SEED_SQL = `
CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    city TEXT
);
CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    category TEXT
);
CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER,
    order_date TEXT DEFAULT CURRENT_TIMESTAMP,
    total_amount REAL,
    FOREIGN KEY(customer_id) REFERENCES customers(id)
);
CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER,
    product_id INTEGER,
    quantity INTEGER NOT NULL,
    price_at_time REAL NOT NULL,
    FOREIGN KEY(order_id) REFERENCES orders(id),
    FOREIGN KEY(product_id) REFERENCES products(id)
);
INSERT OR IGNORE INTO customers (id, name, email, city) VALUES
    (1, 'John Doe', 'john@example.com', 'New York'),
    (2, 'Jane Smith', 'jane@example.com', 'London'),
    (3, 'Alice Johnson', 'alice@example.com', 'Tokyo');
INSERT OR IGNORE INTO products (id, name, price, category) VALUES
    (1, 'Laptop Pro', 1299.99, 'Electronics'),
    (2, 'Wireless Mouse', 25.50, 'Accessories'),
    (3, 'Mechanical Keyboard', 89.00, 'Accessories'),
    (4, 'Monitor 4K', 349.00, 'Electronics');
INSERT OR IGNORE INTO orders (id, customer_id, total_amount) VALUES
    (1, 1, 1325.49),
    (2, 2, 89.00),
    (3, 3, 374.50);
INSERT OR IGNORE INTO order_items (order_id, product_id, quantity, price_at_time) VALUES
    (1, 1, 1, 1299.99),
    (1, 2, 1, 25.50),
    (2, 3, 1, 89.00),
    (3, 4, 1, 349.00),
    (3, 2, 1, 25.50);
`;
