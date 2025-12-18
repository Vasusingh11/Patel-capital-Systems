#!/bin/bash

echo "🚀 Patel Capital System - Setup Script"
echo "======================================"

# Check if Node.js is installed
if command -v node &> /dev/null; then
    echo "✅ Node.js is installed: $(node --version)"
    echo "✅ npm is available: $(npm --version)"
    
    echo ""
    echo "📦 Installing project dependencies..."
    npm install
    
    echo ""
    echo "🎨 Setting up Tailwind CSS..."
    npx tailwindcss init -p --force
    
    echo ""
    echo "✨ Setup complete! You can now run:"
    echo "   npm start    - Start development server"
    echo "   npm run build - Build for production"
    echo ""
    echo "🌐 Your app will be available at: http://localhost:3000"
    
else
    echo "❌ Node.js is not installed."
    echo ""
    echo "📋 Please install Node.js first:"
    echo "   1. Go to https://nodejs.org/"
    echo "   2. Download the LTS version"
    echo "   3. Run the installer"
    echo "   4. Restart your terminal"
    echo "   5. Run this script again: ./setup.sh"
    echo ""
    echo "🔧 Alternative installation methods:"
    echo "   • Using Homebrew: brew install node"
    echo "   • Using nvm: curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash"
fi
