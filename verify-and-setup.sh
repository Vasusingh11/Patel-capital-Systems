#!/bin/bash

echo "🔍 Checking Node.js installation..."
echo "=================================="

if command -v node &> /dev/null; then
    echo "✅ Node.js version: $(node --version)"
    echo "✅ npm version: $(npm --version)"
    echo ""
    echo "🎉 Node.js is properly installed!"
    echo ""
    echo "📦 Now installing project dependencies..."
    npm install
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✨ Setup complete! You can now start the app:"
        echo ""
        echo "🚀 Run this command to start:"
        echo "   npm start"
        echo ""
        echo "🌐 Your app will open at: http://localhost:3000"
    else
        echo "❌ Error installing dependencies. Please check the error messages above."
    fi
else
    echo "❌ Node.js is still not found."
    echo ""
    echo "Please make sure you:"
    echo "1. Downloaded Node.js from https://nodejs.org/"
    echo "2. Installed the .pkg file"
    echo "3. Restarted your terminal"
    echo ""
    echo "Then run this script again: ./verify-and-setup.sh"
fi
