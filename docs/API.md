# Bewertigo Audit Tool - API Dokumentáció

## Base URL

```
Development: http://localhost:3000/api
Production: https://yourdomain.com/api
```

## Authentikáció

Jelenleg nincs authentikáció - a rate limiting IP alapú.

## Rate Limiting

- **Limit**: 100 kérés / 15 perc / IP cím
- **Válasz túllépéskor**: `429 Too Many Requests`

---

## Endpoints

### 1. Health Check

Ellenőrzi, hogy a szerver fut-e.

**GET** `/api/health`

#### Response

```json
{
  "status": "OK",
  "timestamp": "2026-01-04T10:30:00.000Z",
  "environment": "production"
}
```

---

### 2. Autocomplete

Google Places alapú autocomplete cégnév kereséshez.

**GET** `/api/audit/autocomplete`

#### Query Parameters

| Parameter | Type   | Required | Description |
|-----------|--------|----------|-------------|
| input     | string | Yes      | Keresési szöveg (min. 3 karakter) |

#### Response

```json
{
  "success": true,
  "predictions": [
    {
      "placeId": "ChIJN1t_tDeuEmsRUsoyG83frY4",
      "description": "Café Central, Wien, Austria",
      "mainText": "Café Central",
      "secondaryText": "Wien, Austria"
    }
  ]
}
```

#### Example

```bash
curl "http://localhost:3000/api/audit/autocomplete?input=cafe%20central"
```

---

### 3. Start Audit

Elindít egy új audit folyamatot egy adott vállalkozásra.

**POST** `/api/audit/start`

#### Request Body

```json
{
  "placeId": "ChIJN1t_tDeuEmsRUsoyG83frY4"
}
```

#### Response

**Új audit indítása:**

```json
{
  "success": true,
  "cached": false,
  "auditId": "507f1f77bcf86cd799439011",
  "businessName": "Café Central",
  "message": "Audit gestartet"
}
```

**Cached audit (48 órán belül már futott):**

```json
{
  "success": true,
  "cached": true,
  "auditId": "507f1f77bcf86cd799439011",
  "message": "Audit bereits in den letzten 48 Stunden durchgeführt"
}
```

#### Errors

**400 Bad Request:**

```json
{
  "success": false,
  "message": "Place ID ist erforderlich"
}
```

**500 Internal Server Error:**

```json
{
  "success": false,
  "message": "Fehler beim Starten des Audits",
  "error": "Error message"
}
```

#### Example

```bash
curl -X POST http://localhost:3000/api/audit/start \
  -H "Content-Type: application/json" \
  -d '{"placeId": "ChIJN1t_tDeuEmsRUsoyG83frY4"}'
```

---

### 4. Audit Status

Lekéri egy audit aktuális státuszát és előrehaladását.

**GET** `/api/audit/status/:auditId`

#### URL Parameters

| Parameter | Type   | Description |
|-----------|--------|-------------|
| auditId   | string | Audit ObjectId (MongoDB) |

#### Response

```json
{
  "success": true,
  "audit": {
    "_id": "507f1f77bcf86cd799439011",
    "businessName": "Café Central",
    "status": "processing",
    "progress": {
      "current": 3,
      "total": 7,
      "currentStep": "Bewertungen und Antworten analysieren..."
    },
    "totalScore": null,
    "isUnlocked": false,
    "createdAt": "2026-01-04T10:00:00.000Z",
    "completedAt": null
  }
}
```

**Amikor kész:**

```json
{
  "success": true,
  "audit": {
    "_id": "507f1f77bcf86cd799439011",
    "businessName": "Café Central",
    "status": "completed",
    "progress": {
      "current": 7,
      "total": 7,
      "currentStep": "Bericht wird erstellt"
    },
    "totalScore": 68.5,
    "isUnlocked": false,
    "createdAt": "2026-01-04T10:00:00.000Z",
    "completedAt": "2026-01-04T10:01:30.000Z"
  }
}
```

#### Example

```bash
curl http://localhost:3000/api/audit/status/507f1f77bcf86cd799439011
```

---

### 5. Audit Result

Lekéri a teljes audit eredményt.

**GET** `/api/audit/result/:auditId`

#### URL Parameters

| Parameter | Type   | Description |
|-----------|--------|-------------|
| auditId   | string | Audit ObjectId |

#### Response (Locked - email még nem lett megadva)

```json
{
  "success": true,
  "message": "Geben Sie Ihre E-Mail-Adresse ein, um den vollständigen Bericht zu erhalten",
  "requiresUnlock": true,
  "audit": {
    "_id": "507f1f77bcf86cd799439011",
    "businessName": "Café Central",
    "businessType": "cafe",
    "address": "Herrengasse 14, 1010 Wien",
    "city": "Wien",
    "totalScore": 68.5,
    "status": "completed",
    "industryBenchmark": {
      "averageScore": 72,
      "category": "cafe",
      "city": "Wien",
      "source": "static"
    },
    "isUnlocked": false,
    "moduleScores": {
      "googleBusinessProfile": 12.4,
      "reviewSentiment": 14.2,
      "websitePerformance": 8.3,
      "mobileExperience": 6.5,
      "socialMediaPresence": 10.1,
      "competitorAnalysis": 17.0
    }
  }
}
```

