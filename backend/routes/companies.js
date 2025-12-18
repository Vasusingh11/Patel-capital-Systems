const express = require('express');
const router = express.Router();
const { query } = require('../database/db');
const { auth, isAdmin } = require('../middleware/auth');

// @route   GET /api/companies
// @desc    Get all companies
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        c.*,
        cs.investor_count,
        cs.total_balance,
        cs.total_interest_paid
      FROM companies c
      LEFT JOIN company_summaries cs ON c.id = cs.company_id
      WHERE c.is_active = true
      ORDER BY c.name
    `);

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    console.error('Get companies error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching companies'
    });
  }
});

// @route   GET /api/companies/:id
// @desc    Get single company with investors
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    // Get company
    const companyResult = await query(
      'SELECT * FROM companies WHERE id = $1',
      [id]
    );

    if (companyResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    // Get investors for this company
    const investorsResult = await query(`
      SELECT 
        i.*,
        ib.current_balance,
        ib.total_interest_earned,
        ib.last_transaction_date,
        ib.transaction_count
      FROM investors i
      LEFT JOIN investor_balances ib ON i.id = ib.investor_id
      WHERE i.company_id = $1 AND i.is_active = true
      ORDER BY i.name
    `, [id]);

    const company = {
      ...companyResult.rows[0],
      investors: investorsResult.rows
    };

    res.json({
      success: true,
      data: company
    });
  } catch (error) {
    console.error('Get company error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching company'
    });
  }
});

// @route   POST /api/companies
// @desc    Create new company
// @access  Private (Admin)
router.post('/', auth, isAdmin, async (req, res) => {
  try {
    const { name, default_rate = 10.00 } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Company name is required'
      });
    }

    const result = await query(
      `INSERT INTO companies (name, default_rate, created_by)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [name, default_rate, req.user.id]
    );

    res.status(201).json({
      success: true,
      message: 'Company created successfully',
      data: result.rows[0]
    });
  } catch (error) {
    if (error.code === '23505') { // Unique violation
      return res.status(400).json({
        success: false,
        message: 'Company with this name already exists'
      });
    }
    console.error('Create company error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating company'
    });
  }
});

// @route   PUT /api/companies/:id
// @desc    Update company
// @access  Private (Admin)
router.put('/:id', auth, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, default_rate, is_active } = req.body;

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (default_rate !== undefined) {
      updates.push(`default_rate = $${paramCount++}`);
      values.push(default_rate);
    }
    if (is_active !== undefined) {
      updates.push(`is_active = $${paramCount++}`);
      values.push(is_active);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    values.push(id);

    const result = await query(
      `UPDATE companies
       SET ${updates.join(', ')}
       WHERE id = $${paramCount}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    res.json({
      success: true,
      message: 'Company updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Update company error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating company'
    });
  }
});

// @route   DELETE /api/companies/:id
// @desc    Delete company (soft delete)
// @access  Private (Admin)
router.delete('/:id', auth, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `UPDATE companies
       SET is_active = false
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    res.json({
      success: true,
      message: 'Company deactivated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Delete company error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting company'
    });
  }
});

module.exports = router;

