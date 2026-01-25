const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Audit = sequelize.define('Audit', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    placeId: {
        type: DataTypes.STRING(255),
        allowNull: false,
        index: true
    },
    businessName: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    businessType: DataTypes.STRING(100),
    address: DataTypes.STRING(500),
    city: DataTypes.STRING(100),

    // Overall Score
    totalScore: {
        type: DataTypes.DECIMAL(5, 2),
        validate: { min: 0, max: 100 }
    },

    // Module Scores (stored as JSON)
    scores: {
        type: DataTypes.JSON,
        defaultValue: {}
    },

    // Top Issues (for PDF)
    topIssues: {
        type: DataTypes.JSON,
        defaultValue: []
    },

    // Industry Benchmark
    industryBenchmark: {
        type: DataTypes.JSON,
        defaultValue: {}
    },

    // Raw API Data (for debugging)
    rawData: {
        type: DataTypes.JSON,
        defaultValue: {}
    },

    // Status
    status: {
        type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed'),
        defaultValue: 'pending'
    },

    // Processing progress (for real-time updates)
    progress: {
        type: DataTypes.JSON,
        defaultValue: { current: 0, total: 7, currentStep: '' }
    },

    // Lead info (after unlock)
    leadEmail: DataTypes.STRING(255),
    isUnlocked: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },

    completedAt: DataTypes.DATE
}, {
    tableName: 'audits',
    timestamps: true,
    indexes: [
        { fields: ['placeId'] },
        { fields: ['status'] },
        { fields: ['createdAt'] }
    ]
});

module.exports = Audit;
