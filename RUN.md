# 🚀 How to Run Patel Capital System

## Quick Commands (Copy & Paste)

### Step 1: Install Node.js
1. Go to: https://nodejs.org/
2. Download the **LTS version** (green button)
3. Install the .pkg file
4. **Restart your terminal**

### Step 2: Verify and Setup
```bash
cd "/Users/vasusingh/Patel-Capital/Investor_Statement/patel-capital-system"
./verify-and-setup.sh
```

### Step 3: Start the App
```bash
npm start
```

---

## Manual Commands (if scripts don't work)

### Check if Node.js is installed:
```bash
node --version
npm --version
```

### Install dependencies:
```bash
npm install
```

### Start development server:
```bash
npm start
```

### Build for production:
```bash
npm run build
```

---

## 🎯 What Should Happen

1. **After `npm start`**: Your browser should automatically open to `http://localhost:3000`
2. **You should see**: The Patel Capital dashboard with companies
3. **Features available**:
   - Double-click companies to view investors
   - Add/edit investors
   - Change interest rates (📈 button)
   - Add additional investments (💰 button)
   - Add manual transactions (➕ button)
   - Generate statements (📄 button)

---

## 🆘 If Something Goes Wrong

### Node.js not found after installation:
```bash
# Restart terminal completely, then try:
which node
```

### Permission errors:
```bash
sudo chown -R $(whoami) ~/.npm
```

### Port 3000 already in use:
```bash
npm start -- --port 3001
```

### Clear everything and start fresh:
```bash
rm -rf node_modules package-lock.json
npm install
npm start
```

---

## 📱 Quick Test Checklist

Once the app is running:
- [ ] Can you see companies on the main page?
- [ ] Can you double-click a company to view investors?
- [ ] Can you click the 📈 button to change an interest rate?
- [ ] Can you click the 💰 button to add an investment?
- [ ] Can you click the 📄 button to generate a statement?

**If all checkboxes work, you're all set! 🎉**
