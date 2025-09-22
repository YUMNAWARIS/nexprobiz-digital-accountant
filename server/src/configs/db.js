const knex = require('knex');
const knexConfig = require('../../knexFile');

// Initialize knex with environment configuration
const environment = process.env.NODE_ENV || 'development';
const db = knex(knexConfig);

module.exports = db;


