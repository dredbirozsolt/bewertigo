# ⚠️ FONTOS ÉRTESÍTÉS - Instagram & TikTok API

## 🚨 API-k NEM Használhatók Audit Tool-hoz!

**Válasz a kérdésre:** 
> "Ahhoz hogy egy étterem instáját vizsgáljam, ahhoz az étteremnek be kell lépnie?"

**IGEN** - És ez pontosan a probléma! 😞

---

## Miért NEM működik az Instagram Graph API audit tool-hoz?

### A Probléma:

**Instagram Graph API** = Csak a **SAJÁT** Instagram Business Account adatait tudod lekérni!

Ahhoz, hogy **más éttermek/vállalkozások** Instagram profilját vizsgáld:
- ❌ Minden étteremnek **be kellene lépnie** és **engedélyt adnia**
- ❌ OAuth authorization flow szükséges minden egyes cégnek
- ❌ Nem automatizálható

### Mi történne:

```
1. Kiválasztod "Café Central Wien"-t auditálásra
2. A rendszer kéri: "Kérlek, add meg a Café Central Instagram bejelentkezését"
3. A tulajdonosnak be kellene lépnie és authorize-álnia az app-ot
4. ❌ Ez NEM praktikus audit tool-hoz!
```

---

## Mi történne TikTok Business API-val?

**Ugyanaz a probléma:**
- ❌ OAuth authorization minden vállalkozástól
- ❌ Approval szükséges TikTok-tól (3-7 nap)
- ❌ User consent kötelező
- ❌ Nem automatizálható

---

## ✅ MEGOLDÁS: Web Scraping (Publikus Adatok)

A Bewertigo rendszer **web scraping**-et használ, ami:

### ✅ Előnyök:
- ✅ **Nincs bejelentkezés** - Bármely publikus profilt vizsgálhatsz
- ✅ **Nincs OAuth** - Nem kell engedély a cégtől
- ✅ **Automatizált** - 90 másodperc alatt kész
- ✅ **Ingyenes** - Nincs API költség
- ✅ **Egyszerű** - Nincs token setup

### ⚠️ Hátrányok:
- ⚠️ **Korlátozott adatok** - Csak publikus adatok (followers, post count)
- ⚠️ **Engagement rate nincs** - Likes/comments nem láthatók scraping-gel
- ⚠️ **Törékeny** - Instagram/TikTok változtathat az oldal struktúrán
- ⚠️ **Rate limiting** - Túl sok kérés blokkolható

---

## 📊 Mit Tudunk Lekérni?

| Adat | Instagram Scraping | TikTok Scraping |
|------|-------------------|-----------------|
| **Followers** | ✅ Igen | ✅ Igen |
| **Post/Video Count** | ✅ Igen | ✅ Igen |
| **Total Likes** | ❌ Nem | ✅ Igen |
| **Recent Posts** | ❌ Nem | ❌ Nem |
| **Likes per Post** | ❌ Nem | ❌ Nem |
| **Comments** | ❌ Nem | ❌ Nem |
| **Engagement Rate** | ❌ Nem | ❌ Nem |
| **Last Post Date** | ❌ Nem | ❌ Nem |

---

## 🎯 Amit A Bewertigo Audit Tool Csinál:

### 1. **Website Scraping** (1. szint)
- Megnézi a vállalkozás weboldalját
- Keres Instagram/TikTok linkeket
- Ha megtalálja → kinyeri a username-t

### 2. **Profile Scraping** (2. szint)
- Lekéri a `https://www.instagram.com/{username}/` oldalt
- Kivonatolja a followers és post count-ot a meta tag-ekből
- Lekéri a `https://www.tiktok.com/@{username}` oldalt
- Kivonatolja a followers, video count, likes-ot

### 3. **Scoring** (3. szint)
- Ha **>1000 followers** → Jó pontszám
- Ha **<30 napja inaktív** (nincs új poszt) → Pontlevonás
- Ha **nincs profil** → 0 pont

---

## 🚀 NINCS SZÜKSÉG TOKEN-RE!

A jelenlegi implementáció **teljesen működik API token nélkül**!

### .env Fájl Beállítása:

