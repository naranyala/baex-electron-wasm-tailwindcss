use napi_derive::napi;
use rusqlite::{Connection, params_from_iter};
use std::sync::Mutex;
use once_cell::sync::Lazy;
use serde_json::{Value, Map};

// Global state for the database connection
static DB_CONN: Lazy<Mutex<Option<Connection>>> = Lazy::new(|| Mutex::new(None));

#[napi]
pub fn initDb(path: String) -> napi::Result<String> {
    let conn = Connection::open(path).map_err(|e| napi::Error::from_reason(e.to_string()))?;
    
    let mut lock = DB_CONN.lock().map_err(|_| napi::Error::from_reason("Mutex lock failed"))?;
    *lock = Some(conn);
    
    Ok("Database initialized successfully".to_string())
}

#[napi]
pub fn seedDb() -> napi::Result<String> {
    let lock = DB_CONN.lock().map_err(|_| napi::Error::from_reason("Mutex lock failed"))?;
    let conn = lock.as_ref().ok_or_else(|| napi::Error::from_reason("Database not initialized. Call initDb first."))?;

    let seed_sql = r#"
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
    "#;

    for statement in seed_sql.split(';').filter(|s| !s.trim().is_empty()) {
        conn.execute(statement, []).map_err(|e| napi::Error::from_reason(format!("Seed error in {}: {}", statement, e)))?;
    }

    Ok("Relational demo database seeded successfully".to_string())
}

#[napi]
pub fn execute(sql: String, params: Vec<String>) -> napi::Result<String> {
    let lock = DB_CONN.lock().map_err(|_| napi::Error::from_reason("Mutex lock failed"))?;
    let conn = lock.as_ref().ok_or_else(|| napi::Error::from_reason("Database not initialized. Call initDb first."))?;

    conn.execute(&sql, params_from_iter(params)).map_err(|e| napi::Error::from_reason(e.to_string()))?;
    
    Ok("Query executed successfully".to_string())
}

#[napi]
pub fn query(sql: String, params: Vec<String>) -> napi::Result<String> {
    let lock = DB_CONN.lock().map_err(|_| napi::Error::from_reason("Mutex lock failed"))?;
    let conn = lock.as_ref().ok_or_else(|| napi::Error::from_reason("Database not initialized. Call initDb first."))?;

    let mut stmt = conn.prepare(&sql).map_err(|e| napi::Error::from_reason(e.to_string()))?;
    
    let column_names: Vec<String> = stmt.column_names().iter().map(|s| s.to_string()).collect();
    
    let rows = stmt.query_map(params_from_iter(params), |row| {
        let mut map = Map::new();
        for (i, name) in column_names.iter().enumerate() {
            let val: Value = row.get::<_, String>(i)
                .map(|s| Value::String(s))
                .unwrap_or(Value::Null);
            map.insert(name.clone(), val);
        }
        Ok(Value::Object(map))
    }).map_err(|e| napi::Error::from_reason(e.to_string()))?;

    let mut results = Vec::new();
    for row in rows {
        results.push(row.map_err(|e| napi::Error::from_reason(e.to_string()))?);
    }

    serde_json::to_string(&results).map_err(|e| napi::Error::from_reason(e.to_string()))
}
