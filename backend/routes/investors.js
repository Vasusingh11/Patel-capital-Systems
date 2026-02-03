const express = require('express');
const router = express.Router();
const { query, transaction } = require('../database/db');
const { auth, isAdmin } = require('../middleware/auth');

// @route   GET /api/investors
// @desc    Get all investors with their transactions
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { company_id, include_archived } = req.query;
    
    let queryText = `
      SELECT 
        i.*,
        c.name as company_name
      FROM investors i
      LEFT JOIN companies c ON i.company_id = c.id
    `;
    
    const params = [];
    const conditions = [];
    
    // Include archived investors if requested, otherwise only active
    if (include_archived !== 'true') {
      conditions.push(`i.status = 'active'`);
    }
    
    if (company_id) {
      params.push(company_id);
      conditions.push(`i.company_id = $${params.length}`);
    }
    
    if (conditions.length > 0) {
      queryText += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    queryText += ` ORDER BY i.name`;
    
    const investorsResult = await query(queryText, params);
    
    // Fetch transactions for all investors
    const investorIds = investorsResult.rows.map(inv => inv.id);
    
    if (investorIds.length > 0) {
      const transactionsResult = await query(
        `SELECT * FROM investor_transactions 
         WHERE investor_id = ANY($1)
         ORDER BY transaction_date, created_at`,
        [investorIds]
      );
      
      // Group transactions by investor_id
      const transactionsByInvestor = {};
      transactionsResult.rows.forEach(tx => {
        if (!transactionsByInvestor[tx.investor_id]) {
          transactionsByInvestor[tx.investor_id] = [];
        }
        transactionsByInvestor[tx.investor_id].push(tx);
      });
      
      // Attach transactions to each investor
      investorsResult.rows.forEach(investor => {
        investor.transactions = transactionsByInvestor[investor.id] || [];
      });
    }

    res.json({
      success: true,
      count: investorsResult.rows.length,
      data: investorsResult.rows
    });
  } catch (error) {
    console.error('Get investors error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching investors'
    });
  }
});

// @route   GET /api/investors/:id
// @desc    Get single investor with transactions
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    // Get investor
    const investorResult = await query(
      `SELECT 
        i.*,
        c.name as company_name
      FROM investors i
      LEFT JOIN companies c ON i.company_id = c.id
      WHERE i.id = $1`,
      [id]
    );

    if (investorResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Investor not found'
      });
    }

    // Get transactions
    const transactionsResult = await query(
      `SELECT * FROM investor_transactions
       WHERE investor_id = $1
       ORDER BY transaction_date, created_at`,
      [id]
    );

    const investor = {
      ...investorResult.rows[0],
      transactions: transactionsResult.rows
    };

    res.json({
      success: true,
      data: investor
    });
  } catch (error) {
    console.error('Get investor error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching investor'
    });
  }
});

// @route   POST /api/investors
// @desc    Create new investor
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const {
      company_id,
      name,
      address,
      email,
      phone,
      initial_investment,
      interest_rate,
      investment_date,
      notes
    } = req.body;

    if (!company_id || !name || !initial_investment || !interest_rate || !investment_date) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: company_id, name, initial_investment, interest_rate, investment_date'
      });
    }

    const result = await transaction(async (client) => {
      // Create investor
      const investorResult = await client.query(
        `INSERT INTO investors 
         (company_id, name, address, email, phone, initial_investment, current_balance, interest_rate, investment_date, status, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $6, $7, $8, 'active', $9)
         RETURNING *`,
        [company_id, name, address || '', email || '', phone || '', initial_investment, interest_rate, investment_date, notes || '']
      );

      const investor = investorResult.rows[0];

      // Create initial investment transaction
      await client.query(
        `INSERT INTO investor_transactions 
         (investor_id, transaction_date, transaction_type, amount, description, balance_after)
         VALUES ($1, $2, 'initial', $3, $4, $3)`,
        [investor.id, investment_date, initial_investment, 'Initial Investment']
      );

      return investor;
    });

    res.status(201).json({
      success: true,
      message: 'Investor created successfully',
      data: result
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({
        success: false,
        message: 'Investor with this name already exists in this company'
      });
    }
    console.error('Create investor error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating investor'
    });
  }
});

// @route   PUT /api/investors/:id
// @desc    Update investor
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const fields = ['name', 'address', 'email', 'phone', 'interest_rate', 'current_balance', 'status', 'notes', 'investment_date'];
    
    const updates = [];
    const values = [];
    let paramCount = 1;

    fields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = $${paramCount++}`);
        values.push(req.body[field]);
      }
    });

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    values.push(id);

    const result = await query(
      `UPDATE investors
       SET ${updates.join(', ')}
       WHERE id = $${paramCount}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Investor not found'
      });
    }

    res.json({
      success: true,
      message: 'Investor updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Update investor error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating investor'
    });
  }
});

// @route   DELETE /api/investors/:id
// @desc    Delete investor (soft delete)
// @access  Private (Admin)
router.delete('/:id', auth, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `UPDATE investors
       SET status = 'inactive', archived_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Investor not found'
      });
    }

    res.json({
      success: true,
      message: 'Investor deactivated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Delete investor error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting investor'
    });
  }
});

module.exports = router;

