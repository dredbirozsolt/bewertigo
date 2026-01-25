# 📱 Social Media Scraping - Hogyan Működik?

## 🎯 Válasz: NINCS Bejelentkezés Szükséges!

**Kérdés:** Ahhoz, hogy egy étterem Instagram profilját vizsgáljam, az étteremnek be kell lépnie?

**Válasz:** **NEM!** A Bewertigo **web scraping**-et használ, amely publikus adatokat gyűjt - nincs szükség bejelentkezésre vagy engedélyre! 🎉

---

## 🔍 Hogyan Működik A Rendszer?

### 1. Automatikus Profil Felderítés

#### Lépés 1: Website Scraping
```javascript
// A rendszer megnézi a vállalkozás weboldalát
URL: https://cafecentralwien.at

// Keres Instagram linkeket
<a href="https://instagram.com/cafecentralwien">

// Kinyeri a username-t: "cafecentralwien"
```

#### Lépés 2: Instagram Scraping
```javascript
// Lekéri a publikus Instagram profilt
URL: https://www.instagram.com/cafecentralwien/

// Kivonatolja az adatokat a meta tag-ekből
<meta property="og:description" content="1.2K Followers, 234 Posts - ..." />

// Eredmény:
{
  username: "cafecentralwien",
  followers: 1200,
  posts: 234,
  isActive: true
}
```

#### Lépés 3: TikTok Scraping (Ha van)
```javascript
// Lekéri a publikus TikTok profilt
URL: https://www.tiktok.com/@cafecentralwien

// Kivonatolja az adatokat az embedded JSON-ból
window['__UNIVERSAL_DATA_FOR_REHYDRATION__']

// Eredmény:
{
  username: "cafecentralwien",
  followers: 850,
  videos: 45,
  likes: 12500
}
```

---

## 📊 Mit Tud A Rendszer?

### ✅ Instagram Publikus Adatok

| Adat | Elérhető? | Forrás |
|------|-----------|--------|
| **Username** | ✅ | URL |
| **Followers** | ✅ | Meta tag |
| **Post Count** | ✅ | Meta tag |
| **Profile Picture** | ✅ | OG:image |
| **Bio** | ⚠️ | Limited |
| **Recent Posts** | ❌ | Login required |
| **Likes per Post** | ❌ | Login required |
| **Comments** | ❌ | Login required |
| **Engagement Rate** | ❌ | Requires posts data |

### ✅ TikTok Publikus Adatok

| Adat | Elérhető? | Forrás |
|------|-----------|--------|
| **Username** | ✅ | URL |
| **Followers** | ✅ | JSON embed |
| **Video Count** | ✅ | JSON embed |
| **Total Likes** | ✅ | JSON embed |
| **Recent Videos** | ❌ | Complex scraping |
| **Views per Video** | ❌ | Login required |
| **Comments** | ❌ | Login required |

---

## 🎯 Pontozási Logika

### Instagram Module (8.3 pont)

```javascript
// Elérhetőség (4.15 pont)
if (instagramProfile found) {
  +4.15 pont
} else {
  0 pont
  Issue: "Keine Instagram-Präsenz"
}

// Követők (4.15 pont)
if (followers >= 1000) {
  +4.15 pont
} else if (followers >= 500) {
  +2.5 pont
} else if (followers >= 100) {
  +1.5 pont
} else {
  0 pont
  Issue: "Geringe Follower-Zahl (unter 100)"
}
```

### TikTok Module (8.3 pont)

```javascript
// Elérhetőség (4.15 pont)
if (tiktokProfile found) {
  +4.15 pont
} else {
  0 pont
  Issue: "Keine TikTok-Präsenz"
}

// Engagement (4.15 pont)
if (followers > 1000 && videos > 10) {
  +4.15 pont
} else if (followers > 500) {
  +2.5 pont
} else {
  +1 pont
  Issue: "Geringe TikTok Aktivität"
}
```

---

## 🚀 Példa Audit Folyamat

### Input:
```
Business: "Café Central Wien"
Website: https://cafecentralwien.at
```

### 1. Website Scraping (5 sec)
```
✅ Instagram link found: @cafecentralwien
✅ TikTok link found: @cafecentralwien
```

### 2. Instagram Scraping (3 sec)
```
GET https://www.instagram.com/cafecentralwien/

✅ Followers: 1,234
✅ Posts: 456
✅ Active: Yes
```

### 3. TikTok Scraping (3 sec)
```
GET https://www.tiktok.com/@cafecentralwien

✅ Followers: 890
✅ Videos: 67
✅ Likes: 15,600
```

### 4. Scoring (instant)
```
Instagram Module:
  - Profile exists: +4.15
  - Followers (1234): +4.15
  Total: 8.3/8.3 ✅

TikTok Module:
  - Profile exists: +4.15
  - Engagement good: +4.15
  Total: 8.3/8.3 ✅

Social Media Total: 16.6/16.6 🎉
```

---

## ⚙️ Technikai Részletek

### Instagram Scraping Kód

