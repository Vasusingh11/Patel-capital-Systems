/**
 * Migration Script: JS Data to PostgreSQL
 * This script migrates investor data from the frontend JS files to PostgreSQL
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Helper to parse date strings like "23-Apr-2021" or "2022-01-15"
function parseDate(dateStr) {
  if (!dateStr) return null;
  
  // Handle DD-Mon-YYYY format
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
  
  // Handle YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }
  
  return dateStr;
}

// Map transaction types to valid database types
function mapTransactionType(type) {
  const validTypes = ['initial', 'investment', 'withdrawal', 'interest-earned', 'interest-paid', 'bonus', 'fee', 'adjustment'];
  if (validTypes.includes(type)) return type;
  
  // Map custom types to valid ones
  const mappings = {
    'rate-change': 'adjustment',
    'manual-transaction': 'adjustment'
  };
  
  return mappings[type] || 'adjustment';
}

// Patel Capital Partners Investors Data
const patelCapitalInvestors = [
  {
    name: 'Gita and Raja Srinivasan',
    address: '65 S Merion Ave Bryn Mawr, PA, 19010',
    email: 'gitasrini@gmail.com',
    phone: '(617) 955-0833',
    initialInvestment: 300000.00,
    interestRate: 10.00,
    startDate: '23-Apr-2021',
    transactions: [
      { date: '23-Apr-2021', type: 'initial', amount: 300000.00, description: 'Initial balance @ 10% interest rate' },
      { date: '30-Jun-2021', type: 'interest-earned', amount: 5671.23, description: 'Prorated interest earned this quarter (April 23 - June 30, 2021) - 69 days @ 10%' },
      { date: '30-Jun-2021', type: 'interest-paid', amount: 5671.23, description: 'Interest paid' },
      { date: '30-Sep-2021', type: 'interest-earned', amount: 7500.00, description: 'Interest earned this quarter (July - September 2021) @ 10%' },
      { date: '30-Sep-2021', type: 'interest-paid', amount: 7500.00, description: 'Interest paid' },
      { date: '31-Dec-2021', type: 'interest-earned', amount: 7500.00, description: 'Interest earned this quarter (October - December 2021) @ 10%' },
      { date: '31-Dec-2021', type: 'interest-paid', amount: 7500.00, description: 'Interest paid' },
      { date: '31-Mar-2022', type: 'interest-earned', amount: 7500.00, description: 'Interest earned this quarter (January - March 2022) @ 10%' },
      { date: '31-Mar-2022', type: 'interest-paid', amount: 7500.00, description: 'Interest paid' },
      { date: '07-Jul-2022', type: 'interest-earned', amount: 7500.00, description: 'Interest earned this quarter (April - June 2022) @ 10%' },
      { date: '07-Jul-2022', type: 'interest-paid', amount: 7500.00, description: 'Interest paid' },
      { date: '11-Jul-2022', type: 'investment', amount: 50000.00, description: 'Additional Contribution 1' },
      { date: '07-Oct-2022', type: 'interest-earned', amount: 8623.29, description: 'Interest earned this quarter (July - September 2022) @ 10%' },
      { date: '07-Oct-2022', type: 'interest-paid', amount: 8623.29, description: 'Interest paid' },
      { date: '28-Dec-2022', type: 'interest-earned', amount: 8750.00, description: 'Interest earned this quarter (October - December 2022) @ 10%' },
      { date: '28-Dec-2022', type: 'interest-paid', amount: 8750.00, description: 'Interest paid' },
      { date: '31-Oct-2023', type: 'investment', amount: 250000.00, description: 'Additional Investment' },
      { date: '31-Dec-2023', type: 'interest-earned', amount: 13439.55, description: 'Q4 2023 Interest @ 10%' },
      { date: '31-Mar-2024', type: 'interest-earned', amount: 18934.74, description: 'Q1 2024 Interest Earned/Reinvested @ 12%' },
      { date: '30-Jun-2024', type: 'interest-earned', amount: 19502.78, description: 'Q2 2024 Interest Earned/Reinvested @ 12%' },
      { date: '30-Sep-2024', type: 'interest-earned', amount: 20087.86, description: 'Q3 2024 Interest Earned/Reinvested @ 12%' },
      { date: '30-Dec-2024', type: 'interest-earned', amount: 20690.50, description: 'Q4 2024 Interest Earned/Reinvested @ 12%' },
      { date: '31-Mar-2025', type: 'interest-earned', amount: 17759.34, description: 'Q1 2025 Interest Earned/Reinvested @ 10%' },
      { date: '30-Jun-2025', type: 'interest-earned', amount: 18203.33, description: 'Q2 2025 Interest Earned/Reinvested @ 10%' },
      { date: '30-Sep-2025', type: 'interest-earned', amount: 18658.41, description: 'Q3 2025 Interest Earned/Reinvested @ 10%' }
    ]
  },
  {
    name: 'Forge Trust Co CFBO GITA SRINIVASAN IRA 719035',
    address: '65 S Merion Ave Bryn Mawr, PA, 19010',
    email: 'gitasrini@gmail.com',
    phone: '(617) 955-0833',
    initialInvestment: 1300000.00,
    interestRate: 10.00,
    startDate: '03-Mar-2023',
    transactions: [
      { date: '03-Mar-2023', type: 'initial', amount: 1300000.00, description: 'Initial Balance @ 10% interest rate' },
      { date: '07-Apr-2023', type: 'interest-earned', amount: 10328.77, description: 'Q1 2023 Prorated Interest (Mar 3 - Mar 31) 29 days @ 10%' },
      { date: '13-Jul-2023', type: 'interest-earned', amount: 32758.22, description: 'Q2 2023 Interest Earned/Reinvested @ 10%' },
      { date: '15-Oct-2023', type: 'interest-earned', amount: 33577.17, description: 'Q3 2023 Interest Earned/Reinvested @ 10%' },
      { date: '31-Dec-2023', type: 'interest-earned', amount: 34416.60, description: 'Q4 2023 Interest Earned/Reinvested @ 10%' },
      { date: '31-Mar-2024', type: 'interest-earned', amount: 42332.42, description: 'Q1 2024 Interest Earned/Reinvested @ 12%' },
      { date: '30-Jun-2024', type: 'interest-earned', amount: 43602.40, description: 'Q2 2024 Interest Earned/Reinvested @ 12%' },
      { date: '30-Sep-2024', type: 'interest-earned', amount: 44910.47, description: 'Q3 2024 Interest Earned/Reinvested @ 12%' },
      { date: '30-Dec-2024', type: 'interest-earned', amount: 46257.78, description: 'Q4 2024 Interest Earned/Reinvested @ 12%' },
      { date: '31-Mar-2025', type: 'interest-earned', amount: 39704.60, description: 'Q1 2025 Interest Earned/Reinvested @ 10%' },
      { date: '30-Jun-2025', type: 'interest-earned', amount: 40697.21, description: 'Q2 2025 Interest Earned/Reinvested @ 10%' },
      { date: '30-Sep-2025', type: 'interest-earned', amount: 41714.64, description: 'Q3 2025 Interest Earned/Reinvested @ 10%' }
    ]
  },
  {
    name: 'Rajiv Srinivasan LLC',
    address: '2854 Harbor Road; Shelburne VT 05482',
    email: 'r@srin.me',
    phone: '703-581-9031',
    initialInvestment: 150000.00,
    interestRate: 10.00,
    startDate: '13-Feb-2019',
    transactions: [
      { date: '13-Feb-2019', type: 'initial', amount: 150000.00, description: 'Initial balance @ 7% interest rate' },
      { date: '29-Oct-2019', type: 'investment', amount: 50000.00, description: 'Additional Investment' },
      { date: '16-Jan-2023', type: 'investment', amount: 50000.00, description: 'Additional Investment 2 @ 10%' },
      { date: '28-Jul-2023', type: 'investment', amount: 50000.00, description: 'Additional Investment Ck 1422' },
      { date: '01-Mar-2024', type: 'investment', amount: 200000.00, description: 'Additional Investment' },
      { date: '28-May-2024', type: 'investment', amount: 250000.00, description: 'Additional Investment' },
      { date: '29-May-2024', type: 'investment', amount: 150000.00, description: 'Additional Investment' },
      { date: '22-Nov-2024', type: 'investment', amount: 135000.00, description: 'Additional Investment' },
      { date: '30-Sep-2025', type: 'interest-earned', amount: 30157.31, description: 'Q3 2025 Interest Earned/Reinvested @ 10%' }
    ]
  },
  {
    name: 'Chhumal Patel',
    address: '5500 E Morton Rd Alpharetta, GA 30009',
    email: 'cpatel1966@gmail.com',
    phone: '678-230-9611',
    initialInvestment: 20000.00,
    interestRate: 10.00,
    startDate: '07-Dec-2020',
    transactions: [
      { date: '07-Dec-2020', type: 'initial', amount: 20000.00, description: 'Initial balance @ 8% interest rate' },
      { date: '08-Dec-2020', type: 'investment', amount: 30000.00, description: 'Additional Investment 1' },
      { date: '15-Jul-2021', type: 'investment', amount: 30000.00, description: 'Additional Investment 2' },
      { date: '26-Oct-2021', type: 'investment', amount: 35000.00, description: 'Additional Investment 3' },
      { date: '01-Jan-2022', type: 'investment', amount: 20000.00, description: 'Additional Investment 4' },
      { date: '11-Apr-2022', type: 'investment', amount: 200000.00, description: 'Additional Investment 5' },
      { date: '30-Sep-2025', type: 'interest-earned', amount: 8375.00, description: 'Q3 Interest Earned @ 10%' }
    ]
  },
  {
    name: 'Naresh Patel',
    address: '3740 Merrimac Lane E Hanover, IL 60133',
    email: 'travelodgewaukegan@hotmail.com',
    phone: '224-381-9395',
    initialInvestment: 30000.00,
    interestRate: 10.00,
    startDate: '26-May-2021',
    transactions: [
      { date: '26-May-2021', type: 'initial', amount: 30000.00, description: 'Initial balance @ 8% interest rate' },
      { date: '14-Oct-2022', type: 'investment', amount: 20000.00, description: 'Additional Investment 1' },
      { date: '22-Mar-2024', type: 'investment', amount: 25000.00, description: 'Additional Investment 2' },
      { date: '01-Jan-2025', type: 'investment', amount: 500000.00, description: 'Additional investment' },
      { date: '10-Feb-2025', type: 'investment', amount: 500000.00, description: 'Additional investment @ 12%' },
      { date: '30-Sep-2025', type: 'interest-earned', amount: 32250.00, description: 'Q3 2025 Interest Earned @ 12%' }
    ]
  },
  {
    name: 'Pravina Patel',
    address: '3911 Bianca Springs LN, Katy TX 77494',
    email: 'ppatel96@hotmail.com',
    phone: '813-760-4592',
    initialInvestment: 25000.00,
    interestRate: 10.00,
    startDate: '31-Dec-2019',
    transactions: [
      { date: '31-Dec-2019', type: 'initial', amount: 25000.00, description: 'Initial Balance @ 7% interest rate' },
      { date: '23-Nov-2020', type: 'investment', amount: 75000.00, description: 'Additional Investment 1' },
      { date: '16-Jul-2021', type: 'investment', amount: 400000.00, description: 'Additional Investment 2' },
      { date: '01-Apr-2022', type: 'investment', amount: 100000.00, description: 'Additional Investment 3' },
      { date: '11-Apr-2022', type: 'withdrawal', amount: 200000.00, description: 'Withdrawal' },
      { date: '16-Dec-2022', type: 'withdrawal', amount: 100000.00, description: 'Withdrawal' },
      { date: '30-Sep-2025', type: 'interest-earned', amount: 7879.69, description: 'Q3 2025 Interest Earned/Reinvested @ 10%' }
    ]
  },
  {
    name: 'Tarun Patel',
    address: '6608 Brynhurst Drive, Tucker GA 30084',
    email: 'tarunbpatelxibm@gmail.com',
    phone: '(404)-786-2656',
    initialInvestment: 80000.00,
    interestRate: 10.00,
    startDate: '30-Apr-2018',
    transactions: [
      { date: '30-Apr-2018', type: 'initial', amount: 80000.00, description: 'Initial Balance @ 10% interest rate' },
      { date: '08-Jan-2019', type: 'investment', amount: 20000.00, description: 'Additional Investment 1' },
      { date: '02-Nov-2020', type: 'investment', amount: 50000.00, description: 'Additional Investment 2' },
      { date: '07-Dec-2020', type: 'investment', amount: 125000.00, description: 'Additional Investment 3' },
      { date: '12-Jan-2023', type: 'investment', amount: 50000.00, description: 'Additional Contribution 4' },
      { date: '30-Sep-2025', type: 'interest-earned', amount: 9422.51, description: 'Q3 2025 Interest Earned/Reinvested @ 10%' }
    ]
  },
  {
    name: 'Tauseef Kidwai',
    address: '2331 N 190th St, Shoreline, WA 98133',
    email: 'tauseef.kidwai@gmail.com',
    phone: '206-422-2062',
    initialInvestment: 50000.00,
    interestRate: 8.00,
    startDate: '31-Dec-2019',
    transactions: [
      { date: '31-Dec-2019', type: 'initial', amount: 50000.00, description: 'Initial balance @ 5% interest rate' },
      { date: '30-Sep-2025', type: 'interest-earned', amount: 1000.00, description: 'Q3 Interest earned @ 8%' }
    ]
  },
  {
    name: 'Alison Seaman',
    address: '10337 Salida Dr Austin, TX 78749',
    email: 'alisonseaman@yahoo.com',
    phone: '650-714-5142',
    initialInvestment: 75000.00,
    interestRate: 8.00,
    startDate: '15-Dec-2018',
    transactions: [
      { date: '15-Dec-2018', type: 'initial', amount: 75000.00, description: 'Initial balance @ 7% interest rate' },
      { date: '30-Sep-2025', type: 'interest-earned', amount: 1500.00, description: 'Q3 Interest earned @ 8%' }
    ]
  },
  {
    name: 'Ami Patel',
    address: '610 Andover St San Francisco CA 94110',
    email: 'atp2011@gmail.com',
    phone: '(404)-723-3263',
    initialInvestment: 30000.00,
    interestRate: 10.00,
    startDate: '01-Jun-2025',
    transactions: [
      { date: '01-Jun-2025', type: 'initial', amount: 30000.00, description: 'Initial Balance/Investment @ 10% interest' },
      { date: '30-Jun-2025', type: 'interest-earned', amount: 246.58, description: 'Q2 2025 Interest Earned/Reinvested Prorated' },
      { date: '30-Sep-2025', type: 'interest-earned', amount: 756.16, description: 'Q3 2025 Interest Earned/Reinvested @ 10%' }
    ]
  }
];

// Trophy Point Investors Data
const trophyPointInvestors = [
  {
    name: 'Patel Capital 1',
    address: '6608 Brynhurst Drive, Tucker, GA 30084',
    email: 'samir@trophypointinvestment.com',
    phone: '(404) 723-8410',
    initialInvestment: 110405.38,
    interestRate: 12.00,
    startDate: '01-Jan-2023',
    transactions: [
      { date: '01-Jan-2023', type: 'initial', amount: 110405.38, description: 'Initial Investment' },
      { date: '12-Jan-2023', type: 'investment', amount: 85000.00, description: 'Additional Investment' },
      { date: '01-Apr-2023', type: 'investment', amount: 300000.00, description: 'Additional Investment Apr 1' },
      { date: '01-Jul-2023', type: 'investment', amount: 1150000.00, description: 'Additional Investment Jul 1' },
      { date: '01-Oct-2023', type: 'investment', amount: 500000.00, description: 'Additional Investment Oct 1' },
      { date: '01-Nov-2023', type: 'investment', amount: 300000.00, description: 'Additional Investment Nov 1' },
      { date: '01-Dec-2023', type: 'investment', amount: 115000.00, description: 'Additional Investment Dec 1' },
      { date: '31-Dec-2023', type: 'withdrawal', amount: 114736.45, description: 'Year-end withdrawal' },
      { date: '01-Apr-2024', type: 'investment', amount: 125000.00, description: 'Additional Investment Apr 1' },
      { date: '01-May-2024', type: 'investment', amount: 250000.00, description: 'Additional Investment May 1' },
      { date: '01-Jul-2024', type: 'investment', amount: 185000.00, description: 'Additional Investment Jul 1' },
      { date: '01-Oct-2024', type: 'investment', amount: 123735.33, description: 'Additional Investment Oct 1' },
      { date: '30-Sep-2025', type: 'interest-earned', amount: 106289.24, description: 'Q3 2025 Interest Earned/Reinvested @ 12%' }
    ]
  },
  {
    name: 'Patel Capital 2',
    address: '6608 Brynhurst Drive, Tucker, GA 30084',
    email: 'pc2@patel-capital.net',
    phone: '',
    initialInvestment: 71871.55,
    interestRate: 12.00,
    startDate: '17-Aug-2020',
    transactions: [
      { date: '01-Sep-2020', type: 'initial', amount: 71871.55, description: 'Initial Investment Sep 1' },
      { date: '15-Sep-2020', type: 'withdrawal', amount: 53871.55, description: 'Redemption' },
      { date: '01-Dec-2020', type: 'investment', amount: 121000.00, description: 'Additional Investment Dec 1' },
      { date: '01-Jan-2021', type: 'investment', amount: 125000.00, description: 'Additional Investment Jan 1' },
      { date: '01-Apr-2021', type: 'investment', amount: 500000.00, description: 'Additional Investment Apr 1' },
      { date: '01-May-2021', type: 'investment', amount: 600000.00, description: 'Additional Investment May 1' },
      { date: '01-Jun-2021', type: 'investment', amount: 650000.00, description: 'Additional Investment Jun 1' },
      { date: '01-Jul-2021', type: 'investment', amount: 525000.00, description: 'Additional Investment Jul 1' },
      { date: '01-Aug-2021', type: 'investment', amount: 675000.00, description: 'Additional Investment Aug 1' },
      { date: '01-Sep-2021', type: 'investment', amount: 350000.00, description: 'Additional Investment Sep 1' },
      { date: '01-Oct-2021', type: 'investment', amount: 200000.00, description: 'Additional Investment Oct 1' },
      { date: '19-Oct-2021', type: 'withdrawal', amount: 200000.00, description: 'Redemption' },
      { date: '01-Nov-2021', type: 'investment', amount: 100000.00, description: 'Additional Investment Nov 1' },
      { date: '31-Dec-2021', type: 'withdrawal', amount: 3400000.00, description: 'Large Redemption' },
      { date: '01-Jan-2022', type: 'investment', amount: 267815.63, description: 'Transfer Jan 1' },
      { date: '18-Feb-2022', type: 'withdrawal', amount: 30000.00, description: 'Redemption' },
      { date: '01-Mar-2022', type: 'investment', amount: 25000.00, description: 'Additional Investment Mar 1' },
      { date: '13-Feb-2025', type: 'investment', amount: 500000.00, description: 'Additional Investment Feb 13' },
      { date: '26-Mar-2025', type: 'withdrawal', amount: 20381.61, description: 'Redemption' },
      { date: '30-Sep-2025', type: 'interest-earned', amount: 71033.91, description: 'Q3 2025 Interest Earned @ 12%' }
    ]
  },
  {
    name: 'Patel Capital 3',
    address: '6608 Brynhurst Drive, Tucker, GA 30084',
    email: 'pc3@patel-capital.net',
    phone: '',
    initialInvestment: 703736.40,
    interestRate: 12.00,
    startDate: '01-Oct-2023',
    transactions: [
      { date: '01-Oct-2023', type: 'initial', amount: 662835.00, description: 'Initial Investment @ 11%' },
      { date: '01-Oct-2023', type: 'investment', amount: 40901.40, description: 'Transfer In Oct 1' },
      { date: '23-Oct-2023', type: 'withdrawal', amount: 200000.00, description: 'Redemption' },
      { date: '31-Dec-2023', type: 'withdrawal', amount: 64639.12, description: 'Redemption' },
      { date: '31-Dec-2023', type: 'investment', amount: 7295.44, description: 'Additional Investment' },
      { date: '01-Jan-2024', type: 'investment', amount: 400000.00, description: 'CORRECTION: $400k added back' },
      { date: '03-Jan-2024', type: 'withdrawal', amount: 100000.00, description: 'Redemption' },
      { date: '05-Jan-2024', type: 'withdrawal', amount: 1666.67, description: 'Redemption' },
      { date: '31-Jan-2024', type: 'investment', amount: 1539.89, description: 'Additional Investment' },
      { date: '02-Feb-2024', type: 'withdrawal', amount: 101666.67, description: 'Redemption' },
      { date: '05-Feb-2024', type: 'withdrawal', amount: 250000.00, description: 'Redemption' },
      { date: '01-Mar-2024', type: 'investment', amount: 2140.13, description: 'Additional Investment Mar 1' },
      { date: '01-Apr-2024', type: 'investment', amount: 300000.00, description: 'Additional Investment Apr 1' },
      { date: '01-May-2024', type: 'investment', amount: 100000.00, description: 'Additional Investment May 1' },
      { date: '26-Aug-2024', type: 'withdrawal', amount: 250000.00, description: 'Redemption' },
      { date: '01-May-2025', type: 'investment', amount: 651733.34, description: 'Additional Investment May 1' },
      { date: '30-Sep-2025', type: 'interest-earned', amount: 53790.45, description: 'Q3 2025 Interest Earned @ 12%' }
    ]
  }
];

async function migrate() {
  const client = await pool.connect();
  
  try {
    console.log('Starting migration...\n');
    
    await client.query('BEGIN');
    
    // Clear existing data
    console.log('Clearing existing sample data...');
    await client.query('DELETE FROM investor_transactions');
    await client.query('DELETE FROM investors');
    
    // Get company IDs
    const companiesResult = await client.query('SELECT id, name FROM companies');
    const companies = {};
    companiesResult.rows.forEach(row => {
      if (row.name.includes('Patel Capital Partners')) companies.patel = row.id;
      if (row.name.includes('Trophy Point')) companies.trophy = row.id;
    });
    
    console.log('Companies found:', companies);
    
    // Insert Patel Capital Partners investors
    console.log('\nInserting Patel Capital Partners investors...');
    for (const investor of patelCapitalInvestors) {
      const startDate = parseDate(investor.startDate);
      
      // Calculate current balance from transactions
      let balance = 0;
      for (const t of investor.transactions) {
        if (['initial', 'investment', 'interest-earned', 'bonus'].includes(t.type)) {
          balance += t.amount;
        } else if (['withdrawal', 'interest-paid', 'fee'].includes(t.type)) {
          balance -= t.amount;
        }
      }
      
      const investorResult = await client.query(
        `INSERT INTO investors (company_id, name, email, phone, address, initial_investment, current_balance, interest_rate, investment_date, status, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'active', 'Migrated from JS data')
         RETURNING id`,
        [companies.patel, investor.name, investor.email, investor.phone, investor.address, investor.initialInvestment, balance, investor.interestRate, startDate]
      );
      
      const investorId = investorResult.rows[0].id;
      console.log(`  - ${investor.name} (ID: ${investorId})`);
      
      // Insert transactions
      for (const t of investor.transactions) {
        const transDate = parseDate(t.date);
        const transType = mapTransactionType(t.type);
        
        // Calculate running balance
        if (['initial', 'investment', 'interest-earned', 'bonus'].includes(transType)) {
          balance = balance; // Already calculated above
        }
        
        await client.query(
          `INSERT INTO investor_transactions (investor_id, transaction_date, transaction_type, amount, description)
           VALUES ($1, $2, $3, $4, $5)`,
          [investorId, transDate, transType, t.amount, t.description]
        );
      }
    }
    
    // Insert Trophy Point investors
    console.log('\nInserting Trophy Point investors...');
    for (const investor of trophyPointInvestors) {
      const startDate = parseDate(investor.startDate);
      
      // Calculate current balance
      let balance = 0;
      for (const t of investor.transactions) {
        if (['initial', 'investment', 'interest-earned', 'bonus'].includes(t.type)) {
          balance += t.amount;
        } else if (['withdrawal', 'interest-paid', 'fee'].includes(t.type)) {
          balance -= t.amount;
        }
      }
      
      const investorResult = await client.query(
        `INSERT INTO investors (company_id, name, email, phone, address, initial_investment, current_balance, interest_rate, investment_date, status, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'active', 'Migrated from JS data')
         RETURNING id`,
        [companies.trophy, investor.name, investor.email || '', investor.phone || '', investor.address, investor.initialInvestment, balance, investor.interestRate, startDate]
      );
      
      const investorId = investorResult.rows[0].id;
      console.log(`  - ${investor.name} (ID: ${investorId})`);
      
      // Insert transactions
      for (const t of investor.transactions) {
        const transDate = parseDate(t.date);
        const transType = mapTransactionType(t.type);
        
        await client.query(
          `INSERT INTO investor_transactions (investor_id, transaction_date, transaction_type, amount, description)
           VALUES ($1, $2, $3, $4, $5)`,
          [investorId, transDate, transType, t.amount, t.description]
        );
      }
    }
    
    await client.query('COMMIT');
    
    // Summary
    const investorCount = await client.query('SELECT COUNT(*) FROM investors');
    const transCount = await client.query('SELECT COUNT(*) FROM investor_transactions');
    
    console.log('\n========================================');
    console.log('Migration completed successfully!');
    console.log(`  Total investors: ${investorCount.rows[0].count}`);
    console.log(`  Total transactions: ${transCount.rows[0].count}`);
    console.log('========================================\n');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(console.error);

