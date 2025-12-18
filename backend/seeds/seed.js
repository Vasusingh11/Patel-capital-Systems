const bcrypt = require('bcryptjs');
const { query } = require('../database/db');

async function seed() {
  try {
    console.log('🌱 Starting database seeding...\n');

    // Create default admin user
    const adminEmail = 'admin@patel-capital.net';
    const adminPassword = 'PatelPassword1234';
    
    // Check if admin already exists
    const existingAdmin = await query(
      'SELECT id FROM users WHERE email = $1',
      [adminEmail]
    );

    if (existingAdmin.rows.length > 0) {
      console.log('✅ Admin user already exists');
    } else {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(adminPassword, salt);

      await query(
        `INSERT INTO users (name, email, password_hash, role)
         VALUES ($1, $2, $3, $4)`,
        ['Patel Capital Admin', adminEmail, passwordHash, 'admin']
      );

      console.log('✅ Created default admin user');
      console.log('   Email:', adminEmail);
      console.log('   Password:', adminPassword);
      console.log('   ⚠️  IMPORTANT: Change this password after first login!\n');
    }

    // Create sample company (optional)
    const companyResult = await query(
      'SELECT id FROM companies WHERE name = $1',
      ['Trophy Point']
    );

    if (companyResult.rows.length === 0) {
      await query(
        `INSERT INTO companies (name, default_rate)
         VALUES ($1, $2)`,
        ['Trophy Point', 12.00]
      );
      console.log('✅ Created sample company: Trophy Point\n');
    }

    console.log('🎉 Database seeding completed successfully!\n');
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║                                                              ║');
    console.log('║       DATABASE SEEDING COMPLETE                              ║');
    console.log('║                                                              ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');
    console.log('Default Admin Credentials:');
    console.log('Email:', adminEmail);
    console.log('Password:', adminPassword);
    console.log('\n⚠️  SECURITY: Change admin password immediately!\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
}

seed();

