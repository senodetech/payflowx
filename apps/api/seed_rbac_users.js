const { Client } = require('pg');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');

async function seedRbacUsers() {
  const client = new Client({
    host: '127.0.0.1',
    port: 5439,
    user: 'postgres',
    password: '',
    database: 'payflowx',
  });

  try {
    await client.connect();
    console.log('Connected to database on port 5439.');

    const passwordHash = await bcrypt.hash('password123', 12);

    // 1. Get existing merchants
    const resMerchants = await client.query('SELECT id, name FROM merchants LIMIT 1');
    let merchantId = null;
    if (resMerchants.rows.length > 0) {
      merchantId = resMerchants.rows[0].id;
    } else {
      merchantId = uuidv4();
      await client.query('INSERT INTO merchants (id, name, status, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW())', [merchantId, 'PayFlowX Demo Merchant', 'ACTIVE']);
    }

    // 2. Define standard RBAC test personas
    const personaUsers = [
      {
        email: 'admin@payflowx.io',
        role: 'ADMIN',
        merchantId: null,
        description: 'Platform Super Administrator with system-wide permissions',
      },
      {
        email: 'owner@payflowx.io',
        role: 'MERCHANT_OWNER',
        merchantId: merchantId,
        description: 'Merchant Owner with full organization management, API keys, & webhooks',
      },
      {
        email: 'developer@payflowx.io',
        role: 'MERCHANT_USER',
        merchantId: merchantId,
        description: 'Merchant Developer/Operator for charges, API testing, & webhooks',
      },
      {
        email: 'auditor@payflowx.io',
        role: 'MERCHANT_USER',
        merchantId: merchantId,
        description: 'Compliance & Financial Analyst with read-only ledger audit access',
      }
    ];

    for (const u of personaUsers) {
      const existing = await client.query('SELECT id FROM users WHERE email = $1', [u.email]);
      if (existing.rows.length > 0) {
        await client.query('UPDATE users SET role = $1, password_hash = $2, merchant_id = $3 WHERE email = $4', [u.role, passwordHash, u.merchantId, u.email]);
      } else {
        await client.query('INSERT INTO users (id, email, password_hash, role, merchant_id, created_at) VALUES ($1, $2, $3, $4, $5, NOW())', [uuidv4(), u.email, passwordHash, u.role, u.merchantId]);
      }
    }

    // Update any existing registered users to have password123 as well
    await client.query('UPDATE users SET password_hash = $1', [passwordHash]);

    // 3. Query all users to print complete RBAC list
    const allUsers = await client.query(`
      SELECT u.id, u.email, u.role, COALESCE(m.name, 'Platform System') as merchant_name 
      FROM users u 
      LEFT JOIN merchants m ON u.merchant_id = m.id 
      ORDER BY u.role, u.email
    `);

    console.log('\n=== CURRENT DATABASE USERS & RBAC MATRIX ===');
    console.table(allUsers.rows);

    await client.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding RBAC users:', err);
    process.exit(1);
  }
}

seedRbacUsers();
