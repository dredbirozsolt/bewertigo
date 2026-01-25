const { Sequelize } = require('sequelize');

// First connect without database to create it
const createDatabase = async () => {
    const tempSequelize = new Sequelize(
        '',
        process.env.DB_USER || 'root',
        process.env.DB_PASSWORD || '',
        {
            host: process.env.DB_HOST || 'localhost',
            dialect: 'mysql',
            logging: false
        }
    );

    try {
        await tempSequelize.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'bewertigo'}\`;`);
        console.log(`✅ Datenbank '${process.env.DB_NAME || 'bewertigo'}' existiert`);
    } catch (error) {
        console.error('Database creation error:', error.message);
    } finally {
        await tempSequelize.close();
    }
};

const sequelize = new Sequelize(
    process.env.DB_NAME || 'bewertigo',
    process.env.DB_USER || 'root',
    process.env.DB_PASSWORD || '',
    {
        host: process.env.DB_HOST || 'localhost',
        dialect: 'mysql',
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    }
);

const connectDB = async () => {
    try {
        // Create database if doesn't exist
        await createDatabase();

        // Connect to database
        await sequelize.authenticate();
        console.log('✅ MySQL verbunden');

        // Sync models (create tables if not exist)
        if (process.env.NODE_ENV === 'development') {
            await sequelize.sync({ alter: true });
            console.log('✅ Datenbank-Tabellen synchronisiert');
        }
    } catch (error) {
        console.error('❌ MySQL Verbindungsfehler:', error.message);
        process.exit(1);
    }
};

module.exports = { connectDB, sequelize };
