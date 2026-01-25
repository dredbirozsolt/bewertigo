# Bewertigo - Automatizált Vállalkozás Auditáló Eszköz

## Projekt Áttekintés

Ez egy automatizált, web-alapú vállalkozás-auditáló eszköz az osztrák piacra. A rendszer 90 másodperc alatt objektív értékelést készít (0-100 pont) a vállalkozások online jelenlétéről.

## Funkciók

### 6 Pontozási Modul (egyenként 16.6 pont)

1. **Google Business Profile** - Alapadatok és profil teljesség
2. **Google Reviews & Response** - Csillagok átlaga és válaszadási aktivitás
3. **Website Performance** - Desktop sebesség és vizuális tartalom
4. **Mobile Experience** - Mobil sebesség és UI/UX
5. **Social Media Presence** - Instagram & TikTok aktivitás
6. **Competitor Analysis** - Piaci pozíció elemzése

### Technológiai Stack

- **Backend**: Node.js + Express
- **Database**: MongoDB
- **APIs**: 
  - Google Places API (Autocomplete, Place Details, Photos)
  - Google PageSpeed Insights API
  - **Web Scraping** for Instagram & TikTok (public profiles, no auth required)
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **PDF Generation**: PDFKit (direct Node.js generation)
- **Email**: Nodemailer (SMTP)
- **Caching**: Node-Cache (48 órás TTL)

## Telepítés

```bash
# Függőségek telepítése
npm install

# Környezeti változók beállítása
cp .env.example .env
# Szerkeszd az .env fájlt a saját API kulcsaiddal

# Fejlesztői mód indítása
npm run dev

# Produkciós indítás
npm start
```

## API Endpointok

### 1. Autocomplete
```
GET /api/autocomplete?input=search_query
```

### 2. Audit Indítás
```
POST /api/audit/start
Body: { "placeId": "ChIJ..." }
```

### 3. Audit Státusz (WebSocket vagy Polling)
```
GET /api/audit/status/:auditId
```

### 4. Lead Capture
```
POST /api/lead/capture
Body: { "auditId": "...", "email": "...", "gdprConsent": true }
```

## Projekt Struktúra

```
bewertigo/
├── server.js                 # Fő szerver fájl
├── config/
│   ├── database.js          # MongoDB kapcsolat
│   └── constants.js         # Iparági benchmark értékek
├── models/
│   ├── Audit.js             # Audit eredmény séma
│   └── Lead.js              # Lead adatok séma
├── services/
│   ├── googlePlaces.js      # Google Places API
│   ├── pageSpeed.js         # PageSpeed Insights API
│   ├── socialMedia.js       # Instagram/TikTok scraping
│   ├── scoring.js           # Pontozási algoritmus
│   ├── pdfGenerator.js      # PDF generálás (PDFKit)
│   └── email.js             # Email küldés (Nodemailer)
├── routes/
│   ├── audit.js             # Audit végpontok
│   └── lead.js              # Lead capture végpontok
├── utils/
│   ├── cache.js             # Caching logika
│   ├── retry.js             # Retry mechanizmus API-khoz
│   └── validation.js        # Email és adatvalidálás
├── public/
│   ├── index.html           # Főoldal
│   ├── css/
│   │   └── styles.css       # Stíluslapok
│   └── js/
│       ├── app.js           # Fő frontend logika
│       └── animations.js    # Scanning animációk
├── docs/
│   ├── INSTALLATION.md      # Telepítési útmutató
│   ├── API.md               # API dokumentáció
│   └── PDF_GENERATION.md    # PDF és email konfiguráció
└── package.json
```

## Scanning Animáció Checklist

1. ✅ Versenytársak és piaci pozíció (Flora & competitors)
2. ✅ Google business profile
3. ✅ Vélemények és válaszhajlandóság
4. ✅ Weboldal sebesség és fotóminőség
5. ✅ Felhasználói élmény és mobil-stabilitás
6. ✅ Social Media jelenlét elemzése
7. ✅ Adatok összesítése és riport generálása

## PDF Riport Specifikáció

### 1. Oldal - Diagnózis
- Radial Gauge Chart (0-100)
- 6 Pillér (2x3 rács, színkódokkal)
- Top Failures & Estimated Loss
- Market Comparison (versenytárs diagram)

### 2. Oldal - Bewertigo Stratégia
- Action Plan (6 megoldás)
- Industry Benchmark Box
- NFC tábla ajándék
- CTA gomb: bewertigo.at/termin?company=...

## Hiba Kezelés

- **No Website**: Speciális "Kritikus riasztás" blokk
- **API Timeout**: 2x retry logika PageSpeed-nél
- **Social Media Not Found**: "Profil nicht gefunden? Link manuell hinzufügen"
- **Caching**: 48 órás eredmény tárolás ugyanarra a place_id-re

## GDPR Megfelelőség

- Email validálás valós időben
- Checkbox: bewertigo.at/agb és bewertigo.at/datenschutz
- Lead tárolás MongoDB-ben

## Környezeti Változók

Lásd `.env.example` fájlt a részletekért.

## Licenc

ISC
