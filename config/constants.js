// Industry Benchmark Averages (Static values until we have 100+ audits per category)
const INDUSTRY_BENCHMARKS = {
    'restaurant': 75,
    'cafe': 72,
    'bar': 70,
    'barber_shop': 72,
    'hair_care': 72,
    'beauty_salon': 74,
    'spa': 76,
    'gym': 71,
    'hotel': 78,
    'retail': 68,
    'default': 70
};

// Scoring Weights (each module = 16.6 points, total = ~100)
const SCORING_WEIGHTS = {
    googleBusinessProfile: 16.6,
    reviewSentiment: 16.6,
    websitePerformance: 16.6,
    mobileExperience: 16.6,
    socialMediaPresence: 16.6,
    competitorAnalysis: 16.6
};

// Scoring Thresholds
const THRESHOLDS = {
    // Google Business Profile
    descriptionMinLength: 250,

    // Reviews
    excellentRating: 4.5,
    goodRating: 4.0,
    fairRating: 3.5,
    excellentResponseRate: 0.9,
    goodResponseRate: 0.5,

    // PageSpeed (Desktop)
    desktopLcpExcellent: 1.2,
    desktopLcpGood: 2.5,

    // PageSpeed (Mobile)
    mobileLcpExcellent: 2.5,
    mobileLcpGood: 4.0,

    // Social Media
    minFollowers: 1000,
    engagementRate: 0.2, // 20% of followers
    inactivityDays: 30,

    // Photos
    minPhotos: 5
};

// Category CTAs based on business type
const CATEGORY_CTAS = {
    'restaurant': [
        'bewertigo.at/googlebewertungen',
        'bewertigo.at/website',
        'bewertigo.at/digitalmenu',
        'bewertigo.at/ki-telefonassistent'
    ],
    'barber_shop': [
        'bewertigo.at/googlebewertungen',
        'bewertigo.at/website',
        'bewertigo.at/ki-telefonassistent'
    ],
    'hair_care': [
        'bewertigo.at/googlebewertungen',
        'bewertigo.at/website',
        'bewertigo.at/ki-telefonassistent'
    ],
    'beauty_salon': [
        'bewertigo.at/googlebewertungen',
        'bewertigo.at/website',
        'bewertigo.at/ki-telefonassistent'
    ],
    'personal_brand': [
        'bewertigo.at/visitenkarte',
        'bewertigo.at/instagram-promotion'
    ],
    'default': [
        'bewertigo.at/googlebewertungen',
        'bewertigo.at/website'
    ]
};

// Estimated Loss Messages (German)
const ESTIMATED_LOSS_MESSAGES = {
    googleBusinessProfile: "Unvollständige Profile wirken unprofessionell. Studien zeigen, dass 70% der Kunden Unternehmen ohne hinterlegte Website oder klare Öffnungszeiten sofort überspringen und zur Konkurrenz gehen.",

    reviewSentiment: "Da Ihre Bewertung unter 4.5 Sternen liegt oder viele Rezensionen unbeantwortet sind, wählen laut Statistik bis zu 45% der potenziellen Kunden lieber einen Mitbewerber in Ihrer Nähe, der aktiver auf Feedback reagiert.",

    websitePerformance: "Jede Sekunde Verzögerung reduziert Ihre Conversion-Rate um 7%. Bei Ihrer aktuellen Ladezeit verlassen frustrierte Besucher Ihre Seite, noch bevor sie Ihr Angebot überhaupt gesehen haben.",

    mobileExperience: "80% der lokalen Suchen erfolgen mobil. Ohne eine 'Click-to-Call' Funktion verlieren Sie Kunden genau in dem Moment, in dem sie bereit sind, bei Ihnen zu kaufen oder zu buchen.",

    socialMediaPresence: "Ein inaktiver Social-Media-Kanal wirkt wie ein geschlossenes Geschäft. Sie verpassen monatlich Tausende von kostenlosen Impressionen und den Kontakt zu Ihrer Zielgruppe.",

    competitorAnalysis: "Ihre Top-3 Konkurrenten ziehen aktuell 3-mal mehr Aufmerksamkeit auf sich als Sie. Ohne sofortige Korrektur festigt sich dieser Marktanteilsverlust dauerhaft zu Ihren Ungunsten."
};