#### Response (Unlocked - email megadva)

```json
{
  "success": true,
  "audit": {
    "_id": "507f1f77bcf86cd799439011",
    "businessName": "Café Central",
    "totalScore": 68.5,
    "isUnlocked": true,
    "moduleScores": { /* ... */ },
    "scores": {
      "googleBusinessProfile": {
        "score": 12.4,
        "details": {
          "hasOpeningHours": true,
          "hasPhone": true,
          "hasWebsite": false,
          "issues": [
            "Keine Website hinterlegt"
          ]
        }
      },
      "reviewSentiment": { /* ... */ },
      "websitePerformance": { /* ... */ },
      "mobileExperience": { /* ... */ },
      "socialMediaPresence": { /* ... */ },
      "competitorAnalysis": { /* ... */ }
    },
    "topIssues": [
      {
        "module": "websitePerformance",
        "score": 8.3,
        "severity": "high",
        "message": "Desktop Ladezeit 3.2s - Besucher springen ab!",
        "estimatedLoss": "Jede Sekunde Verzögerung reduziert Ihre Conversion-Rate um 7%..."
      }
    ]
  }
}
```

#### Example

```bash
curl http://localhost:3000/api/audit/result/507f1f77bcf86cd799439011
```

---

### 6. Lead Capture

Elmenti a lead email címét és feloldja a teljes eredményt.

**POST** `/api/lead/capture`

#### Request Body

```json
{
  "auditId": "507f1f77bcf86cd799439011",
  "email": "kunde@example.at",
  "gdprConsent": true
}
```

#### Response

```json
{
  "success": true,
  "message": "Vielen Dank! Der vollständige Bericht wird an Ihre E-Mail gesendet.",
  "audit": {
    "_id": "507f1f77bcf86cd799439011",
    "isUnlocked": true,
    "scores": { /* Teljes scores objektum */ },
    "topIssues": [ /* ... */ ]
  }
}
```

#### Errors

**400 Bad Request - Hiányzó mező:**

```json
{
  "success": false,
  "message": "Audit ID ist erforderlich"
}
```

**400 Bad Request - GDPR nem elfogadva:**

```json
{
  "success": false,
  "message": "Bitte akzeptieren Sie die Datenschutzbestimmungen"
}
```

**400 Bad Request - Érvénytelen email:**

```json
{
  "success": false,
  "message": "Ungültige E-Mail-Adresse"
}
```

**400 Bad Request - Hamis email:**

```json
{
  "success": false,
  "message": "Bitte geben Sie eine echte E-Mail-Adresse ein"
}
```

#### Email Validálás Szabályok

- Érvényes email formátum
- Nem lehet disposable email (tempmail, guerrillamail, stb.)
- Nem lehet fake pattern (test@, dummy@, a@a., stb.)
- Automatikus typo detection (gmial.com → gmail.com)

#### Example

```bash
curl -X POST http://localhost:3000/api/lead/capture \
  -H "Content-Type: application/json" \
  -d '{
    "auditId": "507f1f77bcf86cd799439011",
    "email": "kunde@example.at",
    "gdprConsent": true
  }'
```

---

### 7. Manual Social Media Links

Lehetővé teszi a felhasználónak, hogy manuálisan adja hozzá a social media linkeket, ha a rendszer nem találta meg.

**POST** `/api/lead/manual-social`

#### Request Body

```json
{
  "auditId": "507f1f77bcf86cd799439011",
  "instagram": "cafecentralvienna",
  "tiktok": "cafecentralofficial"
}
```

#### Response

```json
{
  "success": true,
  "message": "Social Media Profile aktualisiert"
}
```

#### Example

```bash
curl -X POST http://localhost:3000/api/lead/manual-social \
  -H "Content-Type: application/json" \
  -d '{
    "auditId": "507f1f77bcf86cd799439011",
    "instagram": "cafecentralvienna"
  }'
```

---

## Data Models

### Audit Schema

```javascript
{
  placeId: String,
  businessName: String,
  businessType: String,
  address: String,
  city: String,
  totalScore: Number, // 0-100
  
  scores: {
    googleBusinessProfile: {
      score: Number, // 0-16.6
      details: Object
    },
    // ... 5 more modules
  },
  
  topIssues: Array,
  industryBenchmark: Object,
  
  status: String, // 'pending' | 'processing' | 'completed' | 'failed'
  progress: {
    current: Number,
    total: Number,
    currentStep: String
  },
  
  leadEmail: String,
  isUnlocked: Boolean,
  
  createdAt: Date,
  completedAt: Date
}
```

