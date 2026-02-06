const express = require('express');
const router = express.Router();
const Lead = require('../models/Lead');
const Audit = require('../models/Audit');
const { validateEmail } = require('../utils/validation');
const pdfGenerator = require('../services/pdfGenerator');
const emailService = require('../services/email');

/**
 * POST /api/lead/capture
 * Capture lead email and unlock audit results
 */
router.post('/capture', async (req, res) => {
    try {
        const { auditId, email, gdprConsent } = req.body;

        // Validate required fields
        if (!auditId) {
            return res.status(400).json({
                success: false,
                message: 'Audit ID ist erforderlich'
            });
        }

        if (!gdprConsent) {
            return res.status(400).json({
                success: false,
                message: 'Bitte akzeptieren Sie die Datenschutzbestimmungen'
            });
        }

        // Validate email
        const emailValidation = validateEmail(email);
        if (!emailValidation.valid) {
            return res.status(400).json({
                success: false,
                message: emailValidation.message,
                suggestion: emailValidation.suggestion
            });
        }

        // Find audit
        const audit = await Audit.findByPk(auditId);
        if (!audit) {
            return res.status(404).json({
                success: false,
                message: 'Audit nicht gefunden'
            });
        }

        if (audit.status !== 'completed') {
            return res.status(400).json({
                success: false,
                message: 'Audit noch nicht abgeschlossen'
            });
        }

        // Check if lead already exists
        let lead = await Lead.findOne({ where: { email: emailValidation.email, auditId } });

        if (!lead) {
            // Create new lead
            lead = await Lead.create({
                email: emailValidation.email,
                auditId,
                businessName: audit.businessName,
                placeId: audit.placeId,
                totalScore: audit.totalScore,
                gdprConsent: true,
                gdprConsentDate: new Date(),
                ipAddress: req.ip,
                userAgent: req.get('User-Agent')
            });
        }

        // Unlock audit
        await audit.update({
            isUnlocked: true,
            leadEmail: emailValidation.email
        });

        // Generate and send PDF report
        generateAndSendPDF(audit, lead).catch(err => {
            console.error('PDF generation and email failed:', err);
        });

        res.json({
            success: true,
            message: 'Vielen Dank! Der vollständige Bericht wird an Ihre E-Mail gesendet.',
            audit: {
                id: audit.id,
                isUnlocked: true,
                scores: audit.scores,
                topIssues: audit.topIssues,
                rawData: audit.rawData // Include rawData for map
            }
        });

    } catch (error) {
        // Handle duplicate lead (same email + auditId)
        if (error.code === 11000 || error.name === 'SequelizeUniqueConstraintError') {
            // Still unlock the audit
            const audit = await Audit.findByPk(req.body.auditId);
            if (audit) {
                await audit.update({
                    isUnlocked: true,
                    leadEmail: req.body.email
                });
            }

            return res.json({
                success: true,
                message: 'Sie haben diesen Bericht bereits angefordert',
                audit: {
                    id: audit.id,
                    isUnlocked: true,
                    scores: audit.scores,
                    topIssues: audit.topIssues,
                    rawData: audit.rawData // Include rawData for map
                }
            });
        }

        console.error('Lead capture error:', error);
        res.status(500).json({
            success: false,
            message: 'Fehler beim Speichern der E-Mail',
            error: error.message
        });
    }
});

/**
 * POST /api/lead/manual-social
 * Allow user to manually add social media links if not found
 */
router.post('/manual-social', async (req, res) => {
    try {
        const { auditId, instagram, tiktok } = req.body;

        if (!auditId) {
            return res.status(400).json({
                success: false,
                message: 'Audit ID ist erforderlich'
            });
        }

        // const audit = await Audit.findByPk(auditId);
        const audit = null;
        if (!audit) {
            return res.status(404).json({
                success: false,
                message: 'Audit nicht gefunden'
            });
        }

        // Update social media data
        if (instagram) {
            audit.rawData.socialMedia = audit.rawData.socialMedia || {};
            audit.rawData.socialMedia.instagram = instagram;
            audit.rawData.socialMedia.sources = audit.rawData.socialMedia.sources || {};
            audit.rawData.socialMedia.sources.instagram = 'manual';
        }

        if (tiktok) {
            audit.rawData.socialMedia = audit.rawData.socialMedia || {};
            audit.rawData.socialMedia.tiktok = tiktok;
            audit.rawData.socialMedia.sources = audit.rawData.socialMedia.sources || {};
            audit.rawData.socialMedia.sources.tiktok = 'manual';
        }

        await audit.save();

        res.json({
            success: true,
            message: 'Social Media Profile aktualisiert'
        });

    } catch (error) {
        console.error('Manual social update error:', error);
        res.status(500).json({
            success: false,
            message: 'Fehler beim Aktualisieren',
            error: error.message
        });
    }
});

/**
 * Generate PDF and send via email
 */
async function generateAndSendPDF(audit, lead) {
    try {
        console.log(`Generating PDF report for ${audit.businessName}`);

        // Generate PDF
        const { filePath } = await pdfGenerator.generateAuditReport(audit, lead);
        console.log(`✅ PDF generated: ${filePath}`);

        // Send email with PDF attachment
        await emailService.sendAuditReport(lead, audit, filePath);
        console.log(`✅ Email sent to ${lead.email}`);

        // Update lead with PDF sent status
        await lead.update({
            pdfSent: true,
            pdfSentAt: new Date()
        });

        // Delete PDF file after sending
        await pdfGenerator.deletePDF(filePath);

    } catch (error) {
        console.error('PDF generation and email error:', error.message);
        // Don't throw - we don't want to fail the lead capture if PDF fails
    }
}

module.exports = router;
