const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

function generateToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function verifyToken(token) {
    return jwt.verify(token, JWT_SECRET);
}

async function comparePassword(password, hashedPassword) {
    return bcrypt.compare(password, hashedPassword);
}

async function hashPassword(password) {
    return bcrypt.hash(password, 10);
}


function signToken(user) {
    const payload = {
        sub: user.id,
        email: user.email,
        role: user.role,
        is_active: user.is_active,
    };
    const secret = JWT_SECRET;
    const expiresIn = JWT_EXPIRES_IN;
    return jwt.sign(payload, secret, { expiresIn });
}

module.exports = {
    generateToken,
    verifyToken,
    signToken,
    comparePassword,
    hashPassword,
}