require('dotenv').config();

module.exports = {
    client: 'pg',
    connection: {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
    },
    migrations: {
        directory: './migrations',
    },
    seeds: {
        directory: './seeds',
    },
};

