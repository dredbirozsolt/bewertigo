# Social Media API Integráció

## Áttekintés

A Bewertigo rendszer **Instagram Graph API** és **TikTok Business API** hivatalos integrációkat használ a közösségi média adatok lekéréséhez, automatikus fallback scraping funkcióval, ha az API-k nem érhetők el.

## 📱 Instagram Graph API

### Előfeltételek

1. **Facebook Developer Account**: https://developers.facebook.com/
2. **Facebook App létrehozása**
3. **Instagram Business Account** (nem Personal Account!)
4. **Access Token generálása**

### Setup Lépések

#### 1. Facebook App Létrehozása

1. Látogass el: https://developers.facebook.com/apps/
2. Kattints **"Create App"** gombra
3. Válaszd ki: **"Business"** típust
4. Add meg az app nevét (pl. "Bewertigo Audit Tool")
5. Kapcsold be az **"Instagram Graph API"** funkciót

#### 2. Instagram Business Account Összekapcsolása

1. Menj az App Dashboard-ra
2. Válaszd: **Settings → Basic**
3. Add hozzá az **Instagram Business Account**-ot
4. A **Facebook Page**-et is össze kell kötni az Instagram fiókkal

#### 3. Access Token Generálása

**Rövid élettartamú token (60 nap)**:
1. Menj: **Tools → Graph API Explorer**
2. Válaszd ki az App-ot
3. Add meg a következő permissionöket:
   - `instagram_basic`
   - `pages_show_list`
   - `instagram_manage_insights`
4. Kattints **"Generate Access Token"**
5. Másold ki a tokent

**Hosszú élettartamú token (60 nap → Nem jár le)**:
```bash
curl -i -X GET "https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id={app-id}&client_secret={app-secret}&fb_exchange_token={short-lived-token}"
```

#### 4. Instagram Business Account ID Lekérése

```bash
curl -i -X GET "https://graph.facebook.com/v18.0/me/accounts?access_token={access-token}"
```

Majd használd a `page_id`-t:
```bash
curl -i -X GET "https://graph.facebook.com/v18.0/{page-id}?fields=instagram_business_account&access_token={access-token}"
```

#### 5. .env Fájl Beállítása

```env
INSTAGRAM_ACCESS_TOKEN=your_long_lived_access_token_here
INSTAGRAM_BUSINESS_ACCOUNT_ID=your_instagram_business_account_id
```

### API Végpontok Használata

**User adatok lekérése**:
```javascript
GET https://graph.facebook.com/v18.0/{ig-user-id}?fields=username,followers_count,media_count,biography&access_token={token}
```

**Recent media (posztok)**:
```javascript
GET https://graph.facebook.com/v18.0/{ig-user-id}/media?fields=id,caption,media_type,media_url,timestamp,like_count,comments_count,permalink&limit=10&access_token={token}
```

### Limitek és Költségek

- **Ingyenes**: 200 request/óra per app
- **Rate Limit**: 4800 request/óra (nagyobb alkalmazások)
- **Költség**: Teljesen ingyenes (Meta szolgáltatás)

### Fallback Logika

Ha az Instagram API nem érhető el (hiányzó token, API hiba, rate limit), a rendszer automatikusan **web scraping**-re vált:

1. Lekéri a `https://www.instagram.com/{username}/` oldalt
2. Kivonatolja a követők/posztok számát a meta tag-ekből
3. Korlátozott adatok (engagement rate nem elérhető)

**Fontos**: Az Instagram public profile scraping törékeny és változhat!

---

## 🎵 TikTok Business API

### Előfeltételek

1. **TikTok for Business Account**: https://business-api.tiktok.com/
2. **Developer Account** regisztráció
3. **App létrehozása** a TikTok Developer Portal-on
4. **API Access Token** generálása

### Setup Lépések

#### 1. TikTok Developer Account

1. Látogass el: https://developers.tiktok.com/
2. Regisztráció: **"Sign Up"** → **"TikTok for Business"**
3. Erősítsd meg az email címed
4. Töltsd ki a Company Information-t