// Issue-specific impact messages - map keywords to specific impacts
const ISSUE_IMPACT_MAP = {
    // Mobile issues
    'Mobile Geschwindigkeit konnte nicht': 'Ohne messbare Ladezeit können Sie nicht optimieren. Ihre mobilen Besucher verlassen frustriert Ihre Seite und wechseln zur Konkurrenz.',
    'Kritische Mobile Ladezeit': 'Jede Sekunde über 3s kostet Sie 50% Ihrer mobilen Besucher. Bei mobilen Suchen ist Geschwindigkeit der wichtigste Ranking-Faktor.',
    'Keine HTTPS Verschlüsselung': 'Browser warnen Besucher vor unsicheren Seiten. 84% verlassen sofort eine Website mit Sicherheitswarnung. Google straft HTTP-Seiten im Ranking ab.',
    'Instabile Seitenlayout': 'Springende Elemente beim Laden frustrieren Nutzer massiv. Google bestraft instabile Layouts mit schlechteren Rankings - Sie verlieren Sichtbarkeit.',
    'Schrift zu klein': 'Unleserliche Texte auf Smartphones zwingen 68% der Besucher zum sofortigen Verlassen. Ihre Botschaft kommt nie an.',
    'Buttons zu klein': 'Zu kleine Klickflächen führen zu Fehltipps und Frust. 73% der mobilen Nutzer brechen ab, wenn sie Buttons nicht präzise treffen können.',
    'Fehlende Click-to-Call': '80% der mobilen Suchen erfolgen mit Kaufabsicht. Ohne Click-to-Call-Button verlieren Sie Kunden im entscheidenden Moment - ein Tap zur Konkurrenz.',
    'Keine Website': 'Ohne Website können Kunden Ihr Angebot nicht online prüfen. Sie verlieren 92% der Research-Phase und damit das Vertrauen potentieller Kunden.',

    // Website performance
    'Desktop Ladezeit': 'Langsame Desktop-Ladezeiten kosten Conversions. Jede Sekunde Verzögerung reduziert Ihre Abschlussrate um 7% - verlorener Umsatz.',
    'Kritische Desktop Ladezeit': 'Bei über 4 Sekunden Ladezeit verlassen 75% Ihrer Besucher die Seite vor dem ersten Inhalt. Verschenktes Marketing-Budget.',

    // Reviews
    'Durchschnittsbewertung unter': 'Bewertungen unter 4.3 Sternen wirken abschreckend. 86% der Konsumenten meiden Unternehmen mit niedrigen Ratings - direkt zur Konkurrenz.',
    'unbeantwortet': 'Unbeantwortete Bewertungen signalisieren Gleichgültigkeit. Potenzielle Kunden interpretieren Ihr Schweigen als mangelnde Kundenorientierung.',
    'Keine Bewertungen': 'Ohne Bewertungen fehlt Social Proof. 93% der Kunden vertrauen Bewertungen wie persönlichen Empfehlungen - Sie starten ohne Vertrauen.',

    // Google Business Profile
    'Keine Website hinterlegt': 'Profile ohne Website-Link verlieren 67% der interessierten Klicks. Google zeigt Sie seltener an, wenn Profil-Informationen fehlen.',
    'Fehlende Öffnungszeiten': 'Kunden erwarten sofort erkennbare Öffnungszeiten. 58% wählen ein Geschäft mit vollständigen Öffnungszeiten gegenüber unklaren Angaben.',
    'Keine Telefonnummer': 'Ohne Telefonnummer verlieren Sie spontane Anfragen. 40% der lokalen Suchen enden in einem Anruf innerhalb von 24 Stunden.',
    'Wenige oder keine Fotos': 'Unternehmen mit Fotos erhalten 42% mehr Anfragen nach Wegbeschreibungen und 35% mehr Klicks auf ihre Website.',

    // Social Media
    'Kein Facebook Profil': 'Über 2 Mrd. Menschen nutzen Facebook monatlich. Ohne Präsenz verpassen Sie kostenlosen Zugang zu Ihrer lokalen Community.',
    'Kein Instagram Profil': 'Instagram-Nutzer haben 70% höhere Kaufkraft. Besonders bei visuellen Branchen verlieren Sie hochwertige Leads.',
    'Instagram seit': 'Inaktive Profile wirken wie geschlossene Geschäfte. Follower verlieren das Interesse - Ihre Marke gerät in Vergessenheit.',
    'Facebook seit': 'Veraltete Inhalte schaden Ihrem Image. Kunden zweifeln an Ihrer Aktualität und Erreichbarkeit - Vertrauensverlust.',

    // Review Response Rate
    'Ihre Konkurrenten antworten': 'Kunden vergleichen aktiv! Wenn Ihre Konkurrenz auf Bewertungen reagiert und Sie nicht, wirken Sie desinteressiert. Das kostet Neukunden.',
    'Antwortrate': 'Unbeantwortete Bewertungen signalisieren mangelnde Wertschätzung. 70% der Kunden erwarten eine Antwort - Ihr Schweigen treibt sie zur Konkurrenz.',
    'unbeantwortet': 'Google bevorzugt Unternehmen mit hoher Interaktionsrate im Ranking. Jede unbeantwortete Bewertung schadet Ihrer Sichtbarkeit.',

    // Photo Competition
    'Ihre Konkurrenten haben durchschnittlich': 'Mehr Fotos = mehr Vertrauen = mehr Klicks. Businesses mit 100+ Fotos erhalten 520% mehr Anrufe als solche mit wenigen Bildern.',
    'Konkurrenten haben durchschnittlich': 'Visuelle Präsenz entscheidet in Sekunden. Kunden wählen Profile mit vielen authentischen Fotos - Ihre Konkurrenz gewinnt den ersten Eindruck.',
    'mehr Fotos': 'Jedes zusätzliche Foto erhöht Ihre Chance auf Klicks um 3%. Ihre Konkurrenz nutzt das aus - Sie fallen visuell zurück.',

    // Competitor
    'Konkurrent': 'Ihre Wettbewerber haben bessere Online-Präsenz und höhere Rankings. Sie verlieren systematisch Marktanteile an sichtbarere Konkurrenten.',
    'durchschnittlich': 'Unterdurchschnittliche Performance bedeutet weniger Klicks, weniger Anfragen, weniger Umsatz. Ihre Konkurrenten profitieren von Ihrer Schwäche.'
};

// Cache TTL
const CACHE_TTL = 48 * 60 * 60; // 48 hours in seconds

// Retry Configuration
const RETRY_CONFIG = {
    maxRetries: 2,
    retryDelay: 30000, // 30 seconds
    timeout: 30000 // 30 seconds
};

module.exports = {
    INDUSTRY_BENCHMARKS,
    SCORING_WEIGHTS,
    THRESHOLDS,
    CATEGORY_CTAS,
    ESTIMATED_LOSS_MESSAGES,
    ISSUE_IMPACT_MAP,
    CACHE_TTL,
    RETRY_CONFIG
};
