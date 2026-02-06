# Bewertigo Deploy & Server Info

## 📁 Szerver Mappák

### Git Repository (kód tárolása)
```
~/repositories/bewertigo/
```
- Itt van a git repo
- Itt történik a `git pull`
- Innen másolódik az éles mappába

### Éles Alkalmazás (futó app)
```
~/bewertigo-app/
```
- Itt fut a Passenger NodeApp
- IDE kell másolni a kódot deployment után
- **NE** commitálj ide közvetlenül!

### Logok
```
/home/dmf/logs/passenger.log
```
- Passenger alkalmazás logok
- Backend hibák és console.log üzenetek

## 🚀 Deploy Folyamat

**FONTOS:** Deploy és restart **MINDIG cPanel-en történik!**

### 1. Kód Push
```bash
git add .
git commit -m "..."
git push
```

### 2. Server-en Pull + Copy (SSH-n keresztül egyszer)
```bash
ssh dmf-ininet
cd ~/repositories/bewertigo
git pull origin main
rsync -av --exclude 'node_modules' --exclude '.git' --exclude '.env' ./ ~/bewertigo-app/
```

### 3. Restart - **cPanel-en!**
- Menj a cPanel-re
- Application Manager vagy Node.js App menü
- Restart bewertigo app
- VAGY: `touch ~/bewertigo-app/tmp/restart.txt` (Passenger auto-restart)

## 🔍 Debugging

### Log figyelés valós időben
```bash
ssh dmf-ininet "tail -f /home/dmf/logs/passenger.log"
```

### Utolsó 100 sor
```bash
ssh dmf-ininet "tail -100 /home/dmf/logs/passenger.log"
```

### Audit ID keresése
```bash
ssh dmf-ininet "tail -100 /home/dmf/logs/passenger.log | grep 'Audit ID:'"
```

### Futó process ellenőrzése
```bash
ssh dmf-ininet "ps aux | grep bewertigo | grep -v grep"
```

## 🌐 URL-ek

- **Éles:** https://bewertigo.dmf.n4.ininet.hu/
- **API:** https://bewertigo.dmf.n4.ininet.hu/api/
- **Health:** https://bewertigo.dmf.n4.ininet.hu/api/health

## 📊 Adatbázis

- **Típus:** MySQL (Sequelize ORM)
- **DB név:** dmf_bewertigo
- **Models:** 
  - `~/bewertigo-app/models/Audit.js`
  - `~/bewertigo-app/models/Lead.js`

## ⚙️ Environment

`.env` fájl helye: `~/bewertigo-app/.env`

Fontos változók:
- `GOOGLE_PLACES_API_KEY`
- `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`
- `EMAIL_*` változók

## 🔄 Passenger Info

- **Engine:** Phusion Passenger (NodeApp)
- **Auto-restart:** `tmp/restart.txt` touch-olásával
- **Process ID:** Változó (minden restart után új)
- **Futás helye:** `~/bewertigo-app/`

## 📝 Jegyzetek

- **NE** futtass `npm install`-t vagy `pm2`-t - Passenger kezeli!
- Frontend cache problémák → Hard refresh (`Ctrl+Shift+R`)
- API timeout jelenleg 10 másodperc
- rawData mentése Step 1 elején történik (critical fix!)
