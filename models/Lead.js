const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Lead = sequelize.define('Lead', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: { isEmail: true }
    },
    auditId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'audits',
            key: 'id'
        }
    },
    businessName: DataTypes.STRING(255),
    placeId: DataTypes.STRING(255),
    totalScore: DataTypes.DECIMAL(5, 2),

    // GDPR Consent
    gdprConsent: {
        type: DataTypes.BOOLEAN,
        allowNull: false
    },
    gdprConsentDate: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },

    // PDF sent status
    pdfSent: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    pdfSentAt: DataTypes.DATE,

    // Source tracking
    source: {
        type: DataTypes.STRING(50),
        defaultValue: 'audit-tool'
    },
    ipAddress: DataTypes.STRING(45),
    userAgent: DataTypes.STRING(500)
}, {
    tableName: 'leads',
    timestamps: true,
    indexes: [
        { fields: ['email'] },
        { fields: ['auditId'] },
        { unique: true, fields: ['email', 'auditId'] }
    ]
});

module.exports = Lead;