#### 2. App Létrehozása

1. Dashboard: https://developers.tiktok.com/apps
2. Kattints: **"Create an App"**
3. Add meg:
   - App Name: "Bewertigo Audit Tool"
   - Industry: Marketing/Analytics
   - Use Case: "Business profile analysis"
4. Válaszd ki az API-kat:
   - ✅ User Info API
   - ✅ Video List API

#### 3. OAuth 2.0 Setup

**Authorization URL**:
```
https://business-api.tiktok.com/open_api/v1.2/oauth2/authorize/
```

**Paraméterek**:
- `client_key`: App ID
- `response_type`: code
- `scope`: user.info.basic,video.list
- `redirect_uri`: https://yourdomain.com/callback

**Access Token megszerzése**:
```bash
curl -X POST 'https://business-api.tiktok.com/open_api/v1.2/oauth2/access_token/' \
-H 'Content-Type: application/json' \
-d '{
  "client_key": "your_app_id",
  "client_secret": "your_app_secret",
  "code": "authorization_code",
  "grant_type": "authorization_code"
}'
```

#### 4. .env Fájl Beállítása

```env
TIKTOK_ACCESS_TOKEN=your_tiktok_access_token_here
TIKTOK_APP_ID=your_tiktok_app_id_here
```

### API Végpontok Használata

**User Info**:
```javascript
GET https://business-api.tiktok.com/open_api/v1.3/user/info/?open_id={open_id}&access_token={token}
```

**Video List**:
```javascript
POST https://business-api.tiktok.com/open_api/v1.3/video/list/
Headers: { "Access-Token": "{token}" }
Body: {
  "open_id": "{open_id}",
  "cursor": 0,
  "max_count": 10
}
```

### Limitek és Költségek

- **Ingyenes Tier**: 1,000 requests/nap
- **Business Tier**: 10,000 requests/nap (díjmentes)
- **Enterprise**: Custom quotas

### Fallback Logika

Ha a TikTok API nem elérhető, a rendszer **web scraping**-et használ:

1. Lekéri a `https://www.tiktok.com/@{username}` oldalt
2. Kivonatolja a `__UNIVERSAL_DATA_FOR_REHYDRATION__` JSON objektumot
3. Followers, video count, likes count adatok
4. Videók lista és engagement adatok nem érhetők el scraping-gel

**Megjegyzés**: TikTok scraping nehezebb mint Instagram, gyakran blokkolja a bot-okat!

---

## 🔄 Automatikus Fallback Működés

A rendszer intelligensen választ az API és scraping között:

```javascript
// Példa logika
if (instagramAccessToken && instagramBusinessId) {
    try {
        data = await fetchInstagramGraphAPI();
    } catch (error) {
        console.warn('API failed, using fallback');
        data = await scrapeInstagram();
    }
} else {
    console.log('No API credentials, using scraping');
    data = await scrapeInstagram();
}
```

### Előnyök

1. **Megbízhatóság**: Ha az API leáll, a scraping átveszi
2. **Költséghatékonyság**: API tokenek nélkül is működik (korlátozott adatokkal)
3. **Gyors fejlesztés**: Azonnal tesztelhető token nélkül

### Hátrányok

- **Scraping törékeny**: Instagram/TikTok változtathat az oldal struktúrán
- **Rate limiting**: Túl sok scraping request blokkolható
- **Kevesebb adat**: Engagement rate és részletes insights nem érhetők el

---

## 📊 Adatok Összehasonlítása

| Adat | Instagram API | Instagram Scraping | TikTok API | TikTok Scraping |
|------|--------------|-------------------|------------|-----------------|
| Followers | ✅ | ✅ | ✅ | ✅ |
| Post/Video Count | ✅ | ✅ | ✅ | ✅ |
| Recent Posts | ✅ (10-25) | ❌ | ✅ (10-20) | ❌ |
| Likes per Post | ✅ | ❌ | ✅ | ❌ |
| Comments | ✅ | ❌ | ✅ | ❌ |
| Engagement Rate | ✅ (Calculated) | ❌ | ✅ (Calculated) | ❌ |
| Last Post Date | ✅ | ❌ | ✅ | ❌ |
| Profile Bio | ✅ | ⚠️ (Limited) | ✅ | ⚠️ (Limited) |

