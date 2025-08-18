const { Client } = require('pg');
let client;
async function initDb(){
  client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  await client.query(`
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    telegram_id BIGINT UNIQUE,
    username TEXT,
    balance_withdrawable REAL DEFAULT 0,
    balance_nonwithdrawable REAL DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
  );
  CREATE TABLE IF NOT EXISTS games (
    id SERIAL PRIMARY KEY,
    status TEXT,
    stake_amount REAL,
    shuffle_sequence TEXT,
    current_index INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
  );
  CREATE TABLE IF NOT EXISTS player_choices (
    id SERIAL PRIMARY KEY,
    game_id INT REFERENCES games(id),
    user_id INT REFERENCES users(id),
    chosen_number INT,
    card_json TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW()
  );
  CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    type TEXT,
    amount REAL,
    meta JSON,
    status TEXT,
    created_at TIMESTAMP DEFAULT NOW()
  );
  `);
  console.log('DB initialized');
}
function getClient(){ return client; }
module.exports = { initDb, getClient };
