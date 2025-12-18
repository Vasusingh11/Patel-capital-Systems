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
      FROM transactions t
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
      queryText += ` AND t.type = $${paramCount++}`;
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
      type,
      amount,
      description,
      metadata
    } = req.body;

    if (!investor_id || !transaction_date || !type) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    const result = await transaction(async (client) => {
      // Create transaction
      const txResult = await client.query(
        `INSERT INTO transactions 
         (investor_id, transaction_date, type, amount, description, metadata, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [investor_id, transaction_date, type, amount || 0, description, metadata ? JSON.stringify(metadata) : null, req.user.id]
      );

      const newTransaction = txResult.rows[0];

      // If it's a rate change, create rate change record
      if (type === 'rate-change' && metadata) {
        const { old_rate, new_rate, principal_at_change } = metadata;
        
        await client.query(
          `INSERT INTO rate_changes 
           (investor_id, transaction_id, effective_date, old_rate, new_rate, principal_at_change, created_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [investor_id, newTransaction.id, transaction_date, old_rate, new_rate, principal_at_change, req.user.id]
        );

        // Update investor's current rate
        await client.query(
          'UPDATE investors SET current_rate = $1 WHERE id = $2',
          [new_rate, investor_id]
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
    const { transaction_date, type, amount, description, metadata } = req.body;
    
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (transaction_date !== undefined) {
      updates.push(`transaction_date = $${paramCount++}`);
      values.push(transaction_date);
    }
    if (type !== undefined) {
      updates.push(`type = $${paramCount++}`);
      values.push(type);
    }
    if (amount !== undefined) {
      updates.push(`amount = $${paramCount++}`);
      values.push(amount);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }
    if (metadata !== undefined) {
      updates.push(`metadata = $${paramCount++}`);
      values.push(JSON.stringify(metadata));
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    values.push(id);

    const result = await query(
      `UPDATE transactions
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
      'DELETE FROM transactions WHERE id = $1 RETURNING *',
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

