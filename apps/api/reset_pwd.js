const { Client } = require('pg');
const bcrypt = require('bcrypt');

async function resetPasswords() {
  const client = new Client({
    host: '127.0.0.1',
    port: 5439,
    user: 'postgres',
    password: '',
    database: 'payflowx',
  });

  try {
    await client.connect();
    const hash = await bcrypt.hash('password123', 12);
    
    await client.query('UPDATE users SET password_hash = $1', [hash]);
    console.log('🎉 Successfully reset all database user passwords to: "password123"');
    await client.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to reset passwords:', err.message);
    process.exit(1);
  }
}

resetPasswords();