---

## 🛠️ Tesztelés

### Instagram API Tesztelés

```bash
# User info
curl "https://graph.facebook.com/v18.0/17841400008460056?fields=username,followers_count,media_count&access_token=YOUR_TOKEN"

# Recent media
curl "https://graph.facebook.com/v18.0/17841400008460056/media?fields=id,caption,like_count&access_token=YOUR_TOKEN"
```

### TikTok API Tesztelés

```bash
# User info
curl -X GET "https://business-api.tiktok.com/open_api/v1.3/user/info/?open_id=USER_OPEN_ID" \
-H "Access-Token: YOUR_ACCESS_TOKEN"
```

### Bewertigo Rendszer Tesztelés

```bash
# Indítsd el a szervert
npm run dev

# Próbálj ki egy auditot a frontend-en
# Ha nincs API token, automatikusan scraping-et használ
```

---

## ⚠️ Fontos Megjegyzések

### Instagram API

- **Csak Business Account**: Personal account nem támogatott
- **Facebook Page kötelező**: Instagram Business-t össze kell kötni egy FB Page-dzsel
- **Token lejárat**: Hosszú élettartamú token ~60 nap múlva lejár, meg kell újítani
- **Rate Limit**: 200 req/óra (app-level), ne felejtsd monitorozni

### TikTok API

- **Open ID vs Username**: TikTok API `open_id`-t használ, nem `@username`-t
- **OAuth flow**: Felhasználói hozzájárulás szükséges (nem ideális audit tool-hoz)
- **Nehéz hozzáférés**: TikTok API access nem mindig public, jóváhagyás szükséges

### Ajánlás

**Production környezetben**:
1. Használd az **Instagram Graph API**-t (könnyebb setup)
2. **TikTok scraping**-re hagyatkozz (API hozzáférés nehéz)
3. Monitorozd a scraping sikerességét (Instagram változtathat struktúrán)
4. Implementálj **cache-t** a social media adatokra (48 óra)

**Development környezetben**:
- Scraping-gel kezdd (gyorsabb teszteléshez)
- API-t később add hozzá (production-ra)

---

## 📞 Hibakeresés

### "Instagram API Error: Invalid Access Token"

- Token lejárt → Generálj új hosszú élettartamú tokent
- Token scope hiányzik → Add meg: `instagram_basic`, `pages_show_list`
- Business Account ID rossz → Ellenőrizd a Graph API Explorer-ben

### "TikTok API Error: 403 Forbidden"

- Access token érvénytelen
- App nincs jóváhagyva → Kérd az approval-t a TikTok Developer Portal-on
- OAuth flow nem megfelelően implementálva

### "Scraping Failed: 429 Too Many Requests"

- Túl sok request → Implementálj rate limiting-et
- IP blokkolva → Használj proxy-t vagy VPN-t (nem ajánlott production-ban)
- User-Agent hiányzik → Add hozzá a request header-höz

### "No Data Found"

- Username rossz formátumban (Instagram: nincs @, TikTok: van @)
- Profil private → Csak public profilok támogatottak
- Profil nem létezik → Ellenőrizd manuálisan

---

## 🚀 Következő Lépések

1. ✅ Implementálva: Instagram Graph API + Fallback Scraping
2. ✅ Implementálva: TikTok Business API + Fallback Scraping
3. 🔜 Ajánlott: Cache implementálás social media adatokhoz
4. 🔜 Ajánlott: Webhook-ok token lejárat figyeléshez
5. 🔜 Opcionális: Third-party services (RapidAPI, Apify) fallback-nek

---

**Készítette**: Bewertigo Development Team  
**Verzió**: 1.0.0  
**Utolsó frissítés**: 2026. január 5.
