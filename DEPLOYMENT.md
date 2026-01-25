# Bewertigo - Deployment útmutató GitHub-ról

## 1. GitHub Repository létrehozása

### Első commit
```bash
git add .
git commit -m "Initial commit - Bewertigo alkalmazás"
git branch -M main
```

### GitHub repository beállítása
1. Menj a GitHub-ra: https://github.com/new
2. Repository neve: `bewertigo`
3. Láthatóság: Private (vagy Public, ha szeretnéd)
4. **NE** add hozzá a README-t, .gitignore-t vagy LICENSE-t (már megvannak)
5. Kattints a "Create repository"-ra

### Repository összekötése
```bash
git remote add origin https://github.com/FELHASZNALONEV/bewertigo.git
git push -u origin main
```

## 2. Szerver előkészítése (cPanel/SSH)

### A) cPanel domain létrehozása
- **Domain**: `bewertigo.dmf.n4.ininet.hu` (vagy más aldomain)
- **Document Root**: `/public_html/bewertigo`
- **NE** jelöld be a "Share document root" opciót

### B) SSH csatlakozás és Git telepítés
```bash
# SSH csatlakozás
ssh felhasznalo@dmf.n4.ininet.hu

# Navigálj a document root-ba
cd ~/public_html

# Clone-ozd a repository-t
git clone https://github.com/FELHASZNALONEV/bewertigo.git

cd bewertigo
```

### C) Node.js telepítés (ha nincs)
```bash
# Node.js verzió ellenőrzése
node --version

# Ha nincs Node.js, használd az NVM-et:
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18
```

### D) Függőségek telepítése
```bash
npm install --production
```

### E) Environment változók beállítása
```bash
# Hozz létre egy .env fájlt
nano .env
```

Másold be a következő tartalmat (és töltsd ki a saját értékeiddel):
```env
# Server
PORT=3000
NODE_ENV=production

# MongoDB
MONGODB_URI=mongodb://localhost:27017/bewertigo

# Google APIs
GOOGLE_PLACES_API_KEY=your_google_places_api_key
GOOGLE_PAGESPEED_API_KEY=your_pagespeed_api_key

# Email Configuration
EMAIL_HOST=smtp.your-email-provider.com
EMAIL_PORT=587
EMAIL_USER=your-email@domain.com
EMAIL_PASS=your-email-password
EMAIL_FROM="Bewertigo <noreply@yourdomain.com>"

# Application
BASE_URL=https://bewertigo.dmf.n4.ininet.hu
```

Mentsd el: `Ctrl+X`, majd `Y`, majd `Enter`

## 3. Node.js alkalmazás futtatása

### Opció A: PM2 (ajánlott)
```bash
# PM2 telepítése
npm install -g pm2

# Alkalmazás indítása
pm2 start server.js --name bewertigo

# Auto-restart beállítása szerver újraindításnál
pm2 startup
pm2 save

# Státusz ellenőrzése
pm2 status
pm2 logs bewertigo
```

### Opció B: cPanel Node.js App Manager
Ha a cPanel-ben van "Setup Node.js App" menüpont:
1. Application root: `public_html/bewertigo`
2. Application URL: `bewertigo.dmf.n4.ininet.hu`
3. Application startup file: `server.js`
4. Node.js version: 18.x
5. Environment variables: Add hozzá az összes .env változót

## 4. Reverse Proxy beállítása

### Apache .htaccess fájl (ha Apache-ot használ a szerver)
Hozz létre egy `.htaccess` fájlt a document root-ban:

```bash
nano ~/public_html/bewertigo/.htaccess
```

Tartalom:
```apache
RewriteEngine On
RewriteRule ^$ http://127.0.0.1:3000/ [P,L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ http://127.0.0.1:3000/$1 [P,L]
```

### Nginx konfiguráció (ha Nginx-et használ)
```nginx
location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```

## 5. Frissítések telepítése (amikor változik a kód)

### Deployment script létrehozása
```bash
nano ~/public_html/bewertigo/deploy.sh
```

Tartalom:
```bash
#!/bin/bash
cd ~/public_html/bewertigo

# Git pull
echo "Pulling latest changes from GitHub..."
git pull origin main

# Függőségek frissítése
echo "Installing dependencies..."
npm install --production

# PM2 restart
echo "Restarting application..."
pm2 restart bewertigo

echo "Deployment complete!"
```

Jogosultságok beállítása:
```bash
chmod +x ~/public_html/bewertigo/deploy.sh
```

### Frissítés futtatása
```bash
cd ~/public_html/bewertigo
./deploy.sh
```

## 6. GitHub Webhook (automatikus deployment - opcionális)

### A) Webhook endpoint létrehozása a szervereden
Hozz létre egy `webhook.js` fájlt:

```javascript
const express = require('express');
const { exec } = require('child_process');
const crypto = require('crypto');

const app = express();
app.use(express.json());

const WEBHOOK_SECRET = 'your-secret-key'; // Állítsd be egy erős secretre

app.post('/webhook', (req, res) => {
    const signature = req.headers['x-hub-signature-256'];
    const hash = 'sha256=' + crypto
        .createHmac('sha256', WEBHOOK_SECRET)
        .update(JSON.stringify(req.body))
        .digest('hex');

    if (signature === hash) {
        console.log('Valid webhook received, deploying...');
        exec('cd ~/public_html/bewertigo && ./deploy.sh', (error, stdout, stderr) => {
            if (error) {
                console.error(`Error: ${error}`);
                return res.status(500).send('Deployment failed');
            }
            console.log(stdout);
            res.status(200).send('Deployed successfully');
        });
    } else {
        res.status(401).send('Invalid signature');
    }
});

app.listen(3001, () => {
    console.log('Webhook server running on port 3001');
});
```

Indítsd el PM2-vel:
```bash
pm2 start webhook.js --name bewertigo-webhook
pm2 save
```

### B) GitHub webhook beállítása
1. GitHub repository → Settings → Webhooks → Add webhook
2. Payload URL: `https://bewertigo.dmf.n4.ininet.hu/webhook`
3. Content type: `application/json`
4. Secret: ugyanaz, mint a `WEBHOOK_SECRET`
5. Events: "Just the push event"
6. Active: ✓

## 7. Troubleshooting

### Logok megtekintése
```bash
# PM2 logok
pm2 logs bewertigo

# Szerver logok
tail -f ~/public_html/bewertigo/*.log
```

### Port használat ellenőrzése
```bash
lsof -i :3000
netstat -tuln | grep 3000
```

### Alkalmazás újraindítása
```bash
pm2 restart bewertigo
```

### Node.js verzió váltás
```bash
nvm use 18
pm2 restart bewertigo
```

## 8. Biztonsági ellenőrző lista

- [ ] .env fájl nincs commitolva a GitHub-ra
- [ ] MongoDB hozzáférés védett
- [ ] API kulcsok korlátozva vannak domain-re
- [ ] HTTPS engedélyezve (SSL certificate)
- [ ] Firewall szabályok beállítva
- [ ] PM2 logrotate beállítva
- [ ] Backup stratégia MongoDB-hez

## Gyors Parancsok

```bash
# Státusz
pm2 status

# Újraindítás
pm2 restart bewertigo

# Logok
pm2 logs bewertigo

# Frissítés
cd ~/public_html/bewertigo && ./deploy.sh

# Git pull manuálisan
git pull origin main && npm install && pm2 restart bewertigo
```