```javascript
async _getInstagramData(username) {
  // 1. Lekérjük a publikus profilt
  const response = await axios.get(
    `https://www.instagram.com/${username}/`,
    {
      headers: {
        'User-Agent': 'Mozilla/5.0 ...'
      }
    }
  );

  // 2. Parse-oljuk a HTML-t
  const $ = cheerio.load(response.data);

  // 3. Kivonatolás meta tag-ekből
  const metaDescription = $('meta[property="og:description"]').attr('content');
  const followersMatch = metaDescription.match(/([\\d,\\.]+[KMB]?)\\s+Followers/i);
  
  // 4. Számok feldolgozása (K, M, B suffix-ekkel)
  const followers = parseCount(followersMatch[1]); // "1.2K" → 1200

  return {
    username,
    followers,
    source: 'web_scraping'
  };
}
```

### TikTok Scraping Kód

```javascript
async _getTikTokData(username) {
  // 1. Lekérjük a publikus profilt
  const response = await axios.get(
    `https://www.tiktok.com/@${username}`
  );

  const $ = cheerio.load(response.data);

  // 2. Keresünk JSON data-t a script tag-ekben
  $('script').each((i, elem) => {
    const scriptContent = $(elem).html();
    if (scriptContent.includes('__UNIVERSAL_DATA_FOR_REHYDRATION__')) {
      const jsonMatch = scriptContent.match(/window\\['__UNIVERSAL_DATA_FOR_REHYDRATION__'\\]\\s*=\\s*(\\{.*?\\});/);
      const data = JSON.parse(jsonMatch[1]);
      
      // 3. Adatok kinyerése
      const stats = data['__DEFAULT_SCOPE__']['webapp.user-detail'].userInfo.stats;
      
      return {
        followers: stats.followerCount,
        videos: stats.videoCount,
        likes: stats.heartCount
      };
    }
  });
}
```

---

## 🛡️ Limitációk & Megoldások

### Problem 1: Instagram Változtat A Struktúrán

**Jelenlegi Helyzet:**
```javascript
// Most így működik:
<meta property="og:description" content="1.2K Followers, 234 Posts..." />
```

**Ha Instagram változtat:**
```javascript
// Fallback megoldások:
1. JSON-LD structured data
2. Script tag-ek parse-olása
3. API fallback (RapidAPI)
```

### Problem 2: Rate Limiting

**Probléma:** Túl sok kérés → IP blokkolva

**Megoldás:**
```javascript
// 48 órás cache
if (cachedData && age < 48h) {
  return cachedData; // Nincs új request
}

// Rate limiting
await delay(Math.random() * 2000); // Random delay
```

### Problem 3: Bot Detection

**Probléma:** Instagram/TikTok észleli a bot-ot

**Megoldás:**
```javascript
headers: {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ...',
  'Accept': 'text/html,application/xhtml+xml,...',
  'Accept-Language': 'en-US,en;q=0.5',
  'Referer': 'https://www.google.com/',
  'DNT': '1'
}
```

---

## 📈 Fejlesztési Lehetőségek

### Opció 1: RapidAPI Integration

**Instagram Data API:**
- URL: https://rapidapi.com/restyler/api/instagram-data1
- Költség: $0-20/hó (1000-5000 requests)
- Adatok: Followers, posts, engagement, recent posts
- Setup: Egyszerű API key

```javascript
const response = await axios.get('https://instagram-data1.p.rapidapi.com/user/info', {
  params: { username: 'cafecentralwien' },
  headers: {
    'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
    'X-RapidAPI-Host': 'instagram-data1.p.rapidapi.com'
  }
});
```

### Opció 2: Apify Scrapers

**Instagram Profile Scraper:**
- URL: https://apify.com/apify/instagram-scraper
- Költség: $0-49/hó
- Részletes adatok: Posts, likes, comments, hashtags

```javascript
const ApifyClient = require('apify-client');
const client = new ApifyClient({ token: process.env.APIFY_TOKEN });

const run = await client.actor('apify/instagram-scraper').call({
  usernames: ['cafecentralwien'],
  resultsLimit: 10
});
```

### Opció 3: Hybrid Approach

```javascript
// 1. Próbáld scraping-gel
try {
  data = await scrapeInstagram(username);
  if (data.followers > 0) return data;
} catch (error) {
  console.log('Scraping failed');
}

// 2. Fallback RapidAPI-ra
try {
  data = await rapidApiInstagram(username);
  return data;
} catch (error) {
  console.log('RapidAPI failed');
}

// 3. Return limited data
return { username, followers: 0, note: 'Could not fetch data' };
```

---

## ✅ VÉGSŐ VÁLASZ

### Kérdés:
> "Ahhoz hogy egy étterem instáját vizsgáljam, ahhoz az étteremnek be kell lépnie?"

### Válasz:

**NEM! Egyáltalán nem! 🎉**

A Bewertigo:
- ✅ Automatikusan megkeresi az Instagram/TikTok profilt
- ✅ Publikus adatokat gyűjt (followers, posts)
- ✅ Nincs bejelentkezés
- ✅ Nincs engedélykérés
- ✅ Teljesen automatizált
- ✅ 90 másodperc alatt kész

**Az étteremnek semmit nem kell csinálnia!** A rendszer mindent automatikusan elvégez. 🚀

---

**Készítette:** Bewertigo Development Team  
**Dátum:** 2026. január 5.  
**Státusz:** ✅ Production Ready
