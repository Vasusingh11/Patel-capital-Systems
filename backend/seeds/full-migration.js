/**
 * Full Migration Script: JS Data to PostgreSQL
 * Transfers ALL investor data from frontend JS files to the database
 */

require('dotenv').config();
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Helper to parse date strings
function parseDate(dateStr) {
  if (!dateStr) return null;
  
  const months = {
    'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
    'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
    'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
  };
  
  const match = dateStr.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/);
  if (match) {
    const [, day, mon, year] = match;
    return `${year}-${months[mon]}-${day.padStart(2, '0')}`;
  }
  
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return dateStr;
  }
  
  return null;
}

// Load JS data by evaluating the module
function loadJSData(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Extract the function and data
  if (filePath.includes('patelCapitalPartnersData')) {
    const match = content.match(/export const getPatelCapitalPartnersData = \(\) => \((\{[\s\S]*\})\);/);
    if (match) {
      return eval('(' + match[1] + ')');
    }
  } else if (filePath.includes('trophyPointData')) {
    const match = content.match(/export const getTrophyPointData = \(\) => \((\{[\s\S]*\})\);/);
    if (match) {
      return eval('(' + match[1] + ')');
    }
  }
  return null;
}

async function migrate() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting full data migration...\n');
    
    await client.query('BEGIN');
    
    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await client.query('DELETE FROM investor_transactions');
    await client.query('DELETE FROM investors');
    await client.query('DELETE FROM companies WHERE id > 0');
    
    // Reset sequences
    await client.query("SELECT setval('companies_id_seq', 1, false)");
    await client.query("SELECT setval('investors_id_seq', 1, false)");
    await client.query("SELECT setval('investor_transactions_id_seq', 1, false)");
    
    // Load data from JS files
    const pcpDataPath = path.join(__dirname, '../../src/utils/patelCapitalPartnersData.js');
    const tpDataPath = path.join(__dirname, '../../src/utils/trophyPointData.js');
    
    console.log('📂 Loading Patel Capital Partners data...');
    const pcpData = loadJSData(pcpDataPath);
    
    console.log('📂 Loading Trophy Point data...');
    const tpData = loadJSData(tpDataPath);
    
    if (!pcpData || !tpData) {
      throw new Error('Failed to load data from JS files');
    }
    
    // Insert companies
    console.log('\n📊 Creating companies...');
    
    const pcpDescription = `${pcpData.address}\nPhone: ${pcpData.phone}\nEmail: ${pcpData.email}`;
    const pcpResult = await client.query(
      `INSERT INTO companies (name, default_interest_rate, description)
       VALUES ($1, $2, $3) RETURNING id`,
      [pcpData.name, pcpData.defaultRate, pcpDescription]
    );
    const pcpCompanyId = pcpResult.rows[0].id;
    console.log(`   ✅ Created: ${pcpData.name} (ID: ${pcpCompanyId})`);
    
    const tpDescription = `${tpData.address}`;
    const tpResult = await client.query(
      `INSERT INTO companies (name, default_interest_rate, description)
       VALUES ($1, $2, $3) RETURNING id`,
      [tpData.name, tpData.defaultRate, tpDescription]
    );
    const tpCompanyId = tpResult.rows[0].id;
    console.log(`   ✅ Created: ${tpData.name} (ID: ${tpCompanyId})`);
    
    // Insert investors and transactions
    let totalInvestors = 0;
    let totalTransactions = 0;
    
    // Process Patel Capital Partners investors
    console.log(`\n👥 Migrating ${pcpData.investors.length} Patel Capital Partners investors...`);
    
    for (const investor of pcpData.investors) {
      const startDate = parseDate(investor.startDate);
      
      // Calculate current balance from transactions
      let currentBalance = investor.initialInvestment;
      for (const tx of investor.transactions) {
        if (tx.type === 'investment' || tx.type === 'initial') {
          currentBalance += tx.amount;
        } else if (tx.type === 'withdrawal') {
          currentBalance -= tx.amount;
        } else if (tx.type === 'interest-earned' && investor.reinvesting) {
          currentBalance += tx.amount;
        }
      }
      
      const invResult = await client.query(
        `INSERT INTO investors (company_id, name, address, email, phone, initial_investment, current_balance, interest_rate, investment_date, notes, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'active') RETURNING id`,
        [
          pcpCompanyId,
          investor.name,
          investor.address || '',
          investor.email || '',
          investor.phone || '',
          investor.initialInvestment,
          currentBalance,
          investor.interestRate,
          startDate,
          investor.reinvesting ? 'Reinvesting' : 'Interest paid out'
        ]
      );
      
      const investorId = invResult.rows[0].id;
      totalInvestors++;
      
      // Insert transactions
      // Valid types: initial, investment, withdrawal, interest-earned, interest-paid, bonus, fee, adjustment
      const validTypes = ['initial', 'investment', 'withdrawal', 'interest-earned', 'interest-paid', 'bonus', 'fee', 'adjustment'];
      
      for (const tx of investor.transactions) {
        const txDate = parseDate(tx.date);
        if (!txDate) continue;
        
        // Map or skip invalid transaction types
        let txType = tx.type;
        if (!validTypes.includes(txType)) {
          if (txType === 'rate-change' || txType === 'manual-transaction') {
            txType = 'adjustment'; // Map these to adjustment
          } else {
            continue; // Skip unknown types
          }
        }
        
        await client.query(
          `INSERT INTO investor_transactions (investor_id, transaction_date, transaction_type, amount, description)
           VALUES ($1, $2, $3, $4, $5)`,
          [investorId, txDate, txType, tx.amount, tx.description]
        );
        totalTransactions++;
      }
      
      console.log(`   ✅ ${investor.name}: ${investor.transactions.length} transactions`);
    }
    
    // Process Trophy Point investors
    console.log(`\n👥 Migrating ${tpData.investors.length} Trophy Point investors...`);
    
    for (const investor of tpData.investors) {
      const startDate = parseDate(investor.startDate);
      
      // Use current balance from data if available, otherwise calculate
      let currentBalance = investor.currentBalance || investor.initialInvestment;
      if (!investor.currentBalance) {
        for (const tx of investor.transactions) {
          if (tx.type === 'investment' || tx.type === 'initial') {
            currentBalance += tx.amount;
          } else if (tx.type === 'withdrawal') {
            currentBalance -= tx.amount;
          } else if (tx.type === 'interest-earned' && investor.reinvesting) {
            currentBalance += tx.amount;
          }
        }
      }
      
      const invResult = await client.query(
        `INSERT INTO investors (company_id, name, address, email, phone, initial_investment, current_balance, interest_rate, investment_date, notes, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'active') RETURNING id`,
        [
          tpCompanyId,
          investor.name,
          investor.address || '',
          investor.email || '',
          investor.phone || '',
          investor.initialInvestment,
          currentBalance,
          investor.interestRate,
          startDate,
          investor.reinvesting ? 'Reinvesting' : 'Interest paid out'
        ]
      );
      
      const investorId = invResult.rows[0].id;
      totalInvestors++;
      
      // Insert transactions
      // Valid types: initial, investment, withdrawal, interest-earned, interest-paid, bonus, fee, adjustment
      const validTypesTp = ['initial', 'investment', 'withdrawal', 'interest-earned', 'interest-paid', 'bonus', 'fee', 'adjustment'];
      
      for (const tx of investor.transactions) {
        const txDate = parseDate(tx.date);
        if (!txDate) continue;
        
        // Map or skip invalid transaction types
        let txType = tx.type;
        if (!validTypesTp.includes(txType)) {
          if (txType === 'rate-change' || txType === 'manual-transaction') {
            txType = 'adjustment'; // Map these to adjustment
          } else {
            continue; // Skip unknown types
          }
        }
        
        await client.query(
          `INSERT INTO investor_transactions (investor_id, transaction_date, transaction_type, amount, description)
           VALUES ($1, $2, $3, $4, $5)`,
          [investorId, txDate, txType, tx.amount, tx.description]
        );
        totalTransactions++;
      }
      
      console.log(`   ✅ ${investor.name}: ${investor.transactions.length} transactions`);
    }
    
    await client.query('COMMIT');
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ MIGRATION COMPLETE!');
    console.log('='.repeat(60));
    console.log(`   Companies:    2`);
    console.log(`   Investors:    ${totalInvestors}`);
    console.log(`   Transactions: ${totalTransactions}`);
    console.log('='.repeat(60) + '\n');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(console.error);

