# 🚀 Complete Backend Setup & Deployment Guide

## Patel Capital Investment Management System - Backend Database

This guide will help you set up the backend API with PostgreSQL database and deploy it online.

---

## 📋 What You're Getting

### ✅ Complete Features

1. **PostgreSQL Database** with professional schema
2. **REST API** with Express.js
3. **JWT Authentication** with role-based access
4. **CRUD Operations** for companies, investors, transactions
5. **Automated Interest Calculations** (prorated from day 1)
6. **Rate Change Tracking** with edit functionality
7. **Withdrawal Support** - partial and full redemptions
8. **Audit Logging** - complete history of all changes
9. **Database Views** - optimized queries for balances
10. **API Documentation** - complete endpoint reference

### 📁 Backend Structure

```
backend/
├── server.js                 # Main server file
├── package.json             # Dependencies
├── env.example              # Environment variables template
├── database/
│   ├── db.js               # Database connection & helpers
│   └── schema.sql          # Complete PostgreSQL schema
├── middleware/
│   └── auth.js             # Authentication middleware
├── routes/
│   ├── auth.js             # User authentication endpoints
│   ├── companies.js        # Company management endpoints
│   ├── investors.js        # Investor management endpoints
│   ├── transactions.js     # Transaction endpoints
│   └── reports.js          # Reporting & statements endpoints
├── seeds/
│   └── seed.js             # Database seeding (creates admin)
└── README.md               # API documentation
```

---

## 🎯 Quick Start (Local Development)

### Step 1: Install PostgreSQL

**macOS:**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Windows:**
Download from: https://www.postgresql.org/download/windows/

**Linux (Ubuntu):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### Step 2: Create Database

```bash
# Access PostgreSQL
psql postgres

# Create database
CREATE DATABASE patel_capital;

# Exit
\q
```

### Step 3: Run Database Schema

```bash
cd backend
psql patel_capital < database/schema.sql
```

### Step 4: Install Dependencies

```bash
npm install
```

### Step 5: Configure Environment

```bash
# Copy env file
cp env.example .env

# Edit .env file
nano .env
```

Update these values:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://your_username:your_password@localhost:5432/patel_capital
JWT_SECRET=change-this-to-a-random-secure-string
CLIENT_URL=http://localhost:3000
```

### Step 6: Seed Database (Create Admin)

```bash
npm run seed
```

**Default Admin Credentials:**
- Email: `admin@patel-capital.net`
- Password: `PatelPassword1234`

⚠️ **Change this password immediately after first login!**

### Step 7: Start Server

```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

Server will be running at: `http://localhost:5000`

Test it: `http://localhost:5000/health`

---

## 🌐 Deploy to Cloud (Online Hosting)

### Option 1: Railway.app (Easiest - Recommended)

**Free tier includes PostgreSQL database!**

1. **Create Account**
   - Go to https://railway.app
   - Sign up with GitHub (free)

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Connect your repository
   - Select `backend` folder as root directory

3. **Add PostgreSQL Database**
   - In your project, click "New"
   - Select "Database" → "Add PostgreSQL"
   - Railway auto-configures `DATABASE_URL` environment variable

4. **Set Environment Variables**
   - Click on your service → "Variables"
   - Add these variables:
     ```
     NODE_ENV=production
     JWT_SECRET=your-super-secret-key-change-this
     JWT_EXPIRE=7d
     CLIENT_URL=https://your-frontend-url.vercel.app
     PORT=5000
     ```

5. **Deploy**
   - Railway auto-deploys on every push to main branch
   - Get your API URL from Railway dashboard

6. **Run Database Setup**
   - Click on your service → "Settings" → "Deploy"
   - Or use Railway CLI:
     ```bash
     npm install -g @railway/cli
     railway login
     railway link
     railway run npm run seed
     ```

7. **Your API is Live!**
   ```
   https://your-project.railway.app/health
   ```

---

### Option 2: Heroku

1. **Install Heroku CLI**
   ```bash
   # macOS
   brew tap heroku/brew && brew install heroku
   
   # Windows
   # Download from: https://devcenter.heroku.com/articles/heroku-cli
   ```

2. **Login and Create App**
   ```bash
   heroku login
   cd backend
   heroku create patel-capital-api
   ```

3. **Add PostgreSQL**
   ```bash
   heroku addons:create heroku-postgresql:essential-0
   ```

4. **Set Environment Variables**
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set JWT_SECRET=your-secret-key
   heroku config:set CLIENT_URL=https://your-frontend.com
   ```

5. **Deploy**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   heroku git:remote -a patel-capital-api
   git push heroku main
   ```

6. **Run Database Setup**
   ```bash
   heroku run bash
   psql $DATABASE_URL < database/schema.sql
   npm run seed
   exit
   ```

