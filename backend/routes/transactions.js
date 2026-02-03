const express = require('express');
const router = express.Router();
const { query, transaction } = require('../database/db');
const { auth } = require('../middleware/auth');

// @route   GET /api/transactions
// @desc    Get transactions
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { investor_id, start_date, end_date, type } = req.query;
    
    let queryText = `
      SELECT 
        t.*,
        i.name as investor_name,
        c.name as company_name
      FROM investor_transactions t
      LEFT JOIN investors i ON t.investor_id = i.id
      LEFT JOIN companies c ON i.company_id = c.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 1;
    
    if (investor_id) {
      queryText += ` AND t.investor_id = $${paramCount++}`;
      params.push(investor_id);
    }
    
    if (start_date) {
      queryText += ` AND t.transaction_date >= $${paramCount++}`;
      params.push(start_date);
    }
    
    if (end_date) {
      queryText += ` AND t.transaction_date <= $${paramCount++}`;
      params.push(end_date);
    }
    
    if (type) {
      queryText += ` AND t.transaction_type = $${paramCount++}`;
      params.push(type);
    }
    
    queryText += ` ORDER BY t.transaction_date DESC, t.created_at DESC`;
    
    const result = await query(queryText, params);

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching transactions'
    });
  }
});

// @route   POST /api/transactions
// @desc    Create new transaction
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const {
      investor_id,
      transaction_date,
      transaction_type,
      amount,
      description,
      balance_after
    } = req.body;

    if (!investor_id || !transaction_date || !transaction_type) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: investor_id, transaction_date, transaction_type'
      });
    }

    // Calculate balance_after if not provided
    let calculatedBalanceAfter = balance_after;
    if (!calculatedBalanceAfter) {
      // Get current balance before this transaction
      const balanceResult = await query(
        `SELECT COALESCE(SUM(
          CASE 
            WHEN transaction_type IN ('initial', 'investment', 'interest-earned', 'adjustment', 'bonus') THEN amount
            WHEN transaction_type IN ('withdrawal', 'interest-paid') THEN -amount
            ELSE 0
          END
        ), 0) as balance
        FROM investor_transactions
        WHERE investor_id = $1 AND transaction_date < $2`,
        [investor_id, transaction_date]
      );
      
      const currentBalance = parseFloat(balanceResult.rows[0].balance || 0);
      
      // Calculate new balance
      if (['initial', 'investment', 'interest-earned', 'adjustment', 'bonus'].includes(transaction_type)) {
        calculatedBalanceAfter = currentBalance + parseFloat(amount || 0);
      } else if (['withdrawal', 'interest-paid'].includes(transaction_type)) {
        calculatedBalanceAfter = currentBalance - parseFloat(amount || 0);
      } else {
        calculatedBalanceAfter = currentBalance;
      }
    }

    const result = await transaction(async (client) => {
      // Create transaction
      const txResult = await client.query(
        `INSERT INTO investor_transactions 
         (investor_id, transaction_date, transaction_type, amount, description, balance_after, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [investor_id, transaction_date, transaction_type, amount || 0, description || '', calculatedBalanceAfter, req.user.id]
      );

      const newTransaction = txResult.rows[0];

      // Update investor's current_balance if this affects it
      if (['initial', 'investment', 'withdrawal', 'interest-earned', 'interest-paid', 'adjustment', 'bonus'].includes(transaction_type)) {
        await client.query(
          'UPDATE investors SET current_balance = $1 WHERE id = $2',
          [calculatedBalanceAfter, investor_id]
        );
      }

      return newTransaction;
    });

    res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      data: result
    });
  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating transaction'
    });
  }
});

// @route   PUT /api/transactions/:id
// @desc    Update transaction
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { transaction_date, transaction_type, amount, description, balance_after } = req.body;
    
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (transaction_date !== undefined) {
      updates.push(`transaction_date = $${paramCount++}`);
      values.push(transaction_date);
    }
    if (transaction_type !== undefined) {
      updates.push(`transaction_type = $${paramCount++}`);
      values.push(transaction_type);
    }
    if (amount !== undefined) {
      updates.push(`amount = $${paramCount++}`);
      values.push(amount);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }
    if (balance_after !== undefined) {
      updates.push(`balance_after = $${paramCount++}`);
      values.push(balance_after);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    values.push(id);

    const result = await query(
      `UPDATE investor_transactions
       SET ${updates.join(', ')}
       WHERE id = $${paramCount}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    res.json({
      success: true,
      message: 'Transaction updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Update transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating transaction'
    });
  }
});

// @route   DELETE /api/transactions/:id
// @desc    Delete transaction
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM investor_transactions WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    res.json({
      success: true,
      message: 'Transaction deleted successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Delete transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting transaction'
    });
  }
});

module.exports = router;

