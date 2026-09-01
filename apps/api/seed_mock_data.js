const { Client } = require('pg');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');

async function seedMockData() {
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

    // 1. Get all merchants
    const resMerchants = await client.query('SELECT id, name FROM merchants');
    const merchants = resMerchants.rows;

    if (merchants.length === 0) {
      console.log('No merchants found in database to seed.');
      process.exit(0);
    }

    console.log(`Found ${merchants.length} merchant(s) to seed.`);

    for (const merchant of merchants) {
      console.log(`\n--- Seeding data for merchant: "${merchant.name}" (${merchant.id}) ---`);

      // 2. Setup Ledger Accounts (MERCHANT, GATEWAY, CUSTOMER)
      const ledgerAccounts = [
        { type: 'MERCHANT', balance: 48950.00, currency: 'USD' },
        { type: 'GATEWAY', balance: 14230.50, currency: 'USD' },
        { type: 'CUSTOMER', balance: 1850.00, currency: 'USD' },
      ];

      const accountIds = {};

      for (const acc of ledgerAccounts) {
        // Upsert account
        const existingAcc = await client.query(
          'SELECT id FROM ledger_accounts WHERE merchant_id = $1 AND type = $2 AND currency = $3',
          [merchant.id, acc.type, acc.currency]
        );

        if (existingAcc.rows.length > 0) {
          await client.query(
            'UPDATE ledger_accounts SET balance = $1, updated_at = NOW() WHERE id = $2',
            [acc.balance, existingAcc.rows[0].id]
          );
          accountIds[acc.type] = existingAcc.rows[0].id;
        } else {
          const newAccId = uuidv4();
          await client.query(
            'INSERT INTO ledger_accounts (id, merchant_id, type, currency, balance, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())',
            [newAccId, merchant.id, acc.type, acc.currency, acc.balance]
          );
          accountIds[acc.type] = newAccId;
        }
      }
      console.log('✔ Ledger Accounts seeded.');

      // 3. Clear existing payments to prevent duplicate collisions if re-run
      await client.query('DELETE FROM refunds WHERE payment_intent_id IN (SELECT id FROM payment_intents WHERE merchant_id = $1)', [merchant.id]);
      await client.query('DELETE FROM payment_intents WHERE merchant_id = $1', [merchant.id]);

      // 4. Seed Payment Intents
      const samplePayments = [
        { amount: 1250.00, status: 'SUCCEEDED', brand: 'visa', last4: '4242', exp_month: 12, exp_year: 2028, desc: 'Enterprise SaaS Annual Subscription' },
        { amount: 450.00, status: 'SUCCEEDED', brand: 'mastercard', last4: '5555', exp_month: 8, exp_year: 2027, desc: 'Cloud Infrastructure Add-on' },
        { amount: 3200.00, status: 'SUCCEEDED', brand: 'amex', last4: '0005', exp_month: 11, exp_year: 2029, desc: 'API Integration Consulting Bundle' },
        { amount: 89.99, status: 'SUCCEEDED', brand: 'visa', last4: '1881', exp_month: 4, exp_year: 2026, desc: 'Monthly Developer Tier License' },
        { amount: 540.00, status: 'SUCCEEDED', brand: 'visa', last4: '4242', exp_month: 1, exp_year: 2027, desc: 'Custom Domain SSL Pack' },
        { amount: 980.50, status: 'SUCCEEDED', brand: 'mastercard', last4: '4444', exp_month: 9, exp_year: 2028, desc: 'Dedicated Gateway Routing Node' },
        { amount: 2100.00, status: 'SUCCEEDED', brand: 'visa', last4: '4242', exp_month: 6, exp_year: 2029, desc: 'High-Volume Webhook Dispatcher Tier' },
        { amount: 150.00, status: 'SUCCEEDED', brand: 'visa', last4: '9999', exp_month: 3, exp_year: 2027, desc: 'Compliance & Audit Log Retention Pack' },
        { amount: 340.00, status: 'PROCESSING', brand: 'visa', last4: '4242', exp_month: 10, exp_year: 2026, desc: 'Batch Processing Addon' },
        { amount: 1500.00, status: 'REQUIRES_CAPTURE', brand: 'mastercard', last4: '5100', exp_month: 7, exp_year: 2027, desc: 'Security Penetration Testing Reservation' },
        { amount: 299.00, status: 'FAILED', brand: 'visa', last4: '5555', exp_month: 5, exp_year: 2025, desc: 'Declined - Insufficient Funds' },
        { amount: 89.00, status: 'FAILED', brand: 'mastercard', last4: '0002', exp_month: 2, exp_year: 2026, desc: 'Declined - Expired Card' },
      ];

      const insertedPayments = [];

      for (const p of samplePayments) {
        const paymentId = uuidv4();
        const paymentMethod = {
          type: 'card',
          card: {
            brand: p.brand,
            last4: p.last4,
            exp_month: p.exp_month,
            exp_year: p.exp_year,
          },
          description: p.desc,
        };

        await client.query(
          `INSERT INTO payment_intents (id, merchant_id, amount, currency, status, payment_method, created_at, updated_at) 
           VALUES ($1, $2, $3, 'USD', $4, $5, NOW() - (random() * interval '7 days'), NOW())`,
          [paymentId, merchant.id, p.amount, p.status, JSON.stringify(paymentMethod)]
        );

        insertedPayments.push({ id: paymentId, ...p });
      }
      console.log(`✔ Inserted ${insertedPayments.length} Payment Intents.`);

      // 5. Seed Refunds for 2 succeeded payments
      const succeededPayments = insertedPayments.filter((p) => p.status === 'SUCCEEDED');
      if (succeededPayments.length >= 2) {
        const ref1Id = uuidv4();
        await client.query(
          `INSERT INTO refunds (id, payment_intent_id, amount, status, reason, created_at)
           VALUES ($1, $2, 150.00, 'SUCCEEDED', 'Duplicate charge requested by customer', NOW() - interval '2 days')`,
          [ref1Id, succeededPayments[7].id]
        );

        const ref2Id = uuidv4();
        await client.query(
          `INSERT INTO refunds (id, payment_intent_id, amount, status, reason, created_at)
           VALUES ($1, $2, 89.99, 'SUCCEEDED', 'Service downgraded during trial window', NOW() - interval '1 day')`,
          [ref2Id, succeededPayments[3].id]
        );
        console.log('✔ Inserted 2 sample Refunds.');
      }

      // 6. Seed API Keys
      await client.query('DELETE FROM api_keys WHERE merchant_id = $1', [merchant.id]);
      const secretHash = await bcrypt.hash('sk_live_payflowx_super_secret_sample_token', 10);
      const secretTestHash = await bcrypt.hash('sk_test_payflowx_mock_test_token', 10);

      await client.query(
        `INSERT INTO api_keys (id, merchant_id, public_key, secret_key_hash, status, created_at)
         VALUES 
         ($1, $2, 'pk_live_' || substr(md5(random()::text), 1, 24), $3, 'ACTIVE', NOW() - interval '10 days'),
         ($4, $2, 'pk_test_' || substr(md5(random()::text), 1, 24), $5, 'ACTIVE', NOW() - interval '5 days')`,
        [uuidv4(), merchant.id, secretHash, uuidv4(), secretTestHash]
      );
      console.log('✔ Active Live & Test API Keys seeded.');

      // 7. Seed Webhooks & Delivery Logs
      await client.query('DELETE FROM webhook_logs WHERE webhook_endpoint_id IN (SELECT id::text FROM webhook_endpoints WHERE merchant_id = $1)', [merchant.id]);
      await client.query('DELETE FROM webhook_endpoints WHERE merchant_id = $1', [merchant.id]);

      const endpoint1Id = uuidv4();
      await client.query(
        `INSERT INTO webhook_endpoints (id, merchant_id, url, secret, status, enabled_events, created_at)
         VALUES ($1, $2, 'https://api.acmestores.io/v1/payments/webhook', 'whsec_' || substr(md5(random()::text), 1, 28), 'ACTIVE', $3, NOW() - interval '14 days')`,
        [endpoint1Id, merchant.id, JSON.stringify(['payment.succeeded', 'charge.refunded', 'payment.failed'])]
      );

      const endpoint2Id = uuidv4();
      await client.query(
        `INSERT INTO webhook_endpoints (id, merchant_id, url, secret, status, enabled_events, created_at)
         VALUES ($1, $2, 'https://hooks.slack.com/services/T00/B00/payflowx-alerts', 'whsec_' || substr(md5(random()::text), 1, 28), 'ACTIVE', $3, NOW() - interval '7 days')`,
        [endpoint2Id, merchant.id, JSON.stringify(['payment.succeeded'])]
      );

      // Webhook logs
      const sampleWebhookEvents = [
        { type: 'payment.succeeded', status: 'DELIVERED', code: 200, res: '{"received": true, "order_id": "ORD-94821"}' },
        { type: 'payment.succeeded', status: 'DELIVERED', code: 200, res: '{"received": true, "order_id": "ORD-94822"}' },
        { type: 'charge.refunded', status: 'DELIVERED', code: 200, res: '{"refund_acknowledged": true}' },
        { type: 'payment.failed', status: 'DELIVERED', code: 200, res: '{"logged": true, "alert_dispatched": true}' },
        { type: 'payment.succeeded', status: 'DELIVERED', code: 200, res: '{"received": true, "order_id": "ORD-94825"}' },
      ];

      for (const log of sampleWebhookEvents) {
        await client.query(
          `INSERT INTO webhook_logs (id, webhook_endpoint_id, event_type, payload, status, response_status, response_body, attempt_number, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, 1, NOW() - (random() * interval '4 days'))`,
          [
            uuidv4(),
            endpoint1Id,
            log.type,
            JSON.stringify({ id: 'evt_' + uuidv4().substr(0, 8), type: log.type, created: Math.floor(Date.now() / 1000) }),
            log.status,
            log.code,
            log.res,
          ]
        );
      }
      console.log('✔ Webhook Endpoints and delivery logs seeded.');
    }

    console.log('\n🎉 ALL MOCK DATA SEEDED SUCCESSFULLY!');
    await client.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to seed mock data:', err);
    process.exit(1);
  }
}

seedMockData();
