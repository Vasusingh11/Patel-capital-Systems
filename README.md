# Patel Capital - Investment Management System

A modern, React-based investment management system for tracking investor accounts, calculating interest, and generating professional statements.

## 🚀 Features

### Core Functionality
- ✅ **Company Management** - Manage multiple investment companies
- ✅ **Investor CRUD Operations** - Add, edit, and manage investor accounts
- ✅ **Transaction History** - Complete transaction tracking with multiple types
- ✅ **Interest Rate Management** - Track rate changes with effective dates
- ✅ **Prorated Interest Calculation** - Accurate calculations for additional investments
- ✅ **Manual Transaction Entry** - Add custom transactions with various categories
- ✅ **Professional Statement Generation** - PDF and CSV export capabilities
- ✅ **Data Import/Export** - Backup and restore functionality
- ✅ **Search & Filter** - Find investors quickly
- ✅ **Mobile Responsive Design** - Works on all devices

### Enhanced Features
- 🔄 **Double-click Navigation** - Double-click companies to view investors
- 📈 **Interest Rate Change Tracking** - Log rate changes with reasons and dates
- 💰 **Additional Investment Support** - Add investments with prorated interest
- ✏️ **Manual Transaction Categories** - Investment, withdrawal, bonus, fee, adjustment
- 📊 **Advanced Calculations** - Quarterly prorated interest calculations
- 🎯 **Visual Indicators** - Icons and badges for different transaction types

## 📋 Installation

### Prerequisites
- Node.js (version 14 or higher)
- npm or yarn package manager

### Option 1: Create React App (Recommended)
```bash
# Create new React app
npx create-react-app patel-capital-system
cd patel-capital-system

# Install Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Install Lucide icons and PDF libraries
npm install lucide-react jspdf jspdf-autotable

# Replace src files with the provided code
# Copy all files from the project structure

# Start development server
npm start
```

### Option 2: Vite (Faster Alternative)
```bash
# Create new Vite + React app
npm create vite@latest patel-capital-system -- --template react
cd patel-capital-system

# Install dependencies
npm install
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
npm install lucide-react jspdf jspdf-autotable

# Replace src files with the provided code
# Start development server
npm run dev
```

## 🛠️ Configuration

### Tailwind CSS Setup
Update your `tailwind.config.js`:
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'patel-blue': {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        }
      }
    },
  },
  plugins: [],
}
```

## 🚀 Deployment Options

### Option 1: Netlify (Recommended - Free)
```bash
# Build the project
npm run build

# Deploy to Netlify
# 1. Go to netlify.com
# 2. Drag and drop the 'build' folder
# 3. Done! Your site is live
```

### Option 2: Vercel (Free)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow the prompts
```

### Option 3: GitHub Pages
```bash
# Install gh-pages
npm install --save-dev gh-pages

# Add to package.json:
# "homepage": "https://yourusername.github.io/patel-capital-system",
# "predeploy": "npm run build",
# "deploy": "gh-pages -d build"

# Deploy
npm run deploy
```

### Option 4: Traditional Web Hosting
```bash
# Build the project
npm run build

# Upload the entire 'build' folder to your web host via:
# - FTP
# - cPanel File Manager
# - SSH
```

## 💾 Data Management

### Current Setup (localStorage)
- ✅ Works immediately after deployment
- ✅ No backend required
- ✅ Free
- ⚠️ Data stored in browser only
- ⚠️ Not shared across devices
- ⚠️ Cleared if browser cache is cleared

### Backup Strategy
1. **Manual**: Use the Export button regularly
2. **Scheduled**: Set calendar reminders to export weekly
3. **Cloud**: Consider upgrading to Firebase/Supabase for automatic backups

## 🔧 Usage

### Getting Started
1. **Select a Company**: Click on a company card to select it
2. **Double-click Navigation**: Double-click a company to go directly to investors
3. **Add Investors**: Use the "Add Investor" button in the investors section
4. **Manage Rates**: Use the rate change button (📈) to modify interest rates
5. **Add Investments**: Use the investment button (💰) for additional investments
6. **Manual Transactions**: Use the transaction button (➕) for custom entries
7. **Generate Statements**: Click the statement button (📄) to create PDFs

### Key Features
- **Interest Rate Changes**: Automatically logged with effective dates
- **Prorated Calculations**: Additional investments earn interest from their date
- **Manual Transactions**: Support for withdrawals, bonuses, fees, adjustments
- **Professional Statements**: Print-ready PDFs with company branding
- **CSV Export**: Excel-compatible format for external analysis

## 🔒 Security & Compliance

### Current Security
- localStorage is suitable for single-user admin access
- HTTPS automatic with Netlify/Vercel
- No sensitive data transmission

### Recommendations
- Add authentication for multiple users
- Consider cloud database for shared access
- Regular data backups essential

## 📱 Browser Compatibility
- ✅ Chrome (recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Edge
- ✅ Mobile browsers
- ⚠️ Requires JavaScript enabled

## 🆘 Troubleshooting

### Common Issues
1. **Data Not Saving**: Check if localStorage is enabled
2. **PDF Not Generating**: Ensure popup blockers are disabled
3. **Import Fails**: Verify JSON file format
4. **Mobile Issues**: Try landscape orientation for tables

### Support
- Check browser console for error messages
- Ensure all dependencies are installed correctly
- Verify Node.js version compatibility

## 📈 Future Enhancements

### Planned Features
- Cloud database integration (Firebase/Supabase)
- Multi-user authentication
- Advanced reporting and analytics
- Email statement delivery
- Automated interest calculations
- API integrations

### Database Upgrade Options
```bash
# Firebase
npm install firebase

# Supabase
npm install @supabase/supabase-js
```

## 📞 Support & Maintenance

### Regular Maintenance
- Export data weekly as backup
- Update dependencies monthly
- Monitor for security updates
- Test functionality after updates

### Performance Tips
- Clear browser cache if experiencing issues
- Use latest browser versions
- Ensure stable internet connection for cloud features

---

**Built with React, Tailwind CSS, and modern web technologies for optimal performance and user experience.**