### Lead Schema

```javascript
{
  email: String,
  auditId: ObjectId,
  businessName: String,
  placeId: String,
  totalScore: Number,
  
  gdprConsent: Boolean,
  gdprConsentDate: Date,
  
  pdfSent: Boolean,
  pdfSentAt: Date,
  
  source: String,
  ipAddress: String,
  userAgent: String,
  
  createdAt: Date
}
```

---

## Error Codes

| Code | Message | Description |
|------|---------|-------------|
| 400 | Bad Request | Hiányzó vagy érvénytelen paraméter |
| 404 | Not Found | Audit nem található |
| 429 | Too Many Requests | Rate limit túllépve |
| 500 | Internal Server Error | Szerver hiba |

---

## PDF Generálás és Email Küldés

### Automatikus PDF Report

Amikor egy lead email-t ad meg, a rendszer automatikusan:

1. **Generál egy 2 oldalas PDF reportot** (PDFKit használatával)
2. **Elküldi emailben** a lead címére (Nodemailer SMTP-n keresztül)
3. **Törli a PDF fájlt** a szerverről (GDPR compliance)

**Részletes dokumentáció**: Lásd [PDF_GENERATION.md](./PDF_GENERATION.md)

**PDF Tartalom**:
- Oldal 1: Diagnózis (score, 6 modul grid, top issues)
- Oldal 2: Bewertigo stratégia (megoldások, benchmark, ajándék, CTA)

**Email**:
- Tárgy: `Ihr kostenloser Bewertigo Audit-Report - [Cégnév]`
- HTML template német nyelven
- PDF csatolmány

---

## Caching

Az audit eredmények 48 órán keresztül cache-elve vannak:

- **Key**: `placeId`
- **TTL**: 48 óra (172,800 másodperc)
- **Storage**: In-memory (node-cache) vagy Redis (opcionális)

Ha ugyanarra a `placeId`-re 48 órán belül újra kérünk audit-ot, azonnal visszaadja a cache-elt eredményt.

---

## Scoring Algorithm

### Pontszámítás

Minden modul maximum **16.6 pontot** ér, összesen **100 pont**.

1. **Google Business Profile** (16.6 pont)
   - Alapadatok: 8.3 pont
   - Profil teljesség: 8.3 pont

2. **Review Sentiment** (16.6 pont)
   - Csillagok átlaga: 8.3 pont
   - Válaszadási aktivitás: 8.3 pont

3. **Website Performance** (16.6 pont)
   - Desktop LCP: 12.6 pont
   - Fotók: 4 pont
   - Click-to-call: -5 pont (büntetés, ha nincs)

4. **Mobile Experience** (16.6 pont)
   - Mobile LCP: 8.3 pont
   - UI/UX: 8.3 pont
   - Click-to-call: -5 pont (büntetés)

5. **Social Media** (16.6 pont)
   - Elérhetőség & követők: 8.3 pont
   - Engagement & aktivitás: 8.3 pont

6. **Competitor Analysis** (16.6 pont)
   - 1. hely: 16.6 pont
   - 2. hely: 11.6 pont
   - 3. hely: 6.6 pont
   - 4. hely: 0 pont

### Severity Levels

- **Critical**: < 30% (< 5 pont)
- **High**: 30-60% (5-10 pont)
- **Medium**: 60-80% (10-13 pont)
- **Low**: > 80% (> 13 pont)

---

## Development

### Local Testing

```bash
# Start development server
npm run dev

# Test autocomplete
curl "http://localhost:3000/api/audit/autocomplete?input=test"

# Test health
curl http://localhost:3000/api/health
```

### Environment Variables

```env
NODE_ENV=development  # 'development' or 'production'
PORT=3000
GOOGLE_PLACES_API_KEY=your_key
GOOGLE_PAGESPEED_API_KEY=your_key
MONGODB_URI=mongodb://localhost:27017/bewertigo

# Email SMTP Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM="Bewertigo <your-email@gmail.com>"

# PDF Storage
PDF_STORAGE_PATH=./pdfs

FRONTEND_URL=http://localhost:3000
API_RATE_LIMIT=100
CACHE_TTL_HOURS=48
```

---

## Changelog

### v2.0.0 (2026-01-04)

- ✅ Migrated from Make.com/PDFMonkey to direct PDF generation
- ✅ Implemented PDFKit for PDF creation
- ✅ Implemented Nodemailer for email delivery
- ✅ Removed external service dependencies

### v1.0.0 (2026-01-04)

- ✅ Initial release
- ✅ Google Places integration
- ✅ PageSpeed Insights integration
- ✅ 6-module scoring algorithm
- ✅ Lead capture & blur logic
- ✅ PDF generation & email delivery
- ✅ 48-hour caching
- ✅ Real-time progress tracking
- ✅ Email validation
- ✅ GDPR compliance
