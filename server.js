require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { connectDB } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            ...helmet.contentSecurityPolicy.getDefaultDirectives(),
            "script-src": ["'self'", "'unsafe-inline'", "https://maps.googleapis.com"],
            "img-src": ["'self'", "data:", "https://maps.googleapis.com", "https://maps.gstatic.com", "https://lh3.googleusercontent.com"],
            "connect-src": ["'self'", "https://maps.googleapis.com"],
            "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            "font-src": ["'self'", "https://fonts.gstatic.com"]
        }
    }
}));
app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.API_RATE_LIMIT || 100,
    message: 'Zu viele Anfragen von dieser IP, bitte versuchen Sie es später erneut.'
});
app.use('/api/', limiter);

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static('public'));

// Database connection
connectDB();

// Routes
app.use('/api/audit', require('./routes/audit'));
app.use('/api/lead', require('./routes/lead'));
app.use('/api/config', require('./routes/config'));
app.use('/api/photo', require('./routes/photo'));

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Interner Serverfehler',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint nicht gefunden'
    });
});

// Start server
const server = app.listen(PORT, () => {
    console.log(`🚀 Bewertigo Audit Server läuft auf Port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
});

// Graceful shutdown - Close Puppeteer browser
const screenshotService = require('./services/screenshot');

process.on('SIGTERM', async () => {
    console.log('SIGTERM signal received: closing HTTP server and browser');
    await screenshotService.closeBrowser();
    server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
    });
});

process.on('SIGINT', async () => {
    console.log('SIGINT signal received: closing HTTP server and browser');
    await screenshotService.closeBrowser();
    server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
    });
});

module.exports = app;
