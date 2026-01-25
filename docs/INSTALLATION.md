# Bewertigo Audit Tool - Telepítési Útmutató

## 📋 Előfeltételek

1. **Node.js** (v18 vagy újabb): [Letöltés](https://nodejs.org/)
2. **MongoDB** (v5.0 vagy újabb):
   - Helyi telepítés: [MongoDB Community](https://www.mongodb.com/try/download/community)
   - Vagy cloud: [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (ingyenes tier)
3. **Google Cloud Account** az API kulcsokhoz
4. **SMTP Email Account** a PDF küldéshez (Gmail, SendGrid, AWS SES stb.)
5. **Instagram API** (Opcionális, fallback scraping van)
6. **TikTok API** (Opcionális, fallback scraping van)

## 🔑 API Kulcsok Beszerzése

### 1. Google Places API

1. Menj a [Google Cloud Console](https://console.cloud.google.com/)
2. Hozz létre új projektet vagy válassz egy létezőt
3. Engedélyezd a következő API-kat:
   - Places API
   - Places API (New)
   - PageSpeed Insights API
4. Credentials → Create Credentials → API Key
5. Korlátozd az API kulcsot:
   - API restrictions: Places API, PageSpeed Insights API
   - Application restrictions: HTTP referrers (add your domain)

**Havi költség becslés**:
- Places Autocomplete: $2.83 per 1000 requests
- Place Details: $17 per 1000 requests
- PageSpeed Insights: Ingyenes (25,000 / nap)

**Költség optimalizálás**:
- A 48 órás cache jelentősen csökkenti a lekéréseket
- Autocomplete csak 3+ karakter után indul
- Csak a szükséges mezők lekérése

### 2. Instagram Graph API (Opcionális)

Az Instagram adatok hivatalos API-n keresztüli lekéréséhez szükséges. Ha nincs beállítva, a rendszer automatikusan web scraping-et használ.

**Részletes setup**: Lásd [docs/SOCIAL_MEDIA_API.md](./SOCIAL_MEDIA_API.md)

**Gyors setup**:
1. Facebook Developer Account létrehozása
2. Facebook App létrehozása
3. Instagram Business Account összekapcsolása
4. Access Token generálása

```env
INSTAGRAM_ACCESS_TOKEN=your_instagram_access_token
INSTAGRAM_BUSINESS_ACCOUNT_ID=your_instagram_business_id
```

**Költség**: Teljesen ingyenes (Meta szolgáltatás)

### 3. TikTok Business API (Opcionális)

A TikTok adatok hivatalos API-n keresztüli lekéréséhez szükséges. Ha nincs beállítva, a rendszer automatikusan web scraping-et használ (korlátozott adatokkal).

**Részletes setup**: Lásd [docs/SOCIAL_MEDIA_API.md](./SOCIAL_MEDIA_API.md)

**Gyors setup**:
1. TikTok for Business Account regisztráció
2. Developer App létrehozása
3. OAuth 2.0 Access Token generálása

```env
TIKTOK_ACCESS_TOKEN=your_tiktok_access_token
TIKTOK_APP_ID=your_tiktok_app_id
```

**Költség**: Ingyenes tier (1,000 requests/nap)

### 4. Email SMTP Konfiguráció

A PDF reportok küldéséhez SMTP email szolgáltatást kell beállítanod. Három népszerű opció:

#### Opció A: Gmail (Ingyenes, egyszerű)

1. Menj a [Google Account](https://myaccount.google.com/) → Security
2. Engedélyezd a 2-Step Verification-t
3. Hozz létre App Password-öt:
   - Select app: Mail
   - Select device: Other (Custom name) → "Bewertigo"
4. Másold ki a 16 karakteres jelszót

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-char-app-password
EMAIL_FROM="Bewertigo <your-email@gmail.com>"
```

**Limit**: 500 email/nap ingyenesen

#### Opció B: SendGrid (Ingyenes tier: 100 email/nap)

1. Regisztrálj a [SendGrid](https://sendgrid.com/)-en
2. Create API Key → Full Access
3. Verify sender email address

```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=apikey
EMAIL_PASSWORD=your-sendgrid-api-key
EMAIL_FROM="Bewertigo <noreply@yourdomain.com>"
```

#### Opció C: AWS SES (Legolcsóbb nagyszámú emailhez)

1. AWS Console → Simple Email Service
2. Verify domain vagy email address
3. Create SMTP credentials

```env
EMAIL_HOST=email-smtp.eu-west-1.amazonaws.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-aws-smtp-username
EMAIL_PASSWORD=your-aws-smtp-password
EMAIL_FROM="Bewertigo <noreply@yourdomain.com>"
```

**Ár**: $0.10 per 1000 email

## 🚀 Telepítés Lépésről Lépésre

### 1. Projekt Klónozása / Letöltése

```bash
cd /Users/birozsolt/Downloads/bewertigo
```

### 2. Függőségek Telepítése

```bash
npm install
```

### 3. Környezeti Változók Beállítása

```bash
# Másold az example fájlt
cp .env.example .env

# Szerkeszd a .env fájlt
nano .env
```

Töltsd ki a következő értékeket:

```env
# Server Configuration
PORT=3000
NODE_ENV=production

# Google APIs
GOOGLE_PLACES_API_KEY=AIzaSy...  # A Google Cloud Console-ból
GOOGLE_PAGESPEED_API_KEY=AIzaSy... # Lehet ugyanaz, mint a Places API kulcs

# MongoDB
MONGODB_URI=mongodb://localhost:27017/bewertigo
# Ha MongoDB Atlas-t használsz:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/bewertigo

# Email SMTP Configuration (Choose one: Gmail, SendGrid, or AWS SES)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM="Bewertigo <your-email@gmail.com>"

# Social Media APIs (Optional - fallback scraping available)
# Instagram Graph API
INSTAGRAM_ACCESS_TOKEN=your_instagram_access_token
INSTAGRAM_BUSINESS_ACCOUNT_ID=your_instagram_business_id

# TikTok Business API
TIKTOK_ACCESS_TOKEN=your_tiktok_access_token
TIKTOK_APP_ID=your_tiktok_app_id

# PDF Storage
PDF_STORAGE_PATH=./pdfs

# API Configuration
API_RATE_LIMIT=100
CACHE_TTL_HOURS=48

# Frontend URL (for CORS)
FRONTEND_URL=https://yourdomain.com
# Fejlesztési módban:
# FRONTEND_URL=http://localhost:3000
```

### 4. MongoDB Indítása

**Helyi telepítés esetén:**

```bash
# macOS (Homebrew)
brew services start mongodb-community

# Linux (systemd)
sudo systemctl start mongod

# Ellenőrzés
mongo --eval "db.version()"
```

**MongoDB Atlas esetén:**
- Nincs szükség helyi indításra
- Győződj meg róla, hogy a MONGODB_URI helyesen van beállítva
- Engedélyezd a hozzáférést a jelenlegi IP címedről (Network Access)

### 5. Alkalmazás Indítása

**Fejlesztési mód** (auto-restart változtatáskor):

```bash
npm run dev
```

**Produkciós mód**:

```bash
npm start
```

**PM2-vel (ajánlott production-höz)**:

```bash
# PM2 telepítése globálisan
npm install -g pm2

# Alkalmazás indítása
pm2 start server.js --name bewertigo

# Auto-restart bootkor
pm2 startup
pm2 save

# Logok megtekintése
pm2 logs bewertigo

# Újraindítás
pm2 restart bewertigo
```

### 6. Ellenőrzés

Nyisd meg a böngészőt és menj a címre:

```
http://localhost:3000
```

Ellenőrizd a health endpointot:

```bash
curl http://localhost:3000/api/health
```

Válasz:

```json
{
  "status": "OK",
  "timestamp": "2026-01-04T10:30:00.000Z",
  "environment": "production"
}
```

## 🌐 Production Deployment

### Opció 1: VPS (pl. DigitalOcean, Hetzner)

1. **Szerver előkészítése**:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install MongoDB (ha nem Atlas-t használsz)
wget -qO - https://www.mongodb.org/static/pgp/server-5.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/5.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-5.0.list
sudo apt update
sudo apt install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod

# Install PM2
sudo npm install -g pm2
```

2. **Projekt feltöltése**:

```bash
# SSH-val
scp -r bewertigo/ user@your-server-ip:/var/www/

# Vagy Git-tel
cd /var/www
git clone https://github.com/your-repo/bewertigo.git
cd bewertigo
npm install --production
```

3. **Nginx reverse proxy** (opcionális, de ajánlott):

```bash
sudo apt install -y nginx

# Nginx config
sudo nano /etc/nginx/sites-available/bewertigo
```

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

```bash
# Engedélyezés
sudo ln -s /etc/nginx/sites-available/bewertigo /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

4. **SSL Certificate (Let's Encrypt)**:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### Opció 2: Heroku

```bash
# Heroku CLI telepítése
# https://devcenter.heroku.com/articles/heroku-cli

# Login
heroku login

# App létrehozása
heroku create bewertigo-audit

# MongoDB Atlas addon vagy saját
heroku addons:create mongolab:sandbox

# Környezeti változók
heroku config:set GOOGLE_PLACES_API_KEY=your_key
heroku config:set GOOGLE_PAGESPEED_API_KEY=your_key
heroku config:set MAKE_WEBHOOK_URL=your_webhook_url
heroku config:set NODE_ENV=production

# Deploy
git push heroku main
```

### Opció 3: Vercel (csak static/serverless)

A teljes alkalmazás nem kompatibilis Vercel-lel a long-running processes miatt.
De a frontend-et ott hosztolhatod, és a backend-et máshol.

## 🔍 Tesztelés

### 1. Manuális Tesztek

1. **Autocomplete tesztelése**:
   - Írj be egy létező vállalkozás nevet (pl. "Café Central Wien")
   - Ellenőrizd, hogy megjelennek-e javaslatok

2. **Audit futtatása**:
   - Válassz ki egy vállalkozást
   - Várd meg, hogy végigfusson (kb. 90 másodperc)
   - Ellenőrizd, hogy minden checklist pont kipipálódik-e
   - Ellenőrizd az összpontszámot

3. **Lead capture**:
   - Add meg az email címed
   - Fogadd el a GDPR checkbox-ot
   - Ellenőrizd, hogy eltűnik-e a blur
   - Ellenőrizd, hogy megkaptad-e az emailt
   - Nézd meg a `pdfs/` mappát, hogy a PDF létrejött-e

### 2. Cache Tesztelése

```bash
# Ugyanarra a vállalkozásra futtass újra audit-ot 5 percen belül
# Azonnal kapnod kell az eredményt (cached)
```

### 3. API Rate Limit Tesztelése

```bash
# Több mint 100 kérés 15 percen belül
# Válasz: 429 Too Many Requests
```

## 📊 Monitoring & Logolás

### PM2 Monitoring

```bash
# Real-time monitoring
pm2 monit

# CPU & Memory usage
pm2 list

# Logs
pm2 logs bewertigo --lines 100
```

### Database Monitoring

```bash
# MongoDB stats
mongo bewertigo --eval "db.stats()"

# Audits count
mongo bewertigo --eval "db.audits.count()"

# Leads count
mongo bewertigo --eval "db.leads.count()"
```

## 🐛 Troubleshooting

### MongoDB kapcsolódási hiba

```
Error: connect ECONNREFUSED 127.0.0.1:27017
```

**Megoldás**:
- Ellenőrizd, hogy fut-e a MongoDB: `sudo systemctl status mongod`
- Indítsd el: `sudo systemctl start mongod`
- Ellenőrizd a MONGODB_URI-t a .env-ben

### Google API hiba: "API key not valid"

**Megoldás**:
- Ellenőrizd, hogy az API kulcs helyes-e
- Ellenőrizd, hogy engedélyezted-e a Places API-t
- Ellenőrizd az API restrictions-öket

### PageSpeed timeout

**Megoldás**:
- Ez normális, a retry logika automatikusan újrapróbálja
- Ha 3x is timeout, 0 pontot ad, de nem fagy le

### PDF nem generálódik

**Megoldás**:
- Ellenőrizd a PDFKit dependency-t: `npm list pdfkit`
- Ellenőrizd a `pdfs/` mappa létezését és jogosultságát
- Nézd meg a server logokat: `pm2 logs bewertigo`

### Social Media adatok nem jelennek meg

**Megoldás**:
- Ellenőrizd az Instagram/TikTok API token-okat (ha be vannak állítva)
- Ha nincs API token, a scraping fallback automatikus
- Ellenőrizd, hogy a vállalkozás weboldalján van-e social media link
- Részletek: [docs/SOCIAL_MEDIA_API.md](./SOCIAL_MEDIA_API.md)

## 🔐 Biztonsági Javaslatok

1. **API kulcsok védése**:
   - Soha ne commitolj API kulcsokat Git-be
   - Használj IP restriction-öket a Google API-nál

2. **Rate limiting**:
   - Már implementálva (100 req / 15 perc)
   - Növelheted a .env-ben

3. **CORS beállítása**:
   - Production-ben állítsd be a pontos domain-t
   - Ne hagyd '*'-on

4. **MongoDB security**:
   - Használj erős jelszót
   - Engedélyezz auth-ot
   - Korlátozd a network access-t

5. **SSL/HTTPS**:
   - Mindig használj HTTPS-t production-ben
   - Let's Encrypt ingyenes

## 📈 Skálázás

### Horizontális skálázás

1. **Load balancer** (Nginx):
   - Több Node.js instance PM2 cluster mode-dal
   ```bash
   pm2 start server.js -i max --name bewertigo
   ```

2. **MongoDB replica set**:
   - High availability
   - MongoDB Atlas automatikusan kezeli

3. **Redis caching** (opcionális):
   - Gyorsabb cache node-cache helyett
   - Több szerver között megosztható

## 🆘 Support

Ha problémád van:
1. Ellenőrizd a logokat: `pm2 logs`
2. Ellenőrizd a MongoDB kapcsolatot
3. Teszteld az API kulcsokat
4. Nézd meg a [docs/](./docs/) mappát

## 📝 Következő Lépések

1. ✅ Teszteld az első audit-ot
2. ✅ Ellenőrizd a PDF generálást és email érkezést
3. ✅ Állítsd be az Instagram/TikTok API-kat (opcionális)
4. ✅ Állítsd be a domain-t és SSL-t
5. ✅ Konfiguráld a monitoring-ot
6. ✅ Backup strategy MongoDB-hez

## 🎉 Kész!

Az alkalmazás most fut és készen áll a használatra!

**Dokumentáció:**
- [API Referencia](./API.md)
- [Social Media API Setup](./SOCIAL_MEDIA_API.md)
- [PDF Generation](./PDF_GENERATION.md)
