const express = require('express');
const router = express.Router();
const { query } = require('../database/db');
const { auth } = require('../middleware/auth');

// @route   GET /api/reports/dashboard
// @desc    Get dashboard summary
// @access  Private
router.get('/dashboard', auth, async (req, res) => {
  try {
    // Get total companies
    const companiesResult = await query(
      'SELECT COUNT(*) as count, SUM(CASE WHEN is_active = true THEN 1 ELSE 0 END) as active_count FROM companies'
    );

    // Get total investors
    const investorsResult = await query(
      'SELECT COUNT(*) as count, SUM(CASE WHEN is_active = true THEN 1 ELSE 0 END) as active_count FROM investors'
    );

    // Get total balances
    const balancesResult = await query(
      'SELECT SUM(current_balance) as total_balance, SUM(total_interest_earned) as total_interest FROM investor_balances'
    );

    // Get recent transactions
    const transactionsResult = await query(`
      SELECT 
        t.*,
        i.name as investor_name,
        c.name as company_name
      FROM transactions t
      LEFT JOIN investors i ON t.investor_id = i.id
      LEFT JOIN companies c ON i.company_id = c.id
      ORDER BY t.transaction_date DESC, t.created_at DESC
      LIMIT 10
    `);

    res.json({
      success: true,
      data: {
        companies: companiesResult.rows[0],
        investors: investorsResult.rows[0],
        balances: balancesResult.rows[0],
        recentTransactions: transactionsResult.rows
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard data'
    });
  }
});

// @route   GET /api/reports/investor/:id/statement
// @desc    Get investor statement for a date range
// @access  Private
router.get('/investor/:id/statement', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { start_date, end_date } = req.query;

    // Get investor info
    const investorResult = await query(
      `SELECT 
        i.*,
        c.name as company_name,
        ib.current_balance
      FROM investors i
      LEFT JOIN companies c ON i.company_id = c.id
      LEFT JOIN investor_balances ib ON i.id = ib.investor_id
      WHERE i.id = $1`,
      [id]
    );

    if (investorResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Investor not found'
      });
    }

    // Get transactions for period
    let transactionsQuery = `
      SELECT * FROM transactions
      WHERE investor_id = $1
    `;
    
    const params = [id];
    
    if (start_date) {
      transactionsQuery += ` AND transaction_date >= $2`;
      params.push(start_date);
      if (end_date) {
        transactionsQuery += ` AND transaction_date <= $3`;
        params.push(end_date);
      }
    } else if (end_date) {
      transactionsQuery += ` AND transaction_date <= $2`;
      params.push(end_date);
    }
    
    transactionsQuery += ` ORDER BY transaction_date, created_at`;
    
    const transactionsResult = await query(transactionsQuery, params);

    // Calculate running balances
    let runningBalance = 0;
    const transactionsWithBalance = transactionsResult.rows.map(tx => {
      if (['initial', 'investment', 'interest-earned', 'bonus'].includes(tx.type)) {
        runningBalance += parseFloat(tx.amount);
      } else if (['withdrawal', 'interest-paid', 'fee'].includes(tx.type)) {
        runningBalance -= parseFloat(tx.amount);
      } else if (tx.type === 'adjustment') {
        runningBalance += parseFloat(tx.amount);
      }
      
      return {
        ...tx,
        running_balance: runningBalance
      };
    });

    res.json({
      success: true,
      data: {
        investor: investorResult.rows[0],
        transactions: transactionsWithBalance,
        period: {
          start_date: start_date || investorResult.rows[0].start_date,
          end_date: end_date || new Date().toISOString().split('T')[0]
        }
      }
    });
  } catch (error) {
    console.error('Statement error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating statement'
    });
  }
});

module.exports = router;

