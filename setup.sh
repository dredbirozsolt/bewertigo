#!/bin/bash

# Bewertigo Setup Script
# This script helps you set up the Bewertigo audit tool

echo "🚀 Bewertigo Audit Tool - Setup Script"
echo "========================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v)
echo "✓ Node.js $NODE_VERSION detected"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed"
    exit 1
fi

NPM_VERSION=$(npm -v)
echo "✓ npm $NPM_VERSION detected"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✓ Dependencies installed successfully"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "✓ .env file created"
    echo ""
    echo "⚠️  IMPORTANT: You need to configure the .env file with your API keys!"
    echo ""
    echo "Please edit .env and add:"
    echo "  - GOOGLE_PLACES_API_KEY"
    echo "  - GOOGLE_PAGESPEED_API_KEY"
    echo "  - MONGODB_URI"
    echo "  - MAKE_WEBHOOK_URL"
    echo ""
else
    echo "✓ .env file already exists"
    echo ""
fi

# Check MongoDB connection
echo "🔍 Checking MongoDB connection..."

if command -v mongod &> /dev/null; then
    echo "✓ MongoDB is installed locally"
    
    # Try to start MongoDB
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            brew services start mongodb-community 2>/dev/null
            echo "✓ MongoDB service started (macOS)"
        fi
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        sudo systemctl start mongod 2>/dev/null
        echo "✓ MongoDB service started (Linux)"
    fi
else
    echo "⚠️  MongoDB is not installed locally"
    echo "   You can either:"
    echo "   1. Install MongoDB locally"
    echo "   2. Use MongoDB Atlas (cloud) - https://www.mongodb.com/cloud/atlas"
    echo ""
fi

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p logs
mkdir -p uploads
echo "✓ Directories created"
echo ""

# Test MongoDB connection
echo "🧪 Testing MongoDB connection..."
node -e "
const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bewertigo', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000
}).then(() => {
  console.log('✓ MongoDB connection successful');
  process.exit(0);
}).catch((err) => {
  console.log('❌ MongoDB connection failed:', err.message);
  console.log('   Please check your MONGODB_URI in .env file');
  process.exit(1);
});
" 2>/dev/null

MONGODB_STATUS=$?

echo ""

# Summary
echo "================================================"
echo "📋 Setup Summary"
echo "================================================"
echo ""

if [ $MONGODB_STATUS -eq 0 ]; then
    echo "✓ Node.js: Installed ($NODE_VERSION)"
    echo "✓ npm: Installed ($NPM_VERSION)"
    echo "✓ Dependencies: Installed"
    echo "✓ MongoDB: Connected"
    echo "✓ .env file: Created"
    echo ""
    echo "🎉 Setup completed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Edit .env file and add your API keys"
    echo "2. Run 'npm run dev' to start development server"
    echo "3. Open http://localhost:3000 in your browser"
    echo ""
    echo "For production deployment, see docs/INSTALLATION.md"
else
    echo "✓ Node.js: Installed ($NODE_VERSION)"
    echo "✓ npm: Installed ($NPM_VERSION)"
    echo "✓ Dependencies: Installed"
    echo "❌ MongoDB: Not connected"
    echo "✓ .env file: Created"
    echo ""
    echo "⚠️  Setup completed with warnings"
    echo ""
    echo "Next steps:"
    echo "1. Configure MongoDB (install locally or use MongoDB Atlas)"
    echo "2. Edit .env file and add:"
    echo "   - MONGODB_URI"
    echo "   - GOOGLE_PLACES_API_KEY"
    echo "   - GOOGLE_PAGESPEED_API_KEY"
    echo "   - MAKE_WEBHOOK_URL"
    echo "3. Run 'npm run dev' to start development server"
    echo ""
fi

echo "📖 Full documentation: docs/INSTALLATION.md"
echo "🆘 Need help? Check docs/TROUBLESHOOTING.md"
echo ""
