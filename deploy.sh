#!/bin/bash

# Bewertigo Deployment Script
# Ez a script frissíti az alkalmazást a GitHub-ról

echo "🚀 Bewertigo deployment indítása..."

# Projekt könyvtár
cd ~/public_html/bewertigo

# Git pull
echo "📥 Legújabb változások letöltése GitHub-ról..."
git pull origin main

if [ $? -ne 0 ]; then
    echo "❌ Hiba a git pull során!"
    exit 1
fi

# Függőségek telepítése/frissítése
echo "📦 Függőségek telepítése..."
npm install --production

if [ $? -ne 0 ]; then
    echo "❌ Hiba a npm install során!"
    exit 1
fi

# PM2 restart
echo "♻️  Alkalmazás újraindítása..."
pm2 restart bewertigo

if [ $? -ne 0 ]; then
    echo "⚠️  PM2 restart sikertelen, próbálkozás újraindítással..."
    pm2 stop bewertigo
    pm2 start server.js --name bewertigo
fi

# Státusz ellenőrzése
echo "✅ Deployment befejezve! Alkalmazás státusz:"
pm2 status bewertigo

echo ""
echo "✨ Bewertigo sikeresen frissítve!"
echo "🌐 URL: https://bewertigo.dmf.n4.ininet.hu"
