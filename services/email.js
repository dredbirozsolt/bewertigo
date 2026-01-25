const nodemailer = require('nodemailer');

class EmailService {
    constructor() {
        this.transporter = null;
        this.initTransporter();
    }

    /**
     * Initialize email transporter
     */
    initTransporter() {
        // Check if email configuration exists
        if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER) {
            console.warn('⚠️  Email configuration missing. Email sending will be disabled.');
            return;
        }

        this.transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: parseInt(process.env.EMAIL_PORT || '587'),
            secure: process.env.EMAIL_SECURE === 'true',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            }
        });

        // Verify connection
        this.transporter.verify((error, success) => {
            if (error) {
                console.error('❌ Email transporter verification failed:', error.message);
            } else {
                console.log('✅ Email service ready');
            }
        });
    }

    /**
     * Send audit report email with PDF attachment
     */
    async sendAuditReport(lead, audit, pdfPath) {
        if (!this.transporter) {
            console.error('Email service not configured');
            throw new Error('Email service not configured. Please set EMAIL_* environment variables.');
        }

        const mailOptions = {
            from: process.env.EMAIL_FROM || '"Bewertigo" <noreply@bewertigo.at>',
            to: lead.email,
            subject: `Ihr kostenloser Bewertigo Audit-Report - ${audit.businessName}`,
            html: this._generateEmailHTML(audit, lead),
            attachments: [
                {
                    filename: `Bewertigo_Audit_${audit.businessName.replace(/\s/g, '_')}.pdf`,
                    path: pdfPath
                }
            ]
        };

        try {
            const info = await this.transporter.sendMail(mailOptions);
            console.log(`✅ Email sent to ${lead.email}: ${info.messageId}`);
            return info;
        } catch (error) {
            console.error('Email sending failed:', error);
            throw error;
        }
    }

    /**
     * Generate email HTML content
     */
    _generateEmailHTML(audit, lead) {
        const calendarLink = `https://bewertigo.at/termin?company=${encodeURIComponent(audit.businessName)}`;
        const scoreColor = this._getScoreColor(audit.totalScore);
        const scoreLabel = this._getScoreLabel(audit.totalScore);

        return `
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ihr Bewertigo Audit-Report</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; background-color: #f9fafb;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Bewertigo</h1>
                            <p style="margin: 10px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 16px;">Ihr Audit-Report ist fertig!</p>
                        </td>
                    </tr>

                    <!-- Score Section -->
                    <tr>
                        <td style="padding: 40px 30px; text-align: center;">
                            <h2 style="margin: 0 0 10px 0; color: #1f2937; font-size: 20px;">${audit.businessName}</h2>
                            <p style="margin: 0 0 30px 0; color: #6b7280; font-size: 14px;">${audit.address}</p>
                            
                            <div style="display: inline-block; padding: 30px 50px; background: ${scoreColor}15; border-radius: 12px; margin-bottom: 20px;">
                                <div style="font-size: 48px; font-weight: 700; color: ${scoreColor}; margin-bottom: 5px;">${Math.round(audit.totalScore)}</div>
                                <div style="font-size: 14px; color: #6b7280;">von 100 Punkten</div>
                                <div style="font-size: 16px; font-weight: 600; color: ${scoreColor}; margin-top: 10px;">${scoreLabel}</div>
                            </div>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="padding: 0 30px 30px 30px; color: #374151; font-size: 15px; line-height: 1.6;">
                            <p style="margin: 0 0 15px 0;">Sehr geehrte Damen und Herren,</p>
                            
                            <p style="margin: 0 0 15px 0;">vielen Dank für Ihr Interesse an Bewertigo!</p>
                            
                            <p style="margin: 0 0 15px 0;">Im Anhang finden Sie Ihren persönlichen Audit-Report für <strong>${audit.businessName}</strong>.</p>
                            
                            <p style="margin: 0 0 15px 0;">Wir haben konkrete Verbesserungspotenziale identifiziert, die Ihre Online-Sichtbarkeit dramatisch steigern können:</p>
                            
                            <ul style="margin: 0 0 20px 0; padding-left: 25px; color: #374151;">
                                ${this._generateTopIssuesList(audit)}
                            </ul>
                        </td>
                    </tr>

                    <!-- Gift Section -->
                    <tr>
                        <td style="padding: 0 30px 30px 30px;">
                            <div style="background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); border-radius: 12px; padding: 25px; text-align: center;">
                                <div style="font-size: 24px; margin-bottom: 10px;">🎁</div>
                                <div style="color: #ffffff; font-size: 16px; font-weight: 600; margin-bottom: 8px;">Exklusives Geschenk</div>
                                <div style="color: #ffffff; font-size: 14px; line-height: 1.5;">
                                    Buchen Sie jetzt ein kostenloses Strategiegespräch und erhalten Sie ein<br>
                                    <strong>NFC Google-Bewertungs-Display (60€ Wert)</strong> gratis dazu!
                                </div>
                            </div>
                        </td>
                    </tr>

                    <!-- CTA Button -->
                    <tr>
                        <td style="padding: 0 30px 40px 30px; text-align: center;">
                            <a href="${calendarLink}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);">
                                Jetzt Termin sichern
                            </a>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px; background-color: #f9fafb; text-align: center; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 13px;">
                                Mit freundlichen Grüßen,<br>
                                <strong>Ihr Bewertigo Team</strong>
                            </p>
                            <p style="margin: 10px 0 0 0; color: #9ca3af; font-size: 12px;">
                                P.S.: Dieses Angebot ist zeitlich begrenzt. Sichern Sie sich jetzt Ihren Wettbewerbsvorteil!
                            </p>
                            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                                <p style="margin: 0; color: #9ca3af; font-size: 11px;">
                                    Bewertigo | <a href="https://bewertigo.at" style="color: #6366f1; text-decoration: none;">bewertigo.at</a> | office@bewertigo.at
                                </p>
                            </div>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `;
    }

    /**
     * Generate top issues list for email
     */
    _generateTopIssuesList(audit) {
        const topIssues = audit.topIssues?.slice(0, 3) || [];

        if (topIssues.length === 0) {
            return '<li>Detaillierte Analyse im PDF-Report</li>';
        }

        return topIssues.map(issue => {
            const moduleName = this._getModuleName(issue.module);
            return `<li><strong>${moduleName}:</strong> ${issue.message}</li>`;
        }).join('');
    }

    /**
     * Get module display name
     */
    _getModuleName(module) {
        const names = {
            googleBusinessProfile: 'Google Business Profile',
            reviewSentiment: 'Bewertungen & Antworten',
            websitePerformance: 'Website-Geschwindigkeit',
            mobileExperience: 'Mobile Benutzererfahrung',
            socialMediaPresence: 'Social Media Präsenz',
            competitorAnalysis: 'Wettbewerbsposition'
        };
        return names[module] || module;
    }

    /**
     * Get score color
     */
    _getScoreColor(score) {
        if (score >= 80) return '#10b981'; // Green
        if (score >= 60) return '#f59e0b'; // Yellow
        if (score >= 40) return '#f97316'; // Orange
        return '#ef4444'; // Red
    }

    /**
     * Get score label
     */
    _getScoreLabel(score) {
        if (score >= 80) return 'Ausgezeichnet';
        if (score >= 60) return 'Gut';
        if (score >= 40) return 'Verbesserungsbedarf';
        return 'Kritisch';
    }

    /**
     * Send test email
     */
    async sendTestEmail(to) {
        if (!this.transporter) {
            throw new Error('Email service not configured');
        }

        const mailOptions = {
            from: process.env.EMAIL_FROM || '"Bewertigo" <noreply@bewertigo.at>',
            to,
            subject: 'Bewertigo Test Email',
            html: '<p>Dies ist eine Test-Email. Ihr Email-Service ist korrekt konfiguriert!</p>'
        };

        return await this.transporter.sendMail(mailOptions);
    }
}

module.exports = new EmailService();
