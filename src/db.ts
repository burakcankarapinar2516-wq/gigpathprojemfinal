import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import path from 'path';

// Using a module path compatible approach
const dbPath = process.env.NODE_ENV === 'production' 
  ? path.join(process.cwd(), 'database.sqlite')
  : path.join(process.cwd(), 'database.sqlite');

const db = new Database(dbPath);

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    is_verified INTEGER DEFAULT 0,
    verification_code TEXT,
    reset_code TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS app_data (
    user_id TEXT PRIMARY KEY,
    data TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS shared_links (
    token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    client_name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

// Dynamically run migration queries to alter existing tables if needed
try {
  db.exec(`ALTER TABLE users ADD COLUMN is_verified INTEGER DEFAULT 0;`);
} catch (e) {}
try {
  db.exec(`ALTER TABLE users ADD COLUMN verification_code TEXT;`);
} catch (e) {}
try {
  db.exec(`ALTER TABLE users ADD COLUMN reset_code TEXT;`);
} catch (e) {}

export default db;
