# 🚀 Quick Start Guide - Patel Capital System

## 📋 Prerequisites
You need Node.js installed on your system to run this React application.

### Install Node.js (Choose one method):

#### Method 1: Official Installer (Recommended)
1. Go to [https://nodejs.org/](https://nodejs.org/)
2. Download the **LTS version** (Long Term Support)
3. Run the installer
4. Restart your terminal

#### Method 2: Using Homebrew (if you have it)
```bash
brew install node
```

#### Method 3: Using Node Version Manager (nvm)
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.nvm/nvm.sh
nvm install --lts
```

## 🏃‍♂️ Quick Setup

### Step 1: Verify Node.js Installation
```bash
node --version
npm --version
```

### Step 2: Run the Setup Script
```bash
./setup.sh
```

### Step 3: Start the Development Server
```bash
npm start
```

Your app will open at: **http://localhost:3000**

## 🛠️ Manual Setup (if setup script fails)

```bash
# Install dependencies
npm install

# Start development server
npm start
```

## 🚀 Build for Production

```bash
# Create production build
npm run build

# The build folder will contain your production-ready files
```

## 📱 Features Available

- ✅ **Company Management** - Select and manage investment companies
- ✅ **Investor Management** - Add, edit, and track investors
- ✅ **Interest Rate Changes** - Track rate changes with effective dates
- ✅ **Additional Investments** - Add investments with prorated interest
- ✅ **Manual Transactions** - Add custom transactions (withdrawals, bonuses, etc.)
- ✅ **Professional Statements** - Generate PDF and CSV statements
- ✅ **Data Import/Export** - Backup and restore your data

## 🎯 Quick Usage

1. **Double-click** a company card to view its investors
2. Use the **📈 button** to change interest rates
3. Use the **💰 button** to add additional investments
4. Use the **➕ button** to add manual transactions
5. Use the **📄 button** to generate statements

## 🆘 Troubleshooting

### Common Issues:
- **"node: command not found"** → Install Node.js first
- **"npm install fails"** → Try deleting `node_modules` and running `npm install` again
- **"Port 3000 already in use"** → Kill other processes or use `npm start -- --port 3001`

### Need Help?
- Check the browser console for error messages
- Ensure you're using Node.js version 14 or higher
- Try clearing your browser cache

---

**🎉 You're all set! Enjoy using the Patel Capital Investment Management System!**