```env
# Social Media - NEM KELL KITÖLTENI!
# A rendszer automatikusan web scraping-et használ

# INSTAGRAM_ACCESS_TOKEN=  (üresen hagyva)
# INSTAGRAM_BUSINESS_ACCOUNT_ID=  (üresen hagyva)
# TIKTOK_ACCESS_TOKEN=  (üresen hagyva)
# TIKTOK_APP_ID=  (üresen hagyva)
```

✅ **KÉSZ! Működik azonnal!**

---

## 💡 Alternatív Megoldások (Ha Több Adatot Akarsz)

### 1. **RapidAPI - Instagram/TikTok Services**

Harmadik fél szolgáltatások, amelyek scraping-et nyújtanak API-ként:

**Instagram:**
- [Instagram API by RapidAPI](https://rapidapi.com/hub)
- Költség: $0-50/hó (500-10,000 requests)
- Followers, posts, engagement rate
- Nincs OAuth, csak API key

**TikTok:**
- [TikTok Scraper by RapidAPI](https://rapidapi.com/hub)
- Költség: $0-30/hó
- Followers, videos, views
- Nincs OAuth

### 2. **Apify Scrapers**

- [Apify Instagram Scraper](https://apify.com/apify/instagram-scraper)
- [Apify TikTok Scraper](https://apify.com/apify/tiktok-scraper)
- Részletes adatok (engagement, hashtags, stb.)
- Költség: $0-49/hó

### 3. **PhantomBuster**

- Automatizált scraping különböző platformokhoz
- Költség: $30-400/hó
- API access

---

## 🎯 AJÁNLÁS

**HASZNÁLD A JELENLEGI IMPLEMENTÁCIÓT!**

✅ **Web Scraping módban működik minden:**
- Instagram followers & post count
- TikTok followers & video count
- Automatizált scoring
- Gyors (~90 másodperc)
- Ingyenes
- Nincs setup

⚠️ **Ha később több adatra van szükség:**
- Integráld a RapidAPI-t (egyszerű)
- Vagy Apify-t
- ~$20-50/hó költséggel

---

## ✅ ÖSSZEFOGLALÁS

### Kérdés:
> "Ahhoz hogy egy étterem instáját vizsgáljam, ahhoz az étteremnek be kell lépnie?"

### Válasz:
**NEM!** 🎉

A Bewertigo **web scraping**-et használ, amely:
- ✅ Bármely publikus profilt vizsgál
- ✅ Nincs bejelentkezés
- ✅ Nincs engedélykérés
- ✅ Teljesen automatizált
- ✅ Azonnal működik

**Semmi setup nem kell! A rendszer készen áll!** 🚀

---

## 🔧 Amit Tennünk Kell:

### Jelenleg:
```bash
cd /Users/birozsolt/Downloads/bewertigo

# .env fájlban:
# Hagyd üresen az Instagram/TikTok token mezőket

npm run dev

# Futtass egy audit-ot → MŰKÖDIK! ✅
```

### Tesztelés:
1. Válassz egy éttermet (pl. "Café Central Wien")
2. Audit indul
3. A rendszer automatikusan:
   - Megkeresi az Instagram profilt
   - Scraping-eli a followers számot
   - Scoring a social media module-ban

✅ **NINCS token setup! NINCS OAuth! Minden automatikus!**

---

**Készítette:** Bewertigo Development Team  
**Frissítve:** 2026. január 5.  
**Státusz:** ✅ Scraping-Only - Production Ready

## 📸 INSTAGRAM GRAPH API TOKEN

### Előfeltételek
- Instagram **Business Account** (NEM Personal Account!)
- Facebook Page (kötelező!)
- Facebook Developer Account

---

### 📋 LÉPÉS-PÉR-LÉPÉS

#### 1. Instagram Business Account Létrehozása

Ha még nincs Business Account-od:

1. Nyisd meg az Instagram app-ot
2. Menj a **Profilodra** → **☰ Menu** → **⚙️ Settings**
3. **Account** → **Switch to Professional Account**
4. Válaszd: **Business**
5. Válassz kategóriát (pl. "Restaurant", "Beauty Salon")
6. ✅ Kész! Most már Business Account-od van

#### 2. Facebook Page Létrehozása & Összekapcsolás

1. Menj: https://www.facebook.com/pages/create
2. Hozz létre egy Page-et (pl. vállalkozásod neve)
3. Instagram app-ban: **Settings** → **Account** → **Linked Accounts**
4. Válaszd: **Facebook**
5. Kapcsold össze az Instagram fiókot a Facebook Page-dzsel
6. ✅ Instagram Business Account most össze van kötve FB Page-dzsel

#### 3. Facebook Developer Account

1. Menj: https://developers.facebook.com/
2. Kattints: **Get Started** (jobb felső sarokban)
3. Fogadd el a Terms
4. Válaszd: **Continue**
5. ✅ Developer Account létrejött!

#### 4. Facebook App Létrehozása

1. Menj: https://developers.facebook.com/apps/
2. Kattints: **Create App**
3. Válaszd: **Business** típus
4. App név: **"Bewertigo Audit Tool"**
5. App contact email: *saját email címed*
6. Kattints: **Create App**
7. ✅ App létrejött!

#### 5. Instagram Graph API Engedélyezése

Az App Dashboard-on:

1. Bal oldali menüben kattints: **Add Product**
2. Keresd meg: **Instagram Graph API**
3. Kattints: **Set Up**
4. ✅ Instagram API aktiválva!

#### 6. Access Token Generálása (Rövid élettartamú)

1. Menj: **Tools** → **Graph API Explorer** (bal menü)
2. Fent válaszd ki: **Your App Name** (Bewertigo Audit Tool)
3. **User or Page**: Válaszd a Facebook Page-edet
4. Kattints: **Permissions** → Add meg:
   - ✅ `pages_show_list`
   - ✅ `pages_read_engagement`
   - ✅ `instagram_basic`
   - ✅ `instagram_manage_insights`
5. Kattints: **Generate Access Token**
6. Facebook login + engedélyek jóváhagyása
7. **Másold ki a tokent** (ez egy rövid élettartamú token, 1 óra!)

📝 **Példa token**: `EAABsbaxxxxxxxxxxxxxxxxxxxxx` (nagyon hosszú string)

#### 7. Hosszú Élettartamú Token Generálása (60 nap)

A rövid token 1 óra után lejár! Hosszú élettartamú token kell:

**Módszer A - Graph API Explorer (Egyszerűbb)**:

1. Graph API Explorer-ben (https://developers.facebook.com/tools/explorer/)
2. Kattints az **🔒 (i) Information** ikonra a token mellett
3. Kattints: **Open in Access Token Debugger**
4. Kattints: **Extend Access Token** gomb (alul)
5. Másold ki az új tokent
6. ✅ Ez most 60 napig él!

**Módszer B - Terminal (Haladóknak)**:

```bash
curl -i -X GET "https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=YOUR_APP_ID&client_secret=YOUR_APP_SECRET&fb_exchange_token=YOUR_SHORT_TOKEN"
```

Helyettesítsd:
- `YOUR_APP_ID`: App ID (Dashboard → Settings → Basic)
- `YOUR_APP_SECRET`: App Secret (Dashboard → Settings → Basic)
- `YOUR_SHORT_TOKEN`: Az 1 órás token

Válasz:
```json
{
  "access_token": "EAABsbaxxx...",  ← Ez a hosszú élettartamú token!
  "token_type": "bearer",
  "expires_in": 5183944  ← ~60 nap
}
```

#### 8. Instagram Business Account ID Lekérése

Most szükséged van az Instagram Business Account ID-ra:

**Graph API Explorer-ben**:

1. Írd be ezt a query-be:
```
me/accounts?fields=instagram_business_account
```

2. Kattints: **Submit**

3. Válasz példa:
```json
{
  "data": [
    {
      "instagram_business_account": {
        "id": "17841400008460056"  ← Ez kell!
      },
      "id": "109359024574108"
    }
  ]
}
```

4. Másold ki az `instagram_business_account` → `id` értékét

#### 9. Token Tesztelése

Teszteld, hogy működik-e:

```bash
curl "https://graph.facebook.com/v18.0/17841400008460056?fields=username,followers_count&access_token=YOUR_LONG_TOKEN"
```

Válasz:
```json
{
  "username": "your_insta_username",
  "followers_count": 1234,
  "id": "17841400008460056"
}
```

✅ **Működik!**

#### 10. .env Fájlba Írás

Bewertigo projekt `.env` fájljában:

```env
INSTAGRAM_ACCESS_TOKEN=EAABsbaxxxxxxxxxxxxxxxxxxx
INSTAGRAM_BUSINESS_ACCOUNT_ID=17841400008460056
```

✅ **KÉSZ!** Instagram API működik! 🎉

---

### ⚠️ FONTOS - Token Lejárat

A hosszú élettartamú token **60 nap után lejár**!

**Megoldások**:

1. **Manuális megújítás** (60 naponta):
   - Ismételd meg a 7. lépést

2. **Automatikus megújítás** (programozva):
   ```javascript
   // Készíthetsz egy cron job-ot, ami 50 naponta megújítja
   // Részletek: https://developers.facebook.com/docs/facebook-login/guides/access-tokens/get-long-lived
   ```

3. **Never-expiring token** (Business Verification szükséges):
   - Facebook Business Verification
   - System User token (nem jár le)
   - Részletek: https://developers.facebook.com/docs/facebook-login/guides/access-tokens/get-long-lived/#system-user-access-tokens

---

## 🎵 TIKTOK BUSINESS API TOKEN

⚠️ **FIGYELEM**: TikTok API hozzáférés **nem mindig public**! Approval szükséges.

### Előfeltételek
- TikTok Business Account
- Vállalkozás adatai (cégnév, weboldal)
- Fejlesztői tapasztalat

---

### 📋 LÉPÉS-PÉR-LÉPÉS

#### 1. TikTok for Business Account

1. Menj: https://business.tiktok.com/
2. Kattints: **Sign Up**
3. Töltsd ki:
   - Email cím
   - Jelszó
   - Cégnév
   - Ország: **Austria**
4. Erősítsd meg az email címed
5. ✅ Business Account létrehozva!

#### 2. TikTok Developer Portal

1. Menj: https://developers.tiktok.com/
2. Kattints: **Login** (jobb felső sarokban)
3. Jelentkezz be a TikTok Business Account-oddal
4. Elfogadod a **Developer Terms**
5. Kattints: **Register as Developer**
6. Töltsd ki:
   - **Developer Name**: Saját neved / cégnév
   - **Email**: Business email
   - **Company Info**: Bewertigo / Audit Tool cég
   - **Website**: https://bewertigo.at
7. ✅ Developer Account regisztrálva!

#### 3. App Létrehozása

1. Dashboard: https://developers.tiktok.com/apps
2. Kattints: **Create an App**
3. Töltsd ki:
   - **App Name**: "Bewertigo Audit Tool"
   - **Industry**: Marketing & Analytics
   - **App Type**: Web App
   - **Use Case**: "Business profile analysis for audit reports"
4. Kattints: **Submit**
5. ✅ App létrehozva!

#### 4. API Access Kérése

⚠️ **Itt jön a trükk** - TikTok nem ad automatikusan API access-t!

1. App Dashboard-on kattints: **Apply for Permissions**
2. Válaszd ki:
   - ✅ **User Info API**
   - ✅ **Video List API**
3. Use Case leírás (angol):
   ```
   We are building an automated business audit tool for Austrian 
   businesses. We need to analyze TikTok profiles (follower count, 
   video count, engagement rates) to provide marketing insights. 
   The data will be used for generating audit reports.
   ```
4. Töltsd ki a kérdőívet
5. Kattints: **Submit for Review**
6. ⏳ **Várakozás**: 3-7 nap (TikTok jóváhagyás)

**Email érkezik**:
- ✅ Approved → Folytathatod
- ❌ Rejected → Próbáld újra részletesebb leírással

#### 5. OAuth 2.0 Setup (Ha Approved)

**5.1. Redirect URI Beállítása**

1. App Settings → **Login Kit**
2. Kattints: **Configure**
3. **Redirect URI**: `https://yourdomain.com/auth/tiktok/callback`
4. Ha helyi fejlesztés: `http://localhost:3000/auth/tiktok/callback`
5. Save

**5.2. App Credentials**

Dashboard-on látod:
- **Client Key** (App ID): `aw123456789`
- **Client Secret**: `abc123xyz456...`

Másold ki őket!

#### 6. OAuth Flow Implementálása

⚠️ **Probléma**: TikTok API **OAuth authorization** kell → a felhasználónak be kell jelentkeznie!

Ez **nem ideális** egy audit tool-hoz, mert:
- Minden egyes profil auditálásához a TikTok tulajdonosának be kellene jelentkeznie
- Ez a Bewertigo use case-nél nem működik!

**Megoldás: Web Scraping használata TikTok-nál!**

---

### 🤔 AJÁNLÁS - Mi a legjobb megoldás?

| Platform | Ajánlott Módszer | Indoklás |
|----------|------------------|----------|
| **Instagram** | ✅ **Graph API** | Könnyű setup, Business Account elég |
| **TikTok** | ⚠️ **Web Scraping** | API nehezen hozzáférhető, OAuth nem praktikus |

---

## 🚀 GYORS START - Ajánlott Konfiguráció

### Opció 1: Instagram API + TikTok Scraping (AJÁNLOTT)

```env
# .env fájl

# Instagram - Használd az API-t
INSTAGRAM_ACCESS_TOKEN=EAABsbaxxxxxxxxxxx
INSTAGRAM_BUSINESS_ACCOUNT_ID=17841400008460056

# TikTok - Hagyd üresen, scraping automatikus
TIKTOK_ACCESS_TOKEN=
TIKTOK_APP_ID=
```

✅ **Előnyök**:
- Instagram: Teljes engagement adatok
- TikTok: Followers és video count működik (scraping)
- Gyors setup
- Megbízható

### Opció 2: Mindkettő Scraping (LEGEGYSZERŰBB)

```env
# .env fájl

# Hagyd mind a négyet üresen
INSTAGRAM_ACCESS_TOKEN=
INSTAGRAM_BUSINESS_ACCOUNT_ID=
TIKTOK_ACCESS_TOKEN=
TIKTOK_APP_ID=
```

✅ **Előnyök**:
- Nincs API setup
- Azonnal működik
- Ingyenes
- Egyszerű

⚠️ **Hátrányok**:
- Kevesebb adat (engagement rate nincs)
- Törékeny (oldal változásokra érzékeny)

### Opció 3: Mindkettő API (HALADÓ)

Ha mindkét API-t be akarod állítani:

```env
# .env fájl

# Instagram
INSTAGRAM_ACCESS_TOKEN=EAABsbaxxxxxxxxxxx
INSTAGRAM_BUSINESS_ACCOUNT_ID=17841400008460056

# TikTok (ha megkaptad az approval-t)
TIKTOK_ACCESS_TOKEN=act.xxxxxxxxxx
TIKTOK_APP_ID=aw123456789
```

---

## ✅ TESZTELÉS

### Instagram API Teszt

```bash
# Terminal-ban
curl "https://graph.facebook.com/v18.0/YOUR_BUSINESS_ID?fields=username,followers_count,media_count&access_token=YOUR_TOKEN"
```

Ha válasz jön → **Működik!** ✅

### Bewertigo Teszt

```bash
cd /Users/birozsolt/Downloads/bewertigo
npm run dev
```

Futtass egy audit-ot a frontend-en és nézd a server logokat:

```bash
# Ha Instagram API működik:
✅ "Fetching Instagram data for: username"
✅ "Instagram data source: instagram_graph_api"

# Ha TikTok scraping:
⚠️ "TikTok API credentials not configured, using fallback scraping"
✅ "Using fallback scraping for TikTok: username"
```

---

## 📞 SEGÍTSÉG KELL?

### Instagram Token Debug

1. Menj: https://developers.facebook.com/tools/debug/accesstoken/
2. Illeszd be a tokened
3. Látod:
   - Token érvényessége
   - Lejárati dátum
   - Permissions (scopes)
   - Token típusa (User vagy Page)

### Facebook Developer Support

- Docs: https://developers.facebook.com/docs/instagram-api
- Support: https://developers.facebook.com/support/

### TikTok Developer Support

- Docs: https://developers.tiktok.com/doc/overview
- Email: tiktokforbusiness@tiktok.com

---

## 🎯 ÖSSZEFOGLALÁS

**TEDD MEG MOST:**

1. ✅ Instagram Business Account létrehozása (5 perc)
2. ✅ Facebook Developer Account (2 perc)
3. ✅ Facebook App + Instagram API (10 perc)
4. ✅ Access Token generálása (5 perc)
5. ✅ Token a .env-be (1 perc)

**ÖSSZESEN: ~25 perc** 🚀

**TikTok**: Hagyd ki egyelőre, scraping elég! ⚠️

---

**Utolsó frissítés**: 2026. január 5.  
**Szerző**: Bewertigo Development Team
