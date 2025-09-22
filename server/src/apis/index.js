
const express = require('express');
const router = express.Router();

// Health check
router.use('/', require('./healthCheck'));

// v1 APIs
router.use('/v1/auth', require('./v1/auth'));
router.use('/v1/master', require('./v1/master'));

module.exports = router;