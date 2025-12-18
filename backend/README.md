# Patel Capital Investment Management System - Backend API

Complete REST API backend for managing investment companies, investors, transactions, and generating financial reports.

## 🚀 Features

- **Authentication & Authorization**: JWT-based auth with role-based access control (Admin, User, Viewer)
- **Company Management**: Create and manage multiple investment companies
- **Investor Management**: Track investors with detailed profiles and contact information  
- **Transaction Tracking**: Record all financial transactions with full audit trail
- **Rate Change History**: Track and edit interest rate changes over time
- **Automated Calculations**: Prorated interest calculations from day of investment
- **Statement Generation**: Generate investor statements for any date range
- **Database Views**: Optimized queries for balances and summaries
- **Audit Logging**: Complete history of all system changes
- **Security**: Helmet, CORS, rate limiting, password hashing

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL 13+
- npm or yarn

## 🛠️ Installation

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Setup PostgreSQL Database

```bash
# Create database
createdb patel_capital

# Run schema
psql patel_capital < database/schema.sql
```

### 3. Configure Environment

```bash
# Copy example env file
cp env.example .env

# Edit .env with your settings
nano .env
```

Required environment variables:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://username:password@localhost:5432/patel_capital
JWT_SECRET=your-secret-key-change-this
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:3000
```

### 4. Create Default Admin User

```bash
# Run the seed script (creates admin user)
npm run seed
```

Default admin credentials:
- Email: `admin@patel-capital.net`
- Password: `PatelPassword1234`

**⚠️ IMPORTANT: Change this password immediately after first login!**

### 5. Start Development Server

```bash
npm run dev
```

The API will be available at: `http://localhost:5000`

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication

All protected routes require a JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@patel-capital.net",
  "password": "PatelPassword1234"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGc...",
    "user": {
      "id": "uuid",
      "name": "Admin",
      "email": "admin@patel-capital.net",
      "role": "admin"
    }
  }
}
```

### Companies

#### Get All Companies
```http
GET /api/companies
Authorization: Bearer <token>
```

#### Get Single Company
```http
GET /api/companies/:id
Authorization: Bearer <token>
```

#### Create Company (Admin Only)
```http
POST /api/companies
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Trophy Point",
  "default_rate": 12.00
}
```

#### Update Company (Admin Only)
```http
PUT /api/companies/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Name",
  "default_rate": 11.00
}
```

### Investors

#### Get All Investors
```http
GET /api/investors?company_id=<uuid>
Authorization: Bearer <token>
```

#### Get Single Investor
```http
GET /api/investors/:id
Authorization: Bearer <token>
```

#### Create Investor
```http
POST /api/investors
Authorization: Bearer <token>
Content-Type: application/json

{
  "company_id": "uuid",
  "name": "Patel Capital 1",
  "address": "123 Main St",
  "email": "pc1@example.com",
  "phone": "555-0100",
  "initial_investment": 110405.38,
  "current_rate": 12.00,
  "start_date": "2023-01-01",
  "reinvesting": true
}
```

#### Update Investor
```http
PUT /api/investors/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "current_rate": 12.50,
  "reinvesting": false
}
```

### Transactions

#### Get Transactions
```http
GET /api/transactions?investor_id=<uuid>&start_date=2023-01-01&end_date=2023-12-31
Authorization: Bearer <token>
```

#### Create Transaction
```http
POST /api/transactions
Authorization: Bearer <token>
Content-Type: application/json

{
  "investor_id": "uuid",
  "transaction_date": "2023-01-31",
  "type": "interest-earned",
  "amount": 1125.51,
  "description": "January 2023 Interest (31 days)"
}
```

Transaction Types:
- `initial` - Initial investment
- `investment` - Additional investment
- `withdrawal` - Money withdrawn
- `interest-earned` - Interest accrued/reinvested
- `interest-paid` - Interest paid out to investor
- `rate-change` - Interest rate change
- `bonus` - Bonus payment
- `fee` - Fee charged
- `adjustment` - Balance adjustment

#### Rate Change Transaction
```http
POST /api/transactions
Authorization: Bearer <token>
Content-Type: application/json

{
  "investor_id": "uuid",
  "transaction_date": "2023-10-01",
  "type": "rate-change",
  "amount": 0,
  "description": "Rate changed from 10% to 11%",
  "metadata": {
    "old_rate": 10.00,
    "new_rate": 11.00,
    "principal_at_change": 843113.41
  }
}
```

### Reports

#### Dashboard Summary
```http
GET /api/reports/dashboard
Authorization: Bearer <token>
```

#### Investor Statement
```http
GET /api/reports/investor/:id/statement?start_date=2023-01-01&end_date=2023-12-31
Authorization: Bearer <token>
```

## 🚢 Deployment

### Deploy to Railway.app (Recommended)

1. **Create Railway Account**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub

2. **Create New Project**
   - Click "New Project"
   - Choose "Deploy from GitHub repo"
   - Select your repository

3. **Add PostgreSQL**
   - Click "New" → "Database" → "Add PostgreSQL"
   - Railway will auto-configure DATABASE_URL

4. **Set Environment Variables**
   ```
   NODE_ENV=production
   JWT_SECRET=your-production-secret-key
   JWT_EXPIRE=7d
   CLIENT_URL=https://your-frontend-domain.com
   ```

5. **Deploy**
   - Railway auto-deploys on push to main branch
   - Run migrations: `railway run npm run migrate`
   - Seed database: `railway run npm run seed`

### Deploy to Heroku

1. **Install Heroku CLI**
   ```bash
   brew install heroku/brew/heroku
   ```

2. **Login and Create App**
   ```bash
   heroku login
   heroku create patel-capital-api
   ```

3. **Add PostgreSQL**
   ```bash
   heroku addons:create heroku-postgresql:mini
   ```

4. **Set Environment Variables**
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set JWT_SECRET=your-secret-key
   heroku config:set CLIENT_URL=https://your-frontend.com
   ```

5. **Deploy**
   ```bash
   git push heroku main
   heroku run npm run migrate
   heroku run npm run seed
   ```

### Deploy to AWS (EC2 + RDS)

See [DEPLOYMENT_AWS.md](./docs/DEPLOYMENT_AWS.md) for detailed instructions.

## 📊 Database Schema

The system uses PostgreSQL with the following main tables:

- **users** - System users with authentication
- **companies** - Investment companies
- **investors** - Individual investors
- **transactions** - All financial transactions
- **rate_changes** - Interest rate change history
- **audit_log** - Complete audit trail
- **documents** - File storage references

See [database/schema.sql](./database/schema.sql) for complete schema.

## 🔒 Security Best Practices

1. **Change Default Passwords** - Change admin password immediately
2. **Use Strong JWT Secret** - Generate a secure random string
3. **Enable HTTPS** - Use SSL/TLS in production
4. **Regular Backups** - Backup PostgreSQL database regularly
5. **Update Dependencies** - Keep packages up to date
6. **Monitor Logs** - Check logs for suspicious activity
7. **Rate Limiting** - API has rate limiting enabled
8. **Input Validation** - All inputs are validated

## 🧪 Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage
```

## 📝 API Response Format

Success Response:
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message"
}
```

Error Response:
```json
{
  "success": false,
  "message": "Error description"
}
```

## 🤝 Support

For issues or questions:
- Create an issue on GitHub
- Email: support@patel-capital.net

## 📄 License

MIT License - See LICENSE file for details

---

**Built with ❤️ by Patel Capital Partners**

