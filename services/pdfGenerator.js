const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class PDFGeneratorService {
    constructor() {
        this.pdfDir = process.env.PDF_STORAGE_PATH || './pdfs';
        if (!fs.existsSync(this.pdfDir)) {
            fs.mkdirSync(this.pdfDir, { recursive: true });
        }
    }

    async generateAuditReport(audit, lead) {
        const sanitizedName = audit.businessName.replace(/[^a-zA-Z0-9]/g, '');
        const fileName = `audit_${sanitizedName}_${Date.now()}.pdf`;
        const filePath = path.join(this.pdfDir, fileName);

        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({
                    size: 'A4',
                    margins: { top: 50, bottom: 50, left: 50, right: 50 },
                    bufferPages: true
                });

                const stream = fs.createWriteStream(filePath);
                doc.pipe(stream);

                // Generate all pages
                this._generatePage1(doc, audit);
                this._generatePage2(doc, audit);
                this._generatePage3(doc, audit);
                this._generatePage4(doc, audit);

                doc.end();

                stream.on('finish', () => resolve({ filePath, fileName }));
                stream.on('error', (error) => reject(error));
            } catch (error) {
                reject(error);
            }
        });
    }

    // ============================================================================
    // PAGE 1: Overview + Scores + Top Issues + Competitor Chart
    // ============================================================================
    _generatePage1(doc, audit) {
        this._addHeader(doc, audit);
        const pageWidth = doc.page.width - 100;
        let yPos = 120;

        // Main Score Circle
        const centerX = doc.page.width / 2;
        this._drawLargeScoreCircle(doc, centerX, yPos + 60, audit.totalScore);

        const scoreLabel = this._getScoreLabel(audit.totalScore);
        const scoreColor = this._getScoreColor(audit.totalScore);

        doc.fontSize(16)
            .fillColor(scoreColor)
            .font('Helvetica-Bold')
            .text(scoreLabel, 50, yPos + 150, { width: pageWidth, align: 'center' });

        // 6 Modules Grid
        yPos = 250;
        doc.fontSize(13)
            .fillColor('#1f2937')
            .font('Helvetica-Bold')
            .text('Ihre 6 Erfolgssaulen', 50, yPos);

        const modules = [
            { name: 'Google Profil', key: 'googleBusinessProfile' },
            { name: 'Reviews', key: 'reviewSentiment' },
            { name: 'Website Speed', key: 'websitePerformance' },
            { name: 'Mobile UX', key: 'mobileExperience' },
            { name: 'Social Media', key: 'socialMediaPresence' },
            { name: 'Marktposition', key: 'competitorAnalysis' }
        ];

        yPos += 25;
        const cardWidth = (pageWidth - 30) / 2;
        const cardHeight = 50;

        modules.forEach((module, index) => {
            const xPos = index % 2 === 0 ? 50 : 50 + cardWidth + 30;
            if (index > 0 && index % 2 === 0) yPos += cardHeight + 10;
            const score = audit.scores?.[module.key]?.score || 0;
            this._drawPillarCard(doc, xPos, yPos, cardWidth, cardHeight, module, score);
        });

        // Top Issues Warning Box
        yPos += cardHeight + 20;
        this._drawWarningBox(doc, 50, yPos, pageWidth, audit);

        // Competitor Chart
        yPos += 120;
        if (yPos < 700) {
            doc.fontSize(11)
                .fillColor('#1f2937')
                .font('Helvetica-Bold')
                .text('Vergleich mit Ihrer Konkurrenz', 50, yPos);
            this._drawCompetitorChart(doc, 50, yPos + 18, pageWidth, audit);
        }
    }

    // ============================================================================
    // PAGE 2: Google Business Profile + Competitors List
    // ============================================================================
    _generatePage2(doc, audit) {
        doc.addPage();
        this._addHeader(doc, audit);
        const pageWidth = doc.page.width - 100;
        let yPos = 120;

        doc.fontSize(14)
            .fillColor('#1f2937')
            .font('Helvetica-Bold')
            .text('Google Business Profile', 50, yPos);

        yPos += 25;

        if (audit.rawData?.placeDetails) {
            const place = audit.rawData.placeDetails;
            const items = [
                { label: 'Name:', value: place.name || 'N/A' },
                { label: 'Typ:', value: place.businessType || 'N/A' },
                { label: 'Adresse:', value: place.address || 'N/A' },
                { label: 'Telefon:', value: place.phone || 'Nicht hinterlegt' },
                { label: 'Website:', value: place.website || 'Nicht hinterlegt' },
                { label: 'Bewertung:', value: place.rating ? `${place.rating} Sterne (${place.reviewCount || 0} Bewertungen)` : 'Keine' },
                { label: 'Offnungszeiten:', value: place.openingHours ? 'Hinterlegt' : 'Nicht hinterlegt' },
                { label: 'Fotos:', value: `${place.photoCount || 0} Bilder` }
            ];

            items.forEach(item => {
                doc.fontSize(9)
                    .fillColor('#1f2937')
                    .font('Helvetica-Bold')
                    .text(item.label, 50, yPos, { continued: true })
                    .font('Helvetica')
                    .text(' ' + item.value);
                yPos += 20;
            });
        }

        // Competitors List
        if (audit.rawData?.competitors?.length > 0) {
            yPos += 15;
            doc.fontSize(13)
                .fillColor('#1f2937')
                .font('Helvetica-Bold')
                .text('Ihre Konkurrenten', 50, yPos);

            yPos += 20;
            audit.rawData.competitors.slice(0, 12).forEach((comp, index) => {
                if (yPos > 720) {
                    doc.addPage();
                    this._addHeader(doc, audit);
                    yPos = 120;
                }

                doc.fontSize(9)
                    .fillColor('#1f2937')
                    .font('Helvetica-Bold')
                    .text(`${index + 1}. ${comp.name}`, 50, yPos);

                doc.fontSize(8)
                    .fillColor('#6b7280')
                    .font('Helvetica')
                    .text(`${comp.rating} Sterne (${comp.reviewCount} Bewertungen) - ${comp.distance} km`, 60, yPos + 11);

                yPos += 32;
            });
        }
    }

    // ============================================================================
    // PAGE 3: SEO + Website Performance + Social Media
    // ============================================================================
    _generatePage3(doc, audit) {
        doc.addPage();
        this._addHeader(doc, audit);
        const pageWidth = doc.page.width - 100;
        let yPos = 120;

        // SEO Analysis
        if (audit.rawData?.seoAnalysis && audit.rawData.seoAnalysis.score > 0) {
            const seo = audit.rawData.seoAnalysis;

            doc.fontSize(14)
                .fillColor('#1f2937')
                .font('Helvetica-Bold')
                .text('SEO & Website-Qualitat', 50, yPos);

            yPos += 22;

            doc.fontSize(10)
                .font('Helvetica')
                .text(`Score: ${seo.score}/100 - ${seo.score >= 70 ? 'Gut' : seo.score >= 40 ? 'Verbesserungsbedarf' : 'Kritisch'}`, 50, yPos);

            yPos += 20;

            // Issues
            if (seo.issues.length > 0) {
                doc.fontSize(11)
                    .fillColor('#ef4444')
                    .font('Helvetica-Bold')
                    .text('Kritische Probleme:', 50, yPos);

                yPos += 16;
                seo.issues.slice(0, 6).forEach(issue => {
                    doc.fontSize(8)
                        .fillColor('#1f2937')
                        .font('Helvetica')
                        .text(`- ${issue}`, 60, yPos, { width: pageWidth - 10 });
                    yPos += 15;
                });
            }

            yPos += 10;

            // Recommendations
            if (seo.recommendations.length > 0) {
                doc.fontSize(11)
                    .fillColor('#10b981')
                    .font('Helvetica-Bold')
                    .text('Empfehlungen:', 50, yPos);

                yPos += 16;
                seo.recommendations.slice(0, 6).forEach(rec => {
                    doc.fontSize(8)
                        .fillColor('#1f2937')
                        .font('Helvetica')
                        .text(`+ ${rec}`, 60, yPos, { width: pageWidth - 10 });
                    yPos += 15;
                });
            }

            yPos += 15;

            // Technical checks
            doc.fontSize(11)
                .fillColor('#1f2937')
                .font('Helvetica-Bold')
                .text('Technische Prufung:', 50, yPos);

            yPos += 16;

            const checks = [
                { label: 'HTTPS', value: seo.technical?.hasSSL },
                { label: 'Mobile-optimiert', value: seo.technical?.hasViewport },
                { label: 'Page Title', value: !!seo.metadata?.title },
                { label: 'Meta Description', value: !!seo.metadata?.description },
                { label: 'H1 Tag', value: seo.content?.h1Tags?.length === 1 },
                { label: 'Bilder Alt-Tags', value: seo.content?.imagesWithoutAlt === 0 }
            ];

            checks.forEach(check => {
                const symbol = check.value ? '✓' : '✗';
                const color = check.value ? '#10b981' : '#ef4444';
                doc.fontSize(8)
                    .fillColor(color)
                    .font('Helvetica-Bold')
                    .text(symbol, 60, yPos, { continued: true })
                    .fillColor('#1f2937')
                    .font('Helvetica')
                    .text(` ${check.label}`);
                yPos += 15;
            });
        }

        // Website Performance
        if (audit.rawData?.pageSpeedData) {
            const ps = audit.rawData.pageSpeedData;

            yPos += 15;
            doc.fontSize(13)
                .fillColor('#1f2937')
                .font('Helvetica-Bold')
                .text('Website Performance', 50, yPos);

            yPos += 20;

            if (ps.desktop?.metrics) {
                doc.fontSize(10)
                    .font('Helvetica-Bold')
                    .text('Desktop:', 50, yPos);
                yPos += 15;
                doc.fontSize(8)
                    .font('Helvetica')
                    .text(`LCP: ${ps.desktop.metrics.lcp?.toFixed(2)}s | FCP: ${ps.desktop.metrics.fcp?.toFixed(2)}s`, 60, yPos);
                yPos += 18;
            }

            if (ps.mobile?.metrics) {
                doc.fontSize(10)
                    .font('Helvetica-Bold')
                    .text('Mobile:', 50, yPos);
                yPos += 15;
                doc.fontSize(8)
                    .font('Helvetica')
                    .text(`LCP: ${ps.mobile.metrics.lcp?.toFixed(2)}s | CLS: ${ps.mobile.metrics.cls?.toFixed(3)}`, 60, yPos);
                yPos += 15;

                if (ps.mobile.checks) {
                    ['usesHttps', 'fontSizeOk', 'tapTargetsOk'].forEach(key => {
                        const labels = { usesHttps: 'HTTPS', fontSizeOk: 'Schriftgrosse', tapTargetsOk: 'Tap Targets' };
                        const value = ps.mobile.checks[key];
                        const symbol = value ? '✓' : '✗';
                        const color = value ? '#10b981' : '#ef4444';
                        doc.fontSize(8)
                            .fillColor(color)
                            .text(`${symbol} ${labels[key]}`, 70, yPos);
                        yPos += 13;
                    });
                }
            }
        }

        // Social Media
        if (audit.rawData?.socialProfiles) {
            const social = audit.rawData.socialProfiles;

            yPos += 15;
            doc.fontSize(13)
                .fillColor('#1f2937')
                .font('Helvetica-Bold')
                .text('Social Media Prasenz', 50, yPos);

            yPos += 20;

            ['facebook', 'instagram', 'tiktok'].forEach(platform => {
                if (social[platform]) {
                    doc.fontSize(9)
                        .fillColor('#1f2937')
                        .font('Helvetica-Bold')
                        .text(`${platform.charAt(0).toUpperCase() + platform.slice(1)}:`, 50, yPos, { continued: true });

                    const color = social[platform].exists ? '#10b981' : '#ef4444';
                    doc.fontSize(9)
                        .fillColor(color)
                        .font('Helvetica')
                        .text(` ${social[platform].exists ? 'Aktiv' : 'Nicht gefunden'}`);
                    yPos += 16;
                }
            });
        }
    }

    // ============================================================================
    // PAGE 4: Strategy + CTA
    // ============================================================================
    _generatePage4(doc, audit) {
        doc.addPage();
        this._addHeader(doc, audit);
        const pageWidth = doc.page.width - 100;
        let yPos = 120;

        doc.fontSize(16)
            .fillColor('#1f2937')
            .font('Helvetica-Bold')
            .text('Die Bewertigo Strategie', 50, yPos);

        doc.fontSize(10)
            .fillColor('#6b7280')
            .font('Helvetica')
            .text('So holen Sie Ihre Konkurrenz ein', 50, yPos + 22);

        yPos += 50;

        // Action Steps
        const solutions = this._generateSolutions(audit);

        solutions.slice(0, 4).forEach((solution, index) => {
            doc.roundedRect(50, yPos, pageWidth, 55, 5)
                .fillAndStroke('#f9fafb', '#e5e7eb');

            doc.circle(65, yPos + 27, 11)
                .fill('#6366f1');

            doc.fontSize(10)
                .fillColor('#ffffff')
                .font('Helvetica-Bold')
                .text((index + 1).toString(), 61, yPos + 21);

            doc.fontSize(10)
                .fillColor('#1f2937')
                .font('Helvetica-Bold')
                .text(solution.title, 85, yPos + 13, { width: pageWidth - 45 });

            doc.fontSize(8)
                .fillColor('#6b7280')
                .font('Helvetica')
                .text(solution.description, 85, yPos + 28, { width: pageWidth - 45 });

            yPos += 63;
        });

        // Industry Benchmark
        yPos += 10;
        doc.fontSize(12)
            .fillColor('#1f2937')
            .font('Helvetica-Bold')
            .text('Branchendurchschnitt', 50, yPos);

        yPos += 20;
        doc.roundedRect(50, yPos, pageWidth, 40, 5)
            .fillAndStroke('#fef3c7', '#f59e0b');

        const industryAvg = 72;
        const yourScore = Math.round(audit.totalScore || 0);
        const diff = yourScore - industryAvg;

        doc.fontSize(9)
            .fillColor('#78350f')
            .font('Helvetica')
            .text(`Durchschnitt: ${industryAvg}/100 | Ihr Score: ${yourScore}/100`, 60, yPos + 10);

        doc.fontSize(9)
            .font('Helvetica-Bold')
            .text(diff >= 0 ? `+${diff} Punkte uber Durchschnitt` : `${Math.abs(diff)} Punkte unter Durchschnitt`, 60, yPos + 24);

        // CTA
        yPos += 55;
        doc.roundedRect(50, yPos, pageWidth, 85, 8)
            .fillAndStroke('#eff6ff', '#3b82f6');

        doc.fontSize(13)
            .fillColor('#1e40af')
            .font('Helvetica-Bold')
            .text('Bereit fur die Transformation?', 60, yPos + 12, { width: pageWidth - 20, align: 'center' });

        doc.fontSize(9)
            .fillColor('#1f2937')
            .font('Helvetica')
            .text('Buchen Sie jetzt ein kostenloses Strategiegesprach', 60, yPos + 35, { width: pageWidth - 20, align: 'center' });

        doc.fontSize(9)
            .fillColor('#1f2937')
            .font('Helvetica-Bold')
            .text('+ NFC Google-Bewertungs-Display (60€ Wert)', 60, yPos + 55, { width: pageWidth - 20, align: 'center' });
    }

    // ============================================================================
    // HELPER FUNCTIONS
    // ============================================================================

    _addHeader(doc, audit) {
        doc.fontSize(13)
            .fillColor('#6366f1')
            .font('Helvetica-Bold')
            .text('BEWERTIGO', 50, 50);

        const date = new Date().toLocaleDateString('de-AT', { year: 'numeric', month: 'long', day: 'numeric' });
        doc.fontSize(8).fillColor('#6b7280').font('Helvetica').text(date, doc.page.width - 150, 50);

        doc.fontSize(14).fillColor('#1f2937').font('Helvetica-Bold').text(audit.businessName || '', 50, 73);
        doc.fontSize(8).fillColor('#6b7280').font('Helvetica').text(`${audit.city || ''} - ${audit.businessType || ''}`, 50, 91);
    }

    _drawWarningBox(doc, x, y, width, audit) {
        doc.roundedRect(x, y, width, 95, 7)
            .fillAndStroke('#fef2f2', '#ef4444');

        doc.fontSize(11)
            .fillColor('#dc2626')
            .font('Helvetica-Bold')
            .text('WARNUNG: Groesste Schwachstellen', x + 10, y + 10);

        const issues = this._getTop2Issues(audit);
        issues.forEach((issue, i) => {
            const iy = y + 30 + (i * 28);
            doc.fontSize(9).fillColor('#1f2937').font('Helvetica-Bold').text(`${i + 1}. ${issue.title}`, x + 10, iy, { width: width - 20 });
            doc.fontSize(7).fillColor('#991b1b').font('Helvetica').text(issue.estimatedLoss, x + 10, iy + 10, { width: width - 20 });
        });
    }

    _drawLargeScoreCircle(doc, x, y, score) {
        const radius = 55;
        doc.circle(x, y, radius).lineWidth(8).stroke('#e5e7eb');
        doc.circle(x, y, radius).lineWidth(8).strokeColor(this._getScoreColor(score)).stroke();
        doc.fontSize(32).fillColor('#1f2937').font('Helvetica-Bold').text(Math.round(score), x - 25, y - 16, { width: 50, align: 'center' });
        doc.fontSize(11).fillColor('#6b7280').font('Helvetica').text('/ 100', x - 20, y + 10, { width: 40, align: 'center' });
    }

    _drawPillarCard(doc, x, y, width, height, module, score) {
        doc.roundedRect(x, y, width, height, 5).fillAndStroke('#f9fafb', '#e5e7eb');

        const circleColor = this._getScoreColorForModule(score);
        doc.circle(x + 13, y + height / 2, 5).fill(circleColor);

        doc.fontSize(9).fillColor('#1f2937').font('Helvetica-Bold').text(module.name, x + 26, y + 19, { width: width - 65 });
        doc.fontSize(14).fillColor(circleColor).font('Helvetica-Bold').text(Math.round(score).toString(), x + width - 42, y + 14);
        doc.fontSize(7).fillColor('#6b7280').font('Helvetica').text('/16.6', x + width - 42, y + 30);
    }

    _drawCompetitorChart(doc, x, y, width, audit) {
        const competitors = audit.rawData?.placeDetails?.competitors || [];
        const data = [
            { name: 'Ihr Unternehmen', score: audit.totalScore || 0, color: '#6366f1' },
            ...competitors.slice(0, 3).map((c, i) => ({ name: c.name || `Konkurrent ${i + 1}`, score: c.rating ? c.rating * 20 : 0, color: '#94a3b8' }))
        ];

        const barHeight = 12;
        const maxBarWidth = width - 140;

        data.forEach((item, i) => {
            const by = y + (i * 28);
            const bw = Math.max((item.score / 100) * maxBarWidth, 3);

            doc.fontSize(8).fillColor('#1f2937').font('Helvetica').text(item.name.substring(0, 20), x, by, { width: 110 });
            doc.roundedRect(x + 120, by, bw, barHeight, 3).fill(item.color);
            doc.fontSize(9).fillColor('#1f2937').font('Helvetica-Bold').text(Math.round(item.score).toString(), x + 125 + bw, by - 1);
        });
    }

    _generateSolutions(audit) {
        const scores = audit.scores || {};
        const solutions = [];
        const map = {
            googleBusinessProfile: { title: 'Google Profil optimieren', description: 'Offnungszeiten, Telefon, Fotos hinzufugen (min. 10 Bilder).' },
            reviewSentiment: { title: 'Review-Management', description: 'Antworten Sie auf alle Bewertungen. QR-Code fur neue Reviews nutzen.' },
            websitePerformance: { title: 'Website beschleunigen', description: 'Bilder komprimieren, Caching aktivieren. Ziel: unter 2 Sekunden.' },
            mobileExperience: { title: 'Mobile-First', description: 'Click-to-Call Buttons, Touch-Elemente vergroessern.' },
            socialMediaPresence: { title: 'Social Media', description: '3x pro Woche posten: Behind-Scenes, Angebote, Kundenstimmen.' },
            competitorAnalysis: { title: 'Wettbewerbsvorteil', description: 'Top-3 Konkurrenten analysieren. Einzigartige Services bieten.' }
        };

        Object.entries(scores).sort((a, b) => a[1].score - b[1].score).forEach(([key, data]) => {
            if (map[key] && data.score < 13) solutions.push(map[key]);
        });

        if (solutions.length < 3) {
            solutions.push({ title: 'Online-Prasenz pflegen', description: 'Profile regelmaessig aktualisieren. Einheitliche Infos erhohen Vertrauen.' });
        }

        return solutions;
    }

    _getTop2Issues(audit) {
        const scores = audit.scores || {};
        const sorted = Object.entries(scores).sort((a, b) => a[1].score - b[1].score).slice(0, 2);
        const map = {
            googleBusinessProfile: { title: 'Unvollstandiges Google Profil', estimatedLoss: '70% uberspringen Profile ohne klare Infos.' },
            reviewSentiment: { title: 'Niedrige Bewertungen', estimatedLoss: '45% wahlen Konkurrenten mit besseren Reviews.' },
            websitePerformance: { title: 'Langsame Website', estimatedLoss: 'Jede Sekunde Verzogerung reduziert Conversion um 7%.' },
            mobileExperience: { title: 'Schlechte Mobile-UX', estimatedLoss: '80% der Suchen mobil - ohne Click-to-Call Verlust.' },
            socialMediaPresence: { title: 'Inaktive Social Media', estimatedLoss: 'Verpassen monatlich Tausende kostenlose Impressionen.' },
            competitorAnalysis: { title: 'Konkurrenz dominiert', estimatedLoss: 'Top-3 ziehen 3x mehr Aufmerksamkeit.' }
        };
        return sorted.map(([k]) => map[k] || { title: 'Verbesserungsbedarf', estimatedLoss: '' });
    }

    _getScoreColor(score) {
        if (score >= 80) return '#10b981';
        if (score >= 60) return '#f59e0b';
        if (score >= 40) return '#f97316';
        return '#ef4444';
    }

    _getScoreColorForModule(score) {
        if (score >= 13) return '#10b981';
        if (score >= 8) return '#f59e0b';
        return '#ef4444';
    }

    _getScoreLabel(score) {
        if (score >= 80) return 'Ausgezeichnet';
        if (score >= 60) return 'Gut';
        if (score >= 40) return 'Verbesserungsbedarf';
        return 'Kritisch';
    }

    async deletePDF(filePath) {
        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log(`PDF deleted: ${filePath}`);
            }
        } catch (error) {
            console.error('Error deleting PDF:', error);
        }
    }
}

module.exports = new PDFGeneratorService();

