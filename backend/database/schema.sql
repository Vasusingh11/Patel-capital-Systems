-- Patel Capital Investment Management System
-- PostgreSQL Database Schema

-- Create database (run separately)
-- CREATE DATABASE patel_capital;
-- \c patel_capital;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (for authentication)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'user', 'viewer')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    last_login TIMESTAMP
);

-- Companies table
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    default_rate DECIMAL(5, 2) NOT NULL DEFAULT 10.00,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id)
);

-- Investors table
CREATE TABLE investors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    email VARCHAR(255),
    phone VARCHAR(50),
    initial_investment DECIMAL(15, 2) NOT NULL,
    current_rate DECIMAL(5, 2) NOT NULL,
    start_date DATE NOT NULL,
    reinvesting BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    UNIQUE(company_id, name)
);

-- Transaction types enum
CREATE TYPE transaction_type AS ENUM (
    'initial',
    'investment',
    'withdrawal',
    'interest-earned',
    'interest-paid',
    'rate-change',
    'bonus',
    'fee',
    'adjustment'
);

-- Transactions table
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    investor_id UUID NOT NULL REFERENCES investors(id) ON DELETE CASCADE,
    transaction_date DATE NOT NULL,
    type transaction_type NOT NULL,
    amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id)
);

-- Rate change history table (for detailed tracking)
CREATE TABLE rate_changes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    investor_id UUID NOT NULL REFERENCES investors(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
    effective_date DATE NOT NULL,
    old_rate DECIMAL(5, 2) NOT NULL,
    new_rate DECIMAL(5, 2) NOT NULL,
    principal_at_change DECIMAL(15, 2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id)
);

-- Audit log table (track all changes)
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(50) NOT NULL,
    table_name VARCHAR(50) NOT NULL,
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Documents table (for storing file references)
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    investor_id UUID REFERENCES investors(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    file_type VARCHAR(100),
    file_size INTEGER,
    file_url TEXT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    uploaded_by UUID REFERENCES users(id)
);

-- Indexes for performance
CREATE INDEX idx_investors_company ON investors(company_id);
CREATE INDEX idx_investors_email ON investors(email);
CREATE INDEX idx_investors_active ON investors(is_active);

CREATE INDEX idx_transactions_investor ON transactions(investor_id);
CREATE INDEX idx_transactions_date ON transactions(transaction_date);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_investor_date ON transactions(investor_id, transaction_date);

CREATE INDEX idx_rate_changes_investor ON rate_changes(investor_id);
CREATE INDEX idx_rate_changes_date ON rate_changes(effective_date);

CREATE INDEX idx_audit_log_user ON audit_log(user_id);
CREATE INDEX idx_audit_log_table ON audit_log(table_name);
CREATE INDEX idx_audit_log_created ON audit_log(created_at);

CREATE INDEX idx_documents_investor ON documents(investor_id);
CREATE INDEX idx_documents_company ON documents(company_id);

-- Views for common queries
CREATE OR REPLACE VIEW investor_balances AS
SELECT 
    i.id AS investor_id,
    i.name AS investor_name,
    c.name AS company_name,
    i.current_rate,
    COALESCE(
        SUM(
            CASE 
                WHEN t.type IN ('initial', 'investment', 'interest-earned', 'bonus') THEN t.amount
                WHEN t.type IN ('withdrawal', 'interest-paid', 'fee') THEN -t.amount
                WHEN t.type = 'adjustment' THEN t.amount
                ELSE 0
            END
        ), 0
    ) AS current_balance,
    COALESCE(
        SUM(
            CASE 
                WHEN t.type IN ('interest-earned', 'bonus') THEN t.amount
                ELSE 0
            END
        ), 0
    ) AS total_interest_earned,
    MAX(t.transaction_date) AS last_transaction_date,
    COUNT(t.id) AS transaction_count
FROM investors i
LEFT JOIN companies c ON i.company_id = c.id
LEFT JOIN transactions t ON i.id = t.investor_id
WHERE i.is_active = true
GROUP BY i.id, i.name, c.name, i.current_rate;

-- View for company summaries
CREATE OR REPLACE VIEW company_summaries AS
SELECT 
    c.id AS company_id,
    c.name AS company_name,
    c.default_rate,
    COUNT(DISTINCT i.id) AS investor_count,
    COALESCE(SUM(
        CASE 
            WHEN t.type IN ('initial', 'investment', 'interest-earned', 'bonus') THEN t.amount
            WHEN t.type IN ('withdrawal', 'interest-paid', 'fee') THEN -t.amount
            WHEN t.type = 'adjustment' THEN t.amount
            ELSE 0
        END
    ), 0) AS total_balance,
    COALESCE(SUM(
        CASE 
            WHEN t.type IN ('interest-earned', 'bonus') THEN t.amount
            ELSE 0
        END
    ), 0) AS total_interest_paid
FROM companies c
LEFT JOIN investors i ON c.id = i.company_id AND i.is_active = true
LEFT JOIN transactions t ON i.id = t.investor_id
WHERE c.is_active = true
GROUP BY c.id, c.name, c.default_rate;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_investors_updated_at BEFORE UPDATE ON investors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create audit log entry
CREATE OR REPLACE FUNCTION create_audit_log()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO audit_log (action, table_name, record_id, old_values)
        VALUES (TG_OP, TG_TABLE_NAME, OLD.id, row_to_json(OLD));
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_log (action, table_name, record_id, old_values, new_values)
        VALUES (TG_OP, TG_TABLE_NAME, NEW.id, row_to_json(OLD), row_to_json(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO audit_log (action, table_name, record_id, new_values)
        VALUES (TG_OP, TG_TABLE_NAME, NEW.id, row_to_json(NEW));
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Audit triggers
CREATE TRIGGER audit_users AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION create_audit_log();

CREATE TRIGGER audit_companies AFTER INSERT OR UPDATE OR DELETE ON companies
    FOR EACH ROW EXECUTE FUNCTION create_audit_log();

CREATE TRIGGER audit_investors AFTER INSERT OR UPDATE OR DELETE ON investors
    FOR EACH ROW EXECUTE FUNCTION create_audit_log();

CREATE TRIGGER audit_transactions AFTER INSERT OR UPDATE OR DELETE ON transactions
    FOR EACH ROW EXECUTE FUNCTION create_audit_log();

-- Grant permissions (adjust as needed)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_user;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO your_user;

COMMENT ON TABLE users IS 'System users with authentication';
COMMENT ON TABLE companies IS 'Investment companies';
COMMENT ON TABLE investors IS 'Individual investors within companies';
COMMENT ON TABLE transactions IS 'All financial transactions';
COMMENT ON TABLE rate_changes IS 'History of interest rate changes';
COMMENT ON TABLE audit_log IS 'Audit trail of all system changes';
COMMENT ON TABLE documents IS 'Uploaded documents and files';

