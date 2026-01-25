# PDF Generálás és Email Küldés

## 📄 Áttekintés

A Bewertigo audit tool automatikusan generál és küld 2 oldalas PDF reportokat minden lead capture után. A rendszer teljesen self-contained, nem igényel külső szolgáltatásokat (Make.com, PDFMonkey stb.).

## 🔧 Technológiai Stack

- **PDFKit** (v0.14.0): PDF dokumentum generálás
- **Nodemailer** (v6.9.7): Email küldés SMTP protokollon keresztül
- **Native PDFKit Graphics**: Chart-ok és kördiagramok PDFKit beépített rajzolási funkciójával

## 📋 Workflow

```
User submits email
       ↓
Lead saved to database
       ↓
Audit unlocked
       ↓
PDF generation started (background)
       ↓
2-page PDF created with PDFKit
       ↓
Email sent with PDF attachment (Nodemailer)
       ↓
PDF file deleted from server
       ↓
Lead.pdfSent = true
```

## 📑 PDF Report Struktúra

### Page 1: Die Diagnose

1. **Header**
   - Bewertigo logó (text)
   - Dátum (német formátum)

2. **Business Info**
   - Cégnév (24pt, bold)
   - Cím (12pt, szürke)

3. **Score Circle** (központosítva)
   - Nagy kördiagram (120px átmérő)
   - Pontszám (0-100) nagy számmal középen
   - Színkódolás:
     - 80-100: Zöld (#10b981)
     - 60-79: Sárga (#f59e0b)
     - 40-59: Narancs (#f97316)
     - 0-39: Piros (#ef4444)
   - Label: Ausgezeichnet / Gut / Verbesserungsbedarf / Kritisch

4. **6 Modul Grid** (2x3 rács)
   - Google Business Profile 📍
   - Bewertungen ⭐
   - Website Speed 🚀
   - Mobile UX 📱
   - Social Media 📸
   - Marktposition 📊
   - Mindegyik: icon, név, pontszám, színes indikátor

5. **Top Failures Section**
   - ⚠️ címsor piros színnel
   - Top 2 javítandó terület
   - Modul név + hibaüzenet

### Page 2: Bewertigo Strategie

1. **Header**
   - "Ihre Bewertigo Strategie" (20pt)
   - Alcím: "Konkrete Lösungen für Ihren Erfolg"

2. **Action Plan** (max 4 megoldás)
   - Szürke boxok
   - Megoldás címe (bold)
   - Rövid leírás

3. **Industry Benchmark Box**
   - Lila háttér (#667eea)
   - "Ihr Score: XX Punkte"
   - "Branchendurchschnitt: XX Punkte"

4. **Gift Section**
   - Sárga háttér (#fbbf24)
   - 🎁 IHR GESCHENK
   - NFC Google-Bewertungs-Display ajánlat (60€ értékben)

5. **Final CTA**
   - "Bereit für den nächsten Schritt?"
   - Calendar link: bewertigo.at/termin?company=...

6. **Footer**
   - Bewertigo kontakt infó

## 📧 Email Template

### Tárgy
```
Ihr kostenloser Bewertigo Audit-Report - [Cégnév]
```

### HTML Email Tartalom

- **Header**: Gradiens háttér (lila), Bewertigo logó
- **Score Section**: Nagy pontszám box színkódolással
- **Üdvözlő szöveg**: Német nyelven
- **Top Issues List**: Bullet points a főbb problémákról
- **Gift Box**: Sárga gradiens, NFC display ajánlat
- **CTA Button**: Lila gradiens, "Jetzt Termin sichern"
- **Footer**: Kapcsolat, GDPR info

### Csatolmány
- Fájlnév: `Bewertigo_Audit_[Cegnev].pdf`
- PDF automatikusan csatolva

## 🔧 Konfiguráció

### Environment Variables

```env
# SMTP Email Service
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM="Bewertigo <your-email@gmail.com>"

# PDF Storage
PDF_STORAGE_PATH=./pdfs
```

### Támogatott Email Szolgáltatók

| Szolgáltató | Ingyenes Limit | Setup Nehézség | Ajánlott |
|-------------|----------------|----------------|----------|
| **Gmail** | 500/nap | Könnyű | ✅ Kezdőknek |
| **SendGrid** | 100/nap | Közepes | ✅ Profiknak |
| **AWS SES** | 62,000/hó | Nehéz | ✅ Nagyvállalati |
| **Mailgun** | 100/nap | Könnyű | ⚠️ |
| **SMTP2GO** | 1000/hó | Könnyű | ✅ |

## 🚀 Használat

### PDF Generálás Manuálisan

```javascript
const pdfGenerator = require('./services/pdfGenerator');
const emailService = require('./services/email');

// Generate PDF
const { filePath } = await pdfGenerator.generateAuditReport(audit, lead);

// Send email
await emailService.sendAuditReport(lead, audit, filePath);

// Cleanup
await pdfGenerator.deletePDF(filePath);
```

### Test Email Küldés

```javascript
const emailService = require('./services/email');

await emailService.sendTestEmail('test@example.com');
```

## 📊 Scoring Logika

A PDF-ben megjelenő pontszámok a következő algoritmus szerint számolódnak:

### Modulonkénti Maximális Pontszámok (100 pont összesen)
- Minden modul: **16.6 pont** (6 modul × 16.6 ≈ 100)

### Google Business Profile (16.6 pont)
- **8.3 pont**: Profile completeness (open hours, phone, website)
- **8.3 pont**: Verification status

### Review Sentiment (16.6 pont)
- **5.5 pont**: Rating >= 4.0
- **5.5 pont**: Review count >= 20
- **5.6 pont**: Response rate >= 50%

### Website Performance (16.6 pont)
- **16.6 pont**: Desktop LCP < 2500ms

### Mobile Experience (16.6 pont)
- **16.6 pont**: Mobile LCP < 2500ms

### Social Media Presence (16.6 pont)
- **8.3 pont**: Instagram profile exists
- **8.3 pont**: TikTok profile exists

### Competitor Analysis (16.6 pont)
- **16.6 pont**: Rank #1 in 3km radius
- **13.3 pont**: Rank #2
- **10 pont**: Rank #3
- **6.6 pont**: Rank #4-5
- **0 pont**: Rank #6+

## 🎨 Design Specifications

### Színpaletta
- **Primary**: #667eea (lila)
- **Secondary**: #764ba2 (sötét lila)
- **Success**: #10b981 (zöld)
- **Warning**: #f59e0b (sárga)
- **Danger**: #ef4444 (piros)
- **Gift**: #fbbf24 (arany sárga)
- **Text**: #1f2937 (sötét szürke)
- **Text Light**: #6b7280 (világos szürke)

### Font Rendszer
- **Heading**: Helvetica-Bold
- **Body**: Helvetica
- **Size Scale**:
  - 32pt: Main score
  - 24pt: Business name
  - 20pt: Page titles
  - 14pt: Section headers
  - 12pt: Body text
  - 10pt: Small text

### Spacing
- **Margins**: 50px (all sides)
- **Section Gap**: 30px
- **Card Gap**: 10px
- **Line Height**: 1.6 (body text)

## 🐛 Hibakezelés

### PDF Generálási Hibák

```javascript
try {
  const { filePath } = await pdfGenerator.generateAuditReport(audit, lead);
} catch (error) {
  console.error('PDF generation failed:', error);
  // Fallback: Küldj email PDF nélkül
  // Vagy: Retry 3x
  // Vagy: Manual notification admin-nak
}
```

### Email Küldési Hibák

```javascript
try {
  await emailService.sendAuditReport(lead, audit, filePath);
} catch (error) {
  console.error('Email sending failed:', error);
  // Options:
  // 1. Retry queue (Bull/Redis)
  // 2. Save to database for manual retry
  // 3. Alert admin via Slack/Discord webhook
}
```

### SMTP Connection Hibák

Az `emailService` automatikusan ellenőrzi a kapcsolatot indításkor:

```
✅ Email service ready
vagy
❌ Email transporter verification failed: [error]
```

Ha hibás a konfiguráció, az email küldés elmarad, de a lead capture sikeres lesz.

## 🔒 Biztonság

### PDF Tárolás
- PDFek csak átmenetileg tárolódnak (`./pdfs/` könyvtár)
- Email küldés után **automatikusan törlődnek**
- Never store PDFs long-term (GDPR compliance)

### Email Attachment Limit
- Max PDF méret: ~2-3 MB (tipikusan 200-500 KB)
- Ha túl nagy: Kompresszálj képeket vagy redukálj content-et

### SMTP Credentials
- **Soha ne commitold** az `.env` fájlt git-be
- Use environment variables mindig
- Gmail App Password ajánlott (normál jelszó helyett)

## 📈 Performance

### PDF Generálási Idő
- Átlag: **1-2 másodperc**
- Komplexitás: 2 oldal, ~10 chart/diagram, 500KB méret

### Email Küldési Idő
- Gmail: 2-5 másodperc
- SendGrid: 1-2 másodperc
- AWS SES: 1-3 másodperc

### Background Processing
A PDF generálás és email küldés **aszinkron** történik:

```javascript
// Lead capture response instant (< 100ms)
generateAndSendPDF(audit, lead).catch(err => {
  console.error('Background task failed:', err);
});
// User már látja az unlocked audit-ot, miközben a PDF készül
```

## 🧪 Tesztelés

### 1. Test Email Function

```bash
node -e "require('./services/email').sendTestEmail('your@email.com')"
```

### 2. Generate Test PDF

```javascript
const Audit = require('./models/Audit');
const Lead = require('./models/Lead');
const pdfGenerator = require('./services/pdfGenerator');

const audit = await Audit.findOne();
const lead = await Lead.findOne();

const { filePath } = await pdfGenerator.generateAuditReport(audit, lead);
console.log('PDF saved to:', filePath);
```

### 3. Full Integration Test

1. Indítsd el a szervert
2. Futtass egy audit-ot egy valós céggel
3. Add meg az email címed
4. Ellenőrizd:
   - Email megérkezett-e
   - PDF csatolva van-e
   - PDF helyesen renderelődik-e
   - Chart-ok látszanak-e

## 📚 További Dokumentáció

- [PDFKit Documentation](http://pdfkit.org/)
- [Nodemailer Documentation](https://nodemailer.com/)
- [ChartJS Documentation](https://www.chartjs.org/)

## 🆘 Gyakori Problémák

### "Email service not configured"
**Probléma**: EMAIL_HOST vagy EMAIL_USER hiányzik  
**Megoldás**: Töltsd ki az összes EMAIL_* változót a `.env` fájlban

### "SMTP connection timeout"
**Probléma**: Firewall blokkolja a 587/465 portot  
**Megoldás**: Ellenőrizd a tűzfal beállításokat, vagy használj VPN-t

### "Invalid login credentials"
**Probléma**: Rossz email jelszó vagy App Password  
**Megoldás**: Gmail esetén használj App Password-öt, ne a normál jelszót

### "PDF generation failed"
**Probléma**: Hiányzó audit adatok (pl. scores objektum üres)  
**Megoldás**: Ellenőrizd hogy az audit sikeresen lefutott-e (status: 'completed')

### "Attachment too large"
**Probléma**: PDF > 10 MB (email provider limit)  
**Megoldás**: Csökkentsd a chart felbontást vagy távolíts el képeket
