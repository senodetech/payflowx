const { Client } = require('pg');

const passwords = ['root', 'postgres', 'admin', 'password', '123456', '12345', '1234', '12345678', 'root123', 'pgadmin'];

async function testPasswords() {
  console.log('Starting local PostgreSQL password scan...');
  for (const pwd of passwords) {
    const client = new Client({
      host: '127.0.0.1',
      port: 5432,
      user: 'postgres',
      password: pwd,
      database: 'postgres', // default system DB
    });

    try {
      await client.connect();
      console.log(`\n🎉 SUCCESS! Connected using password: "${pwd}"`);
      await client.end();
      process.exit(0);
    } catch (err) {
      if (err.message.includes('password authentication failed')) {
        console.log(`❌ Checked: "${pwd}" - Failed`);
      } else {
        console.log(`⚠️ Checked: "${pwd}" - Other error: ${err.message}`);
      }
    }
  }
  console.log('\n❌ All scanned passwords failed. Please supply your correct PostgreSQL password.');
  process.exit(1);
}

testPasswords();