---

### Option 3: Render.com

1. **Create Account** at https://render.com

2. **Create PostgreSQL Database**
   - Click "New" → "PostgreSQL"
   - Choose free tier
   - Copy the "Internal Database URL"

3. **Create Web Service**
   - Click "New" → "Web Service"
   - Connect your GitHub repo
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `npm start`

4. **Environment Variables**
   ```
   NODE_ENV=production
   DATABASE_URL=<your-postgres-internal-url>
   JWT_SECRET=your-secret-key
   CLIENT_URL=https://your-frontend.onrender.com
   ```

5. **Deploy & Setup**
   - Render auto-deploys
   - Open Shell and run:
     ```bash
     npm run seed
     ```

---

### Option 4: AWS (Advanced)

See [backend/docs/DEPLOYMENT_AWS.md](backend/docs/DEPLOYMENT_AWS.md) for complete AWS deployment guide with EC2 and RDS.

---

## 🔗 Connect Frontend to Backend

### Update React App

Edit `patel-capital-system/src/utils/storage.js`:

```javascript
// Replace localStorage with API calls
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const loadFromStorage = async () => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/companies`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  const data = await response.json();
  return data.data;
};

export const saveToStorage = async (companies) => {
  const token = localStorage.getItem('token');
  // Implement API calls to update companies
};
```

### Environment Variables for Frontend

Create `patel-capital-system/.env`:
```env
REACT_APP_API_URL=https://your-backend-url.railway.app/api
```

---

## 🧪 Test Your API

### Using curl

```bash
# Health check
curl http://localhost:5000/health

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@patel-capital.net","password":"PatelPassword1234"}'

# Get companies (use token from login response)
curl http://localhost:5000/api/companies \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Using Postman

1. Download Postman: https://www.postman.com/downloads/
2. Import the API collection (see backend/docs/postman_collection.json)
3. Set environment variable: `API_URL` = your backend URL
4. Start testing endpoints!

---

## 📊 Database Backup & Restore

### Backup Database

```bash
# Local
pg_dump patel_capital > backup_$(date +%Y%m%d).sql

# Railway
railway run pg_dump $DATABASE_URL > backup.sql

# Heroku
heroku pg:backups:capture --app patel-capital-api
heroku pg:backups:download --app patel-capital-api
```

### Restore Database

```bash
# Local
psql patel_capital < backup.sql

# Railway
railway run psql $DATABASE_URL < backup.sql

# Heroku
heroku pg:backups:restore <backup-url> DATABASE_URL --app patel-capital-api
```

---

## 🔐 Security Checklist

- [ ] Changed default admin password
- [ ] Using strong JWT_SECRET (at least 32 random characters)
- [ ] HTTPS enabled in production
- [ ] DATABASE_URL kept secret (not in git)
- [ ] CORS configured for your frontend domain only
- [ ] Regular database backups scheduled
- [ ] Rate limiting enabled (default: 100 req/15min)
- [ ] Monitoring and logging set up

---

## 📈 Monitoring & Logs

### Railway
- Dashboard → Your Service → Logs
- Real-time log streaming

### Heroku
```bash
heroku logs --tail --app patel-capital-api
```

### Monitor Database
```bash
# Railway
railway run psql $DATABASE_URL

# Then run:
SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 10;
SELECT * FROM investor_balances;
```

---

## 🐛 Troubleshooting

### Database Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
**Solution:** Ensure PostgreSQL is running:
```bash
# macOS
brew services list
brew services start postgresql@15

# Linux
sudo systemctl status postgresql
sudo systemctl start postgresql
```

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::5000
```
**Solution:** Change PORT in .env or kill process:
```bash
lsof -ti:5000 | xargs kill -9
```

### JWT Token Invalid
```
401: Token is not valid
```
**Solution:** 
1. Check JWT_SECRET is same across restarts
2. Login again to get new token
3. Verify token in Authorization header: `Bearer <token>`

---

## 📞 Support

If you need help:

1. Check logs for error messages
2. Verify environment variables are correct
3. Ensure database is running and accessible
4. Test with Postman/curl first
5. Check API documentation in backend/README.md

---

## 🎉 You're All Set!

Your backend API is now:
- ✅ Running with PostgreSQL database
- ✅ Secured with JWT authentication
- ✅ Deployed online (accessible from anywhere)
- ✅ Ready to connect to your React frontend
- ✅ Tracking all transactions with audit logs
- ✅ Calculating prorated interest correctly
- ✅ Supporting withdrawals and rate changes

**Next Steps:**
1. Test all API endpoints
2. Connect your React frontend
3. Import Trophy Point investor data
4. Set up automated backups
5. Monitor your application

---

**Built with ❤️ for Patel Capital Partners**

